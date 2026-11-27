import {randomUUID} from 'node:crypto';
import {GoogleAuth,OAuth2Client} from 'google-auth-library';
import {db} from './supabase-db.js';
import {checkProjectRead,requireAccounts,requireAdmin,requireProject} from './permissions.js';

const maximumBytes=3*1024*1024;
const mimeTypes={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',pdf:'application/pdf',ies:'application/octet-stream'};
const badRequest=message=>Object.assign(new Error(message),{statusCode:400});
const missing=()=>Object.assign(new Error('Payment proof is unavailable.'),{statusCode:404});

function decodeUpload(payload,{ies=false}={}) {
  const name=String(payload.name||'').replace(/[\/\\]/g,'_').slice(0,150);
  const extension=name.split('.').pop().toLowerCase();
  const accepted=ies?['png','jpg','jpeg','webp','pdf','ies']:['png','jpg','jpeg','webp','pdf'];
  if (!name.includes('.')||!accepted.includes(extension)||
      typeof payload.base64!=='string'||payload.base64.length>Math.ceil(maximumBytes/3)*4||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.base64)) throw badRequest('Choose a valid file under 3 MB.');
  const bytes=Buffer.from(payload.base64,'base64');
  if (!bytes.length||bytes.length>maximumBytes||bytes.toString('base64').replace(/=+$/,'')!==payload.base64.replace(/=+$/,'')) {
    throw badRequest('Choose a valid file under 3 MB.');
  }
  return {name,mimeType:mimeTypes[extension],bytes};
}

function driveId(value) {
  if (!/^[A-Za-z0-9_-]{5,200}$/.test(String(value||''))) throw badRequest('Invalid Google Drive file or folder ID.');
  return encodeURIComponent(value);
}

function oauthSettings(env) {
  return [
    env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
    env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
    env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN
  ].every(Boolean)?[env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN]:
    [env.GOOGLE_DRIVE_CLIENT_ID,env.GOOGLE_DRIVE_CLIENT_SECRET,env.GOOGLE_DRIVE_REFRESH_TOKEN];
}

export const projectsDriveRoot=(env=process.env)=>env.PROJECTS_DRIVE_ROOT_FOLDER_ID||env.GOOGLE_DRIVE_FOLDER_ID||'';

export async function attachmentFolder(files,explicit,env,name) {
  return explicit||files.getOrCreateFolder(projectsDriveRoot(env),name);
}

export function isDriveConfigured(env=process.env) {
  return Boolean(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON ||
    oauthSettings(env).every(Boolean));
}

export function createDriveAttachments({env=process.env,request=fetch,getToken}={}) {
  let auth;
  const accessToken=getToken||async function () {
    if (!isDriveConfigured(env)) throw Error('Google Drive credentials are not configured.');
    if (env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) {
      auth ??= new GoogleAuth({credentials:JSON.parse(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON),scopes:['https://www.googleapis.com/auth/drive']});
      return auth.getAccessToken();
    }
    if (!auth) {
      const [clientId,clientSecret,refreshToken]=oauthSettings(env);
      auth=new OAuth2Client(clientId,clientSecret);
      auth.setCredentials({refresh_token:refreshToken});
    }
    return (await auth.getAccessToken()).token;
  };
  async function send(url,options={}) {
    const token=await accessToken();
    if (!token) throw Error('Google Drive authentication failed.');
    const response=await request(url,{...options,redirect:'error',signal:AbortSignal.timeout(45000),
      headers:{...options.headers,Authorization:'Bearer '+token}});
    if (response.status===404) throw missing();
    if (!response.ok) throw Error('Google Drive could not complete the attachment request.');
    return response;
  }
  async function upload(folder,{name,mimeType,bytes}) {
    driveId(folder);
    const boundary='enlighten-'+randomUUID();
    const metadata=JSON.stringify({name,mimeType,parents:[folder]});
    const body=Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
      bytes,Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    const response=await send('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink',
      {method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
    const file=await response.json();
    driveId(file.id);
    return file;
  }
  async function metadata(id) {
    const url='https://www.googleapis.com/drive/v3/files/'+driveId(id);
    return (await send(url+'?supportsAllDrives=true&fields=id,name,size,trashed,mimeType,parents,createdTime,modifiedTime,webViewLink')).json();
  }
  async function download(id,{limit=maximumBytes,file}={}) {
    const base='https://www.googleapis.com/drive/v3/files/'+driveId(id);
    const info=file||await metadata(id);
    if (info.trashed||!Number.isSafeInteger(Number(info.size))||Number(info.size)>limit||Number(info.size)<1) throw missing();
    const response=await send(base+'?supportsAllDrives=true&alt=media');
    const chunks=[];
    let bytes=0;
    for await (const chunk of response.body) {
      bytes+=chunk.length;
      if (bytes>limit) throw missing();
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  async function within(file,rootId) {
    const visited=new Set([file.id]);
    const remaining=[...(file.parents||[])];
    while (remaining.length&&visited.size<110) {
      const id=remaining.shift();
      if (id===rootId) return true;
      if (visited.has(id)) continue;
      visited.add(id);
      const parent=await metadata(id);
      if (!parent.trashed) remaining.push(...(parent.parents||[]));
    }
    return false;
  }
  async function range(id,start,end,total) {
    const response=await send('https://www.googleapis.com/drive/v3/files/'+driveId(id)+'?supportsAllDrives=true&alt=media',
      {headers:{Range:'bytes='+start+'-'+end}});
    const length=end-start+1;
    if (response.status===206&&response.headers.get('content-range')!=='bytes '+start+'-'+end+'/'+total) throw Error('Drawing download range changed.');
    if (response.status!==206&&(response.status!==200||start!==0||length!==total)) throw Error('Google Drive did not return the requested drawing range.');
    const pieces=[];
    let size=0;
    for await (const piece of response.body) {
      size+=piece.length;
      if (size>length) throw Error('Google Drive returned more data than requested.');
      pieces.push(piece);
    }
    if (size!==length) throw Error('Drawing download could not be confirmed. Retry.');
    return Buffer.concat(pieces);
  }
  async function setTrashed(id,trashed) {
    await send('https://www.googleapis.com/drive/v3/files/'+driveId(id)+'?supportsAllDrives=true',
      {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed})});
  }
  async function createFolder(parent,name) {
    driveId(parent);
    const created=await (await send('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id',
      {method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,parents:[parent],mimeType:'application/vnd.google-apps.folder'})})).json();
    driveId(created.id);
    return created.id;
  }
  async function getOrCreateFolder(parent,name) {
    const existing=await findFolders(parent,[name]);
    if (existing.length>1) throw Error('Multiple matching Google Drive folders. Choose a unique diary folder.');
    if (existing.length===1) return existing[0].id;
    return createFolder(parent,name);
  }
  async function findFolders(parent,names) {
    driveId(parent);
    const quote=value=>String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const matched=names.map(name=>"name = '"+quote(name)+"'").join(' or ');
    const params=new URLSearchParams({q:`'${quote(parent)}' in parents and (${matched}) and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields:'files(id,name),nextPageToken',supportsAllDrives:'true',includeItemsFromAllDrives:'true',pageSize:'100'});
    const existing=await (await send('https://www.googleapis.com/drive/v3/files?'+params)).json();
    if (existing.nextPageToken) throw Error('Too many matching Drive folders.');
    return existing.files||[];
  }
  async function children(parent,{pageToken,foldersOnly=false,pageSize=1000}={}) {
    driveId(parent);
    const filter=foldersOnly?" and mimeType = 'application/vnd.google-apps.folder'":'';
    const params=new URLSearchParams({q:`'${parent}' in parents and trashed = false${filter}`,supportsAllDrives:'true',
      includeItemsFromAllDrives:'true',pageSize:String(pageSize),
      fields:'nextPageToken,files(id,name,size,mimeType,parents,createdTime,modifiedTime,webViewLink)'});
    if (pageToken) params.set('pageToken',pageToken);
    const result=await (await send('https://www.googleapis.com/drive/v3/files?'+params)).json();
    return {files:result.files||[],nextPageToken:result.nextPageToken||null};
  }
  async function copy(id,parent,name) {
    driveId(parent);
    const result=await (await send('https://www.googleapis.com/drive/v3/files/'+driveId(id)+'/copy?supportsAllDrives=true&fields=id,name,size,mimeType',
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,parents:[parent]})})).json();
    driveId(result.id);
    return result;
  }
  async function move(id,{add=[],remove=[]}) {
    for (const parent of [...add,...remove]) driveId(parent);
    const params=new URLSearchParams({supportsAllDrives:'true',fields:'id,parents'});
    if (add.length) params.set('addParents',add.join(','));
    if (remove.length) params.set('removeParents',remove.join(','));
    await send('https://www.googleapis.com/drive/v3/files/'+driveId(id)+'?'+params,
      {method:'PATCH',headers:{'Content-Type':'application/json'},body:'{}'});
  }
  async function startResumable(folder,{name,mimeType,size}) {
    driveId(folder);
    const response=await send('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,size&supportsAllDrives=true',
      {method:'POST',headers:{'Content-Type':'application/json','X-Upload-Content-Type':mimeType,'X-Upload-Content-Length':String(size)},
        body:JSON.stringify({name,parents:[folder]})});
    const sessionUrl=response.headers.get('location');
    if (!sessionUrl) throw Error('Google Drive did not provide a resumable upload session.');
    return {sessionUrl};
  }
  async function spreadsheetInfo(id) {
    const params=new URLSearchParams({fields:'spreadsheetId,sheets(properties(sheetId,title,gridProperties),developerMetadata)'});
    const url='https://sheets.googleapis.com/v4/spreadsheets/'+driveId(id)+'?'+params;
    return (await send(url)).json();
  }

  async function spreadsheetGrid(id,range) {
    const params=new URLSearchParams({ranges:range,fields:'sheets(data(rowData(values(formattedValue,userEnteredValue,note))))'});
    const url='https://sheets.googleapis.com/v4/spreadsheets/'+driveId(id)+'?'+params;
    return (await send(url)).json();
  }
  async function spreadsheetBatch(id,requests) {
    const url='https://sheets.googleapis.com/v4/spreadsheets/'+driveId(id)+':batchUpdate';
    return (await send(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests})})).json();
  }
  async function createSpreadsheet(parent,name) {
    driveId(parent);
    const data=await (await send('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id',
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,parents:[parent],mimeType:'application/vnd.google-apps.spreadsheet'})})).json();
    driveId(data.id);
    return data;
  }
  return {createSpreadsheet,spreadsheetInfo,spreadsheetGrid,spreadsheetBatch,upload,download,trash:id=>setTrashed(id,true),setTrashed,createFolder,getOrCreateFolder,findFolders,children,copy,move,metadata,within,range,startResumable};
}

const drive=createDriveAttachments();

export async function uploadDiaryFile(payload,{files=drive,resolveFolder}) {
  const kind=String(payload.kind||'');
  if (!['photo','document'].includes(kind)) throw badRequest('Choose an attachment type.');
  const input=decodeUpload(payload);
  if (kind==='photo'&&!input.mimeType.startsWith('image/')) throw badRequest('Choose a photo file.');
  const file=await files.upload(await resolveFolder(),input);
  const fileId=encodeURIComponent(file.id);
  return {fileId:file.id,url:kind==='photo'?'https://drive.google.com/thumbnail?id='+fileId+'&sz=w1200':
    file.webViewLink||'https://drive.google.com/open?id='+fileId,name:input.name,kind};
}

export async function diaryAttachmentFolder(projectId,{files=drive,env=process.env}) {
  return files.getOrCreateFolder(env.DIARY_ATTACHMENTS_ROOT_FOLDER_ID||projectsDriveRoot(env),'Project Diary — '+projectId);
}

export async function uploadTechnicalProductAsset(payload,{user,database=db,files=drive,env=process.env}) {
  if (payload.projectId) {
    requireProject(user,String(payload.projectId),{write:true,admin:true});
    await checkProjectRead(database,user,String(payload.projectId));
  } else requireAdmin(user);
  const input=decodeUpload(payload,{ies:true});
  const file=await files.upload(await attachmentFolder(files,env.TECHNICAL_PRODUCT_ASSETS_FOLDER_ID,env,'Technical Product Assets'),input);
  const id=encodeURIComponent(file.id);
  return {id:file.id,url:input.mimeType.startsWith('image/')?'https://drive.google.com/thumbnail?id='+id+'&sz=w1200':
    file.webViewLink||'https://drive.google.com/open?id='+id};
}

async function technicalProject(payload,user,database,write) {
  const id=String(payload.projectId||'');
  requireProject(user,id,{write});
  const rows=await database.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 2",[id]);
  if (rows.length!==1) throw Object.assign(new Error('Project not found.'),{statusCode:404});
  return rows[0].cells;
}

export async function getTechnicalProjectImage(payload,{user,database=db,files=drive}) {
  const project=await technicalProject(payload,user,database,false);
  const fileId=String(payload.fileId||'');
  if (!project.driveFolderId||!fileId) throw badRequest('Choose an image in the linked project folder.');
  const file=await files.metadata(fileId);
  if (file.trashed||!await files.within(file,project.driveFolderId)) {
    throw Object.assign(new Error('Image is outside this project.'),{statusCode:403});
  }
  if (!['image/png','image/jpeg','image/webp'].includes(file.mimeType)) throw badRequest('Choose a PNG, JPEG or WebP image.');
  const bytes=await files.download(fileId,{limit:6*1024*1024,file});
  return {url:'data:'+file.mimeType+';base64,'+bytes.toString('base64')};
}

export async function uploadAccountsTransactionAttachment(payload,{user,database=db,files=drive,env=process.env}) {
  requireAccounts(user,{write:true});
  const transactionId=String(payload.transactionId||'');
  if (!/^[a-zA-Z0-9-]{12,100}$/.test(transactionId)) throw badRequest('Invalid transaction ID.');
  const input=decodeUpload(payload);
  const file=await files.upload(await attachmentFolder(files,env.ACCOUNTS_TRANSACTION_ATTACHMENTS_FOLDER_ID,env,'Accounts Transaction Attachments'),input);
  const id=randomUUID();
  try {
    await database.query(`INSERT INTO enlighten_operational.accounts_transaction_attachments
      (id,transaction_id,file_id,name,mime_type,author) VALUES ($1,$2,$3,$4,$5,$6)`,
    [id,transactionId,file.id,input.name,input.mimeType,user.email]);
  } catch (error) {
    try { await files.trash(file.id); }
    catch (cleanupError) { console.error('Payment attachment cleanup failed',cleanupError.name); }
    throw error;
  }
  return {id,name:input.name};
}

export async function getAccountsTransactionAttachment(payload,{user,database=db,files=drive}) {
  requireAccounts(user);
  const attachment=await database.one('SELECT file_id,name,mime_type FROM enlighten_operational.accounts_transaction_attachments WHERE id=$1',[String(payload.attachmentId||'')]);
  if (!attachment) throw missing();
  const rows=await database.rows("SELECT cells->>'Record JSON' AS record FROM enlighten_operational.accounts_journal WHERE cells->>'Record type'='transaction'");
  const belongsToTransaction=rows.some(row=>{
    try { return JSON.parse(row.record).attachmentId===String(payload.attachmentId); }
    catch { return false; }
  });
  if (!belongsToTransaction) throw missing();
  const bytes=await files.download(attachment.file_id);
  return {name:attachment.name,mimeType:attachment.mime_type,base64:bytes.toString('base64')};
}

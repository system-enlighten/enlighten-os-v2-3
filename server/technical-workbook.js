import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {db} from './supabase-db.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {actor,failure,insertRecord,now,projectChildren,projectRow,text,updateRecord} from './project-write-storage.js';

const defaultTemplate='1QrqBCwyqPAOC9_Z-6J1p1m9RsuSAYv9c7i2KJd9zSZk';

export async function getTechnicalWorkbook(p,{user,database=db,env=process.env}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId);
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const rows=await tx.rows("SELECT cells FROM enlighten_operational.technical_workbooks WHERE cells->>'projectId'=$1 LIMIT 2",[projectId]);
    if (rows.length>1) throw failure('This project already has multiple workbook links.',409);
    const source=rows[0]?JSON.parse(rows[0].cells.dataJson):{};
    return {...settings(env),...source};
  },{readOnly:true});
}

const drive=createDriveAttachments();
const workbookUrl=/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]{5,200})(?:[/?#]|$)/;
const settings=env=>({templateId:env.TECHNICAL_TEMPLATE_ID||defaultTemplate,
  databaseUrl:env.TECHNICAL_DATABASE_URL||'https://docs.google.com/spreadsheets/d/'+defaultTemplate+'/edit'});
async function workbookInfo(files,id) {
  const info=await files.spreadsheetInfo(id);
  const tabs=Object.fromEntries((info.sheets||[]).map(sheet=>[
    text(sheet.properties?.title).toLowerCase(),String(sheet.properties?.sheetId)
  ]));
  if (!Object.hasOwn(tabs,'output')||!Object.hasOwn(tabs,'technical table')) throw failure('Workbook needs Output and Technical Table tabs.');
  return {workbookId:id,tabs};
}

async function changeWorkbook(p,{user,database=db,files=drive,env=process.env},mode) {
  const projectId=text(p.projectId);
  requireProject(user,projectId,{write:true,admin:true});
  const config=settings(env);
  let copied;
  try {
    return await database.transaction(async tx=>{
      const project=await projectRow(tx,projectId);
      if (!project) throw failure('Project not found.',404);
      const rows=await projectChildren(tx,'technical_workbooks',projectId);
      if (rows.length>1) throw failure('This project already has multiple workbook links.',409);
      const old=rows[0],previous=old?JSON.parse(old.cells.dataJson):{};
      if (mode==='create'&&previous.workbookId) return {...config,...previous};
      if (mode==='copy'&&String(previous.workbookId||'')!==String(p.expectedWorkbookId||'')) {
        throw failure('Workbook link changed. Refresh before copying.',409);
      }
      const folder=await previewProjectFolder(project.cells,files,env);
      let id;
      if (mode==='link') {
        id=text(p.url).match(workbookUrl)?.[1];
        if (!id) throw failure('Paste a Google Sheets workbook URL.');
        const source=await files.metadata(id);
        if (source.trashed||!await files.within(source,folder)) throw failure('Choose a workbook in this project folder.',403);
      } else {
        const source=previous.workbookId||config.templateId;
        const metadata=await files.metadata(source);
        if (metadata.trashed||source!==config.templateId&&!await files.within(metadata,folder)) throw failure('The source workbook is outside this project.',403);
        const name='Technical Table - '+[project.cells.projectNo||projectId,project.cells.projectName].filter(Boolean).join(' - ');
        copied=await files.copy(source,folder,name);
        id=copied.id;
      }
      const result=await workbookInfo(files,id),patch={projectId,dataJson:JSON.stringify(result),updatedAt:now(),updatedBy:actor(user)};
      if (old) await updateRecord(tx,'technical_workbooks',old.record_id,patch);
      else await insertRecord(tx,'technical_workbooks',patch);
      return {...config,...result};
    });
  } catch(error) {
    if (copied) await files.trash(copied.id).catch(()=>{});
    throw error;
  }
}

export const saveTechnicalWorkbook=(p,context)=>changeWorkbook(p,context,'link');
export const createTechnicalWorkbook=(p,context)=>changeWorkbook(p,context,'create');
export const copyTechnicalProjectWorkbook=(p,context)=>changeWorkbook(p,context,'copy');

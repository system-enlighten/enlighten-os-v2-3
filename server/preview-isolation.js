const intendedProjectRef='mypofxuvupmrgjqeczmd';
const blockedProjectRef='rxkzjdwldynxcsayvjbm';
const verifiedPoolerHost='aws-0-ap-southeast-2.pooler.supabase.com';
const poolerHostPattern=/^[a-z0-9-]+\.pooler\.supabase\.com$/;
const directHostPattern=/^db\.[a-z0-9]{20}\.supabase\.co$/;

export function parsePreviewDatabaseUrl(value) {
  const url=new URL(value.trim());
  if (!['postgres:','postgresql:'].includes(url.protocol)) return url;
  // PostgreSQL is a non-special WHATWG scheme, so normalize DNS spelling explicitly.
  const host=decodeURIComponent(url.hostname).toLowerCase().replace(/\.$/,'');
  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/.test(host)) url.hostname=host;
  return url;
}

export function operationalPreviewFailures(env=process.env) {
  const failures=[];
  if (env.VERCEL_ENV!=='preview') failures.push('VERCEL_ENV:not-preview');
  if (env.VERCEL_GIT_COMMIT_REF!=='supabase-consolidated') failures.push('VERCEL_GIT_COMMIT_REF:wrong-or-missing');
  for (const key of ['SUPABASE_OPERATIONAL_ACCESS','SUPABASE_DIRECT_OPERATIONAL_READS']) {
    if (env[key]!=='1') failures.push(key+':not-enabled');
  }
  const root=String(env.SUPABASE_PREVIEW_DRIVE_ROOT_ID||'');
  const configuredRoot=env.PROJECTS_DRIVE_ROOT_FOLDER_ID||env.GOOGLE_DRIVE_FOLDER_ID;
  if (!/^[A-Za-z0-9_-]{5,200}$/.test(root)) failures.push('SUPABASE_PREVIEW_DRIVE_ROOT_ID:invalid-or-missing');
  if (root!==configuredRoot) failures.push((env.PROJECTS_DRIVE_ROOT_FOLDER_ID?'PROJECTS_DRIVE_ROOT_FOLDER_ID':'GOOGLE_DRIVE_FOLDER_ID')+':root-mismatch');
  for (const key of ['APP_FEEDBACK_FOLDER_ID','PORTAL_ARCHIVE_FOLDER_ID','DIARY_ATTACHMENTS_ROOT_FOLDER_ID',
    'ACCOUNTS_TRANSACTION_ATTACHMENTS_FOLDER_ID','TECHNICAL_PRODUCT_ASSETS_FOLDER_ID']) {
    if (env[key]&&env[key]!==root) failures.push(key+':root-mismatch');
  }
  const configured=String(env.SUPABASE_PREVIEW_DATABASE_URL||'');
  const ref=String(env.SUPABASE_PREVIEW_PROJECT_REF||'');
  const validRef=/^[a-z0-9]{20}$/.test(ref)&&ref!==blockedProjectRef;
  if (!validRef) failures.push('SUPABASE_PREVIEW_PROJECT_REF:invalid-or-blocked');
  try {
    const url=parsePreviewDatabaseUrl(configured);
    if (!['postgres:','postgresql:'].includes(url.protocol)) failures.push('SUPABASE_PREVIEW_DATABASE_URL:invalid-protocol');
    if (configured.includes(blockedProjectRef)) failures.push('SUPABASE_PREVIEW_DATABASE_URL:blocked-project');
    const pooler=poolerHostPattern.test(url.hostname);
    const direct=directHostPattern.test(url.hostname);
    const username=decodeURIComponent(url.username);
    if (validRef&&!(url.hostname==='db.'+ref+'.supabase.co'||pooler&&username.endsWith('.'+ref))) {
      failures.push('SUPABASE_PREVIEW_DATABASE_URL:project-mismatch');
      if (direct) failures.push('SUPABASE_PREVIEW_DATABASE_URL:direct-host-ref-mismatch');
      else if (pooler) failures.push('SUPABASE_PREVIEW_DATABASE_URL:pooler-username-ref-mismatch');
      else failures.push('SUPABASE_PREVIEW_DATABASE_URL:unrecognized-host');
      if (url.hostname==='db.'+intendedProjectRef+'.supabase.co'||pooler&&username.endsWith('.'+intendedProjectRef)) {
        failures.push('SUPABASE_PREVIEW_DATABASE_URL:matches-intended-project');
        failures.push('SUPABASE_PREVIEW_PROJECT_REF:unexpected-preview-project');
      }
    }
    if (['host','hostaddr','port','user','password','dbname','database','connectionString'].some(key=>url.searchParams.has(key))) {
      failures.push('SUPABASE_PREVIEW_DATABASE_URL:connection-override-parameter');
    }
  } catch {
    failures.push('SUPABASE_PREVIEW_DATABASE_URL:invalid-or-missing');
  }
  return failures;
}

export function isOperationalPreview(env=process.env) {
  return operationalPreviewFailures(env).length===0;
}

export function previewDatabaseRuntimeFacts(env=process.env) {
  const raw=env.SUPABASE_PREVIEW_DATABASE_URL||'';
  const facts={
    uriPresent:Boolean(raw),uriLength:raw.length,outerWhitespace:raw!==raw.trim(),containsWhitespace:/\s/.test(raw),
    legacyUriPresent:Boolean(env.SUPABASE_DATABASE_URL),configuredRefMatchesReview:env.SUPABASE_PREVIEW_PROJECT_REF===intendedProjectRef,
    preview:env.VERCEL_ENV==='preview',expectedBranch:env.VERCEL_GIT_COMMIT_REF==='supabase-consolidated'
  };
  try {
    const url=parsePreviewDatabaseUrl(raw);
    const host=url.hostname;
    const pooler=poolerHostPattern.test(host);
    const direct=directHostPattern.test(host);
    const expectedDirect='db.'+intendedProjectRef+'.supabase.co';
    const username=decodeURIComponent(url.username);
    return {...facts,parseable:true,protocol:['postgres:','postgresql:'].includes(url.protocol)?url.protocol:'other',
      port:url.port||'default',hostname:host===verifiedPoolerHost||host===expectedDirect?host:'withheld',
      hostnameKind:pooler?'pooler':direct?'direct':host.endsWith('.supabase.co')?'other-supabase-co':
        host.endsWith('.supabase.com')?'other-supabase-com':host?'other':'empty',
      hostnameLength:host.length,hostnameAccepted:pooler||direct,hostnameMatchesLocal:host===verifiedPoolerHost,
      usernameMatchesReviewedRef:username.endsWith('.'+intendedProjectRef),
      projectRefMatches:host===('db.'+env.SUPABASE_PREVIEW_PROJECT_REF+'.supabase.co')||
        pooler&&username.endsWith('.'+env.SUPABASE_PREVIEW_PROJECT_REF)};
  } catch {
    return {...facts,parseable:false};
  }
}

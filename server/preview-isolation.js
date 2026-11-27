export function isOperationalPreview(env=process.env) {
  if (env.VERCEL_ENV!=='preview'||env.VERCEL_GIT_COMMIT_REF!=='supabase-consolidated'||
      env.SUPABASE_OPERATIONAL_ACCESS!=='1'||env.SUPABASE_DIRECT_OPERATIONAL_READS!=='1') return false;
  const root=String(env.SUPABASE_PREVIEW_DRIVE_ROOT_ID||'');
  const configuredRoot=env.PROJECTS_DRIVE_ROOT_FOLDER_ID||env.GOOGLE_DRIVE_FOLDER_ID;
  if (!/^[A-Za-z0-9_-]{5,200}$/.test(root)||root!==configuredRoot) return false;
  for (const key of ['APP_FEEDBACK_FOLDER_ID','PORTAL_ARCHIVE_FOLDER_ID','DIARY_ATTACHMENTS_ROOT_FOLDER_ID',
    'ACCOUNTS_TRANSACTION_ATTACHMENTS_FOLDER_ID','TECHNICAL_PRODUCT_ASSETS_FOLDER_ID']) {
    if (env[key]&&env[key]!==root) return false;
  }
  const configured=String(env.SUPABASE_PREVIEW_DATABASE_URL||'');
  const ref=String(env.SUPABASE_PREVIEW_PROJECT_REF||'');
  if (!/^[a-z0-9]{20}$/.test(ref)||ref==='rxkzjdwldynxcsayvjbm') return false;
  try {
    const url=new URL(configured);
    return ['postgres:','postgresql:'].includes(url.protocol)&&!configured.includes('rxkzjdwldynxcsayvjbm')&&
      (url.hostname==='db.'+ref+'.supabase.co'||url.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(url.username).endsWith('.'+ref));
  } catch {
    return false;
  }
}

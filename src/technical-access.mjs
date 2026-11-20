export function canAdministerTechnical(user,projectId){
 const access=String(user?.appAccess||'').trim().toLowerCase();
 const role=String(user?.projectRoles?.[String(projectId)]||'').trim().toLowerCase();
 return !!projectId&&access!=='viewer'&&(access==='admin'||role==='admin');
}

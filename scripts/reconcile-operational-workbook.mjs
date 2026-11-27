import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readAssessmentAndFlagRows} from './sync-assessment-and-mom.mjs';
import {readOperationalWorkbook,readSupplementalBackfill,readTab} from './read-operational-workbook.mjs';

const baseTables=[
  'readme','home_agenda_sessions','studio_briefings','assistant_profiles','studio_attendance_corrections','line_of_work_comments',
  'internal_work_areas','assigned_work_acceptance','assigned_work_comments','studio_attendance','active_time','app_feedback',
  'feedback_attachments','diary_entries','studio_journal','site_execution_items','wih_plans','application_images','studio_threads',
  'studio_thread_comments','project_books','project_closeout','workflow_delegations','email_drawing_intakes','email_intake_messages',
  'project_onboarding','technical_workbooks','technical_tables','technical_table_chunks','technical_fittings','duplicate_drawing_cleanup',
  'drawing_portal_access','issued_drawings','mom_tasks','execution_visits','project_meetings','site_punch_ins','project_roles',
  'drawing_task_master','designations','departments','projects','project_contacts','line_of_work','floor_zones','people','contacts',
  'drawing_register','design_dashboard','design_tasks','wih','work_log','execution','meetings','mom','site_visits','files',
  'activity_log','lookups','accounts_journal'
];
const supplementaryTables=[
  ['LinearApplicationLayout','linear_application_layout','typed'],['LinearApplicationCaptions','linear_application_captions','typed'],
  ['LinearProductLinks','linear_product_links','typed'],['Chart of Accounts','accounts_chart','typed'],
  ['AccountsReceiptDrafts','accounts_receipt_drafts','typed'],['TechnicalDocumentation','technical_documentation','cells'],
  ['TechnicalDocumentationChunks','technical_documentation_chunks','cells'],['MomVisitPoints','mom_visit_points','cells'],
  ['MomDiscussionFlags','mom_discussion_flags','typed'],['ProductAssessments','product_assessments','typed'],
  ['ProductAssessmentChunks','product_assessment_chunks','typed']
];
const key=title=>title.toLowerCase().replace(/[^a-z0-9]/g,'');
const known=new Map([...baseTables.map(table=>[key(table),{table,format:'cells'}]),
  ...supplementaryTables.map(([title,table,format])=>[key(title),{table,format}])]);

export function inspectOperationalWorkbook(book) {
  const names=new Set();
  const tabs=book.SheetNames.map(title=>{
    const destination=known.get(key(title));
    if (!destination) throw Error('Unmapped operational workbook tab '+title+'.');
    if (names.has(destination.table)) throw Error('Duplicate destination for '+title+'.');
    names.add(destination.table);
    return {title,...destination,rows:readTab(book,title).length};
  });
  const supplemental=readSupplementalBackfill(book);
  const added=readAssessmentAndFlagRows(book);
  const extraSources=['Payroll Machine Attendance','StudioLeaveRequests','ProjectContracts','AccountsTransactionAttachments',
    'ArchitecturalLightingMilestones','MomPointPhotos'].filter(title=>!Object.hasOwn(book.Sheets,title));
  return {tabs,totalRows:tabs.reduce((sum,tab)=>sum+tab.rows,0),extraSources,
    supplemental:{assessments:added.assessments.length,assessmentChunks:added.chunks.length,momDiscussionFlags:added.flags.length,accountsChart:supplemental.accountsChart.length,linearLayout:Number(Boolean(supplemental.linearLayout)),
      linearCaptions:supplemental.linearCaptions.length,linearLinks:supplemental.linearLinks.length,momPoints:supplemental.momPoints.length}};
}

if (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const path=process.argv[2];
    if (!path) throw Error('Provide the path to the operational workbook export.');
    const workbook=readOperationalWorkbook(path);
    const sha256=createHash('sha256').update(readFileSync(path)).digest('hex');
    console.log(JSON.stringify({sha256,...inspectOperationalWorkbook(workbook)},null,2));
  } catch (error) {
    console.error(error.message);
    process.exitCode=1;
  }
}

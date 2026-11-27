# Supabase action checklist

The original `route_` dispatcher contains 220 API actions. 220 have local Supabase preview handlers. Each action needs tests through its normal entry point before cutover.

## Frontend actions outside the supplied dispatcher

The frontend contracts and GitHub file history were checked. The modules below implement the current payloads and response shapes. The current workbook contains a saved linear layout and 52 caption rows and its product-link tab is empty. The layout and caption rows were validated in a local PostgreSQL instance. The Chart of Accounts tab must be backfilled before Accounts is enabled.

| API action | Frontend caller | Supabase implementation |
| --- | --- | --- |
| `deleteAccountsInvoice` | `src/Accounts.jsx` | `server/accounts-journal.js` |
| `editDesignTransaction` | `src/DesignTransactions.jsx` | `server/accounts-journal.js` |
| `getLinearApplicationLayout` | `src/LinearLightLineup.jsx` | `server/linear-applications.js` |
| `listLinearProductLinks` | `src/LinearLightLineup.jsx` | `server/linear-applications.js` |
| `saveLinearApplicationLayout` | `src/LinearLightLineup.jsx` | `server/linear-applications.js` |
| `saveLinearProductLink` | `src/LinearLightLineup.jsx` | `server/linear-applications.js` |

## Apps Script dispatcher

### Batch 1 checkpoint

Projects, project contacts and Floor Zones writes now use PostgreSQL transactions. Embedded PostgreSQL covered ID allocation, contacts, zones, completion/reopening, and legacy cascade deletion. Mock Drive covered folder provisioning and cleanup. End-to-end credential validation is deferred.

### Workbook reconciliation

The read-only scripts/reconcile-operational-workbook.mjs command inventories every tab and reports supplemental sources and totals without contacting PostgreSQL.

The reconciliation inventory accounts for 20,919 source rows across 71 tabs. Product Assessments, Product Assessment Chunks and MOM Discussion Flags have a transaction-based synchronizer with dry-run as the default. The synchronizer preserves keys and versions, validates destination parent records, accepts identical retries, and aborts on existing records with different content. The full workbook synchronizer in scripts/sync-operational-workbook.mjs defaults to dry-run and applies all mapped tabs in one transaction. Validate legacy project references reported by the dry run and resolve differences against the existing seed before a cutover. Destination-only records are retained.

The current export contains 198 historical references to project IDs absent from Projects. Counts are Drawing Register 9, Design Dashboard 6, Design Tasks 13, WIH 13, Work Log 1, Files 11, and Activity Log 145. The synchronizer keeps the source IDs and reports these counts. Resolve any required parent links from an authoritative archive before publishing affected history.

### Preview integrations

Email intake submission requires the branch Preview Gmail intake mailbox OAuth configuration. MOM follow-up requires separate Gmail send OAuth configuration. Validate both with dedicated Preview accounts and a test recipient. The legacy mailbox polling and ingestion job is independent of the API submission handler and still needs replacement before retiring Apps Script.

### Accounts and Preview validation

Reconcile historical Architectural Lighting sign-offs, outstanding WhatsApp receipt drafts, and imported receipt attachments before enabling those routes. Check legacy fiscal-year invoice sequence minimums against the highest migrated document numbers. Branch Preview must verify OAuth token refresh and attachment access within the configured Google Drive root.

### Drawings and workflow checkpoint

Directory drawing grants, contractor issue lists and ranges, issue context, copy/publish/withdraw, Base and Output uploads, and Received metadata edits have native handlers. Received registration and classification create drawing work and repair stage coverage. Dashboard and WIH reads restore legacy workflow state. Workflow subtasks and schedules, onboarding, delegation, Line of Work edits, and WIH planning use PostgreSQL transactions. WIH assignment, drawing acknowledgment, timer start/pause/resume, and optional subtask skipping preserve the linked task state. Task and checklist completion update timers, Dashboard status, predecessors, and audit history. Architectural Lighting sign-off verifies Wiring and Documentation coverage. Line of Work queueing and execution visit plan writes have native handlers.

Closeout, historical meetings, the workflow workspace, personal availability, and Drive folder management have native handlers. Keep production Drive outside the configured preview root.

Payroll routing requires confirmation of the machine-punch backfill. Accounts routes require verification of the matching journal and supporting tables. Preview Drive validation requires a service account with access to designated test folders. Keep unrelated legacy routes out of those preview write tests until their handlers have been migrated.

The original seed only covers the November 18 Sheets export. The current workbook contains 71 tabs, including 11 absent from the seed. The Accounts Journal grew from 21 to 3,137 rows. A current snapshot must be reconciled before enabling any module against its operational tables. This workbook has no Payroll Machine Attendance, StudioLeaveRequests, ProjectContracts or AccountsTransactionAttachments tab.

| API action | Apps Script handler | Supabase implementation |
| --- | --- | --- |
| `createLuminaireInvitation` | LuminaireEquivalents.gs · `createLuminaireInvitation_` | Preview · `server/luminaire-equivalents.js` |
| `listLuminaireEquivalentOffers` | LuminaireEquivalents.gs · `listLuminaireEquivalentOffers_` | Preview · `server/luminaire-equivalents.js` |
| `getVendorLuminaireItem` | LuminaireEquivalents.gs · `vendorLuminaireEquivalent_` | Preview · `server/luminaire-equivalents.js` |
| `submitVendorLuminaireOffer` | LuminaireEquivalents.gs · `vendorLuminaireEquivalent_` | Preview · `server/luminaire-equivalents.js` |
| `getMomVisitPoints` | MomPoints.gs · `getMomVisitPoints_` | Preview · `server/project-visits.js` |
| `getMomPointCircuits` | MomPoints.gs · `getMomPointCircuits_` | Preview · `server/site-execution.js` |
| `uploadMomPointPhoto` | MomPoints.gs · `uploadMomPointPhoto_` | Preview · `server/mom-point-photos.js` |
| `getSalesWorkspace` | Marketing.gs · `salesWorkspace_` | Preview · `server/marketing.js` |
| `saveSalesRecord` | Marketing.gs · `saveSalesRecord_` | Preview · `server/marketing.js` |
| `getMarketingWorkspace` | Marketing.gs · `marketingWorkspace_` | Preview · `server/marketing.js` |
| `saveMarketingRecord` | Marketing.gs · `saveMarketingRecord_` | Preview · `server/marketing.js` |
| `getAccounts` | Accounts.gs · `accountsData_` | Preview · `server/accounts-journal.js` |
| `getPayrollMachineAttendance` | PayrollAttendance.gs · `getPayrollMachineAttendance_` | Preview · `server/payroll.js` |
| `importPayrollMachineAttendance` | PayrollAttendance.gs · `importPayrollMachineAttendance_` | Preview · `server/payroll.js` |
| `getAccountsAttendance` | Accounts.gs · `accountsAttendance_` | Preview · `server/attendance-day.js` |
| `saveAccountsHead` | Accounts.gs · `accountsSaveHead_` | Preview · `server/accounts-journal.js` |
| `saveAccounts` | Accounts.gs · `accountsSave_` | Preview · `server/accounts-journal.js` |
| `importAccountsStatement` | AccountsReconciliation.gs · `accountsImportStatement_` | Preview · `server/accounts-journal.js` |
| `getPaymentReceiptAccess` | Code.gs (inline) | Preview · `server/accounts-receipt-drafts.js` |
| `claimPaymentReceiptDraft` | AccountsReceiptDrafts.gs · `claimPaymentReceiptDraft_` | Preview · `server/accounts-receipt-drafts.js` |
| `finishPaymentReceiptDraft` | AccountsReceiptDrafts.gs · `finishPaymentReceiptDraft_` | Preview · `server/accounts-receipt-drafts.js` |
| `listPaymentReceiptDrafts` | AccountsReceiptDrafts.gs · `listPaymentReceiptDrafts_` | Preview · `server/accounts-receipt-drafts.js` |
| `getPaymentReceiptDraft` | AccountsReceiptDrafts.gs · `getPaymentReceiptDraft_` | Preview · `server/accounts-receipt-drafts.js` |
| `deleteDesignTransaction` | AccountsTransactions.gs · `deleteDesignTransaction_` | Preview · `server/accounts-journal.js` |
| `importDesignTransactions` | AccountsTransactions.gs · `importDesignTransactions_` | Preview · `server/accounts-journal.js` |
| `uploadAccountsTransactionAttachment` | AccountsTransactions.gs · `uploadAccountsTransactionAttachment_` | Preview · `server/drive-attachments.js` |
| `getAccountsTransactionAttachment` | AccountsTransactions.gs · `getAccountsTransactionAttachment_` | Preview · `server/drive-attachments.js` |
| `deleteExecutionVisit` | Code.gs · `deleteExecutionVisit_` | Preview · `server/project-visits.js` |
| `reportingAssignment` | Code.gs · `reportingAssignment_` | Preview · `server/design-task-actions.js` |
| `assignedWorkThread` | Code.gs · `assignedWorkThread_` | Preview · `server/assigned-work-thread.js` |
| `getStudioDay` | Code.gs · `getStudioDay_` | Preview · `server/attendance-day.js` |
| `saveStudioDay` | Code.gs · `saveStudioDay_` | Preview · `server/attendance-day.js` |
| `logActiveTime` | Code.gs · `logActiveTime_` | Preview · `server/active-time.js` |
| `listActiveTime` | Code.gs · `listActiveTime_` | Preview · `server/active-time.js` |
| `listMomTasks` | Code.gs · `listMomTasks_` | Preview · `server/project-visits.js` |
| `momDiscussion` | Code.gs · `momDiscussion_` | Preview · `server/mom-discussion.js` |
| `sendMomFollowup` | Code.gs · `sendMomFollowup_` | Preview · `server/mom-action-writes.js` |
| `updateMomTask` | Code.gs · `updateMomTask_` | Preview · `server/mom-action-writes.js` |
| `importMomTasks` | Code.gs · `importMomTasks_` | Preview · `server/mom-action-writes.js` |
| `getVisitMomContext` | Code.gs · `getVisitMomContext_` | Preview · `server/project-visits.js` |
| `listExecutionVisits` | Code.gs · `listExecutionVisits_` | Preview · `server/project-visits.js` |
| `saveExecutionVisits` | Code.gs · `saveExecutionVisits_` | Preview · `server/project-visits.js` |
| `recordExecutionVisit` | Code.gs · `recordExecutionVisit_` | Preview · `server/mom-action-writes.js` |
| `getCurrentUser` | Code.gs · `getCurrentUser_` | Preview · `server/permissions.js` |
| `getProjectWorkspace` | Code.gs · `getProjectWorkspace_` | Preview · `server/bootstrap-operational.js` |
| `saveProjectMeeting` | Code.gs · `saveProjectMeeting_` | Preview · `server/meeting-and-punch-writes.js` |
| `saveActualMeetingTimes` | Code.gs · `saveActualMeetingTimes_` | Preview · `server/meeting-and-punch-writes.js` |
| `deleteProjectMeeting` | Code.gs · `deleteProjectMeeting_` | Preview · `server/meeting-and-punch-writes.js` |
| `getProjectWorkflowTasks` | Code.gs · `getProjectWorkflowTasks_` | Preview · `server/workflow-management.js` |
| `updateWorkflowSchedule` | Code.gs · `updateWorkflowSchedule_` | Preview · `server/workflow-management.js` |
| `listProjectRoles` | Code.gs · `listProjectRoles_` | Preview · `server/project-access-reads.js` |
| `saveProjectRole` | Code.gs · `saveProjectRole_` | Preview · `server/project-access-writes.js` |
| `saveMemberProjectRoles` | Code.gs · `saveMemberProjectRoles_` | Preview · `server/project-access-writes.js` |
| `deleteProjectRole` | Code.gs · `deleteProjectRole_` | Preview · `server/project-access-writes.js` |
| `listProjectPeople` | Code.gs · `listProjectPeople_` | Preview · `server/project-access-reads.js` |
| `listSitePunchIns` | Code.gs · `listSitePunchIns_` | Preview · `server/project-visits.js` |
| `saveSitePunchIn` | Code.gs · `saveSitePunchIn_` | Preview · `server/meeting-and-punch-writes.js` |
| `deleteSitePunchIn` | Code.gs · `deleteSitePunchIn_` | Preview · `server/meeting-and-punch-writes.js` |
| `health` | Code.gs · `health_` | Preview · `server/operational-access.js` |
| `bootstrap` | Code.gs · `getBootstrap_` | Preview · `server/bootstrap-operational.js` |
| `listProjects` | Code.gs · `listProjects_` | Preview · `server/projects-operational.js` |
| `listProjectContacts` | Code.gs · `listProjectContacts_` | Preview · `server/directory-operational.js` |
| `listLineOfWork` | Code.gs · `listLineOfWork_` | Preview · `server/workflow-operational.js` |
| `getWorkflowCapabilities` | Code.gs (inline) | Preview · `server/bootstrap-operational.js` |
| `listFloorZones` | Code.gs · `listFloorZones_` | Preview · `server/floor-zones-operational.js` |
| `listTeamMembers` | Code.gs · `listTeamMembers_` | Preview · `server/project-access-reads.js` |
| `getTeamsTasksScope` | Code.gs · `getTeamsTasksScope_` | Preview · `server/operational-access.js` |
| `prepareDiaryMom` | DiaryTimeline.gs · `prepareDiaryMom_` | Preview · `server/diary-media.js` |
| `getLegalContracts` | AccountsWorkflow.gs · `getLegalContracts_` | Preview · `server/accounts-journal.js` |
| `saveLegalContract` | AccountsWorkflow.gs · `saveLegalContract_` | Preview · `server/accounts-journal.js` |
| `getProjectRecords` | ProjectRecords.gs · `getProjectRecords_` | Preview · `server/project-diary.js` |
| `getPersonalCalendar` | PersonalCalendar.gs · `getPersonalCalendar_` | Preview · `server/wih-calendar.js` |
| `savePersonalCalendarBlock` | PersonalCalendar.gs · `savePersonalCalendarBlock_` | Preview · `server/wih-calendar.js` |
| `getProjectDiary` | Code.gs · `getProjectDiary_` | Preview · `server/project-diary.js` |
| `uploadFeedbackAttachment` | Feedback.gs · `uploadFeedbackAttachment_` | Preview · `server/app-feedback.js` |
| `submitAppFeedback` | Feedback.gs · `submitAppFeedback_` | Preview · `server/app-feedback.js` |
| `listAppFeedback` | Feedback.gs · `listAppFeedback_` | Preview · `server/app-feedback.js` |
| `getFeedbackAttachment` | Feedback.gs · `getFeedbackAttachment_` | Preview · `server/app-feedback.js` |
| `reviewAppFeedback` | Feedback.gs · `reviewAppFeedback_` | Preview · `server/app-feedback.js` |
| `saveDiaryEntry` | DiaryTimeline.gs · `saveDiaryEntry_` | Preview · `server/project-diary.js` |
| `getDiaryPhotos` | DiaryMedia.gs · `getDiaryPhotos_` | Preview · `server/diary-media.js` |
| `getDiaryPhotoData` | DiaryMedia.gs · `getDiaryPhotoData_` | Preview · `server/diary-media.js` |
| `getDiaryRecordings` | DiaryMedia.gs · `getDiaryRecordings_` | Preview · `server/diary-media.js` |
| `getDiaryRecordingAudio` | DiaryMedia.gs · `getDiaryRecordingAudio_` | Preview · `server/diary-media.js` |
| `getDiaryRecordingContext` | DiaryMedia.gs · `getDiaryRecordingContext_` | Preview · `server/diary-media.js` |
| `uploadDiaryRecordingChunk` | DiaryMedia.gs · `uploadDiaryRecordingChunk_` | Preview · `server/diary-media.js` |
| `saveDiaryTranscriptChunk` | DiaryMedia.gs · `saveDiaryTranscriptChunk_` | Preview · `server/diary-media.js` |
| `uploadDiaryAttachment` | DiaryTimeline.gs · `uploadDiaryAttachment_` | Preview · `server/project-diary.js` |
| `getSiteExecution` | SiteExecution.gs · `getSiteExecution_` | Preview · `server/site-execution.js` |
| `saveSiteExecutionItem` | SiteExecution.gs · `saveSiteExecutionItem_` | Preview · `server/site-execution.js` |
| `uploadSiteExecutionPhoto` | SiteExecution.gs · `uploadSiteExecutionPhoto_` | Preview · `server/site-execution.js` |
| `listStudioThreads` | Threads.gs · `listStudioThreads_` | Preview · `server/studio-threads.js` |
| `saveStudioThread` | Threads.gs · `saveStudioThread_` | Preview · `server/studio-threads.js` |
| `addStudioThreadComment` | Threads.gs · `addStudioThreadComment_` | Preview · `server/studio-threads.js` |
| `getProjectBook` | ProjectBooks.gs · `getProjectBook_` | Preview · `server/studio-journal.js` |
| `getStudioJournal` | StudioJournal.gs · `getStudioJournal_` | Preview · `server/studio-journal.js` |
| `saveStudioJournal` | StudioJournal.gs · `saveStudioJournal_` | Preview · `server/studio-journal.js` |
| `getProjectBookContext` | ProjectBooks.gs · `getProjectBookContext_` | Preview · `server/studio-journal.js` |
| `saveProjectBook` | ProjectBooks.gs · `saveProjectBook_` | Preview · `server/studio-journal.js` |
| `listDepartments` | Code.gs · `listDepartments_` | Preview · `server/bootstrap-operational.js` |
| `listDesignations` | Code.gs · `listDesignations_` | Preview · `server/bootstrap-operational.js` |
| `listDrawingTaskMaster` | Code.gs · `listDrawingTaskMaster_` | Preview · `server/bootstrap-operational.js` |
| `createProject` | Code.gs · `createProject_` | Preview · `server/project-writes.js` |
| `updateProject` | Code.gs · `updateProject_` | Preview · `server/project-writes.js` |
| `deleteProject` | Code.gs · `deleteProject_` | Preview · `server/project-writes.js` |
| `saveProjectContacts` | Code.gs · `saveProjectContacts_` | Preview · `server/project-location-writes.js` |
| `saveLineOfWork` | Code.gs · `saveLineOfWork_` | Preview · `server/workflow-management.js` |
| `queueWorkflowTask` | Code.gs · `queueWorkflowTask_` | Preview · `server/workflow-queue.js` |
| `acknowledgeWorkflowDrawing` | Code.gs · `acknowledgeWorkflowDrawing_` | Preview · `server/design-task-actions.js` |
| `skipWorkflowSubtask` | Code.gs · `skipWorkflowSubtask_` | Preview · `server/wih-timers.js` |
| `deleteFloorZones` | Code.gs · `deleteFloorZones_` | Preview · `server/project-location-writes.js` |
| `saveFloorZones` | Code.gs · `saveFloorZones_` | Preview · `server/project-location-writes.js` |
| `saveTeamMember` | Code.gs · `saveTeamMember_` | Preview · `server/team-settings.js` |
| `deleteTeamMember` | Code.gs · `deleteTeamMember_` | Preview · `server/team-settings.js` |
| `deleteDepartment` | Code.gs · `deleteDepartment_` | Preview · `server/team-settings.js` |
| `saveDepartment` | Code.gs · `saveMasterItem_` | Preview · `server/team-settings.js` |
| `saveDesignation` | Code.gs · `saveMasterItem_` | Preview · `server/team-settings.js` |
| `saveDrawingTaskMaster` | Code.gs · `saveDrawingTaskMaster_` | Preview · `server/team-settings.js` |
| `completeProject` | Code.gs · `completeProject_` | Preview · `server/project-writes.js` |
| `getDesignDashboard` | Code.gs · `getDesignDashboard_` | Preview · `server/design-workspace.js` |
| `getDriveLibraryConfig` | Code.gs · `getDriveLibraryConfig_` | Preview · `server/project-drive.js` |
| `setDriveLibraryRoot` | Code.gs · `setDriveLibraryRoot_` | Preview · `server/project-drive.js` |
| `linkProjectDrive` | Code.gs · `linkProjectDrive_` | Preview · `server/project-drive.js` |
| `getProjectCloseout` | Closeout.gs · `getProjectCloseout_` | Preview · `server/project-closeout.js` |
| `saveProjectCloseout` | Closeout.gs · `saveProjectCloseout_` | Preview · `server/project-closeout.js` |
| `beginCloseoutUpload` | Closeout.gs · `beginCloseoutUpload_` | Preview · `server/project-closeout.js` |
| `finishCloseoutUpload` | Closeout.gs · `finishCloseoutUpload_` | Preview · `server/project-closeout.js` |
| `completeProjectCloseout` | Closeout.gs · `completeProjectCloseout_` | Preview · `server/project-closeout.js` |
| `getWorkflowWorkspace` | Code.gs · `getWorkflowWorkspace_` | Preview · `server/workflow-workspace.js` |
| `getWorkflowDelegation` | Delegation.gs · `getWorkflowDelegation_` | Preview · `server/workflow-operational.js` |
| `saveWorkflowDelegation` | Delegation.gs · `saveWorkflowDelegation_` | Preview · `server/workflow-management.js` |
| `listEmailDrawingIntakes` | EmailIntake.gs · `listEmailDrawingIntakes_` | Preview · `server/email-intake.js` |
| `getEmailIntakeOptions` | EmailIntake.gs · `getEmailIntakeOptions_` | Preview · `server/email-intake.js` |
| `submitEmailIntake` | EmailIntake.gs · `submitEmailIntake_` | Preview · `server/email-intake.js` |
| `cancelEmailIntake` | EmailIntake.gs · `cancelEmailIntake_` | Preview · `server/email-intake.js` |
| `getProjectOnboarding` | Code.gs · `getProjectOnboarding_` | Preview · `server/workflow-management.js` |
| `saveProjectOnboarding` | Code.gs · `saveProjectOnboarding_` | Preview · `server/workflow-management.js` |
| `getTechnicalWorkbook` | Code.gs · `getTechnicalWorkbook_` | Preview · `server/technical-workbook.js` |
| `uploadTechnicalFixtureImage` | TechnicalDocumentation.gs · `uploadTechnicalFixtureImage_` | Preview · `server/project-file-uploads.js` |
| `createTechnicalSheetExport` | TechnicalSheetsExport.gs · `createTechnicalSheetExport_` | Preview · `server/technical-sheet-export.js` |
| `addTechnicalSheetImages` | TechnicalSheetsExport.gs · `addTechnicalSheetImages_` | Preview · `server/technical-sheet-export.js` |
| `finishTechnicalSheetExport` | TechnicalSheetsExport.gs · `finishTechnicalSheetExport_` | Preview · `server/technical-sheet-export.js` |
| `getTechnicalSheetExport` | TechnicalSheetsExport.gs · `getTechnicalSheetExport_` | Preview · `server/technical-sheet-export.js` |
| `getTechnicalProjectImage` | TechnicalDocumentation.gs · `getTechnicalProjectImage_` | Preview · `server/drive-attachments.js` |
| `getProductAssessment` | ProductAssessment.gs · `getProductAssessment_` | Preview · `server/product-assessments.js` |
| `listProductAssessmentReviews` | ProductAssessment.gs · `listProductAssessmentReviews_` | Preview · `server/product-assessments.js` |
| `getProductWorkflow` | ProductWorkflow.gs · `getProductWorkflow_` | Preview · `server/product-workflow.js` |
| `saveProductPartnerHistory` | ProductWorkflow.gs · `saveProductPartnerHistory_` | Preview · `server/product-workflow.js` |
| `saveProductWorkflowDraft` | ProductWorkflow.gs · `saveProductWorkflowDraft_` | Preview · `server/product-workflow.js` |
| `saveProductAssessment` | ProductAssessment.gs · `saveProductAssessment_` | Preview · `server/product-assessments.js` |
| `getTechnicalDocumentation` | TechnicalDocumentation.gs · `getTechnicalDocumentation_` | Preview · `server/technical-documentation.js` |
| `saveTechnicalDocumentation` | TechnicalDocumentation.gs · `saveTechnicalDocumentation_` | Preview · `server/technical-documentation.js` |
| `getNativeTechnicalTable` | NativeTechnical.gs · `getNativeTechnicalTable_` | Preview · `server/native-technical.js` |
| `importTechnicalOutput` | NativeTechnical.gs · `importTechnicalOutput_` | Preview · `server/native-technical.js` |
| `copyTechnicalProjectWorkbook` | NativeTechnical.gs · `copyTechnicalProjectWorkbook_` | Preview · `server/technical-workbook.js` |
| `getScheduleSpecSheet` | Code.gs · `getScheduleSpecSheet_` | Preview · `server/native-technical.js` |
| `saveTechnicalWorkbook` | Code.gs · `saveTechnicalWorkbook_` | Preview · `server/technical-workbook.js` |
| `createTechnicalWorkbook` | Code.gs · `createTechnicalWorkbook_` | Preview · `server/technical-workbook.js` |
| `listTechnicalTables` | Code.gs · `listTechnicalTables_` | Preview · `server/technical-tables.js` |
| `getTechnicalTable` | Code.gs · `getTechnicalTable_` | Preview · `server/technical-tables.js` |
| `saveTechnicalTable` | Code.gs · `saveTechnicalTable_` | Preview · `server/technical-tables.js` |
| `getLinearApplicationCaptions` | Code.gs · `getLinearApplicationCaptions_` | Preview · `server/linear-applications.js` |
| `saveLinearApplicationCaption` | Code.gs · `saveLinearApplicationCaption_` | Preview · `server/linear-applications.js` |
| `deleteTechnicalFitting` | Code.gs · `deleteTechnicalFitting_` | Preview · `server/technical-catalogue.js` |
| `listTechnicalFittings` | Code.gs · `listTechnicalFittings_` | Preview · `server/technical-tables.js` |
| `saveTechnicalFitting` | Code.gs · `saveTechnicalFitting_` | Preview · `server/technical-catalogue.js` |
| `uploadTechnicalProductAsset` | Code.gs · `uploadTechnicalProductAsset_` | Preview · `server/drive-attachments.js` |
| `listApplicationImages` | Code.gs · `listApplicationImages_` | Preview · `server/technical-catalogue.js` |
| `saveApplicationImage` | Code.gs · `saveApplicationImage_` | Preview · `server/technical-catalogue.js` |
| `getProductImportAccess` | Code.gs (inline) | Preview · `server/operational-access.js` |
| `getCadSource` | Code.gs · `getCadSource_` | Preview · `server/cad-source.js` |
| `getCadSourceChunk` | Code.gs · `getCadSourceChunk_` | Preview · `server/cad-source.js` |
| `getCadSourceTransfer` | Code.gs · `getCadSourceTransfer_` | Preview · `server/cad-source.js` |
| `listProjectDrive` | Code.gs · `listProjectDrive_` | Preview · `server/project-drive.js` |
| `getDrawingPortal` | Code.gs · `getDrawingPortal_` | Preview · `server/drawing-portal.js` |
| `getPortalDrawingChunk` | Code.gs · `getPortalDrawingChunk_` | Preview · `server/drawing-portal.js` |
| `getDirectoryDrawingAccess` | Code.gs · `getDirectoryDrawingAccess_` | Preview · `server/drawing-portal.js` |
| `saveDirectoryDrawingAccess` | Code.gs · `saveDirectoryDrawingAccess_` | Preview · `server/drawing-portal.js` |
| `getIssueDrawingContext` | Code.gs · `getIssueDrawingContext_` | Preview · `server/drawing-issue-context.js` |
| `publishPortalDrawing` | Code.gs · `publishPortalDrawing_` | Preview · `server/drawing-publishing.js` |
| `trashProjectDrawing` | Code.gs · `trashProjectDrawing_` | Preview · `server/drawing-publishing.js` |
| `editReceivedDrawing` | Code.gs · `editReceivedDrawing_` | Preview · `server/received-edit.js` |
| `organizeProjectReceived` | Code.gs · `organizeProjectReceived_` | Preview · `server/project-drive.js` |
| `saveWihPlan` | Code.gs · `saveWihPlan_` | Preview · `server/wih-calendar.js` |
| `beginPastWorkUpload` | Code.gs · `beginPastWorkUpload_` | Preview · `server/project-file-uploads.js` |
| `finishPastWorkUpload` | Code.gs · `finishPastWorkUpload_` | Preview · `server/project-file-uploads.js` |
| `beginBaseDrawingUpload` | Code.gs · `beginBaseDrawingUpload_` | Preview · `server/drawing-uploads.js` |
| `beginWorkDrawingUpload` | Code.gs · `beginBaseDrawingUpload_` | Preview · `server/drawing-uploads.js` |
| `finishWorkDrawingUpload` | Code.gs · `finishBaseDrawingUpload_` | Preview · `server/drawing-uploads.js` |
| `finishBaseDrawingUpload` | Code.gs · `finishBaseDrawingUpload_` | Preview · `server/drawing-uploads.js` |
| `listRecentDrawingRegister` | Code.gs · `listRecentDrawingRegister_` | Preview · `server/drawings-operational.js` |
| `listDrawingRegister` | Code.gs · `listDrawingRegister_` | Preview · `server/drawings-operational.js` |
| `receiveDrawing` | Code.gs · `receiveDrawing_` | Preview · `server/received-uploads.js` |
| `beginReceivedUpload` | Code.gs · `beginReceivedUpload_` | Preview · `server/received-uploads.js` |
| `finishReceivedUpload` | Code.gs · `finishReceivedUpload_` | Preview · `server/received-uploads.js` |
| `receiveAndClassifyDrawing` | Code.gs · `receiveAndClassifyDrawing_` | Preview · `server/received-uploads.js` |
| `classifyReceivedDrawing` | Code.gs · `classifyReceivedDrawing_` | Preview · `server/drawing-classification.js` |
| `getWIH` | Code.gs · `getWIH_` | Preview · `server/design-workspace.js` |
| `consolidateOpenDrawingTasks` | Code.gs · `consolidateOpenDrawingTasks_` | Preview · `server/wih-recovery.js` |
| `reconcileWihProject` | Code.gs · `reconcileWihProject_` | Preview · `server/wih-recovery.js` |
| `assignDesignTask` | Code.gs · `assignDesignTask_` | Preview · `server/design-task-actions.js` |
| `internalAreas` | Code.gs · `internalAreas_` | Preview · `server/studio-settings.js` |
| `departmentTeam` | Code.gs · `departmentTeam_` | Preview · `server/studio-settings.js` |
| `teamAvailability` | Code.gs · `teamAvailability_` | Preview · `server/attendance-day.js` |
| `attendanceDay` | Code.gs · `attendanceDay_` | Preview · `server/attendance-history.js` |
| `homeAgenda` | Code.gs · `homeAgenda_` | Preview · `server/home-agenda.js` |
| `assistantProfile` | Code.gs · `assistantProfile_` | Preview · `server/studio-settings.js` |
| `studioBriefing` | Code.gs · `studioBriefing_` | Preview · `server/studio-briefing.js` |
| `assistantWork` | Code.gs · `assistantWork_` | Preview · `server/assistant-work.js` |
| `createTaskRevisions` | TaskRevisions.gs · `createTaskRevisions_` | Preview · `server/task-revisions.js` |
| `sharedWorkSession` | TaskRevisions.gs · `sharedWorkSession_` | Preview · `server/task-revisions.js` |
| `startTask` | Code.gs · `startTask_` | Preview · `server/wih-timers.js` |
| `pauseTask` | Code.gs · `pauseTask_` | Preview · `server/wih-timers.js` |
| `resumeTask` | Code.gs · `resumeTask_` | Preview · `server/wih-timers.js` |
| `completeTask` | Code.gs · `completeTask_` | Preview · `server/task-completion.js` |
| `recordHistoricalWorkflowMeeting` | Code.gs · `recordHistoricalWorkflowMeeting_` | Preview · `server/workflow-workspace.js` |
| `completeWorkflowChecklist` | Code.gs · `completeWorkflowChecklist_` | Preview · `server/task-completion.js` |
| `architecturalLightingMilestone` | Code.gs · `architecturalLightingMilestone_` | Preview · `server/architectural-lighting.js` |
| `completeDashboardWork` | Code.gs · `completeDashboardWork_` | Preview · `server/task-completion.js` |
| `uploadFile` | Code.gs · `uploadFile_` | Preview · `server/project-file-uploads.js` |

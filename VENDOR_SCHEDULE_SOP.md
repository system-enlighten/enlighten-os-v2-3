# enLIGHTen OS — Luminaire Schedule | Design
## Standard operating procedure

### 1. Studio | Prepare the schedule

1. Open Studio → Technical Table → Technical Table | Design and choose the project.
2. Complete fitting codes, application details, design requirements and quantities. Review missing linear lengths before issuing them to vendors.
3. Open **Luminaire Schedule | Design**. Review the grouped fitting codes and quantities, application category and technical requirements. The schedule is generated from the saved design output.
4. Enter the vendor name and the Google account email that the vendor will use. Select **Create invitation link**.
5. Copy the link and share it with that vendor. Create a separate invitation for every vendor. Invitations expire after 30 days. Keep the invited email correct.

### 2. Vendor | Prepare and save offers

1. Open the invitation link and sign in using the invited Google account.
2. Choose a fitting and select **+ Add Spec Sheet**.
3. The manufacturer variant specification opens directly. Enter the exact article or SKU that you are offering.
4. Enter the manufacturer and model or family. Upload the catalogue or datasheet, then use the AI extraction option. Check extracted information against the manufacturer's source before saving. Complete any missing dimensions, optical data, electrical specifications, price, warranty and delivery lead time.
5. Upload product images, dimensional drawings, test certificates, LM-80/TM-30 reports and IES/LDT files where available. Individual uploads are limited to 3 MB. Use a smaller excerpt or document link when supported.
6. Save the product and repeat for each fitting. Add separate offers when offering alternatives. Click a saved product to reopen it while the schedule is editable.
7. Check the completion count. Select **Submit for review** when ready. Confirm partial submission if some fitting types cannot be supplied.

### 3. Studio | Review

1. Open the project Luminaire Schedule | Design and review Vendor submissions. Click a product name to preview its manufacturer specification.
2. Open Product Assessment to compare submitted offers against the design and review manufacturer documentation.
3. On the schedule, choose Request revision and enter the required correction, Approve for project, or Reject. The vendor can reopen the same link for a requested revision and resubmit.
4. Use **Add [product] to database** on an approved submission when the manufacturer record is suitable for reuse in other projects. This action publishes the product to the shared Application Database. Project-only approval keeps the offer scoped to the project.
5. Save the preferred selection in Product Assessment. Check Technical Table | Product, quantities, and the final project spec sheets before issuing the final documents.
6. Revoke invitations that should no longer allow vendor access. Do not reuse another vendor's invitation.

### 4. Responsibilities and checks

- Project Admin: validate the design schedule, create and revoke invitations, review submissions, approve reusable manufacturer records.
- Vendor: submit accurate model and variant information, attach applicable documents, respond to revisions.
- Lighting designer: compare the submitted data with design requirements and verify certificates and photometry before selection.
- Project lead: confirm the final selected schedule and spec sheets.

The AI extraction service depends on the existing OPENAI_API_KEY configuration. The existing Google sign-in, Apps Script and Drive permissions must be configured before vendors can upload and submit.

### 5. Deployment and acceptance checks

Update Code.gs and add VendorSchedule.gs in the existing Apps Script project. Save and deploy a new version of the current web app. Deploy the updated Frontend on Vercel. The system creates its vendor invitation and submission sheets as needed.

Before sending a real schedule, test with two different vendor Google accounts. Confirm that each can access only its own invitation, upload a sample PDF and image, save a product, submit, receive a revision request, resubmit, and appear in the project's Product Assessment. Confirm that the selected product reaches the final product schedule and that a project-only offer is not added to the shared Application Database until explicitly published.

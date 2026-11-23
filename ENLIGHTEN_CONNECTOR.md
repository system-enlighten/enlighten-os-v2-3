# Enlighten–Retina workflow

1. In Enlighten OS, confirm the luminaire schedule, shortlist the luminaires in Product Assessment, and open the Product Technical Table for that project. Save any outstanding Output changes and choose **Export to Retina**.
2. In Retina, go to **Sales & Distribution → Estimates → Import Enlighten output**. Verify the ordering SKUs, quantities and unit prices. Linear quantities are counts of finished pieces at the indicated cut length, and the price is per piece.
3. Issue Version 1 / Revision 0. To revise, open the estimate and choose **Issue next revision** or **Import updated technical output**. Each issued version can be opened and printed from its revision history.
4. Record the advance and its reference on the current issue. Retina creates a project or reuses the project linked to the Enlighten project ID. It creates a draft sheet for each product type on the estimate.
5. In **Manufacturing Operations → Orders & Production**, open the project sheet. Resolve pending SKUs by registering a unique product BOM for the ordering SKU. For linear products, the BOM must specify the exact finished cut length. Choose **Match products again**, then send the completed sheet to a free workbench.
6. At the workbench, issue the job card, mark the build complete and dispatch it. A sale dispatch creates a printable draft invoice in **Dispatch Register**, applies the remaining advance up to that dispatch subtotal, and updates stock. Finance can review tax and finalize the invoice separately.

Deploy the Enlighten and Retina Vercel projects with their existing environment settings. Update the Retina Apps Script deployment with this package's backend files, including both `Code.gs` and `Production.gs`. The connector uses an exported JSON file, with a limit of 300 estimate lines per import. Neither project requires a new shared secret for the handoff.

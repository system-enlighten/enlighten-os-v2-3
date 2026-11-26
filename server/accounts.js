// server/accounts.js — private read-only Preview snapshot helper.
// Never route directly to browser; caller supplies verified live identity and server-selected export ID.
import { db } from './supabase-db.js';
import { requireSystemAdmin } from './permissions.js';

export async function readAccountsJournal({user, exportId, database = db} = {}) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_IMPORTED_PROJECT_READS !== '1') throw new Error('Snapshot reads disabled');
  requireSystemAdmin(user);
  if (typeof exportId !== 'string' || !exportId.trim()) throw new Error('Explicit export ID required');
  return database.transaction(async tx => {
    const rows = await tx.rows('SELECT source_row_number, cells FROM enlighten_import.accounts_journal WHERE export_id=$1 ORDER BY source_row_number, import_id', [exportId]);
    const records = [], warnings = [], ids = new Set();
    for (const {source_row_number: row, cells} of rows) {
      try {
        const raw = cells?.['Record JSON'];
        if (typeof raw !== 'string' || !raw.trim()) throw new Error('Missing JSON');
        const record = JSON.parse(raw);
        if (!record || typeof record !== 'object' || Array.isArray(record) || !record.id || !record.kind) throw new Error('Invalid record');
        if (String(record.id) !== String(cells['Record ID']) || String(record.kind) !== String(cells['Record type']) || ids.has(String(record.id))) throw new Error('Journal identity mismatch');
        ids.add(String(record.id));
        records.push(record);
      } catch {
        warnings.push(`Accounts Journal row ${row} could not be read or has an inconsistent identity.`);
      }
    }
    return {records, warnings, complete: warnings.length === 0};
  }, {readOnly:true});
}
// Not an accountsData_ replacement: chart, balances, reconciliation, imports,
// contra entries, attachments, write operations and department access remain unmigrated.

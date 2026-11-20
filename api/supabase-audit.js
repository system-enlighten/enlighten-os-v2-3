// Consolidated Preview-only migration audit entrypoint.
// The original stage handlers remain unchanged apart from their import path.
import stage5 from '../server/migration-audit/supabase-stage5.js';
import stage6a from '../server/migration-audit/supabase-stage6a.js';
import stage6b from '../server/migration-audit/supabase-stage6b.js';
import stage7 from '../server/migration-audit/supabase-stage7.js';
import stage8 from '../server/migration-audit/supabase-stage8.js';
import stage9 from '../server/migration-audit/supabase-stage9.js';
import stage10 from '../server/migration-audit/supabase-stage10.js';
import stage11 from '../server/migration-audit/supabase-stage11.js';
import stage12 from '../server/migration-audit/supabase-stage12.js';
import stage13 from '../server/migration-audit/supabase-stage13.js';

const handlers = { '5': stage5, '6a': stage6a, '6b': stage6b, '7': stage7, '8': stage8, '9': stage9, '10': stage10, '11': stage11, '12': stage12, '13': stage13 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const stage = Array.isArray(req.query.stage) ? '' : String(req.query.stage || '');
  const selected = Object.prototype.hasOwnProperty.call(handlers, stage) ? handlers[stage] : null;
  if (!selected) return res.status(404).json({ok:false,error:{message:'Unknown migration stage'}});
  return selected(req, res);
}

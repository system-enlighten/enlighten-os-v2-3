import React, { useMemo, useState } from 'react';
import { Search, DollarSign, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PaymentDashboard({ projects = [], milestones = [], receipts = [], invoices = [], money }){
  const [query, setQuery] = useState('');
  const [selectedFY, setSelectedFY] = useState('all');
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Group receipts and milestones by project
  const byProject = useMemo(() => {
    const map = new Map(projects.map(p => [String(p.id), {
      ...p,
      commitment: null,
      received: 0,
      invoiced: 0,
      months: new Map()
    }]));

    for (const milestone of milestones) {
      const row = map.get(String(milestone.projectId));
      if (row) {
        row.commitment = (row.commitment ?? 0) + Number(milestone.amount || 0);
      }
    }

    for (const invoice of invoices) {
      if (invoice.documentType === 'Proforma Invoice') continue;
      const row = map.get(String(invoice.projectId));
      if (row) {
        row.invoiced += Number(invoice.amount || 0);
        // If commitment wasn't set by milestones, use invoiced total as base
        if (row.commitment === null) {
          row.commitment = 0;
        }
      }
    }

    // Fallback: if milestone commitments are 0 or null, but invoice has been raised, use invoice total
    for (const row of map.values()) {
      if ((row.commitment === null || row.commitment === 0) && row.invoiced > 0) {
        row.commitment = row.invoiced;
      }
    }

    for (const receipt of receipts) {
      const row = map.get(String(receipt.projectId));
      if (!row) continue;
      const amt = Number(receipt.amount || 0);
      row.received += amt;
      const key = receipt.date?.slice(0, 7);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key || '')) continue;
      row.months.set(key, (row.months.get(key) || 0) + amt);
    }

    return map;
  }, [projects, milestones, receipts, invoices]);

  // Dynamically generate all chronological months without gaps
  const { allMonths, monthTotals, fiscalYears } = useMemo(() => {
    const totals = new Map();
    const allKeys = [];

    for (const row of byProject.values()) {
      for (const [k, v] of row.months.entries()) {
        totals.set(k, (totals.get(k) || 0) + v);
        allKeys.push(k);
      }
    }

    for (const m of milestones) {
      if (m.date) allKeys.push(m.date.slice(0, 7));
    }

    const validKeys = allKeys.filter(k => /^\d{4}-\d{2}$/.test(k || ''));
    const currentYear = new Date().getFullYear();
    const minYear = validKeys.length ? Math.min(2023, ...validKeys.map(k => Number(k.slice(0, 4)))) : 2023;
    const maxYear = Math.max(currentYear + 1, ...validKeys.map(k => Number(k.slice(0, 4))));

    const months = [];
    const fySet = new Set();

    for (let y = minYear; y <= maxYear; y++) {
      for (let m = 1; m <= 12; m++) {
        const key = `${y}-${String(m).padStart(2, '0')}`;
        const label = `${monthNames[m - 1].slice(0, 3)} '${String(y).slice(2)}`;
        const fy = m >= 4 ? `FY ${y}-${String(y + 1).slice(2)}` : `FY ${y - 1}-${String(y).slice(2)}`;
        fySet.add(fy);
        months.push({ key, label, fy, year: y, month: m });
      }
    }

    return {
      allMonths: months,
      monthTotals: totals,
      fiscalYears: Array.from(fySet).sort().reverse()
    };
  }, [byProject, milestones]);

  // Filter months by selected FY
  const visibleMonths = useMemo(() => {
    if (selectedFY === 'all') {
      // If 'all', default to last 24 months or months with activity
      return allMonths;
    }
    return allMonths.filter(m => m.fy === selectedFY);
  }, [allMonths, selectedFY]);

  // Filter project rows
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.from(byProject.values());
    if (!q) return list;
    return list.filter(r =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.client && r.client.toLowerCase().includes(q))
    );
  }, [byProject, query]);

  // Overall totals
  const overall = useMemo(() => {
    let commitment = 0;
    let received = 0;
    for (const r of byProject.values()) {
      commitment += (r.commitment || 0);
      received += (r.received || 0);
    }
    return {
      commitment,
      received,
      balance: commitment - received,
      count: byProject.size
    };
  }, [byProject]);

  const headings = ['Project Name', 'Client Name', 'Project Amount', 'Total Received', 'Remaining Balance'];

  return (
    <div className="payment-dashboard-wrapper">
      {/* KPI Cards Header */}
      <div className="accounts-overview-grid" style={{ marginBottom: 16 }}>
        <div className="accounts-overview-card" style={{ padding: 14 }}>
          <small style={{ color: '#666', fontWeight: 500 }}>Total Project Value</small>
          <strong className="accounts-balance" style={{ margin: '4px 0', fontSize: 20 }}>
            {money(overall.commitment)}
          </strong>
          <span style={{ fontSize: 12, color: '#486073' }}>Across {overall.count} projects</span>
        </div>

        <div className="accounts-overview-card" style={{ padding: 14 }}>
          <small style={{ color: '#2e7d32', fontWeight: 500 }}>Total Collections Received</small>
          <strong className="accounts-balance" style={{ margin: '4px 0', fontSize: 20, color: '#2e7d32' }}>
            {money(overall.received)}
          </strong>
          <span style={{ fontSize: 12, color: '#486073' }}>
            {overall.commitment ? `${Math.round((overall.received / overall.commitment) * 100)}% collected` : 'Active tracking'}
          </span>
        </div>

        <div className="accounts-overview-card" style={{ padding: 14 }}>
          <small style={{ color: '#c62828', fontWeight: 500 }}>Outstanding Balance</small>
          <strong className="accounts-balance" style={{ margin: '4px 0', fontSize: 20, color: '#c62828' }}>
            {money(overall.balance)}
          </strong>
          <span style={{ fontSize: 12, color: '#486073' }}>Pending collections</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="accounts-toolbar" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: '1 1 300px' }}>
          <Search size={16} color="#888" />
          <input
            type="search"
            placeholder="Search project or client..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', maxWidth: 320 }}
          />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Period View: </label>
          <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
            <option value="all">All Available Months (Chronological)</option>
            {fiscalYears.map(fy => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
        </div>
      </div>

      {/* The Payment Matrix Sheet */}
      <div className="payment-sheet-scroll" tabIndex={0} role="region" aria-label="Project payments by month">
        <table className="payment-sheet" aria-label="Payment Dashboard">
          <colgroup>
            {headings.map(label => <col key={label} />)}
            {visibleMonths.map(({ key }) => <col key={key} />)}
          </colgroup>
          <thead>
            <tr className="payment-sheet-totals">
              <th scope="row" colSpan={2} style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 12 }}>
                Monthly Collections Total
              </th>
              <td>{money(overall.commitment)}</td>
              <td style={{ color: '#2e7d32', fontWeight: 700 }}>{money(overall.received)}</td>
              <td style={{ color: '#c62828', fontWeight: 700 }}>{money(overall.balance)}</td>
              {visibleMonths.map(({ key }) => (
                <td key={key} style={{ fontWeight: 700, background: monthTotals.has(key) ? '#e8f5e9' : 'transparent' }}>
                  {monthTotals.has(key) ? money(monthTotals.get(key)) : '—'}
                </td>
              ))}
            </tr>
            <tr>
              {headings.map(label => <th scope="col" key={label}>{label}</th>)}
              {visibleMonths.map(({ key, label }) => <th scope="col" key={key}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => {
              const bal = (row.commitment ?? 0) - row.received;
              const isSelected = activeProjectId === row.id;
              return (
                <tr
                  key={row.id}
                  onClick={() => setActiveProjectId(isSelected ? null : row.id)}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? '#fff9c4' : undefined
                  }}
                >
                  <th scope="row" style={{ fontWeight: 600 }}>{row.name}</th>
                  <td>{row.client || '—'}</td>
                  <td>{row.commitment === null ? '—' : money(row.commitment)}</td>
                  <td style={{ color: row.received ? '#2e7d32' : undefined, fontWeight: row.received ? 600 : 400 }}>
                    {row.received ? money(row.received) : '—'}
                  </td>
                  <td style={{ color: bal > 0 ? '#c62828' : '#2e7d32', fontWeight: 600 }}>
                    {row.commitment === null ? '—' : money(bal)}
                  </td>
                  {visibleMonths.map(({ key }) => {
                    const amt = row.months.get(key);
                    return (
                      <td key={key} style={{ background: amt ? '#f1f8e9' : undefined, fontWeight: amt ? 600 : 400 }}>
                        {amt ? money(amt) : ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {!visibleRows.length && (
              <tr>
                <td colSpan={headings.length + visibleMonths.length} style={{ textAlign: 'center', padding: 24 }}>
                  No projects matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

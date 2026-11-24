import React from 'react';
import {Download} from 'lucide-react';

export default function BalanceSheet({asOf, heads, records, money, exportCsv, loading=false}) {
  const [year, month, day] = asOf.split('-').map(Number);
  const previousMonthEnd = new Date(Date.UTC(year - 1, month, 0)).getUTCDate();
  const comparison = [year - 1, String(month).padStart(2, '0'), String(Math.min(day, previousMonthEnd)).padStart(2, '0')].join('-');
  const dates = [asOf, comparison];
  const balances = new Map();
  for (const record of records) {
    if (!record.date || record.date > asOf) continue;
    for (const posting of record.postings || []) {
      const values = balances.get(posting.head) || [0, 0];
      const net = (Number(posting.debit) || 0) - (Number(posting.credit) || 0);
      values[0] += net;
      if (record.date <= comparison) values[1] += net;
      balances.set(posting.head, values);
    }
  }

  const sum = rows => dates.map((_, i) => rows.reduce((total, row) => total + row.values[i], 0));
  const sections = ['Asset', 'Liability', 'Equity'].map((type, index) => {
    const name = ['Assets', 'Liabilities', 'Equity'][index];
    const rows = heads.filter(([, kind]) => kind === type).map(([label, , subhead]) => ({
      label, subhead, values: (balances.get(label) || [0, 0]).map(value => index === 0 ? value : -value)
    }));
    if (type === 'Equity') {
      const earnings = heads.filter(([, kind]) => ['Revenue', 'Expense', 'Direct expense'].includes(kind))
        .map(([head]) => ({values: balances.get(head) || [0, 0]}));
      rows.push({label: 'Cumulative earnings', values: sum(earnings).map(value => -value)});
    }
    return {name, rows, subtotal: {label: 'Total ' + name.toLowerCase(), values: sum(rows)}};
  });
  const total = {label: 'Total liabilities and equity', values: sum(sections.slice(1).map(section => section.subtotal))};
  const difference = {label: 'Difference (assets less liabilities and equity)', values: sections[0].subtotal.values.map((value, i) => value - total.values[i])};
  const closingRows = difference.values.some(Boolean) ? [total, difference] : [total];
  const dateLabel = date => new Intl.DateTimeFormat('en-IN', {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(date));
  const formatAmount = value => value < 0 ? '(' + money(-value) + ')' : value ? money(value) : '—';

  const renderRow = (row, className) => (
    <tr key={row.label} className={className}>
      <th scope="row">{row.label}{row.subhead && <small>{row.subhead}</small>}</th>
      {row.values.map((value, i) => <td key={dates[i]}>{formatAmount(value)}</td>)}
    </tr>
  );

  function download() {
    const rows = sections.flatMap(({name, rows, subtotal}) => [[name, '', ''], ...[...rows, subtotal].map(csvRow)]);
    exportCsv('Balance_Sheet.csv', ['Account (INR)', ...dates], [...rows, ...closingRows.map(csvRow)]);
  }

  function csvRow({label, subhead, values}) {
    return [subhead ? label + ' | ' + subhead : label, ...values.map(value => value / 100)];
  }

  return <section className="accounts-balance-sheet" aria-labelledby="accounts-balance-heading">
    <header>
      <span>Enlighten Design Co.</span>
      <h2 id="accounts-balance-heading">Balance Sheet</h2>
      <span>Amounts in INR</span>
      <button type="button" onClick={download} disabled={loading}><Download size={13} aria-hidden="true"/> Export CSV</button>
    </header>
    <div className="accounts-scroll">
      <table>
        <thead><tr>
          <th scope="col">Account</th>
          {dates.map(date => <th key={date} scope="col">As at {dateLabel(date)}</th>)}
        </tr></thead>
        {sections.map(({name, rows, subtotal}) => <tbody key={name}>
          <tr className="balance-sheet-group"><th scope="rowgroup" colSpan={3}>{name}</th></tr>
          {rows.map(row => renderRow(row, 'balance-sheet-account'))}
          {renderRow(subtotal, 'balance-sheet-subtotal')}
        </tbody>)}
        <tfoot>{closingRows.map(row => renderRow(row, row === total ? 'balance-sheet-total' : 'balance-sheet-difference'))}</tfoot>
      </table>
    </div>
  </section>;
}

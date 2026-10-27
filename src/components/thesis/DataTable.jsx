import { useMemo, useState } from 'react';

// Small sortable table with a CSV download. `cols`: [{ k, label, digits?, num? }]. Props must be serialisable (Astro island), so no formatter functions.
export default function DataTable({ rows, cols, csv, caption, initialSort }) {
  const [sort, setSort] = useState(initialSort || null); // { k, dir }
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const out = [...rows].sort((a, b) => {
      const x = a[sort.k], y = b[sort.k];
      if (typeof x === 'number' && typeof y === 'number') return x - y;
      return String(x).localeCompare(String(y));
    });
    return sort.dir === 'desc' ? out.reverse() : out;
  }, [rows, sort]);
  const click = (k) => setSort((s) => (s && s.k === k ? { k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: 'asc' }));
  return (
    <div className="pp-table th-datatable">
      <table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.k} className={c.num ? 'num' : ''} aria-sort={sort && sort.k === c.k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => click(c.k)}>{c.label}{sort && sort.k === c.k ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i}>{cols.map((c) => <td key={c.k} className={c.num ? 'num' : ''}>{c.digits != null && typeof r[c.k] === 'number' ? r[c.k].toFixed(c.digits) : r[c.k]}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {csv && <ul className="th-dl"><li><a href={`/blog/thesis-data/csv/${csv}`} download>Download this table <small>CSV</small></a></li></ul>}
    </div>
  );
}

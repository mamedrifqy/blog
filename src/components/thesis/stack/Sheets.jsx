import { useData, Loading } from './util.jsx';

const anchor = (file) => file.replace(/^csv\//, '').replace(/\.csv$/, '');

export function AnalysisSheet({ a, base, onFile }) {
  return (
    <div className="sx-sheet">
      <p className="sx-lead"><i style={{ background: a.col }} />{a.question}</p>
      <div className="sx-stats big">{a.results.map(([v, t]) => <div key={t}><b>{v}</b><span>{t}</span></div>)}</div>
      <div className="sx-cols">
        <section>
          <h3>Methods</h3>
          <dl className="sx-facts">{a.methods.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </section>
        <section>
          {a.table && (
            <>
              <h3>Features</h3>
              <table className="sx-table left"><thead><tr>{a.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{a.table.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
            </>
          )}
          <h3>What it shows</h3>
          <p>{a.reading}</p>
          <h3>Data on this page</h3>
          <p className="sx-files">{a.data.map((f) => <button key={f} onClick={() => onFile(f)}>{f.replace(/^csv\//, '')}</button>)}</p>
        </section>
      </div>
      <p className="sx-posts">{a.posts.map(([slug, t]) => <a key={slug} href={`${base}/${slug}`}>Read: {t} →</a>)}</p>
    </div>
  );
}

export function OutputSheet({ d, base, onClose }) {
  const { data, err } = useData([[`${base}/thesis-data/${d.file}`, 'csv']]);
  return (
    <div className="sx-sheet">
      <p className="sx-lead">{d.description}</p>
      <div className="sx-stats">
        <div><b>{d.rows.toLocaleString('en-US')}</b><span>rows</span></div>
        <div><b>{d.columns.length}</b><span>columns</span></div>
        <div><b>{d.ref || '–'}</b><span>thesis section</span></div>
      </div>
      <p className="sx-src">Source file in the thesis analysis: <code>{d.source}</code></p>
      <h3>Columns</h3>
      <p className="sx-colnames">{d.columns.map((c) => <code key={c}>{c}</code>)}</p>
      <h3>First rows</h3>
      {!data ? <Loading err={err} /> : (
        <div className="sx-tablewrap">
          <table className="sx-table mono">
            <thead><tr>{data[0].head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{data[0].rows.slice(0, 12).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} title={c}>{c.length > 40 ? c.slice(0, 38) + '…' : c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      <p className="sx-actions">
        <a className="sx-btn" href={`${base}/thesis-data/${d.file}`} download>Download CSV</a>
        <a className="sx-link" href={`#${anchor(d.file)}`} onClick={onClose}>Go to its card on this page</a>
      </p>
    </div>
  );
}

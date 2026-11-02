// One Table 3.2 dataset group: what it is, how it is made, how the thesis used it, caveats and references.
export default function SourceSheet({ s, base }) {
  return (
    <div className="sx-sheet">
      <p className="sx-lead"><i style={{ background: s.col }} />{s.product}<span className="sx-role">{s.role}</span></p>
      <div className="sx-cols">
        <section>
          <h3>The dataset</h3>
          <dl className="sx-facts">
            {s.facts.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
          <h3>How it is made</h3>
          {s.how.map((t, i) => <p key={i}>{t}</p>)}
        </section>
        <section>
          <h3>How the thesis uses it</h3>
          <ul className="sx-list">{s.thesis.map((t, i) => <li key={i}>{t}</li>)}</ul>
          <h3>Caveats</h3>
          <ul className="sx-list warn">{s.caveats.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </section>
      </div>
      <h3>Sources</h3>
      <ol className="sx-refs">
        {s.refs.map(([t, u]) => <li key={u}>{t} <a href={u} target="_blank" rel="noopener noreferrer">{u.replace(/^https?:\/\//, '')}</a></li>)}
      </ol>
      <p className="sx-posts">{s.posts.map(([slug, t]) => <a key={slug} href={`${base}/${slug}`}>Read: {t} →</a>)}</p>
    </div>
  );
}

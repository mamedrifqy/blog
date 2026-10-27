import { useEffect, useRef, useState } from 'react';
import '../styles/mindmap.css';

// Horizontal, collapsible mind map rendered inside a modal <dialog>.
// Props:
//   data   – { root: { label, note?, children: [{ label, note?, ref?, post?, open?, children? }] } }
//   posts  – { [slug]: title } of PUBLISHED posts; a node's `post` only becomes a link if it is listed here
//   base   – site base path without trailing slash
//   label  – text on the toggle

function collectIds(node, path, out) {
  out[path] = node;
  (node.children || []).forEach((c, i) => collectIds(c, path + '.' + i, out));
  return out;
}

function Node({ node, path, openMap, toggle, posts, base, depth, rootRef }) {
  const kids = node.children || [];
  const hasKids = kids.length > 0;
  const isOpen = depth === 0 || !!openMap[path];
  const href = node.post && posts[node.post] ? `${base}/${node.post}` : null;
  const Tag = hasKids && depth > 0 ? 'button' : 'div';
  return (
    <li className={'mm-li' + (depth === 0 ? ' mm-root-li' : '')}>
      <div ref={depth === 0 ? rootRef : undefined} className={'mm-node' + (depth === 0 ? ' mm-root' : depth === 1 ? ' mm-branch' : '') + (href ? ' has-post' : '')}>
        <Tag
          type={Tag === 'button' ? 'button' : undefined}
          className="mm-main"
          aria-expanded={Tag === 'button' ? isOpen : undefined}
          onClick={Tag === 'button' ? () => toggle(path) : undefined}
        >
          {node.ref && <span className="mm-ref">{node.ref}</span>}
          <span className="mm-label">{node.label}</span>
          {node.note && <span className="mm-note">{node.note}</span>}
          {hasKids && depth > 0 && <span className="mm-caret" aria-hidden="true">{isOpen ? '−' : '+'}</span>}
        </Tag>
        {href && (
          <a className="mm-post" href={href} title={posts[node.post]}>
            Read post <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
      {hasKids && isOpen && (
        <ul className="mm-ul">
          {kids.map((c, i) => (
            <Node key={i} node={c} path={path + '.' + i} openMap={openMap} toggle={toggle} posts={posts} base={base} depth={depth + 1} rootRef={rootRef} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ThesisMindMap({ data, posts, base, label = 'Thesis mind map' }) {
  const dlg = useRef(null);
  const rootEl = useRef(null);
  const [on, setOn] = useState(false);
  const initial = () => {
    const m = {};
    (data.root.children || []).forEach((c, i) => { if (c.open) m['0.' + i] = true; });
    return m;
  };
  const [openMap, setOpenMap] = useState(initial);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    const onClose = () => setOn(false);
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  // keep the root node in view: the tree is tall, and the root sits at its vertical centre
  const centerRoot = () => setTimeout(() => rootEl.current?.scrollIntoView({ block: 'center', inline: 'start' }), 60);
  const open = () => { setOn(true); dlg.current?.showModal(); centerRoot(); };
  const close = () => dlg.current?.close();
  const toggle = (p) => setOpenMap((m) => ({ ...m, [p]: !m[p] }));
  const expandAll = () => {
    const all = collectIds(data.root, '0', {});
    const m = {};
    Object.entries(all).forEach(([p, n]) => { if ((n.children || []).length) m[p] = true; });
    setOpenMap(m);
    centerRoot();
  };
  const collapseAll = () => { setOpenMap({}); centerRoot(); };
  const resetView = () => { setOpenMap(initial()); centerRoot(); };

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-haspopup="dialog"
        className="mm-switch"
        onClick={() => (on ? close() : open())}
      >
        <span className="mm-switch-track" aria-hidden="true"><span className="mm-switch-knob" /></span>
        <span className="mm-switch-label">{label}</span>
      </button>

      <dialog
        ref={dlg}
        className="mm-dialog"
        aria-labelledby="mm-title"
        onClick={(e) => { if (e.target === dlg.current) close(); }}
      >
        <div className="mm-frame">
          <header className="mm-head">
            <div>
              <h2 id="mm-title">{label}</h2>
              <p>Chapters of the thesis, with the key result of each section. Nodes marked <b>Read post</b> link to the matching story. Click a node with a + to open it.</p>
            </div>
            <div className="mm-tools">
              <button type="button" onClick={resetView}>Reset</button>
              <button type="button" onClick={expandAll}>Expand all</button>
              <button type="button" onClick={collapseAll}>Collapse all</button>
              <button type="button" className="mm-close" onClick={close} aria-label="Close mind map">✕</button>
            </div>
          </header>
          <div className="mm-scroll" tabIndex={0} role="region" aria-label="Mind map, scrollable">
            <ul className="mm-ul mm-top">
              <Node node={data.root} path="0" openMap={openMap} toggle={toggle} posts={posts} base={base} depth={0} rootRef={rootEl} />
            </ul>
          </div>
        </div>
      </dialog>
    </>
  );
}

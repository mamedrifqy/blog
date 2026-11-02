import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Accessible dialog: portal to <body>, Esc and backdrop close, focus moves in and returns, page scroll locked.
export default function Modal({ open, onClose, title, kicker, children, wide = true, nav }) {
  const box = useRef(null);
  const prev = useRef(null);

  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement;
    const y = window.scrollY;
    const html = document.documentElement;
    const old = html.style.overflow;
    html.style.overflow = 'hidden';
    const t = setTimeout(() => box.current?.querySelector('.sx-close')?.focus(), 30);
    const key = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab' && box.current) {
        const f = [...box.current.querySelectorAll('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])')].filter((n) => n.offsetParent !== null);
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', key);
      html.style.overflow = old;
      window.scrollTo(0, y);
      prev.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="sx-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className={`sx-dialog${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sx-title">
        <header className="sx-head">
          <div>
            {kicker && <p className="sx-kick">{kicker}</p>}
            <h2 id="sx-title">{title}</h2>
          </div>
          <div className="sx-head-ctl">
            {nav && (
              <>
                <button onClick={nav.prev} disabled={!nav.prev} aria-label="Previous">←</button>
                <span className="sx-count">{nav.label}</span>
                <button onClick={nav.next} disabled={!nav.next} aria-label="Next">→</button>
              </>
            )}
            <button className="sx-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </header>
        <div className="sx-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

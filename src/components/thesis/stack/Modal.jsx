import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Where the reader last pressed, in page coordinates. Used only when the page
// runs inside a frame that is sized to the whole document (some embedded
// viewers do this): there `position: fixed` pins the dialog to the top of the
// document, far from what the reader is looking at, so the dialog is placed
// next to the control that opened it instead.
let lastPressY = null;
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => { lastPressY = e.pageY; }, true);
}
const frameIsDocumentTall = () => {
  const screenH = (window.screen && window.screen.availHeight) || 900;
  return window.innerHeight > screenH * 1.3;
};

// Accessible dialog: portal to <body>, Esc and backdrop close, focus moves in and returns, page scroll locked.
export default function Modal({ open, onClose, title, kicker, children, wide = true, nav }) {
  const box = useRef(null);
  const prev = useRef(null);
  const back = useRef(null);

  useLayoutEffect(() => {
    if (!open || !back.current || !frameIsDocumentTall()) return;
    const screenH = (window.screen && window.screen.availHeight) || 900;
    const anchor = lastPressY ?? (prev.current?.getBoundingClientRect?.().top ?? 0) + window.scrollY;
    const h = Math.round(screenH * 0.85);
    const top = Math.max(0, Math.min(anchor - h / 3, document.documentElement.scrollHeight - h));
    Object.assign(back.current.style, { position: 'absolute', top: `${top}px`, bottom: 'auto', height: `${h}px`, padding: '12px' });
    if (box.current) box.current.style.maxHeight = `${h - 24}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement;
    const y = window.scrollY;
    const html = document.documentElement;
    const old = html.style.overflow;
    // locking scroll in a document-tall frame would do nothing useful
    if (!frameIsDocumentTall()) html.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const c = box.current?.querySelector('.sx-close');
      (c && c.offsetParent !== null ? c : box.current?.querySelector('.sx-grab'))?.focus();
    }, 30);
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
      if (!frameIsDocumentTall()) window.scrollTo(0, y);
      prev.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div ref={back} className="sx-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className={`sx-dialog${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sx-title">
        {/* phone sheet: tactile grab handle in place of the close button (hidden on desktop) */}
        <button type="button" className="sx-grab" onClick={onClose} aria-label="Close"><span /></button>
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

// Theme toggle. The initial theme is set by the inline script in BaseLayout (before paint); this wires the button,
// remembers an explicit choice, follows the OS setting until the reader chooses, and announces changes.
// Charts and maps listen for the 'themechange' event on document (see src/lib/theme.js).
const KEY = 'medrifmaps-theme';
const root = document.documentElement;
const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

const saved = () => { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; } };
const system = () => (mq && mq.matches ? 'light' : 'dark');

function paintChrome(t) {
  const m = document.getElementById('meta-theme-color');
  if (m) m.setAttribute('content', t === 'light' ? '#f6f2ea' : '#0d0e0f');
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    const to = t === 'light' ? 'dark' : 'light';
    b.setAttribute('aria-label', 'Switch to ' + to + ' theme');
    b.setAttribute('title', 'Switch to ' + to + ' theme');
  });
}

function apply(t, persist) {
  const changed = root.getAttribute('data-theme') !== t;
  root.setAttribute('data-theme', t);
  if (persist) { try { localStorage.setItem(KEY, t); } catch (e) {} }
  paintChrome(t);
  if (changed) document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
}

paintChrome(root.getAttribute('data-theme') || 'dark');

document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
  b.addEventListener('click', () => apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true));
});

if (mq) {
  const onSys = () => { if (!saved()) apply(system(), false); };
  if (mq.addEventListener) mq.addEventListener('change', onSys); else if (mq.addListener) mq.addListener(onSys);
}
// another tab changed the choice
window.addEventListener('storage', (e) => { if (e.key === KEY) apply(saved() || system(), false); });

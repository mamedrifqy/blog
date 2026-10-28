// Hover / focus / tap cards for <Term> links. One card element, one lazily fetched JSON of rendered entries.
const BASE = (document.querySelector('link[rel="icon"]')?.getAttribute('href') || '/blog/favicon.svg').replace(/\/favicon\.svg$/, '');
let data = null, loading = null;
let pop = null, current = null, pinned = false, timer = null;

function load() {
  if (data) return Promise.resolve(data);
  return (loading ||= fetch(`${BASE}/glossary.json`).then((r) => r.json()).then((d) => (data = d)).catch(() => (loading = null)));
}

function ensurePop() {
  if (pop) return pop;
  pop = document.createElement('div');
  pop.className = 'term-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Method explained');
  pop.tabIndex = -1;
  pop.hidden = true;
  pop.addEventListener('mouseenter', () => clearTimeout(timer));
  pop.addEventListener('mouseleave', () => { if (!pinned) schedule(close, 200); });
  document.body.appendChild(pop);
  return pop;
}

function place(el) {
  const r = el.getBoundingClientRect();
  const p = pop;
  p.style.left = '0px'; p.style.top = '0px';
  const w = p.offsetWidth, h = p.offsetHeight, m = 12;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(m, Math.min(left, window.innerWidth - w - m));
  let top = r.bottom + 8;
  const above = top + h > window.innerHeight - m && r.top - h - 8 > m;
  if (above) top = r.top - h - 8;
  else if (top + h > window.innerHeight - m) top = Math.max(m, window.innerHeight - h - m);
  p.style.left = `${left + window.scrollX}px`;
  p.style.top = `${top + window.scrollY}px`;
}

async function open(el, pin) {
  clearTimeout(timer);
  if (current === el && !pop.hidden) { if (pin) pinned = true; return; }
  close();
  const id = el.dataset.term;
  const p = ensurePop();
  current = el; pinned = !!pin;
  el.setAttribute('aria-expanded', 'true');
  p.innerHTML = '<p class="tc-what">Loading…</p>';
  p.hidden = false; place(el);
  const d = await load();
  if (current !== el) return;
  const e = d && d[id];
  if (!e) { p.innerHTML = `<p class="tc-what">This explanation could not be loaded. <a href="${BASE}/glossary#${id}">Open the glossary</a>.</p>`; place(el); return; }
  p.innerHTML = `<button type="button" class="tc-close" aria-label="Close">×</button><h4>${e.name}</h4>${e.html}<p class="tc-more"><a href="${BASE}/glossary#${id}">All methods in the glossary →</a></p>`;
  p.querySelector('.tc-close').addEventListener('click', () => { close(); el.focus(); });
  place(el);
}

function close() {
  clearTimeout(timer);
  if (pop) pop.hidden = true;
  if (current) current.setAttribute('aria-expanded', 'false');
  current = null; pinned = false;
}
function schedule(fn, ms) { clearTimeout(timer); timer = setTimeout(fn, ms); }

const termOf = (t) => (t instanceof Element ? t.closest('a.term[data-term]') : null);
const canHover = window.matchMedia('(hover: hover)').matches;

document.addEventListener('mouseover', (e) => {
  const t = termOf(e.target);
  if (!t || !canHover) return;
  schedule(() => open(t, false), 180);
});
document.addEventListener('mouseout', (e) => {
  const t = termOf(e.target);
  if (!t || !canHover) return;
  if (!pinned) schedule(close, 250);
});
document.addEventListener('focusin', (e) => { const t = termOf(e.target); if (t) open(t, false); });
document.addEventListener('click', (e) => {
  const t = termOf(e.target);
  if (t) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let people open the glossary in a new tab
    e.preventDefault();
    if (current === t && pinned) close(); else open(t, true);
    return;
  }
  if (pop && !pop.hidden && !pop.contains(e.target)) close();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop && !pop.hidden) { const c = current; close(); c && c.focus(); } });
window.addEventListener('resize', () => { if (current) place(current); });
window.addEventListener('scroll', () => { if (current && !pinned) close(); }, { passive: true });

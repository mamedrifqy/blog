import { GLOSSARY, renderEntry } from '../data/glossary';

// One small JSON file with the rendered card of every term; fetched the first time someone opens a term.
export function GET() {
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
  const out: Record<string, { name: string; html: string }> = {};
  for (const e of GLOSSARY) out[e.id] = { name: e.name, html: renderEntry(e, BASE) };
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
}

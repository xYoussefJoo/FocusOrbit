// Generates docs/guide/schema.svg — the FocusOrbit ERD.
// Run: node docs/guide/schema-diagram.mjs   (docs/guide/render.ps1 renders it to PNG)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const C = {
  bg: '#0c0d0c', card: '#141614', head: '#1a1d1a', border: '#2a2e2a',
  text: '#ecebe6', muted: '#8b918a', faint: '#5a605a',
  accent: '#34d399', fk: '#93c5fd', cascade: '#e8e6e1', setnull: '#7c847c',
};
const W = 320, HEAD = 42, ROW = 26, PAD = 10;

// [name, type, key?]  key: 'pk' | 'fk'
const tables = {
  users: { x: 40, y: 470, sub: 'identity lives in Clerk', cols: [
    ['id', 'text', 'pk'], ['timezone', 'text'], ['daily_goal_minutes', 'int'], ['created_at', 'timestamptz'],
  ] },
  topics: { x: 420, y: 150, sub: 'what you studied', cols: [
    ['id', 'uuid', 'pk'], ['user_id', 'text', 'fk'], ['name', 'text'], ['color', 'text'],
    ['created_at', 'timestamptz'], ['archived_at', 'timestamptz'],
  ] },
  tasks: { x: 820, y: 150, sub: 'what you planned', cols: [
    ['id', 'uuid', 'pk'], ['user_id', 'text', 'fk'], ['topic_id', 'uuid', 'fk'], ['title', 'text'],
    ['status', 'task_status'], ['estimated_minutes', 'int'], ['created_at', 'timestamptz'], ['completed_at', 'timestamptz'],
  ] },
  focus_sessions: { x: 820, y: 480, core: true, sub: 'the center of everything', cols: [
    ['id', 'uuid', 'pk'], ['user_id', 'text', 'fk'], ['topic_id', 'uuid', 'fk'], ['task_id', 'uuid', 'fk'],
    ['status', 'session_status'], ['planned_seconds', 'int'], ['focused_seconds', 'int'],
    ['started_at', 'timestamptz'], ['last_resumed_at', 'timestamptz'], ['ended_at', 'timestamptz'], ['reflection', 'text'],
  ] },
  notes: { x: 1240, y: 480, sub: 'what you wrote', cols: [
    ['id', 'uuid', 'pk'], ['user_id', 'text', 'fk'], ['topic_id', 'uuid', 'fk'], ['session_id', 'uuid', 'fk'],
    ['title', 'text'], ['content', 'text (markdown)'], ['created_at', 'timestamptz'], ['updated_at', 'timestamptz'], ['archived_at', 'timestamptz'],
  ] },
  files: { x: 420, y: 560, sub: 'the IDE explorer tree', cols: [
    ['id', 'uuid', 'pk'], ['user_id', 'text', 'fk'], ['parent_id', 'uuid', 'fk'], ['name', 'text'], ['kind', 'file_kind'],
    ['language', 'text'], ['content', 'text'], ['created_at', 'timestamptz'], ['updated_at', 'timestamptz'],
  ] },
};

const height = (t) => HEAD + t.cols.length * ROW + PAD;
const rowY = (name, col) => {
  const t = tables[name];
  return t.y + HEAD + t.cols.findIndex((c) => c[0] === col) * ROW + ROW / 2 + 4;
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function table(name) {
  const t = tables[name];
  const h = height(t);
  const stroke = t.core ? C.accent : C.border;
  let s = `<g>`;
  if (t.core) s += `<rect x="${t.x - 6}" y="${t.y - 6}" width="${W + 12}" height="${h + 12}" rx="16" fill="none" stroke="${C.accent}" stroke-opacity="0.18" stroke-width="6"/>`;
  s += `<rect x="${t.x}" y="${t.y}" width="${W}" height="${h}" rx="12" fill="${C.card}" stroke="${stroke}" stroke-width="${t.core ? 1.5 : 1}"/>`;
  s += `<path d="M${t.x} ${t.y + 12} a12 12 0 0 1 12 -12 h${W - 24} a12 12 0 0 1 12 12 v${HEAD - 12} h-${W} z" fill="${C.head}"/>`;
  s += `<line x1="${t.x}" y1="${t.y + HEAD}" x2="${t.x + W}" y2="${t.y + HEAD}" stroke="${stroke}" stroke-opacity="0.6"/>`;
  s += `<text x="${t.x + 16}" y="${t.y + 27}" class="tname" fill="${t.core ? C.accent : C.text}">${name}</text>`;
  s += `<text x="${t.x + W - 16}" y="${t.y + 27}" class="tsub" text-anchor="end">${esc(t.sub)}</text>`;
  t.cols.forEach(([col, type, key], i) => {
    const y = t.y + HEAD + i * ROW + ROW / 2 + 5;
    if (i % 2 === 1) s += `<rect x="${t.x + 1}" y="${t.y + HEAD + i * ROW}" width="${W - 2}" height="${ROW}" fill="#ffffff" fill-opacity="0.015"/>`;
    if (key) s += `<text x="${t.x + 16}" y="${y}" class="key" fill="${key === 'pk' ? C.accent : C.fk}">${key.toUpperCase()}</text>`;
    s += `<text x="${t.x + 46}" y="${y}" class="col" fill="${key === 'pk' ? C.text : key === 'fk' ? C.fk : C.text}">${col}</text>`;
    s += `<text x="${t.x + W - 16}" y="${y}" class="type" text-anchor="end">${esc(type)}</text>`;
  });
  return s + `</g>`;
}

// Relationships: [path, style, label, labelX, labelY]
const rel = [];
const link = (d, style, label, lx, ly) => rel.push({ d, style, label, lx, ly });

const tR = tables.topics.x + W, tsk = tables.tasks, fs = tables.focus_sessions, nt = tables.notes, fl = tables.files, us = tables.users;
link(`M${tR} ${rowY('topics', 'id')} C${tR + 40} ${rowY('topics', 'id')} ${tsk.x - 40} ${rowY('tasks', 'topic_id')} ${tsk.x} ${rowY('tasks', 'topic_id')}`, 'setnull', 'topic_id', tR + 10, rowY('topics', 'id') - 10);
link(`M${tR} ${rowY('topics', 'id')} C${tR + 60} ${rowY('topics', 'id')} ${fs.x - 60} ${rowY('focus_sessions', 'topic_id')} ${fs.x} ${rowY('focus_sessions', 'topic_id')}`, 'setnull', 'topic_id', fs.x - 70, rowY('focus_sessions', 'topic_id') - 30);
link(`M${tsk.x + W / 2} ${tsk.y + height(tsk)} L${fs.x + W / 2} ${fs.y - 8}`, 'setnull', 'task_id', tsk.x + W / 2 + 10, tsk.y + height(tsk) + 32);
link(`M${fs.x + W} ${rowY('focus_sessions', 'id')} C${fs.x + W + 50} ${rowY('focus_sessions', 'id')} ${nt.x - 50} ${rowY('notes', 'session_id')} ${nt.x} ${rowY('notes', 'session_id')}`, 'setnull', 'session_id', fs.x + W + 14, rowY('focus_sessions', 'id') - 10);
link(`M${tables.topics.x + W / 2} ${tables.topics.y} L${tables.topics.x + W / 2} 112 L${nt.x + W / 2} 112 L${nt.x + W / 2} ${nt.y - 8}`, 'setnull', 'topic_id', nt.x + W / 2 + 10, 300);
link(`M${fl.x} ${rowY('files', 'id')} C${fl.x - 44} ${rowY('files', 'id')} ${fl.x - 44} ${rowY('files', 'parent_id')} ${fl.x} ${rowY('files', 'parent_id')}`, 'cascade', 'parent_id', fl.x - 108, rowY('files', 'parent_id') + 28);
link(`M${us.x + W} ${rowY('users', 'id')} C${us.x + W + 30} ${rowY('users', 'id')} ${tables.topics.x - 30} ${rowY('topics', 'user_id')} ${tables.topics.x} ${rowY('topics', 'user_id')}`, 'cascade', 'user_id', us.x + W - 30, 330);
link(`M${us.x + W} ${rowY('users', 'id')} C${us.x + W + 30} ${rowY('users', 'id')} ${fl.x - 60} ${rowY('files', 'user_id')} ${fl.x} ${rowY('files', 'user_id')}`, 'cascade', '', 0, 0);

const relSvg = rel.map(({ d, style, label, lx, ly }) => {
  const col = style === 'cascade' ? C.cascade : C.setnull;
  const dash = style === 'setnull' ? ' stroke-dasharray="6 5"' : '';
  let s = `<path d="${d}" fill="none" stroke="${col}" stroke-opacity="${style === 'cascade' ? 0.7 : 0.9}" stroke-width="1.4"${dash} marker-start="url(#one-${style})" marker-end="url(#many-${style})"/>`;
  if (label) s += `<text x="${lx}" y="${ly}" class="rel">${label}</text>`;
  return s;
}).join('\n');

const marker = (id, color) => `
  <marker id="one-${id}" viewBox="0 0 12 12" refX="1" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
    <line x1="6" y1="1" x2="6" y2="11" stroke="${color}" stroke-width="1.6"/></marker>
  <marker id="many-${id}" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" orient="auto" markerUnits="userSpaceOnUse">
    <path d="M13 1 L1 7 L13 13 M1 7 L13 7" fill="none" stroke="${color}" stroke-width="1.6"/></marker>`;

const CW = 1600, CH = 1000;
const badge = (x, y, text) => `<g><rect x="${x}" y="${y}" width="${text.length * 7.1 + 26}" height="26" rx="13" fill="${C.accent}" fill-opacity="0.08" stroke="${C.accent}" stroke-opacity="0.35"/>
  <text x="${x + 13}" y="${y + 17.5}" class="badge">${esc(text)}</text></g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
<style>
  text { font-family: 'Segoe UI', 'Inter', system-ui, sans-serif; }
  .title { font-family: Georgia, 'Times New Roman', serif; font-size: 34px; fill: ${C.text}; }
  .kicker { font-size: 12px; letter-spacing: 3px; fill: ${C.accent}; font-weight: 600; }
  .tname { font-family: Consolas, 'Cascadia Code', monospace; font-size: 16px; font-weight: 700; }
  .tsub { font-size: 11.5px; fill: ${C.muted}; font-style: italic; }
  .col { font-family: Consolas, 'Cascadia Code', monospace; font-size: 13.5px; }
  .type { font-family: Consolas, monospace; font-size: 12px; fill: ${C.muted}; }
  .key { font-family: Consolas, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
  .rel { font-family: Consolas, monospace; font-size: 11.5px; fill: ${C.muted}; }
  .legend { font-size: 12.5px; fill: ${C.muted}; }
  .badge { font-size: 12px; fill: ${C.accent}; }
</style>
<defs>${marker('cascade', C.cascade)}${marker('setnull', C.setnull)}</defs>
<rect width="100%" height="100%" fill="${C.bg}"/>
<text x="40" y="52" class="kicker">FOCUSORBIT · DATABASE SCHEMA · v0000_init</text>
<text x="40" y="92" class="title">Everything orbits the focus session</text>
${relSvg}
${Object.keys(tables).map(table).join('\n')}
${badge(fs.x, fs.y + height(fs) + 16, 'one active session per user · partial unique index')}
${badge(fl.x, fl.y + height(fl) + 16, 'unique name per folder · NULLS NOT DISTINCT')}
<g transform="translate(40, 700)">
  <text x="0" y="0" class="kicker">LEGEND</text>
  <line x1="0" y1="26" x2="54" y2="26" stroke="${C.cascade}" stroke-opacity="0.7" stroke-width="1.4" marker-start="url(#one-cascade)" marker-end="url(#many-cascade)"/>
  <text x="68" y="30" class="legend">required · ON DELETE CASCADE</text>
  <line x1="0" y1="54" x2="54" y2="54" stroke="${C.setnull}" stroke-width="1.4" stroke-dasharray="6 5" marker-start="url(#one-setnull)" marker-end="url(#many-setnull)"/>
  <text x="68" y="58" class="legend">optional · ON DELETE SET NULL</text>
  <text x="0" y="90" class="legend"><tspan fill="${C.accent}" font-weight="700">PK</tspan> primary key   <tspan fill="${C.fk}" font-weight="700">FK</tspan> foreign key   | one   ⋲ many</text>
  <text x="0" y="118" class="legend">Every table has user_id → users.id (cascade).</text>
  <text x="0" y="138" class="legend">Only two of those links are drawn, to keep it readable.</text>
  <text x="0" y="166" class="legend">History and stats are not tables —</text>
  <text x="0" y="186" class="legend">they are computed from focus_sessions.</text>
</g>
</svg>`;

const out = join(dirname(fileURLToPath(import.meta.url)), 'schema.svg');
writeFileSync(out, svg);
console.log('wrote', out);

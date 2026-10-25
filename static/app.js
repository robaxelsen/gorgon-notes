/* Gorgon Notes app. Vanilla JS, no build step. Sections: core, health, session, vendors, storage, character, reminders, main. */
'use strict';

/* ===================== core ===================== */
/* Core: constants, preview modes, storage, fetch layer, formatting, glyphs. */

const APP_NAME = 'Gorgon Notes';
const FAN_LINE = 'fan-made, not affiliated with Elder Game';
const VIEWS = ['session', 'combat', 'vendors', 'storage', 'character', 'files'];
const VIEW_TITLE = { session: 'Session', combat: 'Combat', vendors: 'Vendors', storage: 'Storage', character: 'Character', files: 'Files' };
const FAVOR = ['Despised', 'Hated', 'Disliked', 'Tolerated', 'Neutral', 'Comfortable', 'Friends', 'CloseFriends', 'BestFriends', 'LikeFamily', 'SoulMates'];
const FAVOR_LABEL = { CloseFriends: 'Close Friends', BestFriends: 'Best Friends', LikeFamily: 'Like Family', SoulMates: 'Soul Mates' };
const DEFAULT_CHANS = ['Status', 'Guild', 'Nearby', 'Error', 'System'];
const CDN_FALLBACK = '488';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Block writes. Polling re-renders every 30-60 s, so a block is only rebuilt
   when its markup changed (no idle DOM churn, scroll and selection survive),
   and when it is rebuilt, keyboard focus goes back to the same control
   instead of falling to <body> (WCAG 2.4.3). Render code writes `el.html = …`. */
const lastHTML = new WeakMap();
const FOCUS_ATTRS = ['data-sort', 'data-zarea', 'data-zback', 'data-zmore', 'data-table', 'data-area', 'data-npc', 'data-vault', 'data-loc', 'data-type', 'data-sec', 'data-fold',
  'data-fix', 'data-chan', 'data-clear', 'data-sclear', 'data-newest', 'data-notnow', 'data-retry', 'data-w', 'data-m', 'data-s',
  'data-path', 'data-file', 'data-fmore', 'data-crumb', 'data-copy', 'data-hit', 'data-fight', 'data-dminor'];
function focusKey(el, root) {
  if (el.id) return '#' + CSS.escape(el.id);
  const attrs = FOCUS_ATTRS.filter(a => el.hasAttribute(a)).map(a => `[${a}="${CSS.escape(el.getAttribute(a))}"]`);
  if (attrs.length) return el.tagName.toLowerCase() + attrs.join('');
  const host = el.parentElement?.closest('[id]');
  if (host && host !== root && root.contains(host)) return `#${CSS.escape(host.id)} ${el.tagName.toLowerCase()}`;
  return null;
}
function setHTML(el, html, force = false) {
  if (!el) return false;
  html = String(html);
  const prev = lastHTML.get(el);
  // Skip only when this exact markup was written last AND nothing rewrote the block since.
  if (!force && prev && prev.src === html && prev.out === el.innerHTML) return false;
  const a = document.activeElement;
  const key = a && a !== el && el.contains(a) ? focusKey(a, el) : null;
  el.innerHTML = html;
  lastHTML.set(el, { src: html, out: el.innerHTML });
  if (key && !el.contains(document.activeElement)) {
    let t = null;
    try { t = el.querySelector(key); } catch { }
    t?.focus({ preventScroll: true });
  }
  return true;
}
Object.defineProperty(Element.prototype, 'html', { configurable: true, set(v) { setHTML(this, v); }, get() { return this.innerHTML; } });

/* ---------- preview modes (browser only; never forwarded) ---------- */
const PREVIEW = (() => {
  const q = new URLSearchParams(location.search);
  const out = { shift: 0, sim: null, theme: null, notes: [], active: false };
  if (q.has('shift')) {
    const n = Number(q.get('shift'));
    if (Number.isFinite(n) && n >= 1 && n <= 720) out.shift = n; else out.notes.push(`unknown shift value '${q.get('shift')}', ignored`);
  }
  if (q.has('sim')) {
    const v = q.get('sim');
    if (['stale', 'broken', 'nolog', 'noexport', 'loading', 'down'].includes(v)) out.sim = v; else out.notes.push(`unknown sim value '${v}', ignored`);
  }
  if (q.has('theme')) {
    const v = q.get('theme');
    if (['dark', 'daylight', 'auto'].includes(v)) out.theme = v; else out.notes.push(`unknown theme value '${v}', ignored`);
  }
  out.active = !!(out.shift || out.sim || out.notes.length);
  return out;
})();
const NOW = () => Date.now() + PREVIEW.shift * 3600e3;

/* ---------- localStorage (try/catch; never required) ---------- */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : v; } catch { return fallback; }
  },
  json(key, fallback) {
    try { const v = localStorage.getItem(key); if (v == null) return fallback; const p = JSON.parse(v); return p ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    if (PREVIEW.active) return; // a preview never writes settings
    try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch { /* storage blocked */ }
  },
  del(key) { if (PREVIEW.active) return; try { localStorage.removeItem(key); } catch { } },
};

function migrateStorage() {
  if (PREVIEW.active || store.get('pgdash.migrated') === '1') return;
  try {
    const tab = localStorage.getItem('tab');
    if (tab === 'vendors' || tab === 'storage' || tab === 'character' || tab === 'session' || tab === 'files') localStorage.setItem('pgdash.tab', tab);
    const scope = localStorage.getItem('scope');
    if (scope === 'day' || scope === 'login') localStorage.setItem('pgdash.xpScope', scope);
    const chans = JSON.parse(localStorage.getItem('chans') || 'null');
    if (Array.isArray(chans)) localStorage.setItem('pgdash.chans', JSON.stringify(chans.filter(c => typeof c === 'string' && !c.includes(':'))));
    ['tab', 'scope', 'chans'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('pgdash.migrated', '1');
  } catch { /* ignore */ }
}

/* ---------- formatting ---------- */
const fmt = n => n == null || Number.isNaN(n) ? '—' : Math.round(n).toLocaleString('en-US');
const short = n => n == null ? '—' : Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.abs(n) >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : fmt(n);
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : (many || one + 's')}`;
const favorLabel = f => !f ? '' : FAVOR_LABEL[f] || String(f).replace(/([a-z])([A-Z])/g, '$1 $2');
const favorRank = f => FAVOR.indexOf(f);
const pretty = s => String(s || '').replace(/^NPC_/, '').replace(/^\*AccountStorage_/, 'Account: ').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
const typeLabel = t => String(t || '').replace(/([a-z])([A-Z])/g, '$1 $2');
const joinNames = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = n => String(n).padStart(2, '0');
const hhmm = t => { const d = new Date(t); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const dayMon = t => { const d = new Date(t); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const dateTime = t => `${dayMon(t)} ${hhmm(t)}`;
const isToday = t => { const a = new Date(t), b = new Date(NOW()); return a.toDateString() === b.toDateString(); };
function parseChatTs(ts) { if (!ts) return null; const [d, t] = ts.split(' '); const [y, m, dd] = d.split('-'); return new Date(`20${y}-${m}-${dd}T${t}`).getTime(); }
function parseUtc(ts) { if (!ts) return null; const t = Date.parse(ts.replace(' ', 'T').replace(/Z?$/, 'Z')); return Number.isNaN(t) ? null : t; }
function parseIso(ts) { if (!ts) return null; const t = Date.parse(ts); return Number.isNaN(t) ? null : t; }
function ago(t) {
  if (t == null) return '';
  const s = (NOW() - t) / 1000;
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
const ageWord = sec => sec == null ? '' : sec < 3600 ? `${Math.max(1, Math.floor(sec / 60))} min` : sec < 86400 ? `${Math.floor(sec / 3600)} h` : `${Math.floor(sec / 86400)} d`;
// Long form for sentences: "1 day", "3 days", "2 hours", "1 minute".
const ageLong = sec => ageWord(sec).replace(/^(\d+) (min|h|d)$/, (_, n, u) => `${n} ${{ min: 'minute', h: 'hour', d: 'day' }[u]}${n === '1' ? '' : 's'}`);
function dur(ms) {
  if (ms <= 0) return 'now';
  const m = Math.round(ms / 60000);
  const nb = '\u00a0'; // a duration never breaks across lines
  if (m < 60) return `${m}${nb}min`;
  const h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d) return `${d}${nb}d${nb}${h % 24}${nb}h`;
  return `${h}${nb}h${nb}${m % 60}${nb}min`;
}

/* ---------- glyphs (inline SVG drawn for this app) ---------- */
const SHAPE_LABEL = { ok: 'OK', info: 'Note', warn: 'Stale', bad: 'Broken' };
function shape(sev, cls = '') {
  const label = SHAPE_LABEL[sev] || sev;
  const c = `shape sev-${sev} ${cls}`;
  if (sev === 'warn') return `<svg class="${c}" viewBox="0 0 16 16" role="img" aria-label="${label}"><path d="M8 1.2 15.3 14H.7z" fill="currentColor"/><path d="M7.2 5.5h1.6l-.25 4.6h-1.1zM8 11.2a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9z" fill="var(--window, #1E1818)"/></svg>`;
  if (sev === 'bad') return `<svg class="${c}" viewBox="0 0 16 16" role="img" aria-label="${label}"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="currentColor"/><path d="m5.2 5.2 5.6 5.6m0-5.6-5.6 5.6" stroke="var(--window, #1E1818)" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  if (sev === 'info') return `<svg class="${c}" viewBox="0 0 16 16" role="img" aria-label="${label}"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 7v4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="4.8" r="1" fill="currentColor"/></svg>`;
  return `<svg class="${c}" viewBox="0 0 16 16" role="img" aria-label="${label}"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m5.2 8.2 1.9 1.9 3.8-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const COIN = '<svg class="coin" viewBox="0 0 16 16" aria-hidden="true"><circle class="face" cx="8" cy="8" r="6.5"/><circle class="rim" cx="8" cy="8" r="6.5"/><circle cx="8" cy="8" r="3.6" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1"/></svg>';
/* UI carets are drawn, not typed: 10 px inline SVG in currentColor. */
const CARET = dir => {
  const d = { down: 'M1 3h8L5 8z', up: 'M1 7h8L5 2z', right: 'M3 1v8l5-4z' }[dir];
  return `<svg class="glyph" viewBox="0 0 10 10" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
};
const TRI = open => `<span class="tri" aria-hidden="true">${CARET(open ? 'down' : 'right')}</span>`;
const ARR = dir => `<span class="arr" aria-hidden="true">${CARET(dir === 'asc' ? 'up' : 'down')}</span>`;

/* ---------- state ---------- */
const S = {
  view: 'session',
  character: null,          // selected character (exports)
  health: null,             // raw /api/health
  healthMode: null,         // 'server' | 'browser'
  healthAt: null,
  verdicts: [],             // merged verdict list
  session: null, sessionAt: null,
  combat: null, combatAt: null, combatOld: false, // /api/combat (DPS meter); combatOld = the server has no such endpoint
  party: null, partyOld: false,                   // /api/party (fight sharing over ntfy.sh); partyOld = no such endpoint
  scope: 'day',
  reports: null,
  vendors: null, vendorsAt: null,
  zone: null, zoneAt: null, zoneArea: null, // /api/zone for the current (or picked next-door) area
  storage: null, storageAt: null,
  merge: null, mergeAt: null, mergeOld: false, // /api/consolidation (split stacks); mergeOld = the server has no such endpoint
  plan: null, planAt: null, planOld: false,    // /api/plan (sell and store); planOld = the server has no such endpoint
  charFile: null, charPicked: false, charData: null,
  itemsFile: null, itemsPicked: false, itemsData: null,
  icons: { base: null, byName: {}, byTypeId: {}, byType: {} },
  lookup: { quests: {}, powers: {} },
  errors: {},
  lastGood: {},
  down: false, downSince: null,
  firstRound: true,
  loading: true,
};
function cdnVersion() { const v = String(S.health?.cdnVersion || S.vendors?.cdnVersion || S.storage?.cdnVersion || ''); return /^\d{1,6}$/.test(v) ? v : CDN_FALLBACK; }
function iconUrl(id) { return id == null ? null : `https://cdn.projectgorgon.com/v${cdnVersion()}/icons/icon_${id}.png`; }
const ICON_FAILED = new Set();
/* No icon: an empty slot, or, given a name, a slot holding its initial (vendors whose goods have no art). */
function iconImg(id, size, alt = '', letter = '') {
  const u = iconUrl(id);
  const ch = esc(String(letter || '').trim().charAt(0).toUpperCase());
  const slot = q => `<span class=${q}slot${ch ? ' lettered' : ''}${q} style=${q}width:${size}px;height:${size}px${q} aria-hidden=${q}true${q}>${ch}</span>`;
  if (!u || ICON_FAILED.has(u)) return slot('"');
  // A failed URL is remembered, so the next render writes the slot itself and the block stops changing.
  return `<img class="ico" src="${esc(u)}" width="${size}" height="${size}" loading="lazy" decoding="async" alt="${esc(alt)}" onerror="ICON_FAILED.add(this.src);this.outerHTML='${slot('&quot;')}'">`;
}

/* ---------- fetch layer with preview overrides ---------- */
let roundsDone = 0;
const never = () => new Promise(() => { });
async function api(path, opts) {
  if (PREVIEW.sim === 'loading') return never();
  // Icons and names are game metadata the first real round asked for; the preview keeps them so slots don't empty out.
  if (PREVIEW.sim === 'down' && roundsDone >= 1 && !/^\/api\/(icons|lookup)/.test(path)) throw new TypeError('preview: server not answering');
  if (PREVIEW.sim === 'nolog') {
    if (path.startsWith('/api/session')) return {};
    if (path.startsWith('/api/combat')) return {};
    if (path.startsWith('/api/tail')) return { lines: [] };
  }
  if (PREVIEW.sim === 'noexport') {
    if (path.startsWith('/api/vendors')) return { error: 'no character export' };
    if (path.startsWith('/api/storage')) return { error: 'no items export' };
    if (path.startsWith('/api/consolidation')) return { error: 'no items export' };
  }
  const r = await fetch(path, opts);
  let body;
  // mtimeNs (a 19-digit st_mtime_ns) is past 2^53, so it is kept as a string: the server compares it as text.
  try { body = JSON.parse((await r.text()).replace(/"mtimeNs":\s*(\d+)/g, '"mtimeNs": "$1"')); } catch { const e = new Error(`bad JSON from ${path}`); e.status = r.status; throw e; }
  if (!r.ok) { const e = new Error(body?.error || `HTTP ${r.status}`); e.status = r.status; e.body = body; throw e; }
  if (PREVIEW.sim === 'noexport' && path.startsWith('/api/reports') && Array.isArray(body)) {
    // The first /api/reports call runs before pickCharacter(), so resolve the character the same way it will.
    const who = S.character || store.get('pgdash.character', null) || S.session?.character || S.health?.game?.character;
    return body.filter(x => x.character !== who && x.character !== '???');
  }
  if (PREVIEW.sim === 'noexport' && path.startsWith('/api/files') && Array.isArray(body?.files)) {
    const who = S.character || store.get('pgdash.character', null) || S.session?.character || S.health?.game?.character;
    return { ...body, files: body.files.filter(x => x.group !== 'reports' || (x.character !== who && x.character !== '???')) };
  }
  if (PREVIEW.sim === 'nolog' && path.startsWith('/api/files') && Array.isArray(body?.files)) return { ...body, files: body.files.filter(x => x.group !== 'logs') };
  return body;
}
function isNetworkError(e) { return e instanceof TypeError || (e && e.status >= 500 && !e.body); }

/* ---------- fix wording (one source of truth) ---------- */
function loggedIn() {
  const g = S.health?.game;
  if (g && typeof g.loggedIn === 'boolean') return g.loggedIn;
  if (S.session && typeof S.session.loggedIn === 'boolean') return S.session.loggedIn;
  return !!S.session?.live;
}
function fixText(key, args = {}, opts = {}) {
  const inGame = opts.short || loggedIn();
  const T = {
    'export-character': ['VIP menu → Export Character JSON', "Next time you're in game: VIP menu → Export Character JSON, while fully logged in"],
    'export-storage': ['VIP menu → Export Storage JSON', "Next time you're in game: VIP menu → Export Storage JSON"],
    'export-again': ['Export again while fully logged in, not right before logout: VIP menu → Export Character JSON', "Next time you're in game: VIP menu → Export Character JSON, while fully logged in"],
    'chat-logging': ['Settings → GUI → Log All Chat'],
    'chat-logging-ok': ['If it ever stops: Settings → GUI → Log All Chat'],
    // No storage export: there is no Slots column to type into yet, so the fix names the export first.
    'vault-size': [`${storageMissing() ? 'After a storage export: check' : 'Check'} the size in game, then type it in the Slots column${S.view === 'storage' ? '' : ' on Storage'}`],
    'alt-export': [`Next time you play ${args.alt || 'that character'}: VIP menu → Export Character JSON and Export Storage JSON`],
    'auto-export': ['Nothing to do.'],
    'combat-logging': [S.view === 'combat' ? 'Combat logging settings in game (names not verified yet). The meter needs every combat log category fully on.' : 'Combat logging settings in game (names not verified yet). Deaths still count; kills and killers need it.'],
    'player-log': ['Nothing to do. Exports cover it.'],
    'vip': ['Exports need VIP. Check your VIP status in game.'],
    'server': ['Start it again: python3 server.py'],
  }[key];
  if (!T) return '';
  return (!inGame && T[1]) ? T[1] : T[0];
}
/* Plaque copy for fixes that need a game action. */
function plaqueFor(key) {
  const inGame = loggedIn();
  const map = {
    'export-character': ['Export Character JSON', inGame ? 'In game: VIP menu, while fully logged in' : "Next time you're in game: VIP menu, while fully logged in"],
    'export-again': ['Export Character JSON again', inGame ? 'In game: VIP menu, while fully logged in, not right before logout' : "Next time you're in game: VIP menu, while fully logged in"],
    'export-storage': ['Export Storage JSON', inGame ? 'In game: VIP menu' : "Next time you're in game: VIP menu"],
    'chat-logging': ['Log All Chat', 'In game: Settings → GUI → Log All Chat'],
    'vault-size': ['Type in the vault size', `${storageMissing() ? 'After a storage export: check' : 'Check'} it in game, then enter it in the Slots column${S.view === 'storage' ? '' : ' on Storage'}`],
  };
  return map[key] || null;
}

/* ===================== health ===================== */
/* Data health: one verdict list drives every surface (margin, footers, stamp, pill, rail, tab title, favicon). */

const SEV_RANK = { ok: 0, info: 1, warn: 2, bad: 3 };
const worstOf = list => list.reduce((w, v) => SEV_RANK[v.severity] > SEV_RANK[w] ? v.severity : w, 'ok');
const DEFAULT_THRESH = { 'character-export': 86400, 'storage-export': 172800, 'chat-silence': 900, 'alt-stale': 604800 };
const NEEDS_SERVER = 'Not checked here: activity since your exports, game settings, alts that never exported, VIP, game version. They need a newer server.py.';

async function loadHealth() {
  const who = S.character ? `?character=${encodeURIComponent(S.character)}` : '';
  try {
    const h = await api('/api/health' + who);
    if (h && h.version === 1) { S.health = h; S.healthMode = 'server'; }
    else { S.health = null; S.healthMode = 'browser'; }
  } catch (e) {
    if (isNetworkError(e) && !(e.status === 404)) throw e;
    S.health = null; S.healthMode = 'browser';
  }
  S.healthAt = NOW();
}

/* Build the browser-only fallback list from the older endpoints. */
function browserVerdicts() {
  const out = [];
  const add = (o) => out.push({ fixArgs: {}, evidenceData: {}, views: [], serverOnly: false, ...o, topic: o.topic || o.source, id: o.id || o.source });
  const s = S.session;
  const hasLog = s && s.log;
  if (!hasLog) {
    add({ source: 'game', severity: 'info', title: 'Game', evidence: 'Not known without a chat log.', unknown: true });
    add({ source: 'chat-log', severity: 'bad', title: 'Chat log', evidence: 'No chat log found. The game only writes one with Log All Chat on.', fixKey: 'chat-logging', views: VIEWS.slice() }); // includes files
  } else {
    const lastAt = parseIso(s.lastLineAt) || (s.xpTimeline?.length ? parseChatTs(s.xpTimeline.at(-1)[0]) : null);
    const li = typeof s.loggedIn === 'boolean' ? s.loggedIn : s.live;
    add({ source: 'game', severity: li && s.live ? 'ok' : 'info', title: 'Game', evidence: li ? `Logged in as ${s.character || '?'}.` : (s.loggedOutAt ? `Logged out ${hhmm(parseIso(s.loggedOutAt))}.` : 'Not logged in.') });
    if (li && !s.live) add({ source: 'chat-log', severity: 'warn', title: 'Chat log', evidence: 'Logged in but nothing was written for 15 minutes.', fixKey: 'chat-logging', views: ['session', 'combat', 'files'], at: lastAt ? new Date(lastAt).toISOString() : null });
    else add({ source: 'chat-log', severity: 'ok', title: 'Chat log', evidence: s.live ? 'The log is being written.' : 'The log was written last session. It fills in next time you play.', fixKey: 'chat-logging-ok', views: ['session', 'combat', 'files'], at: lastAt ? new Date(lastAt).toISOString() : null });
  }
  const reps = S.reports || [];
  const who = S.character;
  const newest = kind => reps.filter(r => r.report === kind && r.character === who).sort((a, b) => parseUtc(b.timestamp) - parseUtc(a.timestamp))[0];
  const cr = newest('CharacterSheet'), sr = newest('Storage');
  const expItem = (src, rep, thr, label, fixKey, views) => {
    if (!rep) return add({ source: src, id: `${src}:${who}`, severity: 'bad', title: label, evidence: `No ${label.toLowerCase()} for ${who} yet.`, fixKey, views });
    const at = parseUtc(rep.timestamp), age = (NOW() - at) / 1000;
    add({ source: src, id: `${src}:${who}`, severity: age >= thr ? 'warn' : 'ok', title: label, at: new Date(at).toISOString(),
      evidence: (age >= thr ? `It's ${ageWord(age)} old. ` : '') + 'Activity since export: not checked.', fixKey, views, file: rep.file });
  };
  // 'files' mirrors the server's FILES_SOURCES: the Files view lists every source it reads a file from.
  expItem('character-export', cr, DEFAULT_THRESH['character-export'], 'Character export', 'export-character', ['vendors', 'character', 'storage', 'files']);
  expItem('storage-export', sr, DEFAULT_THRESH['storage-export'], 'Storage export', 'export-storage', ['storage', 'files']);
  const partials = reps.filter(r => r.report === 'CharacterSheet' && r.character === '???');
  if (partials.length) {
    const p = partials.sort((a, b) => parseUtc(b.timestamp) - parseUtc(a.timestamp))[0], pt = parseUtc(p.timestamp);
    const goods = reps.filter(r => r.report === 'CharacterSheet' && r.character && r.character !== '???');
    const twin = goods.find(g => Math.abs(parseUtc(g.timestamp) - pt) <= 120e3);
    const newer = goods.some(g => g.character === who && parseUtc(g.timestamp) > pt);
    if (twin || newer) add({ source: 'partial-export', severity: 'info', title: 'Partial export', at: new Date(pt).toISOString(), views: ['character', 'files'],
      evidence: twin ? `At logout the game also wrote a second, incomplete copy of your export (${Math.round(Math.abs(parseUtc(twin.timestamp) - pt) / 1000)} s after the good one). It's ignored; the good one is in use.` : 'An older partial export is ignored.' });
    else add({ source: 'partial-export', severity: 'bad', title: 'Partial export', at: new Date(pt).toISOString(), views: ['character', 'vendors', 'storage', 'files'], fixKey: 'export-again',
      evidence: 'That export came out a bit… partial (name "???"). Export again while fully logged in.' });
  } else add({ source: 'partial-export', severity: 'ok', title: 'Partial export', evidence: 'No partial exports.' });
  const alts = [...new Set(reps.map(r => r.character).filter(c => c && c !== '???' && c !== who))];
  for (const a of alts) {
    const t = Math.max(...reps.filter(r => r.character === a).map(r => parseUtc(r.timestamp) || 0));
    if ((NOW() - t) / 1000 > DEFAULT_THRESH['alt-stale']) add({ source: 'alt-stale', id: `alt-stale:${a}`, severity: 'info', title: `${a}'s exports`, at: new Date(t).toISOString(), evidence: `${a}'s newest export is from ${dayMon(t)}.`, fixKey: 'alt-export', fixArgs: { alt: a }, views: ['character', 'files'] });
  }
  const vaults = S.storage?.vaults || [];
  if (vaults.length) {
    const unknown = vaults.filter(v => v.capacity == null).map(v => v.name), manual = vaults.filter(v => v.capacitySource === 'manual').map(v => v.name);
    if (unknown.length) add({ source: 'vault-sizes', severity: 'warn', title: 'Vault sizes', evidence: `${plural(unknown.length, 'vault')} with no known size.`, fixKey: 'vault-size', views: ['storage', 'files'] });
    else if (manual.length) add({ source: 'vault-sizes', severity: 'info', title: 'Vault sizes', evidence: `${plural(manual.length, 'size')} typed in by you. The game doesn't publish them.`, fixKey: 'vault-size', views: ['storage', 'files'] });
    else add({ source: 'vault-sizes', severity: 'ok', title: 'Vault sizes', evidence: 'All known.', fixKey: 'vault-size', views: ['storage', 'files'] });
  }
  return out;
}

/* Merge server + browser, tick ages, apply previews. */
function computeVerdicts() {
  let list;
  const thr = { ...DEFAULT_THRESH, ...(S.health?.thresholds || {}) };
  if (S.healthMode === 'server' && S.health) {
    list = S.health.items.map(i => ({ ...i }));
    for (const v of list) {
      if (!v.at) continue;
      const at = parseIso(v.at);
      v.ageSec = Math.max(0, Math.round((NOW() - at) / 1000));
      const t = thr[v.source];
      if (t && (v.source === 'character-export' || v.source === 'storage-export') && v.severity === 'ok' && v.ageSec >= t) {
        v.severity = 'warn';
        v.evidence = `It's ${ageWord(v.ageSec)} old.`;
        if (!v.views.includes('vendors') && v.source === 'storage-export') v.views = [...v.views, 'vendors'];
      }
    }
  } else {
    list = browserVerdicts();
    for (const v of list) if (v.at) v.ageSec = Math.max(0, Math.round((NOW() - parseIso(v.at)) / 1000));
  }
  // Preview overrides (browser only).
  const ov = (src, f) => list.filter(v => v.source === src).forEach(f);
  if (PREVIEW.sim === 'stale') {
    ['character-export', 'storage-export'].forEach(src => ov(src, v => {
      if (v.severity === 'bad') return;
      v.severity = 'warn'; v.ageSec = 259200; v.at = new Date(NOW() - 259200e3).toISOString();
      v.evidence = 'Preview: pretending this export is 3 days old.';
      if (src === 'storage-export' && !v.views.includes('vendors')) v.views = [...v.views, 'vendors'];
    }));
  }
  if (PREVIEW.sim === 'broken') ov('partial-export', v => { v.severity = 'bad'; v.fixKey = 'export-again'; v.views = ['character', 'vendors', 'storage']; v.evidence = 'That export came out a bit… partial (name "???"). Export again while fully logged in.'; });
  if (PREVIEW.sim === 'nolog') {
    ov('chat-log', v => { v.severity = 'bad'; v.evidence = 'No chat log found. The game only writes one with Log All Chat on.'; v.fixKey = 'chat-logging'; v.views = ['session', 'combat', 'files']; v.at = null; v.ageSec = null; });
    ov('game', v => { v.severity = 'info'; v.evidence = 'Not known without a chat log.'; v.unknown = true; });
  }
  if (PREVIEW.sim === 'noexport') {
    ['character-export', 'storage-export'].forEach(src => ov(src, v => {
      v.severity = 'bad'; v.at = null; v.ageSec = null; v.file = null;
      v.evidence = `No ${v.title.toLowerCase()} for ${S.character || 'this character'} yet.`;
      v.views = src === 'character-export' ? ['vendors', 'character', 'storage'] : ['storage', 'vendors'];
    }));
    ov('partial-export', v => { v.severity = 'ok'; v.evidence = 'No partial exports.'; v.views = []; });
    // The server adds no vault-sizes item without vaults, so the preview drops the real one too.
    list = list.filter(v => v.source !== 'vault-sizes');
  }
  // Browser-only items.
  list.push(S.down
    ? { id: 'server', source: 'server', severity: 'bad', title: 'Server', evidence: `The dashboard server isn't answering. Last good data is from ${hhmm(S.downSince || NOW())}.`, fixKey: 'server', views: VIEWS.slice(), topic: 'server', fixArgs: {} }
    : { id: 'server', source: 'server', severity: 'ok', title: 'Server', evidence: 'Answering.', views: [], topic: 'server', fixArgs: {} });
  const picked = [];
  if (S.charPicked && S.charFile && S.charFile !== newestCharFile()) picked.push('character');
  if (S.itemsPicked && S.itemsFile && S.itemsFile !== newestItemsFile()) picked.push('storage');
  if (picked.length) list.push({ id: 'selected-export', source: 'selected-export', severity: 'info', title: 'Older export picked', views: picked, topic: 'selected-export', fixArgs: {},
    evidence: 'You picked an older export on purpose. Newer numbers exist.' });
  S.verdicts = list;
  return list;
}
const V = src => {
  const all = S.verdicts.filter(v => v.source === src);
  if (!all.length) return null;
  return all.reduce((w, v) => SEV_RANK[v.severity] > SEV_RANK[w.severity] ? v : w, all[0]);
};
const sevOf = src => V(src)?.severity || 'ok';

/* ---------- per-view margin ---------- */
const PHONE_MQ = window.matchMedia('(max-width: 767px)');
const FOLD_NAME = { 'game': 'game state', 'chat-log': 'chat log', 'character-export': 'character export', 'storage-export': 'storage export', 'partial-export': 'partial exports',
  'auto-export': 'logout export setting', 'vault-sizes': 'vault sizes', 'alt-stale': 'alts', 'alt-missing': 'alts', 'combat-logging': 'combat logging', 'player-log': 'live game events',
  'vip': 'VIP', 'server': 'server', 'cdn': 'game data', 'selected-export': 'picked export' };
function foldLabel(v) {
  const n = FOLD_NAME[v.source] || v.source;
  if (v.source === 'chat-log') return `${n} (${S.session?.live ? 'live' : v.ageSec != null ? ageWord(v.ageSec) : v.severity})`;
  if (v.ageSec != null && /export/.test(v.source)) return `${n} (${ageWord(v.ageSec)})`;
  if (v.source === 'cdn') return `${n} (v${cdnVersion()})`;
  if (v.source === 'game') return `${n} (${v.unknown ? 'not known' : loggedIn() ? 'logged in' : 'logged out'})`;
  return n;
}
function viewItems(view) {
  const listed = [], folded = [];
  for (const v of S.verdicts) {
    if (v.severity === 'warn' || v.severity === 'bad' || (v.views || []).includes(view)) listed.push(v); else folded.push(v);
  }
  listed.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || (b.fixKey && plaqueFor(b.fixKey) ? 1 : 0) - (a.fixKey && plaqueFor(a.fixKey) ? 1 : 0));
  return { listed, folded };
}
const isMissing = v => v.severity === 'bad' && v.ageSec == null && v.source !== 'server' && /export|chat-log/.test(v.source);
function headerLine(list) {
  const c = { bad: 0, warn: 0, info: 0, missing: 0 };
  list.forEach(v => { if (isMissing(v)) c.missing++; else if (c[v.severity] != null) c[v.severity]++; });
  const parts = [];
  if (c.missing) parts.push(`${c.missing} missing`);
  if (c.bad) parts.push(`${c.bad} broken`);
  if (c.warn) parts.push(`${c.warn} to do`);
  let h = parts.length ? parts.join(' · ') : 'All sources recent';
  if (c.info) h += ` · ${plural(c.info, 'note')}`;
  return h;
}
function ageSpan(v, cls = 'age') {
  if (v.source === 'server') return '';
  if (v.severity === 'bad' && v.ageSec == null) return `<span class="${cls} bad">missing</span>`;
  if (v.ageSec == null) return '';
  const s = v.severity === 'warn' || v.severity === 'bad' ? v.severity : '';
  return `<span class="${cls} ${s}">${ago(NOW() - v.ageSec * 1000)}</span>`;
}

let plaqueInView = null; // fixKey of the plaque a primary window already shows on this view

function noteHtml(v) {
  const act = (v.severity === 'warn' || v.severity === 'bad') && v.fixKey && !(v.source === 'vault-sizes' && storageMissing()) && plaqueFor(v.fixKey);
  const snoozed = act && isSnoozed(v.topic);
  const fix = v.fixKey && !(v.source === 'vault-sizes' && storageMissing()) ? fixText(v.fixKey, v.fixArgs) : '';
  let fx = '';
  if (act && !snoozed && plaqueInView !== v.fixKey) {
    const [p1, p2] = plaqueFor(v.fixKey);
    fx = `<button type="button" class="plaque" data-fix="${esc(v.fixKey)}" aria-label="${esc(`${p1}. ${p2}. Then check again.`)}"><span class="p1">${esc(p1)}</span><span class="p2">${esc(p2)}</span></button>
      <div class="notnow"><button type="button" class="linkbtn" data-notnow="${esc(v.topic)}">Not now</button></div>`;
  } else if (fix) {
    const quiet = (v.severity === 'ok' || v.severity === 'info') && /^export|^chat-logging$/.test(v.fixKey);
    const shown = quiet ? 'To refresh: ' + fixText(v.fixKey, v.fixArgs, { short: true }) : fix;
    fx = `<div class="fx ${v.severity === 'warn' ? 'txt-warn' : v.severity === 'bad' ? 'txt-bad' : ''}">${esc(shown)}${snoozed ? ' · <span class="dim">snoozed</span>' : ''}</div>`;
  }
  return `<div class="note" data-src="${esc(v.source)}">${shape(v.severity)}<div class="nt">${esc(v.title)}${ageSpan(v) ? ' · ' + ageSpan(v) : ''}</div>
    <div class="ev">${esc(v.evidence)}</div>${fx ? `<div class="fx-wrap" style="grid-column:2">${fx}</div>` : ''}</div>`;
}

function renderMargin() {
  const view = S.view;
  const { listed, folded } = viewItems(view);
  const notes = listed.map(noteHtml);
  // Positive note: vendor resets since the export.
  if ((view === 'vendors') && S.vendors?.resetSummary?.count > 0) {
    const r = S.vendors.resetSummary;
    notes.push(`<div class="note positive"><span></span><div class="nt">${plural(r.count, 'vendor')} reset since the export</div><div class="ev">${fmt(r.restored)} councils already counted.</div></div>`);
  }
  if (S.healthMode === 'browser') notes.push(`<div class="note">${shape('info')}<div class="nt">Some checks skipped</div><div class="ev">${esc(NEEDS_SERVER)}</div></div>`);
  $('#mnotes').html = notes.join('');
  const worst = worstOf(listed);
  const anyAct = listed.some(v => v.severity === 'warn' || v.severity === 'bad');
  const m = $('#margin');
  const phone = PHONE_MQ.matches;
  if (phone) {
    if (m.dataset.userOpen == null) m.classList.toggle('collapsed', !anyAct);
  } else m.classList.remove('collapsed');
  const open = !m.classList.contains('collapsed');
  const checking = S.loading && !S.healthAt;
  const hl = checking ? 'Checking your sources…' : headerLine(listed);
  const hs = checking ? '' : shape(worst);
  // On a phone the whole summary row is the toggle (the only way into the fixes there).
  $('#mhead').html = phone
    ? `<button type="button" class="mtoggle" id="mtogg" aria-expanded="${open}" aria-controls="mnotes">${hs}<span>${esc(hl)}</span><span class="togg" aria-hidden="true">${open ? 'Hide' : 'Show'}</span></button>`
    : `${hs}<span>${esc(hl)}</span>`;
  const alsoNames = [...new Set(folded.filter(v => v.source !== 'server' || S.down).map(foldLabel))];
  $('#malso').hidden = !alsoNames.length;
  $('#malso').textContent = alsoNames.length ? `Also checked: ${alsoNames.join(', ')}` : '';
  const when = S.healthAt ? hhmm(S.healthAt) : '…';
  $('#mfoot').textContent = S.healthMode === 'server' ? `Checked ${when} · by the server` : S.healthMode === 'browser' ? `Checked ${when} · in the browser (some checks skipped)` : 'Checking…';
  if (S.down) $('#mfoot').html = `${shape('bad', 's13')} <span class="txt-bad">as of ${hhmm(S.downSince)} · server not answering</span>`;
}

/* ---------- footers ---------- */
function setFoot(winId, left, right) {
  const f = document.querySelector(`#${winId} .win-foot`);
  if (!f) return;
  if (S.down && S.downSince) left = `${shape('bad', 's13')}<span class="txt-bad">as of ${hhmm(S.downSince)} · server not answering</span>`;
  f.querySelector('.fl').html = left || '';
  f.querySelector('.fr').html = right || '';
}
/* "Character export · 8 h ago" with severity treatment. */
function srcAge(src, label) {
  const v = V(src);
  if (!v) return esc(label);
  if (v.severity === 'bad' && v.ageSec == null) return `${esc(label)} · ${shape('bad', 's13')}<span class="age bad">missing</span>`;
  const a = v.ageSec != null ? ago(NOW() - v.ageSec * 1000) : '';
  if (v.severity === 'warn' || v.severity === 'bad') return `${esc(label)} · ${shape(v.severity, 's13')}<span class="age ${v.severity}">${a}</span>`;
  return `${esc(label)}${a ? ' · ' + a : ''}`;
}
function srcFix(src, when) {
  const v = V(src);
  if (!v || !v.fixKey) return '';
  if (v.severity === 'ok' || v.severity === 'info') {
    if (!/^export/.test(v.fixKey)) return '';
    return `<span>${esc('To refresh: ' + fixText(v.fixKey, v.fixArgs, { short: true }))}</span>`;
  }
  const t = fixText(v.fixKey, v.fixArgs);
  const cls = v.severity === 'warn' ? 'txt-warn' : 'txt-bad';
  return `<span class="${cls}">${esc((loggedIn() && when ? when + ' ' : '') + t)}</span>`;
}
function chatLive() {
  const s = S.session, v = V('chat-log');
  if (S.loading && !s) return 'Chat log · reading…';
  if (!s || !s.log || v?.severity === 'bad') return `Chat log · ${shape('bad', 's13')}<span class="age bad">missing</span>`;
  const last = parseIso(s.lastLineAt) || (s.xpTimeline?.length ? parseChatTs(s.xpTimeline.at(-1)[0]) : null);
  const li = loggedIn();
  if (li && s.live) return `Chat log · live${last ? ' · last line ' + hhmm(last) : ''}`;
  if (li && v?.severity === 'warn') return `Chat log · ${shape('warn', 's13')}<span class="age warn">silent since ${last ? hhmm(last) : '?'}</span>`;
  return `Chat log · last line ${last ? (isToday(last) ? hhmm(last) : dateTime(last)) : '?'} · logged out`;
}

/* ---------- stamp ---------- */
function setStamp(l1, l2, sev) {
  const st = $('#stamp');
  st.className = 'stamp' + (sev === 'warn' || sev === 'bad' ? ' ' + sev : '');
  st.html = `<div class="l1">${l1}</div><div class="l2">${sev === 'warn' || sev === 'bad' ? shape(sev, 's13') : ''}<span>${l2}</span></div>`;
}
function exportStamp(src, kind) {
  const v = V(src);
  if (S.down && S.downSince) return setStamp(`Copied from the ${kind} export`, `as of ${hhmm(S.downSince)}`, 'bad');
  if (!v && S.loading && !S.healthAt) return setStamp(`Copied from the ${kind} export`, '…', 'ok');  // health not answered yet: no false "missing"
  if (!v || (v.severity === 'bad' && v.ageSec == null)) return setStamp(`No ${kind} export found`, 'missing', 'bad');
  const at = NOW() - v.ageSec * 1000;
  setStamp(`Copied from the ${kind} export of ${dayMon(at)}, ${hhmm(at)}`, ago(at), v.severity === 'warn' || v.severity === 'bad' ? v.severity : 'ok');
}

/* ---------- shell surfaces: pill, rail marks, tab title, favicon ---------- */
const FAVICONS = (() => {
  const mk = dot => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>${APP_NAME}</title><rect x="3.25" y="3.25" width="25.5" height="25.5" rx="6" fill="none" stroke="#DFC9A0" stroke-width="2.5"/><path d="M12 7h8l-4 5z" fill="#782A18"/><circle cx="24" cy="24" r="7" fill="#161111"/><circle cx="24" cy="24" r="6" fill="${dot}"/></svg>`);
  return { ok: mk('#99806C'), info: mk('#99806C'), warn: mk('#FFB300'), bad: mk('#FF5A5A') };
})();
let lastFavicon = null;
function renderShellHealth() {
  const all = S.verdicts;
  const worst = worstOf(all);
  const { listed } = viewItems(S.view);
  // Until the first round answers, say so: an empty list is not "All sources recent".
  const checking = S.loading && !S.healthAt;
  $('#pill-shape').html = checking ? '' : shape(worstOf(listed), 's13');
  $('#pill-text').textContent = checking ? 'Checking…' : headerLine(listed);
  for (const view of VIEWS) {
    const w = worstOf(all.filter(v => (v.severity === 'warn' || v.severity === 'bad') && (v.views || []).includes(view)));
    const el = document.querySelector(`[data-mark="${view}"]`);
    if (el) el.html = w === 'warn' || w === 'bad' ? shape(w, 'mark-shape').replace('class="shape', 'style="width:10px;height:10px;display:block" class="shape') : '';
  }
  const warns = all.filter(v => v.severity === 'warn').length;
  const badge = worst === 'bad' ? '(!) ' : warns ? `(${warns}) ` : '';
  document.title = `${badge}${VIEW_TITLE[S.view]} · ${APP_NAME}`;
  const fav = worst === 'bad' ? 'bad' : worst === 'warn' ? 'warn' : 'ok';
  if (fav !== lastFavicon) { $('#favicon').href = FAVICONS[fav]; lastFavicon = fav; }
}

/* ===================== session ===================== */
/* Session view: what did this session earn, and where did I go? */

const CHAN_COLOR = {
  'Global': 'var(--chat-global)', 'Nearby': 'var(--chat-nearby)', 'NPC Chatter': 'var(--chat-npc)', 'Tell': 'var(--chat-tell)',
  'Party': 'var(--chat-party)', 'Guild': 'var(--chat-guild)', 'Trade': 'var(--chat-trade)', 'Help': 'var(--chat-help)',
  'Emotes': 'var(--chat-emote)', 'Action Emotes': 'var(--chat-emote)', 'Error': 'var(--chat-error)', 'Status': '#FFBA7C',
};
const CHAN_RE = /^\[([^\]:]+)\] /;
const chanOf = msg => { const m = CHAN_RE.exec(msg); return m ? m[1] : 'System'; };

const sessUI = {
  lootSort: (store.json('pgdash.sort', {}).loot) || { key: 'count', dir: 'desc' },
  saved: (() => { const a = store.json('pgdash.chans', null); return Array.isArray(a) ? new Set(a) : null; })(),
  feed: [], tailLog: null, tailOffset: null, unseen: 0, chart: null,
  coinAll: false,  // Councils list: "Show all" toggled (not persisted)
  seq: 0,        // lines pushed into feed[] for the current log (monotonic)
  chanVer: 0,    // bumps when the channel filter changes
  shown: null,   // what #feed currently holds: { log, seq, chanVer } or 'empty'
};
function chanEnabled(c) {
  if (sessUI.saved) return sessUI.saved.has(c);
  return DEFAULT_CHANS.includes(c) || c === 'Tell' || c === 'Party';
}

async function loadSession() {
  const s = await api('/api/session?scope=' + S.scope);
  S.session = s || {};
  S.sessionAt = NOW();
  S.lastGood.session = NOW();
  if (!zUI.area || S.zoneArea !== zoneTarget()) await loadZone();
}

/* Current zone panel: NPCs where you are, with favor, councils left, storage and services. */
const zUI = { area: null, more: false }; // a next-door area picked to look at; null = where you are
const zoneTarget = () => zUI.area || S.session?.currentArea || null;
async function loadZone(force = false) {
  const area = zoneTarget();
  if (!area) { S.zone = null; S.zoneArea = null; return; }
  if (!force && area === S.zoneArea && S.zoneAt && NOW() - S.zoneAt < 55000) return;
  const q = `?area=${encodeURIComponent(area)}` + (S.character ? `&character=${encodeURIComponent(S.character)}` : '');
  try {
    S.zone = await api('/api/zone' + q); S.errors.zone = null; S.lastGood.zone = NOW();
  } catch (e) { if (isNetworkError(e)) throw e; S.errors.zone = e; S.zone = null; console.warn('zone', e); }
  S.zoneArea = area; S.zoneAt = NOW();
}
function renderZone() {
  const z = S.zone, s = S.session || {};
  const here = s.currentArea;
  const peek = zUI.area && zUI.area !== here;
  const box = $('#s-zone');
  const noLog = !sessionHasLog() && !(S.loading && !S.session);
  // Hidden only when the log is read but names no area (never logged in today); no chat log shows the needs line like the other windows.
  $('#w-s-zone').hidden = !here && !S.loading && !noLog;
  $('#t-s-zone').textContent = peek ? `Next door: ${zUI.area}` : here ? (loggedIn() ? `Here: ${here}` : `Last zone: ${here}`) : 'Here';
  $('#s-zone-tools').html = peek && here ? `<button type="button" class="linkbtn" data-zback="1" style="text-decoration:underline">Back to ${esc(here)}</button>` : '';
  const foot = () => {
    // The missing export wins; otherwise whichever is stale, storage first (it goes stale faster).
    const src = vendorsMissing() || sevOf('character-export') === 'bad' ? 'character-export' : ['storage-export', 'character-export'].find(k => ['warn', 'bad'].includes(sevOf(k))) || 'character-export';
    // A missing export gets the bare fix, like Vendors and Storage: "After selling:" is for a stale one.
    const missing = vendorsMissing() || (sevOf(src) === 'bad' && V(src)?.ageSec == null);
    setFoot('w-s-zone', `${srcAge('character-export', 'Character export')} · ${srcAge('storage-export', 'Storage export')}`, srcFix(src, missing ? '' : src === 'storage-export' ? 'After storing:' : 'After selling:'));
  };
  if (noLog) { box.html = '<p class="needs">Needs the chat log.</p>'; setFoot('w-s-zone', chatLive(), ['warn', 'bad'].includes(sevOf('chat-log')) ? srcFix('chat-log') : ''); return; }
  const current = S.zoneArea === zoneTarget();
  // A failed read is an error block like the other windows (red square + Retry); the repr stays in the console, never in copy.
  if (current && (S.errors.zone || z?.error)) { box.html = blockError('this zone', S.lastGood.zone); foot(); return; }
  if (!z || !current) { box.html = S.loading || here ? `<p class="needs">${peek ? `Reading ${esc(zUI.area)}…` : 'Reading where you are…'}</p>` : ''; foot(); return; }
  if (vendorsMissing()) { box.html = '<p class="needs">Needs the character export: favor and vendor councils come from it.</p>'; foot(); return; }
  if (z.matched === false) { box.html = `<p class="empty">Don't know <em class="t">${esc(z.area)}</em> yet: it isn't in game data v${esc(cdnVersion())}.</p>`; foot(); return; }
  const sm = z.summary || {};
  const where = peek || !loggedIn() ? 'there' : 'here';
  const resets = z.npcs.map(r => r.vendor?.resetsAt ? { name: r.name, t: parseUtc(r.vendor.resetsAt), back: r.vendor.spent } : null).filter(x => x && x.t > NOW()).sort((a, b) => a.t - b.t);
  const figs = [
    { lb: `Councils left ${where} ${ageMarkOf(V('character-export'))}`, val: `${COIN}${fmt(sm.councils || 0)}`, sub: sm.vendors ? `at ${plural(sm.vendors, 'vendor')}` : 'no vendors you sell to' },
    { lb: `Slots free ${where} ${ageMarkOf(V('storage-export'))}`, val: fmt(sm.free || 0), sub: sm.vaults ? `in ${plural(sm.vaults, 'vault')}` : 'no storage of yours' },
  ];
  if (resets.length) figs.push({ lb: `Next refill ${where}`, val: dur(resets[0].t - NOW()), sub: `${resets[0].name}, +${fmt(resets[0].back)}` });
  // "Caves" or "Dungeon" in the chat log fits more than one place; say which one this is.
  const guess = z.guessed && z.friendly && z.friendly !== z.area ? `<p class="small dim" style="margin-top:8px">The chat log only says <em class="t">${esc(z.area)}</em>, so this is a guess: <em class="t">${esc(z.friendly)}</em>.</p>` : '';
  const glance = `<div class="glance">${figs.map((f, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${f.lb}</div><div class="val">${f.val}</div><div class="sub">${esc(f.sub)}</div></div>`).join('')}</div>`;
  const row = r => {
    const v = r.vendor, st = r.vault;
    const vend = v ? (v.cap ? `<span class="left-fig">${COIN}<b>${fmt(v.remaining)}</b><span class="m-only"> left</span></span><div class="small">${v.remaining ? `of ${fmt(v.cap)}` : 'drained'}${v.resetsAt && parseUtc(v.resetsAt) > NOW() ? ` · refills ${dur(parseUtc(v.resetsAt) - NOW())}` : ''}</div>` : '<span class="small dim">not buying yet</span>') : '';
    const slots = st ? (st.capacity != null ? `<b>${fmt(Math.max(st.free, 0))}</b> free<div class="small">${fmt(st.used)} of ${fmt(st.capacity)} used</div>` : `${fmt(st.used)} used<div class="small">size unknown</div>`) : '';
    const buys = v?.buys ? 'Buys ' + v.buys.split(',').map(typeLabel).join(', ') : v?.cap ? 'Buys: see in game' : '';
    const what = [buys, ...r.services].filter(Boolean).join(' · ');
    const loves = r.loves.length ? `Loves ${r.loves.join(', ')}` : '';
    // Phone line: a chest row (no favor, no vendor) skips the slots, the figure cell already shows them.
    const line2 = [favorLabel(r.favor), v?.cap ? `${plural(v.remaining, 'council')} left` : '', st?.capacity != null && (v || r.favor) ? `${fmt(Math.max(st.free, 0))} slots free` : ''].filter(Boolean).join(' · ');
    return `<tr class="row"><td class="m1"><div class="nm">${esc(r.name)}</div>${what ? `<div class="small">${esc(what)}</div>` : ''}${loves ? `<div class="small dim">${esc(loves)}</div>` : ''}${r.notes ? `<div class="small dim">Note: ${esc(r.notes)}</div>` : ''}</td>
      <td>${esc(favorLabel(r.favor))}</td><td class="num${v ? ' m2' : ''}">${vend}</td><td class="num${v ? '' : ' m2'}">${slots}</td><td class="m-line2">${esc(line2)}</td></tr>`;
  };
  // Vendors and storage lead; trainers, barter and the rest fold away. On a phone a big zone (Serbule: 17 vendors) folds past the top 8 too.
  const key = z.npcs.filter(r => r.vendor || r.vault), other = z.npcs.filter(r => !r.vendor && !r.vault);
  const cap = matchMedia('(max-width: 639px)').matches ? 8 : key.length;
  const lead = key.slice(0, cap), folded = key.slice(cap).concat(other);
  const rows = lead.map(row).join('') + (zUI.more ? folded.map(row).join('') : '');
  const moreLabel = zUI.more ? (key.length > cap ? 'Show fewer' : 'Show only vendors and storage') : `Show ${plural(folded.length, 'more NPC')}${key.length > cap ? '' : ' (trainers, barter and others)'}`;
  const moreBtn = folded.length ? `<p style="margin-top:8px"><button type="button" class="linkbtn" data-zmore="1" style="text-decoration:underline">${moreLabel}</button></p>` : '';
  // No table without rows: when every met NPC folds (no vendor, no vault) the body is a sentence and the fold link still opens them.
  const table = rows
    ? `<table class="tbl resp-plain ztbl" style="margin-top:12px"><thead><tr><th>NPC</th><th>Favor</th><th class="num">Councils left</th><th class="num">Storage</th></tr></thead><tbody>${rows}</tbody></table>`
    : z.npcs.length
      ? `<p class="empty" style="margin-top:12px">No vendors or storage of yours ${where}. ${other.length <= 3 ? esc(joinNames(other.map(r => r.name))) : plural(other.length, "NPC you've met")} ${other.length === 1 ? 'is' : 'are'} ${where} but ${other.length === 1 ? 'buys' : 'buy'} and ${other.length === 1 ? 'stores' : 'store'} nothing.</p>`
      : `<p class="empty" style="margin-top:12px">Nobody ${where} you've met, and none of your storage. Quiet place.</p>`;
  const unmet = z.unmet ? `<p class="small dim" style="margin-top:8px">${plural(z.unmet, 'more NPC')} ${where} you haven't met yet.</p>` : '';
  const adj = (z.adjacent || []).filter(a => a.councils || a.free);
  // Each neighbour (separator, link, figures) is one no-wrap unit so a phone never splits "Rahu" from its "75,458 · 68 slots".
  const next = adj.length ? `<p style="margin-top:12px"><span class="dim">Next door:</span> ${adj.map((a, i) => `<span class="zadj">${i ? '<span class="dim">· </span>' : ''}<button type="button" class="linkbtn" data-zarea="${esc(a.name)}" style="text-decoration:underline">${esc(a.name)}</button> <span class="small">${[a.councils ? `${COIN}${fmt(a.councils)}` : '', a.free ? `${fmt(a.free)} slots` : ''].filter(Boolean).join(' · ')}</span></span>`).join(' ')}</p>` : '';
  box.html = glance + guess + table + moreBtn + unmet + next;
  foot();
}
function initZone() {
  $('#w-s-zone').addEventListener('click', e => {
    if (e.target.closest('[data-zmore]')) { zUI.more = !zUI.more; renderZone(); $('#w-s-zone [data-zmore]')?.focus(); return; }
    const b = e.target.closest('[data-zarea],[data-zback]'); if (!b) return;
    zUI.area = b.dataset.zarea || null;
    if (zUI.area === S.session?.currentArea) zUI.area = null;
    // Focus lands on the title at once (the clicked link is about to be replaced), then on "Back to …" when the peek has loaded.
    renderZone(); $('#t-s-zone')?.focus();
    loadZone(true).then(() => { renderZone(); ($('#w-s-zone [data-zback]') || $('#t-s-zone'))?.focus(); }).catch(onFetchError);
  });
}

function sessionHasLog() { return !!(S.session && S.session.log) && sevOf('chat-log') !== 'bad'; }
/* Title-row stamp of the chat-log views (Session, Combat): "Live from today's chat log" / "last line 21:14". */
function chatStamp(s) {
  const last = parseIso(s.lastLineAt) || (s.xpTimeline?.length ? parseChatTs(s.xpTimeline.at(-1)[0]) : null);
  const logDay = s.log ? s.log.replace(/^Chat-(\d\d)-(\d\d)-(\d\d)\.log$/, '20$1-$2-$3') : null;
  const today = logDay && new Date(logDay + 'T12:00').toDateString() === new Date(NOW()).toDateString();
  const v = V('chat-log');
  const l1 = today ? (s.live && loggedIn() ? "Live from today's chat log" : "From today's chat log") : `From the chat log of ${logDay ? dayMon(new Date(logDay + 'T12:00')) : '?'}`;
  if (S.down) setStamp(l1, `as of ${hhmm(S.downSince)}`, 'bad');
  else setStamp(l1, last ? `last line ${hhmm(last)}` : '…', v?.severity === 'warn' ? 'warn' : 'ok');
}

function renderSession() {
  const s = S.session || {};
  const noLog = !sessionHasLog();
  const logOffKnown = S.health?.settings?.readable && S.health.settings.LogChat === 0;
  // Follow note (chat log follows whoever is logged in).
  const follow = $('#s-follow');
  if (s.character && S.character && s.character !== S.character) {
    follow.hidden = false; follow.className = 'sysline';
    follow.html = `${shape('info')}<span>The chat log follows <em class="t">${esc(s.character)}</em>, who is ${loggedIn() ? 'logged in' : 'the last to log in'}. Other views show <em class="t">${esc(S.character)}</em>.</span>`;
  } else follow.hidden = true;

  if (S.view === 'session') {
    $('#h1').textContent = 'Session';
    if (S.loading && !S.session) { $('#finding').html = '<span class="dim">Reading today\'s chat log…</span>'; setStamp("Today's chat log", '…', 'ok'); }
    else if (noLog) {
      $('#finding').textContent = logOffKnown ? "Chat logging is off in the game, so there's no session to show." : "No chat log to read, so there's no session to show. Turn on chat logging and this fills in as you play.";
      setStamp('No chat log found', 'missing', 'bad');
    } else {
      $('#finding').html = sessionFinding(s);
      chatStamp(s);
    }
    $('#title-extra').hidden = true;
  }

  const live = chatLive();
  const reading = S.loading && !S.session;
  const needLog = reading ? '<p class="needs">Reading the chat log…</p>' : '<p class="needs">Needs the chat log.</p>';
  const fixR = ['warn', 'bad'].includes(sevOf('chat-log')) ? srcFix('chat-log') : '';
  const scopeWord = S.scope === 'login' ? 'this login' : 'today';

  // At a glance
  $('#w-s-glance').hidden = noLog && !S.loading;
  if (S.loading && !S.session) $('#s-glance').html = ['XP', 'Time', 'Level-ups', 'Items looted'].map((l, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${l}</div><div class="val"><span class="loading-bar"></span></div></div>`).join('');
  else if (!noLog) {
    const figs = [];
    const lootTotal = (s.loot || []).reduce((a, r) => a + r.count, 0);
    // The four session tiles always show; a zero reads "none yet" instead of the tile vanishing.
    figs.push({ lb: 'Time', val: dur((s.hours || 0) * 3600e3), sub: s.started ? `since ${s.started.slice(9, 14)}` : '' });
    figs.push({ lb: 'XP', val: fmt(s.totalXp || 0), sub: s.totalXp ? `${fmt(s.totalXp / Math.max(s.hours, 1 / 60))} XP/hr` : 'none yet' });
    figs.push({ lb: 'Level-ups', val: fmt(s.levels?.length || 0), sub: s.levels?.length ? `latest: ${s.levels.at(-1).skill} ${s.levels.at(-1).level}` : 'none yet' });
    figs.push({ lb: 'Items looted', val: fmt(lootTotal), sub: lootTotal ? `${fmt(s.loot.length)} distinct` : 'none yet' });
    if (s.totalXp) figs.unshift(figs.splice(1, 1)[0]); // XP leads once there is some
    $('#s-glance').html = figs.map((f, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${f.lb}</div><div class="val">${f.val}</div>${f.sub ? `<div class="sub">${esc(f.sub)}</div>` : ''}</div>`).join('');
  }
  setFoot('w-s-glance', `${live} · ${scopeWord}`, fixR);

  // Experience
  $$('#xpscope [role=tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.s === S.scope)); b.tabIndex = b.dataset.s === S.scope ? 0 : -1; });
  const xpBox = $('#s-xp');
  if (noLog && !S.loading) {
    const pl = plaqueFor('chat-logging');
    plaqueInView = 'chat-logging';
    xpBox.html = `<p class="empty">No chat log, so no experience to chart. The game writes one only with Log All Chat on.</p>
      <button type="button" class="plaque plaque-wide" data-fix="chat-logging" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button>`;
  } else if (S.loading && !S.session) xpBox.html = '<div class="zeroline" style="height:200px;border:0;background:var(--well);border-radius:4px"></div>';
  else drawXp(s);
  setFoot('w-s-xp', live, noLog ? '' : 'Logging: Settings → GUI → Log All Chat');

  // XP by skill
  const sk = $('#s-skill');
  if (noLog) sk.html = needLog;
  else {
    const max = s.xp?.[0]?.xp || 1;
    sk.html = (s.xp || []).length ? `<div class="barlist">${s.xp.map(r => `<div class="barrow" title="${esc(r.skill)}: ${fmt(r.xp)} XP"><span class="nm">${esc(r.skill)}</span><div class="bar"><i style="width:${Math.max(1, r.xp / max * 100)}%"></i></div><span class="v">${fmt(r.xp)} <span class="dim">${fmt(r.perHour)}/hr</span></span></div>`).join('')}</div>`
      : '<p class="empty">No XP yet.</p>';
  }
  setFoot('w-s-skill', noLog ? live : `${live} · ${scopeWord}`, fixR);
  // Zero day: an empty window keeps its title and one sentence; the provenance is in At a glance and the margin.
  $('#w-s-skill').classList.toggle('quiet', !noLog && !(s.xp || []).length && !reading);

  // Level-ups
  const lv = $('#s-lvl');
  if (noLog) lv.html = needLog;
  else lv.html = (s.levels || []).length ? `<ul class="list">${s.levels.slice().reverse().map(l => `<li><span>${esc(l.skill)} <em class="n">${l.level}</em></span><span class="time">${l.ts.slice(9, 14)}</span></li>`).join('')}</ul>`
    : `<p class="empty">No level-ups yet ${S.scope === 'login' ? 'this login' : 'today'}. Trainers don't keep office hours, so neither does this list.</p>`;
  setFoot('w-s-lvl', noLog ? live : `${live} · ${scopeWord}`, fixR);
  $('#w-s-lvl').classList.toggle('quiet', !noLog && !(s.levels || []).length && !reading);

  renderZone();
  renderCouncils(s);
  renderCombat(s);
  renderLoot();
  setFoot('w-s-loot', noLog ? live : `${live} · ${plural((s.loot || []).length, 'distinct item')}`, fixR);
  $('#w-s-loot').classList.toggle('quiet', !noLog && !(s.loot || []).length && !reading);

  // What happened
  const wh = $('#s-what');
  if (noLog) wh.html = needLog;
  else {
    let evs = s.events;
    const old = !Array.isArray(evs);
    if (old) evs = [...(s.areas || []).map(a => ({ ts: a.ts, kind: 'area', area: a.area })), ...(s.levels || []).map(l => ({ ts: l.ts, kind: 'level', skill: l.skill, level: l.level }))].sort((a, b) => a.ts < b.ts ? -1 : 1);
    evs = mergeExportEvents(evs);
    const row = e => {
      let what = '';
      if (e.kind === 'login') what = `Logged in as <em class="t">${esc(e.character)}</em>`;
      else if (e.kind === 'logout') what = 'Logged out';
      else if (e.kind === 'area') what = `Entered <em class="t">${esc(e.area)}</em>`;
      else if (e.kind === 'level') what = `${esc(e.skill)} reached level <em class="n">${e.level}</em>`;
      else if (e.kind === 'death') {
        // Another character's death (alt at midnight rollover) is named; the game logs no source for indirect damage.
        const who = e.character && s.character && e.character !== s.character ? `<em class="t">${esc(e.character)}</em> ` : '';
        const area = e.area ? ` in <em class="t">${esc(e.area)}</em>` : '';
        what = e.killer ? `${who}${who ? 'killed' : 'Killed'} by <em class="t">${esc(e.killer)}</em>${e.ability ? ` (${esc(pretty(e.ability))})` : ''}${area}`
          : `${who}${who ? 'died' : 'Died'} to indirect damage${area}`;
        if (e.hits > 1) what += ` <span class="dim small">hit ${plural(e.hits - 1, 'more time')} while down</span>`;
      }
      else if (e.kind === 'export') {
        const who = e.character ? ` for <em class="t">${esc(e.character)}</em>` : '';
        const times = e.times > 1 ? ` <span class="dim small">×${e.times}, last ${e.lastTs.slice(9, 14)}</span>` : '';
        what = `${shape(e.partial ? 'bad' : 'ok', 's13')} <span title="${esc(e.file)}">${esc(e.report)} export saved${who}</span>${times}${e.partial ? ' <span class="tag">partial</span>' : e.twin ? ' <span class="tag" title="At logout the game also wrote a second, incomplete copy (name &quot;???&quot;). It\'s ignored.">+ incomplete copy, ignored</span>' : ''}`;
      }
      return `<li><span class="time">${e.ts.slice(9, 14)}</span><span class="what">${what}</span></li>`;
    };
    // A short day lists in full; a long one scrolls under a one-row top fade, parked on a whole row.
    const shown = evs.slice(-60), scroll = shown.length > WHAT_FULL;
    const wsc0 = $('#what-scroll');
    const atEnd = !wsc0 || wsc0.scrollHeight - wsc0.scrollTop - wsc0.clientHeight < 40;
    const wrote = setHTML(wh, evs.length ? `${scroll ? '<div class="scrollbox fade-top" style="max-height:360px" id="what-scroll">' : ''}<ul class="list feed-what">${shown.map(row).join('')}</ul>${scroll ? '</div>' : ''}${evs.length > 60 ? `<p class="small dim">Showing the last 60 of ${fmt(evs.length)}.</p>` : ''}` : '<p class="empty">Nothing happened yet today. Log in and it starts here.</p>');
    const wsc = $('#what-scroll');
    if (wsc && wrote && atEnd) snapToEnd(wsc, 'li');
    if (wsc) wsc.classList.toggle('at-top', wsc.scrollTop < 2);
    setFoot('w-s-what', `${live} · today`, old ? 'Logins, logouts, exports and deaths need a newer server.py' : fixR);
  }
  if (noLog) setFoot('w-s-what', live, '');
  renderChips();
  renderFeed(false);
}

const WHAT_FULL = 15;
/* Scroll a list to its end, then back up to the nearest whole row, so the top row is never cut in half. */
function snapToEnd(box, rowSel) {
  box.scrollTop = box.scrollHeight;
  const top = box.getBoundingClientRect().top;
  const rows = box.querySelectorAll(rowSel);
  for (const r of rows) {
    const d = r.getBoundingClientRect().top - top;
    if (d >= -1) break;
    if (d + r.offsetHeight > 1) { box.scrollTop += d; break; }
  }
}

/* The game can write "Saved report" twice for one export. Fold identical
   exports a few seconds apart into one row, and flag a partial "???" file the
   game wrote at the same moment (the logout twin). */
function mergeExportEvents(evs) {
  const at = e => parseChatTs(e.ts);
  const partials = (S.reports || []).filter(r => r.report === 'CharacterSheet' && r.character === '???').map(r => parseUtc(r.timestamp));
  const out = [];
  for (const e of evs) {
    // Repeats of the same export (same report and character) within 15 minutes of the first read as one line,
    // even with zone changes or other exports in between; a login or logout ends the run.
    let prev = null;
    if (e.kind === 'export') for (let i = out.length - 1; i >= 0; i--) {
      const o = out[i];
      if (o.kind === 'export' && o.report === e.report && o.character === e.character && o.partial === e.partial) { prev = o; break; }
      if (o.kind !== 'area' && o.kind !== 'export') break;
    }
    if (prev && at(e) - at(prev) <= 15 * 60e3) { // the run is bounded from its first line, so it never drifts across a whole session
      prev.times++; prev.lastAt = at(e); prev.lastTs = e.ts; prev.file = e.file; continue;
    }
    out.push(e.kind === 'export' ? { ...e, times: 1, lastAt: at(e), lastTs: e.ts } : e);
  }
  for (const e of out) {
    if (e.kind !== 'export' || e.report !== 'Character' || e.partial) continue;
    if (partials.some(p => p != null && p >= at(e) - 3e3 && p <= e.lastAt + 3e3)) e.twin = true;
  }
  return out;
}

function sessionFinding(s) {
  const lvls = s.levels || [];
  const time = dur((s.hours || 0) * 3600e3);
  if (!s.totalXp) {
    const areas = s.areas || [];
    const counts = {};
    areas.forEach(a => counts[a.area] = (counts[a.area] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const since = s.started ? s.started.slice(9, 14) : '';
    const lastAt = parseIso(s.lastLineAt);
    const span = since ? ` (${since}${lastAt ? ' to ' + hhmm(lastAt) : ''})` : '';
    return `A quiet one: no experience ${S.scope === 'login' ? 'this login' : 'today'}${span}. ${time} across ${plural(areas.length, 'zone change')}${top ? `, mostly in <em class="t">${esc(top[0])}</em>` : ''}.${deathSentence(s)}`;
  }
  const top = s.xp?.[0]?.skill;
  let f = `<em class="n">${fmt(s.totalXp)} XP</em> in ${time}${top ? `, mostly <em class="t">${esc(top)}</em>` : ''}.`;
  if (lvls.length) f += ` <em class="n">${lvls.length}</em> ${lvls.length === 1 ? 'level-up' : 'level-ups'}, latest <em class="t">${esc(lvls.at(-1).skill)}</em> <em class="n">${lvls.at(-1).level}</em>.`;
  else f += ' No level-ups yet.';
  return f + deathSentence(s);
}

/* The finding's last sentence when the character died in scope: " Died twice, last killed by Fae Worg in Kur Caves." */
function deathSentence(s) {
  const n = s.combat?.deaths, ld = s.combat?.lastDeath;
  if (!n) return '';
  const area = ld?.area ? ` in <em class="t">${esc(ld.area)}</em>` : '';
  const how = ld?.killer ? `killed by <em class="t">${esc(ld.killer)}</em>${area}` : `to indirect damage${area}`;
  return n === 1 ? ` Died once, ${how}.` : ` Died ${n === 2 ? 'twice' : fmt(n) + ' times'}, last ${how}.`;
}

/* Councils window: what came in and went out in scope from the chat log (`councils`). Spending is never in the
   log, so the body says so and shows the balance from the character export, with that export's own age. */
const COIN_CAP = 10;
function councilRows(events) {
  // Chronological events → display rows: 3+ consecutive Gaming receipts fold into one run timed at the last one;
  // identical overburdened repeats in the same second fold with a count. Reversed at the end (newest first).
  const rows = [];
  for (let i = 0; i < events.length;) {
    const e = events[i];
    if (e.kind === 'received' && e.gaming) {
      let j = i; while (j < events.length && events[j].kind === 'received' && events[j].gaming) j++;
      if (j - i >= 3) {
        rows.push({ kind: 'run', ts: events[j - 1].ts, first: events[i].ts, n: j - i, amount: events.slice(i, j).reduce((a, x) => a + x.amount, 0), character: e.character });
        i = j; continue;
      }
      for (; i < j; i++) rows.push(events[i]);
      continue;
    }
    if (e.kind === 'overburdened') {
      let j = i; while (j < events.length && events[j].kind === 'overburdened' && events[j].ts === e.ts && events[j].amount === e.amount && events[j].who === e.who) j++;
      rows.push({ ...e, times: j - i }); i = j; continue;
    }
    rows.push(e); i++;
  }
  return rows.reverse();
}
function renderCouncils(s) {
  const box = $('#s-coin');
  const live = chatLive();
  const scopeWord = S.scope === 'login' ? 'this login' : 'today';
  const fixR = ['warn', 'bad'].includes(sevOf('chat-log')) ? srcFix('chat-log') : '';
  let quiet = false;
  if (!sessionHasLog()) {
    box.html = S.loading && !S.session ? '<p class="needs">Reading the chat log…</p>' : '<p class="needs">Needs the chat log.</p>';
    setFoot('w-s-coin', live, fixR);
  } else if (!s.councils || typeof s.councils !== 'object') {
    box.html = '<p class="needs">Needs a newer server.py.</p>';
    setFoot('w-s-coin', `${live} · ${scopeWord}`, 'Councils need a newer server.py');
  } else {
    const c = s.councils, evs = Array.isArray(c.events) ? c.events : [];
    if (!evs.length) {
      quiet = true;
      box.html = `<p class="empty">No councils in or out ${scopeWord}. What comes in is written to the chat log; what you spend never is.</p>`;
    } else {
      const figs = [
        { lb: 'Received', val: `${COIN}${fmt(c.received || 0)}`, sub: c.receivedLines ? `received ${plural(c.receivedLines, 'time')}${c.gamingLines ? ` · ${fmt(c.gamingLines)} with Gaming XP` : ''}` : 'none yet' },
        { lb: 'Stolen', val: `${COIN}${fmt(c.stolen || 0)}`, sub: c.stolenLines ? `${plural(c.stolenLines, 'theft')} · ${joinNames(c.thieves || [])}` : 'none yet' },
        { lb: 'Recovered', val: `${COIN}${fmt(c.recovered || 0)}`, sub: c.recoveredLines ? `${plural(c.recoveredLines, 'theft')} undone` : (c.stolenLines ? 'none yet' : 'nothing to recover') },
        { lb: 'Net', val: `${COIN}${fmt(c.net || 0)}`, sub: 'received, less stolen, plus recovered' },
      ];
      const glance = `<div class="glance nolead">${figs.map((f, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${f.lb}</div><div class="val">${f.val}</div><div class="sub">${esc(f.sub)}</div></div>`).join('')}</div>`;
      // The spending note: the balance is a second source (character export), so its age and fix live here, not in the footer.
      let note = "Spending isn't written to the chat log, so this is what came in, not what's left. ";
      const oh = c.onHand, ohAt = oh ? parseIso(oh.at) : null;
      // The balance belongs to the character who owns the events in scope (server `councils_owner`): the
      // `character-export` verdict applies only when that is the selected character.
      const owners = new Set(evs.map(e => e.character).filter(Boolean));
      const owner = oh?.character || (owners.size === 1 ? [...owners][0] : s.character);
      const v = owner === S.character ? V('character-export') : null;
      let ageMark = '';
      if (oh && ohAt != null && v) {
        if (v.severity === 'warn') ageMark = ` ${shape('warn', 's13')}<span class="age warn txt-warn">${ageWord(v.ageSec)} old</span> · ${esc(fixText('export-character'))}`;
      } else if (oh && ohAt != null) {
        // Another character's export (alt logged in): no verdict for it here, so go by age against the threshold.
        const sec = (NOW() - ohAt) / 1000;
        if (sec >= (S.health?.thresholds?.['character-export'] ?? DEFAULT_THRESH['character-export'])) ageMark = ` ${shape('warn', 's13')}<span class="age warn txt-warn">${ageWord(sec)} old</span> · ${esc(fixText('export-character'))}`;
      }
      // Name whose balance it is whenever it is not simply the selected character's with every event theirs.
      const nameOwner = owner && (owner !== S.character || owner !== s.character || [...owners].some(ch => ch !== owner));
      if (oh && ohAt != null && !(v && v.severity === 'bad' && v.ageSec == null)) note += `${nameOwner ? `<em class="t">${esc(owner)}</em>'s balance` : 'On hand'} at the character export of ${dayMon(ohAt)} ${hhmm(ohAt)}: ${COIN}${fmt(oh.amount)}.${ageMark}`;
      else note += `A character export${nameOwner ? ` of <em class="t">${esc(owner)}</em>` : ''} would show what's on hand: ${esc(fixText('export-character'))}`;
      const ovb = evs.filter(e => e.kind === 'overburdened');
      const ovbNames = [...new Set(ovb.map(e => e.who))];
      const ovbLine = ovb.length ? `<p class="small dim" style="margin:6px 0 0">The game also wrote ${plural(ovb.length, 'error')}: a corpse overburdened with ${fmt(c.overburdened || 0)} councils taken from ${esc(joinNames(ovbNames))}. Not counted above.</p>` : '';
      const rows = councilRows(evs);
      const shown = sessUI.coinAll ? rows : rows.slice(0, COIN_CAP);
      const asWho = e => e.character && s.character && e.character !== s.character ? ` <span class="dim small">as ${esc(e.character)}</span>` : '';
      const row = e => {
        let what = '';
        if (e.kind === 'run') what = `With Gaming XP: <em class="n">${fmt(e.amount)}</em>, ${plural(e.n, 'time')} from ${e.first.slice(9, 14)} to ${e.ts.slice(9, 14)}`;
        else if (e.kind === 'received') what = `Received <em class="n">${fmt(e.amount)}</em>${e.gaming ? ' <span class="dim small">with Gaming XP</span>' : ''}`;
        else if (e.kind === 'stolen') what = `<em class="t">${esc(e.who)}</em> stole <em class="n">${fmt(e.amount)}</em>`;
        else if (e.kind === 'recovered') what = `Recovered <em class="n">${fmt(e.amount)}</em> from <em class="t">${esc(e.who)}</em>`;
        else if (e.kind === 'overburdened') what = `Corpse overburdened with <em class="n">${fmt(e.amount)}</em> taken from <em class="t">${esc(e.who)}</em> <span class="tag">not counted</span>${e.times > 1 ? ` <span class="dim small">×${e.times}</span>` : ''}`;
        return `<li><span class="time">${esc(e.ts.slice(9, 14))}</span><span class="what">${what}${asWho(e)}</span></li>`;
      };
      const more = rows.length > COIN_CAP ? `<p style="margin-top:8px"><button type="button" class="linkbtn" id="coinall" style="text-decoration:underline">${sessUI.coinAll ? `Show the first ${COIN_CAP}` : `Show all ${fmt(rows.length)}`}</button></p>` : '';
      setHTML(box, `${glance}<p class="small dim" style="margin:10px 0 0">${note}</p>${ovbLine}<ul class="list feed-what" style="margin-top:10px">${shown.map(row).join('')}</ul>${more}`);
    }
    setFoot('w-s-coin', `${live} · ${scopeWord}`, fixR);
  }
  $('#w-s-coin').classList.toggle('quiet', quiet);
}

/* Combat window: deaths and kills in scope from the chat log (`combat`), with the 31-day totals (`combat31d`). */
function renderCombat(s) {
  const box = $('#s-combat');
  const live = chatLive();
  const scopeWord = S.scope === 'login' ? 'this login' : 'today';
  const fixR = ['warn', 'bad'].includes(sevOf('chat-log')) ? srcFix('chat-log') : '';
  let quiet = false;
  if (!sessionHasLog()) {
    box.html = S.loading && !S.session ? '<p class="needs">Reading the chat log…</p>' : '<p class="needs">Needs the chat log.</p>';
    setFoot('w-s-combat', live, fixR);
  } else if (!s.combat || typeof s.combat !== 'object') {
    box.html = '<p class="needs">Needs a newer server.py.</p>';
    setFoot('w-s-combat', `${live} · ${scopeWord}`, 'Combat needs a newer server.py');
  } else {
    const c = s.combat, d = s.combat31d;
    const has31 = !!(d && d.days > 0);
    if (!(c.deaths || c.kills || c.petKills || c.closeCalls)) {
      quiet = true;
      box.html = `<p class="empty">No deaths or kills ${scopeWord}.${has31 ? ` Last 31 days: ${plural(d.deaths, 'death')} · ${plural(d.kills, 'kill')}.` : ''}</p>`;
    } else {
      const ld = c.lastDeath;
      const deathSub = c.deaths ? `latest: ${ld?.killer || 'indirect damage'}${ld?.ts ? ' ' + ld.ts.slice(9, 14) : ''}`
        : c.closeCalls ? `${plural(c.closeCalls, 'close call')}, no deaths` : 'none yet';
      const killSub = (c.kills || c.petKills) ? `${fmt(c.petKills)} by your pets` : 'none yet';
      const figs = [{ lb: 'Deaths', val: fmt(c.deaths), sub: deathSub }, { lb: 'Kills', val: fmt(c.kills), sub: killSub }];
      const last31 = has31 ? `Last 31 days: ${plural(d.deaths, 'death')} · ${plural(d.kills, 'kill')} · ${fmt(d.petKills)} by your pets · ${plural(d.days, 'day')} of logs` : '';
      box.html = `<div class="glance">${figs.map((f, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${f.lb}</div><div class="val">${f.val}</div><div class="sub">${esc(f.sub)}</div></div>`).join('')}</div>`
        + `<p class="small dim" id="s-combat-31" style="margin:10px 0 0"${has31 ? '' : ' hidden'}>${esc(last31)}</p>`;
    }
    // Footer: the chat-log fix wins; else the window names its own gap when combat logging is partly off,
    // following the server's listing (`views` has session): the LogNonAttacks-only case is folded, no fix.
    const cl = V('combat-logging');
    const clFix = cl?.severity === 'info' && (cl.views || []).includes('session') ? `<span>${esc(fixText('combat-logging'))}</span>` : '';
    setFoot('w-s-combat', `${live} · ${scopeWord}`, fixR || clFix);
  }
  $('#w-s-combat').classList.toggle('quiet', quiet);
}

/* ---------- XP chart ---------- */
function drawXp(s) {
  const box = $('#s-xp');
  const tl = s.xpTimeline || [];
  if (tl.length < 2 || !s.totalXp) {
    const since = s.started ? s.started.slice(9, 14) : '';
    const zones = (s.areas || []).length;
    void zones; void since;
    box.html = `<p class="empty">${s.totalXp ? `${fmt(s.totalXp)} XP so far, too little to chart. The line starts at your second XP gain.` : `No XP ${S.scope === 'login' ? 'this login' : 'today'} yet. The chart draws itself from your first kill, craft or harvest.`}</p><div class="zeroline"></div>`;
    sessUI.chart = null;
    return;
  }
  box.html = `<div class="chart" id="xpchart"><svg role="img" aria-label="Cumulative XP over time" tabindex="0"></svg><div class="tip" hidden></div></div>
    <table class="sr"><caption>Cumulative XP</caption><tbody>${tl.map(([ts, v]) => `<tr><td>${ts.slice(9, 14)}</td><td>${fmt(v)}</td></tr>`).join('')}</tbody></table>`;
  const wrap = $('#xpchart'), svg = wrap.querySelector('svg'), tip = wrap.querySelector('.tip');
  const W = Math.max(280, svg.clientWidth || 600), H = svg.clientHeight || 200, pad = { l: 56, r: 12, t: 10, b: 24 };
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const t0 = parseChatTs(s.started);
  const pts = [[t0, 0], ...tl.map(([ts, v]) => [parseChatTs(ts), v])];
  const lastPt = pts.at(-1);
  const live = s.live && loggedIn();
  const t1 = live ? Math.max(Date.now(), lastPt[0]) : lastPt[0];
  const maxV = Math.max(1, s.totalXp);
  const x = t => pad.l + (t - t0) / Math.max(1, t1 - t0) * (W - pad.l - pad.r);
  const y = v => H - pad.b - v / maxV * (H - pad.t - pad.b);
  let g = [0, maxV / 2, maxV].map(v => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('');
  g += `<text class="axis" x="${pad.l}" y="${H - 4}">${hhmm(t0)}</text><text class="axis" x="${W - pad.r}" y="${H - 4}" text-anchor="end">${hhmm(t1)}</text>`;
  g += `<path class="line" d="${pts.map(([t, v], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join('')}"/>`;
  if (live && t1 > lastPt[0]) g += `<path class="live" d="M${x(lastPt[0]).toFixed(1)},${y(lastPt[1]).toFixed(1)}H${x(t1).toFixed(1)}"/>`;
  g += `<line class="xh" y1="${pad.t}" y2="${H - pad.b}" visibility="hidden"/><circle class="xc" r="6" visibility="hidden"/><rect x="${pad.l}" y="0" width="${W - pad.l - pad.r}" height="${H}" fill="transparent" class="hit"/>`;
  svg.innerHTML = g;
  const xh = svg.querySelector('.xh'), xc = svg.querySelector('.xc');
  const show = (p, t) => {
    const r = svg.getBoundingClientRect(), px = x(t), py = y(p[1]);
    xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.setAttribute('visibility', 'visible');
    xc.setAttribute('cx', px); xc.setAttribute('cy', py); xc.setAttribute('visibility', 'visible');
    tip.hidden = false; tip.textContent = `${fmt(p[1])} XP · ${hhmm(t)}`;
    const left = px * r.width / W + 12;
    tip.style.left = Math.min(left, r.width - 150) + 'px'; tip.style.top = '4px';
  };
  const hide = () => { xh.setAttribute('visibility', 'hidden'); xc.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  svg.querySelector('.hit').onmousemove = e => {
    const r = svg.getBoundingClientRect(), mx = (e.clientX - r.left) * W / r.width;
    const t = t0 + (mx - pad.l) / (W - pad.l - pad.r) * (t1 - t0);
    // Snap to the nearest recorded point so the dot always sits on the line.
    let p = pts[0]; for (const q of pts) if (Math.abs(q[0] - t) < Math.abs(p[0] - t)) p = q;
    show(p, p[0]);
  };
  svg.querySelector('.hit').onmouseleave = hide;
  let ki = pts.length - 1;
  svg.onkeydown = e => {
    if (e.key === 'ArrowLeft') ki = Math.max(0, ki - 1); else if (e.key === 'ArrowRight') ki = Math.min(pts.length - 1, ki + 1); else return;
    e.preventDefault(); show(pts[ki], pts[ki][0]);
  };
  svg.onfocus = () => show(pts[ki], pts[ki][0]);
  svg.onblur = hide;
  sessUI.chart = s;
}

/* ---------- loot ---------- */
function renderLoot() {
  const box = $('#s-loot');
  if (!sessionHasLog()) { box.html = S.loading && !S.session ? '<p class="needs">Reading the chat log…</p>' : '<p class="needs">Needs the chat log.</p>'; $('#lootq').disabled = true; return; }
  $('#lootq').disabled = false;
  const s = S.session || {};
  const q = $('#lootq').value.trim().toLowerCase();
  const all = s.loot || [];
  if (!all.length) { box.html = '<p class="empty">Nothing looted yet. Loot shows up here as soon as it lands in your bags.</p>'; return; }
  const { key, dir } = sessUI.lootSort;
  const rows = all.filter(r => r.item.toLowerCase().includes(q)).sort((a, b) => {
    const A = key === 'item' ? a.item.toLowerCase() : a.count, B = key === 'item' ? b.item.toLowerCase() : b.count;
    return (A > B ? 1 : A < B ? -1 : 0) * (dir === 'asc' ? 1 : -1);
  });
  needIcons({ names: all.map(r => r.item) });
  const th = (k, label, num) => {
    const on = key === k;
    return `<th class="${num ? 'num' : ''}" aria-sort="${on ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button" class="sortbtn" data-sort="${k}">${label}${on ? ARR(dir) : ''}</button></th>`;
  };
  const LOOT_CAP = 15;
  const shown = sessUI.lootAll || q ? rows : rows.slice(0, LOOT_CAP);
  const more = rows.length > LOOT_CAP && !q ? `<p style="margin-top:8px"><button type="button" class="linkbtn" id="lootall" style="text-decoration:underline">${sessUI.lootAll ? `Show the first ${LOOT_CAP}` : `Show all ${fmt(rows.length)}`}</button></p>` : '';
  box.html = rows.length ? `<table class="tbl resp-plain"><thead><tr>${th('item', 'Item')}${th('count', 'Count', true)}</tr></thead><tbody>${shown.map(r =>
    `<tr class="row"><td class="m1"><span class="cell-name">${iconImg(S.icons.byName[r.item], 24)}<span>${esc(r.item)}</span></span></td><td class="num m2">${fmt(r.count)}</td></tr>`).join('')}</tbody></table>${more}`
    : `<p class="empty">No loot matches "${esc(q)}".</p>`;
}

/* ---------- chat log feed ---------- */
function renderChips() {
  const counts = { ...(S.session?.channels || {}) };
  sessUI.feed.forEach(l => { const c = chanOf(l.msg); if (!(c in counts)) counts[c] = 0; });
  if (!S.session?.channels) { for (const k in counts) counts[k] = 0; sessUI.feed.forEach(l => counts[chanOf(l.msg)]++); }
  const order = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const box = $('#chips');
  const focused = document.activeElement?.dataset?.chan;
  box.html = order.map(c => {
    const on = chanEnabled(c);
    return `<button type="button" class="chip chan" data-chan="${esc(c)}" aria-pressed="${on}"><span class="cdot" style="background:${on ? (CHAN_COLOR[c] || 'var(--text)') : 'transparent'}"></span>${esc(c)} <span class="cnt">${fmt(counts[c])}</span></button>`;
  }).join('');
  $('#chips-wrap').hidden = !order.length;
  if (focused) box.querySelector(`[data-chan="${CSS.escape(focused)}"]`)?.focus();
  updateChipMore();
  const shown = order.filter(chanEnabled).length;
  const fname = S.session?.log || sessUI.tailLog || '';
  setFoot('w-s-chat', sessionHasLog() ? `${esc(fname)} · ${chatLive().replace(/^Chat log · /, '')}` : chatLive(), order.length ? `Showing ${shown} of ${plural(order.length, 'channel')}` : '');
}
/* A clipped chip strip says how many channels sit past its edge, as a chip that scrolls to them. */
function updateChipMore() {
  const box = $('#chips'), wrap = $('#chips-wrap'), more = $('#chips-more');
  const over = box.scrollWidth > box.clientWidth + 2;
  wrap.classList.toggle('overflow', over);
  let hidden = 0;
  if (over) {
    const edge = box.getBoundingClientRect().right - 8;
    hidden = $$('[data-chan]', box).filter(b => b.getBoundingClientRect().right > edge).length;
  }
  more.hidden = !hidden;
  more.textContent = hidden ? `+${hidden} more` : '';
  more.setAttribute('aria-label', hidden ? `${hidden} more channels, scroll the channel list` : '');
}
function lineHtml(l) {
  const c = chanOf(l.msg);
  let body = l.msg, tag = '';
  if (c !== 'System') { tag = `<span class="ch" style="color:${CHAN_COLOR[c] || 'var(--text)'}">[${esc(c)}]</span>`; body = body.replace(CHAN_RE, ''); }
  let cls = '';
  if (/reached level/.test(body)) cls = 'lvl';
  else if (c === 'Error') cls = 'err';
  let html;
  const saved = /^Saved report to (.+)$/.exec(body);
  if (saved) html = `Saved report to ${esc(saved[1].split('/').pop())} <span class="tag">export</span>`;
  else {
    html = esc(body).replace(/\[Item: ([^\]]+)\]/g, '<span class="itm">[$1]</span>');
    if (['Global', 'Nearby', 'Guild', 'Party', 'Trade', 'Help', 'Tell'].includes(c)) html = html.replace(/^([^:<]{1,30}):/, '<span style="color:var(--chat-player)">$1</span>:');
  }
  return `<div class="${cls}"><span class="ts">${l.ts.slice(9)}</span>${tag}${html}</div>`;
}
/* The feed only rebuilds when the log or the channel filter changes. New lines
   are appended, so a selection survives polling and screen readers are not
   re-read the whole log (the log itself is aria-live="off"). */
const FEED_MAX = 500;
function renderFeed(scrollDown) {
  const feed = $('#feed');
  if (!sessionHasLog() && !sessUI.feed.length) {
    const want = S.loading && !S.session ? 'reading' : 'empty';
    if (sessUI.shown !== want) { feed.innerHTML = want === 'reading' ? '<p class="empty">Reading the chat log…</p>' : '<p class="empty">Needs the chat log.</p>'; feed.classList.add('is-empty'); sessUI.shown = want; }
    $('#newpill').hidden = true;
    return;
  }
  feed.classList.remove('is-empty');
  const atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 40;
  const was = sessUI.shown && typeof sessUI.shown === 'object' ? sessUI.shown : null;
  const same = was && was.log === sessUI.tailLog && was.chanVer === sessUI.chanVer;
  const fresh = same ? sessUI.seq - was.seq : Infinity;
  if (same && fresh === 0) { /* nothing new */ }
  else if (same && fresh > 0 && fresh <= sessUI.feed.length && feed.querySelector(':scope > div')) {
    const add = sessUI.feed.slice(-fresh).filter(l => chanEnabled(chanOf(l.msg)));
    if (add.length) {
      feed.insertAdjacentHTML('beforeend', add.map(lineHtml).join(''));
      while (feed.children.length > FEED_MAX) feed.firstElementChild.remove();
    }
  } else {
    const lines = sessUI.feed.filter(l => chanEnabled(chanOf(l.msg))).slice(-FEED_MAX);
    feed.setAttribute('aria-busy', 'true');
    feed.innerHTML = lines.length ? lines.map(lineHtml).join('') : '<p class="empty" style="padding:8px 0">No lines in the channels you picked. Turn on more channels above.</p>';
    feed.removeAttribute('aria-busy');
  }
  sessUI.shown = { log: sessUI.tailLog, seq: sessUI.seq, chanVer: sessUI.chanVer };
  if (atBottom || scrollDown) { snapToEnd(feed, ':scope > div'); sessUI.unseen = 0; }
  const pill = $('#newpill');
  pill.hidden = !sessUI.unseen;
  pill.textContent = `${plural(sessUI.unseen, 'new line')} ↓`;
}

async function pollTail() {
  const q = sessUI.tailOffset != null ? `?log=${encodeURIComponent(sessUI.tailLog)}&offset=${sessUI.tailOffset}` : '';
  const r = await api('/api/tail' + q);
  if (r.log !== sessUI.tailLog) { sessUI.feed = []; sessUI.seq = 0; }
  const first = sessUI.tailOffset == null;
  sessUI.tailLog = r.log; sessUI.tailOffset = r.offset;
  const lines = r.lines || [];
  if (!lines.length) return [];
  const feed = $('#feed');
  const atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 40;
  sessUI.feed.push(...lines);
  sessUI.seq += lines.length;
  sessUI.feed = sessUI.feed.slice(-2000);
  if (!first && !atBottom) sessUI.unseen += lines.filter(l => chanEnabled(chanOf(l.msg))).length;
  if (S.view === 'session') { renderChips(); renderFeed(first); }
  return first ? [] : lines;
}

function initSession() {
  initZone();
  S.scope = store.get('pgdash.xpScope', 'day') === 'login' ? 'login' : 'day';
  $('#xpscope').addEventListener('click', e => {
    const b = e.target.closest('[role=tab]'); if (!b) return;
    S.scope = b.dataset.s; store.set('pgdash.xpScope', S.scope);
    loadSession().then(() => { computeVerdicts(); renderAll(); }).catch(onFetchError);
  });
  tabKeys($('#xpscope'));
  $('#lootq').addEventListener('input', renderLoot);
  $('#s-coin').addEventListener('click', e => {
    if (e.target.id === 'coinall') { sessUI.coinAll = !sessUI.coinAll; renderCouncils(S.session || {}); $('#coinall')?.focus(); }
  });
  $('#s-loot').addEventListener('click', e => {
    if (e.target.id === 'lootall') { sessUI.lootAll = !sessUI.lootAll; renderLoot(); $('#lootall')?.focus(); return; }
    const b = e.target.closest('[data-sort]'); if (!b) return;
    const k = b.dataset.sort, cur = sessUI.lootSort;
    sessUI.lootSort = { key: k, dir: cur.key === k ? (cur.dir === 'asc' ? 'desc' : 'asc') : (k === 'item' ? 'asc' : 'desc') };
    saveSort('loot', sessUI.lootSort); renderLoot();
  });
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('[data-chan]'); if (!b) return;
    const c = b.dataset.chan;
    const visible = $$('#chips [data-chan]').map(x => x.dataset.chan);
    const set = new Set(visible.filter(chanEnabled));
    if (sessUI.saved) for (const x of sessUI.saved) if (!visible.includes(x)) set.add(x);
    set.has(c) ? set.delete(c) : set.add(c);
    sessUI.saved = set; store.set('pgdash.chans', [...set]);
    sessUI.chanVer++;
    renderChips(); renderFeed(true);
  });
  $('#chips').addEventListener('scroll', () => updateChipMore(), { passive: true });
  document.addEventListener('scroll', e => { const t = e.target; if (t.classList?.contains('fade-top')) t.classList.toggle('at-top', t.scrollTop < 2); }, { capture: true, passive: true });
  $('#chips-more').addEventListener('click', () => {
    const box = $('#chips');
    box.scrollBy({ left: box.clientWidth - 48, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  window.addEventListener('resize', () => { if (S.view === 'session') updateChipMore(); });
  $('#feed').addEventListener('scroll', () => {
    const f = $('#feed');
    if (f.scrollHeight - f.scrollTop - f.clientHeight < 40 && sessUI.unseen) { sessUI.unseen = 0; $('#newpill').hidden = true; }
  });
  $('#newpill').addEventListener('click', () => renderFeed(true));
  window.addEventListener('resize', () => { if (sessUI.chart && S.view === 'session') drawXp(sessUI.chart); });
}

/* ===================== combat ===================== */
/* Combat view: how hard am I hitting, fight by fight, from the chat log's [Combat] lines (`/api/combat`).
   Personal only: the game logs your hits and your pets', never a party member's. Polled every 2 s while open. */

const dUI = {
  selected: null, pinned: false,  // pinned = the player picked a fight; otherwise the newest (or the live one) is shown
  minor: false,                   // skirmishes (under 5 s and 500 damage) unfolded
  sort: (store.json('pgdash.sort', {}).fights) || { key: 'start', dir: 'desc' },
};
const D_COLS = [
  { k: 'start', label: 'Time' }, { k: 'dur', label: 'Length', num: true }, { k: 'dmg', label: 'Damage', num: true },
  { k: 'dps', label: 'Per second', num: true }, { k: 'me', label: 'You', num: true }, { k: 'pet', label: 'Pets', num: true },
  { k: 'kills', label: 'Kills', num: true }, { k: 'top', label: 'Fought' },
];
/* "42 s", "3 min 12 s", "1 h 5 min": fight lengths, where dur() would round away the seconds. */
function secs(n) {
  n = Math.max(0, Math.round(n || 0));
  const nb = ' ';
  if (n < 60) return `${n}${nb}s`;
  const m = Math.floor(n / 60), s = n % 60;
  if (m < 60) return s ? `${m}${nb}min${nb}${s}${nb}s` : `${m}${nb}min`;
  const h = Math.floor(m / 60);
  return `${h}${nb}h${nb}${m % 60}${nb}min`;
}
const pctOf = (part, whole) => whole ? `${Math.round(part / whole * 100)}%` : '0%';
const perSec = n => `${fmt(n)}<span class="unit">/s</span>`;

async function loadCombat() {
  try {
    const c = await api('/api/combat?scope=' + S.scope);
    S.combat = c || {}; S.combatOld = false; S.combatAt = NOW(); S.lastGood.combat = NOW();
  } catch (e) {
    if (e && e.status === 404) { S.combatOld = true; S.combat = null; return; }
    throw e;
  }
}
let partyRound = 0;
async function combatRound() {
  try { await loadCombat(); markUp(); } catch (e) { onFetchError(e); }
  if (partyRound++ % 5 === 0) await loadParty();  // the party link every 10 s: ntfy.sh is polled at that pace
  if (S.view === 'combat') { renderCombatView(); renderMargin(); renderShellHealth(); }
}

/* ===================== party sharing (Combat → Party window) ===================== */
/* docs/SHARING.md: each copy posts its closed fights to an ntfy.sh topic named by a party code and reads the
   others'. The server does the posting, polling and merging; this window shows the code, the link's health
   and the merged fights, newest first. Feedback for the window's own controls goes to its state line
   (#d-pstate, beside the buttons), never only to the system line at the top of the page. */
const pUI = { all: false, solo: false, lastCode: null, undoTimer: null, note: null };
const PARTY_CODE_RE = /^gn-[a-z0-9]{12}$/;
const PARTY_CODE_IN_TEXT = /gn-[a-z0-9]{12}/i;
const PARTY_SHOW = 10;  // shared fights listed before "Show all"
async function loadParty() {
  try {
    const p = await api('/api/party');
    S.party = p || null; S.partyOld = false;
  } catch (e) {
    if (e && e.status === 404) { S.partyOld = true; S.party = null; }
  }
}
/* The window's state line: kind 'status' prints the game's [Status] tag, 'error' its [Error] tag (and marks the
   field invalid), 'plain' neither. An optional text button (label + run) follows, for Undo. */
function partyState(kind, text, btn = null) {
  const el = $('#d-pstate'), inp = $('#pcode');
  pUI.note = kind === 'plain' ? null : { kind, text, btn };
  const tag = kind === 'status' ? '<span class="tagw status">[Status]</span> ' : kind === 'error' ? '<span class="tagw error">[Error]</span> ' : '';
  el.html = text ? `${tag}${esc(text)}${btn ? ` <button type="button" class="linkbtn" data-pundo>${esc(btn.label)}</button>` : ''}` : '';
  el._run = btn?.run || null;
  if (kind === 'error') { inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', 'd-pstate'); }
  else { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); }
}
async function postParty(body) {
  try {
    const p = await api('/api/party', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    S.party = p; S.partyOld = false;
    return p;
  } catch (e) {
    partyState('error', e?.status === 400 ? e.message : "The server didn't answer; try again.");
    return null;
  }
}
async function partyCopy(code, text) {
  try { await navigator.clipboard.writeText(code); partyState('status', text); }
  catch { partyState('error', `Couldn't reach the clipboard. The code is ${code}.`); }
}
/* Join from typed or pasted text: the code is pulled out of whatever was pasted ("[Party] Robchew: gn-…"). */
async function partyJoinFrom(text) {
  const m = String(text || '').match(PARTY_CODE_IN_TEXT);
  if (!m) { partyState('error', 'A code looks like gn- and 12 letters or digits.'); return; }
  const code = m[0].toLowerCase();
  $('#pcode').value = code;
  const p = await postParty({ code });
  if (p?.code) { partyState('status', `Joined ${code}. Your last ${PARTY_SHOW > 3 ? 'three' : 'few'} fights and every new one are shared.`); renderParty(); }
}
function partyTip(m) {
  const pets = Object.entries(m.pets || {}).map(([n, d]) => `${n} ${fmt(d)}`).join(', ');
  const parts = [`you ${fmt(m.me)}`];
  if (pets) parts.push(`pets ${pets}`);
  if (m.kills) parts.push(plural(m.kills, 'kill'));
  if (m.deaths) parts.push(plural(m.deaths, 'death'));
  if (m.taken) parts.push(`took ${fmt(m.taken)}`);
  if (m.top?.length) parts.push(`top: ${m.top.map(([n, d]) => `${pretty(n)} ${fmt(d)}`).join(', ')}`);
  return `${m.who}: ${parts.join(' · ')}`;
}
function partyFightHtml(f) {
  const t = parseIso(f.start);
  const solo = f.members.length === 1 ? (f.members[0].mine ? '<span class="tag">only you so far</span>' : '<span class="tag">without you</span>') : '';
  const ids = f.byIds ? '<span class="tag" title="The same enemy ids appear in more than one player\'s log">same enemies</span>' : '';
  const head = `<div class="ph"><span class="t">${hhmm(t)}</span><span class="dim">${secs(f.dur)}</span>${f.area ? `<span class="dim">${esc(f.area)}</span>` : ''}<span><b>${fmt(f.total)}</b> damage · ${plural(f.members.length, 'player')}</span>${solo}${ids}</div>`;
  const max = f.members[0]?.dmg || 1;
  const rows = f.members.map(m => { const tip = partyTip(m); return `<div class="barrow" role="group" aria-label="${esc(tip)}" title="${esc(tip)}"><span class="nm">${esc(m.who)}${m.mine ? ' <span class="tag">you</span>' : ''}</span><div class="bar"><i style="width:${Math.max(1, m.dmg / max * 100)}%"></i></div><span class="v">${fmt(m.dmg)} <span class="dim">${fmt(m.dps)}/s · ${Math.round((m.share || 0) * 100)}%</span></span></div>`; }).join('');
  return `<div class="party-fight">${head}<div class="barlist">${rows}</div></div>`;
}
function renderParty() {
  const p = S.party, old = S.partyOld, box = $('#d-party'), inp = $('#pcode'), cnt = $('#d-party-count');
  const code = p?.code || null;
  $('#d-pnew').hidden = !!code || old;
  $('#d-pjoin').hidden = !!code || old;
  $('#d-pcopy').hidden = !code;
  $('#d-pleave').hidden = !code;
  inp.disabled = old; inp.readOnly = !!code;
  if (code && document.activeElement !== inp) inp.value = code;
  if (old) { cnt.textContent = ''; partyState('plain', ''); box.html = '<p class="needs">Needs a newer Gorgon Notes: this page knows the Party window, the server it talks to does not.</p>'; setFoot('w-d-party', 'Party sharing', 'Sharing fights needs a newer Gorgon Notes'); return; }
  if (!p) { cnt.textContent = ''; box.html = '<p class="needs">Checking the party link…</p>'; setFoot('w-d-party', 'ntfy.sh', ''); return; }
  if (!code) {
    cnt.textContent = '';
    if (!pUI.note) partyState('plain', '');
    box.html = '<p class="empty">Share fights with your party. One of you presses New code and pastes it into party chat; the others paste the code here (the whole chat line is fine) and press Join. Your last three fights and every one that closes from then on are shared, and everyone\'s shows up here side by side.</p>';
    setFoot('w-d-party', 'ntfy.sh · not joined', 'Press New code, or paste a code from party chat. Fight numbers and character names go to ntfy.sh; anyone with the code can read them');
    return;
  }
  const n = p.ntfy || {}, since = parseIso(p.since);
  if (!pUI.note) partyState('plain', `joined ${hhmm(since)}`);
  const all = (p.fights || []).slice().reverse();
  const shared = all.filter(f => f.members.length > 1), solo = all.filter(f => f.members.length === 1);
  const lead = shared.length ? shared : solo;            // nothing shared yet: the solo fights are the list
  const rest = shared.length ? solo : [];
  const shown = pUI.all ? lead : lead.slice(0, PARTY_SHOW);
  cnt.textContent = lead.length ? (shared.length && solo.length ? `${fmt(shared.length)} of ${fmt(all.length)}` : fmt(lead.length)) : '';
  if (!all.length) {
    const who = (p.members || []).filter(m => m !== p.character);
    box.html = `<p class="empty">Joined at ${hhmm(parseIso(p.since))}. Fights that close from now on are sent; the others' arrive within 10 s.${who.length ? ` Here so far: ${esc(joinNames(who))}.` : ''}</p>`;
  } else {
    const more = lead.length > PARTY_SHOW ? `<button type="button" class="linkbtn" data-pall aria-expanded="${pUI.all}">${pUI.all ? `Show the last ${PARTY_SHOW}` : `Show all ${fmt(lead.length)} fights`}</button>` : '';
    const fold = rest.length ? `<button type="button" class="linkbtn" data-psolo aria-expanded="${pUI.solo}">${pUI.solo ? 'Hide' : 'Show'} ${plural(rest.length, 'fight')} nobody else was in</button>` : '';
    box.html = `${shown.map(partyFightHtml).join('')}${more || fold ? `<div class="pane-under party-under">${more}${fold}</div>` : ''}${pUI.solo && rest.length ? rest.map(partyFightHtml).join('') : ''}`;
  }
  const left = `ntfy.sh · ${esc(code)}${n.lastMessageAt ? ` · last message ${hhmm(parseIso(n.lastMessageAt))}` : ' · nothing received yet'}${n.posted ? ` · ${plural(n.posted, 'fight')} sent` : ''}`;
  let right;
  if (!n.reachable && n.lastErrorAt) right = `${shape('bad', 's13')}<span class="txt-bad">ntfy.sh not answering since ${hhmm(parseIso(n.lastErrorAt))}; ${n.pending ? `${plural(n.pending, 'fight')} waiting, sent` : 'fights are sent'} when it answers again</span>`;
  else if (n.pending) right = esc(`${plural(n.pending, 'fight')} waiting to be sent`);
  else right = 'Fight numbers and character names go to ntfy.sh; anyone with the code can read them';
  setFoot('w-d-party', left, right);
}
function initParty() {
  const inp = $('#pcode');
  $('#d-pnew').addEventListener('click', async () => {
    const p = await postParty({ action: 'new' });
    if (p?.code) { await partyCopy(p.code, `Joined ${p.code} and copied it. Paste it into party chat.`); renderParty(); }
  });
  $('#d-pform').addEventListener('submit', e => { e.preventDefault(); if (!S.party?.code) partyJoinFrom(inp.value); });
  inp.addEventListener('paste', e => {
    if (S.party?.code) return;
    const text = e.clipboardData?.getData('text') || '';
    if (PARTY_CODE_IN_TEXT.test(text)) { e.preventDefault(); partyJoinFrom(text); }  // a pasted code joins at once
  });
  inp.addEventListener('input', () => { if (pUI.note?.kind === 'error') partyState('plain', ''); });
  $('#d-pcopy').addEventListener('click', () => { const c = S.party?.code; if (c) partyCopy(c, 'Copied. Paste it into party chat.'); });
  $('#d-pleave').addEventListener('click', async () => {
    const was = S.party?.code; if (!was) return;
    const p = await postParty({ code: null });
    if (!p) return;
    pUI.lastCode = was; inp.value = ''; pUI.all = false; pUI.solo = false;
    partyState('status', `Left ${was}.`, { label: 'Undo', run: async () => { const q = await postParty({ code: was }); if (q?.code) { partyState('status', `Back in ${was}.`); renderParty(); } } });
    clearTimeout(pUI.undoTimer);
    pUI.undoTimer = setTimeout(() => { if (pUI.note?.text === `Left ${was}.`) { partyState('plain', ''); renderParty(); } }, 30000);
    renderParty();
  });
  $('#d-pstate').addEventListener('click', e => { if (e.target.closest('[data-pundo]') && $('#d-pstate')._run) $('#d-pstate')._run(); });
  $('#d-party').addEventListener('click', e => {
    if (e.target.closest('[data-pall]')) { pUI.all = !pUI.all; renderParty(); $('#d-party [data-pall]')?.focus(); }
    else if (e.target.closest('[data-psolo]')) { pUI.solo = !pUI.solo; renderParty(); $('#d-party [data-psolo]')?.focus(); }
  });
}

/* Which fight the Breakdown shows: the one the player picked, else the live one, else the newest. */
function pickedFight(c) {
  const fights = c?.fights || [];
  if (dUI.pinned && fights.some(f => f.id === dUI.selected)) return fights.find(f => f.id === dUI.selected);
  dUI.pinned = false;
  const f = fights.find(x => x.open) || fights.at(-1) || null;
  dUI.selected = f ? f.id : null;
  return f;
}

function renderCombatView() {
  const c = S.combat, s = S.session || {};
  const noLog = !sessionHasLog() || (!!c && !c.log && !S.loading);
  const old = !!S.combatOld;
  const reading = !old && !noLog && (!c || (S.loading && !S.session));
  const live = chatLive();
  const scopeWord = S.scope === 'login' ? 'this login' : 'today';
  const fixR = ['warn', 'bad'].includes(sevOf('chat-log')) ? srcFix('chat-log') : '';
  const cl = V('combat-logging');
  const clFix = cl?.severity === 'info' && (cl.views || []).includes('combat') ? `<span>${esc(fixText('combat-logging'))}</span>` : '';
  const fix = fixR || clFix;
  const logOffKnown = S.health?.settings?.readable && S.health.settings.LogChat === 0;

  if (S.view === 'combat') {
    $('#h1').textContent = 'Combat';
    if (reading) { $('#finding').html = '<span class="dim">Reading today\'s chat log…</span>'; setStamp("Today's chat log", '…', 'ok'); }
    else if (noLog) {
      $('#finding').textContent = logOffKnown ? "Chat logging is off in the game, so there's nothing to measure." : "No chat log to read, so there's nothing to measure. Turn on chat logging and the meter starts with your first hit.";
      setStamp('No chat log found', 'missing', 'bad');
    } else if (old) { $('#finding').textContent = 'The DPS meter needs a newer server.py.'; chatStamp(s); }
    else { $('#finding').html = combatFinding(c, scopeWord); chatStamp(s); }
    $('#title-extra').hidden = true;
  }
  // The chat log follows whoever is logged in; say so when that is not the selected character (as on Session).
  const follow = $('#d-follow');
  if (c?.character && S.character && c.character !== S.character) {
    follow.hidden = false; follow.className = 'sysline';
    follow.html = `${shape('info')}<span>The chat log follows <em class="t">${esc(c.character)}</em>, who is ${loggedIn() ? 'logged in' : 'the last to log in'}. This meter is ${esc(c.character)}'s.</span>`;
  } else follow.hidden = true;
  $$('#dscope [role=tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.s === S.scope)); b.tabIndex = b.dataset.s === S.scope ? 0 : -1; b.disabled = noLog || old; });

  const needLog = reading ? '<p class="needs">Reading the chat log…</p>' : '<p class="needs">Needs the chat log.</p>';
  const glance = $('#d-glance'), pane = $('#d-fights');
  $('#w-d-glance').hidden = noLog && !S.loading;
  if (noLog || old) {
    glance.html = ''; $('#d-count').textContent = '';
    pane.html = old ? '<p class="needs">Needs a newer server.py.</p>' : needLog;
    $('#d-break').html = old ? '<p class="needs">Needs a newer server.py.</p>' : needLog;
    $('#d-break-sub').textContent = ''; $('#d-copy').disabled = true;
    const r = old ? 'The DPS meter needs a newer server.py' : fixR;
    setFoot('w-d-glance', live, r); setFoot('w-d-fights', live, r); setFoot('w-d-break', live, r);
    $('#w-d-fights').classList.remove('quiet');
    return;
  }
  if (reading) {
    glance.html = ['Per second now', 'Damage', 'Fights'].map((l, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${l}</div><div class="val"><span class="loading-bar"></span></div></div>`).join('');
    pane.html = needLog; $('#d-break').html = needLog; $('#d-count').textContent = ''; $('#d-break-sub').textContent = ''; $('#d-copy').disabled = true;
    setFoot('w-d-glance', live, ''); setFoot('w-d-fights', live, ''); setFoot('w-d-break', live, '');
    return;
  }

  const t = c.totals || {}, n = c.now || {};
  const fights = c.fights || [];
  const lastF = fights.at(-1) || null;
  const lastCombat = parseIso(c.lastCombatAt);
  const left = `${live} · ${scopeWord}`;
  const openLog = c.log && !S.filesOld ? ` · <a href="#files?f=${encodeURIComponent('logs/' + c.log)}">Open the log</a>` : '';
  const leftFights = (lastCombat ? `${live} · last combat line ${hhmm(lastCombat)} · ${scopeWord}` : left) + openLog;

  // At a glance: the live figure leads; zeros fold into the finding except the three that frame the day.
  const figs = [];
  if (n.inFight) figs.push({ lb: 'Per second now', val: perSec(n.dps), sub: `this fight · ${secs(n.sec)} · last ${c.nowSec} s: ${fmt(n.recent)}/s` });
  else figs.push({ lb: 'Per second, last fight', val: perSec(lastF ? lastF.dps : 0), sub: lastF ? `${lastF.start.slice(9, 14)} · ${secs(lastF.dur)}` : 'none yet' });
  figs.push({ lb: 'Damage', val: fmt(t.dmg || 0), sub: t.dmg ? `you ${pctOf(t.me, t.dmg)} · pets ${pctOf(t.pet, t.dmg)}` : 'none yet' });
  figs.push({ lb: 'Fights', val: fmt(t.fights || 0), sub: t.fights ? `${secs(t.activeSec)} fighting · ${fmt(t.dps)}/s over it` : 'none yet' });
  if (t.kills || t.petKills) figs.push({ lb: 'Kills', val: fmt(t.kills + t.petKills), sub: t.petKills ? `${fmt(t.petKills)} by your pets` : 'all yours' });
  if (t.taken || t.deaths) figs.push({ lb: 'Damage taken', val: fmt(t.taken), sub: t.deaths ? plural(t.deaths, 'death') + (t.instakills ? `, ${t.instakills === 1 ? 'one' : t.instakills} to a kill mechanic` : '') : 'no deaths' });
  glance.html = figs.map((f, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${f.lb}</div><div class="val">${f.val}</div><div class="sub">${esc(f.sub)}</div></div>`).join('');
  setFoot('w-d-glance', left, fix);

  // Fights
  const quiet = !fights.length;
  $('#w-d-fights').classList.toggle('quiet', quiet);
  $('#d-count').textContent = fights.length ? fmt(fights.length) : '';
  if (quiet) pane.html = `<p class="empty">No fights ${scopeWord}. The first hit you land or take opens one; ${c.gapSec} s without damage closes it.</p>`;
  else pane.html = renderFightPane(c);
  setFoot('w-d-fights', leftFights, fix);

  // Breakdown
  renderBreakdown(c, pickedFight(c));
  setFoot('w-d-break', live, `Party members' hits aren't in your log; the Party window below puts their copies' numbers beside yours.`);
  renderParty();
}

function combatFinding(c, scopeWord) {
  const t = c.totals || {}, n = c.now || {};
  if (n.inFight) {
    const f = (c.fights || []).at(-1) || {};
    let out = `Fighting now: <em class="n">${fmt(n.dps)}</em> damage a second over ${secs(n.sec)}`;
    if (f.top) out += ` against <em class="t">${esc(f.top)}</em>${f.targetCount > 1 ? ` and ${plural(f.targetCount - 1, 'other')}` : ''}`;
    out += '.';
    if (f.dmg && f.pet > f.me) {
      const pets = (c.pets || []).filter(p => (f.abilities || []).some(a => a.who === p));
      if (pets.length) out += ` <em class="t">${esc(joinNames(pets))}</em> ${pets.length === 1 ? 'is' : 'are'} doing ${pctOf(f.pet, f.dmg)} of it.`;
    }
    return out;
  }
  if (!t.fights) return `No fights ${scopeWord}. The meter starts with your first hit.`;
  let out = `<em class="n">${fmt(t.dmg)}</em> damage in ${plural(t.fights, 'fight')} ${scopeWord}, <em class="n">${fmt(t.dps)}</em> a second while fighting.`;
  if (t.best) out += ` Best: <em class="n">${fmt(t.best.dps)}</em> a second at ${t.best.start.slice(9, 14)}, over ${secs(t.best.dur)}.`;
  if (t.dmg && t.pet) out += ` Your pets did ${pctOf(t.pet, t.dmg)} of it.`;
  if (t.deaths) out += ` Died ${t.deaths === 1 ? 'once' : t.deaths === 2 ? 'twice' : `${fmt(t.deaths)} times`}.`;
  return out;
}

function fightRow(f, sel) {
  const time = f.start.slice(9, 14);
  const kills = f.kills + f.petKills;
  const took = !f.dmg && f.taken ? `<span class="small">took ${fmt(f.taken)}</span>` : '';
  const fought = f.top ? `${esc(f.top)}${f.targetCount > 1 ? ` <span class="small">+${fmt(f.targetCount - 1)} more</span>` : ''}${took ? ' · ' + took : ''}` : took;
  const line2 = [secs(f.dur), `${fmt(f.dmg)} damage`, kills ? plural(kills, 'kill') : '', f.deaths ? plural(f.deaths, 'death') : ''].filter(Boolean).join(' · ');
  return `<tr class="row selectable" tabindex="0" data-fight="${esc(f.id)}" aria-selected="${sel}">
    <td class="m1"><span class="nm">${time}</span>${f.open ? ' <span class="tag">now</span>' : ''}${fought ? `<span class="small m-only"> · ${fought}</span>` : ''}</td>
    <td class="num">${secs(f.dur)}</td>
    <td class="num">${fmt(f.dmg)}</td>
    <td class="num m2"><b>${fmt(f.dps)}</b><span class="m-only unit">/s</span></td>
    <td class="num">${fmt(f.me)}</td>
    <td class="num">${f.pet ? fmt(f.pet) : ''}</td>
    <td class="num">${kills ? fmt(kills) : ''}</td>
    <td>${fought}</td>
    <td class="m-line2">${esc(line2)}</td>
  </tr>`;
}
function renderFightPane(c) {
  const all = c.fights || [];
  const minor = all.filter(f => f.minor && !f.open).length;
  const rows = dUI.minor ? all : all.filter(f => !f.minor || f.open);
  const sorted = sortRows(rows, dUI.sort, (r, k) => k === 'top' ? String(r.top || '').toLowerCase() : r[k]);
  const head = `<thead><tr>${D_COLS.map(col => thSort(col, dUI.sort, 'fights')).join('')}</tr></thead>`;
  const body = sorted.map(f => fightRow(f, dUI.selected === f.id)).join('');
  const t = c.totals || {};
  const shown = rows.reduce((a, f) => ({ dmg: a.dmg + f.dmg, me: a.me + f.me, pet: a.pet + f.pet, kills: a.kills + f.kills + f.petKills, sec: a.sec + f.dur }), { dmg: 0, me: 0, pet: 0, kills: 0, sec: 0 });
  const grand = `<tr class="grand"><td colspan="2">Total · ${plural(rows.length, 'fight')}</td><td class="num">${fmt(shown.dmg)}</td><td class="num">${fmt(shown.sec ? shown.dmg / shown.sec : 0)}</td><td class="num">${fmt(shown.me)}</td><td class="num">${shown.pet ? fmt(shown.pet) : ''}</td><td class="num">${shown.kills ? fmt(shown.kills) : ''}</td><td></td><td class="m-line2">${esc(`${fmt(shown.dmg)} damage · ${secs(shown.sec)} fighting`)}</td></tr>`;
  const fold = minor ? `<button type="button" class="linkbtn" data-dminor="1" aria-expanded="${dUI.minor}">${dUI.minor ? 'Hide' : 'Show'} ${plural(minor, 'skirmish', 'skirmishes')} under ${c.minor.sec} s and ${fmt(c.minor.dmg)} damage</button>` : '';
  const under = t.fights && !fold ? 'Select a fight to see it by ability.' : '';
  return `<div class="pane"><table class="tbl resp">${head}<tbody>${body}${grand}</tbody></table></div><div class="pane-under">${fold || under}</div>`;
}

function abilTip(a) {
  const parts = [plural(a.hits, 'hit')];
  if (a.crit) parts.push(`${plural(a.crit, 'crit')} (${pctOf(a.crit, a.hits)})`);
  if (a.max) parts.push(`biggest ${fmt(a.max)}`);
  if (a.health && a.armor) parts.push(`${fmt(a.health)} health + ${fmt(a.armor)} armor`);
  if (a.evaded) parts.push(`${fmt(a.evaded)} evaded`);
  if (a.none) parts.push(`${fmt(a.none)} for nothing`);
  if (a.fatal) parts.push(plural(a.fatal, 'killing blow'));
  if (a.levels?.length) parts.push(`seen as ${a.levels.join(', ')}`);
  return `${a.name}: ${parts.join(' · ')}`;
}
function renderBreakdown(c, f) {
  const box = $('#d-break'), sub = $('#d-break-sub'), copy = $('#d-copy');
  if (!f) {
    box.html = `<p class="empty">${(c.fights || []).length ? 'Select a fight to see it by ability.' : 'The first fight shows up here by ability, with what hit you.'}</p>`;
    sub.textContent = ''; copy.disabled = true; return;
  }
  sub.textContent = [f.start.slice(9, 14) + (f.open ? ', now' : ''), secs(f.dur), f.area].filter(Boolean).join(' · ');
  copy.disabled = false;
  const figs = [
    { lb: 'You', val: fmt(f.me), sub: `${fmt(f.dpsMe)}/s · ${plural(f.hitsMe, 'hit')}${f.critMe ? ` · ${pctOf(f.critMe, f.hitsMe)} crit` : ''}` },
  ];
  if (f.pet) figs.push({ lb: 'Pets', val: fmt(f.pet), sub: `${fmt(f.dpsPet)}/s · ${pctOf(f.pet, f.dmg)} of the fight` });
  if (f.taken || f.takenPet) figs.push({ lb: 'Taken', val: fmt(f.taken), sub: f.takenPet ? `your pets took ${fmt(f.takenPet)}` : f.indirectMe ? `${fmt(f.indirectMe)} of it indirect` : plural(f.takenHits, 'hit') });
  if (f.kills + f.petKills) figs.push({ lb: 'Kills', val: fmt(f.kills + f.petKills), sub: f.petKills ? `${fmt(f.petKills)} by your pets` : 'all yours' });
  if (f.deaths) figs.push({ lb: 'Deaths', val: fmt(f.deaths), sub: f.instakills ? 'to a kill mechanic' : '' });
  const glance = `<div class="glance">${figs.map((x, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${x.lb}</div><div class="val">${x.val}</div>${x.sub ? `<div class="sub">${esc(x.sub)}</div>` : ''}</div>`).join('')}</div>`;
  const max = f.abilities[0]?.dmg || 1;
  const bars = f.abilities.length
    ? `<div class="barlist">${f.abilities.map(a => `<div class="barrow" title="${esc(abilTip(a))}"><span class="nm">${a.who !== 'you' ? `<span class="dim">${esc(a.who)} · </span>` : ''}${esc(pretty(a.name))}</span><div class="bar"><i style="width:${Math.max(1, a.dmg / max * 100)}%"></i></div><span class="v">${fmt(a.dmg)} <span class="dim">${plural(a.hits, 'hit')}</span></span></div>`).join('')}</div>`
    : '<p class="empty">Nothing landed.</p>';
  const taken = f.takenBy.length || f.indirectMe
    ? `<ul class="list">${f.takenBy.map(r => `<li><span>${esc(r.name)} <span class="dim">${esc(pretty(r.ability))}</span>${r.instakill ? ` <span class="tag">kill mechanic</span>` : ''}</span><span class="n">${r.hits ? `${fmt(r.dmg)} <span class="dim small">${plural(r.hits, 'hit')}</span>` : ''}</span></li>`).join('')}${f.indirectMe ? `<li><span class="dim">Indirect (DoTs, falls, weather)</span><span class="n">${fmt(f.indirectMe)}</span></li>` : ''}</ul>`
    : `<p class="empty">Nothing hit you${f.takenPet ? `. Your pets took ${fmt(f.takenPet)}` : ''}.</p>`;
  let note = '';
  if (f.indirectUnattributed) {
    const who = f.shared
      ? (f.others.length ? `${joinNames(f.others)} ${f.others.length === 1 ? 'was' : 'were'} nearby, so some of it may be theirs.` : 'There was party chat during the fight, so some of it may be your party\'s.')
      : "Nobody else was logged nearby, so it's your DoTs or your pets'.";
    note = `<p class="small dim" style="margin:12px 0 0">Indirect damage on what you fought, source not logged: ${fmt(f.indirectUnattributed)}. ${esc(who)} It isn't counted above.</p>`;
  }
  const tl = f.timeline || [];
  const spark = f.dmg && tl.length >= 2
    ? `<div class="chart spark" id="d-spark" data-key="${esc(`${f.id}|${f.dur}|${f.dmg}`)}"><svg role="img" aria-label="Damage a second over this fight" tabindex="0"></svg><div class="tip" hidden></div></div>
      <table class="sr"><caption>Damage a second over this fight</caption><tbody>${tl.map(([sec, me, pet]) => `<tr><td>${tsec(sec)}</td><td>${fmt(me + pet)}</td></tr>`).join('')}</tbody></table>`
    : '';
  box.html = `${glance}${spark}<div class="grid2" style="margin-top:12px"><div><h3 class="small dim">By ability</h3>${bars}</div><div><h3 class="small dim">What hit you</h3>${taken}</div></div>${note}`;
  if (spark) drawFightSpark(f);
}

/* "0:42", "2:01": an offset into a fight. */
const tsec = n => `${Math.floor(n / 60)}:${pad2(n % 60)}`;
/* Damage a second over the selected fight: the XP chart's form (one hue, three gridlines, crosshair and tooltip,
   arrow keys, the hidden table beside it), 120 px tall. Redrawn only when the fight's data changed. */
function drawFightSpark(f) {
  const wrap = $('#d-spark'); if (!wrap) return;
  const svg = wrap.querySelector('svg'), tip = wrap.querySelector('.tip');
  const tl = f.timeline, step = f.timelineStep || 1;
  const W = Math.max(280, svg.clientWidth || 600), H = svg.clientHeight || 120, pad = { l: 56, r: 12, t: 10, b: 20 };
  const pts = tl.map(([sec, me, pet]) => ({ sec, me, pet, v: me + pet }));
  const maxV = Math.max(1, ...pts.map(p => p.v));
  const end = f.dur;
  const x = sec => pad.l + sec / Math.max(1, end) * (W - pad.l - pad.r);
  const y = v => H - pad.b - v / maxV * (H - pad.t - pad.b);
  if (svg.dataset.drawn !== wrap.dataset.key) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let g = [0, maxV / 2, maxV].map(v => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('');
    g += `<text class="axis" x="${pad.l}" y="${H - 4}">0:00</text><text class="axis" x="${W - pad.r}" y="${H - 4}" text-anchor="end">${tsec(end)}</text>`;
    // Each bucket holds its value for `step` seconds, so the line steps rather than slopes between buckets.
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.sec).toFixed(1)},${y(p.v).toFixed(1)}L${x(Math.min(end, p.sec + step)).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    g += `<path class="line" d="${d}"/>`;
    g += `<line class="xh" y1="${pad.t}" y2="${H - pad.b}" visibility="hidden"/><circle class="xc" r="6" visibility="hidden"/><rect x="${pad.l}" y="0" width="${W - pad.l - pad.r}" height="${H}" fill="transparent" class="hit"/>`;
    svg.innerHTML = g;
    svg.dataset.drawn = wrap.dataset.key;
  }
  const xh = svg.querySelector('.xh'), xc = svg.querySelector('.xc');
  const show = p => {
    const r = svg.getBoundingClientRect(), px = x(p.sec + step / 2), py = y(p.v);
    xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.setAttribute('visibility', 'visible');
    xc.setAttribute('cx', px); xc.setAttribute('cy', py); xc.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.textContent = `${fmt(p.v)} at ${tsec(p.sec)}${step > 1 ? ` (${step} s)` : ''}${p.v && (p.me && p.pet) ? ` · you ${fmt(p.me)} · pets ${fmt(p.pet)}` : p.pet ? ' · pets' : ''}`;
    const left = px * r.width / W + 12;
    tip.style.left = Math.max(0, Math.min(left, r.width - 220)) + 'px'; tip.style.top = '0px';
  };
  const hide = () => { xh.setAttribute('visibility', 'hidden'); xc.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  svg.querySelector('.hit').onmousemove = e => {
    const r = svg.getBoundingClientRect(), mx = (e.clientX - r.left) * W / r.width;
    const sec = (mx - pad.l) / (W - pad.l - pad.r) * end;
    const p = pts[Math.max(0, Math.min(pts.length - 1, Math.floor(sec / step)))];
    show(p);
  };
  svg.querySelector('.hit').onmouseleave = hide;
  let ki = pts.length - 1;
  svg.onkeydown = e => {
    if (e.key === 'ArrowLeft') ki = Math.max(0, ki - 1); else if (e.key === 'ArrowRight') ki = Math.min(pts.length - 1, ki + 1); else return;
    e.preventDefault(); show(pts[ki]);
  };
  svg.onfocus = () => show(pts[ki]);
  svg.onblur = hide;
}

/* Plain text for a Discord paste. Full figures, one line per idea, the source named. */
function discordText(c, f) {
  const who = c.character || 'You';
  const pets = (c.pets || []).filter(p => f.abilities.some(a => a.who === p));
  const petLine = pets.map(p => { const d = f.abilities.filter(a => a.who === p).reduce((x, a) => x + a.dmg, 0); return `${p} ${fmt(d)} (${fmt(d / f.dur)}/s)`; }).join(' · ');
  const top = f.abilities.slice(0, 5).map(a => `${a.who === 'you' ? '' : a.who + ' '}${pretty(a.name)} ${fmt(a.dmg)}`).join(' · ');
  const kills = f.kills + f.petKills;
  return [
    `${who} · ${dateTime(parseChatTs(f.start))}${f.area ? ' · ' + f.area : ''} · ${secs(f.dur).replace(/ /g, ' ')}${f.open ? ' (still going)' : ''}`,
    `Damage ${fmt(f.dmg)} (${fmt(f.dps)}/s) · you ${fmt(f.me)} (${fmt(f.dpsMe)}/s)${petLine ? ' · ' + petLine : ''}`,
    `Kills ${fmt(kills)}${f.petKills ? ` (${fmt(f.petKills)} by pets)` : ''} · taken ${fmt(f.taken)} · deaths ${fmt(f.deaths)}${f.top ? ` · fought ${f.top}${f.targetCount > 1 ? ` +${fmt(f.targetCount - 1)}` : ''}` : ''}`,
    top ? `Top: ${top}` : '',
    f.indirectUnattributed ? `Indirect on targets, source not logged: ${fmt(f.indirectUnattributed)}${f.shared ? ' (others nearby)' : ''}` : '',
    `From ${who}'s chat log via ${APP_NAME}. Party members' hits aren't in it.`,
  ].filter(Boolean).join('\n');
}

function initCombat() {
  $('#dscope').addEventListener('click', e => {
    const b = e.target.closest('[role=tab]'); if (!b || b.disabled) return;
    S.scope = b.dataset.s; store.set('pgdash.xpScope', S.scope);
    combatRound();
    loadSession().then(() => { computeVerdicts(); renderAll(); }).catch(onFetchError);
  });
  tabKeys($('#dscope'));
  const pane = $('#d-fights');
  const pick = id => {
    const c = S.combat, newest = (c?.fights || []).find(x => x.open) || (c?.fights || []).at(-1);
    dUI.selected = id; dUI.pinned = !(newest && newest.id === id);  // picking the live / newest fight resumes following it
    renderCombatView();
  };
  pane.addEventListener('click', e => {
    const sb = e.target.closest('[data-sort]');
    if (sb) {
      const k = sb.dataset.sort, cur = dUI.sort;
      dUI.sort = { key: k, dir: cur.key === k ? (cur.dir === 'asc' ? 'desc' : 'asc') : (k === 'top' ? 'asc' : 'desc') };
      saveSort('fights', dUI.sort); renderCombatView(); return;
    }
    if (e.target.closest('[data-dminor]')) { dUI.minor = !dUI.minor; renderCombatView(); $('#d-fights [data-dminor]')?.focus(); return; }
    const r = e.target.closest('[data-fight]'); if (r) pick(r.dataset.fight);
  });
  pane.addEventListener('keydown', e => {
    const r = e.target.closest('tr[data-fight]');
    if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(r.dataset.fight); }
  });
  $('#d-copy').addEventListener('click', () => {
    const c = S.combat, f = c?.fights?.find(x => x.id === dUI.selected);
    if (f) copyText(discordText(c, f), 'the fight for Discord');
  });
  initParty();
}

/* ===================== vendors ===================== */
/* Vendors view: where can I still sell, and how much will each vendor pay? */

const vUI = {
  mode: 'area', q: '', area: '', hide: false, type: '', selected: null,
  qTypes: null,      // the search box's item lookup: { query, items, examples, types: [{ type, items }] } for vUI.q
  moreTypes: false,  // What they buy: the types past the first twelve are shown
  sort: (store.json('pgdash.sort', {}).vendors) || { key: 'remaining', dir: 'desc' },
  open: (store.json('pgdash.open', {}).vendors) || null,
};

async function loadVendors() {
  const who = S.character ? `?character=${encodeURIComponent(S.character)}` : '';
  const [v, st, m, pl] = await Promise.all([
    api('/api/vendors' + who).then(x => { S.errors.vendors = null; return x; }, e => { if (isNetworkError(e)) throw e; S.errors.vendors = e; return S.vendors; }),
    api('/api/storage' + who).then(x => { S.errors.storage = null; return x; }, e => { if (isNetworkError(e)) throw e; S.errors.storage = e; return S.storage; }),
    // Split stacks: a 404 means an older server.py without the endpoint, not an error.
    api('/api/consolidation' + who).then(x => { S.errors.merge = null; S.mergeOld = false; return x; }, e => { if (isNetworkError(e)) throw e; if (e.status === 404) { S.mergeOld = true; return null; } S.errors.merge = e; return S.merge; }),
    api('/api/plan' + who).then(x => { S.errors.plan = null; S.planOld = false; return x; }, e => { if (isNetworkError(e)) throw e; if (e.status === 404) { S.planOld = true; return null; } S.errors.plan = e; return S.plan; }),
  ]);
  if (v && !S.errors.vendors) { S.vendors = v; S.vendorsAt = NOW(); S.lastGood.vendors = NOW(); }
  if (st && !S.errors.storage) { S.storage = st; S.storageAt = NOW(); S.lastGood.storage = NOW(); }
  if (m && !S.errors.merge) {
    S.merge = m; S.mergeAt = NOW(); S.lastGood.merge = NOW();
    if (Array.isArray(m.items)) needIcons({ typeIds: m.items.map(i => String(i.typeId)) }); // merge rows carry item art
  }
  if (pl && !S.errors.plan) {
    S.plan = pl; S.planAt = NOW(); S.lastGood.plan = NOW();
    if (Array.isArray(pl.items)) needIcons({ typeIds: pl.items.map(i => String(i.typeId)) });
  }
}

const vendorsMissing = () => (S.vendors && S.vendors.error === 'no character export') || (sevOf('character-export') === 'bad' && V('character-export')?.ageSec == null);
// Age mark for a figure label whose source is stale or missing (Vendors At a glance, Here): shape + "3 d old".
const ageMarkOf = (v) => v && (v.severity === 'warn' || v.severity === 'bad') ? `${shape(v.severity, 's13')}<span class="age ${v.severity}">${v.ageSec != null ? ageWord(v.ageSec) + ' old' : 'missing'}</span>` : '';
const oldServerVendors = () => S.vendors?.vendors?.length && !('resetSinceExport' in S.vendors.vendors[0]);

/* Rows with derived fields; ?shift counts resets that pass in the shifted clock. */
function vendorRows() {
  const src = S.vendors?.vendors || [];
  const now = NOW();
  return src.map(r0 => {
    const r = { ...r0 };
    const resetAt = r.exportResetAt ? parseIso(r.exportResetAt) : r.resetsAt ? parseUtc(r.resetsAt) : null;
    if (PREVIEW.shift && resetAt && resetAt <= now && !r.resetSinceExport && (r.spentAtExport ?? r.spent) > 0) {
      r.resetSinceExport = true; r.restored = Math.min(r.spentAtExport ?? r.spent, r.cap); r.spent = 0; r.remaining = r.cap; r.resetsAt = null;
    }
    r.resetT = r.resetsAt ? parseUtc(r.resetsAt) : null;
    r.share = r.cap ? r.remaining / r.cap : 0;
    r.drained = r.cap > 0 && r.remaining < r.cap * 0.02;
    r.rank = favorRank(r.favor);
    r.types = (r.buys || '').split(',').filter(Boolean);
    r.locked = !r.cap;
    return r;
  });
}
function resetSummary(rows) {
  if (!PREVIEW.shift && S.vendors?.resetSummary) return S.vendors.resetSummary;
  if (oldServerVendors()) return null;
  const rs = rows.filter(r => r.resetSinceExport);
  return { count: rs.length, restored: rs.reduce((a, r) => a + (r.restored || 0), 0) };
}
function nextLine(r) {
  if (!r.next) return '';
  const adds = (r.next.types || '').split(',').filter(t => t && !r.types.includes(t)).map(typeLabel);
  return `Next: ${favorLabel(r.next.level)}, ${short(r.next.cap)}${adds.length ? `, adds ${adds.join(', ')}` : ''}`;
}

function renderVendors() {
  const missing = vendorsMissing();
  const rows = vendorRows();
  const live = rows.filter(r => !r.locked);
  const total = live.reduce((a, r) => a + r.remaining, 0);
  const drained = live.filter(r => r.drained);
  const rsum = resetSummary(rows);
  const cv = V('character-export');
  const stale = cv && cv.severity === 'warn';
  const ver = S.vendors?.cdnVersion || cdnVersion();
  const err = S.errors.vendors && !S.vendors?.vendors;
  if (S.view === 'vendors') {
    $('#h1').textContent = 'Vendors';
    $('#title-extra').hidden = true;
    if (S.loading && !S.vendors) { $('#finding').html = '<span class="dim">Reading the character export…</span>'; setStamp('Character export', '…', 'ok'); }
    else if (missing) { $('#finding').textContent = `No character export for ${S.character || 'this character'} yet, so there are no vendor caps to show. Export once and this fills in.`; exportStamp('character-export', 'character'); }
    else if (err) { $('#finding').textContent = "Couldn't load vendors."; exportStamp('character-export', 'character'); }
    else {
      const withReset = live.filter(r => r.resetT && r.resetT > NOW());
      const big = withReset.filter(r => r.spent >= 0.1 * r.cap).sort((a, b) => a.resetT - b.resetT)[0] || withReset.sort((a, b) => a.resetT - b.resetT)[0];
      let f = `Vendors can still pay you <em class="n">${fmt(total)}</em> councils.`;
      if (big) f += ` Biggest refill next: <em class="t">${esc(big.name)}</em> gets <em class="n">${fmt(big.spent)}</em> back in ${dur(big.resetT - NOW())}.`;
      if (stale) f += ` <span class="suffix">These are from a character export ${ageLong(cv.ageSec)} old.</span>`;
      $('#finding').html = f;
      exportStamp('character-export', 'character');
    }
  }

  // At a glance
  const vaults = S.storage?.vaults || [];
  const known = vaults.filter(v => v.capacity != null);
  const slotsFree = known.reduce((a, v) => a + Math.max(0, v.free), 0);
  const sv = V('storage-export');
  const ageMark = ageMarkOf;
  const figs = [];
  if (S.loading && !S.vendors) {
    $('#v-glance').html = ['Councils left', 'Drained', 'Slots Free'].map((l, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${l}</div><div class="val"><span class="loading-bar"></span></div></div>`).join('');
  } else {
    if (!missing && !err) {
      figs.push(`<div class="fig lead"><div class="lb">Councils left ${ageMark(cv)}</div><div class="val">${COIN}${fmt(total)}</div><div class="sub">across ${plural(live.length, 'vendor')}</div></div>`);
      if (drained.length) {
        const next = drained.filter(r => r.resetT).sort((a, b) => a.resetT - b.resetT)[0];
        figs.push(`<div class="fig"><div class="lb">Drained ${ageMark(cv)}</div><div class="val">${fmt(drained.length)}</div><div class="sub">${next ? `next reset in ${dur(next.resetT - NOW())}` : 'reset times unknown'}</div></div>`);
      }
      if (rsum && rsum.count) figs.push(`<div class="fig"><div class="lb">Reset since export ${ageMark(cv)}</div><div class="val">${fmt(rsum.count)}</div><div class="sub">${fmt(rsum.restored)} back, already counted</div></div>`);
    }
    const fullV = known.filter(v => v.capacity != null && v.free <= 0 && v.used), fullN = fullV.length;
    const fullNames = fullV.slice(0, 3).map(vaultName).join(', ') + (fullN > 3 ? ` +${fullN - 3}` : '');
    if (S.storage?.vaults) figs.push(`<div class="fig"><div class="lb">Slots Free ${ageMark(sv)}</div><a class="val" href="#storage">${fmt(slotsFree)}</a><div class="sub">in ${plural(known.length, 'vault')}${fullN ? ` · full: ${esc(fullNames)}` : ''}</div></div>`);
    $('#v-glance').html = figs.join('') || '<p class="empty">Nothing to count yet.</p>';
  }
  $('#w-v-glance').hidden = !figs.length && !S.loading;
  const glL = srcAge('character-export', 'Character export') + (S.storage?.vaults ? ' · ' + srcAge('storage-export', 'Slots Free from storage export') : '');
  const worse = SEV_RANK[sevOf('storage-export')] > SEV_RANK[sevOf('character-export')] && S.storage?.vaults ? ['storage-export', 'After storing:'] : ['character-export', 'After selling:'];
  setFoot('w-v-glance', glL, srcFix(worse[0], worse[1]));
  const footL = srcAge('character-export', 'Character export');
  const footR = srcFix('character-export', 'After selling:');

  // Where to sell
  const filtered = applyVendorFilters(live, { skipArea: true });
  if (S.loading && !S.vendors) $('#v-where').html = '<p class="needs">Reading the character export…</p>';
  else if (missing || err) $('#v-where').html = `<p class="needs">${missing ? 'Needs a character export.' : 'Not loaded.'}</p>`;
  else {
    const byArea = {};
    filtered.forEach(r => { byArea[r.area] = (byArea[r.area] || 0) + r.remaining; });
    const areas = Object.entries(byArea).sort((a, b) => b[1] - a[1]);
    const max = areas[0]?.[1] || 1;
    $('#v-where').html = areas.length ? `<div class="barlist">${areas.slice(0, WHERE_TOP).map(([a, n]) => `<button type="button" class="barrow" data-area="${esc(a)}" aria-pressed="${vUI.area === a}"><span class="nm">${esc(a)}</span><span class="sr">, </span><div class="bar"><i style="width:${Math.max(1, n / max * 100)}%"></i></div><span class="v">${COIN}${fmt(n)}<span class="sr"> councils</span></span></button>`).join('')}</div>${areas.length > WHERE_TOP ? `<p class="small dim" style="margin:6px 8px 0">${plural(areas.length - WHERE_TOP, 'more area')} in the Vendors list below.</p>` : ''}`
      : '<p class="empty">No vendors match these filters.</p>';
  }
  setFoot('w-v-where', footL, footR);

  // What they buy
  if (S.loading && !S.vendors) $('#v-buy').html = '<p class="needs">Reading the character export…</p>';
  else if (missing || err) $('#v-buy').html = `<p class="needs">${missing ? 'Needs a character export.' : 'Not loaded.'}</p>`;
  else {
    const byType = {};
    live.forEach(r => r.types.forEach(t => { byType[t] = (byType[t] || 0) + r.remaining; }));
    const all = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const top = all.slice(0, 12);
    // The pressed type stays visible in the first row even when it sits below the twelve.
    if (vUI.type && byType[vUI.type] != null && !top.some(([t]) => t === vUI.type)) top.push([vUI.type, byType[vUI.type]]);
    const rest = all.filter(([t]) => !top.some(([x]) => x === t)).sort((a, b) => typeLabel(a[0]).localeCompare(typeLabel(b[0])));
    needIcons({ types: Object.keys(byType) });
    const sel = vUI.selected ? rows.find(r => r.npc === vUI.selected) : null;
    const chip = ([t, n]) => {
      const pressed = vUI.type === t || (sel && sel.types.includes(t));
      return `<button type="button" class="chip goods" data-type="${esc(t)}" aria-pressed="${pressed}">${iconImg(S.icons.byType[t], 24)}${esc(typeLabel(t))} <span class="cnt">${short(n)}</span></button>`;
    };
    const more = rest.length ? `<button type="button" class="chip more" data-more aria-expanded="${vUI.moreTypes}" aria-controls="v-buy-rest">${vUI.moreTypes ? 'Fewer types' : `${plural(rest.length, 'more type')}`}</button>` : '';
    $('#v-buy').html = `<div class="chips wrap">${top.map(chip).join('')}${more}</div>${vUI.moreTypes && rest.length ? `<div class="chips wrap" id="v-buy-rest">${rest.map(chip).join('')}</div>` : ''}<p class="small dim" style="margin-top:8px">Councils left per item type, in thousands where marked k. Tap one to filter the vendor list${rest.length ? `; the first twelve by councils are shown, ${vUI.moreTypes ? 'then the rest A to Z' : `${rest.length} more behind the button`}` : ''}.</p>`;
  }
  setFoot('w-v-buy', `${footL} · types from game data v${esc(ver)}`, footR);

  // Vendors pane
  $$('#vmode [role=tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.m === vUI.mode)); b.tabIndex = b.dataset.m === vUI.mode ? 0 : -1; });
  ['#vq', '#varea', '#vhide', '#vsortm'].forEach(s => { $(s).disabled = !!(missing || err); });
  $$('#vmode [role=tab]').forEach(b => { b.disabled = !!(missing || err); });
  const areaSel = $('#varea');
  const allAreas = [...new Set(live.map(r => r.area))].sort();
  const curA = vUI.area;
  areaSel.html = '<option value="">All areas</option>' + allAreas.map(a => `<option ${a === curA ? 'selected' : ''}>${esc(a)}</option>`).join('');
  renderVendorFilters();
  const pane = $('#v-pane');
  if (S.loading && !S.vendors) pane.html = '<div class="pane" style="height:320px"></div>';
  else if (missing) {
    plaqueInView = 'export-character';
    const pl = plaqueFor('export-character');
    pane.html = `<p class="pane-empty">Vendor caps come from your favor in the character export.</p><button type="button" class="plaque plaque-wide" data-fix="export-character" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button>`;
  } else if (err) {
    pane.html = blockError('vendors', S.lastGood.vendors);
  } else renderVendorPane(rows);
  let fr = footR;
  if (oldServerVendors()) fr += ' · Resets since the export need a newer server.py';
  setFoot('w-v-pane', missing ? `Character export · ${shape('bad', 's13')}<span class="age bad">missing</span>` : `${footL} · caps from game data v${esc(ver)}`, missing ? esc(fixText('export-character')) : fr);
  if (missing) { setFoot('w-v-where', `Character export · ${shape('bad', 's13')}<span class="age bad">missing</span>`, esc(fixText('export-character'))); setFoot('w-v-buy', `Character export · ${shape('bad', 's13')}<span class="age bad">missing</span>`, esc(fixText('export-character'))); }
}

/* The item lookup that belongs to the current search text, else null (a stale answer never filters). */
function vendorItemTypes() {
  const l = vUI.qTypes, q = vUI.q.trim().toLowerCase();
  if (!l || l.query !== vUI.q.trim() || l.query.length < 3) return null;
  // Text that already names a type ("skin", "gem") filters by that type alone: the item lookup would add the
  // buyers of every item whose name contains the word (recipe documents, armor) and widen the list.
  const rows = S.vendors?.vendors || [];
  if (rows.some(r => (r.buys || '').split(',').some(t => t && typeLabel(t).toLowerCase().includes(q)))) return null;
  return l;
}
function applyVendorFilters(rows, { skipArea = false } = {}) {
  const q = vUI.q.trim().toLowerCase();
  const qt = (vendorItemTypes()?.types || []).map(t => t.type);  // "figurine" → Artwork, Antique, from the game's item data
  return rows.filter(r => (skipArea || !vUI.area || r.area === vUI.area) && (!vUI.hide || !r.drained) && (!vUI.type || r.types.includes(vUI.type)) &&
    (!q || `${r.name} ${r.buys} ${typeLabel(r.buys)}`.toLowerCase().includes(q) || r.types.some(t => qt.includes(t))));
}
function renderVendorFilters() {
  const chips = [];
  if (vUI.area) chips.push(`<button type="button" class="chip filter" data-clear="area">Area: ${esc(vUI.area)} ✕</button>`);
  if (vUI.type) chips.push(`<button type="button" class="chip filter" data-clear="type">Buys: ${esc(typeLabel(vUI.type))} ✕</button>`);
  if (vUI.selected) { const r = (S.vendors?.vendors || []).find(x => x.npc === vUI.selected); if (r) chips.push(`<button type="button" class="chip filter" data-clear="sel">Selected: ${esc(r.name)} ✕</button>`); }
  $('#vfilters').html = chips.join('');
  $('#vfilters').style.marginBottom = chips.length ? '8px' : '0';
  // Under the search: what the typed item resolves to, so a miss ("coin": no vendor type) is explained, not blank.
  const l = vendorItemTypes(), note = $('#vq-note');
  if (!l) { note.hidden = true; note.html = ''; return; }
  const qq = `“${esc(l.query)}”`;
  if (l.types.length) note.html = `${qq} is sold as ${joinNames(l.types.map(t => `${esc(typeLabel(t.type))} <span class="dim">(${plural(t.items, 'item')})</span>`))}, from game data v${esc(cdnVersion())}.`;
  else if (l.items) note.html = `${qq}: ${plural(l.items, 'item')} in the game data v${esc(cdnVersion())}, none with a type vendors buy${l.examples.length ? ` (${esc(joinNames(l.examples))})` : ''}.`;
  else note.html = `No item named ${qq} in the game data v${esc(cdnVersion())}; matching vendor names and types only.`;
  note.hidden = false;
}

const VENDOR_COMPACT_W = 860;
let vendorCompact = false;
const WHERE_TOP = 5; // keeps the Vendors pane header on the first screen at 1440 x 900
const V_COLS = [
  { k: 'name', label: 'Vendor' }, { k: 'area', label: 'Area', listOnly: true }, { k: 'favor', label: 'Favor' }, { k: 'buys', label: 'Buys' },
  { k: 'remaining', label: 'Left', num: true }, { k: 'share', label: 'Share of cap' }, { k: 'cap', label: 'Cap', num: true }, { k: 'reset', label: 'Resets', num: true },
];
function vSortVal(r, k) {
  if (k === 'favor') return r.rank < 0 ? null : r.rank;
  if (k === 'reset') return r.resetT ?? null;
  if (k === 'name' || k === 'area' || k === 'buys') return String(r[k] || '').toLowerCase();
  return r[k] ?? null;
}
/* Blank values (null or '') sort last in both directions, so the column you sorted by never opens on empties. */
function sortRows(rows, sort, valFn) {
  const d = sort.dir === 'asc' ? 1 : -1;
  const blank = v => v == null || v === '' || (typeof v === 'number' && Number.isNaN(v));
  return rows.slice().sort((a, b) => {
    const A = valFn(a, sort.key), B = valFn(b, sort.key), ab = blank(A), bb = blank(B);
    if (ab || bb) return ab === bb ? 0 : ab ? 1 : -1;
    return (A > B ? 1 : A < B ? -1 : 0) * d;
  });
}
function thSort(col, sort, table) {
  const on = sort.key === col.k;
  return `<th class="${col.num ? 'num' : ''}" aria-sort="${on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button" class="sortbtn" data-sort="${col.k}" data-table="${table}">${col.label}${on ? ARR(sort.dir) : ''}</button></th>`;
}
function vendorRow(r, list, compact = false) {
  const sel = vUI.selected === r.npc;
  const icon = iconImg(S.icons.byType[r.types.find(t => S.icons.byType[t] != null) || r.types[0]], 28, '', r.name);
  const resetCell = r.resetSinceExport
    ? `<span class="tag" title="Reset ${r.exportResetAt ? dateTime(parseIso(r.exportResetAt)) : ''}, after the export">reset</span> <span class="small">+${fmt(r.restored)} back</span>`
    : r.resetT ? `<span title="${dateTime(r.resetT)}">${dur(r.resetT - NOW())}</span>` : '';
  const line2 = [r.drained ? 'drained' : `of ${fmt(r.cap)}`, r.area, favorLabel(r.favor), r.types.map(typeLabel).join(', '), r.resetSinceExport ? `reset, +${fmt(r.restored)} back` : r.resetT ? `resets ${dur(r.resetT - NOW())}` : ''].filter(Boolean).join(' · ');
  return `<tr class="row selectable${r.drained ? ' drained' : ''}" tabindex="0" data-npc="${esc(r.npc)}" aria-selected="${sel}">
    <td class="m1"><span class="cell-name">${icon}<span><span class="nm">${esc(r.name)}</span>${compact ? `<span class="small qty-sub buys-sub">${esc([list ? r.area : '', r.types.map(typeLabel).join(', ')].filter(Boolean).join(' · '))}</span>` : ''}</span></span></td>
    ${list && !compact ? `<td>${esc(r.area)}</td>` : ''}
    <td><div>${esc(favorLabel(r.favor))}</div>${r.next ? `<div class="small">${esc(nextLine(r))}</div>` : ''}</td>
    ${compact ? '' : `<td><div class="buys">${esc(r.types.map(typeLabel).join(', '))}</div></td>`}
    <td class="num m2"><span class="left-fig">${COIN}<b>${fmt(r.remaining)}</b><span class="m-only"> left</span></span>${r.drained ? '<div class="small">drained</div>' : `<div class="small ofcap">of ${fmt(r.cap)}</div>`}<span class="bar m48"><i style="width:${r.share * 100}%"></i></span></td>
    ${compact ? '' : `<td style="min-width:96px"><div class="bar"><i style="width:${r.drained ? 0 : r.share * 100}%"></i></div></td>
    <td class="num">${fmt(r.cap)}</td>`}
    <td class="num">${resetCell}</td>
    <td class="m-line2">${esc(line2)}</td>
  </tr>`;
}
function renderVendorPane(rows) {
  const list = vUI.mode === 'list';
  const live = applyVendorFilters(rows.filter(r => !r.locked));
  const locked = rows.filter(r => r.locked);
  const sort = vUI.sort;
  // Narrow pane (tablet): Share of cap and Cap drop ("of 120,000" under Left still carries the cap) and Buys moves under the name.
  const pw = $('#v-pane').clientWidth;
  const compact = vendorCompact = !PHONE_TABLE_MQ.matches && pw > 0 && pw < VENDOR_COMPACT_W;
  const tail = compact ? 1 : 3;
  const cols = V_COLS.filter(c => (list || !c.listOnly) && !(compact && (c.k === 'share' || c.k === 'cap' || c.k === 'buys' || c.k === 'area')));
  const head = `<thead><tr>${cols.map(c => thSort(c, sort, 'vendors')).join('')}</tr></thead>`;
  const ncol = cols.length;
  let body = '';
  const sorted = sortRows(live, sort, vSortVal);
  if (list) body = sorted.map(r => vendorRow(r, true, compact)).join('');
  else {
    const groups = {};
    sorted.forEach(r => (groups[r.area] ||= []).push(r));
    const areas = Object.entries(groups).map(([a, rs]) => [a, rs, rs.reduce((x, r) => x + r.remaining, 0)]).sort((a, b) => b[2] - a[2]);
    if (!vUI.open) vUI.open = areas.slice(0, 4).map(a => a[0]);
    const forceOpen = !!vUI.q.trim() || !!vUI.type || !!vUI.area;
    for (const [a, rs, sub] of areas) {
      const open = forceOpen || vUI.open.includes(a);
      body += `<tr class="sec"><td colspan="${ncol - 1 - tail}"><button type="button" class="secbtn" data-sec="${esc(a)}" aria-expanded="${open}">${TRI(open)}${esc(a)} <span class="seccount">${plural(rs.length, 'vendor')}</span></button></td><td class="num"><b>${COIN}${fmt(sub)}</b></td><td colspan="${tail}"></td></tr>`;
      if (open) body += rs.map(r => vendorRow(r, false, compact)).join('');
    }
  }
  const total = live.reduce((a, r) => a + r.remaining, 0);
  if (locked.length && !vUI.type && !vUI.q.trim() && !vUI.area) {
    const open = (vUI.open || []).includes('__locked');
    body += `<tr class="sec"><td colspan="${ncol}"><button type="button" class="secbtn" data-sec="__locked" aria-expanded="${open}">${TRI(open)}Locked vendors <span class="seccount">${plural(locked.length, 'vendor')} · not buying from you yet</span></button></td></tr>`;
    if (open) body += locked.map(r => `<tr class="row"><td class="m1" colspan="${ncol}">${esc(r.name)} · ${esc(favorLabel(r.favor))}${r.next ? ` · opens at ${esc(favorLabel(r.next.level))}: ${short(r.next.cap)}${r.next.types ? ', ' + esc(r.next.types.split(',').map(typeLabel).join(', ')) : ''}` : ''}</td><td class="m-line2">${esc(r.area)}</td></tr>`).join('');
  }
  body += `<tr class="grand"><td colspan="${compact ? 2 : list ? 4 : 3}">Total · ${plural(live.length, 'vendor')}</td><td class="num">${COIN}${fmt(total)}</td><td colspan="${tail}"></td></tr>`;
  const sel = vUI.selected ? rows.find(r => r.npc === vUI.selected) : null;
  const under = sel ? `<b>${esc(sel.name)}</b>: ${sel.resetSinceExport ? `reset ${sel.exportResetAt ? dateTime(parseIso(sel.exportResetAt)) : ''}, after the export, +${fmt(sel.restored)} back` : sel.resetT ? `resets ${dateTime(sel.resetT)}` : 'full, no reset pending'}${sel.next ? ' · ' + esc(nextLine(sel)) : ''}` : '';
  $('#v-pane').html = !live.length && (vUI.q || vUI.type || vUI.area)
    ? `<p class="empty">No vendors match${vUI.q ? ` "${esc(vUI.q)}"` : ' these filters'}. Try the item type, like Gem or Crystal.</p>`
    : live.length || locked.length
      ? `<div class="pane"><table class="tbl resp">${head}<tbody>${body}</tbody></table></div><div class="pane-under" aria-live="polite">${under || 'Select a vendor to see its next reset and what its goods are.'}</div>`
      : `<p class="empty">No vendors match "${esc(vUI.q)}". Try the item type, like Gem or Crystal.</p>`;
  fillSortSelect('#vsortm', V_COLS.filter(c => list || !c.listOnly), vUI.sort);
}

function initVendors() {
  vUI.mode = 'area';
  let lookupTimer = null;
  $('#vq').addEventListener('input', e => {
    vUI.q = e.target.value; renderVendors();
    clearTimeout(lookupTimer);
    const q = vUI.q.trim();
    if (q.length < 3) return;
    lookupTimer = setTimeout(async () => {  // one request per pause in typing; the answer applies only if the text still matches
      try {
        const r = await api(`/api/lookup?item=${encodeURIComponent(q)}`);
        if (r?.item && vUI.q.trim() === q) { vUI.qTypes = r.item; renderVendors(); }
      } catch (err) { /* the search still matches vendor names and types */ }
    }, 250);
  });
  $('#varea').addEventListener('change', e => { vUI.area = e.target.value; renderVendors(); });
  $('#vhide').addEventListener('change', e => { vUI.hide = e.target.checked; renderVendors(); });
  $('#vmode').addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (!b) return; vUI.mode = b.dataset.m; renderVendors(); });
  tabKeys($('#vmode'));
  $('#v-where').addEventListener('click', e => { const b = e.target.closest('[data-area]'); if (!b) return; vUI.area = vUI.area === b.dataset.area ? '' : b.dataset.area; renderVendors(); });
  $('#v-buy').addEventListener('click', e => {
    if (e.target.closest('[data-more]')) { vUI.moreTypes = !vUI.moreTypes; renderVendors(); $('#v-buy [data-more]')?.focus(); return; }
    const b = e.target.closest('[data-type]'); if (!b) return; vUI.type = vUI.type === b.dataset.type ? '' : b.dataset.type; renderVendors();
  });
  $('#vfilters').addEventListener('click', e => {
    const b = e.target.closest('[data-clear]'); if (!b) return;
    if (b.dataset.clear === 'area') vUI.area = ''; else if (b.dataset.clear === 'type') vUI.type = ''; else vUI.selected = null;
    renderVendors();
  });
  $('#vsortm').addEventListener('change', e => { const [k, d] = e.target.value.split(':'); vUI.sort = { key: k, dir: d }; saveSort('vendors', vUI.sort); renderVendors(); });
  const pane = $('#v-pane');
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    const w = pane.clientWidth, c = !PHONE_TABLE_MQ.matches && w > 0 && w < VENDOR_COMPACT_W;
    if (c !== vendorCompact && S.vendors?.vendors && S.view === 'vendors') renderVendors();
  }).observe(pane);
  pane.addEventListener('click', e => {
    const sb = e.target.closest('[data-sort]');
    if (sb) {
      const k = sb.dataset.sort, cur = vUI.sort, text = ['name', 'area', 'buys'].includes(k);
      vUI.sort = { key: k, dir: cur.key === k ? (cur.dir === 'asc' ? 'desc' : 'asc') : (text || k === 'reset' ? 'asc' : 'desc') };
      saveSort('vendors', vUI.sort); renderVendors(); return;
    }
    const sec = e.target.closest('[data-sec]');
    if (sec) {
      const a = sec.dataset.sec; vUI.open = vUI.open || [];
      vUI.open = vUI.open.includes(a) ? vUI.open.filter(x => x !== a) : [...vUI.open, a];
      saveOpen('vendors', vUI.open); renderVendors();
      $(`#v-pane [data-sec="${CSS.escape(a)}"]`)?.focus();
      return;
    }
    const row = e.target.closest('tr[data-npc]');
    if (row) { vUI.selected = vUI.selected === row.dataset.npc ? null : row.dataset.npc; renderVendors(); $(`#v-pane tr[data-npc="${CSS.escape(row.dataset.npc)}"]`)?.focus(); }
  });
  pane.addEventListener('keydown', e => {
    const row = e.target.closest('tr[data-npc]');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); }
    if (e.key === 'Escape' && vUI.selected) { vUI.selected = null; renderVendors(); }
  });
}

/* ===================== storage ===================== */
/* Storage view: where is there room, and what am I holding? */

const sUI = {
  q: '', hide: false, area: '', selected: null,
  sort: (store.json('pgdash.sort', {}).vaults) || { key: 'free', dir: 'asc' },
  open: (store.json('pgdash.open', {}).vaults) || null,
  msgs: {}, // vault -> {kind, text}
  iq: '', iloc: '', isort: (store.json('pgdash.sort', {}).items) || { key: 'value', dir: 'desc' }, ilimit: 200, ifold: new Set(), imode: 'items',
  mmode: 'items', // Stacks to merge: 'items' (by item) or 'stops' (pickup plan); not persisted
  pmode: 'stops', // Sell and store: 'stops' (the route) or 'items' (one row per stack); not persisted
};
const PROV = { favor: 'from favor', stat: 'from your stats', fixed: 'fixed size', manual: 'typed in by you' };

const storageMissing = () => (S.storage && S.storage.error === 'no items export') || (sevOf('storage-export') === 'bad' && V('storage-export')?.ageSec == null);
function storageReports() { return (S.reports || []).filter(r => r.report === 'Storage' && r.character === S.character).sort((a, b) => parseUtc(b.timestamp) - parseUtc(a.timestamp)); }
function newestItemsFile() { return storageReports()[0]?.file || null; }
const vaultName = v => v.vault === 'Inventory' ? 'Inventory' : pretty(v.name);
const vaultArea = v => v.vault === 'Inventory' ? 'Carried' : (v.area || 'Elsewhere');

function vaultRows() {
  return (S.storage?.vaults || []).map(v => ({
    ...v, nm: vaultName(v), ar: vaultArea(v), rank: favorRank(v.favor),
    unknown: v.capacity == null, full: v.capacity != null && v.free <= 0,
  }));
}
function vSortStorage(r, k) {
  if (k === 'name') return r.nm.toLowerCase();
  if (k === 'favor') return r.rank < 0 ? null : r.rank;
  if (k === 'accepts') return (r.accepts || '').toLowerCase();
  if (k === 'free') return r.unknown ? null : r.free;
  if (k === 'capacity') return r.capacity ?? null;
  if (k === 'value') return r.value || null;
  return r[k] ?? null;
}

function renderStorage() {
  const missing = storageMissing();
  const err = S.errors.storage && !S.storage?.vaults;
  const rows = vaultRows();
  const known = rows.filter(v => !v.unknown);
  const free = known.reduce((a, v) => a + Math.max(0, v.free), 0);
  const full = known.filter(v => v.full && v.used);
  const unknown = rows.filter(v => v.unknown);
  const value = rows.reduce((a, v) => a + (v.value || 0), 0);
  const stacks = rows.reduce((a, v) => a + (v.used || 0), 0);
  const sv = V('storage-export');
  const stale = sv && sv.severity === 'warn';
  // Split stacks come from the same export; a figure and a finding sentence only when a merge would free something.
  const mergeBack = !S.merge?.error && S.merge?.summary?.slotsBack > 0 ? S.merge.summary.slotsBack : 0;
  if (S.view === 'storage') {
    $('#h1').textContent = 'Storage';
    $('#title-extra').hidden = true;
    if (S.loading && !S.storage) { $('#finding').html = '<span class="dim">Reading the storage export…</span>'; setStamp('Storage export', '…', 'ok'); }
    else if (missing) { $('#finding').textContent = `No storage export for ${S.character || 'this character'} yet, so there's nothing to count. Export once and this fills in.`; exportStamp('storage-export', 'storage'); }
    else if (err) { $('#finding').textContent = "Couldn't load storage."; exportStamp('storage-export', 'storage'); }
    else {
      let f = `<em class="n">${fmt(free)}</em> slots free.`;
      if (full.length) f += ` ${joinNames(full.slice(0, 3).map(v => `<em class="t">${esc(v.nm)}</em>`))}${full.length > 3 ? ` and ${full.length - 3} more` : ''} ${full.length === 1 ? 'is' : 'are'} full.`;
      if (unknown.length) f += ` <em class="n">${unknown.length}</em> ${unknown.length === 1 ? 'vault has' : 'vaults have'} no known size.`;
      if (mergeBack > 0) f += ` Merging split stacks would free <em class="n">${fmt(mergeBack)}</em> more.`;
      if (stale) f += ` <span class="suffix">These are from a storage export ${ageLong(sv.ageSec)} old.</span>`;
      $('#finding').html = f;
      exportStamp('storage-export', 'storage');
    }
  }
  const footL = srcAge('storage-export', 'Storage export');
  const footR = srcFix('storage-export', 'After storing:');
  const missL = `Storage export · ${shape('bad', 's13')}<span class="age bad">missing</span>`;
  const missR = esc(fixText('export-storage'));

  // At a glance
  const ageMark = sv && (sv.severity === 'warn') ? `${shape('warn', 's13')}<span class="age warn">${ageWord(sv.ageSec)} old</span>` : '';
  if (S.loading && !S.storage) $('#t-glance').html = ['Slots Free', 'Full', 'Vendor value held'].map((l, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${l}</div><div class="val"><span class="loading-bar"></span></div></div>`).join('');
  else if (!missing && !err) {
    const figs = [`<div class="fig lead"><div class="lb">Slots Free ${ageMark}</div><div class="val">${fmt(free)}</div><div class="sub">in ${plural(known.length, 'vault')}</div></div>`];
    if (full.length) figs.push(`<div class="fig"><div class="lb">Full</div><div class="val">${fmt(full.length)}</div><div class="sub">${esc(full.slice(0, 3).map(v => v.nm).join(', '))}</div></div>`);
    if (unknown.length) figs.push(`<div class="fig"><div class="lb">Unknown sizes</div><div class="val">${fmt(unknown.length)}</div><div class="sub">set them below</div></div>`);
    if (mergeBack > 0) figs.push(`<div class="fig"><div class="lb">By merging ${ageMark}</div><div class="val">${fmt(mergeBack)}</div><div class="sub">slots back · ${plural(S.merge.summary.itemsToMerge || 0, 'item')}</div></div>`);
    if (value) figs.push(`<div class="fig"><div class="lb">Vendor value held</div><div class="val">${COIN}${fmt(value)}</div><div class="sub">${plural(stacks, 'stack')}</div></div>`);
    $('#t-glance').html = figs.join('');
  }
  $('#w-t-glance').hidden = (missing || err) && !S.loading;
  setFoot('w-t-glance', footL, footR);

  // Where there's room
  if (missing || err) $('#t-room').html = `<p class="needs">${missing ? 'Needs a storage export.' : 'Not loaded.'}</p>`;
  else {
    const byArea = {};
    known.forEach(v => { byArea[v.ar] = (byArea[v.ar] || 0) + Math.max(0, v.free); });
    const areas = Object.entries(byArea).sort((a, b) => b[1] - a[1]);
    const max = areas[0]?.[1] || 1;
    $('#t-room').html = areas.length ? `<div class="barlist cols2">${areas.map(([a, n]) => `<button type="button" class="barrow" data-area="${esc(a)}" aria-pressed="${sUI.area === a}"><span class="nm">${esc(a)}</span><span class="sr">, </span><div class="bar"><i style="width:${n ? Math.max(1, n / max * 100) : 0}%"></i></div><span class="v">${n ? fmt(n) + ' free' : 'Full'}</span></button>`).join('')}</div>`
      : '<p class="empty">No vaults with a known size yet.</p>';
  }
  setFoot('w-t-room', missing ? missL : footL, missing ? missR : footR);

  // Vaults pane
  ['#sq', '#shide', '#ssortm'].forEach(s => { $(s).disabled = !!(missing || err); });
  const pane = $('#t-pane');
  const busy = pane.contains(document.activeElement) && document.activeElement.classList.contains('sizein');
  if (S.loading && !S.storage) pane.html = '<div class="pane" style="height:320px"></div>';
  else if (missing) {
    plaqueInView = 'export-storage';
    const pl = plaqueFor('export-storage');
    pane.html = `<p class="pane-empty">Vault contents come from the storage export.</p><button type="button" class="plaque plaque-wide" data-fix="export-storage" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button>`;
  } else if (err) pane.html = blockError('storage', S.lastGood.storage);
  else if (!busy && !pane.querySelector('.sizein[data-dirty]')) renderVaultPane(rows);
  const sheet = S.storage?.sheet;
  const sizeSrc = sheet ? `sizes from your favor in the character export of ${dayMon(parseUtc(sheet.timestamp))}` : 'sizes from favor unknown (no character export)';
  setFoot('w-t-pane', missing ? missL : `${footL} · ${sizeSrc}`, missing ? missR : footR);

  renderMerge();
  renderPlan();
  renderItems();
}

/* Stacks to merge: one item held in more than one place (/api/consolidation, export-only).
   Freshness is the storage-export verdict, carried by the footer like the other Storage windows. */
const mergeSource = m => m.from === 'Inventory' ? 'your inventory' : m.from === 'Saddlebag' ? 'your saddlebag' : m.name; // carried sources are only these two
const SKIP_WORDS = { unstackable: "that don't stack (gear and the like)", noGain: 'already in full stacks', perItem: 'with per-item powers or wear', carryLimit: 'over their carry limit', unknownType: 'unknown to game data', unknownLocation: 'in a place the export doesn\'t name' };
function renderMerge() {
  const box = $('#t-merge');
  if (!box) return;
  const m = S.merge;
  const missing = storageMissing() || m?.error === 'no items export';
  const err = !missing && ((S.errors.merge && !m?.items) || !!m?.error);
  const footL = `${srcAge('storage-export', 'Storage export')} · stack sizes from game data v${esc(m?.cdnVersion || cdnVersion())}`;
  const footR = srcFix('storage-export', 'After moving things:');
  let tabsOn = false, count = '';
  if (S.mergeOld) {
    box.html = '<p class="needs">Needs a newer server.py.</p>';
    setFoot('w-t-merge', footL, 'Stacks to merge need a newer server.py');
  } else if (missing) {
    box.html = '<p class="needs">Needs a storage export.</p>';
    setFoot('w-t-merge', `Storage export · ${shape('bad', 's13')}<span class="age bad">missing</span>`, esc(fixText('export-storage')));
  } else if (S.loading && !m && !S.errors.merge) {
    box.html = '<div class="loading-bar" style="width:100%;height:120px"></div>';
    setFoot('w-t-merge', 'Loading the storage export…', '');
  } else if (err) {
    box.html = blockError('stacks to merge', S.lastGood.merge);
    setFoot('w-t-merge', footL, footR);
  } else if (!m?.items?.length) {
    // Count by reason (summary.skipped), never splitNames: that is every split name, stackable or not.
    const sk = m?.summary?.skipped || {}, un = sk.unstackable || 0;
    const rest = Object.entries(sk).filter(([k, n]) => k !== 'unstackable' && n > 0).map(([k, n]) => `${fmt(n)} ${SKIP_WORDS[k] || k}`);
    box.html = `<p class="empty">Nothing to merge. Every stackable item is already in one place.${un ? ` ${plural(un, 'item is', 'items are')} split across vaults but ${un === 1 ? "doesn't" : "don't"} stack.` : ''}${rest.length ? ` Also split: ${esc(rest.join(', '))}.` : ''}</p>`;
    setFoot('w-t-merge', footL, footR);
  } else {
    tabsOn = true;
    const s = m.summary || {};
    count = ` · ${plural(s.slotsBack, 'slot')}`;
    const itemsPanel = `<div id="t-merge-items" role="tabpanel" aria-labelledby="tm-items" ${sUI.mmode === 'items' ? '' : 'hidden'}>${mergeByItem(m)}</div>`;
    const stopsPanel = `<div id="t-merge-stops" role="tabpanel" aria-labelledby="tm-stops" ${sUI.mmode === 'stops' ? '' : 'hidden'}>${mergeByStop(m)}</div>`;
    box.html = itemsPanel + stopsPanel;
    setFoot('w-t-merge', footL, footR);
  }
  $('#tmode-wrap').hidden = !tabsOn;
  $$('#tmode [role=tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.m === sUI.mmode)); b.tabIndex = b.dataset.m === sUI.mmode ? 0 : -1; });
  $('#t-merge-count').textContent = count;
}
/* BY ITEM: the lead sentence, what's not counted, then one row per item with what to take and where to put it. */
function mergeByItem(m) {
  const s = m.summary || {}, back = s.slotsBack || 0, vault = s.vaultSlotsBack || 0, bag = s.bagSlotsBack || 0;
  const where = vault && bag ? `: ${fmt(vault)} in vaults, ${fmt(bag)} in your inventory` : bag ? ' in your inventory' : ' in your vaults';
  let html = `<p>Merge these ${plural(s.itemsToMerge || m.items.length, 'item')} and ${plural(back, 'slot')} come${back === 1 ? 's' : ''} back${where}.</p>`;
  const skipped = Object.entries(s.skipped || {}).filter(([, n]) => n > 0);
  if (skipped.length) html += `<p class="small dim" style="margin-top:4px">Not counted: ${esc(skipped.map(([k, n], i) => `${fmt(n)}${i ? '' : ` split ${n === 1 ? 'item' : 'items'}`} ${SKIP_WORDS[k] || k}`).join(', '))}.</p>`;
  const rows = m.items.map(i => {
    const take = i.moves.map(mv => `${fmt(mv.qty)} from ${mv.from === 'Inventory' ? 'your inventory' : mv.name}`).join(', ');
    const chips = `${i.to.needsRoom > 0 ? ` <span class="tag">needs ${plural(i.to.needsRoom, 'slot')}</span>` : ''}${i.to.roomUnknown ? ' <span class="tag">size unknown</span>' : ''}`;
    const tip = `${fmt(i.total)} in ${plural(i.stacksNow, 'stack')}, max ${fmt(i.maxStack)} a stack, ${plural(i.stacksAfter, 'stack')} after`;
    return `<tr class="row" title="${esc(tip)}"><td class="m1"><span class="cell-name">${iconImg(S.icons.byTypeId[String(i.typeId)], 24)}<span>${esc(i.name)}</span></span></td>
      <td>${esc(take)}</td><td><em class="t">${esc(i.to.name)}</em>${i.to.area ? ` · <em class="t">${esc(i.to.area)}</em>` : ''}${chips}</td>
      <td class="num m2"><b>${fmt(i.slotsBack)}</b><span class="m-only"> ${i.slotsBack === 1 ? 'slot' : 'slots'}</span></td>
      <td class="m-line2">${esc(take)} · to ${esc(i.to.name)}${i.to.area ? ` (${esc(i.to.area)})` : ''}${chips}</td></tr>`;
  }).join('');
  html += `<table class="tbl resp-plain" style="margin-top:10px"><thead><tr><th scope="col">Item</th><th scope="col">Take</th><th scope="col">Put in</th><th scope="col" class="num">Slots back</th></tr></thead><tbody>${rows}</tbody></table>`;
  return html;
}
/* BY STOP: the pickup plan, one section per area to stand in, the area you're in first. */
function mergeByStop(m) {
  const here = loggedIn() ? S.health?.game?.area : null;
  const stops = [...(m.stops || [])].sort((a, b) => (b.area === here) - (a.area === here));
  const name = (s, cls = 't') => `<em class="${cls}">${esc(s)}</em>`;
  return stops.map(st => {
    const head = st.area === 'Anywhere' ? 'Anywhere (area unknown)' : st.area || 'Elsewhere'; // only CDN Area "*" vaults other than the saddlebag land here
    const groups = (st.vaults || []).map(g => {
      const carried = g.vault === 'carried';
      const qty = g.lines.reduce((a, l) => a + (l.qty || 0), 0);
      const room = carried ? '' : g.free == null ? ' · size unknown' : ` · ${fmt(g.free)} free now, ${fmt(g.after)} after${g.short > 0 ? ` <span class="tag">${plural(g.short, 'slot')} short</span>` : ''}`;
      const lead = carried ? `Carried · ${fmt(qty)} to put in` : `${esc(g.name)} · ${fmt(qty)} to take${room}`;
      const lines = g.lines.map(l => {
        let what;
        if (l.carried) what = `Put <em class="n">${fmt(l.qty)}</em> ${esc(l.name)} from ${mergeSource({ from: l.from, name: l.fromName })} into ${name(l.toName)}`;
        else if (l.to === 'Saddlebag') what = `Take <em class="n">${fmt(l.qty)}</em> ${esc(l.name)} from ${name(l.fromName)}, put in your saddlebag`; // the saddlebag is with you: nothing to carry anywhere
        else if (l.toArea === 'Anywhere') what = `Take <em class="n">${fmt(l.qty)}</em> ${esc(l.name)} from ${name(l.fromName)}, put in ${name(l.toName)} <span class="tag">area unknown</span>`; // CDN Area "*" vault: where it is reached is not verified
        else if (l.sameArea) what = `Take <em class="n">${fmt(l.qty)}</em> ${esc(l.name)} from ${name(l.fromName)}, put in ${name(l.toName)}`;
        else what = `Take <em class="n">${fmt(l.qty)}</em> ${esc(l.name)} from ${name(l.fromName)}, put in ${name(l.toName)} (${name(l.toArea)}) <span class="tag">carry to ${esc(l.toArea)}</span>`;
        return `<li>${iconImg(S.icons.byTypeId[String(l.typeId)], 24)}<span class="what">${what}</span></li>`;
      }).join('');
      return `<p class="from">${lead}</p><ul class="list feed-what">${lines}</ul>`;
    }).join('');
    return `<section class="stop"><h3>${esc(head)} · ${plural(st.moves, 'move')}${st.area === here ? ' <span class="tag">you\'re here</span>' : ''}</h3>${groups}</section>`;
  }).join('');
}

/* ===================== Sell and store (Storage) ===================== */
/* GET /api/plan: what to do with every stack in the inventory. Sell = vendor trash to the vendor with the most
   councils left who buys it; store = everything else, to a vault with room that already holds the type if there is
   one; gear is the player's call (worn gear can't be told from carried in the export) and is shown, not counted. */
function renderPlan() {
  const box = $('#t-plan');
  if (!box) return;
  const p = S.plan;
  const missing = storageMissing() || p?.error === 'no items export';
  const err = !missing && ((S.errors.plan && !p?.items) || !!p?.error);
  const mult = p?.multiplier ? `×${(+p.multiplier).toFixed(2)}` : '';
  const footL = `${srcAge('storage-export', 'Storage export')} · ${srcAge('character-export', 'Character export')}${mult ? ` · prices ${mult} from your stats, not checked in game` : ''}`;
  const footR = srcFix('storage-export', 'After selling or storing:');
  let tabsOn = false, count = '';
  if (S.planOld) {
    box.html = '<p class="needs">Needs a newer Gorgon Notes.</p>';
    setFoot('w-t-plan', footL, 'The plan needs a newer Gorgon Notes');
  } else if (missing) {
    box.html = '<p class="needs">Needs a storage export.</p>';
    setFoot('w-t-plan', `Storage export · ${shape('bad', 's13')}<span class="age bad">missing</span>`, esc(fixText('export-storage')));
  } else if (S.loading && !p && !S.errors.plan) {
    box.html = '<div class="loading-bar" style="width:100%;height:120px"></div>';
    setFoot('w-t-plan', 'Loading the exports…', '');
  } else if (err) {
    box.html = blockError('the sell and store plan', S.lastGood.plan);
    setFoot('w-t-plan', footL, footR);
  } else if (!p.summary?.stacks) {
    box.html = '<p class="empty">Your bags are empty in this export. Nothing to sell or store.</p>';
    setFoot('w-t-plan', footL, footR);
  } else {
    tabsOn = true;
    count = ` · ${plural(p.summary.stops, 'stop')}`;
    const lead = planLead(p);
    const stopsPanel = `<div id="t-plan-stops" role="tabpanel" aria-labelledby="tp-stops" ${sUI.pmode === 'stops' ? '' : 'hidden'}>${lead}${planByStop(p)}</div>`;
    const itemsPanel = `<div id="t-plan-items" role="tabpanel" aria-labelledby="tp-items" ${sUI.pmode === 'items' ? '' : 'hidden'}>${lead}${planByItem(p)}</div>`;
    box.html = stopsPanel + itemsPanel;
    setFoot('w-t-plan', footL, footR);
  }
  $('#pmode-wrap').hidden = !tabsOn;
  $$('#pmode [role=tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.m === sUI.pmode)); b.tabIndex = b.dataset.m === sUI.pmode ? 0 : -1; });
  $('#t-plan-count').textContent = count;
}
function planLead(p) {
  const s = p.summary, sell = s.sell, store = s.store, gear = s.gear;
  const parts = [];
  if (sell.stacks) parts.push(`sell <em class="n">${fmt(sell.stacks)}</em> ${sell.stacks === 1 ? 'stack' : 'stacks'} ${sell.vendors === 1 ? `to ${esc(p.stops.flatMap(st => st.sell).find(Boolean)?.name || 'one vendor')}` : `at ${plural(sell.vendors, 'vendor')}`} for about <em class="n">${fmt(sell.councils)}</em> councils`);
  if (store.stacks) parts.push(`store <em class="n">${fmt(store.stacks)}</em> ${store.stacks === 1 ? 'stack' : 'stacks'} in ${plural(store.vaults, 'vault')}`);
  let html = `<p>${parts.length ? `Empty your bags in <em class="n">${fmt(s.stops)}</em> ${s.stops === 1 ? 'stop' : 'stops'}: ${parts.join(', ')}.` : 'Nothing to sell or store from here.'}`;
  if (gear.stacks) html += ` <em class="n">${fmt(gear.stacks)}</em> ${gear.stacks === 1 ? 'piece' : 'pieces'} of gear ${gear.stacks === 1 ? 'is' : 'are'} your call${gear.councils ? ` (about ${fmt(gear.councils)} at vendors)` : ''}.`;
  if (s.stays) html += ` <em class="n">${fmt(s.stays)}</em> ${s.stays === 1 ? 'stack stays' : 'stacks stay'}: no vault has room.`;
  html += '</p>';
  const notes = [];
  if (s.unsellable) notes.push(`${fmt(s.unsellable)} of the stored stacks no vendor buys`);
  if (!p.sheet) notes.push('no character export, so vendors and the sale price are unknown');
  if (gear.stacks) notes.push("worn gear can't be told from carried in the export");
  if (s.inventoryFree != null) notes.push(`${fmt(s.inventoryFree)} free ${s.inventoryFree === 1 ? 'slot' : 'slots'} in your bags now`);
  if (notes.length) html += `<p class="small dim" style="margin-top:4px">${esc(notes.join('. '))}.</p>`;
  return html;
}
function planByStop(p) {
  const here = loggedIn() ? S.health?.game?.area : null;
  const stops = [...(p.stops || [])].sort((a, b) => (b.area === here) - (a.area === here));
  const name = (t, cls = 't') => `<em class="${cls}">${esc(t)}</em>`;
  return stops.map(st => {
    const head = st.area === 'Anywhere' ? 'Anywhere (carried, or area unknown)' : st.area;
    const sells = (st.sell || []).map(g => `<p class="from">Sell to ${name(g.name)} · ${plural(g.stacks, 'stack')} · about <em class="n">${fmt(g.councils)}</em> councils <span class="dim">(can still pay ${fmt(g.left)}, ${fmt(g.after)} after)</span></p>
      <ul class="list feed-what">${g.items.map(i => `<li>${iconImg(S.icons.byTypeId[String(i.typeId)], 24)}<span class="what">${i.qty > 1 ? `<em class="n">${fmt(i.qty)}</em> ` : ''}${esc(i.name)}</span><span class="n">${fmt(i.councils)}</span></li>`).join('')}</ul>`).join('');
    const stores = (st.store || []).map(g => `<p class="from">Store at ${name(g.name)} · ${plural(g.stacks, 'stack')} <span class="dim">(${g.free == null ? 'size unknown' : `${fmt(g.free)} free, ${fmt(g.after)} after`})</span></p>
      <ul class="list feed-what">${g.items.map(i => `<li>${iconImg(S.icons.byTypeId[String(i.typeId)], 24)}<span class="what">${i.qty > 1 ? `<em class="n">${fmt(i.qty)}</em> ` : ''}${esc(i.name)}</span></li>`).join('')}</ul>`).join('');
    return `<section class="stop"><h3>${esc(head)} · ${plural(st.stacks, 'stack')}${st.councils ? ` · about ${fmt(st.councils)} councils` : ''}${st.area === here ? ' <span class="tag">you\'re here</span>' : ''}</h3>${sells}${stores}</section>`;
  }).join('') || '<p class="empty">No stops: nothing can be sold or stored from here.</p>';
}
function planByItem(p) {
  const order = { sell: 0, store: 1, gear: 2, stays: 3 };
  const rows = [...p.items].sort((a, b) => order[a.action] - order[b.action] || b.price - a.price).map(i => {
    let doText, about = '';
    if (i.action === 'sell') { doText = `Sell to <em class="t">${esc(i.sellTo.name)}</em> · ${esc(i.sellTo.area)}${i.note ? ` <span class="tag">${esc(i.note)}</span>` : ''}`; about = fmt(i.sellTo.councils); }
    else if (i.action === 'store') { doText = `Store at <em class="t">${esc(i.storeAt.name)}</em>${i.storeAt.area ? ` · ${esc(i.storeAt.area)}` : ''}${i.storeAt.holdsSome ? ' <span class="tag">has some already</span>' : ''}${i.why ? ` <span class="tag">${esc(i.why)}</span>` : ''}${i.sellTo ? ` <span class="small dim">or ${esc(i.sellTo.name)} pays about ${fmt(i.sellTo.councils)}</span>` : ''}`; }
    else if (i.action === 'gear') { doText = `Your call${i.sellTo ? ` · ${esc(i.sellTo.name)} pays about ${fmt(i.sellTo.councils)}` : ''}${i.storeAt ? ` · or store at ${esc(i.storeAt.name)}` : ''}`; about = i.sellTo ? fmt(i.sellTo.councils) : ''; }
    else doText = `Stays <span class="tag">${esc(i.note || 'no room')}</span>`;
    return `<tr class="row"><td class="m1"><span class="cell-name">${iconImg(S.icons.byTypeId[String(i.typeId)], 24)}<span>${esc(i.name)}</span></span></td><td class="num">${fmt(i.qty)}</td><td>${doText}</td><td class="num m2">${about}</td><td class="m-line2">${fmt(i.qty)} · ${doText}${about ? ` · about ${about}` : ''}</td></tr>`;
  }).join('');
  return `<table class="tbl resp-plain" style="margin-top:10px"><thead><tr><th scope="col">Item</th><th scope="col" class="num">Qty</th><th scope="col">Do</th><th scope="col" class="num">About</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function stripHtml(v) {
  if (v.unknown) {
    const n = Math.min(v.used, 40);
    return `<span class="strip" aria-hidden="true">${'<i></i>'.repeat(n)}<i class="u"></i><i class="u"></i></span>`;
  }
  const cap = v.capacity, used = Math.min(v.used, cap);
  if (cap <= 20) return `<span class="strip" aria-hidden="true">${'<i></i>'.repeat(used)}${'<i class="f"></i>'.repeat(Math.max(0, cap - used))}</span>`;
  const ticks = Array.from({ length: Math.floor(cap / 10) - (cap % 10 ? 0 : 1) }, (_, i) => `<s style="left:${(i + 1) * 10 / cap * 100}%"></s>`).join('');
  return `<span class="longstrip" aria-hidden="true"><i style="width:${used / cap * 100}%"></i>${ticks}</span>`;
}
function slotsCell(v, sfx = '') {
  const msg = sUI.msgs[v.vault];
  const id = `${esc(v.vault)}${sfx}`;
  const showInput = v.unknown || v.capacitySource === 'manual';
  const prov = v.unknown ? (S.storage?.sheet ? 'unknown' : 'needs character export') : PROV[v.capacitySource] || '';
  const msgHtml = msg ? `<span class="sizemsg" id="msg-${id}">${msg.kind === 'error' ? `${shape('bad', 's13').replace('sev-bad', 'flag')} ` : ''}${esc(msg.text)}</span>` : '';
  if (showInput) {
    // On a phone (sfx '-m') the label is visible: sighted players need to know what the box is.
    const lab = sfx ? `<label class="m-sizelab" for="size-${id}">Slots, ${esc(prov)}</label> ` : `<label class="sr" for="size-${id}">Size of ${esc(v.nm)}</label>`;
    return `${lab}<input class="sizein" id="size-${id}" type="number" min="1" max="999" step="1" inputmode="numeric" placeholder="size" data-vault="${esc(v.vault)}" value="${v.capacitySource === 'manual' ? v.capacity : ''}"${msg?.kind === 'error' ? ` aria-invalid="true" aria-describedby="msg-${id}"` : ''}> <span class="tag">${esc(prov)}</span>${msgHtml}`;
  }
  return `${fmt(v.capacity)} <span class="tag">${esc(prov)}</span>${msgHtml}`;
}
const S_COLS = [
  { k: 'name', label: 'Vault' }, { k: 'favor', label: 'Favor' }, { k: 'accepts', label: 'Accepts' }, { k: 'used', label: 'Used', num: true },
  { k: 'strip', label: 'Slots used', nosort: true }, { k: 'capacity', label: 'Slots', num: true }, { k: 'free', label: 'Free', num: true }, { k: 'value', label: 'Value held', num: true },
];
/* Narrow pane (tablet, or desktop with the margin beside it): Favor moves under the vault name and
   Accepts drops, so Slots, Free and Value held stay in view without a sideways scroll. */
const PHONE_TABLE_MQ = window.matchMedia('(max-width: 639px)');
const VAULT_COMPACT_W = 900;
let vaultCompact = false;
function vaultRow(v, compact = false, tight = false) {
  const sel = sUI.selected === v.vault;
  const freeTxt = v.unknown ? '?' : v.full ? 'Full' : fmt(v.free);
  const line2 = [v.ar, v.unknown ? `${fmt(v.used)} used, size unknown` : `${fmt(v.used)} of ${fmt(v.capacity)} used`, favorLabel(v.favor), v.value ? `${fmt(v.value)} councils held` : ''].filter(Boolean).join(' · ');
  const nextTxt = v.nextLevel ? `Next: ${favorLabel(v.nextLevel.level)}, ${fmt(v.nextLevel.capacity)} slots` : '';
  return `<tr class="row selectable" tabindex="0" data-vault="${esc(v.vault)}" aria-selected="${sel}">
    <td class="m1"><span class="nm">${esc(v.nm)}</span>${compact && (v.favor || nextTxt) ? `<div class="small">${esc([favorLabel(v.favor), nextTxt].filter(Boolean).join(' · '))}</div>` : ''}</td>
    ${compact ? '' : `<td>${v.favor ? `<div>${esc(favorLabel(v.favor))}</div>` : ''}${nextTxt ? `<div class="small">${esc(nextTxt)}</div>` : ''}</td>
    <td class="small" style="max-width:11em">${esc(v.accepts || '')}</td>`}
    <td class="num">${fmt(v.used)}</td>
    ${tight ? '' : `<td>${stripHtml(v)}</td>`}
    <td class="num slotscell${tight ? ' stack' : ''}" style="white-space:nowrap">${slotsCell(v)}</td>
    <td class="num m2"><b>${freeTxt}</b>${v.unknown || v.full ? '' : '<span class="m-only small"> free</span>'}</td>
    <td class="num">${v.value ? COIN + fmt(v.value) : ''}</td>
    <td class="m-line2">${esc(line2)}${v.unknown || v.capacitySource === 'manual' ? `<div class="m-size">${slotsCell(v, '-m')}</div>` : ''}</td>
  </tr>`;
}
function renderVaultPane(rows, force = false) {
  const q = sUI.q.trim().toLowerCase();
  const sf = $('#sfilters');
  sf.html = sUI.area ? `<button type="button" class="chip filter" data-sclear="area">Area: ${esc(sUI.area)} ✕</button>` : '';
  sf.style.marginBottom = sUI.area ? '8px' : '0';
  const list = rows.filter(v => (!sUI.hide || v.used) && (!sUI.area || v.ar === sUI.area) && (!q || `${v.nm} ${v.ar}`.toLowerCase().includes(q)));
  const sorted = sortRows(list, sUI.sort, vSortStorage);
  const groups = {};
  sorted.forEach(v => (groups[v.ar] ||= []).push(v));
  const areaList = Object.entries(groups).map(([a, vs]) => [a, vs, vs.filter(v => !v.unknown).reduce((x, v) => x + Math.max(0, v.free), 0), vs.some(v => v.unknown)]);
  // Areas follow the row sort: an area appears where its first (e.g. fullest) vault would.
  if (!sUI.open) sUI.open = Object.keys(groups);
  const forceOpen = !!q || !!sUI.area;
  const paneW = $('#t-pane').clientWidth;
  const compact = vaultCompact = !PHONE_TABLE_MQ.matches && paneW > 0 && paneW < VAULT_COMPACT_W;
  const tight = compact && paneW < 720; // tablet: the slot strip goes too; Used and Slots carry the same fact
  const cols = S_COLS.filter(c => !compact || (c.k !== 'favor' && c.k !== 'accepts' && !(tight && c.k === 'strip')));
  const lead = compact ? 1 : 3; // columns before Used
  let body = '';
  for (const [a, vs, sub, unk] of areaList) {
    const open = forceOpen || sUI.open.includes(a) || !sUI.openTouched;
    body += `<tr class="sec"><td colspan="${lead + (tight ? 2 : 3)}"><button type="button" class="secbtn" data-sec="${esc(a)}" aria-expanded="${open}">${TRI(open)}${esc(a)} <span class="seccount">${plural(vs.length, 'vault')}</span></button></td><td class="num"><b>${sub ? fmt(sub) + ' free' : 'Full'}${unk ? ' +?' : ''}</b></td><td></td></tr>`;
    if (open) body += vs.map(v => vaultRow(v, compact, tight)).join('');
  }
  const totalFree = list.filter(v => !v.unknown).reduce((x, v) => x + Math.max(0, v.free), 0);
  body += `<tr class="grand"><td colspan="${lead}">Total · ${plural(list.length, 'vault')}</td><td class="num">${fmt(list.reduce((x, v) => x + v.used, 0))}</td><td colspan="${tight ? 1 : 2}"></td><td class="num">${fmt(totalFree)} free</td><td class="num">${COIN}${fmt(list.reduce((x, v) => x + (v.value || 0), 0))}</td></tr>`;
  const head = `<thead><tr>${cols.map(c => c.nosort ? `<th>${c.label}</th>` : thSort(c, sUI.sort, 'vaults')).join('')}</tr></thead>`;
  setHTML($('#t-pane'), list.length ? `<div class="pane"><table class="tbl resp">${head}<tbody>${body}</tbody></table></div>
    <div class="pane-under">${sUI.selected ? `Items below show <b>${esc(vaultName(rows.find(v => v.vault === sUI.selected) || { name: sUI.selected }))}</b> only.` : `Select a vault to see only its items below.${list.some(v => v.unknown || v.capacitySource === 'manual') ? ' Sizes the game doesn\'t publish can be typed into the Slots column.' : ''}`}</div>`
    : `<p class="empty">No vaults match "${esc(sUI.q)}".</p>`, force);
  fillSortSelect('#ssortm', S_COLS.filter(c => !c.nosort), sUI.sort);
}

/* Re-render the vault rows after a save and put focus back in the same box,
   so the row (fill, Free, message) is never left stale while it has focus. */
function refreshVaultPane(vault, refocus) {
  renderVaultPane(vaultRows(), true); // force: a typed-but-rejected box must show the saved value again
  if (refocus) $(`#size-${CSS.escape(vault)}${PHONE_TABLE_MQ.matches ? '-m' : ''}`)?.focus();
}
async function saveSize(input) {
  const vault = input.dataset.vault, raw = input.value.trim();
  const refocus = document.activeElement === input;
  // Every save attempt ends the edit: the next change to this box can be saved again.
  delete input.dataset.committed; delete input.dataset.dirty;
  const row = (S.storage?.vaults || []).find(v => v.vault === vault);
  const name = row ? vaultName(row) : vault;
  const n = Number(raw);
  if (raw && (!Number.isInteger(n) || n < 1 || n > 999)) {
    sUI.msgs[vault] = { kind: 'error', text: "[Error] Couldn't save" };
    refreshVaultPane(vault, refocus);
    sysLine('error', `Couldn't save ${name}: enter a whole number from 1 to 999.`);
    return;
  }
  if (PREVIEW.active) { sysLine('warn', 'Preview mode: sizes are not saved.'); return; }
  sUI.msgs[vault] = { kind: 'saving', text: 'Saving…' };
  try {
    const r = await fetch('/api/capacity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vault, slots: raw ? n : null }) });
    const body = await r.json().catch(() => ({}));
    if (r.status === 400) throw Object.assign(new Error(body.error || 'bad'), { bad: true });
    if (!r.ok) throw new Error('server');
    sUI.msgs[vault] = raw ? { kind: 'ok', text: `[Status] Saved, ${n} slots` } : { kind: 'ok', text: 'Cleared, size unknown again' };
    sysLine(raw ? 'status' : 'note', raw ? `${name} set to ${n} slots.` : `${name} size cleared. It's unknown again.`);
    setTimeout(() => {
      if (sUI.msgs[vault]?.kind !== 'ok') return;
      delete sUI.msgs[vault];
      if (S.view !== 'storage') return;
      const msgs = [document.getElementById(`msg-${vault}`), document.getElementById(`msg-${vault}-m`)].filter(Boolean);
      if (msgs.length) msgs.forEach(m => m.remove()); else renderStorage();
    }, 4000);
    await loadVendors();
    computeVerdicts(); renderAll();
    refreshVaultPane(vault, refocus && S.view === 'storage');
  } catch (e) {
    sUI.msgs[vault] = { kind: 'error', text: e.bad ? "[Error] Couldn't save" : "[Error] Couldn't save. The server didn't answer; try again." };
    sysLine('error', e.bad ? `Couldn't save ${name}: enter a whole number from 1 to 999.` : `Couldn't save ${name}. The server didn't answer; try again.`);
    refreshVaultPane(vault, refocus);
  }
}

/* ---------- Items window ---------- */
async function loadItems(file) {
  if (!file) { S.itemsData = null; S.itemsFile = null; return; }
  const d = await api('/api/report?file=' + encodeURIComponent(file));
  (d.Items || []).forEach(i => { i.StorageVault = i.StorageVault || (i.IsInInventory ? 'Inventory' : 'Unknown'); });
  S.itemsData = d; S.itemsFile = file;
  const powers = new Set();
  d.Items.forEach(i => (i.TSysPowers || []).forEach(p => powers.add(`${p.Power}:${p.Tier}`)));
  needLookup({ powers: [...powers] });
  needIcons({ typeIds: [...new Set(d.Items.map(i => String(i.TypeID)))] });
}
function powerText(p) {
  const k = `${p.Power}:${p.Tier}`;
  const l = S.lookup.powers[k];
  return l?.text || `${pretty(p.Power).replace(/([a-z])([A-Z])/g, '$1 $2')}, tier ${p.Tier}`;
}
function itemRows() {
  const d = S.itemsData;
  if (!d) return [];
  const groups = new Map();
  for (const it of d.Items) {
    const extra = JSON.stringify([it.TSysPowers || [], it.Durability, it.AttunedTo, it.Crafter, it.Rarity, it.Level, it.TSysImbuePower, it.TransmuteCount]);
    const key = `${it.TypeID}|${it.StorageVault}|${extra}`;
    let g = groups.get(key);
    if (!g) groups.set(key, g = { key, name: it.Name, typeId: it.TypeID, rarity: it.Rarity || '', level: it.Level ?? null, loc: it.StorageVault, stacks: [], value: 0, unit: it.Value || 0, powers: it.TSysPowers || [] });
    g.stacks.push(it.StackSize || 1);
    g.value += (it.Value || 0) * (it.StackSize || 1);
  }
  for (const g of groups.values()) g.qty = g.stacks.reduce((a, b) => a + b, 0);
  return [...groups.values()];
}
const I_COLS = [{ k: 'name', label: 'Name' }, { k: 'rarity', label: 'Rarity', rank: true }, { k: 'level', label: 'Lvl', num: true }, { k: 'loc', label: 'Location' }, { k: 'qty', label: 'Qty', num: true }, { k: 'value', label: 'Value', num: true }];
const ITEMS_NARROW_W = 700;
let itemsNarrow = false;
const RARITY_RANK = ['Common', 'Uncommon', 'Rare', 'Exceptional', 'Epic', 'Legendary'];
function iSortVal(r, k) {
  if (k === 'rarity') { if (!r.rarity) return null; const i = RARITY_RANK.indexOf(r.rarity); return i < 0 ? RARITY_RANK.length : i; }
  if (k === 'name' || k === 'loc') return String(r[k] || '').toLowerCase();
  return r[k] ?? null;
}
const locName = k => k === 'Inventory' ? 'Inventory' : pretty(((S.storage?.vaults || []).find(v => v.vault === k) || {}).name || k);

function renderItems() {
  const missing = storageMissing();
  const reps = storageReports();
  const sel = $('#itemsel');
  const newest = reps[0]?.file;
  sel.html = reps.map(r => `<option value="${esc(r.file)}" ${r.file === S.itemsFile ? 'selected' : ''}>${esc(r.character)} · ${dateTime(parseUtc(r.timestamp))}${r.file === newest ? ' (newest)' : ''}</option>`).join('');
  sel.disabled = !reps.length;
  const older = S.itemsFile && newest && S.itemsFile !== newest;
  const olderBox = $('#items-older');
  olderBox.hidden = !older;
  if (older) {
    const r = reps.find(x => x.file === S.itemsFile);
    olderBox.html = `${shape('info', 's13')} Showing the storage export of ${dateTime(parseUtc(r?.timestamp))} in this window only. Vaults, Stacks to merge and At a glance always use the newest. <button type="button" class="linkbtn" data-newest="items" style="text-decoration:underline">Show newest</button>`;
    olderBox.style.margin = '0 0 8px';
  }
  ['#itemq', '#vaultf', '#isortm'].forEach(s => { $(s).disabled = !S.itemsData; });
  $$('#imode [role=tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.m === sUI.imode)); b.tabIndex = b.dataset.m === sUI.imode ? 0 : -1; });
  $('#w-t-items').dataset.imode = sUI.imode;
  const d = S.itemsData;
  const repInfo = reps.find(x => x.file === S.itemsFile);
  const leftFoot = missing ? `Storage export · ${shape('bad', 's13')}<span class="age bad">missing</span>`
    : repInfo ? `Storage export of ${dateTime(parseUtc(repInfo.timestamp))} · ${older ? `${ago(parseUtc(repInfo.timestamp))} (older, picked)` : srcAge('storage-export', '').replace(/^ · /, '')}` : 'Storage export';
  setFoot('w-t-items', leftFoot, missing ? esc(fixText('export-storage')) : srcFix('storage-export', 'After storing:') + (older ? ' · <button type="button" class="linkbtn" data-newest="items" style="text-decoration:underline">Show newest</button>' : ''));
  // No export: no picker, no empty filters, just the line and the footer.
  $('#w-t-items .win-body > .toolbar').hidden = missing;
  $('#i-loc-wrap').hidden = missing;
  $('#w-t-items .items-grid').style.display = missing ? 'block' : '';
  $('#i-tbl-wrap > .toolbar').hidden = missing;
  if (missing) { $('#iteminfo').textContent = ''; $('#i-loc').html = ''; $('#chips-items').html = ''; $('#i-tbl').html = '<p class="needs">Needs a storage export.</p>'; return; }
  if (!d) { $('#i-tbl').html = S.loading ? '<div class="loading-bar" style="width:100%;height:200px"></div>' : '<p class="empty">No storage export picked.</p>'; return; }
  const rows = itemRows();
  const total = rows.reduce((a, r) => a + r.value, 0);
  $('#iteminfo').html = `${plural(d.Items.length, 'stack')} · ${fmt(total)} councils vendor value · exported ${dateTime(parseUtc(d.Timestamp))}${S.itemsFile ? ` · <a href="#files?f=${encodeURIComponent('reports/' + S.itemsFile)}">Open the file</a>` : ''}`;
  // by location
  const byLoc = {};
  rows.forEach(r => { const b = byLoc[r.loc] ||= { n: 0, value: 0 }; b.n += r.stacks.length; b.value += r.value; });
  const locs = Object.entries(byLoc).sort((a, b) => b[1].value - a[1].value);
  const max = locs[0]?.[1].value || 1;
  const activeLoc = sUI.selected || sUI.iloc;
  $('#i-loc').html = `<div class="barlist">${locs.map(([k, b]) => `<button type="button" class="barrow" data-loc="${esc(k)}" aria-pressed="${activeLoc === k}" title="${plural(b.n, 'stack')}"><span class="nm">${esc(locName(k))}</span><span class="sr">, </span><div class="bar"><i style="width:${Math.max(1, b.value / max * 100)}%"></i></div><span class="v">${short(b.value)}<span class="sr"> councils</span></span></button>`).join('')}</div><p class="small dim" style="margin:6px 8px 0">Vendor value per location, k = thousands.</p>`;
  const vf = $('#vaultf');
  vf.html = '<option value="">All locations</option>' + locs.map(([k]) => `<option value="${esc(k)}" ${activeLoc === k ? 'selected' : ''}>${esc(locName(k))}</option>`).join('');
  $('#chips-items').html = activeLoc ? `<button type="button" class="chip filter" data-clear="loc">Vault: ${esc(locName(activeLoc))} ✕</button>` : '';
  $('#chips-items').style.marginBottom = activeLoc ? '8px' : '0';
  const q = sUI.iq.trim().toLowerCase();
  const list = rows.filter(r => (!activeLoc || r.loc === activeLoc) && (!q || r.name.toLowerCase().includes(q) || r.powers.some(p => p.Power.toLowerCase().includes(q) || powerText(p).toLowerCase().includes(q))));
  const sorted = sortRows(list, sUI.isort, iSortVal);
  const page = sorted.slice(0, sUI.ilimit);
  // A column with no value in any matching row gives its width to Qty and Value.
  // Judged on the whole filtered list, so sorting never makes the sorted column disappear.
  // In a narrow column (tablet) Rarity and Lvl move under the name, so Qty and Value stay in view.
  const tw = $('#i-tbl').clientWidth;
  const narrow = itemsNarrow = !PHONE_TABLE_MQ.matches && tw > 0 && tw < ITEMS_NARROW_W;
  const anyRarity = list.some(r => r.rarity), anyLevel = list.some(r => r.level != null);
  const hasRarity = anyRarity && !narrow, hasLevel = anyLevel && !narrow;
  const cols = I_COLS.filter(c => (c.k !== 'rarity' || hasRarity) && (c.k !== 'level' || hasLevel));
  const head = `<thead><tr>${cols.map(c => thSort(c, sUI.isort, 'items')).join('')}</tr></thead>`;
  const qtyTxt = r => r.stacks.length > 1 ? (r.stacks.every(s => s === r.stacks[0]) ? `${fmt(r.stacks[0])} ×${r.stacks.length}` : `${fmt(r.qty)}<span class="small dim qty-sub">${r.stacks.length} stacks</span>`) : fmt(r.qty);
  const body = page.map(r => {
    const foldable = r.powers.length || r.stacks.length > 1;
    const open = sUI.ifold.has(r.key);
    const tip = r.powers.map(powerText).join('\n');
    const line2 = [r.rarity, r.level != null ? `Lvl ${r.level}` : '', locName(r.loc), `qty ${r.stacks.length > 1 ? r.stacks.join('+') : fmt(r.qty)}`].filter(Boolean).join(' · ');
    let html = `<tr class="row"${tip ? ` title="${esc(tip)}"` : ''}><td class="m1"><span class="cell-name">${foldable ? `<button type="button" class="foldbtn" data-fold="${esc(r.key)}" aria-expanded="${open}" aria-label="${open ? 'Hide' : 'Show'} details for ${esc(r.name)}">${CARET(open ? 'down' : 'right')}</button>` : '<span class="foldspace"></span>'}${iconImg(S.icons.byTypeId[String(r.typeId)], 24)}<span>${esc(r.name)}${narrow && (r.rarity || r.level != null) ? `<span class="small dim qty-sub">${esc([r.rarity, r.level != null ? `Lvl ${r.level}` : ''].filter(Boolean).join(' · '))}</span>` : ''}</span></span></td>
      ${hasRarity ? `<td>${esc(r.rarity)}</td>` : ''}${hasLevel ? `<td class="num">${r.level ?? ''}</td>` : ''}<td class="loc-cell" title="${esc(locName(r.loc))}">${esc(locName(r.loc))}</td><td class="num">${qtyTxt(r)}</td><td class="num m2 val-cell"><span class="nowrap">${COIN}${fmt(r.value)}</span></td><td class="m-line2">${esc(line2)}</td></tr>`;
    if (open) html += `<tr class="detail"><td colspan="${cols.length}" style="padding-left:52px">${r.powers.map(p => esc(powerText(p))).join(' · ')}${r.powers.length && r.stacks.length > 1 ? '<br>' : ''}${r.stacks.length > 1 ? `Stacks: ${r.stacks.map(fmt).join(', ')}` : ''}</td></tr>`;
    return html;
  }).join('');
  $('#i-tbl').html = list.length ? `<div class="scrollbox"><table class="tbl resp-plain">${head}<tbody>${body}</tbody></table></div>${sorted.length > sUI.ilimit ? `<div style="padding:8px 0"><button type="button" class="btn" id="imore">Show ${fmt(Math.min(200, sorted.length - sUI.ilimit))} more</button> <span class="small dim">${fmt(sUI.ilimit)} of ${fmt(sorted.length)} shown</span></div>` : ''}`
    : `<p class="empty">No items match${q ? ` "${esc(sUI.iq)}"` : ''}. Search matches names and powers, like Max Health.</p>`;
  fillSortSelect('#isortm', I_COLS, sUI.isort);
}

function initStorage() {
  // Re-render the vault table when its pane crosses the compact width (window resize, margin stacking).
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    const w = $('#t-pane').clientWidth;
    const c = !PHONE_TABLE_MQ.matches && w > 0 && w < VAULT_COMPACT_W;
    if (c !== vaultCompact && S.storage?.vaults && !$('#t-pane').contains(document.activeElement)) renderVaultPane(vaultRows());
  }).observe($('#t-pane'));
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    const w = $('#i-tbl').clientWidth;
    const n = !PHONE_TABLE_MQ.matches && w > 0 && w < ITEMS_NARROW_W;
    if (n !== itemsNarrow && S.itemsData) renderItems();
  }).observe($('#i-tbl'));
  $('#sq').addEventListener('input', e => { sUI.q = e.target.value; renderVaultPane(vaultRows()); });
  $('#shide').addEventListener('change', e => { sUI.hide = e.target.checked; renderVaultPane(vaultRows()); });
  $('#ssortm').addEventListener('change', e => { const [k, d] = e.target.value.split(':'); sUI.sort = { key: k, dir: d }; saveSort('vaults', sUI.sort); renderVaultPane(vaultRows()); });
  $('#t-room').addEventListener('click', e => { const b = e.target.closest('[data-area]'); if (!b) return; sUI.area = sUI.area === b.dataset.area ? '' : b.dataset.area; renderStorage(); });
  $('#sfilters').addEventListener('click', e => { if (!e.target.closest('[data-sclear]')) return; sUI.area = ''; renderStorage(); $('#t-room [data-area]')?.focus(); });
  const pane = $('#t-pane');
  pane.addEventListener('click', e => {
    if (e.target.closest('.sizein, label')) return;
    const sb = e.target.closest('[data-sort]');
    if (sb) {
      const k = sb.dataset.sort, cur = sUI.sort, text = ['name', 'accepts'].includes(k);
      sUI.sort = { key: k, dir: cur.key === k ? (cur.dir === 'asc' ? 'desc' : 'asc') : (text || k === 'free' ? 'asc' : 'desc') };
      saveSort('vaults', sUI.sort); renderVaultPane(vaultRows()); return;
    }
    const sec = e.target.closest('[data-sec]');
    if (sec) {
      const a = sec.dataset.sec;
      if (!sUI.openTouched) { sUI.openTouched = true; sUI.open = sUI.open || [...new Set(vaultRows().map(v => v.ar))]; }
      sUI.open = sUI.open.includes(a) ? sUI.open.filter(x => x !== a) : [...sUI.open, a];
      saveOpen('vaults', sUI.open); renderVaultPane(vaultRows()); $(`#t-pane [data-sec="${CSS.escape(a)}"]`)?.focus(); return;
    }
    const row = e.target.closest('tr[data-vault]');
    if (row) { sUI.selected = sUI.selected === row.dataset.vault ? null : row.dataset.vault; sUI.ilimit = 200; renderVaultPane(vaultRows()); renderItems(); $(`#t-pane tr[data-vault="${CSS.escape(row.dataset.vault)}"]`)?.focus(); }
  });
  pane.addEventListener('keydown', e => {
    if (e.target.classList.contains('sizein')) {
      if (e.key === 'Enter') { e.preventDefault(); e.target.dataset.committed = '1'; saveSize(e.target); }
      return;
    }
    const row = e.target.closest('tr[data-vault]');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); }
    if (e.key === 'Escape' && sUI.selected) { sUI.selected = null; renderVaultPane(vaultRows()); renderItems(); }
  });
  pane.addEventListener('input', e => { if (e.target.classList.contains('sizein')) { e.target.dataset.dirty = '1'; delete e.target.dataset.committed; } });
  pane.addEventListener('focusout', e => {
    const t = e.target;
    if (t.classList?.contains('sizein') && t.dataset.dirty && !t.dataset.committed) saveSize(t);
  });
  $('#itemsel').addEventListener('change', async e => {
    S.itemsPicked = e.target.value !== newestItemsFile();
    sUI.ilimit = 200;
    try { await loadItems(e.target.value); } catch (err) { onFetchError(err); }
    computeVerdicts(); renderAll();
  });
  $('#w-t-items').addEventListener('click', async e => {
    if (e.target.closest('[data-newest]')) { S.itemsPicked = false; await loadItems(newestItemsFile()).catch(onFetchError); computeVerdicts(); renderAll(); return; }
    const loc = e.target.closest('[data-loc]');
    if (loc) { if (sUI.selected) sUI.selected = null; sUI.iloc = (sUI.iloc === loc.dataset.loc) ? '' : loc.dataset.loc; sUI.ilimit = 200; sUI.imode = 'items'; renderVaultPane(vaultRows()); renderItems(); return; }
    if (e.target.closest('[data-clear="loc"]')) { sUI.selected = null; sUI.iloc = ''; renderVaultPane(vaultRows()); renderItems(); return; }
    const sb = e.target.closest('[data-sort][data-table="items"]');
    if (sb) { const k = sb.dataset.sort, cur = sUI.isort, text = ['name', 'loc'].includes(k); sUI.isort = { key: k, dir: cur.key === k ? (cur.dir === 'asc' ? 'desc' : 'asc') : (text ? 'asc' : 'desc') }; saveSort('items', sUI.isort); renderItems(); return; }
    const f = e.target.closest('[data-fold]');
    if (f) { const k = f.dataset.fold; sUI.ifold.has(k) ? sUI.ifold.delete(k) : sUI.ifold.add(k); renderItems(); $(`#i-tbl [data-fold="${CSS.escape(k)}"]`)?.focus(); return; }
    if (e.target.id === 'imore') { sUI.ilimit += 200; renderItems(); }
    const tab = e.target.closest('#imode [role=tab]');
    if (tab) { sUI.imode = tab.dataset.m; renderItems(); }
  });
  tabKeys($('#imode'));
  $('#w-t-merge').addEventListener('click', e => {
    const tab = e.target.closest('#tmode [role=tab]');
    if (tab) { sUI.mmode = tab.dataset.m; renderMerge(); tab.focus(); }
  });
  tabKeys($('#tmode'));
  $('#w-t-plan').addEventListener('click', e => {
    const tab = e.target.closest('#pmode [role=tab]');
    if (tab) { sUI.pmode = tab.dataset.m; renderPlan(); tab.focus(); }
  });
  tabKeys($('#pmode'));
  $('#itemq').addEventListener('input', e => { sUI.iq = e.target.value; sUI.ilimit = 200; renderItems(); });
  $('#vaultf').addEventListener('change', e => { sUI.selected = null; sUI.iloc = e.target.value; sUI.ilimit = 200; renderVaultPane(vaultRows()); renderItems(); });
  $('#isortm').addEventListener('change', e => { const [k, d] = e.target.value.split(':'); sUI.isort = { key: k, dir: d }; saveSort('items', sUI.isort); renderItems(); });
}

/* ===================== character ===================== */
/* Character view: where does my character stand, and which skills are close? */

const cUI = {
  sq: '', skSort: (store.json('pgdash.sort', {}).skills) || { key: 'level', dir: 'desc' },
  fq: '', fvSort: (store.json('pgdash.sort', {}).favor) || { key: 'tier', dir: 'desc' }, fvAll: false,
  stq: '', statAll: false, zeroCur: false, qq: '', tab: 'w-c-skills',
};
const STAT_MAP = [
  ['Selling', 'NPC_MOD_MAXSALESVALUE', 'Sale price bonus', 'x'], ['Selling', 'NPC_MOD_TRAININGCOST', 'Training cost', 'x'],
  ['Favor', 'NPC_MOD_FAVORFROMGIFTS', 'Favor from gifts', 'x'], ['Favor', 'NPC_MOD_FAVORFROMHANGOUTS', 'Favor from hangouts', 'x'],
  ['Inventory', 'MAX_INVENTORY_SIZE', 'Inventory size', 'int'], ['Inventory', 'AUTOLOOT_RADIUS', 'Autoloot radius', 'm'],
  ['Work orders', 'MAX_ACTIVE_WORKORDERS', 'Active work orders allowed', 'int'], ['Work orders', 'WORKORDER_COIN_REWARD_MOD', 'Work order councils', 'x'],
  ['Vitals', 'MAX_HEALTH', 'Max health', 'int'], ['Vitals', 'MAX_POWER', 'Max power', 'int'], ['Vitals', 'MAX_ARMOR', 'Max armor', 'int'], ['Vitals', 'MAX_BREATH', 'Max breath', 'int'],
  ['Movement', 'MOVEMENT_SPEED', 'Movement speed', 'num'], ['Movement', 'SPRINT_BOOST', 'Sprint boost', 'num'],
  ['Identity', 'IS_DRUID', 'Druid', 'yes'], ['Identity', 'IS_LYCANTHROPE', 'Lycanthrope', 'yes'], ['Identity', 'IS_UNDEAD', 'Undead', 'yes'], ['Identity', 'IS_BEAST', 'Beast', 'yes'],
];
const STAT_HIDDEN = new Set(['IS_MALE', 'IS_MOUNTED', 'IS_STUNNED', 'PVP']);

function charReports() {
  const reps = (S.reports || []).filter(r => r.report === 'CharacterSheet');
  const mine = reps.filter(r => r.character === S.character);
  const partial = reps.filter(r => r.character === '???');
  if (PREVIEW.sim === 'broken' && mine.length) partial.unshift({ file: '__sim_partial__', character: '???', timestamp: new Date(NOW() + 1000).toISOString().replace('T', ' ').slice(0, 19) + 'Z', report: 'CharacterSheet', sim: true });
  const good = mine.sort((a, b) => parseUtc(b.timestamp) - parseUtc(a.timestamp));
  return { good, all: [...good, ...partial].sort((a, b) => parseUtc(b.timestamp) - parseUtc(a.timestamp)) };
}
function newestCharFile() { return charReports().good[0]?.file || null; }
const isPartial = d => d && (d.Character === '???' || d.Race === 'Error');

async function loadChar(file) {
  if (!file) { S.charData = null; S.charFile = null; return; }
  if (file === '__sim_partial__') { S.charData = { Character: '???', Race: 'Error', Timestamp: '', Skills: {}, Currencies: {}, NPCs: {}, ActiveQuests: [], CompletedQuests: [], CurrentStats: {} }; S.charFile = file; return; }
  const d = await api('/api/report?file=' + encodeURIComponent(file));
  S.charData = d; S.charFile = file;
  if (d.ActiveQuests?.length) needLookup({ quests: d.ActiveQuests });
}

function renderCharacter() {
  const { good, all } = charReports();
  const missing = !good.length && !S.loading;
  const d = S.charData;
  const partial = isPartial(d);
  const cv = V('character-export');
  const footR = srcFix('character-export');
  const repInfo = all.find(r => r.file === S.charFile);
  const older = S.charFile && good[0] && S.charFile !== good[0].file;
  const ageL = (label, withDate) => {
    if (missing) return `Character export · ${shape('bad', 's13')}<span class="age bad">missing</span>`;
    if (older && repInfo) return `Character export of ${dateTime(parseUtc(repInfo.timestamp))} · ${ago(parseUtc(repInfo.timestamp))} (older, picked)${label ? ' · ' + label : ''}`;
    const base = withDate && repInfo ? `Character export of ${dateTime(parseUtc(repInfo.timestamp))}` : 'Character export';
    return srcAge('character-export', base) + (label ? ' · ' + label : '');
  };

  if (S.view === 'character') {
    $('#h1').textContent = 'Character';
    const ex = $('#title-extra');
    ex.hidden = false;
    if (missing) ex.html = `<span>No exports for ${esc(S.character || 'this character')}</span>`;
    else {
      const opts = all.map(r => `<option value="${esc(r.file)}" ${r.file === S.charFile ? 'selected' : ''}>${esc(r.character === '???' ? (S.character || '?') : r.character)} · ${dateTime(parseUtc(r.timestamp))}${r.character === '???' ? ' (partial)' : r.file === good[0]?.file ? ' (newest)' : ''}</option>`).join('');
      const info = d && !partial ? `${esc(d.Race || '')} · last area ${esc(pretty((d.MostRecentArea || '').replace(/^Area/, '')))} · exported ${dateTime(parseUtc(d.Timestamp))}` : '';
      const openLink = S.charFile && S.charFile !== '__sim_partial__' ? ` · <a href="#files?f=${encodeURIComponent('reports/' + S.charFile)}">Open the file</a>` : '';
      ex.html = `<label for="charsel" class="sr">Character export</label><select id="charsel">${opts}</select><span>${info}${openLink}</span>`;
    }
    if (S.loading && !d) { $('#finding').html = '<span class="dim">Reading the character export…</span>'; setStamp('Character export', '…', 'ok'); }
    else if (missing) { $('#finding').textContent = `No character export for ${S.character || 'this character'} yet, so there are no skills, currencies or favor to show. Export once and this fills in.`; exportStamp('character-export', 'character'); }
    else if (partial) { $('#finding').html = `<span class="txt-bad">This export came out partial (name "???"), so it has no skills, quests or favor. Pick the newest good one, or export again.</span>`; exportStamp('character-export', 'character'); }
    else if (d) {
      const sk = skillRows(d);
      const close = sk.filter(s => s.left > 0).sort((a, b) => b.pct - a.pct || b.level - a.level)[0];
      const curN = Object.values(d.Currencies || {}).filter(Boolean).length;
      let f = close ? `<em class="t">${esc(close.label)}</em> is <em class="n">${fmt(close.left)} XP</em> from level ${close.level + 1}.` : 'Every skill is at its cap.';
      f += ` <em class="n">${curN}</em> currencies, <em class="n">${fmt((d.CompletedQuests || []).length)}</em> quests done.`;
      if (cv?.severity === 'warn' && !older) f += ` <span class="suffix">These are from a character export ${ageLong(cv.ageSec)} old.</span>`;
      $('#finding').html = f;
      if (older && repInfo) setStamp(`Copied from the character export of ${dayMon(parseUtc(repInfo.timestamp))}, ${hhmm(parseUtc(repInfo.timestamp))}`, `${ago(parseUtc(repInfo.timestamp))} · older, picked`, 'ok');
      else exportStamp('character-export', 'character');
    }
  }

  // broken note
  const bw = $('#w-c-broken');
  const brokenNewest = !partial && sevOf('partial-export') === 'bad';
  bw.hidden = !(partial || brokenNewest);
  if (brokenNewest) {
    const pl = plaqueFor('export-again');
    plaqueInView = 'export-again';
    $('#c-broken').html = `<div class="broken-note">${shape('bad')}<div class="txt"><p>Your newest character export came out a bit… partial (name "???"), so it's ignored. The numbers below are from the last good one.</p>
      <button type="button" class="plaque plaque-wide" data-fix="export-again" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button></div></div>`;
    setFoot('w-c-broken', 'Partial character export · ignored', esc(fixText('export-again')));
  }
  if (partial) {
    const pl = plaqueFor('export-again');
    plaqueInView = 'export-again';
    $('#c-broken').html = `<div class="broken-note">${shape('bad')}<div class="txt"><p>That export came out a bit… partial (name "???"). Exports made right before logout can do this. ${good.length ? `<button type="button" class="linkbtn" data-newest="char" style="text-decoration:underline">Show the newest good export</button>` : ''}</p>
      <button type="button" class="plaque plaque-wide" data-fix="export-again" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button></div></div>`;
    setFoot('w-c-broken', `Character export of ${repInfo ? dateTime(parseUtc(repInfo.timestamp)) : '?'} · partial`, esc(fixText('export-again')));
  }

  // glance
  const showData = d && !partial && !missing;
  $('#w-c-glance').hidden = !showData && !S.loading;
  if (S.loading && !d) $('#c-glance').html = ['Councils', 'Skills', 'Active quests'].map((l, i) => `<div class="fig${i ? '' : ' lead'}"><div class="lb">${l}</div><div class="val"><span class="loading-bar"></span></div></div>`).join('');
  else if (showData) {
    const sk = skillRows(d);
    const hi = sk.slice().sort((a, b) => b.level - a.level)[0];
    const ageMark = cv?.severity === 'warn' && !older ? `${shape('warn', 's13')}<span class="age warn">${ageWord(cv.ageSec)} old</span>` : '';
    const figs = [];
    if (d.Currencies?.GOLD) figs.push(`<div class="fig lead"><div class="lb">Councils ${ageMark}</div><div class="val">${COIN}${fmt(d.Currencies.GOLD)}</div><div class="sub">on hand at export</div></div>`);
    if (sk.length) figs.push(`<div class="fig${figs.length ? '' : ' lead'}"><div class="lb">Skills</div><div class="val">${fmt(sk.length)}</div><div class="sub">${hi ? `highest: ${esc(hi.label)} ${hi.level}` : ''}</div></div>`);
    if (d.ActiveQuests?.length) figs.push(`<div class="fig"><div class="lb">Active quests</div><div class="val">${fmt(d.ActiveQuests.length)}</div></div>`);
    if (d.CompletedQuests?.length) figs.push(`<div class="fig"><div class="lb">Completed quests</div><div class="val">${fmt(d.CompletedQuests.length)}</div></div>`);
    $('#c-glance').html = figs.join('') || '<p class="empty">Nothing in this export.</p>';
  }
  setFoot('w-c-glance', ageL(''), footR);

  // phone tabs
  $$('#ctabs [role=tab]').forEach(b => { const on = b.dataset.w === cUI.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  $$('.cwin').forEach(w => w.classList.toggle('on', w.id === cUI.tab));

  // skills
  $('#skillq').disabled = !showData;
  if (missing) {
    plaqueInView = plaqueInView || 'export-character';
    const pl = plaqueFor('export-character');
    $('#c-skills').html = `<p class="pane-empty">Skills, currencies, stats, favor and quests all come from the character export.</p><button type="button" class="plaque plaque-wide" data-fix="export-character" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button>`;
  } else if (!showData) $('#c-skills').html = S.loading ? '<div class="pane" style="height:320px"></div>' : '<p class="needs">Needs a good character export.</p>';
  else renderSkills();
  setFoot('w-c-skills', ageL('', true), footR);

  // currencies
  const cur = $('#c-cur');
  if (!showData) cur.html = `<p class="needs">${missing ? 'Needs a character export.' : partial ? 'Not in a partial export.' : ''}</p>`;
  else {
    const entries = Object.entries(d.Currencies || {});
    const nz = entries.filter(([, v]) => v).sort((a, b) => (a[0] === 'GOLD' ? -1 : b[0] === 'GOLD' ? 1 : 0));
    const zero = entries.filter(([, v]) => !v);
    const show = cUI.zeroCur ? [...nz, ...zero] : nz;
    const colsN = show.length >= 9 ? 3 : show.length >= 4 ? 2 : 1;
    cur.html = `<dl style="display:grid;grid-template-columns:repeat(${colsN},minmax(0,1fr));gap:12px 24px;margin:0">${show.map(([k, v]) => `<div><dt class="small dim">${esc(curLabel(k))}</dt><dd style="margin:0;font-size:20px;line-height:1.2">${k === 'GOLD' ? COIN : ''}${fmt(v)}</dd></div>`).join('')}</dl>
      ${zero.length ? `<p style="margin-top:12px"><button type="button" class="linkbtn" id="curzero" style="text-decoration:underline">${cUI.zeroCur ? 'Hide the ones at zero' : `${zero.length} at zero`}</button></p>` : ''}`;
  }
  setFoot('w-c-cur', ageL(''), footR);

  renderStats(d, showData, missing, partial);
  setFoot('w-c-stats', ageL(showData ? `${Object.keys(d.CurrentStats || {}).length} stats` : ''), footR);
  renderFavor(d, showData, missing, partial);
  setFoot('w-c-favor', ageL(showData ? `${plural(Object.keys(d.NPCs || {}).length, 'NPC')}` : ''), 'Favor changes as you play; export to update');
  renderQuests(d, showData, missing, partial);
  setFoot('w-c-quests', ageL(`names from game data v${esc(cdnVersion())}`), footR);
  if (missing) ['w-c-cur', 'w-c-stats', 'w-c-favor', 'w-c-quests', 'w-c-glance', 'w-c-skills'].forEach(id => setFoot(id, `Character export · ${shape('bad', 's13')}<span class="age bad">missing</span>`, esc(fixText('export-character'))));
}

function curLabel(k) {
  if (k === 'GOLD') return 'Councils';
  return k.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    .replace(/credits$/i, ' Credits').replace(/tokens$/i, ' Tokens').replace(/^Redwing/, 'Red Wing').replace(/^Liveevent/, 'Live Event').replace(/^Guild(?=\s)/, 'Guild').replace(/^Druid(?=\s)/, 'Druid').replace(/\s+/g, ' ').trim();
}
/* A parent skill (e.g. Anatomy) has no XP of its own: the export gives it a level made entirely of
   bonus levels and a 1-XP "next level". Shown as levelled by its sub-skills, not as 1 XP to go. */
const isParentSkill = s => s.Level > 0 && s.BonusLevels === s.Level && s.XpNeededForNextLevel <= 1 && !s.XpTowardNextLevel;
function skillRows(d) {
  return Object.entries(d?.Skills || {}).filter(([k]) => k !== 'Unknown').map(([k, s]) => {
    const parent = isParentSkill(s);
    return {
      name: k, label: pretty(k).replace(/ /g, ' ').replace(/^Anatomy /, 'Anatomy: '), level: s.Level, bonus: parent ? 0 : s.BonusLevels || 0, parent,
      pct: parent ? 0 : s.XpNeededForNextLevel > 0 ? s.XpTowardNextLevel / s.XpNeededForNextLevel : 1,
      left: parent ? 0 : s.XpNeededForNextLevel > 0 ? s.XpNeededForNextLevel - s.XpTowardNextLevel : 0,
    };
  });
}
const K_COLS = [{ k: 'label', label: 'Skill' }, { k: 'level', label: 'Level', num: true }, { k: 'bonus', label: 'Bonus', num: true }, { k: 'pct', label: 'Progress' }, { k: 'pct2', label: '%', num: true, alias: 'pct' }, { k: 'left', label: 'XP to go', num: true }];
function renderSkills() {
  const d = S.charData;
  const q = cUI.sq.trim().toLowerCase();
  const rows = skillRows(d).filter(r => r.label.toLowerCase().includes(q));
  const sort = cUI.skSort;
  const sorted = sortRows(rows, { key: sort.key === 'pct2' ? 'pct' : sort.key, dir: sort.dir }, (r, k) => k === 'label' ? r.label.toLowerCase() : (k === 'left' || k === 'pct') && !r.left ? null : k === 'bonus' && !r.bonus ? null : r[k]); // maxed skills sort after the ones still moving, either direction
  const head = `<thead><tr>${K_COLS.map(c => thSort(c, sort, 'skills')).join('')}</tr></thead>`;
  const PARENT_TIP = 'This skill has no XP of its own. The game levels it from its sub-skills.';
  // Capped so Currencies, Favor and Quests are on the first screen; the cap follows the active sort.
  const SKILL_CAP = 12, capped = !q && !cUI.skAll && sorted.length > SKILL_CAP + 2;
  const body = (capped ? sorted.slice(0, SKILL_CAP) : sorted).map(r => r.parent ? `<tr class="row" title="${PARENT_TIP}"><td class="m1">${esc(r.label)}</td><td class="num m2"><b>${r.level}</b></td><td class="num" style="width:56px"></td>
    <td style="min-width:120px"></td><td class="num" style="width:48px"></td><td class="num small">from sub-skills</td>
    <td class="m-line2">from sub-skills</td></tr>` : `<tr class="row"><td class="m1">${esc(r.label)}</td><td class="num m2"><b>${r.level}</b>${r.bonus ? `<span class="m-only small"> +${r.bonus}</span>` : ''}</td><td class="num" style="width:56px">${r.bonus ? '+' + r.bonus : ''}</td>
    <td style="min-width:120px"><div class="bar"><i style="width:${r.pct * 100}%"></i></div></td><td class="num" style="width:48px">${r.left ? Math.floor(r.pct * 100) + '%' : ''}</td><td class="num">${r.left ? fmt(r.left) : 'max'}</td>
    <td class="m-line2">${r.left ? `${Math.floor(r.pct * 100)}% · ${fmt(r.left)} XP to go` : 'max'}</td></tr>`).join('');
  const more = !q && sorted.length > SKILL_CAP + 2 ? `<p style="margin-top:8px"><button type="button" class="linkbtn" id="skillall" style="text-decoration:underline">${cUI.skAll ? `Show the first ${SKILL_CAP}` : `Show all ${fmt(sorted.length)} skills`}</button></p>` : '';
  $('#c-skills').html = rows.length ? `<div class="pane"><div class="scrollbox pane-scroll"><table class="tbl resp">${head}<tbody>${body}</tbody></table></div></div>${more}` : `<p class="empty">No skill matches "${esc(cUI.sq)}".</p>`;
  fillSortSelect('#ksortm', K_COLS.filter(c => c.k !== 'pct2'), sort);
}
function statFmt(v, f) {
  if (f === 'x') return `${Number(v).toFixed(2)}×`;
  if (f === 'int') return fmt(v);
  if (f === 'm') return `${Number(v).toFixed(1)} m`;
  if (f === 'yes') return v ? 'Yes' : '';
  return Number.isInteger(v) ? fmt(v) : Number(v).toFixed(2);
}
function genericStatLabel(k) {
  const pre = [['NONCOMBAT_REGEN_', 'Out-of-combat regen: '], ['COMBAT_REGEN_', 'Combat regen: '], ['MITIGATION_', 'Mitigation: '], ['VULN_', 'Vulnerability: '], ['BOOST_', 'Boost: '], ['MOD_', 'Damage mod: '], ['CUR_', 'Current: '], ['MAX_', 'Max ']];
  let lab = k, p = '';
  for (const [a, b] of pre) if (k.startsWith(a)) { p = b; lab = k.slice(a.length); break; }
  lab = lab.replace(/_DIRECT$/, ' (direct)').replace(/_INDIRECT$/, ' (indirect)').replace(/_/g, ' ').toLowerCase();
  const s = p + lab;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function renderStats(d, showData, missing, partial) {
  const box = $('#c-stats');
  $('#statq').disabled = !showData;
  if (!showData) { box.html = `<p class="needs">${missing ? 'Needs a character export.' : partial ? 'Not in a partial export.' : ''}</p>`; return; }
  const st = d.CurrentStats || {};
  const q = cUI.stq.trim().toLowerCase();
  const mapped = new Set(STAT_MAP.map(m => m[1]));
  const rows = STAT_MAP.filter(([, k, , f]) => k in st && !(f === 'yes' && !st[k])).map(([g, k, l, f]) => ({ g, k, l, v: statFmt(st[k], f) }));
  const other = Object.keys(st).filter(k => !mapped.has(k) && !STAT_HIDDEN.has(k)).sort().map(k => ({ g: 'Other', k, l: genericStatLabel(k), v: (typeof st[k] === 'number' && !Number.isInteger(st[k]) && st[k] < 3) ? `${st[k].toFixed(2)}×` : statFmt(st[k], 'num') }));
  const all = (cUI.statAll || q ? [...rows, ...other] : rows).filter(r => !q || r.l.toLowerCase().includes(q) || r.k.toLowerCase().includes(q));
  let html = '', g = null;
  for (const r of all) {
    if (r.g !== g) { html += `<tr><th colspan="2" style="color:var(--title);font-weight:700;padding-top:8px">${esc(r.g)}</th></tr>`; g = r.g; }
    html += `<tr class="row" title="${esc(r.k)}"><td>${esc(r.l)}</td><td class="num">${esc(r.v)}</td></tr>`;
  }
  box.html = (all.length ? `<table class="tbl"><tbody>${html}</tbody></table>` : `<p class="empty">No stat matches "${esc(cUI.stq)}".</p>`) +
    (!q ? `<p style="margin-top:8px"><button type="button" class="linkbtn" id="statall" style="text-decoration:underline">${cUI.statAll ? 'Show fewer stats' : `Show all ${Object.keys(st).length} stats`}</button></p>` : '');
}
const F_COLS = [{ k: 'npc', label: 'NPC' }, { k: 'tier', label: 'Favor tier' }, { k: 'favor', label: 'Favor in tier', num: true }];
function renderFavor(d, showData, missing, partial) {
  const box = $('#c-favor');
  $('#favq').disabled = !showData;
  if (!showData) { box.html = `<p class="needs">${missing ? 'Needs a character export.' : partial ? 'Not in a partial export.' : ''}</p>`; return; }
  const q = cUI.fq.trim().toLowerCase();
  const rows = Object.entries(d.NPCs || {}).filter(([, n]) => n.FavorLevel).map(([k, n]) => ({ npc: pretty(k), tier: n.FavorLevel, rank: favorRank(n.FavorLevel), favor: n.Favor || 0 }))
    .filter(r => !q || r.npc.toLowerCase().includes(q) || favorLabel(r.tier).toLowerCase().includes(q));
  if (!rows.length) { box.html = q ? `<p class="empty">No NPC matches "${esc(cUI.fq)}".</p>` : '<p class="empty">No favor data in this export.</p>'; return; }
  const s = cUI.fvSort, dir = s.dir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    if (s.key === 'npc') return a.npc.localeCompare(b.npc) * dir;
    if (s.key === 'favor') return (a.favor - b.favor) * dir;
    return ((a.rank - b.rank) || (a.favor - b.favor)) * dir;
  });
  const shown = cUI.fvAll || q ? rows : rows.slice(0, 60);
  const fv = v => Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }); // one format per column
  const head = `<thead><tr>${F_COLS.map(c => c.k === 'favor' ? thSort(c, s, 'favor').replace('<th class="num"', '<th class="num" title="Favor earned within the current tier. The game doesn\'t publish tier thresholds, so there\'s no bar."') : thSort(c, s, 'favor')).join('')}</tr></thead>`;
  box.html = `<div class="scrollbox" style="max-height:480px"><table class="tbl resp-plain">${head}<tbody>${shown.map(r => `<tr class="row"><td class="m1">${esc(r.npc)}</td><td>${esc(favorLabel(r.tier))}</td><td class="num m2">${fv(r.favor)}</td><td class="m-line2">${esc(favorLabel(r.tier))}</td></tr>`).join('')}</tbody></table></div>
    ${rows.length > 60 && !q ? `<p style="margin-top:8px"><button type="button" class="linkbtn" id="favall" style="text-decoration:underline">${cUI.fvAll ? 'Show the first 60' : `Show all ${rows.length}`}</button></p>` : ''}`;
}
function questName(k) { return S.lookup.quests[k] || pretty(k).replace(/(\D)(\d)/, '$1 $2'); }
function renderQuests(d, showData, missing, partial) {
  const box = $('#c-quests');
  $('#questq').disabled = !showData;
  $('#questcount').textContent = showData ? `(${(d.ActiveQuests || []).length})` : '';
  if (!showData) { box.html = `<p class="needs">${missing ? 'Needs a character export.' : partial ? 'Not in a partial export.' : ''}</p>`; return; }
  const q = cUI.qq.trim().toLowerCase();
  const list = (d.ActiveQuests || []).map(k => ({ k, n: questName(k) })).filter(x => !q || x.n.toLowerCase().includes(q)).sort((a, b) => a.n.localeCompare(b.n));
  box.html = list.length ? `<div class="scrollbox" style="max-height:420px"><ul class="list">${list.map(x => `<li title="${esc(x.k)}"><span>${esc(x.n)}</span></li>`).join('')}</ul></div>` : (q ? `<p class="empty">No quest matches "${esc(cUI.qq)}".</p>` : '<p class="empty">None in this export.</p>');
}

function initCharacter() {
  document.addEventListener('change', async e => {
    if (e.target.id !== 'charsel') return;
    S.charPicked = e.target.value !== newestCharFile();
    try { await loadChar(e.target.value); } catch (err) { onFetchError(err); }
    computeVerdicts(); renderAll();
  });
  $('#v-character').addEventListener('click', async e => {
    if (e.target.closest('[data-newest="char"]')) { S.charPicked = false; await loadChar(newestCharFile()).catch(onFetchError); computeVerdicts(); renderAll(); return; }
    if (e.target.id === 'curzero') { cUI.zeroCur = !cUI.zeroCur; renderCharacter(); return; }
    if (e.target.id === 'skillall') { cUI.skAll = !cUI.skAll; renderSkills(); $('#skillall')?.focus(); return; }
    if (e.target.id === 'statall') { cUI.statAll = !cUI.statAll; renderCharacter(); return; }
    if (e.target.id === 'favall') { cUI.fvAll = !cUI.fvAll; renderCharacter(); return; }
    const sb = e.target.closest('[data-sort]');
    if (sb && sb.dataset.table === 'skills') {
      const k = sb.dataset.sort, cur = cUI.skSort;
      cUI.skSort = { key: k, dir: cur.key === k ? (cur.dir === 'asc' ? 'desc' : 'asc') : (k === 'label' ? 'asc' : 'desc') };
      saveSort('skills', cUI.skSort); renderSkills(); return;
    }
    if (sb && sb.dataset.table === 'favor') {
      const k = sb.dataset.sort, cur = cUI.fvSort;
      cUI.fvSort = { key: k, dir: cur.key === k ? (cur.dir === 'asc' ? 'desc' : 'asc') : (k === 'npc' ? 'asc' : 'desc') };
      saveSort('favor', cUI.fvSort); renderCharacter(); return;
    }
    const tab = e.target.closest('#ctabs [role=tab]');
    if (tab) { cUI.tab = tab.dataset.w; renderCharacter(); }
  });
  tabKeys($('#ctabs'));
  $('#skillq').addEventListener('input', e => { cUI.sq = e.target.value; renderSkills(); });
  $('#ksortm').addEventListener('change', e => { const [k, d] = e.target.value.split(':'); cUI.skSort = { key: k, dir: d }; saveSort('skills', cUI.skSort); renderSkills(); });
  $('#statq').addEventListener('input', e => { cUI.stq = e.target.value; renderCharacter(); });
  $('#favq').addEventListener('input', e => { cUI.fq = e.target.value; renderCharacter(); });
  $('#questq').addEventListener('input', e => { cUI.qq = e.target.value; renderCharacter(); });
}

/* ===================== files ===================== */
/* Files view: what exactly is in the files this app reads, and are they current? A list of every JSON file
   (exports, capacity.json, the CDN cache) and a lazy JSON tree (DESIGN.md → Components → JSON tree). The tree
   is built imperatively, never through the diffing `.html` setter, so polls can rewrite footers around it. */

const TREE_PAGE = 200;          // children fetched per page (server NODE_PAGE)
const TREE_EXPAND_MAX = 2000;   // Expand all: nodes in one depth-99 request (server EXPAND_MAX_NODES)
const TREE_ROW_BUDGET = 5000;   // rendered treeitems before the least recently opened collapsed subtrees are pruned
const FILE_SOURCES = ['character-export', 'storage-export', 'partial-export', 'vault-sizes', 'cdn', 'alt-stale', 'alt-missing', 'chat-log'];
const LOG_PAGE = 500;           // chat log lines per page and matches per search (server LINES_PAGE)
const LOG_ROW_BUDGET = 5000;    // rendered log lines before "Show earlier" hands over to Open raw
const LOGS_SHOWN = 7;           // chat logs listed before "Show N older logs"
const CDN_LABEL = { items: 'Items', quests: 'Quests', npcs: 'NPCs', attributes: 'Stats', areas: 'Areas', storagevaults: 'Storage vaults', tsysclientinfo: 'Item powers' };
const TIME_KEYS = new Set(['Timestamp', 'VendorResetTime']);
const UTC_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}Z$/;
// File sizes read in B / KB / MB with one decimal; the exact byte count goes in the tooltip (Voice → Format rules).
const fmtBytes = n => n == null ? '' : n < 1000 ? `${fmt(n)} B` : n < 1e6 ? `${(n / 1e3).toFixed(1)} KB` : `${(n / 1e6).toFixed(1)} MB`;
const ptrEsc = s => String(s).replace(/~/g, '~0').replace(/\//g, '~1');
const ptrParts = p => p ? String(p).split('/').slice(1).map(s => s.replace(/~1/g, '/').replace(/~0/g, '~')) : [];
const attrq = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
let treeTick = 0;

const fUI = {
  showOld: false,     // "Show N older exports" (not persisted)
  showOldLogs: false, // "Show N older logs" (not persisted)
  log: null,          // open chat log: { tail: {lines, offset, total}, hits: null | {q, lines, matches, capped} }
  folds: {},          // group id -> true when collapsed (not persisted)
  q: '', qTimer: null, results: null,
  state: 'none',      // Contents body: none | loading | tree | log | empty | scalar | invalid | gone | error
  err: null, changed: false, note: null,
  lastHash: null, autoTried: false, openSeq: 0, flash: [], booted: false,
};
S.files = null; S.filesAt = null; S.filesOld = false; S.file = null;

/* ---------- listing ---------- */
async function loadFiles() {
  let r;
  try { r = await api('/api/files'); }
  catch (e) {
    if (e.status === 404) { S.filesOld = true; S.files = null; return; }
    if (isNetworkError(e)) throw e;
    S.errors.files = e; return;
  }
  if (!r || r.version !== 1 || !Array.isArray(r.files)) { S.filesOld = true; S.files = null; return; }
  S.filesOld = false; S.errors.files = null;
  const prev = new Map((S.files?.files || []).map(f => [f.id, f.mtimeNs]));
  S.files = r; S.filesAt = NOW(); S.lastGood.files = NOW();
  // A new or rewritten file flashes once; the open file's mtime change sets the File changed state.
  fUI.flash = prev.size ? r.files.filter(f => f.exists && prev.get(f.id) !== f.mtimeNs).map(f => f.id) : [];
  // A tree keeps its loaded rows and asks for a Reload; the other settled states (invalid, empty, scalar, gone,
  // error) have nothing to preserve, so a rewritten file is simply read again (the fix the invalid state asked for).
  const open = S.file && r.files.find(f => f.id === S.file.id);
  if (open && S.file.mtimeNs != null && open.mtimeNs != null && open.mtimeNs !== S.file.mtimeNs && fUI.state !== 'none' && fUI.state !== 'loading') {
    if (fUI.state === 'tree') fileChanged(open.mtime);
    else if (fUI.state === 'log') refreshLog().catch(() => {}); // the live log is appended, not rewritten: just read the new tail
    else openFile(S.file.id, '', { focus: false });
  }
}
const fileRows = () => S.files?.files || [];
const exportFiles = () => fileRows().filter(f => f.group === 'reports');
const logFiles = () => fileRows().filter(f => f.group === 'logs'); // newest written first (server order)
const newestLog = () => logFiles().find(f => f.newest) || logFiles()[0] || null;
const logWrittenAt = f => f ? parseIso(f.lastLineAt) || parseIso(f.mtime) : null;
function fileMeta(f) {
  const mine = f.character === S.character;
  const at = parseIso(f.at) || parseIso(f.mtime);
  const kind = f.report === 'Storage' ? 'Storage' : 'Character';
  return { mine, at, kind, inUse: !!(f.newest && mine && f.valid && !f.partial), alt: !mine && !f.partial && !!f.character && f.character !== '???',
    superseded: !f.newest && !f.partial && f.valid !== false };
}
// The newest valid, non-partial export of the selected character (any kind) and per kind.
function newestExport(kind) {
  return exportFiles().filter(f => f.valid && !f.partial && f.character === S.character && (!kind || f.report === kind))
    .sort((a, b) => (parseIso(b.at) || 0) - (parseIso(a.at) || 0))[0] || null;
}
const filesSnapshot = () => fileRows().map(f => `${f.id}@${f.mtimeNs}`).join('|');
const paneFlag = sev => shape(sev, 's13').replace(`sev-${sev}`, 'flag');
// Worst of the selected character's two export verdicts (stamp severity, Files footer fix).
function worstExportSource() {
  const srcs = ['storage-export', 'character-export'].map(V).filter(Boolean).sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity]);
  return srcs[0] || null;
}

function renderFiles() {
  const files = fileRows();
  const old = S.filesOld;
  const err = !old && S.errors.files && !S.files;
  const loading = !old && !err && !S.files;
  const reps = exportFiles(), cur = S.files?.cdnVersion || cdnVersion();
  const cdnCur = files.filter(f => f.group === 'cdn' && f.version === cur);
  const cap = files.find(f => f.group === 'app');
  const newest = reps.filter(f => f.valid && !f.partial).sort((a, b) => (parseIso(b.at) || 0) - (parseIso(a.at) || 0))[0];
  const none = S.files && !files.some(f => f.exists !== false);
  const worst = worstExportSource();
  const sev = worst && (worst.severity === 'warn' || worst.severity === 'bad') ? worst.severity : 'ok';
  // Entering the view fetches the list at once instead of waiting for the round's other endpoints.
  if (S.view === 'files' && loading && !fUI.listing && PREVIEW.sim !== 'loading') {
    fUI.listing = true;
    loadFiles().catch(onFetchError).then(() => { fUI.listing = false; if (S.view === 'files') { computeVerdicts(); renderAll(); } });
  }

  if (S.view === 'files') {
    $('#h1').textContent = 'Files';
    $('#title-extra').hidden = true;
    if (old) { $('#finding').textContent = 'Needs a newer server.py to list the files.'; setStamp('File list', 'not available', 'bad'); }
    else if (loading) { $('#finding').html = '<span class="dim">Reading Reports/, capacity.json, cache/ and ChatLogs/…</span>'; setStamp('Newest export', '…', 'ok'); }
    else if (none) { $('#finding').textContent = 'No files yet. Exports land in Reports/ once you use the VIP menu, the chat log appears with Log All Chat on, and game data is fetched the first time Vendors or Storage loads.'; setStamp('No exports found', 'missing', 'bad'); }
    else if (err) { $('#finding').textContent = "Couldn't load the file list."; setStamp('File list', 'not loaded', 'bad'); }
    else {
      const parts = [`<em class="n">${fmt(reps.length)}</em> ${reps.length === 1 ? 'export' : 'exports'}`];
      if (cap?.exists) parts.push('your vault sizes');
      parts.push(`<em class="n">${fmt(cdnCur.length)}</em> game data ${cdnCur.length === 1 ? 'file' : 'files'} (v${esc(cur)}, ${fmtBytes(cdnCur.reduce((a, f) => a + f.bytes, 0))})`);
      const logs = logFiles();
      if (logs.length) parts.push(`<em class="n">${fmt(logs.length)}</em> chat ${logs.length === 1 ? 'log' : 'logs'} (${fmtBytes(logs.reduce((a, f) => a + f.bytes, 0))})`);
      const nFiles = files.filter(f => f.exists !== false).length;
      let f = `<em class="n">${fmt(nFiles)}</em> ${nFiles === 1 ? 'file' : 'files'}: ${joinNames(parts)}.`;
      // The age sentence and the stamp share one source: the selected character's newest valid export.
      const mine = newestExport();
      const mAt = mine ? parseIso(mine.at) : null;
      const nAt = newest ? parseIso(newest.at) : null;
      if (mAt) f += ` The newest export is <em class="n">${esc(ageWord((NOW() - mAt) / 1000))}</em> old.`;
      else {
        f += S.character ? ` No exports for ${esc(S.character)} yet.` : ' No exports yet.';
        if (nAt && newest.character && newest.character !== '???') f += ` ${esc(newest.character)}'s newest is <em class="n">${esc(ageWord((NOW() - nAt) / 1000))}</em> old.`;
      }
      // The chat log sentence: the file Combat and Session read, and how fresh it is (the chat-log verdict's own words when it's not fine).
      const nl = newestLog(), lAt = logWrittenAt(nl), cv = V('chat-log');
      if (nl && lAt) f += cv && (cv.severity === 'warn' || cv.severity === 'bad') ? ` <span class="suffix">The chat log was last written ${ageLong((NOW() - lAt) / 1000)} ago. ${esc(cv.evidence)}</span>` : ` The chat log was written <em class="n">${esc(ago(lAt))}</em>.`;
      else if (!nl && !loading) f += ' No chat log yet.';
      if (worst && worst.severity === 'warn' && worst.ageSec != null) f += ` <span class="suffix">The newest ${worst.source === 'storage-export' ? 'storage' : 'character'} export is ${ageLong(worst.ageSec)} old.</span>`;
      $('#finding').html = f;
      if (S.down && S.downSince) setStamp('Newest export', `as of ${hhmm(S.downSince)}`, 'bad');
      else if (!mAt) setStamp('No exports found', 'missing', 'bad');
      else setStamp(`Newest export of ${dayMon(mAt)}, ${hhmm(mAt)}`, ago(mAt), sev);
    }
  }

  renderFilePane({ old, err, loading, none, cur, cdnCur, cap, reps });
  renderContents();
  fUI.flash = [];

  // Route: #files?f=<id>&p=<pointer>. Picking a file sets the hash (Back works); expanding never touches it.
  if (S.view !== 'files') return;
  const { params } = route(location.hash.slice(1));
  const want = params.get('f'), p = params.get('p') || '';
  const key = `${want || ''}|${p}`;
  if (want) {
    if (!S.file || S.file.id !== want) { fUI.lastHash = key; openFile(want, p, { focus: fUI.booted }); }
    else if (fUI.lastHash !== key) { fUI.lastHash = key; if (p && fUI.state === 'tree') revealPath(p, null, { flash: true }); }
  } else if (!S.file && S.files && S.character && !fUI.autoTried) { // waits for pickCharacter(): the default is the selected character's export
    fUI.autoTried = true;
    const saved = store.get('pgdash.file', null);
    const id = files.some(f => f.id === saved && f.exists !== false) ? saved : newestExport('CharacterSheet')?.id;
    if (id) openFile(id, '', { focus: false });
  }
  fUI.booted = true;
}

/* The Files pane: three fixed groups, two-line rows, links not selection (opening a file is navigation). */
function renderFilePane({ old, err, loading, none, cur, cdnCur, cap, reps }) {
  const box = $('#f-list');
  const under = $('#f-under');
  $('#f-count').textContent = S.files ? fmt(fileRows().filter(f => f.exists !== false).length) : '';
  under.hidden = !(S.files?.csvSkipped > 0);
  under.textContent = S.files?.csvSkipped > 0 ? `Also in Reports/: ${plural(S.files.csvSkipped, 'CSV export')}, not shown.` : '';
  const listedAt = S.filesAt ? hhmm(S.filesAt) : '…';
  const footL = `Reports/, capacity.json, cache/v${esc(cur)}, ChatLogs/ · listed ${listedAt}`;
  const worst = worstExportSource();
  const chatV = V('chat-log');
  const footR = worst && (worst.severity === 'warn' || worst.severity === 'bad') && worst.fixKey
    ? srcFix(worst.source, worst.ageSec == null ? '' : worst.source === 'storage-export' ? 'After storing:' : 'After selling:')
    : chatV && (chatV.severity === 'warn' || chatV.severity === 'bad') && chatV.fixKey ? srcFix('chat-log')
    : '<span>To refresh: VIP menu → Export Character JSON or Export Storage JSON</span>';
  if (old) { box.html = '<p class="needs" style="padding:12px">Needs a newer server.py.</p>'; setFoot('w-f-list', footL, 'Files need a newer server.py'); return; }
  if (err) { box.html = `<div style="padding:12px">${blockError('the file list', S.lastGood.files)}</div>`; setFoot('w-f-list', footL, footR); return; }
  if (loading) {
    const bar = w => `<tr class="row"><td class="m1"><span class="loading-bar" style="width:${w}px;height:14px;background:var(--pane-track)"></span><div class="small"><span class="loading-bar" style="width:${w + 60}px;height:12px;background:var(--pane-track)"></span></div></td><td class="num m2"><span class="loading-bar" style="width:48px;height:14px;background:var(--pane-track)"></span></td></tr>`;
    box.html = `<div class="pane-wrap"><div class="pane"><table class="tbl resp files"><thead><tr><th>File</th><th class="num">Size</th></tr></thead><tbody>
      <tr class="sec"><td><span class="secbtn">Exports</span></td><td></td></tr>${bar(140)}${bar(120)}<tr class="sec"><td><span class="secbtn">Chat logs</span></td><td></td></tr>${bar(110)}<tr class="sec"><td><span class="secbtn">Typed in by you</span></td><td></td></tr>${bar(90)}<tr class="sec"><td><span class="secbtn">Game data</span></td><td></td></tr>${bar(60)}</tbody></table></div></div>`;
    setFoot('w-f-list', 'Reading Reports/, capacity.json, cache/ and ChatLogs/…', '');
    return;
  }
  if (none) {
    plaqueInView = 'export-character';
    const pl = plaqueFor('export-character');
    box.html = `<p class="pane-empty" style="padding:12px 12px 0">No files yet. Exports land in Reports/ once you use the VIP menu, the chat log appears with Log All Chat on, and game data is fetched the first time Vendors or Storage loads.</p>
      <div style="padding:0 12px 12px"><button type="button" class="plaque plaque-wide" data-fix="export-character" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button></div>`;
    setFoot('w-f-list', footL, esc(fixText('export-character')));
    return;
  }
  const openId = S.file?.id;
  const sec = (id, label, n, bytes, extra = '') => {
    const open = !fUI.folds[id];
    return `<tr class="sec"><td><button type="button" class="secbtn" data-fold="${id}" aria-expanded="${open}">${TRI(open)}${esc(label)} <span class="seccount">${plural(n, 'file')}${extra}</span></button></td><td class="num"><b>${fmtBytes(bytes)}</b></td></tr>`;
  };
  const row = (f, line1, line2, chips = '', link = true) => {
    const cur = f.id === openId;
    const nm = `<span class="nm">${line1}</span>`;
    const name = link ? `<a class="fopen" href="#files?f=${encodeURIComponent(f.id)}" data-file="${esc(f.id)}">${nm}</a>` : nm;
    return `<tr class="row${link ? ' selectable' : ''}${fUI.flash.includes(f.id) ? ' flash' : ''}" data-frow="${esc(f.id)}"${cur ? ' aria-current="true"' : ''}>
      <td class="m1">${name}${chips}${cur ? ' <span class="tag">open</span>' : ''}<div class="small">${line2}</div></td>
      <td class="num m2" title="${f.exists === false ? '' : `${fmt(f.bytes)} bytes`}">${f.exists === false ? '' : fmtBytes(f.bytes)}</td></tr>`;
  };
  const tag = t => ` <span class="tag">${t}</span>`;
  const flagWord = (sev, word) => sev === 'warn' || sev === 'bad' ? ` · <span class="flag">${paneFlag(sev)}</span> ${word}` : '';
  let body = '';
  // Exports: newest per character and kind, partial and unparsable files; the rest behind "Show N older exports".
  const shown = reps.filter(f => f.newest || f.partial || f.valid === false || fUI.showOld);
  const hidden = reps.length - shown.length;
  body += sec('exports', 'Exports', reps.length, reps.reduce((a, f) => a + f.bytes, 0));
  if (!fUI.folds.exports) {
    if (!reps.some(f => f.character === S.character && !f.partial)) { // the selected character has none (alts may still be listed)
      plaqueInView = 'export-character';
      const pl = plaqueFor('export-character');
      body += `<tr class="row"><td class="m1" colspan="2"><p class="pane-empty" style="padding:4px 0">No exports for ${esc(S.character || 'this character')} yet. Exports land in Reports/ once you use the VIP menu.</p>
        <button type="button" class="plaque plaque-wide" data-fix="export-character" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button></td></tr>`;
    }
    for (const f of shown) {
      const m = fileMeta(f);
      const saved = m.at ? `saved ${dateTime(m.at)}` : 'date unknown';
      const fname = `<span class="well fname">${esc(f.name)}</span>`;
      let line1, line2, chips = '';
      if (f.valid === false) {
        line1 = `${m.kind} · ${esc(f.character || 'unknown')}`; chips = tag("won't parse");
        line2 = `${fname} · ${saved} · ${esc(f.error || 'not valid JSON')}`;
      } else if (f.partial) {
        line1 = 'Character · partial twin'; chips = tag('partial');
        line2 = `${fname} · ${saved} · ignored${flagWord(sevOf('partial-export') === 'bad' ? 'bad' : 'ok', 'broken')}`;
      } else {
        line1 = `${m.kind} · ${esc(f.character || '?')}`;
        if (m.inUse) chips = tag('in use'); else if (m.alt) chips = tag('alt') + (f.newest ? '' : tag('superseded')); else if (m.superseded) chips = tag('superseded');
        let flag = '';
        if (m.inUse) { const v = V(f.source); if (v && (v.severity === 'warn' || v.severity === 'bad')) flag = flagWord(v.severity, v.severity === 'bad' ? 'broken' : 'stale'); }
        else if (m.alt && f.newest) { const v = S.verdicts.find(x => x.source === 'alt-stale' && x.fixArgs?.alt === f.character); if (v && (v.severity === 'warn' || v.severity === 'bad')) flag = flagWord(v.severity, 'stale'); }
        line2 = `${fname} · ${saved}${m.at ? ` · ${ago(m.at)}` : ''}${flag}`;
      }
      body += row(f, line1, line2, chips);
    }
    if (hidden > 0 || (fUI.showOld && reps.some(f => !(f.newest || f.partial || f.valid === false))))
      body += `<tr class="row"><td class="m1" colspan="2"><button type="button" class="linkbtn" data-fmore="1" style="text-decoration:underline">${fUI.showOld ? 'Show fewer' : `Show ${plural(hidden, 'older export')}`}</button></td></tr>`;
  }
  // Chat logs: one file per day, newest first; the newest is the one Combat, Session and the live health checks read.
  // The last week is listed, the rest behind "Show N older logs"; older than 31 days only the raw file is left to read.
  const logs = logFiles();
  if (logs.length) {
    body += sec('logs', 'Chat logs', logs.length, logs.reduce((a, f) => a + f.bytes, 0));
    if (!fUI.folds.logs) {
      const shownL = fUI.showOldLogs ? logs : logs.slice(0, LOGS_SHOWN);
      for (const f of shownL) {
        const at = logWrittenAt(f);
        const day = parseIso(f.date ? `${f.date}T00:00:00` : f.mtime);
        const fname = `<span class="well fname">${esc(f.name)}</span>`;
        let chips = '', flag = '';
        if (f.newest) {
          chips = tag('in use');
          if (chatV && (chatV.severity === 'warn' || chatV.severity === 'bad')) flag = flagWord(chatV.severity, chatV.severity === 'bad' ? 'off' : 'silent');
        }
        const meta = [fname, at ? `written ${dateTime(at)}` : 'date unknown', at ? ago(at) : ''];
        if (f.newest && f.combatLines != null) meta.push(plural(f.combatLines, 'combat line'));
        body += row(f, `Chat log · ${day ? (isToday(day) ? 'today' : dayMon(day)) : esc(f.name)}`, meta.filter(Boolean).join(' · ') + flag, chips);
      }
      if (logs.length > LOGS_SHOWN) body += `<tr class="row"><td class="m1" colspan="2"><button type="button" class="linkbtn" data-lmoreold="1" style="text-decoration:underline">${fUI.showOldLogs ? 'Show fewer' : `Show ${plural(logs.length - LOGS_SHOWN, 'older log')}`}</button></td></tr>`;
    }
  }
  // Typed in by you: capacity.json, listed even when absent so the row can say how it gets created.
  if (cap) {
    body += sec('app', 'Typed in by you', cap.exists === false ? 0 : 1, cap.exists === false ? 0 : cap.bytes);
    if (!fUI.folds.app) {
      if (cap.exists === false) body += row(cap, 'Vault sizes · not created yet', 'capacity.json appears when you type a size in the Slots column on Storage', '', false);
      else {
        const v = V('vault-sizes');
        body += row(cap, 'Vault sizes', `<span class="well fname">capacity.json</span> · saved ${dateTime(parseIso(cap.mtime))}${cap.vaults != null ? ` · ${plural(cap.vaults, 'vault')}` : ''}${cap.valid === false ? ` · ${esc(cap.error || "won't parse")}` : ''}${v && (v.severity === 'warn' || v.severity === 'bad') ? flagWord(v.severity, v.severity === 'bad' ? 'broken' : 'incomplete') : ''}`, cap.valid === false ? tag("won't parse") : '');
      }
    }
  }
  // Game data: the current CDN version, then older versions collapsed.
  const cdnV = V('cdn');
  const cdnFlag = cdnV && cdnV.severity === 'bad' ? flagWord('bad', 'unreachable') : cdnV && cdnV.severity === 'info' ? ` · <span class="flag">${paneFlag('info').replace('sev-info', 'flag')}</span> updated` : '';
  const cdnRow = f => row(f, esc(f.label || CDN_LABEL[f.name.replace(/\.json$/, '')] || f.name),
    `<span class="well fname">${esc(f.name)}</span>${f.nodes != null ? ` · ${plural(f.nodes, 'entry', 'entries')}` : ''} · fetched ${dateTime(parseIso(f.mtime))}${cdnFlag}`);
  body += sec('cdn', `Game data v${cur}`, cdnCur.length, cdnCur.reduce((a, f) => a + f.bytes, 0));
  if (!fUI.folds.cdn) body += cdnCur.map(cdnRow).join('');
  const olderV = [...new Set(fileRows().filter(f => f.group === 'cdn' && f.version !== cur).map(f => f.version))].sort((a, b) => b - a);
  for (const ver of olderV) {
    const fs = fileRows().filter(f => f.group === 'cdn' && f.version === ver);
    if (fUI.folds[`cdn${ver}`] == null) fUI.folds[`cdn${ver}`] = true; // older versions start collapsed
    body += sec(`cdn${ver}`, `Game data v${ver} (older)`, fs.length, fs.reduce((a, f) => a + f.bytes, 0));
    if (!fUI.folds[`cdn${ver}`]) body += fs.map(cdnRow).join('');
  }
  box.html = `<div class="pane-wrap"><div class="pane"><table class="tbl resp files" id="f-table"><thead><tr><th>File</th><th class="num">Size</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  setFoot('w-f-list', footL, footR);
}

/* ---------- Contents window: chrome, footer and states around the tree ---------- */
function setTreeState(state, err = null) { fUI.state = state; fUI.err = err; }
function renderContents() {
  const f = S.file, row = f ? fileRows().find(x => x.id === f.id) || f.row : null;
  if (f && row) f.row = row;
  const st = fUI.state;
  const open = !!f && st === 'tree';
  const isLog = !!f && st === 'log';
  const wide = window.innerWidth >= 1180;
  $('#f-total').textContent = f?.total != null && st !== 'loading' ? (isLog ? plural(f.total, 'line') : `${plural(f.total, 'entry', 'entries')}`) : '';
  $('#f-tree').setAttribute('aria-label', f ? `Contents of ${f.name}` : 'Contents');
  $('#f-logbox').setAttribute('aria-label', f ? `Lines of ${f.name}` : 'Lines');
  ['#f-expand', '#f-collapse'].forEach(s => { $(s).disabled = !open || fUI.changed; });
  const q = $('#fileq');
  q.disabled = !(open || isLog) || fUI.changed;
  q.placeholder = isLog ? 'Any text, e.g. Bee Stab' : 'Key or value in this file, e.g. Mycology';
  const raw = $('#f-raw');
  const rawOk = f && (st === 'tree' || st === 'log' || st === 'invalid' || st === 'empty' || st === 'scalar') && !fUI.changed;
  if (rawOk) { raw.href = `/api/file/raw?id=${encodeURIComponent(f.id)}`; raw.removeAttribute('aria-disabled'); raw.textContent = `Open raw · ${fmtBytes(f.bytes)}`; }
  else { raw.removeAttribute('href'); raw.setAttribute('aria-disabled', 'true'); raw.textContent = 'Open raw'; }
  $('#f-treebox').hidden = !open;
  $('#f-logbox').hidden = !isLog;
  $('#f-hint').hidden = !(open || isLog);
  $('#f-hint').textContent = isLog ? 'Newest lines at the bottom. A search lists every matching line in the file, oldest first.' : 'Arrow keys move and open, * opens every sibling, type a letter to jump.';
  $('#f-pathwrap').hidden = !open;
  if (!open) $('#f-results').hidden = true;
  const note = $('#f-note');
  if (fUI.changed && f) {
    note.hidden = false; note.className = 'note-line warn';
    note.html = `${shape('warn', 's13')}<span>This file was rewritten at ${hhmm(parseIso(fUI.changedAt) || NOW())} while you were reading it. Reload to read the new ${f.row?.group === 'reports' ? 'export' : 'file'}. <button type="button" class="linkbtn" data-freload="1">Reload</button></span>`;
  } else if (fUI.note) { note.hidden = false; note.className = 'note-line'; note.html = `${shape('info', 's13')}<span>${esc(fUI.note)}</span>`; }
  else note.hidden = true;
  const state = $('#f-state');
  const bodyFor = {
    none: `<p class="empty">Pick a file ${wide ? 'on the left' : 'above'}.</p>`,
    loading: '<div class="loading-bar" style="width:100%;height:32px"></div>',
    empty: f ? `<p class="empty">This file is an empty ${f.type === 'array' ? 'list' : 'object'}.</p>` : '',
    scalar: f ? `<p class="empty">This file holds one value: <span class="v">${esc(JSON.stringify(fUI.err))}</span></p>` : '',
    tree: '',
    log: '',
  };
  if (st in bodyFor) state.html = bodyFor[st];
  else if (st === 'invalid') {
    const e = fUI.err || {};
    const where = e.line != null ? ` Line ${fmt(e.line)}, column ${fmt(e.col)}: ${esc(e.msg || '')}.` : e.msg ? ` ${esc(e.msg)}.` : '';
    const isExport = f?.row?.group === 'reports';
    let html = `<p class="txt-bad" style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap"><span>${shape('bad')}</span><span style="flex:1 1 200px">Couldn't read this file as JSON.${where}</span><button type="button" class="btn" data-fretry="1">Retry</button></p>`;
    if (isExport) {
      const pl = plaqueFor('export-again');
      plaqueInView = 'export-again';
      html += `<p class="empty">An export written right before logout can be cut short.</p><button type="button" class="plaque plaque-wide" data-fix="export-again" aria-label="${esc(pl[0] + '. ' + pl[1] + '. Then check again.')}"><span class="p1">${pl[0]}</span><span class="p2">${pl[1]}</span></button>`;
    } else if (f?.row?.group === 'cdn') html += `<p class="empty">Delete ${esc(f.row.dir + f.name)} and the server fetches it again the next time Vendors loads.</p>`;
    else if (f?.row?.group === 'logs') html += '<p class="empty">A chat log is plain text; open it as one from the list.</p>';
    else html += '<p class="empty">Nothing in the app reads it until it parses again.</p>';
    state.html = html;
  } else if (st === 'gone') {
    const dir = f?.row?.dir || (f?.id.startsWith('reports/') ? 'Reports/' : f?.id.startsWith('cdn/') ? `cache/${f.id.split('/')[1]}/` : f?.id.startsWith('logs/') ? 'ChatLogs/' : 'the app folder');
    state.html = `<p class="txt-bad" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${shape('bad')}<span>This file is gone. ${esc(f?.name || '')} isn't in ${esc(dir)} any more; the list has been refreshed.</span><button type="button" class="btn" data-fretry="1">Retry</button></p>`;
  } else if (st === 'error') state.html = blockError('this file', S.lastGood.file);
  contentsFoot(f, st);
}
function contentsFoot(f, st) {
  if (S.filesOld) return setFoot('w-f-view', f ? esc(f.name) : 'No file open', 'Files need a newer server.py');
  if (!f) return setFoot('w-f-view', 'No file open', '');
  const row = f.row || {};
  const size = f.bytes != null ? fmtBytes(f.bytes) : '';
  if (st === 'loading') return setFoot('w-f-view', `Reading ${esc(f.name)}${size ? ' · ' + size : ''}…`, '');
  const m = row.group === 'reports' ? fileMeta(row) : null;
  const mt = parseIso(f.mtime);
  if (st === 'invalid') {
    const left = `${shape('bad', 's13')}<span class="txt-bad">Not valid JSON</span>${mt ? ` · saved ${dateTime(mt)}` : ''}${size ? ' · ' + size : ''}`;
    const right = row.group === 'reports' ? `<span class="txt-bad">${esc(fixText(m?.kind === 'Storage' ? 'export-storage' : 'export-again'))}</span>` : 'Nothing in the app reads it.';
    return setFoot('w-f-view', left, right);
  }
  if (st === 'gone') return setFoot('w-f-view', `${shape('bad', 's13')}<span class="txt-bad">${esc(f.name)} · gone</span>`, '');
  if (st === 'error') return setFoot('w-f-view', esc(f.name), '');
  if (row.group === 'reports') {
    const at = m.at, when = at ? dateTime(at) : '?';
    if (row.partial) return setFoot('w-f-view', `${shape('bad', 's13')}<span class="txt-bad">Character export of ${when} · partial · ignored by the other views</span>`, `<span class="txt-bad">${esc(fixText('export-again'))}</span>`);
    if (m.alt) {
      const v = S.verdicts.find(x => x.source === 'alt-stale' && x.fixArgs?.alt === row.character);
      const age = at ? ago(at) : '';
      return setFoot('w-f-view', `${m.kind} export of ${esc(row.character)} · ${when}${age ? ' · ' + age : ''}`, esc(fixText('alt-export', { alt: row.character })) + (v ? '' : ''));
    }
    if (m.inUse) {
      const v = V(row.source);
      const sev = v && (v.severity === 'warn' || v.severity === 'bad') ? v.severity : null;
      const age = at ? ago(at) : '';
      const left = `${m.kind} export of ${when} · ${sev ? `${shape(sev, 's13')}<span class="age ${sev}">${age}</span>` : age}${size ? ' · ' + size : ''}`;
      return setFoot('w-f-view', left, srcFix(row.source, m.kind === 'Storage' ? 'After storing:' : 'After selling:'));
    }
    const nw = newestExport(row.report) || exportFiles().filter(x => x.valid && !x.partial && x.character === row.character && x.report === row.report).sort((a, b) => (parseIso(b.at) || 0) - (parseIso(a.at) || 0))[0];
    const nAt = nw ? parseIso(nw.at) : null;
    return setFoot('w-f-view', `${m.kind} export of ${when}${at ? ' · ' + ago(at) : ''}${nAt ? ` · superseded by the one of ${dateTime(nAt)}` : ''}`,
      nw ? `<button type="button" class="linkbtn" data-fnewest="${esc(nw.id)}" style="text-decoration:underline">Show newest</button>` : '');
  }
  if (row.group === 'logs') {
    const last = logWrittenAt(row) || mt;
    const day = parseIso(row.date ? `${row.date}T00:00:00` : row.mtime);
    const v = V('chat-log');
    const sev = row.newest && v && (v.severity === 'warn' || v.severity === 'bad') ? v.severity : null;
    const age = last ? ago(last) : '';
    const left = `Chat log of ${day ? dayMon(day) : esc(f.name)}${last ? ` · last line ${dateTime(last)}` : ''} · ${sev ? `${shape(sev, 's13')}<span class="age ${sev}">${age}</span>` : age}${size ? ' · ' + size : ''}`;
    let right;
    if (row.newest) right = sev ? srcFix('chat-log') : `<span>${S.session?.live ? 'Being written as you play; this view re-reads it every minute.' : 'Combat and Session read this one.'} ${esc(fixText('chat-logging-ok'))}</span>`;
    else right = last && (NOW() - last) / 1000 < 31 * 86400 ? 'Only the 31-day combat totals read this one.' : 'Nothing in the app reads this one any more.';
    return setFoot('w-f-view', left, right);
  }
  if (row.group === 'app') return setFoot('w-f-view', `Vault sizes · capacity.json${mt ? ` · saved ${dateTime(mt)}` : ''}${row.vaults != null ? ` · ${plural(row.vaults, 'vault')}` : ''} · typed in by you`, '<span>To change a size: <a href="#storage">Storage → Slots column</a></span>');
  if (row.group === 'cdn') {
    const v = V('cdn');
    const left = `Game data v${esc(row.version || cdnVersion())} · ${esc(f.name)}${mt ? ` · fetched ${dateTime(mt)}` : ''}${size ? ' · ' + size : ''}`;
    const right = v?.severity === 'bad' ? `${shape('bad', 's13')}<span class="txt-bad">CDN unreachable, showing the cached v${esc(row.version || cdnVersion())}</span>` : v?.severity === 'info' ? esc(v.evidence) : 'Refreshes itself when the game patches';
    return setFoot('w-f-view', left, right);
  }
  setFoot('w-f-view', `${esc(f.name)}${size ? ' · ' + size : ''}`, '');
}

/* ---------- opening a file ---------- */
async function fileApi(endpoint, params, opts = {}) {
  if (fUI.changed) throw Object.assign(new Error('file changed'), { changed: true });
  const qs = new URLSearchParams({ id: S.file.id, ...params });
  if (opts.mtime !== false && S.file.mtimeNs != null) qs.set('mtime', String(S.file.mtimeNs));
  try { return await api(`/api/file/${endpoint}?${qs}`); }
  catch (e) {
    if (e.status === 409 && e.body) { fileChanged(e.body.mtime); e.changed = true; }
    throw e;
  }
}
function fileChanged(mtimeIso) {
  if (fUI.changed) return;
  fUI.changed = true; fUI.changedAt = mtimeIso;
  announce(`This file was rewritten at ${hhmm(parseIso(mtimeIso) || NOW())}. Reload to read it.`);
  renderContents();
}
function announce(text) { const el = $('#f-status'); el.textContent = ''; setTimeout(() => { el.textContent = text; }, 30); }
function clearTree() { const t = $('#f-tree'); t.innerHTML = ''; t._count = 0; t.dataset.path = ''; t.dataset.level = '1'; }
async function openFile(id, pointer = '', opts = {}) {
  const seq = ++fUI.openSeq;
  const row = fileRows().find(f => f.id === id) || null;
  S.file = { id, row, name: id.split('/').pop(), mtimeNs: null, bytes: row?.bytes ?? null, mtime: row?.mtime ?? null, total: null, type: null };
  fUI.changed = false; fUI.note = null; fUI.results = null; fUI.q = ''; fUI.changedAt = null;
  $('#fileq').value = ''; $('#f-results').hidden = true; $('#f-qnote').hidden = true;
  store.set('pgdash.file', id);
  clearTree(); fUI.log = null; $('#f-logbox').innerHTML = ''; setTreeState('loading'); renderContents(); renderFilePane(paneArgs());
  if (opts.focus !== false) $('#t-f-view').focus(); // the Here window rule: focus lands on the title, not <body>
  if (row?.group === 'logs' || id.startsWith('logs/')) return openLog(seq);
  let r;
  try { r = await fileApi('node', { path: '', limit: TREE_PAGE }, { mtime: false }); }
  catch (e) { if (seq !== fUI.openSeq) return; return fileFailed(e); }
  if (seq !== fUI.openSeq) return;
  Object.assign(S.file, { mtimeNs: r.mtimeNs, bytes: r.bytes, mtime: r.mtime, total: r.total, type: r.type });
  S.lastGood.file = NOW();
  if (r.type !== 'object' && r.type !== 'array') { setTreeState('scalar', r.value); renderFiles(); return; }
  if (!r.count) { setTreeState('empty'); renderFiles(); return; }
  const tree = $('#f-tree');
  tree._count = r.count;
  fillGroup(tree, r, 1);
  setTreeState('tree'); renderFiles();
  const first = tree.querySelector('li[role=treeitem]');
  if (first) { first.tabIndex = 0; updatePathBar(first); }
  if (pointer) {
    try {
      const loc = await fileApi('node', { path: pointer, locate: 1, limit: 1 });
      if (seq !== fUI.openSeq) return;
      await revealPath(pointer, loc.pos, { flash: true, focus: opts.focus !== false });
    } catch (e) {
      if (e.changed) return;
      if (e.status === 404) sysLine('warn', `No entry ${pointer} in ${S.file.name}. Showing the top of the file.`); else onFetchError(e);
    }
  }
}
/* ---------- chat logs: plain lines, newest at the bottom, search lists matching lines ---------- */
// The live log is appended every few seconds, so no `mtime` token travels with these requests (a 409 would be noise);
// the listing poll calls refreshLog() when the file grew.
async function openLog(seq) {
  let r;
  try { r = await fileApi('lines', { limit: LOG_PAGE }, { mtime: false }); }
  catch (e) { if (seq !== fUI.openSeq) return; return fileFailed(e); }
  if (seq !== fUI.openSeq) return;
  Object.assign(S.file, { mtimeNs: r.mtimeNs, bytes: r.bytes, mtime: r.mtime, total: r.total, type: 'log' });
  S.lastGood.file = NOW();
  fUI.log = { tail: { lines: r.lines, offset: r.offset, total: r.total }, hits: null };
  setTreeState('log'); renderFiles(); renderLog(true);
}
async function refreshLog() {
  if (!S.file || fUI.state !== 'log' || !fUI.log) return;
  const seq = fUI.openSeq;
  const r = await fileApi('lines', { limit: Math.max(LOG_PAGE, Math.min(LOG_ROW_BUDGET, fUI.log.tail.lines.length)) }, { mtime: false });
  if (seq !== fUI.openSeq || fUI.state !== 'log') return;
  Object.assign(S.file, { mtimeNs: r.mtimeNs, bytes: r.bytes, mtime: r.mtime, total: r.total });
  fUI.log.tail = { lines: r.lines, offset: r.offset, total: r.total };
  if (fUI.log.hits) await runSearch(); else renderLog(false);
  renderContents();
}
async function loadEarlier() {
  const L = fUI.log; if (!L || L.hits || L.tail.offset <= 0) return;
  const box = $('#f-logbox'), btn = box.querySelector('[data-lmore]');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
  const offset = Math.max(0, L.tail.offset - LOG_PAGE), limit = L.tail.offset - offset;
  let r;
  try { r = await fileApi('lines', { offset, limit }, { mtime: false }); }
  catch (e) { if (btn) { btn.disabled = false; btn.textContent = 'Retry'; } onFetchError(e); return; }
  if (fUI.log !== L) return;
  L.tail = { lines: r.lines.concat(L.tail.lines), offset: r.offset, total: Math.max(L.tail.total, r.total) };
  const before = box.scrollHeight, top = box.scrollTop;
  renderLog(false);
  box.scrollTop = top + (box.scrollHeight - before); // the lines on screen stay put
  const nb = box.querySelector('[data-lmore]'); if (nb) nb.focus(); else box.focus();
}
function logLineHtml(l, q) {
  const num = `<span class="ln" aria-hidden="true">${fmt(l.n)}</span>`;
  const mark = s => {
    if (!q) return esc(s);
    const i = String(s).toLowerCase().indexOf(q.toLowerCase());
    return i < 0 ? esc(s) : `${esc(s.slice(0, i))}<b>${esc(s.slice(i, i + q.length))}</b>${esc(s.slice(i + q.length))}`;
  };
  if (!l.ts) return `<div class="lline cont">${num}<span class="ts"></span><span class="msg">${mark(l.msg)}</span></div>`;
  const c = chanOf(l.msg);
  let body = l.msg, tag = '';
  if (c !== 'System') { tag = `<span class="ch" style="color:${CHAN_COLOR[c] || 'var(--text)'}">[${esc(c)}]</span>`; body = body.replace(CHAN_RE, ''); }
  const cls = /reached level/.test(body) ? ' lvl' : c === 'Error' ? ' err' : '';
  return `<div class="lline${cls}">${num}<span class="ts">${esc(l.ts.slice(9))}</span><span class="msg">${tag}${mark(body)}</span></div>`;
}
function renderLog(scrollDown) {
  const box = $('#f-logbox'), L = fUI.log;
  if (!L) { box.innerHTML = ''; return; }
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  let html = '';
  if (L.hits) {
    const h = L.hits, q = h.q;
    const head = `${plural(h.matches, 'matching line')} for "${esc(q)}"`;
    let cap = '';
    if (h.lines.length < h.matches || h.capped) cap = `Showing the first ${fmt(h.lines.length)} of ${fmt(h.matches)}${h.capped ? '+' : ''} matching lines. Narrow the search.`;
    html += `<div class="rhead"><span class="small dim">${head}</span><button type="button" class="linkbtn" data-fclear="1" style="text-decoration:underline">Clear</button></div>`;
    if (cap) html += `<p class="small dim" style="margin:0 0 4px">${esc(cap)}</p>`;
    html += h.lines.length ? h.lines.map(l => logLineHtml(l, q)).join('') : `<p class="empty">No "${esc(q)}" in this log. Every line is searched as plain text.</p>`;
    box.innerHTML = html;
    box.scrollTop = 0;
    announce(head + (cap ? '. ' + cap : ''));
    return;
  }
  const t = L.tail;
  if (t.offset > 0) {
    if (t.lines.length >= LOG_ROW_BUDGET) html += `<p class="small dim lmore">Showing the last ${fmt(t.lines.length)} of ${plural(t.total, 'line')}. Open raw for the whole file.</p>`;
    else html += `<div class="lmore"><button type="button" class="btn" data-lmore="1">Show ${fmt(Math.min(LOG_PAGE, t.offset))} earlier of ${plural(t.total, 'line')}</button></div>`;
  }
  html += t.lines.length ? t.lines.map(l => logLineHtml(l, '')).join('') : '<p class="empty">This log is empty.</p>';
  box.innerHTML = html;
  if (scrollDown || atBottom) box.scrollTop = box.scrollHeight;
}

function paneArgs() {
  const files = fileRows(), cur = S.files?.cdnVersion || cdnVersion();
  return { old: S.filesOld, err: !S.filesOld && S.errors.files && !S.files, loading: !S.filesOld && !S.errors.files && !S.files, none: S.files && !files.some(f => f.exists !== false),
    cur, cdnCur: files.filter(f => f.group === 'cdn' && f.version === cur), cap: files.find(f => f.group === 'app'), reps: exportFiles() };
}
function fileFailed(e) {
  if (e.changed) return;
  if (e.status === 422 && e.body) { Object.assign(S.file, { mtimeNs: e.body.mtimeNs ?? S.file.mtimeNs, bytes: e.body.bytes ?? S.file.bytes, mtime: e.body.mtime ?? S.file.mtime }); setTreeState('invalid', e.body); announce('This file is not valid JSON.'); }
  else if (e.status === 404) fileGone();
  else { setTreeState('error', e); onFetchError(e); }
  renderFiles();
}
function fileGone() {
  setTreeState('gone'); clearTree();
  announce(`${S.file?.name || 'The file'} is gone.`);
  loadFiles().then(renderFiles).catch(onFetchError);
}

/* ---------- the tree ---------- */
function makeGroup(li, path, level) {
  const ul = document.createElement('ul');
  ul.setAttribute('role', 'group'); ul.dataset.path = path; ul.dataset.level = String(level); ul._count = li._count;
  li.appendChild(ul);
  return ul;
}
function fillGroup(ul, r, level) {
  ul._count = r.count;
  const li = ul.closest('li'); if (li) li._count = r.count;
  (r.children || []).forEach((c, i) => insertRow(ul, makeRow(c, level, r.offset + i, ul.dataset.path)));
  rebuildMore(ul);
}
function makeRow(c, level, idx, parentPath) {
  const li = document.createElement('li');
  const path = parentPath + '/' + ptrEsc(c.key);
  const container = c.type === 'object' || c.type === 'array';
  li.setAttribute('role', 'treeitem'); li.setAttribute('aria-level', String(level)); li.setAttribute('aria-posinset', String(idx + 1));
  li.dataset.path = path; li.style.setProperty('--lvl', String(level)); li.tabIndex = -1;
  li._idx = idx; li._key = c.key; li._isIdx = typeof c.key === 'number'; li._type = c.type; li._count = c.count ?? 0; li._cut = !!c.cut;
  if (container) li.setAttribute('aria-expanded', 'false');
  li.innerHTML = rowHtml(c, container);
  if (container && c.children) {
    const ul = makeGroup(li, path, level + 1);
    fillGroup(ul, { children: c.children, offset: 0, count: c.count }, level + 1);
    li.setAttribute('aria-expanded', 'true'); li._openedAt = ++treeTick; setCaret(li, 'down');
  }
  return li;
}
function rowHtml(c, container) {
  const caret = `<span class="caret" aria-hidden="true">${container ? CARET('right') : ''}</span>`;
  const key = `<span class="k${typeof c.key === 'number' ? ' idx' : ''}">${esc(c.key)}</span><span class="colon">:</span>`;
  let val;
  if (container) {
    const n = c.count || 0;
    const sum = n === 0 ? (c.type === 'object' ? 'empty object' : 'empty array') : c.type === 'object' ? plural(n, 'key') : plural(n, 'entry', 'entries');
    val = `<span class="small dim sum">${sum}${c.preview ? ` · ${esc(c.preview)}${n > 3 ? '…' : ''}` : ''}</span>`;
  } else if (c.type === 'string') {
    const long = String(c.value).length > 40 ? ' long' : '';
    if (c.cut) val = `<span class="v${long}">${esc(JSON.stringify(c.value).slice(0, -1))} <button type="button" class="linkbtn" data-showall="1" tabindex="-1">… ${fmt(c.len)} chars, show all</button></span>`;
    else val = `<span class="v${long}">${esc(JSON.stringify(c.value))}</span>`;
    if (TIME_KEYS.has(c.key) || UTC_RE.test(c.value)) { const t = parseUtc(c.value); if (t) val += ` <span class="small dim">· ${dateTime(t)} local</span>`; }
  } else if (c.type === 'number') val = `<span class="v">${esc(String(c.value))}</span>`;
  else val = `<span class="v lit">${c.type === 'null' ? 'null' : String(!!c.value)}</span>`;
  const link = c.link ? `<button type="button" class="linkbtn jlink" tabindex="-1" data-link-to="${esc(c.link.to)}" data-link-path="${esc(c.link.path)}">${esc(c.link.label)}</button>` : '';
  const tip = container && c.key === 'Skills' ? ' title="skills.json isn\'t cached yet"' : container && c.key === 'RecipeCompletions' ? ' title="recipes.json isn\'t cached yet"' : '';
  return `<div class="jrow"${tip}>${caret}${key}${val}${link}</div>`;
}
function setCaret(li, dir) { const c = li.querySelector(':scope > .jrow > .caret'); if (c) c.innerHTML = CARET(dir); }
function insertRow(ul, li) {
  const rows = [...ul.children].filter(l => l.getAttribute('role') === 'treeitem');
  const next = rows.find(l => l._idx > li._idx);
  if (rows.some(l => l._idx === li._idx)) return;
  ul.insertBefore(li, next || null);
}
// "Show 200 more" buttons sit wherever loaded pages leave a gap, and after the last loaded row (aria-setsize = the server count).
function rebuildMore(ul) {
  ul.querySelectorAll(':scope > li.more').forEach(x => x.remove());
  const rows = [...ul.children].filter(l => l.getAttribute('role') === 'treeitem');
  const count = ul._count || 0;
  rows.forEach(r => r.setAttribute('aria-setsize', String(count)));
  const mk = (offset, n) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none'); li.className = 'more';
    li.innerHTML = `<div class="jrow" style="--lvl:${ul.dataset.level}"><span class="caret" aria-hidden="true"></span><button type="button" class="btn" data-more="1" tabindex="-1" data-offset="${offset}" data-limit="${Math.min(n, TREE_PAGE)}">Show ${fmt(Math.min(n, TREE_PAGE))} more of ${fmt(count)}</button></div>`;
    return li;
  };
  let expect = 0;
  for (const r of rows) { if (r._idx > expect) ul.insertBefore(mk(expect, r._idx - expect), r); expect = r._idx + 1; }
  if (expect < count) ul.appendChild(mk(expect, count - expect));
}
async function loadPage(ul, offset, limit, opts = {}) {
  const li = ul.closest('li[role=treeitem]');
  const level = +ul.dataset.level, count = ul._count || 0;
  if (li) li.setAttribute('aria-busy', 'true');
  const ld = document.createElement('li');
  ld.setAttribute('role', 'none'); ld.className = 'tload';
  ld.innerHTML = `<div class="jrow" style="--lvl:${level}"><span class="caret" aria-hidden="true"></span><span class="loading-bar"></span><span class="sr">Loading ${fmt(Math.min(limit, count || limit))} of ${fmt(count)} entries</span></div>`;
  const anchor = [...ul.children].find(l => l.getAttribute('role') === 'treeitem' && l._idx > offset) || null;
  ul.insertBefore(ld, anchor);
  try {
    const r = await fileApi('node', { path: ul.dataset.path, offset, limit });
    ld.remove();
    if (!ul.isConnected) return;
    fillGroup(ul, r, level);
    pruneRows(ul);
    return r;
  } catch (e) {
    ld.remove();
    if (e.changed) { if (li) collapseNode(li); return null; } // nothing opens until Reload
    if (e.status === 404 && /not found/.test(e.message)) { fileGone(); renderFiles(); return null; }
    const er = document.createElement('li');
    er.setAttribute('role', 'none'); er.className = 'terr';
    er.innerHTML = `<div class="jrow" style="--lvl:${level}"><span class="caret" aria-hidden="true"></span><span class="txt-bad">Couldn't load. Try again.</span><button type="button" class="btn" data-eretry="1" tabindex="-1" data-offset="${offset}" data-limit="${limit}">Retry</button></div>`;
    ul.insertBefore(er, anchor);
    if (isNetworkError(e)) onFetchError(e);
    if (!opts.quiet) announce("Couldn't load this part of the file.");
    return null;
  } finally { if (li) li.removeAttribute('aria-busy'); }
}
async function expandNode(li, opts = {}) {
  if (!li || !li.hasAttribute('aria-expanded') || fUI.changed) return; // after a 409 nothing opens until Reload
  if (li.getAttribute('aria-expanded') === 'true') return;
  li.setAttribute('aria-expanded', 'true'); li._openedAt = ++treeTick; setCaret(li, 'down');
  let ul = li.querySelector(':scope > ul');
  if (ul) { ul.hidden = false; return; }
  ul = makeGroup(li, li.dataset.path, +li.getAttribute('aria-level') + 1);
  if (!opts.noLoad) await loadPage(ul, 0, TREE_PAGE);
}
function collapseNode(li) {
  if (!li || li.getAttribute('aria-expanded') !== 'true') return;
  li.setAttribute('aria-expanded', 'false'); setCaret(li, 'right');
  const ul = li.querySelector(':scope > ul');
  if (ul) ul.hidden = true;
}
function treeRows() { return $$('li[role=treeitem]', $('#f-tree')); }
function visibleRows() { return treeRows().filter(l => !l.parentElement.closest('ul[hidden]')); }
// Rows plus the "Show more" and Retry buttons between them, in document order, for Up / Down / Home / End.
function navRows() { return $$('li[role=treeitem], li.more button, li.terr button', $('#f-tree')).filter(l => !l.parentElement.closest('ul[hidden]')); }
function focusRow(li, scroll = false) {
  if (!li) return;
  treeRows().forEach(l => { if (l.tabIndex === 0) l.tabIndex = -1; });
  li.tabIndex = 0;
  li.focus({ preventScroll: !scroll });
  updatePathBar(li);
}
// Over the row budget: drop the groups of the least recently opened containers, collapsed ones first, then open ones
// (collapsed as they go); never the group being filled or the focused row's ancestors. Pruned groups refetch on expand.
function pruneRows(keep) {
  const tree = $('#f-tree');
  let n = tree.querySelectorAll('li[role=treeitem]').length;
  if (n <= TREE_ROW_BUDGET) return;
  const focus = focusedRow();
  const spared = l => (keep && l.contains(keep)) || (focus && l.contains(focus));
  const cands = $$('li[aria-expanded]', tree).filter(l => l.querySelector(':scope > ul') && !spared(l))
    .sort((a, b) => (a.getAttribute('aria-expanded') === 'true') - (b.getAttribute('aria-expanded') === 'true') || (a._openedAt || 0) - (b._openedAt || 0));
  for (const l of cands) {
    if (n <= TREE_ROW_BUDGET) break;
    if (!l.isConnected) continue; // inside a subtree already dropped
    const ul = l.querySelector(':scope > ul');
    if (!ul) continue;
    n -= ul.querySelectorAll('li[role=treeitem]').length;
    if (l.getAttribute('aria-expanded') === 'true') collapseNode(l);
    ul.remove();
  }
}
// "*": open every closed sibling, a few requests at a time, stopping at the row budget.
async function expandSiblings(li) {
  const sibs = [...li.parentElement.children].filter(l => l.getAttribute('role') === 'treeitem' && l.getAttribute('aria-expanded') === 'false');
  let cut = false;
  for (let i = 0; i < sibs.length; i += 6) {
    if ($('#f-tree').querySelectorAll('li[role=treeitem]').length >= TREE_ROW_BUDGET) { cut = true; break; }
    await Promise.all(sibs.slice(i, i + 6).map(l => expandNode(l)));
  }
  if (cut) { fUI.note = `Showing ${fmt(TREE_ROW_BUDGET)} rows of ${fmt((S.file?.total || 1) - 1)} entries. Open the rest by hand or search.`; renderContents(); announce(fUI.note); }
}
/* Open every ancestor of a pointer, paging each to the slice that holds the next segment (pos from the server), then focus the row. */
async function revealPath(pointer, pos, opts = {}) {
  const parts = ptrParts(pointer);
  if (!parts.length) return null;
  if (!pos) {
    try { pos = (await fileApi('node', { path: pointer, locate: 1, limit: 1 })).pos; }
    catch (e) { if (e.status === 404 && !e.changed) sysLine('warn', `No entry ${pointer} in ${S.file.name}.`); return null; }
  }
  let ul = $('#f-tree'), path = '', li = null;
  for (let i = 0; i < parts.length; i++) {
    path += '/' + ptrEsc(parts[i]);
    let row = ul.querySelector(`:scope > li[data-path="${attrq(path)}"]`);
    if (!row) {
      const p = pos?.[i] ?? 0;
      const offset = Math.floor(p / TREE_PAGE) * TREE_PAGE;
      const r = await loadPage(ul, offset, TREE_PAGE, { quiet: true });
      if (!r) return null;
      row = ul.querySelector(`:scope > li[data-path="${attrq(path)}"]`);
      if (!row) return null;
    }
    if (i < parts.length - 1) {
      if (!row.hasAttribute('aria-expanded')) return null;
      await expandNode(row, { noLoad: true });
      ul = row.querySelector(':scope > ul');
      if (!ul) return null;
    }
    li = row;
  }
  if (li) {
    if (opts.focus !== false) focusRow(li, true); else updatePathBar(li);
    li.scrollIntoView({ block: 'center' });
    if (opts.flash) { const r = li.firstElementChild; r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); }
  }
  return li;
}
async function expandAll() {
  if (!S.file || fUI.state !== 'tree' || fUI.changed) return;
  const btn = $('#f-expand'); btn.disabled = true;
  try {
    const r = await fileApi('node', { path: '', depth: 99, maxNodes: TREE_EXPAND_MAX, limit: TREE_PAGE });
    const tree = $('#f-tree');
    clearTree(); fillGroup(tree, r, 1);
    const rendered = tree.querySelectorAll('li[role=treeitem]').length;
    const total = (S.file.total || 1) - 1;
    fUI.note = rendered < total ? `Expanded ${fmt(rendered)} of ${fmt(total)} entries. Open the rest by hand or search.` : null;
    announce(fUI.note || `Expanded every entry of ${S.file.name}.`);
    const first = tree.querySelector('li[role=treeitem]');
    if (first) focusRow(first);
    renderContents();
  } catch (e) { if (!e.changed) { onFetchError(e); announce("Couldn't expand the file."); } }
  finally { btn.disabled = !S.file || fUI.state !== 'tree' || fUI.changed; }
}
function collapseAll() {
  const tree = $('#f-tree');
  $$(':scope > li[role=treeitem][aria-expanded="true"]', tree).forEach(collapseNode);
  fUI.note = null; renderContents();
  const first = tree.querySelector('li[role=treeitem]');
  if (first) focusRow(first);
}
/* Path bar: breadcrumbs for the focused row (the file name is the root crumb), then the three copies. */
function updatePathBar(li) {
  const chain = [];
  for (let l = li; l; l = l.parentElement?.closest('li[role=treeitem]')) chain.unshift(l);
  const crumbs = [`<button type="button" class="linkbtn crumb" data-crumb="">${esc(S.file?.name || '')}</button>`]
    .concat(chain.map((l, i) => `<span class="sep" aria-hidden="true">›</span><button type="button" class="linkbtn crumb" data-crumb="${esc(l.dataset.path)}"${i === chain.length - 1 ? ' aria-current="true"' : ''}>${esc(l._key)}</button>`));
  const ico = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
  const cps = [['path', 'Copy path', 'M5 3h6v10H5zM7 1h6v10'], ['value', 'Copy value', 'M3 3h10v10H3zM5 6h6M5 9h4'], ['link', 'Copy link to this entry', 'M6 10 10 6M4.5 8.5 3 10a2 2 0 0 0 3 3l1.5-1.5M9 4.5 10.5 3a2 2 0 0 1 3 3L12 7.5']]
    .map(([k, label, d]) => `<button type="button" class="linkbtn cp" data-copy="${k}" aria-label="${label}">${ico(d)}<span class="cp-label">${label.replace(' to this entry', '')}</span></button>`).join('');
  $('#f-path').html = crumbs.join('') + cps;
  const wrap = $('#f-pathwrap');
  wrap.classList.toggle('overflow', wrap.scrollWidth > wrap.clientWidth + 2);
  // Keep the current crumb in view by scrolling the strip itself, never the document (scrollIntoView would
  // pull the page down to the path bar wherever the Contents window sits below the fold).
  const cur = wrap.querySelector('.crumb[aria-current]');
  if (cur) {
    const w = wrap.getBoundingClientRect(), c = cur.getBoundingClientRect();
    const left = c.left - w.left + wrap.scrollLeft, right = left + c.width + 16;
    if (right > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = Math.max(0, right - wrap.clientWidth);
    else if (left - 16 < wrap.scrollLeft) wrap.scrollLeft = Math.max(0, left - 16);
  }
}
function focusedRow() { return $('#f-tree').querySelector('li[role=treeitem][tabindex="0"]'); }
function dotPath(li) {
  const parts = [];
  for (let l = li; l; l = l.parentElement?.closest('li[role=treeitem]')) parts.unshift(l);
  return parts.map((l, i) => l._isIdx ? `[${l._key}]` : /^[A-Za-z_$][\w$]*$/.test(l._key) ? (i ? '.' : '') + l._key : `[${JSON.stringify(l._key)}]`).join('');
}
async function copyText(text, what) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { }
  if (!ok) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
    } catch { ok = false; }
  }
  if (ok) sysLine('status', `Copied ${what}.`);
  else { sysLine('error', "Couldn't copy. Select the text and copy it instead."); $('#f-pathwrap').classList.add('selectable'); }
  return ok;
}
async function copyFrom(kind, btn) {
  const li = focusedRow();
  if (!li || !S.file) return;
  if (kind === 'path') return copyText(dotPath(li), dotPath(li));
  if (kind === 'link') return copyText(`${location.origin}${location.pathname}#files?f=${encodeURIComponent(S.file.id)}&p=${encodeURIComponent(li.dataset.path)}`, `the link to ${dotPath(li)}`);
  if (fUI.changed) return;
  try {
    const qs = new URLSearchParams({ id: S.file.id, path: li.dataset.path, mtime: String(S.file.mtimeNs) });
    const r = await fetch(`/api/file/raw?${qs}`);
    if (r.status === 413) {
      const b = await r.json().catch(() => ({}));
      btn.disabled = true; btn.title = `Too big to copy: ${fmtBytes(b.bytes)}. Open raw instead.`;
      sysLine('warn', `Too big to copy: ${fmtBytes(b.bytes)}. Open raw instead.`);
      return;
    }
    if (r.status === 409) { const b = await r.json().catch(() => ({})); fileChanged(b.mtime); return; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    await copyText(text, `the value of ${dotPath(li)}`);
  } catch (e) { onFetchError(e); sysLine('error', "Couldn't copy. The server didn't answer; try again."); }
}

/* ---------- search within the file ---------- */
function onSearchInput() {
  clearTimeout(fUI.qTimer);
  fUI.q = $('#fileq').value;
  fUI.qTimer = setTimeout(runSearch, 300);
}
async function runSearch() {
  const q = fUI.q.trim();
  const note = $('#f-qnote');
  if (!S.file || (fUI.state !== 'tree' && fUI.state !== 'log') || fUI.changed) return;
  if (fUI.state === 'log') {
    if (!q) { if (fUI.log?.hits) { fUI.log.hits = null; renderLog(true); } note.hidden = true; return; }
    if (q.length < 2) { note.hidden = false; note.textContent = 'Type at least 2 characters.'; return; }
    note.hidden = true;
    try {
      const r = await fileApi('lines', { q, limit: LOG_PAGE }, { mtime: false });
      if (!fUI.log || r.q !== fUI.q.trim()) return;
      fUI.log.hits = { q: r.q, lines: r.lines, matches: r.matches, capped: r.capped };
      renderLog(false);
    } catch (e) { if (fUI.log) { fUI.log.hits = null; $('#f-logbox').innerHTML = blockError('the search', null).replace('data-retry="1"', 'data-fsearch="1"'); announce("Couldn't search."); } }
    return;
  }
  if (!q) { fUI.results = null; note.hidden = true; renderResults(); return; }
  if (q.length < 2) { fUI.results = null; note.hidden = false; note.textContent = 'Type at least 2 characters.'; renderResults(); return; }
  note.hidden = true;
  try {
    const r = await fileApi('search', { q, limit: TREE_PAGE });
    if (r.q !== fUI.q.trim()) return;
    fUI.results = r;
  } catch (e) { if (e.changed) return; fUI.results = { error: e, q }; }
  renderResults();
}
function renderResults() {
  const box = $('#f-results');
  const r = fUI.results;
  if (!r) { box.hidden = true; box.html = ''; return; }
  box.hidden = false;
  if (r.error) { box.html = blockError('the search', null).replace('data-retry="1"', 'data-fsearch="1"'); announce("Couldn't search."); return; }
  const q = r.q;
  if (!r.hits.length) {
    box.html = `<p class="empty">No "${esc(q)}" in this file. Keys and text values are searched; numbers by their digits.</p>`;
    announce(`No "${q}" in this file.`); return;
  }
  const mark = s => { const i = String(s).toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(s) : `${esc(s.slice(0, i))}<b>${esc(s.slice(i, i + q.length))}</b>${esc(s.slice(i + q.length))}`; };
  const crumbs = p => ptrParts(p).map(esc).join(' › ');
  let head = `${plural(r.total, 'match', 'matches')} for "${esc(q)}"`;
  let cap = '';
  if (r.partial) cap = `Took too long; here are the first ${fmt(r.hits.length)}.`;
  else if (r.hits.length < r.total || r.capped) cap = r.total > r.hits.length ? `Showing the first ${fmt(r.hits.length)} of ${fmt(r.total)}${r.capped ? '+' : ''} matches. Narrow the search.` : `${fmt(r.hits.length)}+ matches; narrow the search.`;
  const rows = r.hits.map((h, i) => `<tr class="row hit" data-hit="${i}" tabindex="0"><td><span class="small dim">${crumbs(h.path)}</span></td><td><span class="small dim">${h.where}</span> · ${mark(h.snippet)}</td></tr>`).join('');
  box.html = `<div class="rhead"><span class="small dim">${head}</span><button type="button" class="linkbtn" data-fclear="1" style="text-decoration:underline">Clear</button></div>
    ${cap ? `<p class="small dim" style="margin:0 0 4px">${esc(cap)}</p>` : ''}
    <div class="scrollbox" style="max-height:40vh"><table class="tbl"><thead><tr><th>Path</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  announce(head + (cap ? '. ' + cap : ''));
}
async function pickHit(i) {
  const h = fUI.results?.hits?.[i];
  if (!h) return;
  fUI.results = null; renderResults();
  $('#fileq').value = ''; fUI.q = '';
  await revealPath(h.path, h.pos, { flash: true, focus: true });
}

/* ---------- Check again on Files ---------- */
function filesChecked(before) {
  const after = filesSnapshot();
  const n = fileRows().filter(f => f.exists !== false).length;
  const nw = exportFiles().filter(f => f.valid && !f.partial).sort((a, b) => (parseIso(b.at) || 0) - (parseIso(a.at) || 0))[0];
  const at = nw ? parseIso(nw.at) : null;
  if (S.filesOld) { sysLine('warn', 'Files need a newer server.py.'); return; }
  if (after !== before) { sysLine('status', `${plural(n, 'file')} listed.${nw ? ` Newest export: ${nw.name}, ${at ? (isToday(at) ? hhmm(at) : dateTime(at)) : '?'}.` : ''}`); flashView(); return; }
  const worst = worstExportSource();
  const since = at ? (isToday(at) ? hhmm(at) : dateTime(at)) : '?';
  if (worst && (worst.severity === 'warn' || worst.severity === 'bad') && worst.fixKey) sysLine('warn', `Nothing new since ${since}. ${checkFix(worst)}, then check again.`);
  else sysLine('note', `Nothing new since ${since}. Your exports are recent.`);
}
// The "In game:" prefix only while logged in; logged out, fixText() already opens with "Next time you're in game:".
const checkFix = v => loggedIn() ? `In game: ${fixText(v.fixKey, v.fixArgs || {}, { short: true })}` : fixText(v.fixKey, v.fixArgs || {});

/* ---------- events ---------- */
function initFiles() {
  const view = $('#v-files');
  view.addEventListener('click', async e => {
    const t = e.target;
    const fold = t.closest('[data-fold]');
    if (fold && fold.closest('#f-list')) { const id = fold.dataset.fold; fUI.folds[id] = !fUI.folds[id]; renderFilePane(paneArgs()); $(`#f-list [data-fold="${CSS.escape(id)}"]`)?.focus(); return; }
    if (t.closest('[data-fmore]')) { fUI.showOld = !fUI.showOld; renderFilePane(paneArgs()); $('#f-list [data-fmore]')?.focus(); return; }
    if (t.closest('[data-lmoreold]')) { fUI.showOldLogs = !fUI.showOldLogs; renderFilePane(paneArgs()); $('#f-list [data-lmoreold]')?.focus(); return; }
    if (t.closest('[data-lmore]')) { loadEarlier(); return; }
    const frow = t.closest('tr[data-frow]');
    if (frow && !t.closest('button')) {
      const a = frow.querySelector('a.fopen');
      if (!a) return;
      e.preventDefault();
      const h = a.getAttribute('href').slice(1), id = route(h).params.get('f');
      // The open row's hash is already set, so a second click re-reads the file instead of doing nothing.
      if (S.file && S.file.id === id && route(location.hash.slice(1)).params.get('f') === id) openFile(id, '', { focus: true });
      else location.hash = h;
      return;
    }
    if (t.closest('#w-f-view [data-retry]')) { e.stopPropagation(); if (S.file) openFile(S.file.id, '', { focus: true }); return; }
    if (t.closest('[data-fretry]')) { if (S.file) openFile(S.file.id, '', { focus: true }); return; }
    if (t.closest('[data-freload]')) { if (S.file) { const p = focusedRow()?.dataset.path || ''; openFile(S.file.id, p, { focus: true }); } return; }
    const nw = t.closest('[data-fnewest]');
    if (nw) { location.hash = `files?f=${encodeURIComponent(nw.dataset.fnewest)}`; return; }
    if (t.closest('[data-fclear]')) {
      $('#fileq').value = ''; fUI.q = ''; $('#f-qnote').hidden = true;
      if (fUI.state === 'log') { if (fUI.log) fUI.log.hits = null; renderLog(true); $('#fileq').focus(); return; }
      fUI.results = null; renderResults(); focusRow(focusedRow() || $('#f-tree li[role=treeitem]')); return;
    }
    if (t.closest('[data-fsearch]')) { runSearch(); return; }
    const hit = t.closest('[data-hit]');
    if (hit) { pickHit(+hit.dataset.hit); return; }
    const crumb = t.closest('[data-crumb]');
    if (crumb) { const p = crumb.dataset.crumb; const li = p ? $('#f-tree').querySelector(`li[data-path="${attrq(p)}"]`) : $('#f-tree li[role=treeitem]'); if (li) focusRow(li, true); return; }
    const cp = t.closest('[data-copy]');
    if (cp) { copyFrom(cp.dataset.copy, cp); return; }
    if (t.closest('#f-expand')) { expandAll(); return; }
    if (t.closest('#f-collapse')) { collapseAll(); return; }
    // tree
    const tree = $('#f-tree');
    if (!tree.contains(t)) return;
    const more = t.closest('[data-more], [data-eretry]');
    if (more) {
      const ul = more.closest('ul');
      const holder = more.closest('li');
      const offset = +more.dataset.offset, limit = +more.dataset.limit;
      holder.remove();
      await loadPage(ul, offset, limit);
      const first = ul.querySelector(`li[role=treeitem]`) && [...ul.children].find(l => l.getAttribute('role') === 'treeitem' && l._idx === offset);
      if (first) focusRow(first); else { const nb = ul.querySelector('[data-more]'); if (nb) nb.focus(); }
      return;
    }
    const sa = t.closest('[data-showall]');
    if (sa) {
      const li = sa.closest('li[role=treeitem]');
      try {
        const r = await fileApi('node', { path: li.dataset.path });
        const v = li.querySelector(':scope > .jrow > .v');
        if (v) { v.textContent = JSON.stringify(r.value); v.classList.add('long'); li._cut = false; }
        focusRow(li);
      } catch (err) { if (!err.changed) { onFetchError(err); announce("Couldn't load the whole value."); } }
      return;
    }
    const jl = t.closest('.jlink');
    if (jl) {
      const to = jl.dataset.linkTo, path = jl.dataset.linkPath;
      const parts = ptrParts(path);
      sysLine('status', `Opened ${parts[parts.length - 1] ?? path} in ${to.split('/').pop()}.`);
      location.hash = `files?f=${encodeURIComponent(to)}&p=${encodeURIComponent(path)}`;
      return;
    }
    const li = t.closest('li[role=treeitem]');
    if (!li || t.closest('button, a')) return;
    if (li.hasAttribute('aria-expanded')) { if (li.getAttribute('aria-expanded') === 'true') collapseNode(li); else expandNode(li); }
    focusRow(li);
  });
  $('#f-tree').addEventListener('keydown', e => {
    const k = e.key;
    // Up / Down / Home / End walk rows and the "Show more" / Retry rows alike (those are tabindex -1, so the
    // tree keeps its one tab stop); a virtual row answers only the four movement keys.
    const go = l => { if (l) { e.preventDefault(); if (l.matches('li[role=treeitem]')) focusRow(l, true); else l.focus(); } };
    const vb = e.target.closest('li.more button, li.terr button');
    const li = vb ? null : e.target.closest('li[role=treeitem]');
    if (!li && !vb) return;
    const rows = navRows(), i = rows.indexOf(vb || li);
    if (k === 'ArrowDown') return go(rows[i + 1]);
    if (k === 'ArrowUp') return go(rows[i - 1]);
    if (k === 'Home') return go(rows[0]);
    if (k === 'End') return go(rows[rows.length - 1]);
    if (vb) return;
    if (k === 'ArrowRight') {
      e.preventDefault();
      if (!li.hasAttribute('aria-expanded')) return;
      if (li.getAttribute('aria-expanded') === 'false') return void expandNode(li);
      return go(li.querySelector(':scope > ul > li[role=treeitem]'));
    }
    if (k === 'ArrowLeft') {
      e.preventDefault();
      if (li.getAttribute('aria-expanded') === 'true') return collapseNode(li);
      return go(li.parentElement.closest('li[role=treeitem]'));
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      if (li.getAttribute('aria-expanded') === 'true') collapseNode(li); else if (li.hasAttribute('aria-expanded')) expandNode(li);
      else { const b = li.querySelector(':scope > .jrow .jlink, :scope > .jrow [data-showall]'); if (b) b.click(); } // a scalar row: follow its link or show the whole value
      return;
    }
    if (k === '*') { e.preventDefault(); expandSiblings(li); return; }
    if (k === 'Escape') { e.preventDefault(); $('#fileq').focus(); return; }
    if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && k !== ' ') {
      const sibs = [...li.parentElement.children].filter(l => l.getAttribute('role') === 'treeitem');
      const j = sibs.indexOf(li);
      const ch = k.toLowerCase();
      for (let s = 1; s <= sibs.length; s++) { const c = sibs[(j + s) % sibs.length]; if (String(c._key).toLowerCase().startsWith(ch)) { e.preventDefault(); return focusRow(c, true); } }
    }
  });
  $('#f-tree').addEventListener('focusin', e => { if (e.target.closest('li.more, li.terr')) return; const li = e.target.closest('li[role=treeitem]'); if (li && li.tabIndex !== 0) focusRow(li); });
  $('#f-results').addEventListener('keydown', e => { const h = e.target.closest('[data-hit]'); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickHit(+h.dataset.hit); } });
  $('#fileq').addEventListener('input', onSearchInput);
  $('#fileq').addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation(); $('#fileq').value = ''; fUI.q = ''; $('#f-qnote').hidden = true;
      if (fUI.state === 'log') { if (fUI.log) fUI.log.hits = null; renderLog(true); return; }
      fUI.results = null; renderResults(); focusRow(focusedRow() || $('#f-tree li[role=treeitem]'), true);
    }
    if (e.key === 'Enter' && fUI.results?.hits?.length) { e.preventDefault(); pickHit(0); }
  });
  window.addEventListener('resize', () => { if (S.view === 'files') { const li = focusedRow(); if (li) updatePathBar(li); } });
}

/* ===================== reminders ===================== */
/* Reminders: moments from /api/health delivered as system lines, toasts and browser notifications. */

const TOPICS = [
  { id: 'login-checklist', name: 'Login checklist', group: 'To do' },
  { id: 'zone-storage', name: 'Arrived where your vaults are', group: 'To do' },
  { id: 'after-selling', name: 'Left after selling', group: 'To do' },
  { id: 'export-stale', name: 'Storage changed since the export', group: 'To do' },
  { id: 'before-logout', name: 'Wrapping up', group: 'To do' },
  { id: 'broken-export', name: 'Export came out partial', group: 'Broken' },
  { id: 'export-confirmed', name: 'Export confirmed', group: 'To do', pageOnly: true },
  { id: 'storage-full', name: 'Storage nearly full', group: 'To do', pageOnly: true },
  { id: 'vendor-reset', name: 'Vendor reset', group: 'Good news', positive: true },
  { id: 'digest', name: 'Daily digest', group: 'Good news', positive: true },
];
const TOPIC_VIEW = { 'zone-storage': 'storage', 'after-selling': 'vendors', 'before-logout': 'storage', 'broken-export': 'character', 'vendor-reset': 'vendors', 'digest': 'vendors', 'login-checklist': 'session', 'storage-full': 'storage', 'export-confirmed': 'session', 'export-stale': 'storage' };
const COOLDOWN_MS = { 'zone-storage': 2 * 3600e3, 'after-selling': 3600e3, 'vendor-reset': 5 * 60e3, 'digest': 20 * 3600e3, 'export-stale': 2 * 3600e3 };

function remDefaults() {
  const topics = {};
  TOPICS.forEach(t => { topics[t.id] = { notify: !t.positive, snoozedUntil: null, muted: false }; });
  topics['server'] = { notify: true, snoozedUntil: null, muted: false };
  return { enabled: false, topics, quiet: { on: false, from: '23:00', to: '08:00' }, sound: false, lastFired: {}, deliveredMoments: {}, mutedAlts: [] };
}
function remGet() {
  const d = remDefaults();
  const s = store.json('pgdash.reminders.v1', null);
  if (!s || typeof s !== 'object') return d;
  return { ...d, ...s, topics: { ...d.topics, ...(s.topics || {}) }, quiet: { ...d.quiet, ...(s.quiet || {}) }, lastFired: s.lastFired || {}, deliveredMoments: s.deliveredMoments || {}, mutedAlts: s.mutedAlts || [] };
}
function remSave(r) {
  const cut = Date.now() - 6 * 3600e3;
  for (const k of Object.keys(r.deliveredMoments)) if (Date.parse(r.deliveredMoments[k]) < cut) delete r.deliveredMoments[k];
  store.set('pgdash.reminders.v1', r);
}
function topicState(id) { const r = remGet(); return r.topics[id] || { notify: true, snoozedUntil: null, muted: false }; }
function isSnoozed(topic) {
  const t = topicState(topic);
  return !!(t.snoozedUntil && Date.parse(t.snoozedUntil) > Date.now());
}
// A margin note's "Not now" snoozes the verdict's own key (collapses the plaque) and the reminder topics that export covers.
const NOTE_TOPICS = { 'storage-export': ['export-stale', 'zone-storage', 'before-logout'], 'character-export': ['after-selling'], 'partial-export': ['broken-export'] };
function snoozeNote(topic, hours = 4) { [topic, ...(NOTE_TOPICS[topic] || [])].forEach(t => snoozeTopic(t, hours)); }
function snoozeTopic(topic, hours = 4) {
  const r = remGet();
  r.topics[topic] = { ...(r.topics[topic] || { notify: true, muted: false }), snoozedUntil: new Date(Date.now() + hours * 3600e3).toISOString() };
  remSave(r);
}
function muteTopic(topic, on = true) {
  const r = remGet();
  r.topics[topic] = { ...(r.topics[topic] || { notify: true }), muted: on, snoozedUntil: on ? r.topics[topic]?.snoozedUntil : null };
  remSave(r);
}
function inQuiet(r) {
  if (!r.quiet.on) return false;
  const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
  const [fh, fm] = r.quiet.from.split(':').map(Number), [th, tm] = r.quiet.to.split(':').map(Number);
  const a = fh * 60 + fm, b = th * 60 + tm;
  return a <= b ? (m >= a && m < b) : (m >= a || m < b);
}
// The Mac app replaces window.Notification with a native shim (window.GORGON_NATIVE), which needs no secure context.
const notifSupport = () => 'Notification' in window && (window.isSecureContext || window.GORGON_NATIVE === true);
function permState() {
  if (!notifSupport()) return 'unsupported';
  const p = Notification.permission;
  if (p === 'denied') return 'denied';
  if (p === 'default') return 'default';
  return remGet().enabled ? 'on' : 'off';
}

/* ---------- system line ---------- */
let sysTimer = null;
function sysLine(kind, text, opts = {}) {
  const el = $('#sysline');
  clearTimeout(sysTimer);
  const lead = kind === 'status' ? '<span class="tagw">[Status]</span> ' : kind === 'error' ? `${shape('bad', 's13')} <span class="tagw">[Error]</span> ` : kind === 'warn' ? shape('warn', 's13') + ' ' : kind === 'note' ? shape('info', 's13') + ' ' : '';
  // "note" is also the margin's note component (a 16 px + 1fr grid in app.css), so the kind becomes "sys-note".
  el.className = `sysline ${kind === 'note' ? 'sys-note' : kind}`;
  let acts = '';
  if (opts.topic) acts = `<span class="acts"><button type="button" class="linkbtn" data-rem-snooze="${esc(opts.topic)}">Not now</button><button type="button" class="linkbtn" data-rem-mute="${esc(opts.topic)}">Don't remind me about this</button></span>`;
  if (opts.action) acts += `<span class="acts"><button type="button" class="linkbtn" data-sys-action="1">${esc(opts.action.label)}</button></span>`;
  el.innerHTML = `<span>${lead}${esc(text)}</span>${acts}`;
  el._action = opts.action?.run || null;
  el.dataset.view = opts.sticky ? S.view : '';
  if (!opts.sticky) sysTimer = setTimeout(() => { el.innerHTML = ''; el.className = 'sysline'; }, 30000);
}

/* ---------- toasts ---------- */
const toastQ = [];
let toastBurst = [];
function toast(t) {
  // t: {kind: 'status'|'bad'|'note', text, topic, action:{label, run}, broken}
  toastBurst.push(Date.now());
  toastBurst = toastBurst.filter(x => Date.now() - x < 1000);
  const box = $('#toasts');
  const visible = box.children.length;
  if (visible >= 3 && !t.broken) {
    const same = toastQ.find(q => q.topic && q.topic === t.topic);
    if (same) Object.assign(same, t); else toastQ.push(t);
    return;
  }
  const el = document.createElement('div');
  el.className = 'toast enter';
  el.setAttribute('role', 'status');
  const lead = t.kind === 'status' ? '<span class="tagw">[Status]</span> ' : '';
  el.innerHTML = `${t.kind === 'bad' ? shape('bad') : t.kind === 'note' ? shape('info') : ''}<div class="tb"><div>${lead}${esc(t.text)}</div><div class="tacts">${t.action ? `<button type="button" class="linkbtn" data-t-act>${esc(t.action.label)}</button>` : ''}<button type="button" class="linkbtn" data-t-close>Close</button></div></div>`;
  if (t.broken) box.appendChild(el); else box.insertBefore(el, box.querySelector('.toast.broken') || null);
  if (t.broken) el.classList.add('broken');
  requestAnimationFrame(() => el.classList.remove('enter'));
  let left = 6000, started = Date.now(), timer = null;
  const close = () => { clearTimeout(timer); el.remove(); const n = toastQ.shift(); if (n) toast(n); };
  const arm = () => { if (!t.broken) timer = setTimeout(close, left); };
  el.addEventListener('mouseenter', () => { clearTimeout(timer); left -= Date.now() - started; });
  el.addEventListener('mouseleave', () => { started = Date.now(); arm(); });
  el.querySelector('[data-t-close]').onclick = close;
  if (t.action) el.querySelector('[data-t-act]').onclick = () => { t.action.run(); close(); };
  el._close = close;
  arm();
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const last = $('#toasts').lastElementChild;
  if (last && !document.querySelector('.pop:not([hidden])')) last._close?.();
});

/* ---------- sound (broken only) ---------- */
function playCue() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[660, 0], [440, 0.18]].forEach(([f, t]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.16);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { }
}

/* ---------- delivery ---------- */
let firstHealthSeen = false;
function gameRunning() {
  const g = S.health?.game;
  if (!g) return !!(S.session?.live && loggedIn());
  if (g.running === null || g.running === undefined) return !!(g.loggedIn && S.session?.live);
  return g.running && g.loggedIn;
}
function deliverMoments() {
  if (!S.health || PREVIEW.active) return;
  const moments = S.health.moments || [];
  const r = remGet();
  if (!firstHealthSeen) {
    // Never on page load: mark everything present as delivered.
    moments.forEach(m => { r.deliveredMoments[m.id] = new Date().toISOString(); });
    firstHealthSeen = true;
    remSave(r);
    digestCheck();
    return;
  }
  for (const m of moments.slice().reverse()) {
    if (r.deliveredMoments[m.id]) continue;
    r.deliveredMoments[m.id] = new Date().toISOString();
    const t = r.topics[m.topic] || { notify: true };
    const positive = m.level === 'positive';
    const cdKey = m.topic + (m.args?.area ? ':' + m.args.area : m.args?.file ? ':' + m.args.file : '');
    const cd = COOLDOWN_MS[m.topic];
    const cooling = cd && r.lastFired[cdKey] && Date.now() - Date.parse(r.lastFired[cdKey]) < cd;
    const suppressed = t.muted || (t.snoozedUntil && Date.parse(t.snoozedUntil) > Date.now()) || cooling;
    if (m.topic === 'export-confirmed') { confirmExport(m); continue; }
    if (m.topic === 'storage-full') { toast({ kind: 'note', text: m.body, topic: m.topic }); continue; }
    if (suppressed) continue;
    if (!positive && !gameRunning() && m.level !== 'broken') continue;
    if (m.level === 'status') { sysLine('status', `${m.title}. ${m.body}`); continue; }
    r.lastFired[cdKey] = new Date().toISOString();
    const view = TOPIC_VIEW[m.topic];
    if (positive) toast({ kind: 'status', text: `${m.title}: ${m.body}`, topic: m.topic });
    else {
      sysLine(m.level === 'broken' ? 'error' : 'warn', `${m.title}. ${m.body}`, { topic: m.topic, sticky: true });
      if (view && view !== S.view) toast({ kind: m.level === 'broken' ? 'bad' : 'note', text: `${m.title}. ${m.body}`, topic: m.topic, broken: m.level === 'broken', action: { label: 'Show', run: () => go(view) } });
    }
    const quiet = inQuiet(r);
    const hidden = document.hidden || !document.hasFocus();
    if (r.enabled && t.notify !== false && !quiet && notifSupport() && Notification.permission === 'granted' && (hidden || m.level === 'broken')) {
      try {
        const n = new Notification(m.title, { body: m.body, tag: cdKey, icon: FAVICONS[m.level === 'broken' ? 'bad' : 'warn'], silent: true });
        n.onclick = () => { window.focus(); if (view) go(view); sysLine(m.level === 'broken' ? 'error' : 'warn', `${m.title}. ${m.body}`, { topic: m.topic, sticky: true }); n.close(); };
      } catch { }
    }
    if (m.level === 'broken' && r.sound && !quiet) playCue();
  }
  remSave(r);
}
function confirmExport(m) {
  const who = m.args?.character;
  if (who && S.character && who !== S.character) {
    toast({ kind: 'status', text: `Saved ${who}'s ${m.args.report.toLowerCase()} export.`, topic: 'export-confirmed', action: { label: `Switch to ${who}`, run: () => selectCharacter(who) } });
  }
}
/* Daily digest: first page load of a new calendar day, if any export is 1+ day old. */
function digestCheck() {
  const r = remGet();
  const t = r.topics['digest'];
  if (!t || !t.notify || t.muted) return;
  const today = new Date().toDateString();
  if (r.lastFired.digest && new Date(r.lastFired.digest).toDateString() === today) return;
  const ex = S.verdicts.filter(v => (v.source === 'character-export' || v.source === 'storage-export') && v.ageSec != null);
  if (!ex.some(v => v.ageSec >= 86400)) return;
  const parts = ex.map(v => `${v.title} ${ageWord(v.ageSec)} old`);
  r.lastFired.digest = new Date().toISOString();
  remSave(r);
  toast({ kind: 'status', text: `Your exports this morning: ${parts.join(' · ')}`, topic: 'digest' });
  if (r.enabled && notifSupport() && Notification.permission === 'granted' && !inQuiet(r)) try { new Notification('Your exports this morning', { body: parts.join(' · '), tag: 'digest', icon: FAVICONS.ok, silent: true }); } catch { }
}

/* ---------- Reminders panel ---------- */
function renderRemPanel() {
  const r = remGet();
  const p = permState();
  const here = window.GORGON_NATIVE === true ? 'in this app' : 'in this browser';
  const perm = {
    default: ["Reminders are off. They only fire while you're in game, and never more than once per topic per cooldown.", '<button type="button" class="btn primary" data-rem="ask">Remind Me!</button>'],
    on: [`<span style="color:var(--status)">[Status]</span> Reminders are on ${here}.`, '<button type="button" class="linkbtn" data-rem="off" style="text-decoration:underline">Turn them off</button>'],
    off: [`Reminders are off ${here}.`, '<button type="button" class="btn primary" data-rem="ask">Remind Me!</button>'],
    denied: [window.GORGON_NATIVE === true
      ? `Notifications are off for ${APP_NAME}. Turn them on in System Settings → Notifications → ${APP_NAME}, then quit and reopen ${APP_NAME}. The page still shows every note.`
      : 'This browser blocked reminders for this page. Allow notifications for 127.0.0.1 in the browser\'s site settings, then reload. The page still shows every note.', ''],
    unsupported: ["This browser can't show reminders here. They need the page at 127.0.0.1 or localhost. The page still shows every note.", ''],
  }[p];
  const groups = ['To do', 'Broken', 'Good news'];
  const topicRow = t => {
    const st = r.topics[t.id] || {};
    const snoozed = st.snoozedUntil && Date.parse(st.snoozedUntil) > Date.now();
    const state = st.muted ? `Muted · <button type="button" class="linkbtn" data-rem-unmute="${t.id}" style="text-decoration:underline">Undo</button>`
      : snoozed ? `Snoozed until ${hhmm(Date.parse(st.snoozedUntil))} · <button type="button" class="linkbtn" data-rem-unsnooze="${t.id}" style="text-decoration:underline">Undo</button>` : '';
    return `<div class="topic"><span class="tn">${esc(t.name)}</span>${t.pageOnly ? '<span class="tstate">In page only</span>' : `<span class="tstate"><label class="check"><input type="checkbox" data-rem-notify="${t.id}" ${st.notify !== false ? 'checked' : ''}> Notify</label></span>`}
      ${t.pageOnly || !(t.positive || state) ? '' : `<span class="tsub">${t.positive ? "Can fire while the game is closed. " : ''}${state}</span>`}</div>`;
  };
  const muted = TOPICS.filter(t => r.topics[t.id]?.muted);
  $('#rempanel').innerHTML = `<header class="win-bar"><h2 id="rem-title">Reminders</h2><div class="tools"><button type="button" class="linkbtn" data-rem="close">Close</button></div></header>
    <section><p>${perm[0]}</p>${perm[1] ? `<div class="row-inline">${perm[1]}</div>` : ''}</section>
    ${groups.map(g => `<section><h3>${g}</h3>${TOPICS.filter(t => t.group === g).map(topicRow).join('')}</section>`).join('')}
    <section><h3>Quiet hours</h3><label class="check"><input type="checkbox" data-rem="quiet" ${r.quiet.on ? 'checked' : ''}> Quiet hours</label>
      <div class="row-inline"><label class="small dim" for="qfrom">from</label><input type="time" id="qfrom" value="${esc(r.quiet.from)}" ${r.quiet.on ? '' : 'disabled'}><label class="small dim" for="qto">to</label><input type="time" id="qto" value="${esc(r.quiet.to)}" ${r.quiet.on ? '' : 'disabled'}></div>
      <p class="small dim" style="margin-top:6px">No notifications or sound then; the page still updates.</p></section>
    <section><h3>Sound</h3><label class="check"><input type="checkbox" data-rem="sound" ${r.sound ? 'checked' : ''}> Play a sound when data breaks</label></section>
    ${muted.length ? `<section><h3>Muted</h3>${muted.map(t => `<div class="topic"><span class="tn">${esc(t.name)}</span><span class="tstate"><button type="button" class="linkbtn" data-rem-unmute="${t.id}" style="text-decoration:underline">Undo</button></span></div>`).join('')}</section>` : ''}
    <footer class="win-foot"><span class="fl">Settings live ${here} only.</span><span class="fr"></span></footer>`;
  $('#remdot').hidden = p !== 'on';
}
let popOpener = null;
function openPop(id, opener) {
  closePops();
  const pop = $('#' + id);
  if (id === 'rempanel') renderRemPanel(); else renderAbout();
  pop.hidden = false;
  popOpener = opener || null;
  // On a phone the pop is a full-screen sheet: make it modal so focus can't wander under it.
  if (PHONE_MQ.matches) {
    pop.setAttribute('aria-modal', 'true');
    ['body > a.sr', '#shell', '.rail', '#main', '#banner-down', '#toasts'].forEach(sel => $(sel)?.setAttribute('inert', ''));
  } else pop.removeAttribute('aria-modal');
  opener?.setAttribute('aria-expanded', 'true');
  const r = opener?.getBoundingClientRect();
  if (r && window.innerWidth >= 768) {
    if (id === 'aboutpop') { pop.style.left = Math.max(16, r.left - 360 - 8) + 'px'; pop.style.top = Math.max(16, r.bottom - 300) + 'px'; }
    else { pop.style.left = Math.max(16, Math.min(window.innerWidth - 376, r.right - 360)) + 'px'; pop.style.top = (r.bottom + 6) + 'px'; }
  }
  pop.querySelector('button, input, a')?.focus();
}
function closePops() {
  $$('.pop').forEach(p => { if (!p.hidden) { p.hidden = true; } p.removeAttribute('aria-modal'); });
  ['body > a.sr', '#shell', '.rail', '#main', '#banner-down', '#toasts'].forEach(sel => $(sel)?.removeAttribute('inert'));
  if (popOpener) { popOpener.setAttribute('aria-expanded', 'false'); popOpener.focus(); popOpener = null; }
}
function renderAbout() {
  const ver = S.health?.cdnVersion || 'unknown';
  const plog = S.health ? (S.verdicts.find(v => v.source === 'player-log')?.severity === 'ok' ? 'Player.log: live inventory events found' : 'Player.log: no live inventory events on Mac') : 'Player.log: unknown';
  $('#aboutpop').innerHTML = `<header class="win-bar"><h2 id="about-title">${esc(APP_NAME)}</h2><div class="tools"><button type="button" class="linkbtn" data-rem="close">Close</button></div></header>
    <section><p>${esc(APP_NAME)} is ${esc(FAN_LINE)}. It reads the files the game already writes on this Mac.</p></section>
    <section><h3>Where the data comes from</h3><ul>
      <li>VIP exports in Reports/ (Character and Storage JSON) · <a href="#files" data-rem="close">Inspect the files</a></li>
      <li>Chat logs in ChatLogs/ (Settings → GUI → Log All Chat)</li>
      <li>Game data from cdn.projectgorgon.com, version ${esc(ver)}</li>
      <li>GorgonSettings.txt for logging settings</li>
      <li>${esc(plog)}</li></ul></section>
    <section class="about-theme"><h3>Theme</h3><div class="seg" role="radiogroup" aria-label="Theme" data-themectl>
      <button type="button" role="radio" data-v="auto">Auto</button><button type="button" role="radio" data-v="dark">Dark</button><button type="button" role="radio" data-v="daylight">Daylight</button></div></section>
    <footer class="win-foot"><span class="fl">Item art from the game's public CDN.</span><span class="fr"></span></footer>`;
  syncTheme();
}

function initReminders() {
  $('#remindbtn').addEventListener('click', e => { $('#rempanel').hidden ? openPop('rempanel', e.currentTarget) : closePops(); });
  $('#mremind').addEventListener('click', () => openPop('rempanel', $('#remindbtn')));
  $('#aboutbtn').addEventListener('click', e => { $('#aboutpop').hidden ? openPop('aboutpop', e.currentTarget) : closePops(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.pop:not([hidden])')) { e.stopPropagation(); closePops(); } }, true);
  // Phone sheet is modal: Tab wraps from the last control to the first (and back) without passing through <body>.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const pop = document.querySelector('.pop[aria-modal="true"]:not([hidden])');
    if (!pop) return;
    const f = $$('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])', pop).filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || !pop.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !pop.contains(a))) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('mousedown', e => {
    if (!document.querySelector('.pop:not([hidden])')) return;
    if (e.target.closest('.pop, #remindbtn, #aboutbtn, #mremind')) return;
    closePops();
  });
  $('#rempanel').addEventListener('click', async e => {
    const b = e.target.closest('[data-rem], [data-rem-unmute], [data-rem-unsnooze]');
    if (!b) return;
    const r = remGet();
    if (b.dataset.rem === 'close') return closePops();
    if (b.dataset.rem === 'ask') {
      if (PREVIEW.active) { sysLine('warn', 'Preview mode: reminders are not turned on.'); return; }
      try { const p = await Notification.requestPermission(); if (p === 'granted') { r.enabled = true; remSave(r); } } catch { }
    }
    if (b.dataset.rem === 'off') { r.enabled = false; remSave(r); }
    if (b.dataset.remUnmute) { r.topics[b.dataset.remUnmute].muted = false; remSave(r); }
    if (b.dataset.remUnsnooze) { r.topics[b.dataset.remUnsnooze].snoozedUntil = null; remSave(r); renderMargin(); }
    if (b.dataset.rem === 'quiet' || b.dataset.rem === 'sound') return;
    renderRemPanel();
    $('#rempanel').querySelector('button, input')?.focus();
  });
  $('#rempanel').addEventListener('change', e => {
    const r = remGet(), t = e.target;
    if (t.dataset.remNotify) r.topics[t.dataset.remNotify].notify = t.checked;
    if (t.dataset.rem === 'quiet') { r.quiet.on = t.checked; }
    if (t.dataset.rem === 'sound') r.sound = t.checked;
    if (t.id === 'qfrom' && t.value) r.quiet.from = t.value;
    if (t.id === 'qto' && t.value) r.quiet.to = t.value;
    remSave(r);
    if (t.dataset.rem === 'quiet') { renderRemPanel(); $('#rempanel [data-rem="quiet"]')?.focus(); }
  });
  $('#aboutpop').addEventListener('click', e => { if (e.target.closest('[data-rem="close"]')) closePops(); });
  // Reminder line buttons (system line).
  $('#sysline').addEventListener('click', e => {
    const s = e.target.closest('[data-rem-snooze]'), m = e.target.closest('[data-rem-mute]');
    if (s) { snoozeTopic(s.dataset.remSnooze); sysLine('note', 'Snoozed for 4 hours. The page still shows the note.'); renderMargin(); }
    if (m) { muteTopic(m.dataset.remMute); sysLine('note', "Muted. Undo it in Reminders. The page still shows the note."); }
    if (e.target.closest('[data-sys-action]')) $('#sysline')._action?.();
  });
  $('#remdot').hidden = permState() !== 'on';
}

/* ===================== main ===================== */
/* Boot, routing, polling, Check again, shared helpers. */

/* ---------- shared helpers ---------- */
function saveSort(table, sort) { const all = store.json('pgdash.sort', {}); all[table] = sort; store.set('pgdash.sort', all); }
function saveOpen(table, open) { const all = store.json('pgdash.open', {}); all[table] = open; store.set('pgdash.open', all); }
function tabKeys(list) {
  list.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = $$('[role=tab]', list), i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    n.focus(); n.click();
  });
}
function fillSortSelect(sel, cols, sort) {
  const el = $(sel);
  if (!el) return;
  el.html = cols.flatMap(c => [['desc', c.num || c.rank || c.k === 'remaining' ? 'high first' : 'Z to A'], ['asc', c.num || c.rank ? 'low first' : 'A to Z']]
    .map(([d, w]) => `<option value="${c.k}:${d}" ${sort.key === c.k && sort.dir === d ? 'selected' : ''}>Sort: ${esc(c.label)}, ${w}</option>`)).join('');
}
function blockError(name, lastGood) {
  return `<p class="txt-bad" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${shape('bad')}<span>Couldn't load ${name}.${lastGood ? ` Last good at ${hhmm(lastGood)}.` : ''}</span><button type="button" class="btn" data-retry="1">Retry</button></p>`;
}
const iconWant = { names: new Set(), typeIds: new Set(), types: new Set() };
let iconTimer = null, iconRetryAt = 0;
function needIcons(req) {
  if (Date.now() < iconRetryAt) return;
  let added = false;
  for (const n of req.names || []) if (!(n in S.icons.byName) && !iconWant.names.has(n)) { iconWant.names.add(n); added = true; }
  for (const n of req.typeIds || []) if (!(n in S.icons.byTypeId) && !iconWant.typeIds.has(n)) { iconWant.typeIds.add(n); added = true; }
  for (const n of req.types || []) if (!(n in S.icons.byType) && !iconWant.types.has(n)) { iconWant.types.add(n); added = true; }
  if (added && !iconTimer) iconTimer = setTimeout(fetchIcons, 50);
}
async function fetchIcons() {
  iconTimer = null;
  const names = [...iconWant.names], typeIds = [...iconWant.typeIds], types = [...iconWant.types];
  iconWant.names.clear(); iconWant.typeIds.clear(); iconWant.types.clear();
  const qs = new URLSearchParams();
  if (names.length) qs.set('names', names.join(','));
  if (typeIds.length) qs.set('typeIds', typeIds.join(','));
  if (types.length) qs.set('types', types.join(','));
  try {
    const r = await api('/api/icons?' + qs);
    Object.assign(S.icons.byName, r.byName || {}); Object.assign(S.icons.byTypeId, r.byTypeId || {}); Object.assign(S.icons.byType, r.byType || {});
  } catch (e) {
    if (isNetworkError(e)) { iconRetryAt = Date.now() + 30000; return; } // try again later; keep the empty slots meanwhile
    names.forEach(n => S.icons.byName[n] = null); typeIds.forEach(n => S.icons.byTypeId[n] = null); types.forEach(n => S.icons.byType[n] = null);
  }
  renderView();
}
const lookWant = { quests: new Set(), powers: new Set() };
let lookTimer = null;
function needLookup(req) {
  let added = false;
  for (const q of req.quests || []) if (!(q in S.lookup.quests)) { lookWant.quests.add(q); added = true; }
  for (const p of req.powers || []) if (!(p in S.lookup.powers)) { lookWant.powers.add(p); added = true; }
  if (added && !lookTimer) lookTimer = setTimeout(fetchLookup, 80);
}
async function fetchLookup() {
  lookTimer = null;
  const quests = [...lookWant.quests], powers = [...lookWant.powers];
  lookWant.quests.clear(); lookWant.powers.clear();
  const qs = new URLSearchParams();
  if (quests.length) qs.set('quests', quests.join(','));
  if (powers.length) qs.set('powers', powers.join(','));
  try {
    const r = await api('/api/lookup?' + qs);
    Object.assign(S.lookup.quests, r.quests || {}); Object.assign(S.lookup.powers, r.powers || {});
  } catch (e) {
    if (isNetworkError(e)) return;
    quests.forEach(q => S.lookup.quests[q] = null); powers.forEach(p => S.lookup.powers[p] = null);
  }
  renderView();
}

/* ---------- rendering ---------- */
const RENDER = { session: () => renderSession(), combat: () => renderCombatView(), vendors: () => renderVendors(), storage: () => renderStorage(), character: () => renderCharacter(), files: () => renderFiles() };
function renderView() {
  plaqueInView = null;
  try { RENDER[S.view](); } catch (e) { console.error(e); }
  renderMargin();
  renderShellHealth();
}
function renderAll() {
  renderShell();
  renderNotices();
  renderView();
}
function renderShell() {
  const s = S.session || {};
  const h = S.health;
  const exporters = [...new Set((S.reports || []).map(r => r.character).filter(c => c && c !== '???'))];
  const sel = $('#charsel-shell');
  if (exporters.length > 1) {
    sel.hidden = false;
    sel.html = exporters.map(c => `<option ${c === S.character ? 'selected' : ''}>${esc(c)}</option>`).join('');
  } else sel.hidden = true;
  const srv = s.server || h?.server || '';
  { const nm = S.character || s.character; $('#who').html = nm ? `${esc(nm)}${srv ? `<span class="srv"> · ${esc(srv)}</span>` : ''}` : '…'; }
  $('.scope').classList.toggle('has-sel', exporters.length > 1);
  const area = V('game')?.unknown ? null : s.currentArea || h?.game?.area;
  let where = '';
  const hasState = typeof s.loggedIn === 'boolean' || h?.game;
  if (area) {
    if (!hasState) where = `<b>${esc(area)}</b>`;
    else if (loggedIn()) where = `<b>${esc(area)}</b> (logged in)`;
    else { const lo = parseIso(s.loggedOutAt || h?.game?.loggedOutAt); where = `<b>${esc(area)}</b> (logged out${lo ? ' ' + (isToday(lo) ? hhmm(lo) : dateTime(lo)) : ''})`; }
  } else if (V('game')?.unknown) where = 'Location not known without a chat log';
  else if (S.session) where = 'No area yet today';
  $('#where').html = where;
  $$('.rail a.ri').forEach(a => { if (a.dataset.view === S.view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const banner = $('#banner-down');
  banner.hidden = !S.down;
  if (S.down) banner.html = `${shape('bad')}<span>Nothing is loading. The dashboard server isn't answering. Start it again: python3 server.py</span>`;
  syncTheme();
}
function renderNotices() {
  const pn = $('#preview-note');
  if (!PREVIEW.active) { pn.hidden = true; return; }
  const parts = [];
  if (PREVIEW.shift) parts.push(`pretending ${PREVIEW.shift} hours have passed`);
  const simCopy = { stale: 'pretending your exports are 3 days old', broken: 'pretending your last character export came out partial', nolog: "pretending there's no chat log", noexport: 'pretending this character has no exports', loading: 'holding every request so the loading state stays up', down: `pretending the server stopped answering after ${S.downSince ? hhmm(S.downSince) : 'the first load'}` };
  if (PREVIEW.sim) parts.push(simCopy[PREVIEW.sim]);
  let txt = parts.length ? `Preview: ${parts.join(', and ')}.${PREVIEW.sim === 'loading' ? '' : ' Real data is unchanged.'}` : '';
  if (PREVIEW.notes.length) txt += ` Preview: ${PREVIEW.notes.join('; ')}.`;
  pn.hidden = false;
  pn.html = `${shape('warn', 's13')}<span>${esc(txt.trim())}</span>`;
}

/* ---------- theme ---------- */
function syncTheme() {
  const t = document.documentElement.getAttribute('data-theme') || 'auto';
  $$('[role=radiogroup][aria-label=Theme] [role=radio]').forEach(b => { b.setAttribute('aria-checked', String(b.dataset.v === t)); b.tabIndex = b.dataset.v === t ? 0 : -1; });
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  if (!PREVIEW.theme) store.set('pgdash.theme', t);
  syncTheme();
  if (sessUI.chart && S.view === 'session') drawXp(sessUI.chart);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[role=radiogroup][aria-label=Theme] [role=radio]');
  if (b) setTheme(b.dataset.v);
});
document.addEventListener('keydown', e => {
  const b = e.target.closest?.('[role=radiogroup][aria-label=Theme] [role=radio]');
  if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
  const opts = ['auto', 'dark', 'daylight'], i = opts.indexOf(b.dataset.v);
  const n = opts[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
  e.preventDefault(); setTheme(n);
  b.parentElement.querySelector(`[data-v="${n}"]`).focus();
});

/* ---------- routing ---------- */
/* A view may carry sub-state after "?" (#files?f=<id>&p=<pointer>); views compare on the part before it. */
const route = h => { const [view, qs] = String(h || '').split('?'); return { view, params: new URLSearchParams(qs || '') }; };
function go(view) { if (VIEWS.includes(view)) { if (route(location.hash.slice(1)).view !== view) location.hash = view; else showView(view); } }
function showView(view) {
  if (!VIEWS.includes(view)) return;
  const changed = S.view !== view;
  S.view = view;
  store.set('pgdash.tab', view);
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
  const sl = $('#sysline');
  if (changed && sl.dataset.view && sl.dataset.view !== view) { sl.innerHTML = ''; sl.className = 'sysline'; sl.dataset.view = ''; }
  renderAll();
  if (changed) window.scrollTo(0, 0);
  if (view === 'combat' && changed && !S.combat && !S.combatOld && !S.loading) combatRound();
}
window.addEventListener('hashchange', () => showView(route(location.hash.slice(1)).view));

/* ---------- data rounds ---------- */
function onFetchError(e) {
  if (e && isNetworkError(e)) {
    if (!S.down) { S.down = true; S.downSince = S.lastGood.any || NOW(); }
  } else console.error(e);
}
function markUp() { S.down = false; S.lastGood.any = NOW(); }

function pickCharacter() {
  const exporters = [...new Set((S.reports || []).map(r => r.character).filter(c => c && c !== '???'))];
  const saved = store.get('pgdash.character', null);
  const logged = S.session?.character || S.health?.game?.character;
  if (S.character && (exporters.includes(S.character) || PREVIEW.sim === 'noexport')) return;
  S.character = (saved && exporters.includes(saved)) ? saved : (logged || exporters[0] || null);
}
async function selectCharacter(who) {
  S.character = who; store.set('pgdash.character', who);
  S.charPicked = false; S.itemsPicked = false; vUI.selected = null; sUI.selected = null; sUI.iloc = '';
  await refreshExports(true).catch(onFetchError);
  await loadHealth().catch(onFetchError);
  computeVerdicts(); renderAll();
}

async function loadReports() {
  const r = await api('/api/reports');
  S.reports = Array.isArray(r) ? r : [];
}
/* Reports, vendors, storage and the picked exports. Keeps a manual pick across refreshes. */
async function refreshExports(force) {
  await loadReports();
  pickCharacter();
  await loadVendors();
  await loadZone(true);
  const cf = S.charPicked && charReports().all.some(r => r.file === S.charFile) ? S.charFile : newestCharFile();
  if (force || cf !== S.charFile || !S.charData) await loadChar(cf);
  const itf = S.itemsPicked && storageReports().some(r => r.file === S.itemsFile) ? S.itemsFile : newestItemsFile();
  if (force || itf !== S.itemsFile || !S.itemsData) await loadItems(itf);
  if (S.view === 'files' || S.files) await loadFiles(); // the file list polls only once the Files view has been opened
}
async function fullRound() {
  try {
    await loadSession();
    if (S.view === 'combat') { await loadCombat(); await loadParty(); }
    await refreshExports(false);
    await loadHealth();
    markUp();
  } catch (e) { onFetchError(e); }
  roundsDone++;
  S.loading = false;
  computeVerdicts();
  renderAll();
}
async function healthRound() {
  try { await loadSession(); await loadHealth(); markUp(); } catch (e) { onFetchError(e); }
  roundsDone++;
  computeVerdicts(); renderAll(); deliverMoments();
}
async function exportsRound() {
  try { await refreshExports(false); markUp(); } catch (e) { onFetchError(e); }
  roundsDone++;
  computeVerdicts(); renderAll();
}
let tailBusy = false;
async function tailRound() {
  if (tailBusy) return;
  tailBusy = true;
  try {
    const lines = await pollTail();
    markUp();
    if (lines.some(l => /XP|added to inventory|Entering Area|Logged In|Logged Out/.test(l.msg))) {
      await loadSession(); computeVerdicts(); if (S.view === 'session') renderAll(); else renderShell();
    }
    const saved = lines.filter(l => /^\[Status\] Saved report to .+\.json\s*$/.test(l.msg));
    if (saved.length) setTimeout(() => onExportLines(saved), 1500);
  } catch (e) {
    const wasDown = S.down;
    onFetchError(e);
    if (S.down && !wasDown) { computeVerdicts(); renderAll(); }
  }
  roundsDone++;
  tailBusy = false;
}
async function onExportLines(lines) {
  const before = exportSnapshot();
  try { await refreshExports(false); await loadHealth(); markUp(); } catch (e) { onFetchError(e); }
  computeVerdicts(); renderAll(); deliverMoments();
  const after = exportSnapshot();
  for (const l of lines) {
    const file = l.msg.replace(/^\[Status\] Saved report to /, '').trim().split('/').pop();
    const partial = /^Character__/.test(file);
    const m = /^Character_(.+)_[^_]+\.json$/.exec(file) || /^(.+?)_[^_]+_items_/.exec(file);
    const who = partial ? null : m?.[1];
    const kind = /^Character_/.test(file) ? 'Character' : 'Storage';
    if (partial) {
      if (S.healthMode === 'browser') toast({ kind: 'bad', text: 'That export came out partial. Export again while fully logged in.', broken: true, topic: 'broken-export', action: { label: 'Show', run: () => go('character') } });
      continue;
    }
    if (who && S.character && who !== S.character) { toast({ kind: 'status', text: `Saved ${who}'s ${kind.toLowerCase()} export.`, topic: 'export-confirmed', action: { label: `Switch to ${who}`, run: () => selectCharacter(who) } }); continue; }
    const text = kind === 'Character' ? `Character export loaded. Vendors can pay ${fmt(after.councils)} councils.` : `Storage export loaded. ${fmt(after.free)} slots free across your vaults.`;
    sysLine('status', text);
    if ((kind === 'Character' && S.view !== 'vendors' && S.view !== 'character') || (kind === 'Storage' && S.view !== 'storage')) toast({ kind: 'status', text, topic: 'export-confirmed' });
    flashView();
  }
  void before;
}
function exportSnapshot() {
  const rows = S.vendors?.vendors ? vendorRows().filter(r => !r.locked) : [];
  const vaults = S.storage?.vaults || [];
  return {
    char: newestCharFile() ? (charReports().good[0]?.timestamp) : null,
    stor: storageReports()[0]?.timestamp || null,
    councils: rows.reduce((a, r) => a + r.remaining, 0),
    free: vaults.filter(v => v.capacity != null).reduce((a, v) => a + Math.max(0, v.free), 0),
  };
}
function flashView() {
  $$(`#v-${S.view} .glance`).forEach(el => { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); });
}

/* ---------- Check again ---------- */
async function checkAgain(source) {
  const btn = $('#checkbtn');
  if (btn.disabled) return;
  btn.disabled = true; btn.textContent = 'Checking…';
  const before = exportSnapshot();
  const filesBefore = filesSnapshot();
  const tailBefore = sessUI.feed.length, lastBefore = S.session?.lastLineAt || (sessUI.feed.at(-1)?.ts);
  let failed = false;
  try {
    await loadReports();
    pickCharacter();
    await Promise.all([loadSession(), loadVendors()]);
    await refreshExports(false);
    await loadHealth();
    const nl = await pollTail();
    markUp();
    void nl;
  } catch (e) { failed = true; onFetchError(e); }
  computeVerdicts(); renderAll();
  btn.disabled = false; btn.textContent = 'Check again';
  if (failed && S.down) { sysLine('error', "The dashboard server isn't answering. Start it again: python3 server.py"); return; }
  const after = exportSnapshot();
  if (S.view === 'files' && !source) return filesChecked(filesBefore);
  const view = source === 'export-storage' ? 'storage' : source === 'export-character' || source === 'export-again' ? 'vendors' : source === 'chat-logging' ? 'session' : S.view;
  if (view === 'session') {
    const newLines = sessUI.feed.length - tailBefore;
    const last = S.session?.lastLineAt ? hhmm(parseIso(S.session.lastLineAt)) : (sessUI.feed.at(-1)?.ts.slice(9, 14) || '?');
    if (newLines > 0 || (S.session?.lastLineAt && S.session.lastLineAt !== lastBefore)) sysLine('status', `Chat log read to ${last}. ${plural(Math.max(newLines, 0), 'new line')}.`);
    else if (last === '?') sysLine('error', `Still no chat log file. ${S.health?.settings?.readable && S.health.settings.LogChat === 0 ? "The game's settings file still says chat logging is off." : ''} Check Settings → GUI → Log All Chat is on, log out and back in, then check again.`.replace('  ', ' '));
    else if (['warn', 'bad'].includes(sevOf('chat-log'))) sysLine(sevOf('chat-log') === 'bad' ? 'error' : 'warn', `No new lines since ${last}. Check Settings → GUI → Log All Chat is on, then check again.`);
    else sysLine('note', `No new lines since ${last}. The chat log only grows while you're in game.`);
    return;
  }
  const useStorage = view === 'storage';
  const changed = useStorage ? after.stor !== before.stor : after.char !== before.char;
  if (changed) {
    const ts = useStorage ? after.stor : after.char;
    sysLine('status', useStorage ? `Storage export of ${hhmm(parseUtc(ts))} loaded. ${fmt(after.free)} slots free.` : `Character export of ${hhmm(parseUtc(ts))} loaded. Vendors can pay ${fmt(after.councils)} councils.`);
    flashView();
    return;
  }
  // nothing new: name the worst export source for this view
  const srcs = view === 'storage' ? ['storage-export', 'character-export'] : ['character-export'];
  const worst = srcs.map(V).filter(Boolean).sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity])[0];
  const at = worst?.ageSec != null ? hhmm(NOW() - worst.ageSec * 1000) : '?';
  if (worst && (worst.severity === 'warn' || worst.severity === 'bad')) sysLine('warn', `Nothing new since ${at}. ${checkFix(worst)}, then check again.`);
  else sysLine('note', `Nothing new since ${at}. Your exports are recent.`);
}

/* ---------- boot ---------- */
function boot() {
  migrateStorage();
  $$('[data-app-name]').forEach(el => el.textContent = APP_NAME);
  $$('[data-fan-line]').forEach(el => el.textContent = FAN_LINE);
  $$('[data-fan-aria]').forEach(el => el.setAttribute('aria-label', `About: ${APP_NAME} is ${FAN_LINE}`));
  $$('[data-brand-aria]').forEach(el => el.setAttribute('aria-label', `${APP_NAME}, Session`));
  $('#favicon').href = FAVICONS.ok;
  initSession(); initCombat(); initVendors(); initStorage(); initCharacter(); initFiles(); initReminders();
  $('#checkbtn').addEventListener('click', () => checkAgain());
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-fix]');
    if (p) { checkAgain(p.dataset.fix); return; }
    const nn = e.target.closest('[data-notnow]');
    if (nn) { snoozeNote(nn.dataset.notnow); renderMargin(); return; }
    if (e.target.closest('[data-retry]')) { exportsRound(); return; }
  });
  $('#charsel-shell').addEventListener('change', e => selectCharacter(e.target.value));
  $('#healthpill').addEventListener('click', e => {
    e.preventDefault();
    const m = $('#margin');
    m.dataset.userOpen = '1'; m.classList.remove('collapsed'); renderMargin();
    m.scrollIntoView({ behavior: 'smooth', block: 'start' }); m.focus({ preventScroll: true });
  });
  $('#margin').addEventListener('click', e => {
    if (!e.target.closest('#mtogg')) return;
    const m = $('#margin');
    m.dataset.userOpen = '1'; m.classList.toggle('collapsed'); renderMargin();
    $('#mtogg')?.focus();
  });
  PHONE_MQ.addEventListener('change', () => { renderMargin(); if (!PHONE_MQ.matches && document.querySelector('.pop[aria-modal]')) closePops(); });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !e.target.closest('input, select, textarea')) {
      const s = { session: '#lootq', vendors: '#vq', storage: '#sq', character: '#skillq', files: '#fileq' }[S.view];
      if (s && !$(s).disabled) { e.preventDefault(); $(s).focus(); }
    }
    if (e.key === 'Escape' && e.target.matches('input[type=search]') && e.target.value) { e.target.value = ''; e.target.dispatchEvent(new Event('input')); }
  });
  const hash = route(location.hash.slice(1)).view;
  const start = VIEWS.includes(hash) ? hash : (VIEWS.includes(store.get('pgdash.tab', 'session')) ? store.get('pgdash.tab', 'session') : 'session');
  S.view = start;
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== start; });
  renderAll();
  fullRound().then(() => { deliverMoments(); tailRound(); });
  if (PREVIEW.sim === 'loading') return;
  // Polling rests while the tab is hidden, and catches up once when it comes back.
  // Health keeps running so Reminders still reach a background tab or the Mac app's hidden window.
  const whenVisible = fn => () => { if (!document.hidden) fn(); };
  setInterval(whenVisible(tailRound), 2000);
  setInterval(whenVisible(() => { if (S.view === 'combat') combatRound(); }), 2000); // the meter follows the live log
  setInterval(healthRound, 30000);
  setInterval(whenVisible(exportsRound), 60000);
  setInterval(whenVisible(() => { computeVerdicts(); renderShellHealth(); }), 30000);
  let hiddenAt = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    const away = hiddenAt ? Date.now() - hiddenAt : 0;
    hiddenAt = null;
    tailRound();
    if (away > 55000) exportsRound();
  });
}
boot();

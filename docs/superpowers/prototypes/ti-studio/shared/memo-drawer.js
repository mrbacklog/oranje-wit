/**
 * TI Studio · Memo Drawer Module
 *
 * Herbruikbare memo-drawer die vanuit elke pagina geopend kan worden.
 * Injecteert de drawer HTML + CSS in de pagina bij eerste aanroep.
 *
 * Gebruik:
 *   import { openMemoDrawer } from '../shared/memo-drawer.js';
 *   openMemoDrawer({
 *     entiteit: 'Staf', entiteitNaam: 'Jan Vermeer', entiteitIcon: 'technisch',
 *     status: 'open', prioriteit: 'hoog',
 *     beschrijving: 'Trainer OW 1 stopt...',
 *     tijdlijn: [ { type: 'toelichting', auteur: 'Antjan', datum: '14 apr, 16:30', tekst: '...' }, ... ]
 *   });
 */

const MEMO_SVG = '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/><path d="M8 12h8M8 15h8M8 18h5"/>';
const COMMENT_SVG = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';

const TYPE_ICONS = {
  technisch: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  medisch: '<path d="M12 11v4"/><path d="M14 13h-4"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M18 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/>',
  ondersteunend: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
};

const PRIO_LABELS = { blocker: '!', hoog: 'H', middel: 'M', laag: 'L', info: 'i' };
const STATUS_OPTIONS = ['Open', 'In bespreking', 'Opgelost', 'Geaccepteerd risico', 'Gearchiveerd'];
const PRIO_OPTIONS = ['Blocker', 'Hoog', 'Middel', 'Laag', 'Info'];

function typeIconSvg(type) {
  if (!type || !TYPE_ICONS[type]) return '';
  return `<span class="type-icoon ${type}" style="width:12px;height:12px"><svg viewBox="0 0 24 24">${TYPE_ICONS[type]}</svg></span>`;
}

function tijdlijnHtml(items) {
  if (!items || !items.length) return '';
  return items.map((item, i) => {
    const isLast = i === items.length - 1;
    const dotClass = item.type === 'toelichting' ? 'toelichting' : item.type === 'status' ? 'status' : 'aangemaakt';
    const streep = isLast ? '' : '<span class="tl-streep"></span>';
    const body = item.type === 'toelichting'
      ? `<div class="tl-tekst">${item.tekst}</div>`
      : `<div class="tl-event">${item.tekst}</div>`;
    return `<div class="tl-item">
      <div class="tl-lijn"><span class="tl-dot ${dotClass}"></span>${streep}</div>
      <div class="tl-body">
        <div class="tl-meta"><span class="tl-auteur">${item.auteur}</span> · ${item.datum}</div>
        ${body}
      </div>
    </div>`;
  }).join('');
}

function ensureStyles() {
  if (document.getElementById('memo-drawer-css')) return;
  const style = document.createElement('style');
  style.id = 'memo-drawer-css';
  style.textContent = `
.md-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:200; justify-content:flex-end; }
.md-overlay.visible { display:flex; }
.memo-drawer { width:380px; height:100vh; background:var(--surface-page); border-left:1px solid var(--border-light); display:flex; flex-direction:column; flex-shrink:0; animation: md-slide-in 200ms ease; }
@keyframes md-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.md-header { padding:16px 18px 12px; border-bottom:1px solid var(--border-light); flex-shrink:0; }
.md-header-top { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.md-close { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:none; border:1px solid var(--border-default); color:var(--text-tertiary); cursor:pointer; font-size:14px; font-family:inherit; margin-left:auto; }
.md-close:hover { background:rgba(255,255,255,.06); color:var(--text-primary); }
.md-controls { display:flex; gap:6px; flex-wrap:wrap; }
.md-select { padding:4px 8px; border-radius:5px; font-size:11px; font-weight:600; font-family:inherit; outline:none; cursor:pointer; }
.md-select.status { background:rgba(234,179,8,.1); border:1px solid rgba(234,179,8,.25); color:#eab308; }
.md-select.prio { background:rgba(249,115,22,.1); border:1px solid rgba(249,115,22,.25); color:#f97316; }
.md-entiteit { display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:5px; font-size:11px; font-weight:500; color:var(--text-secondary); background:rgba(255,255,255,.04); border:1px solid var(--border-light); }
.md-body { flex:1; overflow-y:auto; padding:16px 18px; display:flex; flex-direction:column; gap:14px; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.14) transparent; }
.md-section-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); margin-bottom:4px; }
.md-beschrijving { font-size:13px; color:var(--text-primary); line-height:1.6; padding:10px 12px; border-radius:8px; background:var(--surface-card); border:1px solid var(--border-light); min-height:60px; }
.md-tijdlijn { display:flex; flex-direction:column; gap:0; }
.tl-item { display:flex; gap:10px; padding:8px 0; border-bottom:1px solid var(--border-light); font-size:12px; }
.tl-item:last-child { border-bottom:none; }
.tl-lijn { width:20px; display:flex; flex-direction:column; align-items:center; flex-shrink:0; padding-top:4px; }
.tl-dot { width:8px; height:8px; border-radius:50%; background:var(--border-default); flex-shrink:0; }
.tl-dot.toelichting { background:var(--ow-accent); }
.tl-dot.status { background:#60a5fa; }
.tl-dot.aangemaakt { background:#22c55e; }
.tl-streep { width:1px; flex:1; background:var(--border-light); margin-top:4px; }
.tl-body { flex:1; min-width:0; }
.tl-meta { display:flex; align-items:center; gap:6px; font-size:10px; color:var(--text-tertiary); margin-bottom:2px; }
.tl-auteur { font-weight:600; color:var(--text-secondary); }
.tl-tekst { color:var(--text-primary); line-height:1.5; }
.tl-event { color:var(--text-tertiary); font-style:italic; }
.md-input-wrap { padding:12px 18px; border-top:1px solid var(--border-light); flex-shrink:0; }
.md-input-row { display:flex; gap:6px; }
.md-input { flex:1; padding:8px 12px; border-radius:7px; background:var(--surface-card); border:1px solid var(--border-default); color:var(--text-primary); font-size:12px; outline:none; font-family:inherit; }
.md-input:focus { border-color:rgba(255,107,0,.4); }
.md-input::placeholder { color:var(--text-muted); }
.md-send { padding:8px 14px; border-radius:7px; border:none; background:var(--ow-accent); color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; flex-shrink:0; }
  `;
  document.head.appendChild(style);
}

function ensureOverlay() {
  if (document.getElementById('md-overlay')) return;
  const div = document.createElement('div');
  div.id = 'md-overlay';
  div.className = 'md-overlay';
  div.addEventListener('click', (e) => { if (e.target === div) closeMemoDrawer(); });
  document.body.appendChild(div);
}

export function closeMemoDrawer() {
  const overlay = document.getElementById('md-overlay');
  if (overlay) overlay.classList.remove('visible');
}

/**
 * Open de memo-drawer met de gegeven data.
 */
export function openMemoDrawer({
  entiteit = '',
  entiteitNaam = '',
  entiteitIcon = '',
  status = 'open',
  prioriteit = 'middel',
  beschrijving = '',
  tijdlijn = [],
} = {}) {
  ensureStyles();
  ensureOverlay();

  const overlay = document.getElementById('md-overlay');

  const statusIdx = STATUS_OPTIONS.findIndex(s => s.toLowerCase().startsWith(status.toLowerCase()));
  const prioIdx = PRIO_OPTIONS.findIndex(p => p.toLowerCase() === prioriteit.toLowerCase());

  const statusOpts = STATUS_OPTIONS.map((s, i) => `<option${i === statusIdx ? ' selected' : ''}>${s}</option>`).join('');
  const prioOpts = PRIO_OPTIONS.map((p, i) => `<option${i === prioIdx ? ' selected' : ''}>${p}</option>`).join('');

  overlay.innerHTML = `
    <aside class="memo-drawer">
      <div class="md-header">
        <div class="md-header-top">
          <span class="md-entiteit">${typeIconSvg(entiteitIcon)} ${entiteitNaam || entiteit}</span>
          <button class="md-close" onclick="document.getElementById('md-overlay').classList.remove('visible')">×</button>
        </div>
        <div class="md-controls">
          <select class="md-select status">${statusOpts}</select>
          <select class="md-select prio">${prioOpts}</select>
        </div>
      </div>
      <div class="md-body">
        <div>
          <div class="md-section-label">Beschrijving</div>
          <div class="md-beschrijving">${beschrijving}</div>
        </div>
        ${tijdlijn.length ? `<div><div class="md-section-label">Tijdlijn</div><div class="md-tijdlijn">${tijdlijnHtml(tijdlijn)}</div></div>` : ''}
      </div>
      <div class="md-input-wrap">
        <div class="md-input-row">
          <input class="md-input" placeholder="Voeg toelichting toe...">
          <button class="md-send">Verstuur</button>
        </div>
      </div>
    </aside>
  `;

  overlay.classList.add('visible');
}

// Maak globaal beschikbaar voor onclick handlers
window.openMemoDrawer = openMemoDrawer;
window.closeMemoDrawer = closeMemoDrawer;

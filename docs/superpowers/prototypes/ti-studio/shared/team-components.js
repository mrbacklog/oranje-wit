/**
 * TI Studio · Shared Team Components
 *
 * Rendert team-kaarten voor het werkbord canvas.
 * Compact zoom: geslacht-tellers + compact-chips met leeftijd-bar.
 *
 * Gebruik:
 *   import { teamKaart } from '../shared/team-components.js';
 *   container.innerHTML = teamKaart({ naam: 'OW C1', ... });
 */

import { svg, memoSvg } from './icons.js';

// ─── SVG iconen voor geslacht-tellers ───────────────────────────────────────

const VENUS_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(236,72,153,.8)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="6"/><line x1="12" y1="14" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
const MARS_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,.8)" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="14" r="6"/><line x1="21" y1="3" x2="15" y2="9"/><polyline points="16 3 21 3 21 8"/></svg>`;

// ─── Staf type icoon SVGs ───────────────────────────────────────────────────

const TYPE_SVGS = {
  technisch: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  medisch: '<path d="M12 11v4"/><path d="M14 13h-4"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M18 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/>',
  ondersteunend: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
};

// ─── Categorie → CSS kleur class ────────────────────────────────────────────

const KLEUR_CLASS = {
  blauw: 'cat-blauw', groen: 'cat-groen', geel: 'cat-geel',
  oranje: 'cat-oranje', rood: 'cat-rood', senior: 'cat-senior',
  paars: 'cat-paars',
};

// ─── Leeftijdkleur CSS variabele ────────────────────────────────────────────

function leeftijdVar(leeftijd) {
  const l = Math.floor(leeftijd);
  if (l <= 4) return 'var(--leeftijd-4)';
  if (l >= 19) return 'var(--leeftijd-19)';
  return `var(--leeftijd-${l})`;
}

// ─── Validatie-hoek HTML ────────────────────────────────────────────────────

function valHoek(status, symbolen = []) {
  if (status === 'ok') return '<div class="val-hoek ok"></div>';
  const syms = symbolen.map(s =>
    `<span class="vi"><svg viewBox="0 0 24 24">${s}</svg></span>`
  ).join('');
  return `<div class="val-hoek ${status}"><div class="val-sym">${syms}</div></div>`;
}

// ─── Compact-chip (speler) ──────────────────────────────────────────────────

function compactChip({ naam, geslacht = 'M', leeftijd = 17, status, spId }) {
  const vrouwCls = geslacht === 'V' ? ' vrouw' : '';
  const statusCls = status ? ` ${status}` : '';
  const dataId = spId ? ` data-speler-id="${spId}" draggable="true" data-drag-type="speler" data-drag-id="${spId}"` : '';
  return `<div class="compact-chip${vrouwCls}${statusCls}"${dataId}><div class="inner"><span class="g-dot"></span><span class="nm">${naam}</span></div><div class="leeft-bar" style="background:${leeftijdVar(leeftijd)}"></div></div>`;
}

// ─── Staf compact-chip ──────────────────────────────────────────────────────

function stafCompact({ naam, type = 'technisch', stafId }) {
  const iconSvg = TYPE_SVGS[type] || TYPE_SVGS.technisch;
  const dataId = stafId ? ` data-staf-id="${stafId}"` : '';
  return `<div class="staf-compact"${dataId} style="cursor:pointer"><div class="inner"><span class="type-icoon ${type}" style="width:10px;height:10px"><svg viewBox="0 0 24 24">${iconSvg}</svg></span><span class="nm">${naam}</span></div></div>`;
}

// ─── Geslacht-teller (compact zoom) ─────────────────────────────────────────

function geslachtTeller(geslacht, aantal) {
  const cls = geslacht === 'V' ? 'v' : 'h';
  const svg = geslacht === 'V' ? VENUS_SVG : MARS_SVG;
  return `<div class="compact-sexe-teller ${cls}">${svg}<span class="st-val">${aantal}</span></div>`;
}

/**
 * Render een team-kaart in compact modus.
 *
 * @param {object} opts
 * @param {string} opts.naam - Teamnaam
 * @param {string} opts.sub - Subtitel (bijv. "Geel 10–12")
 * @param {'viertal'|'achttal'} opts.type - Teamtype
 * @param {string} opts.kleur - KNKV kleur (blauw/groen/geel/oranje/rood/senior)
 * @param {'ok'|'warn'|'err'} [opts.validatie='ok'] - Validatiestatus
 * @param {string[]} [opts.valSymbolen] - SVG paths voor validatie-hoek iconen
 * @param {string} [opts.memo] - Memo status ('open'|'bespreking'|etc)
 * @param {Array<{naam:string, geslacht:'M'|'V', leeftijd:number, status?:string}>} opts.dames
 * @param {Array<{naam:string, geslacht:'M'|'V', leeftijd:number, status?:string}>} opts.heren
 * @param {Array<{naam:string, type?:string}>} [opts.staf]
 * @returns {string} HTML string
 */
export function teamKaart({
  id, naam, sub = '', type = 'achttal', kleur = 'senior',
  validatie = 'ok', valSymbolen = [], memo, memoCount = 0, memoId,
  dames = [], heren = [], staf = [],
}) {
  const kleurCls = KLEUR_CLASS[kleur] || 'cat-senior';
  const memoHtml = memo
    ? ` <span class="memo-attention ${memo}" data-memo-indicator${memoId ? ` data-memo-id="${memoId}"` : ''} style="width:16px;height:16px;display:inline-flex;vertical-align:middle;margin-left:4px;cursor:pointer" title="${memoCount} open memo${memoCount !== 1 ? '\'s' : ''}"><svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/><path d="M8 12h8M8 15h8M8 18h5"/></svg></span>`
    : '';

  const dataId = id ? ` data-team-id="${id}"` : '';

  const headerHtml = `
    <div class="tk-header"${dataId}>
      <div class="tk-naam-wrap">
        <div class="tk-naam">${naam}${memoHtml}</div>
        ${sub ? `<div class="tk-naam-sub">${sub}</div>` : ''}
      </div>
      <div class="tk-header-right"></div>
      ${valHoek(validatie, valSymbolen)}
    </div>`;

  let bodyHtml;
  if (type === 'viertal') {
    // Viertal: 1 kolom, ♀+♂ tellers naast elkaar, alle chips eronder
    bodyHtml = `
    <div class="tk-body"><div class="tk-col">
      <div class="compact-sexe-teller v" style="flex-direction:row;gap:16px;justify-content:center">
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px">${VENUS_SVG}<span class="st-val" style="color:rgba(236,72,153,.75)">${dames.length}</span></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px">${MARS_SVG}<span class="st-val" style="color:rgba(96,165,250,.75)">${heren.length}</span></div>
      </div>
      <div class="compact-flow">
        ${dames.map(s => compactChip({ ...s, geslacht: 'V' })).join('')}
        ${heren.map(s => compactChip({ ...s, geslacht: 'M' })).join('')}
      </div>
    </div></div>`;
  } else {
    // Achttal: 2 kolommen ♀ | ♂
    bodyHtml = `
    <div class="tk-body">
      <div class="tk-col">
        ${geslachtTeller('V', dames.length)}
        <div class="compact-flow">${dames.map(s => compactChip({ ...s, geslacht: 'V' })).join('')}</div>
      </div>
      <div class="tk-col">
        ${geslachtTeller('M', heren.length)}
        <div class="compact-flow">${heren.map(s => compactChip({ ...s, geslacht: 'M' })).join('')}</div>
      </div>
    </div>`;
  }

  const stafHtml = staf.length
    ? `<div class="tk-staf-footer">${staf.map(s => stafCompact(s)).join('')}</div>`
    : '';

  const outerDataId = id ? ` data-team-id="${id}"` : '';
  return `<div class="team-kaart ${type} ${kleurCls}"${outerDataId}>${headerHtml}${bodyHtml}${stafHtml}</div>`;
}

/**
 * Render meerdere team-kaarten in een map-surface container.
 *
 * @param {string} containerId - ID van het map-surface element
 * @param {Array<object>} teams - Array van teamKaart opties
 */
export function renderCanvas(containerId, teams) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = teams.map(t => teamKaart(t)).join('\n');
}

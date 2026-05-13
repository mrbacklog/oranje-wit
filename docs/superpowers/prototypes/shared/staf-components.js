/**
 * TI Studio · Shared Staf Components
 *
 * Herbruikbare HTML-fragmenten voor staf-weergave elementen.
 * Importeer in elk prototype dat staf-elementen nodig heeft.
 *
 * Gebruik:
 *   <script type="module">
 *     import { stafChip, stafRijkeRij } from '../shared/staf-components.js';
 *     document.getElementById('container').innerHTML = stafChip({ ... });
 *   </script>
 *
 * Vereist: tokens.css (of staf-weergave/tokens.css) geladen in de pagina.
 */

import { icons, stafTypeIcoon, svg, memoSvg, spelerBadge } from './icons.js';

// ─── Staftype icoon SVG (inline helper) ─────────────────────────────────────

function typeIconSvg(type, size = 10) {
  const iconName = stafTypeIcoon[type] || 'compass';
  return svg(iconName, { size, class: type });
}

// ─── Memo SVG (inline helper) ───────────────────────────────────────────────

function memoHtml(status, size = 14) {
  if (!status) return '';
  return memoSvg(status, size);
}

// ─── Shirt icoon (compact, inline) ──────────────────────────────────────────

function shirtIconHtml() {
  return `<span class="shirt-icoon" style="width:12px;height:12px;display:inline-flex;align-items:center;justify-content:center;color:var(--text-secondary);filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))"><svg viewBox="${icons.shirt.viewBox}" style="width:100%;height:100%;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">${icons.shirt.path}</svg></span>`;
}

/**
 * Staf compact-chip
 *
 * Structuur identiek aan speler compact-chip:
 * border + inner(type-icoon + naam + memo + shirt)
 *
 * @param {object} opts
 * @param {string} opts.naam - Naam van het staflid
 * @param {'technisch'|'medisch'|'ondersteunend'} opts.type - Staftype
 * @param {string} [opts.memo] - Memo status: 'open'|'bespreking'|'risico'|'opgelost'
 * @param {boolean} [opts.speeltOok=false] - Toont shirt-icoon als true
 * @param {boolean} [opts.inactief=false] - Gedempt weergeven
 * @returns {string} HTML string
 */
export function stafChip({ naam, type, memo, speeltOok = false, inactief = false }) {
  const cls = inactief ? 'compact-chip inactief' : 'compact-chip';
  const memoEl = memo ? memoHtml(memo, 14) : '';
  const shirtEl = speeltOok ? shirtIconHtml() : '';

  return `<div class="${cls}"><div class="inner">${typeIconSvg(type, 10)}<span class="nm">${naam}</span>${memoEl}${shirtEl}</div></div>`;
}

/**
 * Staf rijke-rij
 *
 * Structuur identiek aan speler rijke-rij:
 * border + sq-av full-height links + col(naam + memo + row2(rol-mini + speler-badge))
 *
 * @param {object} opts
 * @param {string} opts.naam - Naam van het staflid
 * @param {'technisch'|'medisch'|'ondersteunend'} opts.type - Staftype
 * @param {string} opts.rol - Rolnaam (bijv. 'Trainer', 'Verzorger')
 * @param {string} [opts.foto] - URL naar foto (optioneel, anders initialen)
 * @param {string} [opts.initialen] - Initialen als fallback
 * @param {string} [opts.memo] - Memo status
 * @param {string} [opts.speeltIn] - Team/selectie naam als speler
 * @param {boolean} [opts.inactief=false]
 * @returns {string} HTML string
 */
export function stafRijkeRij({ naam, type, rol, foto, initialen, memo, speeltIn, inactief = false }) {
  const cls = inactief ? 'rijke-rij inactief' : 'rijke-rij';
  const avatarInner = foto
    ? `<img src="${foto}" alt="">`
    : `<span class="initialen">${initialen || naam.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>`;
  const avCls = inactief ? 'staf-av inactief' : 'staf-av';

  const memoEl = memo ? memoHtml(memo, 16) : '';
  const badgeEl = speeltIn ? spelerBadge(speeltIn) : '';
  const opacityStyle = inactief ? ';opacity:.5' : '';

  return `<div class="${cls}">
    <div class="${avCls}">${avatarInner}</div>
    <div class="col">
      <div class="nm-row"><span class="nm">${naam}</span>${memoEl}</div>
      <div class="row2"><span class="rol-mini">${typeIconSvg(type, 8)}${' ' + rol}</span>${badgeEl}</div>
    </div>
  </div>`;
}

/**
 * Staf-sectie voor teamkaarten
 *
 * Rendert een lijst van staf compact-chips binnen een gelabelde container.
 *
 * @param {string} teamNaam - Teamnaam voor het label
 * @param {Array<object>} stafLeden - Array van stafChip opties
 * @returns {string} HTML string
 */
export function stafSectie(teamNaam, stafLeden) {
  const chips = stafLeden.map(s => stafChip(s)).join('\n      ');
  return `<div class="staf-sectie">
    <div class="staf-sectie-label">Staf · ${teamNaam}</div>
    <div class="staf-sectie-lijst">
      ${chips}
    </div>
  </div>`;
}

/**
 * Speler-badge (shirt + teamnaam)
 * Re-export voor gemak
 */
export { spelerBadge } from './icons.js';

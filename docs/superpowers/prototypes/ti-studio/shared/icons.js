/**
 * TI Studio · Shared SVG Icon Paths
 *
 * Lucide-gebaseerde SVG-paden voor hergebruik in alle prototypes.
 * Elk icoon is een object met `path` (innerHTML van de <svg>) en `viewBox`.
 *
 * Gebruik:
 *   import { icons } from '../shared/icons.js';
 *   `<svg viewBox="${icons.compass.viewBox}">${icons.compass.path}</svg>`
 *
 * Of via helper:
 *   icons.svg('compass', { width: 14, height: 14, class: 'technisch' })
 */

export const icons = {
  // ─── Staftype-iconen ──────────────────────────────────────────
  compass: {
    viewBox: '0 0 24 24',
    path: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    label: 'Technische staf',
  },
  briefcaseMedical: {
    viewBox: '0 0 24 24',
    path: '<path d="M12 11v4"/><path d="M14 13h-4"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M18 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/>',
    label: 'Medische staf',
  },
  shield: {
    viewBox: '0 0 24 24',
    path: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    label: 'Ondersteunende staf',
  },

  // ─── Speler/staf crossover ────────────────────────────────────
  shirt: {
    viewBox: '0 0 24 24',
    path: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    label: 'Speelt ook als speler',
  },

  // ─── Memo-attention ───────────────────────────────────────────
  memo: {
    viewBox: '0 0 24 24',
    path: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/><path d="M8 12h8M8 15h8M8 18h5"/>',
    label: 'Memo',
  },

  // ─── TI Studio logo ──────────────────────────────────────────
  tiStudio: {
    viewBox: '0 0 18 18',
    path: '<rect x="2" y="2" width="14" height="14" rx="1.5" stroke="#3b82f6" stroke-width="1.5" opacity="0.4"/><line x1="2" y1="6.7" x2="16" y2="6.7" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/><line x1="2" y1="11.3" x2="16" y2="11.3" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/><line x1="6.7" y1="2" x2="6.7" y2="16" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/><line x1="11.3" y1="2" x2="11.3" y2="16" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/><path d="M16 10l-4 4h4v-4z" fill="#3b82f6" opacity="0.15"/><path d="M16.5 5.5l-2-2-6 6-.5 2.5 2.5-.5 6-6zM14.5 7.5l-2-2" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    label: 'TI Studio',
  },

  // ─── Navigatie Ribbon iconen ──────────────────────────────────
  werkbord: {
    viewBox: '0 0 24 24',
    path: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    label: 'Werkbord',
  },
  personen: {
    viewBox: '0 0 24 24',
    path: '<circle cx="9" cy="7" r="3"/><path d="M3 20c0-4 2.7-6 6-6s6 2 6 6"/><circle cx="17" cy="8" r="2.5"/><path d="M16 20c0-2.5 1.5-4 4-4"/>',
    label: 'Personen',
  },
  document: {
    viewBox: '0 0 24 24',
    path: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    label: 'Memo / Document',
  },
  kader: {
    viewBox: '0 0 24 24',
    path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    label: 'Kader',
  },
  sync: {
    viewBox: '0 0 24 24',
    path: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    label: 'KNKV Sync',
  },
};

/**
 * Staftype → icoon mapping
 */
export const stafTypeIcoon = {
  technisch: 'compass',
  medisch: 'briefcaseMedical',
  ondersteunend: 'shield',
};

/**
 * Staftype → kleur CSS variabele
 */
export const stafTypeKleur = {
  technisch: 'var(--type-technisch)',
  medisch: 'var(--type-medisch)',
  ondersteunend: 'var(--type-ondersteunend)',
};

/**
 * Render een SVG-icoon als HTML string.
 *
 * @param {string} name - Icoon naam (key in icons object)
 * @param {object} opts - Opties
 * @param {number} [opts.size=14] - Breedte en hoogte in px
 * @param {string} [opts.class=''] - Extra CSS class(es)
 * @param {string} [opts.color] - Inline color override
 * @returns {string} HTML string
 */
export function svg(name, { size = 14, class: cls = '', color } = {}) {
  const icon = icons[name];
  if (!icon) return '';
  const style = color ? ` style="color:${color}"` : '';
  return `<span class="type-icoon ${cls}"${style} style="width:${size}px;height:${size}px;${color ? `color:${color}` : ''}"><svg viewBox="${icon.viewBox}">${icon.path}</svg></span>`;
}

/**
 * Render memo-attention icoon.
 *
 * @param {string} status - 'open' | 'bespreking' | 'risico' | 'opgelost'
 * @param {number} [size=14] - Breedte en hoogte in px
 * @returns {string} HTML string
 */
export function memoSvg(status, size = 14) {
  return `<span class="memo-attention ${status}" style="width:${size}px;height:${size}px"><svg viewBox="${icons.memo.viewBox}">${icons.memo.path}</svg></span>`;
}

/**
 * Render speler-badge (shirt + teamnaam).
 *
 * @param {string} teamNaam - Team of selectie naam
 * @returns {string} HTML string
 */
export function spelerBadge(teamNaam) {
  return `<span class="speler-badge"><span class="shirt-sm" style="width:10px;height:10px;display:inline-flex;align-items:center;justify-content:center"><svg viewBox="${icons.shirt.viewBox}" style="width:100%;height:100%;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">${icons.shirt.path}</svg></span> ${teamNaam}</span>`;
}

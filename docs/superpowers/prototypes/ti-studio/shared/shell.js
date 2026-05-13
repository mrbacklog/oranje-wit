/**
 * TI Studio · Shell Module
 *
 * Rendert de app-shell (ribbon + grid-layout) als wrapper voor pagina-prototypes.
 * Eén wijziging hier werkt door in alle pagina's.
 *
 * Gebruik:
 *   <link rel="stylesheet" href="../shared/tokens.css">
 *   <div id="app"></div>
 *   <script type="module">
 *     import { shell } from '../shared/shell.js';
 *     shell('app', {
 *       activePage: 'personen',   // 'home'|'werkbord'|'personen'|'memo'|'kader'|'sync'
 *       memoCount: 3,
 *       initialen: 'AL',
 *     });
 *   </script>
 *   Dan vul je #app-content met je pagina-inhoud via JS of in een <template>.
 */

import { icons } from './icons.js';

// ─── Ribbon SVG iconen ──────────────────────────────────────────────────

const RIBBON_ICONS = {
  werkbord: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  personen: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M3 20c0-4 2.7-6 6-6s6 2 6 6"/><circle cx="17" cy="8" r="2.5"/><path d="M16 20c0-2.5 1.5-4 4-4"/></svg>`,
  memo: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  kader: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  sync: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
};

const TI_LOGO = `<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="14" height="14" rx="1.5" stroke="#3b82f6" stroke-width="1.5" opacity="0.4"/>
  <line x1="2" y1="6.7" x2="16" y2="6.7" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/>
  <line x1="2" y1="11.3" x2="16" y2="11.3" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/>
  <line x1="6.7" y1="2" x2="6.7" y2="16" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/>
  <line x1="11.3" y1="2" x2="11.3" y2="16" stroke="#3b82f6" stroke-width="0.8" opacity="0.3"/>
  <path d="M16 10l-4 4h4v-4z" fill="#3b82f6" opacity="0.15"/>
  <path d="M16.5 5.5l-2-2-6 6-.5 2.5 2.5-.5 6-6zM14.5 7.5l-2-2" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ─── Ribbon button ──────────────────────────────────────────────────────

function ribbonBtn(id, icon, title, active, href) {
  const cls = active ? 'ribbon-btn active' : 'ribbon-btn';
  return `<a class="${cls}" title="${title}" href="${href}">${icon}</a>`;
}

// ─── Navigatie items definitie ──────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'werkbord', title: 'Werkbord', href: 'werkbord.html', group: 'main' },
  { id: 'personen', title: 'Personen', href: 'personen.html', group: 'main' },
  { id: 'memo',     title: "Memo's",   href: 'memo.html',     group: 'main', hasBadge: true },
  { id: 'kader',    title: 'Kader',    href: 'kader.html',    group: 'beheer' },
  { id: 'sync',     title: 'KNKV Sync', href: 'sync.html',    group: 'beheer' },
];

/**
 * Render de TI Studio shell in een container element.
 *
 * @param {string} containerId - ID van het container element
 * @param {object} opts
 * @param {string} opts.activePage - Actieve pagina: 'home'|'werkbord'|'personen'|'memo'|'kader'|'sync'
 * @param {number} [opts.memoCount=0] - Aantal open memo's (badge)
 * @param {string} [opts.initialen=''] - Gebruiker initialen
 */
export function shell(containerId, { activePage = 'home', memoCount = 0, initialen = 'AL' } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Bouw ribbon
  const mainGroup = NAV_ITEMS.filter(n => n.group === 'main');
  const beheerGroup = NAV_ITEMS.filter(n => n.group === 'beheer');

  const mainBtns = mainGroup.map(n => {
    if (n.hasBadge) {
      const badge = memoCount > 0
        ? `<span class="ribbon-badge">${memoCount > 99 ? '99+' : memoCount}</span>`
        : '';
      return `<div class="ribbon-memo-wrap">${ribbonBtn(n.id, RIBBON_ICONS[n.id], n.title, activePage === n.id, n.href)}${badge}</div>`;
    }
    return ribbonBtn(n.id, RIBBON_ICONS[n.id], n.title, activePage === n.id, n.href);
  }).join('\n        ');

  const beheerBtns = beheerGroup.map(n =>
    ribbonBtn(n.id, RIBBON_ICONS[n.id], n.title, activePage === n.id, n.href)
  ).join('\n        ');

  const logoActive = activePage === 'home' ? ' style="background:rgba(59,130,246,.08)"' : '';

  container.innerHTML = `
    <div class="shell-page">
      <nav class="ribbon" aria-label="Hoofdnavigatie">
        <a class="ribbon-logo" href="homepage.html" title="TI Studio — Home"${logoActive}>
          ${TI_LOGO}
        </a>
        <div class="ribbon-group">
          ${mainBtns}
        </div>
        <div class="ribbon-sep"></div>
        <div class="ribbon-group">
          ${beheerBtns}
        </div>
        <div class="ribbon-footer">
          <div class="ribbon-sep"></div>
          <div class="ribbon-avatar" title="Uitloggen">${initialen}</div>
        </div>
      </nav>
      <div class="shell-content" id="shell-content"></div>
    </div>
  `;

  // Verplaats <template id="page-content"> naar shell-content als die bestaat
  const tpl = document.getElementById('page-content');
  if (tpl) {
    document.getElementById('shell-content').appendChild(tpl.content.cloneNode(true));
  }
}

/**
 * CSS voor de shell — injecteer in <head> als het nog niet bestaat.
 * Wordt automatisch aangeroepen door shell().
 */
const SHELL_CSS = `
.shell-page {
  display: grid;
  grid-template-columns: var(--ribbon) 1fr;
  height: 100vh;
  overflow: hidden;
  font-family: Inter, system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  background: var(--surface-sunken);
  color: var(--text-primary);
  user-select: none;
}
.ribbon {
  background: var(--surface-page);
  border-right: 1px solid var(--border-light);
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 0 8px; gap: 2px;
}
.ribbon-logo {
  width: 30px; height: 30px; margin-bottom: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 9px; transition: background 120ms;
  text-decoration: none;
}
.ribbon-logo:hover { background: rgba(59,130,246,.08); }
.ribbon-logo svg { width: 24px; height: 24px; }
.ribbon-btn {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; background: none; border: none;
  color: var(--text-tertiary); position: relative; flex-shrink: 0;
  transition: background 120ms, color 120ms;
  text-decoration: none;
}
.ribbon-btn:hover { color: var(--text-secondary); background: rgba(255,255,255,.04); }
.ribbon-btn.active { background: var(--accent-dim); color: var(--ow-accent); }
.ribbon-btn.active:hover { background: var(--accent-dim); color: var(--ow-accent); }
.ribbon-btn.active::before {
  content: ''; position: absolute; left: -1px; top: 7px; bottom: 7px;
  width: 3px; background: var(--ow-accent); border-radius: 0 2px 2px 0;
}
.ribbon-sep { width: 22px; height: 1px; background: var(--border-light); margin: 4px 0; }
.ribbon-group { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ribbon-footer { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ribbon-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: #2a1a0a; border: 2px solid rgba(255,107,0,.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--ow-accent); cursor: pointer;
  transition: border-color 120ms;
}
.ribbon-avatar:hover { border-color: rgba(255,107,0,.6); }
.ribbon-memo-wrap { position: relative; }
.ribbon-badge {
  position: absolute; top: 3px; right: 3px;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--ow-accent); color: #fff;
  font-size: 8px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  line-height: 1; pointer-events: none;
}
.shell-content {
  display: flex; flex-direction: column;
  min-height: 0; overflow-y: auto;
  padding: 24px 28px;
  user-select: text;
}
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px; }
.page-header .page-sub { font-size: 12px; color: var(--text-tertiary); margin: 0; }
`;

// Injecteer CSS bij eerste import
if (!document.getElementById('shell-css')) {
  const style = document.createElement('style');
  style.id = 'shell-css';
  style.textContent = SHELL_CSS;
  document.head.appendChild(style);
}

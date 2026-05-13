/**
 * interactions.js — Gedeelde interactie-functies voor TI Studio prototypes
 * Drag-drop, hover-kaarten, dialogs en drawers.
 * Vanilla JS, geen dependencies, geen build-step.
 */

import { getSpeler, getStaf, getTeam, getMemo, getMemosVoor, leeftijdKlasse } from './mock-data.js';

// ── CSS injiceren ─────────────────────────────────────────────────────────────
const CSS = `
/* interactions.css — gegenereerd door interactions.js */

/* ── Drag-drop ── */
.dragging { opacity: 0.45; cursor: grabbing !important; }
.drag-over { outline: 2px dashed var(--ow-accent) !important; outline-offset: -2px; background: rgba(255,107,0,.06) !important; }

/* ── Portal overlay ── */
.ia-portal {
  position: fixed; inset: 0; z-index: 9990;
  pointer-events: none;
}
.ia-portal.has-click { pointer-events: auto; background: rgba(0,0,0,.55); }

/* ── Hover-kaart ── */
.ia-hover-kaart {
  position: fixed; z-index: 9985; pointer-events: none;
  opacity: 0; transform: scale(0.96) translateY(4px);
  transition: opacity 180ms ease, transform 180ms ease;
  filter: drop-shadow(0 8px 32px rgba(0,0,0,.7));
}
/* Hover-kaart mag niet verschijnen wanneer een dialog of drawer open staat */
body.ia-modal-open .ia-hover-kaart { display: none !important; }
.ia-hover-kaart.visible {
  opacity: 1; transform: scale(1) translateY(0);
}
/* Hk = hover-kaart (speler) */
.ia-hk {
  width: 200px; height: 300px; border-radius: 12px; overflow: visible; position: relative;
}
.ia-hk::before {
  content: ''; position: absolute; inset: -3px; border-radius: 15px;
  background: var(--c-border-grad, linear-gradient(135deg,#444,#888)); z-index: 0;
}
.ia-hk .c-inner {
  position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden;
  background: linear-gradient(160deg,#1a1a1e 0%,#0c0c0f 55%,#121216 100%);
  z-index: 1; display: flex; flex-direction: column;
}
.ia-hk .c-header {
  position: relative; z-index: 5; display: flex; align-items: flex-start;
  justify-content: space-between; padding: 11px 11px 8px; gap: 6px;
  border-bottom: 1px solid var(--c-accent-color, rgba(255,255,255,.1));
  background: linear-gradient(180deg, var(--c-header-bg, rgba(255,255,255,.03)) 0%, transparent 100%);
}
.ia-hk .c-header-left { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; margin-top: 10px; }
.ia-hk .c-chip {
  padding: 3px 9px; border-radius: 999px; font-size: 8px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid var(--status-color, rgba(255,255,255,.7));
  color: var(--text-primary); background: rgba(255,255,255,.07); white-space: nowrap;
}
.ia-hk .c-leeft { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.ia-hk .c-leeft .cl { font-size: 38px; font-weight: 900; line-height: 1; color: #fff; font-variant-numeric: tabular-nums; text-shadow: 0 0 24px var(--c-glow,rgba(255,255,255,.3)); }
.ia-hk .c-leeft .cd { font-size: 13px; font-weight: 800; color: rgba(255,255,255,.7); line-height: 1; margin-top: -2px; font-variant-numeric: tabular-nums; text-align: right; }
.ia-hk .c-leeft .cjr { font-size: 8px; font-weight: 600; color: rgba(255,255,255,.35); letter-spacing: 0.08em; text-transform: uppercase; text-align: right; }
.ia-hk .c-foto { position: relative; z-index: 2; flex: 1; overflow: hidden; }
.ia-hk .c-foto img { width: 100%; height: 100%; object-fit: cover; object-position: center 15%; filter: none; display: block; }
.ia-hk .c-foto::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 72%; background: linear-gradient(180deg,transparent 0%,rgba(10,10,14,.75) 45%,rgba(8,8,12,.98) 100%); z-index: 3; pointer-events: none; }
.ia-hk .c-foto .no-foto { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 900; color: rgba(255,255,255,.1); background: var(--surface-card); }
.ia-hk .c-roep { position: absolute; bottom: 48px; left: 0; right: 0; text-align: center; z-index: 5; }
.ia-hk .c-roep .cr { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,.9); line-height: 1; }
.ia-hk .c-roep .cas { font-size: 11px; color: rgba(255,255,255,.65); font-weight: 500; }
.ia-hk .c-footer { position: absolute; bottom: 0; left: 0; right: 0; z-index: 5; padding: 6px 12px 10px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border-top: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.06); backdrop-filter: blur(12px); border-radius: 0 0 12px 12px; }
.ia-hk .c-footer .tb { color: rgba(255,255,255,.65); border: 1px solid rgba(255,255,255,.18); border-radius: 4px; padding: 3px 10px; font-weight: 700; text-transform: uppercase; font-size: 11px; }
.ia-hk .c-footer .tb-empty { opacity: 0.3; }
/* Leeftijdklassen */
.ia-hk.leeft-paars  { --c-border-grad: linear-gradient(135deg,#3b0764,#7c3aed,#a78bfa,#7c3aed,#3b0764); --c-glow: rgba(124,58,237,.5); --c-accent-color: rgba(124,58,237,.6); --c-header-bg: rgba(124,58,237,.15); }
.ia-hk.leeft-blauw  { --c-border-grad: linear-gradient(135deg,#1e3a8a,#3b82f6,#60a5fa,#3b82f6,#1e3a8a); --c-glow: rgba(59,130,246,.5); --c-accent-color: rgba(59,130,246,.6); --c-header-bg: rgba(59,130,246,.15); }
.ia-hk.leeft-groen  { --c-border-grad: linear-gradient(135deg,#064e3b,#047857,#34d399,#047857,#064e3b); --c-glow: rgba(4,120,87,.5); --c-accent-color: rgba(4,120,87,.6); --c-header-bg: rgba(4,120,87,.15); }
.ia-hk.leeft-geel   { --c-border-grad: linear-gradient(135deg,#713f12,#facc15,#fde047,#facc15,#713f12); --c-glow: rgba(250,204,21,.45); --c-accent-color: rgba(250,204,21,.6); --c-header-bg: rgba(250,204,21,.12); }
.ia-hk.leeft-oranje { --c-border-grad: linear-gradient(135deg,#7c2d12,#f97316,#fb923c,#f97316,#7c2d12); --c-glow: rgba(249,115,22,.5); --c-accent-color: rgba(249,115,22,.6); --c-header-bg: rgba(249,115,22,.15); }
.ia-hk.leeft-rood   { --c-border-grad: linear-gradient(135deg,#7f1d1d,#dc2626,#ef4444,#dc2626,#7f1d1d); --c-glow: rgba(220,38,38,.5); --c-accent-color: rgba(220,38,38,.6); --c-header-bg: rgba(220,38,38,.15); }
.ia-hk.leeft-senior { --c-border-grad: linear-gradient(135deg,#374151,#9ca3af,#d1d5db,#9ca3af,#374151); --c-glow: rgba(156,163,175,.35); --c-accent-color: rgba(156,163,175,.5); --c-header-bg: rgba(156,163,175,.1); }

/* ── Staf hover-kaart ── */
.ia-shk {
  width: 220px; border-radius: 12px; overflow: hidden;
  background: linear-gradient(160deg,#1a1a1e 0%,#0c0c0f 55%,#121216 100%);
  border: 2px solid rgba(255,140,0,.25);
  box-shadow: 0 8px 32px rgba(0,0,0,.6), 0 0 20px rgba(255,140,0,.08);
}
.ia-shk-foto { position: relative; width: 100%; height: 160px; overflow: hidden; }
.ia-shk-foto img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; filter: grayscale(1); display: block; }
.ia-shk-foto::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(transparent, #0c0c0f); z-index: 2; pointer-events: none; }
.ia-shk-foto .initialen-groot { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 900; color: rgba(255,140,0,.2); background: var(--surface-card); }
.ia-shk-badge { position: absolute; top: 10px; right: 10px; z-index: 5; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.1); }
.ia-shk-badge .type-icoon { width: 16px; height: 16px; }
.ia-shk-info { padding: 12px 14px 14px; }
.ia-shk-naam { font-size: 17px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 4px; }
.ia-shk-rol { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--staf-rol-text); margin-bottom: 10px; }
.ia-shk-rol .type-icoon { width: 13px; height: 13px; }
.ia-shk-section { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 5px; }
.ia-shk-kopp { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light); }
.ia-shk-kline { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-primary); font-weight: 500; }
.ia-shk-kline .dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.ia-shk-kline .krol { font-size: 9px; color: var(--text-tertiary); margin-left: auto; }
.ia-shk-hist { display: flex; flex-direction: column; gap: 0; }
.ia-shk-hline { display: flex; align-items: baseline; gap: 8px; padding: 3px 0; border-bottom: 1px solid var(--border-light); font-size: 10px; }
.ia-shk-hline:last-child { border-bottom: none; }
.ia-shk-hline .szn { color: var(--text-tertiary); font-variant-numeric: tabular-nums; min-width: 52px; flex-shrink: 0; font-weight: 600; }
.ia-shk-hline .teams { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.ia-shk-hline .tl { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); }
.ia-shk-hline .tl .dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
.ia-shk-hline .tl .hrol { font-size: 8px; color: var(--text-tertiary); margin-left: auto; }

/* ── Dialog ── */
.ia-dialog-wrap {
  position: fixed; inset: 0; z-index: 9990; display: flex; align-items: center;
  justify-content: center; background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
  opacity: 0; transition: opacity 200ms ease;
}
.ia-dialog-wrap.visible { opacity: 1; }
.ia-dialog {
  background: var(--surface-page); border: 1px solid var(--border-default); border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,.7); overflow: hidden;
  transform: scale(0.95) translateY(8px); transition: transform 200ms ease;
  display: flex; flex-direction: column; max-height: 90vh;
}
.ia-dialog-wrap.visible .ia-dialog { transform: scale(1) translateY(0); }
.ia-dialog-header {
  display: flex; align-items: center; gap: 12px; padding: 16px 20px;
  border-bottom: 1px solid var(--border-light); flex-shrink: 0;
}
.ia-dialog-titel { font-size: 15px; font-weight: 800; color: var(--text-primary); flex: 1; }
.ia-dialog-sub { font-size: 11px; color: var(--text-tertiary); }
.ia-close-btn {
  width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border-default);
  background: none; color: var(--text-tertiary); cursor: pointer; font-size: 16px; line-height: 1;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-family: inherit; transition: all 120ms;
}
.ia-close-btn:hover { color: var(--text-primary); border-color: var(--text-muted); }
.ia-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border-light); flex-shrink: 0; padding: 0 20px; }
.ia-tab {
  padding: 10px 16px; font-size: 12px; font-weight: 600; color: var(--text-tertiary);
  cursor: pointer; border: none; background: none; font-family: inherit;
  border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms;
}
.ia-tab.active { color: var(--ow-accent); border-bottom-color: var(--ow-accent); }
.ia-tab:hover:not(.active) { color: var(--text-secondary); }
.ia-dialog-body { flex: 1; overflow-y: auto; padding: 20px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent; }
.ia-tabpanel { display: none; }
.ia-tabpanel.active { display: block; }

/* ── Speler-dialog specifiek ── */
.ia-sp-hero { display: flex; gap: 16px; margin-bottom: 20px; }
.ia-sp-foto { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--surface-card); border: 2px solid var(--status-color, rgba(255,255,255,.3)); }
.ia-sp-foto img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; }
.ia-sp-foto .no-foto { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: rgba(255,255,255,.15); }
.ia-sp-kenmerken { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.ia-kenmerk-rij { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
.ia-kenmerk-label { color: var(--text-tertiary); font-weight: 500; }
.ia-kenmerk-val { color: var(--text-primary); font-weight: 700; }
.ia-status-chip {
  padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid currentColor;
}
.ia-pad-entry { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-light); font-size: 12px; }
.ia-pad-entry:last-child { border-bottom: none; }
.ia-pad-seizoen { color: var(--text-tertiary); min-width: 60px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ia-pad-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ia-pad-team { color: var(--text-primary); font-weight: 600; }
.ia-memo-kaart { padding: 12px; border-radius: 8px; border: 1px solid var(--border-default); background: var(--surface-card); margin-bottom: 8px; cursor: pointer; transition: border-color 120ms; }
.ia-memo-kaart:hover { border-color: var(--ow-accent); }
.ia-memo-kaart .mc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.ia-memo-kaart .mc-titel { font-size: 13px; font-weight: 700; color: var(--text-primary); flex: 1; }
.ia-memo-kaart .mc-desc { font-size: 11px; color: var(--text-tertiary); line-height: 1.5; }
.ia-memo-kaart .mc-prio {
  font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
  padding: 1px 6px; border-radius: 4px;
}
.ia-memo-kaart .mc-prio.BLOCKER { background: rgba(239,68,68,.15); color: #ef4444; }
.ia-memo-kaart .mc-prio.HOOG    { background: rgba(255,107,0,.12); color: var(--ow-accent); }
.ia-memo-kaart .mc-prio.MIDDEL  { background: rgba(245,158,11,.12); color: var(--val-warn); }
.ia-memo-kaart .mc-prio.LAAG    { background: rgba(59,130,246,.12); color: #60a5fa; }
.ia-memo-kaart .mc-prio.INFO    { background: rgba(139,92,246,.12); color: #a78bfa; }
.ia-leeg-state { padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; }

/* ── Team-dialog ── */
.ia-team-hero { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--border-light); margin-bottom: 16px; }
.ia-team-band { width: 5px; height: 48px; border-radius: 3px; flex-shrink: 0; }
.ia-team-stats { display: flex; gap: 20px; margin-bottom: 12px; }
.ia-team-stat { display: flex; flex-direction: column; gap: 2px; }
.ia-team-stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.ia-team-stat-val { font-size: 16px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.ia-speler-lijstje { display: flex; flex-direction: column; gap: 6px; }
.ia-sp-minirij { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border-light); font-size: 12px; }
.ia-sp-minirij img { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
.ia-sp-minirij .no-foto-sm { width: 28px; height: 28px; border-radius: 4px; background: var(--surface-card); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: var(--text-muted); flex-shrink: 0; }
.ia-sp-minirij .mnaam { flex: 1; font-weight: 600; color: var(--text-primary); }
.ia-sp-minirij .mleeft { font-size: 11px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.ia-sexe-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 12px 0 6px; }

/* ── Staf-dialog ── */
.ia-staf-hero { display: flex; gap: 16px; margin-bottom: 20px; }
.ia-staf-foto { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--staf-accent-dim); border: 2px solid var(--staf-accent-border); }
.ia-staf-foto img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
.ia-staf-foto .initialen { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: var(--staf-accent); }

/* ── Memo-drawer ── */
.ia-drawer-wrap {
  position: fixed; inset: 0; z-index: 9990; background: rgba(0,0,0,.5);
  opacity: 0; transition: opacity 200ms ease;
}
.ia-drawer-wrap.visible { opacity: 1; }
.ia-drawer {
  position: absolute; top: 0; right: 0; bottom: 0; width: 400px; max-width: 95vw;
  background: var(--surface-page); border-left: 1px solid var(--border-default);
  box-shadow: -8px 0 40px rgba(0,0,0,.5); overflow-y: auto;
  transform: translateX(100%); transition: transform 220ms cubic-bezier(0.4,0,0.2,1);
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent;
}
.ia-drawer-wrap.visible .ia-drawer { transform: translateX(0); }
.ia-drawer-header { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid var(--border-light); }
.ia-drawer-body { padding: 20px; }
.ia-memo-prio-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.ia-memo-prio-badge.BLOCKER { background: rgba(239,68,68,.15); color: #ef4444; border: 1px solid rgba(239,68,68,.3); }
.ia-memo-prio-badge.HOOG    { background: rgba(255,107,0,.12); color: var(--ow-accent); border: 1px solid rgba(255,107,0,.3); }
.ia-memo-prio-badge.MIDDEL  { background: rgba(245,158,11,.12); color: var(--val-warn); border: 1px solid rgba(245,158,11,.3); }
.ia-memo-prio-badge.LAAG    { background: rgba(59,130,246,.12); color: #60a5fa; border: 1px solid rgba(59,130,246,.3); }
.ia-memo-prio-badge.INFO    { background: rgba(139,92,246,.12); color: #a78bfa; border: 1px solid rgba(139,92,246,.3); }
.ia-memo-meta { font-size: 11px; color: var(--text-tertiary); margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap; }
.ia-memo-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-top: 16px; padding: 14px; border-radius: 8px; background: var(--surface-card); border: 1px solid var(--border-light); }

/* ── Nieuwe-memo-dialog ── */
.ia-nm-context {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px;
  background: var(--surface-card); border: 1px solid var(--border-default); margin-bottom: 16px;
  font-size: 12px; color: var(--text-secondary);
}
.ia-nm-context .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ia-form-row { margin-bottom: 14px; }
.ia-form-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); margin-bottom: 5px; }
.ia-form-input, .ia-form-textarea, .ia-form-select {
  width: 100%; background: var(--surface-card); border: 1px solid var(--border-default);
  border-radius: 8px; color: var(--text-primary); font-size: 13px; font-family: inherit;
  padding: 9px 12px; outline: none; box-sizing: border-box; resize: vertical;
  transition: border-color 120ms;
}
.ia-form-input:focus, .ia-form-textarea:focus, .ia-form-select:focus { border-color: rgba(255,107,0,.4); }
.ia-form-textarea { min-height: 80px; }
.ia-form-select { appearance: none; }
.ia-prio-knoppen { display: flex; gap: 6px; flex-wrap: wrap; }
.ia-prio-btn {
  padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
  border: 1px solid var(--border-default); background: var(--surface-card); color: var(--text-tertiary);
  cursor: pointer; font-family: inherit; transition: all 120ms;
}
.ia-prio-btn.active { border-color: var(--ow-accent); background: rgba(255,107,0,.1); color: var(--ow-accent); }
.ia-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-light); }
.ia-btn-secondary {
  padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--border-default); background: none; color: var(--text-tertiary);
  cursor: pointer; font-family: inherit; transition: all 120ms;
}
.ia-btn-secondary:hover { color: var(--text-primary); border-color: var(--text-muted); }
.ia-btn-primary {
  padding: 8px 20px; border-radius: 8px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--ow-accent); background: rgba(255,107,0,.15); color: var(--ow-accent);
  cursor: pointer; font-family: inherit; transition: all 120ms;
}
.ia-btn-primary:hover { background: rgba(255,107,0,.25); }
`;

(function injectCSS() {
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
})();

// ── SVG helpers ───────────────────────────────────────────────────────────────
const ICOON_TECHNISCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
const ICOON_MEDISCH   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11v4"/><path d="M14 13h-4"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M18 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/></svg>`;
const ICOON_ONDERST   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`;
const ICOON_MEMO      = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/><path d="M8 12h8M8 15h8M8 18h5"/></svg>`;

function stafTypeIcoon(type) {
  if (type === 'medisch') return ICOON_MEDISCH;
  if (type === 'ondersteunend') return ICOON_ONDERST;
  return ICOON_TECHNISCH;
}

function catKleur(kleur) {
  const map = { rood: '#dc2626', oranje: '#f97316', geel: '#eab308', groen: '#047857', blauw: '#1d4ed8', senior: '#94a3b8', paars: '#7e22ce' };
  return map[kleur] ?? '#666';
}

function statusLabel(status) {
  const map = { BESCHIKBAAR: 'Beschikbaar', TWIJFELT: 'Twijfelt', GEBLESSEERD: 'Geblesseerd', GAAT_STOPPEN: 'Stopt', NIEUW: 'Nieuw lid', AR: 'AR' };
  return map[status] ?? status;
}

function statusColor(status) {
  if (status === 'TWIJFELT')    return 'var(--status-twijfelt-outline)';
  if (status === 'GAAT_STOPPEN') return 'var(--status-stopt-outline)';
  if (status === 'AR')          return 'var(--status-ar-outline)';
  if (status === 'GEBLESSEERD') return 'rgba(239,68,68,.7)';
  return 'var(--status-beschikbaar-outline)';
}

function leeftDeel(leeftijd) {
  const intDeel = Math.floor(leeftijd);
  const decDeel = (leeftijd - intDeel).toFixed(2).slice(1); // ".xx"
  return { geheel: intDeel, dec: decDeel };
}

// ── Drag-drop ─────────────────────────────────────────────────────────────────
// Globale registratie: één set document-listeners, meerdere dropZone-configuraties.
let _dragInit = false;
let _dragSelectors = new Set();
const _dropZones = [];

function _ensureDragListeners() {
  if (_dragInit) return;
  _dragInit = true;

  document.addEventListener('dragstart', (e) => {
    for (const sel of _dragSelectors) {
      const el = e.target.closest(sel);
      if (el) {
        const data = { type: el.dataset.dragType ?? 'speler', id: el.dataset.dragId, vanTeamId: el.dataset.dragVanTeam ?? null };
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
        return;
      }
    }
  });

  document.addEventListener('dragend', (e) => {
    for (const sel of _dragSelectors) {
      const el = e.target.closest(sel);
      if (el) el.classList.remove('dragging');
    }
    document.querySelectorAll('.drag-over').forEach(z => z.classList.remove('drag-over'));
  });

  document.addEventListener('dragover', (e) => {
    for (const { selector } of _dropZones) {
      const zone = e.target.closest(selector);
      if (zone) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.drag-over').forEach(z => z !== zone && z.classList.remove('drag-over'));
        zone.classList.add('drag-over');
        return;
      }
    }
  });

  document.addEventListener('dragleave', (e) => {
    for (const { selector } of _dropZones) {
      const zone = e.target.closest(selector);
      if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    for (const { selector, onDrop } of _dropZones) {
      const zone = e.target.closest(selector);
      if (zone) {
        e.preventDefault();
        zone.classList.remove('drag-over');
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          onDrop(data, zone);
        } catch { /* ongeldige payload */ }
        return;
      }
    }
  });
}

/**
 * @param {{dragSelector: string, dropZones: Array<{selector: string, onDrop: function}>}} opts
 */
export function initDragDrop(opts) {
  const { dragSelector, dropZones } = opts;
  _dragSelectors.add(dragSelector);
  // Nieuwe dropZones toevoegen; bestaande zelfde selector + handler niet dupliceren
  for (const dz of dropZones) {
    if (!_dropZones.some(existing => existing.selector === dz.selector && existing.onDrop === dz.onDrop)) {
      _dropZones.push(dz);
    }
  }
  _ensureDragListeners();
}

// ── Hover-kaart systeem ───────────────────────────────────────────────────────
let _hoverEl = null;
let _hoverTimer = null;
let _warmDelay = false; // snellere swap na eerste hover

function _getOrCreateHoverEl() {
  if (!_hoverEl) {
    _hoverEl = document.createElement('div');
    _hoverEl.className = 'ia-hover-kaart';
    document.body.appendChild(_hoverEl);
  }
  return _hoverEl;
}

function _positionHover(el, x, y) {
  const pad = 12;
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = parseInt(el.style.width) || 220;
  const h = parseInt(el.style.height) || 300;
  let left = x + pad;
  let top  = y + pad;
  if (left + w > vw - pad) left = x - w - pad;
  if (top + h > vh - pad)  top  = vh - h - pad;
  el.style.left = `${Math.max(pad, left)}px`;
  el.style.top  = `${Math.max(pad, top)}px`;
}

export function showSpelerHoverKaart(speler, x, y) {
  clearTimeout(_hoverTimer);
  // Niet tonen als er een dialog/drawer open staat
  if (document.body.classList.contains('ia-modal-open')) return;
  // Als kaart al zichtbaar voor dezelfde speler: alleen positie bijwerken (volg muis)
  if (_hoverEl && _hoverEl.dataset.spelerId === speler.id && _hoverEl.classList.contains('visible')) {
    _positionHover(_hoverEl, x, y);
    return;
  }
  const delay = _warmDelay ? 60 : 240;
  _hoverTimer = setTimeout(() => {
    const el = _getOrCreateHoverEl();
    const kl = leeftijdKlasse(speler.leeftijd);
    const { geheel, dec } = leeftDeel(speler.leeftijd);
    el.style.width = '200px'; el.style.height = '300px';
    el.innerHTML = `
      <div class="ia-hk leeft-${kl}" style="--status-color:${statusColor(speler.status)}">
        <div class="c-inner">
          <div class="c-header">
            <div class="c-header-left">
              <span class="c-chip">${statusLabel(speler.status)}</span>
            </div>
            <div class="c-leeft">
              <span class="cl">${geheel}</span>
              <span class="cd">${dec}</span>
              <span class="cjr">jr</span>
            </div>
          </div>
          <div class="c-foto">
            ${speler.fotoUrl ? `<img src="${speler.fotoUrl}" alt="">` : `<div class="no-foto">${speler.roepnaam.charAt(0)}</div>`}
            <div class="c-roep">
              <div class="cr">${speler.roepnaam.toUpperCase()}</div>
              <div class="cas">${[speler.tussenvoegsel, speler.achternaam].filter(Boolean).join(' ')}</div>
            </div>
          </div>
          <div class="c-footer">
            <span class="tb${!speler.huidigTeam ? ' tb-empty' : ''}">${speler.huidigTeam ? speler.huidigTeam : '—'}</span>
            <span class="tb${!speler.ingedeeldTeam ? ' tb-empty' : ''}">${speler.ingedeeldTeam ? speler.ingedeeldTeam : '—'}</span>
          </div>
        </div>
      </div>`;
    el.dataset.spelerId = speler.id;
    _positionHover(el, x, y);
    el.classList.add('visible');
    _warmDelay = true;
  }, delay);
}

export function hideSpelerHoverKaart() {
  clearTimeout(_hoverTimer);
  if (_hoverEl) {
    _hoverEl.classList.remove('visible');
    delete _hoverEl.dataset.spelerId;
    // reset warm na 1s inactiviteit
    setTimeout(() => { _warmDelay = false; }, 1000);
  }
}

let _stafHoverEl = null;
let _stafHoverTimer = null;
let _stafWarm = false;

function _getOrCreateStafHoverEl() {
  if (!_stafHoverEl) {
    _stafHoverEl = document.createElement('div');
    _stafHoverEl.className = 'ia-hover-kaart';
    document.body.appendChild(_stafHoverEl);
  }
  return _stafHoverEl;
}

export function showStafHoverKaart(staf, x, y) {
  clearTimeout(_stafHoverTimer);
  if (document.body.classList.contains('ia-modal-open')) return;
  if (_stafHoverEl && _stafHoverEl.dataset.stafId === staf.id && _stafHoverEl.classList.contains('visible')) {
    _positionHover(_stafHoverEl, x, y);
    return;
  }
  const delay = _stafWarm ? 60 : 240;
  _stafHoverTimer = setTimeout(() => {
    const el = _getOrCreateStafHoverEl();
    el.style.width = '220px'; el.style.height = 'auto';
    const icoon = stafTypeIcoon(staf.type);
    const fotoDeel = staf.fotoUrl
      ? `<img src="${staf.fotoUrl}" alt="">`
      : `<div class="initialen-groot">${staf.naam.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>`;

    const koppHtml = staf.koppelingen.slice(0, 3).map(k => `
      <div class="ia-shk-kline">
        <span class="dot" style="background:${catKleur(k.teamKleur)}"></span>
        ${k.teamNaam}
        <span class="krol">${k.rol}</span>
      </div>`).join('');

    const histHtml = staf.historie.slice(0, 5).map(h => `
      <div class="ia-shk-hline">
        <span class="szn">${h.seizoen}</span>
        <div class="teams">
          ${h.teams.map(t => `<div class="tl"><span class="dot" style="background:${catKleur(t.kleur)}"></span> ${t.team} <span class="hrol">${t.rol}</span></div>`).join('')}
        </div>
      </div>`).join('');

    el.innerHTML = `
      <div class="ia-shk">
        <div class="ia-shk-foto">
          ${fotoDeel}
          <div class="ia-shk-badge"><span class="type-icoon ${staf.type}" style="width:16px;height:16px">${icoon}</span></div>
        </div>
        <div class="ia-shk-info">
          <div class="ia-shk-naam">${staf.naam}</div>
          <div class="ia-shk-rol"><span class="type-icoon ${staf.type}" style="width:13px;height:13px">${icoon}</span> ${staf.rol}</div>
          <div class="ia-shk-section">Koppelingen</div>
          <div class="ia-shk-kopp">${koppHtml}</div>
          <div class="ia-shk-section">Historie</div>
          <div class="ia-shk-hist">${histHtml}</div>
        </div>
      </div>`;
    el.dataset.stafId = staf.id;
    _positionHover(el, x, y);
    el.classList.add('visible');
    _stafWarm = true;
  }, delay);
}

export function hideStafHoverKaart() {
  clearTimeout(_stafHoverTimer);
  if (_stafHoverEl) {
    _stafHoverEl.classList.remove('visible');
    delete _stafHoverEl.dataset.stafId;
    setTimeout(() => { _stafWarm = false; }, 1000);
  }
}

// ── Dialog systeem ────────────────────────────────────────────────────────────
// Stack van open dialog/drawer wraps; Escape sluit alleen de bovenste.
const _modalStack = [];

function _registreerModal(wrap, sluiter) {
  _modalStack.push({ wrap, sluiter });
  document.body.classList.add('ia-modal-open');
  if (_modalStack.length === 1) document.addEventListener('keydown', _globalEscape);
}

function _deregistreerModal(wrap) {
  const idx = _modalStack.findIndex(m => m.wrap === wrap);
  if (idx !== -1) _modalStack.splice(idx, 1);
  if (_modalStack.length === 0) {
    document.body.classList.remove('ia-modal-open');
    document.removeEventListener('keydown', _globalEscape);
  }
}

function _globalEscape(e) {
  if (e.key !== 'Escape' || _modalStack.length === 0) return;
  const top = _modalStack[_modalStack.length - 1];
  top.sluiter(top.wrap);
}

function _maakDialogWrap() {
  const wrap = document.createElement('div');
  wrap.className = 'ia-dialog-wrap';
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) _sluitDialog(wrap);
  });
  document.body.appendChild(wrap);
  _registreerModal(wrap, _sluitDialog);
  requestAnimationFrame(() => wrap.classList.add('visible'));
  return wrap;
}

function _sluitDialog(wrap) {
  wrap.classList.remove('visible');
  _deregistreerModal(wrap);
  setTimeout(() => wrap.remove(), 220);
}

function _initTabs(dialog) {
  dialog.querySelectorAll('.ia-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.panel;
      dialog.querySelectorAll('.ia-tab').forEach(t => t.classList.remove('active'));
      dialog.querySelectorAll('.ia-tabpanel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      dialog.querySelector(`[data-panelid="${panel}"]`)?.classList.add('active');
    });
  });
}

// ── openSpelerDialog ──────────────────────────────────────────────────────────
export function openSpelerDialog(spelerId) {
  const speler = getSpeler(spelerId);
  if (!speler) return;
  const memos = getMemosVoor('SPELER', spelerId);
  const { geheel, dec } = leeftDeel(speler.leeftijd);
  const vollNaam = [speler.roepnaam, speler.tussenvoegsel, speler.achternaam].filter(Boolean).join(' ');

  const padHtml = speler.spelerspad.length
    ? speler.spelerspad.map(p => `
        <div class="ia-pad-entry">
          <span class="ia-pad-seizoen">${p.seizoen}</span>
          <span class="ia-pad-dot" style="background:${catKleur(p.kleur)}"></span>
          <span class="ia-pad-team">${p.team}</span>
        </div>`).join('')
    : '<div class="ia-leeg-state">Geen spelerspad beschikbaar</div>';

  const memosHtml = memos.length
    ? memos.map(m => `
        <div class="ia-memo-kaart" data-memo-id="${m.id}">
          <div class="mc-header">
            <span class="mc-titel">${m.titel}</span>
            <span class="mc-prio ${m.prioriteit}">${m.prioriteit}</span>
          </div>
          <div class="mc-desc">${m.beschrijving}</div>
        </div>`).join('')
    : '<div class="ia-leeg-state">Geen memo\'s</div>';

  const wrap = _maakDialogWrap();
  wrap.innerHTML = `
    <div class="ia-dialog" style="width:480px" role="dialog" aria-modal="true" aria-label="${vollNaam}">
      <div class="ia-dialog-header">
        <div class="ia-sp-foto" style="width:48px;height:48px;--status-color:${statusColor(speler.status)}">
          ${speler.fotoUrl ? `<img src="${speler.fotoUrl}" alt="">` : `<div class="no-foto">${speler.roepnaam.charAt(0)}</div>`}
        </div>
        <div style="flex:1">
          <div class="ia-dialog-titel">${vollNaam}</div>
          <div class="ia-dialog-sub">${speler.geslacht === 'V' ? 'Dame' : 'Heer'} · ${geheel}${dec} jr · ${speler.rel_code}</div>
        </div>
        <button class="ia-close-btn" aria-label="Sluit">×</button>
      </div>
      <div class="ia-tabs">
        <button class="ia-tab active" data-panel="kenmerken">Kenmerken</button>
        <button class="ia-tab" data-panel="pad">Pad</button>
        <button class="ia-tab" data-panel="memos">Memo's ${memos.length > 0 ? `<span style="margin-left:4px;font-size:9px;background:rgba(255,107,0,.15);color:var(--ow-accent);padding:1px 5px;border-radius:10px;font-weight:800">${memos.length}</span>` : ''}</button>
      </div>
      <div class="ia-dialog-body">
        <div class="ia-tabpanel active" data-panelid="kenmerken">
          <div class="ia-sp-hero">
            <div class="ia-sp-foto" style="--status-color:${statusColor(speler.status)}">
              ${speler.fotoUrl ? `<img src="${speler.fotoUrl}" alt="">` : `<div class="no-foto">${speler.roepnaam.charAt(0)}</div>`}
            </div>
            <div class="ia-sp-kenmerken">
              <div class="ia-kenmerk-rij">
                <span class="ia-kenmerk-label">Status</span>
                <span class="ia-status-chip" style="color:${statusColor(speler.status)}">${statusLabel(speler.status)}</span>
              </div>
              <div class="ia-kenmerk-rij">
                <span class="ia-kenmerk-label">Leeftijd</span>
                <span class="ia-kenmerk-val">${geheel}${dec} jr</span>
              </div>
              <div class="ia-kenmerk-rij">
                <span class="ia-kenmerk-label">Geslacht</span>
                <span class="ia-kenmerk-val">${speler.geslacht === 'V' ? 'Dame' : 'Heer'}</span>
              </div>
              <div class="ia-kenmerk-rij">
                <span class="ia-kenmerk-label">USS</span>
                <span class="ia-kenmerk-val">${speler.ussScore !== null ? speler.ussScore.toFixed(1) : '—'}</span>
              </div>
              <div class="ia-kenmerk-rij">
                <span class="ia-kenmerk-label">Huidig team</span>
                <span class="ia-kenmerk-val">${speler.huidigTeam ?? '—'}</span>
              </div>
              <div class="ia-kenmerk-rij">
                <span class="ia-kenmerk-label">Ingedeeld</span>
                <span class="ia-kenmerk-val">${speler.ingedeeldTeam ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="ia-tabpanel" data-panelid="pad">${padHtml}</div>
        <div class="ia-tabpanel" data-panelid="memos">${memosHtml}</div>
      </div>
    </div>`;

  wrap.querySelector('.ia-close-btn').addEventListener('click', () => _sluitDialog(wrap));
  _initTabs(wrap);

  // Klik op memo-kaart → open memo-drawer
  wrap.querySelectorAll('[data-memo-id]').forEach(el => {
    el.addEventListener('click', () => openMemoDrawer(el.dataset.memoId));
  });
}

// ── openTeamDialog ────────────────────────────────────────────────────────────
export function openTeamDialog(teamId) {
  const team = getTeam(teamId);
  if (!team) return;
  const dames = team.dames.map(getSpeler).filter(Boolean);
  const heren = team.heren.map(getSpeler).filter(Boolean);
  const stafLeden = team.staf.map(getStaf).filter(Boolean);
  const memos = getMemosVoor('TEAM', teamId);

  function spelerRij(sp) {
    const { geheel, dec } = leeftDeel(sp.leeftijd);
    return `<div class="ia-sp-minirij">
      ${sp.fotoUrl ? `<img src="${sp.fotoUrl}" alt="">` : `<div class="no-foto-sm">${sp.roepnaam[0]}</div>`}
      <span class="mnaam">${sp.roepnaam} ${[sp.tussenvoegsel, sp.achternaam].filter(Boolean).join(' ')}</span>
      <span class="mleeft">${geheel}${dec}</span>
    </div>`;
  }

  const overzichtHtml = `
    <div class="ia-team-stats">
      <div class="ia-team-stat"><span class="ia-team-stat-label">Dames</span><span class="ia-team-stat-val" style="color:var(--sexe-v)">${dames.length}</span></div>
      <div class="ia-team-stat"><span class="ia-team-stat-label">Heren</span><span class="ia-team-stat-val" style="color:var(--sexe-h)">${heren.length}</span></div>
      <div class="ia-team-stat"><span class="ia-team-stat-label">USS</span><span class="ia-team-stat-val">${team.ussScore ? team.ussScore.toFixed(1) : '—'}</span></div>
      <div class="ia-team-stat"><span class="ia-team-stat-label">Gem. leeftijd</span><span class="ia-team-stat-val">${team.gemLeeftijd.toFixed(1)}</span></div>
    </div>
    <div class="ia-sexe-label">Dames</div>
    <div class="ia-speler-lijstje">${dames.map(spelerRij).join('') || '<div class="ia-leeg-state">Geen dames</div>'}</div>
    <div class="ia-sexe-label">Heren</div>
    <div class="ia-speler-lijstje">${heren.map(spelerRij).join('') || '<div class="ia-leeg-state">Geen heren</div>'}</div>
    ${stafLeden.length ? `<div class="ia-sexe-label">Staf</div>
    <div class="ia-speler-lijstje">${stafLeden.map(s => `<div class="ia-sp-minirij">${s.fotoUrl ? `<img src="${s.fotoUrl}" alt="">` : `<div class="no-foto-sm">${s.naam[0]}</div>`}<span class="mnaam">${s.naam}</span><span class="mleeft" style="color:var(--staf-accent)">${s.rol}</span></div>`).join('')}</div>` : ''}`;

  const valHtml = team.valMeldingen.length
    ? team.valMeldingen.map(m => `<div class="val-item warn"><div class="icn">⚠</div><div class="body"><div class="regel">${m}</div></div></div>`).join('')
    : '<div class="val-item ok"><div class="icn">✓</div><div class="body"><div class="regel">Alle validaties oké</div></div></div>';

  const memosHtml = memos.length
    ? memos.map(m => `<div class="ia-memo-kaart" data-memo-id="${m.id}"><div class="mc-header"><span class="mc-titel">${m.titel}</span><span class="mc-prio ${m.prioriteit}">${m.prioriteit}</span></div><div class="mc-desc">${m.beschrijving}</div></div>`).join('')
    : '<div class="ia-leeg-state">Geen memo\'s</div>';

  const wrap = _maakDialogWrap();
  wrap.innerHTML = `
    <div class="ia-dialog" style="width:560px" role="dialog" aria-modal="true" aria-label="${team.naam}">
      <div class="ia-dialog-header">
        <div class="ia-team-band" style="background:${catKleur(team.kleur)}"></div>
        <div style="flex:1">
          <div class="ia-dialog-titel">${team.naam}</div>
          <div class="ia-dialog-sub">${team.sub} · ${team.type}</div>
        </div>
        <button class="ia-close-btn" aria-label="Sluit">×</button>
      </div>
      <div class="ia-tabs">
        <button class="ia-tab active" data-panel="overzicht">Overzicht</button>
        <button class="ia-tab" data-panel="validatie">Validatie</button>
        <button class="ia-tab" data-panel="notities">Memo's${memos.length > 0 ? ` <span style="margin-left:4px;font-size:9px;background:rgba(255,107,0,.15);color:var(--ow-accent);padding:1px 5px;border-radius:10px;font-weight:800">${memos.length}</span>` : ''}</button>
      </div>
      <div class="ia-dialog-body">
        <div class="ia-tabpanel active" data-panelid="overzicht">${overzichtHtml}</div>
        <div class="ia-tabpanel" data-panelid="validatie">${valHtml}</div>
        <div class="ia-tabpanel" data-panelid="notities">${memosHtml}</div>
      </div>
    </div>`;

  wrap.querySelector('.ia-close-btn').addEventListener('click', () => _sluitDialog(wrap));
  _initTabs(wrap);
  wrap.querySelectorAll('[data-memo-id]').forEach(el => {
    el.addEventListener('click', () => openMemoDrawer(el.dataset.memoId));
  });
}

// ── openStafDialog ────────────────────────────────────────────────────────────
export function openStafDialog(stafId) {
  const staf = getStaf(stafId);
  if (!staf) return;
  const memos = getMemosVoor('STAF', stafId);
  const icoon = stafTypeIcoon(staf.type);

  const fotoDeel = staf.fotoUrl
    ? `<img src="${staf.fotoUrl}" alt="">`
    : `<div class="initialen">${staf.naam.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>`;

  const histHtml = staf.historie.map(h => `
    <div class="ia-pad-entry">
      <span class="ia-pad-seizoen">${h.seizoen}</span>
      ${h.teams.map(t => `<span class="ia-pad-dot" style="background:${catKleur(t.kleur)}"></span><span class="ia-pad-team">${t.team} — ${t.rol}</span>`).join('')}
    </div>`).join('');

  const memosHtml = memos.length
    ? memos.map(m => `<div class="ia-memo-kaart" data-memo-id="${m.id}"><div class="mc-header"><span class="mc-titel">${m.titel}</span><span class="mc-prio ${m.prioriteit}">${m.prioriteit}</span></div><div class="mc-desc">${m.beschrijving}</div></div>`).join('')
    : '<div class="ia-leeg-state">Geen memo\'s</div>';

  const wrap = _maakDialogWrap();
  wrap.innerHTML = `
    <div class="ia-dialog" style="width:480px" role="dialog" aria-modal="true" aria-label="${staf.naam}">
      <div class="ia-dialog-header">
        <div class="ia-staf-foto">${fotoDeel}</div>
        <div style="flex:1">
          <div class="ia-dialog-titel">${staf.naam}</div>
          <div class="ia-dialog-sub">${staf.rol} · ${staf.type}</div>
        </div>
        <button class="ia-close-btn" aria-label="Sluit">×</button>
      </div>
      <div class="ia-tabs">
        <button class="ia-tab active" data-panel="historie">Historie</button>
        <button class="ia-tab" data-panel="memos">Memo's${memos.length > 0 ? ` <span style="margin-left:4px;font-size:9px;background:rgba(255,107,0,.15);color:var(--ow-accent);padding:1px 5px;border-radius:10px;font-weight:800">${memos.length}</span>` : ''}</button>
      </div>
      <div class="ia-dialog-body">
        <div class="ia-tabpanel active" data-panelid="historie">
          <div class="ia-staf-hero">
            <div class="ia-staf-foto">${fotoDeel}</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:800;color:var(--text-primary)">${staf.naam}</div>
              <div style="font-size:11px;color:var(--staf-rol-text);display:flex;align-items:center;gap:4px;margin-top:4px">
                <span class="type-icoon ${staf.type}" style="width:12px;height:12px">${icoon}</span> ${staf.rol}
              </div>
              ${staf.isSpeler ? '<div style="font-size:10px;color:var(--text-tertiary);margin-top:4px">Speelt ook als speler</div>' : ''}
            </div>
          </div>
          ${histHtml || '<div class="ia-leeg-state">Geen historie</div>'}
        </div>
        <div class="ia-tabpanel" data-panelid="memos">${memosHtml}</div>
      </div>
    </div>`;

  wrap.querySelector('.ia-close-btn').addEventListener('click', () => _sluitDialog(wrap));
  _initTabs(wrap);
  wrap.querySelectorAll('[data-memo-id]').forEach(el => {
    el.addEventListener('click', () => openMemoDrawer(el.dataset.memoId));
  });
}

// ── openMemoDrawer ────────────────────────────────────────────────────────────
export function openMemoDrawer(memoId) {
  const memo = getMemo(memoId);
  if (!memo) return;

  const statusLabel_m = { OPEN: 'Open', IN_BESPREKING: 'In bespreking', OPGELOST: 'Opgelost', RISICO: 'Risico' };

  const wrap = document.createElement('div');
  wrap.className = 'ia-drawer-wrap';
  wrap.innerHTML = `
    <div class="ia-drawer" role="dialog" aria-modal="true" aria-label="${memo.titel}">
      <div class="ia-drawer-header">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:800;color:var(--text-primary)">${memo.titel}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">${memo.entiteitLabel} · ${memo.datum}</div>
        </div>
        <button class="ia-close-btn" aria-label="Sluit">×</button>
      </div>
      <div class="ia-drawer-body">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <span class="ia-memo-prio-badge ${memo.prioriteit}">${memo.prioriteit}</span>
          <span style="font-size:11px;color:var(--text-tertiary);padding:3px 8px;border-radius:5px;background:var(--surface-card);border:1px solid var(--border-default)">${statusLabel_m[memo.status] ?? memo.status}</span>
          ${memo.doelgroep ? `<span style="font-size:11px;color:#60a5fa;padding:3px 8px;border-radius:5px;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2)">${memo.doelgroep}</span>` : ''}
        </div>
        <div class="ia-memo-desc">${memo.beschrijving}</div>
        <div class="ia-memo-meta">
          <span>Type: <strong>${memo.entiteitType}</strong></span>
          <span>Entiteit: <strong>${memo.entiteitLabel}</strong></span>
        </div>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-light)">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">Status wijzigen</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${['OPEN','IN_BESPREKING','OPGELOST','RISICO'].map(s => `<button class="ia-prio-btn${memo.status === s ? ' active' : ''}" data-status="${s}" style="font-size:10px">${statusLabel_m[s]}</button>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(wrap);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) _sluitDrawer(wrap); });
  wrap.querySelector('.ia-close-btn').addEventListener('click', () => _sluitDrawer(wrap));

  // Status-knoppen in drawer — wijzig mock-data status en her-render
  wrap.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const huidigMemo = getMemo(memo.id);
      if (!huidigMemo) return;
      huidigMemo.status = btn.dataset.status;
      // Toon actieve status visueel
      wrap.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('active', b === btn));
      // Zend custom event zodat pagina's (memo.html) kunnen her-renderen
      document.dispatchEvent(new CustomEvent('memo-wijziging', { detail: { memoId: memo.id } }));
    });
  });

  _registreerModal(wrap, _sluitDrawer);
  requestAnimationFrame(() => wrap.classList.add('visible'));
}

function _sluitDrawer(wrap) {
  wrap.classList.remove('visible');
  _deregistreerModal(wrap);
  setTimeout(() => wrap.remove(), 250);
}

// ── openNieuweMemoDialog ──────────────────────────────────────────────────────
/**
 * @param {{ context?: {type:string, id:string|null, label:string, teamKleur?:string, doelgroep?:string}, onCreate?: function }} opts
 */
export function openNieuweMemoDialog(opts = {}) {
  const { context, onCreate } = opts;
  let activePrio = 'MIDDEL';

  const contextHtml = context ? `
    <div class="ia-nm-context">
      ${context.teamKleur ? `<span class="dot" style="background:${catKleur(context.teamKleur)}"></span>` : ''}
      <span style="font-weight:600;color:var(--text-primary)">${context.label}</span>
      <span style="color:var(--text-tertiary);font-size:10px">${context.type}</span>
      ${context.doelgroep ? `<span style="margin-left:auto;font-size:10px;color:#60a5fa">${context.doelgroep}</span>` : ''}
    </div>` : '';

  const wrap = _maakDialogWrap();
  wrap.innerHTML = `
    <div class="ia-dialog" style="width:500px" role="dialog" aria-modal="true" aria-label="Nieuwe memo">
      <div class="ia-dialog-header">
        <div style="flex:1">
          <div class="ia-dialog-titel">Nieuwe memo</div>
          ${context ? `<div class="ia-dialog-sub">Voor: ${context.label}</div>` : ''}
        </div>
        <button class="ia-close-btn" aria-label="Sluit">×</button>
      </div>
      <div class="ia-dialog-body">
        ${contextHtml}
        <div class="ia-form-row">
          <div class="ia-form-label">Titel</div>
          <input class="ia-form-input" id="nm-titel" type="text" placeholder="Waar gaat dit over?">
        </div>
        <div class="ia-form-row">
          <div class="ia-form-label">Beschrijving</div>
          <textarea class="ia-form-textarea" id="nm-beschrijving" placeholder="Details, context, acties..."></textarea>
        </div>
        <div class="ia-form-row">
          <div class="ia-form-label">Prioriteit</div>
          <div class="ia-prio-knoppen" id="nm-prio-knoppen">
            <button class="ia-prio-btn" data-prio="BLOCKER">Blocker</button>
            <button class="ia-prio-btn" data-prio="HOOG">Hoog</button>
            <button class="ia-prio-btn active" data-prio="MIDDEL">Middel</button>
            <button class="ia-prio-btn" data-prio="LAAG">Laag</button>
            <button class="ia-prio-btn" data-prio="INFO">Info</button>
          </div>
        </div>
        ${!context ? `
        <div class="ia-form-row">
          <div class="ia-form-label">Entiteit (optioneel)</div>
          <select class="ia-form-select" id="nm-entiteit">
            <option value="">— Geen koppeling —</option>
            <option value="TC">TC (algemeen)</option>
          </select>
        </div>` : ''}
        <div class="ia-form-actions">
          <button class="ia-btn-secondary" id="nm-annuleer">Annuleer</button>
          <button class="ia-btn-primary" id="nm-opslaan">Memo aanmaken</button>
        </div>
      </div>
    </div>`;

  wrap.querySelector('.ia-close-btn').addEventListener('click', () => _sluitDialog(wrap));
  wrap.querySelector('#nm-annuleer').addEventListener('click', () => _sluitDialog(wrap));

  // Prioriteit knoppen
  wrap.querySelectorAll('[data-prio]').forEach(btn => {
    btn.addEventListener('click', () => {
      activePrio = btn.dataset.prio;
      wrap.querySelectorAll('[data-prio]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Opslaan (mock)
  wrap.querySelector('#nm-opslaan').addEventListener('click', () => {
    const titel = wrap.querySelector('#nm-titel')?.value?.trim();
    const beschrijving = wrap.querySelector('#nm-beschrijving')?.value?.trim();
    if (!titel) { wrap.querySelector('#nm-titel').focus(); return; }
    const nieuwMemo = {
      id: `memo-nieuw-${Date.now()}`,
      titel, beschrijving, status: 'OPEN', prioriteit: activePrio,
      entiteitType: context?.type ?? 'TC',
      entiteitId: context?.id ?? null,
      entiteitLabel: context?.label ?? 'TC',
      doelgroep: context?.doelgroep ?? null,
      datum: new Date().toISOString().slice(0, 10),
    };
    // eslint-disable-next-line no-console
    console.log('[mock] Nieuwe memo aangemaakt:', nieuwMemo);
    if (onCreate) onCreate(nieuwMemo);
    _sluitDialog(wrap);
  });
}

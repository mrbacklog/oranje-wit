/* ═══════════════════════════════════════════════════════════════
   werkindeling-v4.html — JavaScript
   Inhoud van <script> tag (regels 2775-3419), zonder de tags zelf.
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   PANEL TOGGLE SYSTEEM
═══════════════════════════════════════════════════════════════ */
const panels = {
  pool: { el: document.getElementById('drawerPool'), ri: document.getElementById('ri-pool') },
  val:  { el: document.getElementById('drawerVal'),  ri: document.getElementById('ri-val') }
};

let openPanels = { pool: false, val: true };

function togglePanel(name) {
  if (!panels[name]) return;
  const { el, ri } = panels[name];
  openPanels[name] = !openPanels[name];
  el.classList.toggle('closed', !openPanels[name]);
  if (ri) ri.classList.toggle('active', openPanels[name]);
}

// Werkbord stub
document.getElementById('ri-werkbord').addEventListener('click', function() {
  this.classList.toggle('active');
  showToast('Werkbord — wordt geopend als floating panel in v4.1');
});

/* ═══════════════════════════════════════════════════════════════
   ZOOM SYSTEEM
═══════════════════════════════════════════════════════════════ */
let currentZoom = 0.85;
const canvas = document.getElementById('canvas');
const zoomSlider = document.getElementById('zoomSlider');
const zoomLabel = document.getElementById('zoomLabel');
const canvasWrap = document.getElementById('canvasWrap');

function applyZoom(z) {
  currentZoom = Math.max(0.40, Math.min(1.50, z));
  canvas.style.transform = `scale(${currentZoom})`;
  zoomSlider.value = currentZoom;
  zoomLabel.textContent = Math.round(currentZoom * 100) + '%';
  updateZoomLevel();
  updateMinimap();
}

function applyZoomFromUI(z) {
  // Bij slider/knoppen: zoom vanuit linksboven (origin 0 0)
  canvas.style.transformOrigin = '0 0';
  applyZoom(z);
}

function updateZoomLevel() {
  const pct = currentZoom * 100;
  let level, label;

  // Wiskundige breakpoints op basis van canonical W=280px (achtal):
  //   compact → normaal grens: 180px leesbaar op scherm → z=180/280≈0.643 → 64%
  //   normaal → detail grens:  280px volledig op scherm → z=280/280=1.000 → 100%
  if (pct < 64) {
    level = 'compact';
    label = 'Compact';
  } else if (pct < 100) {
    level = 'normaal';
    label = 'Normaal';
  } else {
    level = 'detail';
    label = 'Detail';
  }
  canvas.dataset.zoomLevel = level;
  const badge = document.getElementById('zoomLevelLabel');
  if (badge) badge.textContent = label;

  // Update score-oct labels
  document.querySelectorAll('.score-oct').forEach(oct => {
    const uss = parseFloat(oct.dataset.uss);
    if (isNaN(uss)) return;
    oct.textContent = Math.round(uss);
  });

  // Inverse scaling voor compact: kaartinhoud leesbaar houden bij lage zoom
  // targetReadableZoom = 0.80: we willen dat compact eruitziet als 80%-niveau
  // inverseScale = 0.80 / currentZoom
  // bijv. zoom=55%: inverseScale = 0.80/0.55 = 1.45
  // bijv. zoom=64% (grens): inverseScale = 0.80/0.64 = 1.25
  if (level === 'compact') {
    const targetReadableZoom = 0.80;
    const inverseScale = targetReadableZoom / currentZoom;
    document.querySelectorAll('.team-card .tc-header, .team-card .tc-compact-stats').forEach(el => {
      el.style.transform = `scale(${inverseScale})`;
      el.style.transformOrigin = 'top left';
      el.style.width = `${100 / inverseScale}%`;
    });
  } else {
    document.querySelectorAll('.team-card .tc-header, .team-card .tc-compact-stats').forEach(el => {
      el.style.transform = '';
      el.style.transformOrigin = '';
      el.style.width = '';
    });
  }
}

function changeZoomLevel(delta) {
  applyZoomFromUI(currentZoom + delta);
}

function fitToScreen() {
  // 0.70 = past 2 achtal-kaarten (280px) + viertal op scherm bij nieuwe maten
  canvas.style.transformOrigin = '0 0';
  applyZoom(0.70);
  showToast('Canvas past nu in scherm');
}

// Scroll-zoom met muiswiel — zoom naar muispositie (geen Ctrl vereist)
canvasWrap.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
  const newZoom = Math.min(1.5, Math.max(0.4, currentZoom + delta));

  // Bepaal muispositie relatief aan canvasWrap
  const rect = canvasWrap.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Zet transform-origin op het punt onder de muis (in canvas-coördinaten)
  // zodat dat punt fixed blijft bij schalen
  canvas.style.transformOrigin = mouseX + 'px ' + mouseY + 'px';
  applyZoom(newZoom);
}, { passive: false });


/* ═══════════════════════════════════════════════════════════════
   KAART DRAG (canvas-niveau) — header als drag handle
═══════════════════════════════════════════════════════════════ */
let draggingCard = null;
let cardDragOffsetX = 0;
let cardDragOffsetY = 0;
let cardLongPressTimer = null;
const CARD_LONG_PRESS_MS = 300;

function startDrag(e, cardId) {
  // Alleen starten vanaf de header (cursor: grab)
  const target = e.target.closest('.tc-header');
  if (!target) return;
  e.preventDefault();

  cardLongPressTimer = setTimeout(() => {
    cardLongPressTimer = null;
    const card = document.getElementById(cardId);
    draggingCard = card;
    draggingCard.classList.add('dragging');

    const rect = draggingCard.getBoundingClientRect();
    cardDragOffsetX = (e.clientX - rect.left) / currentZoom;
    cardDragOffsetY = (e.clientY - rect.top) / currentZoom;

    document.addEventListener('mousemove', onCardDragMove);
    document.addEventListener('mouseup', onCardDragEnd);
  }, CARD_LONG_PRESS_MS);

  // Annuleer bij loslaten vóór long-press
  const cancelCardPress = () => {
    if (cardLongPressTimer) { clearTimeout(cardLongPressTimer); cardLongPressTimer = null; }
    document.removeEventListener('mouseup', cancelCardPress);
    document.removeEventListener('mousemove', cancelCardMove);
  };
  const cancelCardMove = (ev) => {
    const dx = ev.clientX - e.clientX;
    const dy = ev.clientY - e.clientY;
    if (Math.sqrt(dx*dx + dy*dy) > 4) cancelCardPress();
  };
  document.addEventListener('mouseup', cancelCardPress);
  document.addEventListener('mousemove', cancelCardMove);
}

function onCardDragMove(e) {
  if (!draggingCard) return;
  const canvasRect = canvasWrap.getBoundingClientRect();
  const x = (e.clientX - canvasRect.left) / currentZoom - cardDragOffsetX;
  const y = (e.clientY - canvasRect.top) / currentZoom - cardDragOffsetY;
  draggingCard.style.left = Math.max(0, x) + 'px';
  draggingCard.style.top = Math.max(0, y) + 'px';
}

function onCardDragEnd() {
  if (!draggingCard) return;
  draggingCard.classList.remove('dragging');
  draggingCard = null;
  document.removeEventListener('mousemove', onCardDragMove);
  document.removeEventListener('mouseup', onCardDragEnd);
}

/* ═══════════════════════════════════════════════════════════════
   SPELER DRAG — klik (<300ms, geen beweging) = profiel
               lang klik (>300ms of >5px beweging) = drag
═══════════════════════════════════════════════════════════════ */

function createSpelerGhost(el, startEvent) {
  const g = el.cloneNode(true);
  g.style.cssText = `position:fixed;pointer-events:none;z-index:9999;opacity:0.85;
    background:var(--bg-2);border:1px solid var(--accent);border-radius:6px;
    padding:4px 8px;font-size:10px;color:var(--text-1);white-space:nowrap;
    box-shadow:0 4px 20px rgba(0,0,0,0.5);transform:scale(1.05);`;
  g.style.left = startEvent.clientX + 12 + 'px';
  g.style.top  = startEvent.clientY - 10 + 'px';
  return g;
}

function highlightDropTargets(e) {
  document.querySelectorAll('.team-card, .pool-list').forEach(el => {
    const rect = el.getBoundingClientRect();
    const over = e.clientX >= rect.left && e.clientX <= rect.right &&
                 e.clientY >= rect.top  && e.clientY <= rect.bottom;
    if (over) {
      el.style.outline = '2px solid var(--accent)';
      el.style.background = 'rgba(255,107,0,0.08)';
    } else {
      el.style.outline = '';
      el.style.background = '';
    }
  });
}

function clearSpelerHighlights() {
  document.querySelectorAll('.team-card, .pool-list').forEach(el => {
    el.style.outline = '';
    el.style.background = '';
  });
}

function findSpelerDropTarget(clientX, clientY) {
  const targets = [
    ...document.querySelectorAll('.team-card'),
    ...document.querySelectorAll('.pool-list')
  ];
  return targets.find(el => {
    const r = el.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right &&
           clientY >= r.top  && clientY <= r.bottom;
  }) || null;
}

function handleSpelerDrop(sourceEl, targetEl) {
  if (targetEl.classList.contains('pool-list')) {
    // Terug naar pool
    if (sourceEl.classList.contains('tc-sp')) {
      const poolSection = targetEl.querySelector('.pool-section-label:last-of-type');
      const poolRow = document.createElement('div');
      const name = sourceEl.querySelector('.tc-sp-name');
      const isV = sourceEl.querySelector('.tc-sp-av.v');
      const gender = isV ? 'v' : 'm';
      poolRow.className = 'pool-row ' + gender;
      poolRow.innerHTML = `
        <span class="pool-drag-handle">⠿</span>
        <div class="pool-avatar ${gender}">${name ? name.textContent.substring(0,3) : 'Sp'}</div>
        <div class="pool-info"><div class="pool-name">${name ? name.textContent : 'Speler'}</div></div>
      `;
      targetEl.appendChild(poolRow);
      initSpelerDragEl(poolRow);
      sourceEl.remove();
      showToast('Speler terug in pool', 'info');
    }
  } else if (targetEl.classList.contains('team-card')) {
    // Naar team — voeg toe aan eerste kolom
    const col = targetEl.querySelector('.tc-col');
    if (col && sourceEl.classList.contains('pool-row')) {
      const name = sourceEl.querySelector('.pool-name');
      const isV = sourceEl.classList.contains('v');
      const sp = document.createElement('div');
      sp.className = 'tc-sp draggable';
      sp.innerHTML = `
        <div class="tc-sp-av ${isV ? 'v' : 'm'}">${name ? name.textContent.substring(0,3) : 'Sp'}</div>
        <div class="tc-sp-name">${name ? name.textContent : 'Speler'}</div>
        <div class="tc-sp-icons"></div>
      `;
      col.appendChild(sp);
      initSpelerDragEl(sp);
      sourceEl.remove();
      showToast('Speler toegevoegd aan ' + (targetEl.querySelector('.tc-name')?.textContent || 'team'), 'ok');
    } else if (col && sourceEl.classList.contains('tc-sp')) {
      col.appendChild(sourceEl);
      showToast('Speler verplaatst naar ' + (targetEl.querySelector('.tc-name')?.textContent || 'team'), 'ok');
    }
  }
}

function initSpelerDragEl(el) {
  el.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    const startX = e.clientX, startY = e.clientY;
    const startTime = Date.now();
    let dragging = false;
    let ghost = null;

    function startDragSpeler() {
      dragging = true;
      ghost = createSpelerGhost(el, e);
      document.body.appendChild(ghost);
      el.style.opacity = '0.4';
    }

    function onMove(mv) {
      const moved = Math.abs(mv.clientX - startX) > 5 || Math.abs(mv.clientY - startY) > 5;
      const longEnough = Date.now() - startTime > 300;
      if (!dragging && (moved || longEnough)) {
        startDragSpeler();
      }
      if (dragging && ghost) {
        ghost.style.left = mv.clientX + 12 + 'px';
        ghost.style.top  = mv.clientY - 10 + 'px';
        highlightDropTargets(mv);
      }
    }

    function onUp(ev) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (!dragging) {
        // Klik (<300ms, geen beweging) — open spelersprofiel
        const onclickAttr = el.getAttribute('onclick');
        if (onclickAttr) {
          const syntheticEvent = { clientX: ev.clientX, clientY: ev.clientY, stopPropagation: () => {} };
          try { new Function('event', onclickAttr)(syntheticEvent); } catch(_) {}
        }
      } else {
        // Drop
        const target = findSpelerDropTarget(ev.clientX, ev.clientY);
        if (target) handleSpelerDrop(el, target);
        if (ghost) ghost.remove();
        el.style.opacity = '';
        clearSpelerHighlights();
      }
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
}

// Activeer drag op alle spelerrijen (team + pool)
document.querySelectorAll('.tc-sp.draggable, .pool-row').forEach(initSpelerDragEl);

/* ═══════════════════════════════════════════════════════════════
   SPELERSPROFIEL KAART
═══════════════════════════════════════════════════════════════ */
const profielCard = document.getElementById('profielCard');
let profielTimeout;

function showProfiel(e, naam, gender, leeftijd, rating, vorigTeam, status, memo) {
  e.stopPropagation();
  clearTimeout(profielTimeout);

  const av = document.getElementById('pcAvatar');
  const initials = naam.split(' ').map(n => n[0]).join('').substring(0, 3);
  av.textContent = initials;
  av.className = 'pc-avatar ' + gender;

  document.getElementById('pcName').textContent = naam;
  document.getElementById('pcMeta').textContent = leeftijd + ' jaar · ' + (gender === 'v' ? 'Dames' : 'Heren');
  document.getElementById('pcRating').textContent = rating;
  document.getElementById('pcVorigTeam').textContent = vorigTeam;

  const statusEl = document.getElementById('pcStatus');
  const statusMap = {
    'BESCHIKBAAR': { t: 'Beschikbaar', c: 'var(--ok)' },
    'TWIJFELT':    { t: 'Twijfelt',    c: 'var(--warn)' },
    'GAAT_STOPPEN':{ t: 'Gaat stoppen',c: 'var(--err)' },
    'NIEUW':       { t: 'Nieuw lid',   c: 'var(--info)' }
  };
  const s = statusMap[status] || { t: status, c: 'var(--text-2)' };
  statusEl.textContent = s.t;
  statusEl.style.color = s.c;

  const cats = { 5: 'Blauw (U8)', 6:'Blauw (U8)', 7:'Blauw (U8)', 8:'Groen (U10)', 9:'Groen (U10)', 10:'Geel (U12)', 11:'Geel (U12)', 12:'Geel (U12)', 13:'Oranje (U14)', 14:'Oranje (U14)', 15:'Rood (U16)', 16:'Rood (U16)', 17:'Rood (U18)', 18:'Rood (U18)' };
  document.getElementById('pcCat').textContent = cats[leeftijd] || 'Senioren';
  document.getElementById('pcMemo').textContent = memo || '—';

  // Positioneer nabij de cursor
  const x = e.clientX + 12;
  const y = e.clientY - 40;
  profielCard.style.left = Math.min(x, window.innerWidth - 240) + 'px';
  profielCard.style.top = Math.min(y, window.innerHeight - 320) + 'px';
  profielCard.style.position = 'fixed';
  profielCard.classList.add('visible');
}

function closeProfileCard() {
  profielCard.classList.remove('visible');
}

document.addEventListener('click', (e) => {
  if (!profielCard.contains(e.target) && !e.target.closest('.pool-row') && !e.target.closest('.tc-sp')) {
    closeProfileCard();
  }
});

/* ═══════════════════════════════════════════════════════════════
   DAISY CHAT
═══════════════════════════════════════════════════════════════ */
const daisyFab = document.getElementById('daisyFab');
const daisyPanel = document.getElementById('daisyPanel');
let daisyOpen = true;

function toggleDaisy() {
  daisyOpen = !daisyOpen;
  daisyPanel.classList.toggle('open', daisyOpen);
  daisyFab.classList.toggle('open', daisyOpen);
}

// Start open
setTimeout(() => { daisyPanel.classList.add('open'); daisyFab.classList.add('open'); }, 300);

function daisyKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendDaisyMessage();
  }
}

const daisyResponses = [
  "Op basis van de huidige indeling is Sen 3 D1 de prioriteit. Ik adviseer: verplaats Nina Kroon naar U16-1 en voeg 2 heren toe vanuit de pool.",
  "Leeftijdsspreiding in U14-1 is uitstekend: spreiding van 13-15 jaar, gemiddeld 13.8. Dit is optimaal voor doorstroming.",
  "Let op Robin Vermeer in U16-1: afmelding tot 15 mei overlapt met de eerste 2 speelronden. Overweeg een reserveopstelling.",
  "De USS-scores zijn goed gebalanceerd. Geen enkel team heeft een gemiddelde dat meer dan 1.0 afwijkt van de competitiestandaard.",
  "Ik zie 26 spelers nog zonder team. 14 heren en 12 dames. Wil je dat ik een suggestie doe voor de resterende indeling?"
];
let responseIdx = 0;

function sendDaisyMessage() {
  const input = document.getElementById('daisyInput');
  const text = input.value.trim();
  if (!text) return;

  const msgs = document.getElementById('daisyMessages');
  const typingMsg = document.getElementById('typingMsg');

  // Voeg gebruikersbericht toe
  const userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.innerHTML = `
    <div class="msg-avatar user">AL</div>
    <div>
      <div class="msg-bubble">${text}</div>
      <div class="msg-time">${getCurrentTime()}</div>
    </div>`;
  msgs.insertBefore(userMsg, typingMsg);

  input.value = '';

  // Toon typing indicator
  typingMsg.style.display = 'flex';
  msgs.scrollTop = msgs.scrollHeight;

  // Daisy antwoord na delay
  setTimeout(() => {
    typingMsg.style.display = 'none';
    const resp = daisyResponses[responseIdx % daisyResponses.length];
    responseIdx++;
    const daisyMsg = document.createElement('div');
    daisyMsg.className = 'msg daisy';
    daisyMsg.innerHTML = `
      <div class="msg-avatar daisy">✦</div>
      <div>
        <div class="msg-bubble">${resp}</div>
        <div class="msg-time">${getCurrentTime()}</div>
      </div>`;
    msgs.insertBefore(daisyMsg, typingMsg);
    msgs.scrollTop = msgs.scrollHeight;
  }, 1200 + Math.random() * 600);
}

function daisyPrompt(text) {
  document.getElementById('daisyInput').value = text;
  sendDaisyMessage();
}

function daisySuggest() {
  showToast('Daisy: suggestie toegepast op canvas — U16-1 gehighlight');
  document.getElementById('card-u16-1').classList.add('daisy-hl');
  setTimeout(() => {
    document.getElementById('card-u16-1').classList.remove('daisy-hl');
  }, 3000);
}

function getCurrentTime() {
  const d = new Date();
  return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
}

/* ═══════════════════════════════════════════════════════════════
   WHAT-IF MODUS
═══════════════════════════════════════════════════════════════ */
let whatIfActive = false;

function toggleWhatIf() {
  whatIfActive = !whatIfActive;
  const indicator = document.getElementById('whatifIndicator');
  const btn = document.getElementById('whatif-btn');
  const riBtn = document.getElementById('ri-whatif');
  indicator.classList.toggle('active', whatIfActive);
  btn.style.background = whatIfActive ? 'rgba(59,130,246,.12)' : '';
  btn.style.color = whatIfActive ? 'var(--info)' : '';
  btn.style.borderColor = whatIfActive ? 'rgba(59,130,246,.3)' : '';
  riBtn.classList.toggle('active', whatIfActive);
  if (whatIfActive) showToast('What-If modus actief — wijzigingen worden niet opgeslagen');
}

function applyWhatIf() {
  whatIfActive = false;
  document.getElementById('whatifIndicator').classList.remove('active');
  document.getElementById('whatif-btn').style = '';
  document.getElementById('ri-whatif').classList.remove('active');
  showToast('What-If wijzigingen toegepast op scenario');
}

/* ═══════════════════════════════════════════════════════════════
   VALIDATIE TABS
═══════════════════════════════════════════════════════════════ */
function switchValTab(btn, tab) {
  document.querySelectorAll('.val-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

/* ═══════════════════════════════════════════════════════════════
   POOL FILTER
═══════════════════════════════════════════════════════════════ */
function setPoolFilter(btn, filter) {
  document.querySelectorAll('.pool-filters .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function filterPool(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.pool-row').forEach(row => {
    const name = row.querySelector('.pool-name');
    if (name) {
      const matches = name.textContent.toLowerCase().includes(q);
      row.style.display = matches ? '' : 'none';
    }
  });
}

let genderFilter = null;
function filterGender(g) {
  const btn = document.getElementById('filter-' + g);
  if (genderFilter === g) {
    genderFilter = null;
    btn.style.color = '';
    document.querySelectorAll('.pool-row').forEach(r => r.style.display = '');
  } else {
    genderFilter = g;
    document.querySelectorAll('.filter-v, .filter-m').forEach(b => b.style.color = '');
    btn.style.color = g === 'v' ? 'var(--pink)' : 'var(--blue)';
    document.querySelectorAll('.pool-row').forEach(r => {
      r.style.display = r.classList.contains(g) ? '' : 'none';
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   KAART HIGHLIGHT (vanuit validatie)
═══════════════════════════════════════════════════════════════ */
function highlightCard(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.add('daisy-hl');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => card.classList.remove('daisy-hl'), 2500);
}

/* ═══════════════════════════════════════════════════════════════
   TOAST NOTIFICATIES
═══════════════════════════════════════════════════════════════ */
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  const colors = { info: 'var(--info)', ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)' };
  toast.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:var(--bg-2); border:1px solid ${colors[type] || colors.info};
    color:var(--text-1); padding:9px 18px; border-radius:10px;
    font-size:12px; font-weight:500; z-index:200;
    box-shadow:0 4px 16px rgba(0,0,0,.4);
    animation: fadeUp 200ms ease both;
    white-space: nowrap;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 300ms'; setTimeout(() => toast.remove(), 300); }, 2800);
}

/* ═══════════════════════════════════════════════════════════════
   PUBLISH FLASH
═══════════════════════════════════════════════════════════════ */
function flashPublish() {
  showToast('Preview geopend — indeling nog in concept', 'warn');
}

/* ═══════════════════════════════════════════════════════════════
   MINIMAP UPDATE
═══════════════════════════════════════════════════════════════ */
function updateMinimap() {
  const vp = document.getElementById('minimapVP');
  if (!vp) return;
  // Visuele feedback — niet functioneel gekoppeld in prototype
  const pct = (1 - currentZoom / 1.5);
  vp.style.width = (40 + pct * 30) + 'px';
  vp.style.height = (30 + pct * 20) + 'px';
}

/* ═══════════════════════════════════════════════════════════════
   SCORE OCTAGON TOGGLE + LABEL UPDATER
═══════════════════════════════════════════════════════════════ */
let scoresVisible = true;

function toggleScores() {
  scoresVisible = !scoresVisible;
  canvas.classList.toggle('show-scores', scoresVisible);
  const btn = document.getElementById('scoreToggleBtn');
  if (scoresVisible) {
    btn.classList.remove('btn-ghost');
    btn.classList.add('btn-sec');
    btn.style.color = '';
    btn.style.borderColor = '';
  } else {
    btn.classList.remove('btn-sec');
    btn.classList.add('btn-ghost');
    btn.style.color = 'var(--text-3)';
  }
  showToast(scoresVisible ? 'USS-scores zichtbaar' : 'USS-scores verborgen');
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
canvas.style.transformOrigin = '0 0';
applyZoom(0.85);

// Ribbon active state pool open simuleren
document.getElementById('ri-pool').addEventListener('click', () => {
  document.getElementById('ri-pool').classList.toggle('active');
});

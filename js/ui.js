/* ============================================================
   ui.js — Fonctions de rendu de l'interface
   ============================================================ */

function renderDLCGrid(activeDLC) {
  const grid = document.getElementById('dlc-grid');
  grid.innerHTML = '';
  DLC_CONFIG.forEach(dlc => {
    const btn = document.createElement('button');
    btn.className = 'dlc-chip' + (activeDLC.has(dlc.id) ? ' active' : '');
    btn.textContent = dlc.name;
    btn.dataset.id  = dlc.id;
    if (dlc.locked) { btn.disabled = true; btn.title = 'Toujours actif'; }
    grid.appendChild(btn);
  });
}

function renderEmpty() {
  document.getElementById('challenge-area').innerHTML = `
    <div class="challenge-card">
      <div class="empty-state">
        <div class="empty-icon">🦒</div>
        <h2 class="empty-title">Aucun défi généré</h2>
        <p class="empty-text">Choisis une difficulté, active tes extensions, et clique sur Générer!</p>
      </div>
    </div>`;
}

function renderError(msg) {
  document.getElementById('challenge-area').innerHTML = `
    <div class="challenge-card">
      <div class="error-state">
        <div style="font-size:40px;margin-bottom:1rem">⚠️</div>
        <p class="error-title">Une erreur est survenue</p>
        <p class="error-text">${msg}</p>
      </div>
    </div>`;
}

function renderStageColumn(stageKey, stageData) {
  const cfg = {
    bronze: { headerCls:'stage-header--bronze', itemCls:'objective-item--bronze', medal:'🥉', label:'Bronze' },
    silver: { headerCls:'stage-header--silver', itemCls:'objective-item--silver', medal:'🥈', label:'Argent' },
    gold:   { headerCls:'stage-header--gold',   itemCls:'objective-item--gold',   medal:'🥇', label:'Or'     },
  }[stageKey];

  const items = (stageData?.objectives || []).map(obj => `
    <li class="objective-item ${cfg.itemCls}">
      <div class="obj-label">${obj.label}</div>
      <div>${obj.text}</div>
    </li>`).join('');

  return `
    <div class="stage-col">
      <div class="stage-header ${cfg.headerCls}">
        <span class="stage-medal">${cfg.medal}</span>
        <span class="stage-title">${cfg.label}</span>
      </div>
      <ul class="objectives-list">${items}</ul>
    </div>`;
}

function renderChallenge(c) {
  const dp = DIFF_PARAMS[c.difficulty];
  document.getElementById('challenge-area').innerHTML = `
    <div class="challenge-card" id="export-area">
      <div class="challenge-header">
        <div class="challenge-header-left">
          <div class="challenge-zoo-name">🏛 ${c.zooName}</div>
          <div class="challenge-title">"${c.title}"</div>
          <div class="challenge-meta">
            <span class="meta-badge ${dp.badgeClass}">${dp.label}</span>
            <span class="meta-badge badge--theme">${c.theme}</span>
          </div>
          <p class="challenge-description">${c.description}</p>
        </div>
        <button class="export-btn" id="export-btn">📸 Exporter JPG</button>
      </div>
      <div class="stages-grid">
        ${renderStageColumn('bronze', c.bronze)}
        ${renderStageColumn('silver', c.silver)}
        ${renderStageColumn('gold',   c.gold)}
      </div>
    </div>`;

  document.getElementById('export-btn').addEventListener('click', () => {
    exportToJPG(c.zooName);
  });
}

async function exportToJPG(zooName) {
  const el  = document.getElementById('export-area');
  const btn = document.getElementById('export-btn');
  if (!el) return;

  if (typeof html2canvas === 'undefined') {
    alert('html2canvas non disponible, réessaie dans un instant.');
    return;
  }

  if (btn) { btn.textContent = '⏳ Export...'; btn.disabled = true; }

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: '#0d1f0f',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const safe = (zooName || 'zoo').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') || 'zoo';
    const link = document.createElement('a');
    link.download = `defi-${safe}.jpg`;
    link.href     = canvas.toDataURL('image/jpeg', 0.93);
    link.click();
  } catch (err) {
    alert('Erreur export : ' + err.message);
  } finally {
    if (btn) { btn.textContent = '📸 Exporter JPG'; btn.disabled = false; }
  }
}

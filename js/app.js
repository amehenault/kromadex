/* ============================================================
   app.js — État global, événements, point d'entrée
   ============================================================ */

const state = {
  difficulty: null,
  activeDLC:  new Set(['base']),
  isLoading:  false,
};

/* ---- Difficulté ---- */
function setDifficulty(diff) {
  state.difficulty = diff;
  ['easy','moyen','avance'].forEach(d => {
    const btn = document.getElementById('btn-' + d);
    btn.className = 'diff-btn' + (d === diff ? ' active--' + d : '');
  });
}

/* ---- DLC ---- */
function toggleDLC(id) {
  if (id === 'base') return;
  state.activeDLC.has(id) ? state.activeDLC.delete(id) : state.activeDLC.add(id);
  renderDLCGrid(state.activeDLC);
}

function toggleAllDLC(activate) {
  DLC_CONFIG.forEach(d => { if (!d.locked) { activate ? state.activeDLC.add(d.id) : state.activeDLC.delete(d.id); } });
  renderDLCGrid(state.activeDLC);
}

/* ---- Validation ---- */
function validate() {
  if (!state.difficulty) { alert('Choisis une difficulté avant de générer!'); return false; }
  let count = 0;
  state.activeDLC.forEach(id => { if (ANIMALS_BY_DLC[id]) count += ANIMALS_BY_DLC[id].length; });
  if (count < 8) { alert('Active au moins une extension pour avoir plus d\'animaux!'); return false; }
  return true;
}

/* ---- Génération ---- */
function generate() {
  if (state.isLoading || !validate()) return;

  const zooName = document.getElementById('zoo-name').value.trim() || 'Mon Zoo';

  try {
    const challenge = generateChallenge(zooName, state.difficulty, [...state.activeDLC]);
    renderChallenge(challenge);
  } catch (err) {
    console.error(err);
    renderError(err.message || 'Erreur inattendue lors de la génération.');
  }
}

/* ---- Événements ---- */
function bindEvents() {
  document.getElementById('btn-easy').addEventListener('click',   () => setDifficulty('easy'));
  document.getElementById('btn-moyen').addEventListener('click',  () => setDifficulty('moyen'));
  document.getElementById('btn-avance').addEventListener('click', () => setDifficulty('avance'));

  document.getElementById('btn-all-on').addEventListener('click',  () => toggleAllDLC(true));
  document.getElementById('btn-all-off').addEventListener('click', () => toggleAllDLC(false));

  document.getElementById('dlc-grid').addEventListener('click', e => {
    const chip = e.target.closest('.dlc-chip');
    if (chip && !chip.disabled) toggleDLC(chip.dataset.id);
  });

  document.getElementById('gen-btn').addEventListener('click', generate);

  document.getElementById('zoo-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') generate();
  });
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  renderDLCGrid(state.activeDLC);
  bindEvents();
  renderEmpty();
});

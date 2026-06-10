/* ============================================================
   engine.js — Moteur de génération 100% local, sans API
   ============================================================ */

/* ---- Utilitaires ---- */
function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)    { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n){ return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length)); }
function fmtMoney(n)  { return n.toLocaleString('fr-CA') + ' $'; }

/* ---- Paramètres par difficulté ---- */
const DIFF_PARAMS = {
  easy: {
    label: 'Facile', badgeClass: 'badge--easy',
    welfare:     { b:[48,58],  s:[59,67],  g:[68,76]  },
    education:   { b:[28,38],  s:[39,52],  g:[53,64]  },
    happiness:   { b:[58,67],  s:[68,74],  g:[75,81]  },
    revenue:     { b:[30000,70000], s:[71000,130000], g:[131000,220000] },
    releases:    { b:[2,5],    s:[6,10],   g:[11,17]  },
    births:      { b:[2,4],    s:[5,8],    g:[9,14]   },
    species:     { b:[3,5],    s:[6,9],    g:[10,14]  },
    credits:     { b:[500,1500], s:[1600,3000], g:[3001,5500] },
    staff:       { b:[2,4],    s:[5,7],    g:[8,11]   },
    enclosures:  { b:[2,3],    s:[4,6],    g:[7,9]    },
    stars:       { b:3,        s:3,        g:4        },
    animalCount: [4, 6],
    objCount:    [3, 4],
  },
  moyen: {
    label: 'Intermédiaire', badgeClass: 'badge--moyen',
    welfare:     { b:[60,70],  s:[71,80],  g:[81,89]  },
    education:   { b:[45,56],  s:[57,69],  g:[70,80]  },
    happiness:   { b:[68,76],  s:[77,83],  g:[84,89]  },
    revenue:     { b:[80000,160000], s:[161000,300000], g:[301000,480000] },
    releases:    { b:[4,8],    s:[9,14],   g:[15,22]  },
    births:      { b:[4,7],    s:[8,13],   g:[14,20]  },
    species:     { b:[6,9],    s:[10,14],  g:[15,20]  },
    credits:     { b:[1500,3500], s:[3501,6000], g:[6001,10000] },
    staff:       { b:[4,6],    s:[7,10],   g:[11,15]  },
    enclosures:  { b:[3,5],    s:[6,9],    g:[10,14]  },
    stars:       { b:3,        s:4,        g:4        },
    animalCount: [5, 8],
    objCount:    [3, 5],
  },
  avance: {
    label: 'Avancé', badgeClass: 'badge--avance',
    welfare:     { b:[72,81],  s:[82,89],  g:[90,97]  },
    education:   { b:[60,71],  s:[72,83],  g:[84,93]  },
    happiness:   { b:[78,85],  s:[86,91],  g:[92,96]  },
    revenue:     { b:[180000,340000], s:[341000,560000], g:[561000,900000] },
    releases:    { b:[7,12],   s:[13,20],  g:[21,32]  },
    births:      { b:[7,12],   s:[13,20],  g:[21,30]  },
    species:     { b:[10,15],  s:[16,22],  g:[23,30]  },
    credits:     { b:[3500,7000], s:[7001,12000], g:[12001,20000] },
    staff:       { b:[6,9],    s:[10,14],  g:[15,20]  },
    enclosures:  { b:[5,8],    s:[9,13],   g:[14,20]  },
    stars:       { b:4,        s:4,        g:5        },
    animalCount: [7, 11],
    objCount:    [4, 5],
  },
};

/* ---- Toutes les catégories d'objectifs disponibles ---- */
const OBJ_CATEGORIES = [
  'welfare','education','happiness','stars','revenue',
  'releases','births','species','specific_animal',
  'conservation_credits','staff','enclosures',
];

/* ---- Génère une valeur pour une catégorie et une étape ---- */
function getValue(cat, tier, p) {
  const t = { bronze:'b', silver:'s', gold:'g' }[tier];
  switch (cat) {
    case 'welfare':              return ri(p.welfare[t][0], p.welfare[t][1]);
    case 'education':            return ri(p.education[t][0], p.education[t][1]);
    case 'happiness':            return ri(p.happiness[t][0], p.happiness[t][1]);
    case 'stars':                return p.stars[t];
    case 'revenue':              return ri(p.revenue[t][0], p.revenue[t][1]);
    case 'releases':             return ri(p.releases[t][0], p.releases[t][1]);
    case 'births':               return ri(p.births[t][0], p.births[t][1]);
    case 'species':              return ri(p.species[t][0], p.species[t][1]);
    case 'specific_animal':      return { count: ri(2, t === 'b' ? 4 : t === 's' ? 7 : 11), welfare: ri(p.welfare[t][0], p.welfare[t][1]) };
    case 'conservation_credits': return ri(p.credits[t][0], p.credits[t][1]);
    case 'staff':                return ri(p.staff[t][0], p.staff[t][1]);
    case 'enclosures':           return ri(p.enclosures[t][0], p.enclosures[t][1]);
    default: return 0;
  }
}

/* ---- Remplace les tokens dans un template ---- */
function fillTemplate(template, animal, val, countSpecies) {
  let txt = template.text;
  if (typeof val === 'object') {
    txt = txt.replace('{COUNT}', val.count).replace('{VAL}', val.welfare);
  } else {
    txt = txt.replace('{VAL}', typeof val === 'number' && val > 1000 ? fmtMoney(val) : val);
    txt = txt.replace('{COUNT}', val);
  }
  txt = txt.replace('{ANIMAL}', animal || 'tes animaux');
  txt = txt.replace('{COUNTSPECIES}', countSpecies || ri(2, 4));
  return { label: template.label, text: txt };
}

/* ---- Génère les objectifs pour une étape ---- */
function generateStageObjectives(tier, categories, animals, p) {
  const count = ri(p.objCount[0], p.objCount[1]);
  const chosenCats = pickN(categories, count);
  const objectives = [];

  chosenCats.forEach(cat => {
    const templates = OBJECTIVE_TEMPLATES[cat];
    if (!templates || templates.length === 0) return;
    const tmpl = pick(templates);
    const val  = getValue(cat, tier, p);
    const animal = pick(animals);
    objectives.push(fillTemplate(tmpl, animal, val));
  });

  return objectives;
}

/* ---- Sélectionne des catégories variées pour les 3 étapes ---- */
function selectCategories(p) {
  const mandatory = ['welfare','education','happiness','revenue','releases'];
  const optional  = ['births','species','specific_animal','conservation_credits','staff','enclosures','stars'];

  const maxObj = p.objCount[1];
  const base   = pickN(mandatory, Math.min(mandatory.length, maxObj));
  const extra  = pickN(optional,  Math.max(0, maxObj - base.length + ri(0, 2)));
  return [...base, ...extra];
}

/* ---- Fonction principale de génération ---- */
function generateChallenge(zooName, difficulty, activeDLCs) {
  const p = DIFF_PARAMS[difficulty];

  /* Collecte des animaux disponibles */
  let allAnimals = [];
  activeDLCs.forEach(id => { if (ANIMALS_BY_DLC[id]) allAnimals = allAnimals.concat(ANIMALS_BY_DLC[id]); });
  allAnimals = [...new Set(allAnimals)];
  const selectedAnimals = pickN(allAnimals, ri(p.animalCount[0], p.animalCount[1]));

  /* Thème */
  const theme = pick(CHALLENGE_THEMES);
  const title = pick(CHALLENGE_TITLES);

  /* Catégories d'objectifs — les 3 étapes partagent les mêmes catégories pour la cohérence */
  const categories = selectCategories(p);

  /* Génération des étapes */
  const bronze = generateStageObjectives('bronze', categories, selectedAnimals, p);
  const silver = generateStageObjectives('silver', categories, selectedAnimals, p);
  const gold   = generateStageObjectives('gold',   categories, selectedAnimals, p);

  return {
    zooName,
    difficulty,
    title,
    theme:       theme.name,
    description: theme.desc,
    bronze: { objectives: bronze },
    silver: { objectives: silver },
    gold:   { objectives: gold   },
  };
}

import { sql } from '@/lib/db';
import { jourQuebec, ajouterJours } from '@/lib/temps';
import { FETES, MOIS_EPOPEES, MOIS_PROPHETIES } from '@/lib/activites';
import { texteRappel } from '@/lib/planificationTexte';
export { quand, texteRappel } from '@/lib/planificationTexte';

export const DEBUT_RAPPELS = '2026-11-01';
export const JOURS_RETARD = 7;

const PREAVIS = { mois: 14, expedition: 30, epopee: 61, prophetie: 61 };
const iso = (a, m, j = 1) => `${a}-${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
const ecart = (de, a) => Math.round((new Date(`${a}T12:00:00Z`) - new Date(`${de}T12:00:00Z`)) / 86400000);
const premierDuMoisSuivant = (j, n = 1) => { const d = new Date(`${j.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };

export async function activitesAVenir(aujourdhui = jourQuebec()) {
  const annee = Number(aujourdhui.slice(0, 4));
  const horizon = ajouterJours(aujourdhui, 75);
  const [defis, bingos, aventures] = await Promise.all([
    sql`SELECT id, titre, to_char(mois, 'YYYY-MM-DD') AS mois FROM defis WHERE genre = 'officiel' AND mois >= date_trunc('month', ${aujourdhui}::date)`,
    sql`SELECT id, titre, to_char(date_trunc('month', debut), 'YYYY-MM-DD') AS mois FROM bingos WHERE debut >= date_trunc('month', ${aujourdhui}::date)`,
    sql`SELECT id, genre, titre, fete, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin
        FROM aventures WHERE fin >= ${aujourdhui}::date OR extract(year FROM debut) >= ${annee}`,
  ]);
  const liste = [];
  const ajouter = (x) => {
    const jours = ecart(aujourdhui, x.debut);
    const rappel = !x.planifiee && jours <= x.preavis && aujourdhui >= DEBUT_RAPPELS;
    if (x.debut <= horizon || rappel) liste.push({ ...x, jours, rappel });
  };

  for (const n of [0, 1]) {
    const mois = premierDuMoisSuivant(aujourdhui, n);
    const epreuve = defis.find((d) => d.mois === mois);
    const nbBingos = bingos.filter((b) => b.mois === mois).length;
    ajouter({ cle: `epreuve:${mois}`, genre: 'epreuve', nom: 'Épreuve mensuelle', une: 'une nouvelle épreuve mensuelle', debut: mois,
      planifiee: !!epreuve, titre: epreuve?.titre, preavis: PREAVIS.mois, lien: '/profil/admin?onglet=defis' });
    ajouter({ cle: `bingos:${mois}`, genre: 'bingo', nom: 'Bingos du mois', debut: mois,
      planifiee: nbBingos >= 2, manquants: Math.max(0, 2 - nbBingos), titre: nbBingos ? `${nbBingos} / 2 planifié${nbBingos > 1 ? 's' : ''}` : '',
      preavis: PREAVIS.mois, lien: '/profil/admin?onglet=bingos' });
  }

  for (const a of [annee, annee + 1]) {
    for (const f of FETES) {
      const debut = `${a}-${f.debut}`, fin = `${a}-${f.fin}`;
      if (fin < aujourdhui) continue;
      const x = aventures.find((v) => v.genre === 'expedition' && v.fete === f.valeur && v.debut.startsWith(String(a)));
      ajouter({ cle: `expedition:${a}:${f.valeur}`, genre: 'expedition', nom: `Expédition · ${f.nom}`, une: 'une nouvelle expédition',
        debut: x?.debut || debut, planifiee: !!x, titre: x?.titre, preavis: PREAVIS.expedition, lien: '/profil/admin?onglet=aventures' });
    }
    for (const m of MOIS_EPOPEES) {
      const debut = iso(a, m);
      if (premierDuMoisSuivant(debut) <= aujourdhui) continue;
      const x = aventures.find((v) => v.genre === 'epopee' && v.debut.slice(0, 7) === debut.slice(0, 7));
      ajouter({ cle: `epopee:${debut.slice(0, 7)}`, genre: 'epopee', nom: 'Épopée', une: 'une nouvelle épopée',
        debut: x?.debut || debut, planifiee: !!x, titre: x?.titre, preavis: PREAVIS.epopee, lien: '/profil/admin?onglet=aventures' });
    }
    const prophetie = aventures.find((v) => v.genre === 'prophetie' && v.debut.startsWith(String(a)));
    if (prophetie) {
      ajouter({ cle: `prophetie:${a}`, genre: 'prophetie', nom: 'Prophétie', une: 'une nouvelle prophétie', debut: prophetie.debut,
        planifiee: true, titre: prophetie.titre, preavis: PREAVIS.prophetie, lien: '/profil/admin?onglet=aventures' });
    } else {
      const possible = MOIS_PROPHETIES.map((m) => iso(a, m)).find((d) => premierDuMoisSuivant(d) > aujourdhui);
      if (possible) {
        ajouter({ cle: `prophetie:${a}`, genre: 'prophetie', nom: 'Prophétie (mai ou novembre)', une: 'une nouvelle prophétie', debut: possible,
          planifiee: false, preavis: PREAVIS.prophetie, lien: '/profil/admin?onglet=aventures' });
      }
    }
  }
  return liste.sort((x, y) => x.debut.localeCompare(y.debut));
}

export async function rappelsDuJour() {
  return (await activitesAVenir()).filter((a) => a.rappel).map((a) => ({ ...a, enRetard: a.jours <= JOURS_RETARD, texte: texteRappel(a) }));
}

export function notifierAujourdhui(rappels, aujourdhui = jourQuebec()) {
  if (!rappels.length) return false;
  if (rappels.some((r) => r.enRetard)) return true;
  return Math.round(new Date(`${aujourdhui}T12:00:00Z`).getTime() / 86400000) % 2 === 0;
}

'use client';
import { useState } from 'react';
import { Pencil, Check, ArrowRight, HelpCircle } from 'lucide-react';
import { crayonLePlusProche } from '@/lib/palettes';
import { libelleMarque } from '@/lib/libelleCrayon';

const norme = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const estHex = (h) => /^#[0-9a-f]{6}$/i.test(h || '');

function jePossede(num, crayons) {
  const n = norme(num);
  return crayons.some((c) => {
    const code = norme(c.code);
    if (!code) return false;
    if (n === code) return true;
    return n.startsWith(`${code} `) && n.includes(norme(c.marque));
  });
}

const proximite = (d) => (d < 6 ? 'presque identique' : d < 15 ? 'proche' : 'approximatif');

export default function AvecMesCrayons({ codes }) {
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);

  const lignes = [];
  const vus = new Set();
  for (const g of Array.isArray(codes) ? codes : []) {
    for (const r of g.rows || []) {
      if (!r.num || vus.has(norme(r.num))) continue;
      vus.add(norme(r.num));
      lignes.push(r);
    }
  }
  if (!lignes.length) return null;

  async function verifier() {
    setChargement(true);
    const d = await fetch('/api/mes-crayons').then((r) => (r.ok ? r.json() : { crayons: [] })).catch(() => ({ crayons: [] }));
    const crayons = (d.crayons || []).filter((c) => c.code || c.nom);
    const avecHex = crayons.filter((c) => estHex(c.hex));
    setResultat({
      aucun: !crayons.length,
      lignes: lignes.map((r) => {
        if (jePossede(r.num, crayons)) return { r, etat: 'possede' };
        if (estHex(r.hex) && avecHex.length) return { r, etat: 'remplacer', par: crayonLePlusProche(r.hex, avecHex) };
        return { r, etat: 'inconnu' };
      }),
    });
    setChargement(false);
  }

  if (!resultat) {
    return (
      <button type="button" className="btn alt" onClick={verifier} disabled={chargement}
        style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, width: '100%' }}>
        <Pencil size={16} aria-hidden="true" /> {chargement ? 'Vérification…' : 'Est-ce que je peux le faire avec mes crayons ?'}
      </button>
    );
  }

  if (resultat.aucun) {
    return <small style={{ color: 'var(--texte-secondaire)' }}>Ajoute tes coffrets dans tes Collections (onglet Crayons) pour comparer avec tes crayons.</small>;
  }

  const nb = (e) => resultat.lignes.filter((l) => l.etat === e).length;
  const pastille = (hex) => <span aria-hidden="true" style={{ width: 16, height: 16, flex: '0 0 auto', borderRadius: '50%', background: estHex(hex) ? hex : 'transparent', border: '1px solid rgba(0,0,0,0.15)' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', borderRadius: 'var(--rayon-m)', background: 'var(--accent-doux)' }}>
      <b>Avec mes crayons</b>
      <small style={{ fontWeight: 600 }}>
        Tu as {nb('possede')} crayon{nb('possede') > 1 ? 's' : ''} sur {resultat.lignes.length}
        {nb('remplacer') ? ` · ${nb('remplacer')} à remplacer` : ''}{nb('inconnu') ? ` · ${nb('inconnu')} sans équivalent connu` : ''}.
      </small>
      {resultat.lignes.map(({ r, etat, par }, i) => (
        <div key={r.id || i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0, overflowWrap: 'anywhere' }}>{pastille(r.hex)} {r.num}</span>
          {etat === 'possede' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--sentinelle)', fontWeight: 700 }}><Check size={16} aria-hidden="true" /> Je l’ai</span>}
          {etat === 'remplacer' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0, overflowWrap: 'anywhere' }}>
              <ArrowRight size={16} aria-hidden="true" style={{ flex: '0 0 auto' }} /> {pastille(par.hex)}
              <span><b>{par.code || par.nom} {libelleMarque(par.marque, par.sorte)}</b> <small style={{ color: 'var(--texte-secondaire)' }}>({proximite(par.distance)})</small></span>
            </span>
          )}
          {etat === 'inconnu' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--texte-secondaire)' }}><HelpCircle size={16} aria-hidden="true" /> Couleur inconnue</span>}
        </div>
      ))}
    </div>
  );
}

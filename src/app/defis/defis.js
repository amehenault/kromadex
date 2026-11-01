'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Grid3x3, Users, Compass, Swords, Gavel, Dices, Sparkles } from 'lucide-react';
import CarteDefi from './carteDefi';
import Bingo from './bingo';
import DefisGroupe from './defisGroupe';
import ListeAventures from '@/app/aventures/liste';
import Combats from '@/app/combats/combats';
import VerdictsARendre from './verdictsARendre';

const ROLE_DU_GENRE = { officiel: 'admin', modo: 'modo', cheffe: 'cheffe', menestrel: 'menestrel', groupe: 'communaute' };
const FILTRES_ROLE = [['tous', 'Toutes'], ['admin', 'Invocatrice'], ['modo', 'Sentinelles'], ['cheffe', 'Cheffes'], ['menestrel', 'Ménestrelles'], ['communaute', 'Communauté']];

export default function Defis({ monId, integre }) {
  const [onglet, setOnglet] = useState('verdicts');
  const [aVoter, setAVoter] = useState(null);
  const [donnees, setDonnees] = useState(null);
  const [bingos, setBingos] = useState(null);
  const [role, setRole] = useState('tous');

  const [aventures, setAventures] = useState([]);
  const [nonVues, setNonVues] = useState({ epreuves: 0, bingos: 0, aventures: 0 });

  async function charger() {
    const [d, b, a, v] = await Promise.all([
      fetch('/api/defis').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/bingos').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/aventures').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/activites-vues').then((r) => (r.ok ? r.json() : null)),
    ]);
    setDonnees(d || { defis: [] });
    setBingos(b?.bingos || []);
    setAventures((a?.aventures || []).filter((x) => !x.terminee));
    if (v) setNonVues(v);
  }
  useEffect(() => { charger(); }, []);

  const SORTE_DE = { mois: 'epreuves', bingos: 'bingos', aventures: 'aventures' };
  async function ouvrir(cle) {
    setOnglet(cle);
    const sorte = SORTE_DE[cle];
    if (!sorte || !nonVues[sorte]) return;
    setNonVues((n) => ({ ...n, [sorte]: 0 }));
    const r = await fetch('/api/activites-vues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sorte }) }).catch(() => null);
    if (r?.ok) setNonVues(await r.json());
    window.dispatchEvent(new Event('kromadex-lu'));
  }

  const ONGLETS = [['mois', 'Épreuves', Trophy], ['groupe', 'Épreuves de groupe', Users], ['bingos', 'Bingos', Grid3x3], ['aventures', 'Aventures', Compass], ['combats', 'Combats', Swords], ['roue', 'Roue du Destin', Dices, '/roue']];
  const pastilleDe = (cle) => (SORTE_DE[cle] && nonVues[SORTE_DE[cle]] > 0);
  const totalNonVues = nonVues.epreuves + nonVues.bingos + nonVues.aventures;
  const duMois = (donnees?.defis || []).filter((d) => role === 'tous' || ROLE_DU_GENRE[d.genre] === role);
  const groupe = (donnees?.defis || []).filter((d) => d.genre === 'groupe');

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: integre ? 0 : 'var(--espace-3)' }}>
      {!integre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
          <Link href="/" className="btn alt" aria-label="Retour à l'accueil" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Activités</h2>
        </div>
      )}

      <button type="button" onClick={() => setOnglet('verdicts')} aria-pressed={onglet === 'verdicts'}
        className="btn btn-corail"
        style={{ width: '100%', minHeight: '52px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px',
          border: 'none' }}>
        <Gavel size={20} aria-hidden="true" /> Verdicts à rendre{aVoter ? ` (${aVoter})` : ''}
      </button>

      <button type="button" onClick={() => setOnglet('encours')} aria-pressed={onglet === 'encours'} className="btn"
        style={{ position: 'relative', width: '100%', minHeight: '52px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px', border: 'none' }}>
        <Sparkles size={20} aria-hidden="true" /> Activités en cours
        {totalNonVues > 0 && <span className="pastille" aria-label="Nouveautés" style={{ position: 'absolute', top: 8, right: 10 }} />}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {ONGLETS.map(([cle, label, Icone, lien], i) => {
          const style = { position: 'relative', gridColumn: i === ONGLETS.length - 1 && ONGLETS.length % 2 ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', minHeight: '54px', padding: '6px 4px', fontSize: '0.85rem', minWidth: 0 };
          return lien
            ? <Link key={cle} href={lien} className="btn alt" style={style}><Icone size={18} aria-hidden="true" /> {label}</Link>
            : (
              <button key={cle} type="button" onClick={() => ouvrir(cle)} className={onglet === cle ? 'btn' : 'btn alt'} style={style}
                aria-label={pastilleDe(cle) ? `${label}, nouveautés à voir` : undefined}>
                <Icone size={18} /> {label}
                {pastilleDe(cle) && <span className="pastille" aria-hidden="true" style={{ position: 'absolute', top: 6, right: 6 }} />}
              </button>
            );
        })}
      </div>

      {onglet === 'verdicts' && <VerdictsARendre onNombre={setAVoter} />}

      {onglet === 'encours' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            ['mois', 'Épreuves', Trophy, (donnees?.defis || []).filter((d) => d.genre !== 'groupe' && !d.cloture && !d.programme).map((d) => ({ id: `d${d.id}`, titre: d.titre }))],
            ['bingos', 'Bingos', Grid3x3, (bingos || []).filter((b) => !b.programme).map((b) => ({ id: `b${b.id}`, titre: b.titre }))],
            ['aventures', 'Aventures', Compass, aventures.map((x) => ({ id: `a${x.id}`, titre: x.titre, lien: `/aventures/${x.id}` }))],
          ].map(([cle, label, Icone, liste]) => (
            <div key={cle} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button type="button" onClick={() => ouvrir(cle)}
                style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', fontWeight: 800 }}>
                <Icone size={18} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {label} ({liste.length})
                {pastilleDe(cle) && <span className="pastille" aria-label="Nouveautés à voir" />}
              </button>
              {!liste.length && <small style={{ color: 'var(--texte-secondaire)' }}>Rien en cours pour l’instant.</small>}
              {liste.map((x) => (x.lien
                ? <Link key={x.id} href={x.lien} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', color: 'inherit', overflowWrap: 'anywhere' }}>{x.titre}</Link>
                : <button key={x.id} type="button" onClick={() => ouvrir(cle)} style={{ all: 'unset', cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center', overflowWrap: 'anywhere' }}>{x.titre}</button>))}
            </div>
          ))}
        </div>
      )}
      {!donnees && onglet !== 'verdicts' && <p>Chargement…</p>}

      {donnees && onglet === 'mois' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div role="group" aria-label="Trier par rôle" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FILTRES_ROLE.map(([cle, label]) => (
              <button key={cle} type="button" onClick={() => setRole(cle)} aria-pressed={role === cle} className={role === cle ? 'btn' : 'btn alt'}
                style={{ minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem', padding: '4px 14px' }}>
                {label}
              </button>
            ))}
          </div>
          {!duMois.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucune épreuve en cours pour l'instant.</p>}
          {duMois.map((d) => <CarteDefi key={d.id} defi={d} monId={monId} onChange={charger} />)}
        </div>
      )}

      {donnees && onglet === 'bingos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!bingos.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucun bingo en cours.</p>}
          {bingos.map((b) => <Bingo key={b.id} bingo={b} />)}
        </div>
      )}

      {donnees && onglet === 'groupe' && <DefisGroupe defis={groupe} monId={monId} onChange={charger} />}
      {onglet === 'aventures' && <ListeAventures />}
      {onglet === 'combats' && <Combats integre />}
    </div>
  );
}

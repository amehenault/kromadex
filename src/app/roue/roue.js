'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dices, Compass, BookOpen, Pencil, Map, Check, Search, ChevronRight } from 'lucide-react';
import AvisPagesCozy from '@/components/AvisPagesCozy';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';

const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
const pagesLibres = (t) => {
  if (!t.total) return [];
  const faites = new Set(t.faites);
  return Array.from({ length: t.total }, (_, i) => i + 1).filter((n) => !faites.has(n));
};

export default function Roue({ tomes }) {
  const router = useRouter();
  const [tirage, setTirage] = useState(null);
  const [enQuete, setEnQuete] = useState(false);
  const [mode, setMode] = useState('libre');
  const [tomeChoisi, setTomeChoisi] = useState('');
  const [typeChoisi, setTypeChoisi] = useState('');
  const [recherche, setRecherche] = useState('');
  const [angle, setAngle] = useState(0);
  const [tourne, setTourne] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [message, setMessage] = useState('');

  const admissibles = tomes.filter((t) => pagesLibres(t).length > 0);

  function lancer() {
    setMessage(''); setResultat(null); setTirage(null); setEnQuete(false);
    let tome;
    if (mode === 'libre') {
      if (!admissibles.length) {
        setMessage(tomes.length
          ? "Aucun de tes tomes n'a de page libre connue : soit tout est colorié, soit le nombre de coloriages du livre est inconnu."
          : "Ajoute d'abord des tomes à ton profil pour que la Roue puisse choisir.");
        return;
      }
      tome = auHasard(admissibles);
    } else {
      tome = tomes.find((t) => t.nom === tomeChoisi);
      if (!tome) { setMessage(typeChoisi === 'cozy' ? 'Choisis un livre.' : 'Choisis un tome.'); return; }
      if (!tome.total) { setMessage("Le nombre de coloriages de ce tome est inconnu : la Roue ne peut pas choisir de page."); return; }
      if (!pagesLibres(tome).length) { setMessage('Toutes les pages de ce tome sont déjà faites. Bravo !'); return; }
    }
    const page = auHasard(pagesLibres(tome));
    setTourne(true);
    setAngle((a) => a + 1440 + Math.floor(Math.random() * 360));
    setTimeout(() => {
      setTourne(false); setResultat({ tome, page });
      fetch('/api/roue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tome: tome.nom, page }) })
        .then((r) => r.json()).then((d) => d?.id && setTirage(d.id)).catch(() => {});
    }, 2200);
  }

  async function ajouterQuete() {
    if (!tirage) return false;
    const r = await fetch('/api/roue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quete: tirage }) });
    if (r.ok) setEnQuete(true);
    return r.ok;
  }
  async function commencer() {
    await ajouterQuete();
    router.push(`/pages/new?tome=${encodeURIComponent(resultat.tome.nom)}&page=${resultat.page}`);
  }

  const typesPresents = TYPES_COLORIAGE.filter((t) => tomes.some((x) => (x.type || 'autre') === t.valeur));
  const tome = tomes.find((t) => t.nom === tomeChoisi);
  const motTome = typeChoisi === 'cozy' ? 'livre' : 'tome';
  const q = recherche.trim().toLowerCase();
  const listeTomes = tomes
    .filter((t) => (t.type || 'autre') === typeChoisi && (!q || t.nom.toLowerCase().includes(q)))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true }));
  const libres = (t) => {
    if (!t.total) return 'Nombre de coloriages inconnu';
    const n = pagesLibres(t).length;
    return n ? `${n} page${n > 1 ? 's' : ''} libre${n > 1 ? 's' : ''}` : 'Toutes les pages sont faites';
  };
  const CarteTome = ({ t, actif }) => (
    <button type="button" className={actif ? 'deroulant-choix actif' : 'deroulant-choix'} aria-pressed={Boolean(actif)}
      onClick={() => { setTomeChoisi(t.nom); setResultat(null); setMessage(''); }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span style={{ width: '36px', flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: '6px', overflow: 'hidden', background: 'var(--carte)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {t.couverture ? <img src={t.couverture} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={18} aria-hidden="true" />}
        </span>
        <span style={{ minWidth: 0 }}>
          <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{t.nom}</b>
          <small style={{ color: 'var(--texte-secondaire)' }}>{libres(t)}</small>
        </span>
      </span>
      {actif ? <Check size={20} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} /> : <ChevronRight size={20} aria-hidden="true" style={{ flex: '0 0 auto' }} />}
    </button>
  );

  const onglet = (cle, label, Icone) => (
    <button type="button" onClick={() => { setMode(cle); setResultat(null); setMessage(''); }} className={mode === cle ? 'btn' : 'btn alt'}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '48px', minWidth: 0 }}>
      <Icone size={18} aria-hidden="true" /> {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/coloriages" className="btn alt" aria-label="Retour à mes coloriages" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Roue du Destin</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {onglet('libre', 'Destin libre', Dices)}
        {onglet('guide', 'Destin guidé', Compass)}
      </div>
      <p style={{ marginTop: 0, color: 'var(--texte-secondaire)', fontSize: '0.92rem' }}>
        {mode === 'libre'
          ? 'La Roue choisit un de tes tomes au hasard, puis une page que tu n’as pas encore faite.'
          : 'Choisis ton tome, la Roue choisit une page que tu n’as pas encore faite.'}
      </p>

      {mode === 'guide' && (
        <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 0 var(--espace-3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${typesPresents.length || 1}, minmax(0, 1fr))`, gap: '6px' }}>
            {typesPresents.map((t) => (
              <button key={t.valeur} type="button" className={typeChoisi === t.valeur ? 'btn' : 'btn alt'} aria-pressed={typeChoisi === t.valeur}
                onClick={() => { setTypeChoisi(t.valeur); setTomeChoisi(''); setRecherche(''); setResultat(null); setMessage(''); }}
                style={{ minHeight: '48px', fontSize: '0.88rem', minWidth: 0 }}>
                {t.label}
              </button>
            ))}
          </div>
          {!typesPresents.length && <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>Ajoute d'abord des tomes à ton profil pour que la Roue puisse choisir.</p>}
          {typeChoisi && tome && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <CarteTome t={tome} actif />
              <button type="button" className="btn alt" onClick={() => { setTomeChoisi(''); setResultat(null); setMessage(''); }} style={{ minHeight: '44px' }}>
                Changer de {motTome}
              </button>
            </div>
          )}
          {typeChoisi && !tome && (
            <>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '10px', color: 'var(--texte-secondaire)' }} />
                <input type="search" placeholder={`Rechercher un ${motTome}…`} value={recherche} onChange={(e) => setRecherche(e.target.value)}
                  style={{ width: '100%', margin: 0, paddingLeft: '34px' }} />
              </div>
              {!listeTomes.length && <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>Aucun {motTome} trouvé.</p>}
              {listeTomes.map((t) => <CarteTome key={t.nom} t={t} />)}
            </>
          )}
        </div>
      )}
      {mode === 'guide' && !resultat && tomes.find((t) => t.nom === tomeChoisi)?.type === 'cozy' && <AvisPagesCozy tome={tomeChoisi} />}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', margin: '10px 0 20px' }}>
        <div style={{ position: 'relative', width: 'min(70vw, 240px)', aspectRatio: '1 / 1' }}>
          <span aria-hidden="true" style={{
            position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', zIndex: 1,
            width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid var(--texte-principal)',
          }} />
          <div aria-hidden="true" style={{
            width: '100%', height: '100%', borderRadius: '50%', border: '4px solid var(--texte-principal)',
            background: `conic-gradient(${Array.from({ length: 8 }, (_, i) => `var(--roue-${i + 1}) ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')})`,
            transform: `rotate(${angle}deg)`, transition: 'transform 2.2s cubic-bezier(0.17, 0.67, 0.21, 1)',
          }} />
        </div>
        <button type="button" className="btn" onClick={lancer} disabled={tourne}
          style={{ minHeight: '50px', minWidth: '200px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Dices size={20} aria-hidden="true" /> {tourne ? 'La Roue tourne…' : 'Faire tourner la Roue'}
        </button>
      </div>

      <p style={{ margin: '0 0 var(--espace-3)', fontSize: '0.88rem', color: 'var(--texte-secondaire)', background: 'var(--accent-doux)', borderRadius: 'var(--rayon-m)', padding: '10px 12px' }}>
        Tu as 14 jours pour réaliser la page choisie par le Destin et gagner 10 XP, sinon cette quête disparaîtra.
        Tu peux consulter le résultat de la Roue du Destin via ton Profil, dans la section Quêtes.
      </p>

      {message && <p className="carte" style={{ margin: 0 }}>{message}</p>}

      {resultat && (
        <div className="carte" style={{ display: 'flex', gap: '12px', alignItems: 'center', border: '2px solid var(--btn)' }}>
          <span style={{ width: '64px', flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {resultat.tome.couverture ? <img src={resultat.tome.couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={24} aria-hidden="true" />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <small style={{ color: 'var(--texte-secondaire)' }}>Ton prochain coloriage</small>
            <b style={{ display: 'block', fontSize: '1.1rem', overflowWrap: 'anywhere' }}>{resultat.tome.nom}</b>
            <b style={{ display: 'block', fontSize: '1.6rem' }}>Page {resultat.page}</b>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button type="button" className="btn" onClick={commencer} style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Pencil size={16} aria-hidden="true" /> Commencer
              </button>
              {enQuete ? (
                <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--btn)', minHeight: '44px' }}>
                  <Check size={16} aria-hidden="true" /> Ajoutée à tes quêtes
                </small>
              ) : (
                <button type="button" className="btn alt" onClick={ajouterQuete} disabled={!tirage} style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Map size={16} aria-hidden="true" /> Ajouter à mes quêtes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {resultat?.tome.type === 'cozy' && <div style={{ marginTop: 'var(--espace-3)' }}><AvisPagesCozy tome={resultat.tome.nom} /></div>}
    </div>
  );
}

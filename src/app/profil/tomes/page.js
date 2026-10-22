'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, Plus, Check } from 'lucide-react';
import { VALEURS_TYPES } from '@/lib/typesColoriage';
import OngletsCollections from '@/components/OngletsCollections';
import AvisPagesCozy from '@/components/AvisPagesCozy';

const TYPES = [
  { valeur: 'mystere', label: 'Tomes (coloriages mystères)' },
  { valeur: 'cozy', label: 'Livres (Cozy colo)' },
];

export default function CatalogueTomesPage() {
  const [tomes, setTomes] = useState([]);
  const [possedes, setPossedes] = useState(new Set());
  const [type, setType] = useState('mystere');
  const [collection, setCollection] = useState('');
  const [mesTomes, setMesTomes] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(null);
  const [progression, setProgression] = useState({});
  // Types visibles selon les préférences : tomes (mystère), livres (Cozy) ou les deux
  const [visibles, setVisibles] = useState(VALEURS_TYPES);

  useEffect(() => {
    async function charger() {
      try {
        const [res, pref] = await Promise.all([fetch('/api/tomes/catalog'), fetch('/api/user/preferences')]);
        if (pref.ok) {
          const p = await pref.json();
          const v = p.typesVisibles || VALEURS_TYPES;
          setVisibles(v);
          // Onglet de départ : le premier type que la personne voit
          const premier = TYPES.find((t) => v.includes(t.valeur));
          if (premier) setType(premier.valeur);
        }
        if (res.ok) {
          const data = await res.json();
          setTomes(data.tomes || []);
          setPossedes(new Set((data.possedes || []).map(Number)));
          setProgression(data.progression || {});
        }
      } catch (err) {
        console.error('Erreur chargement tomes :', err);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  const [ajoutCozy, setAjoutCozy] = useState('');

  async function basculer(tome) {
    const id = Number(tome.id);
    const possede = possedes.has(id);
    // Mise à jour immédiate, annulée si la requête échoue
    const maj = new Set(possedes);
    if (possede) maj.delete(id); else maj.add(id);
    // Livre Cozy colo ajouté : rappel que son nombre de pages peut être faux, avec un lien vers Aide déjà rempli
    if (!possede && tome.type === 'cozy') setAjoutCozy(tome.nom);
    setPossedes(maj);
    setEnCours(id);
    try {
      const res = await fetch('/api/tomes/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tomeId: id, action: possede ? 'REMOVE' : 'ADD' }),
      });
      if (!res.ok) setPossedes(possedes);
    } catch {
      setPossedes(possedes);
    } finally {
      setEnCours(null);
    }
  }

  // Collections disponibles pour le type choisi (Disney, Hors Disney, Coco Wyo...)
  const collections = useMemo(
    () => [...new Set(tomes.filter((t) => t.type === type).map((t) => t.collection).filter(Boolean))].sort(),
    [tomes, type]
  );

  const q = recherche.trim().toLowerCase();
  // Tomes trouvés par mot-clef (ex. « stitch » trouve les livres où Stitch apparaît)
  const [parMotCle, setParMotCle] = useState(new Set());
  useEffect(() => {
    if (q.length < 2) { setParMotCle(new Set()); return; }
    const minuterie = setTimeout(async () => {
      const r = await fetch(`/api/mots-cles?q=${encodeURIComponent(q)}`).catch(() => null);
      if (r?.ok) setParMotCle(new Set(((await r.json()).resultats || []).map((t) => Number(t.id))));
    }, 250);
    return () => clearTimeout(minuterie);
  }, [q]);
  const tomesAffiches = tomes.filter((t) => {
    if (t.type !== type) return false;
    if (collection && t.collection !== collection) return false;
    if (mesTomes && !possedes.has(Number(t.id))) return false;
    return !q || t.nom.toLowerCase().includes(q) || parMotCle.has(Number(t.id));
  });

  const puce = (actif) => ({
    flex: '0 0 auto',
    minHeight: '44px',
    padding: '7px 14px',
    borderRadius: '999px',
    fontSize: '0.85rem',
    border: actif ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)',
    background: actif ? 'var(--btn)' : 'var(--carte)',
    color: actif ? '#ffffff' : 'var(--texte-principal)',
    fontWeight: actif ? 'bold' : 'normal',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  if (chargement) {
    return (
      <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
        <p>Chargement de KROMADEX...</p>
      </div>
    );
  }

  return (
    <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>

      {/* Collections : onglet Tomes et livres, sous-onglet Tomes et livres à ajouter */}
      <OngletsCollections actif="ajouter" visibles={visibles} />

      {/* Filtres collants en haut de l'écran */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5, background: 'var(--fond-page)',
        paddingBottom: 'var(--espace-2)', marginBottom: 'var(--espace-2)',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: '6px' }}>
          {TYPES.filter((t) => visibles.includes(t.valeur)).map((t) => (
            <button
              key={t.valeur}
              type="button"
              className={type === t.valeur ? 'btn' : 'btn alt'}
              onClick={() => { setType(t.valeur); setCollection(''); }}
              style={{ fontSize: '0.9rem', padding: '10px 8px', justifyContent: 'center' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--texte-secondaire)' }} />
          <input
            type="search"
            placeholder="Rechercher par nom ou mot-clef (ex. Stitch)"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' }}>
          <button type="button" style={puce(mesTomes)} onClick={() => setMesTomes(!mesTomes)}>
            Mes tomes ({tomes.filter((t) => t.type === type && possedes.has(Number(t.id))).length})
          </button>
          <button type="button" style={puce(!collection)} onClick={() => setCollection('')}>Tous</button>
          {collections.map((c) => (
            <button key={c} type="button" style={puce(collection === c)} onClick={() => setCollection(c)}>{c}</button>
          ))}
        </div>
        {/* Livre Cozy colo qu'on vient d'ajouter : rappel visible même plus bas dans la liste */}
        {ajoutCozy && <AvisPagesCozy tome={ajoutCozy} onFermer={() => setAjoutCozy('')} />}
      </div>

      {/* Livres Cozy colo : le nombre de pages peut être différent du nombre de coloriages */}
      {type === 'cozy' && !ajoutCozy && <AvisPagesCozy />}

      {tomesAffiches.length === 0 && (
        <p style={{ color: 'var(--texte-secondaire)' }}>
          {mesTomes ? 'Aucun tome dans ta bibliothèque ici. Touche « Je l\'ai » sous une couverture pour l\'ajouter.' : 'Aucun tome trouvé.'}
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
        gap: '10px'
      }}>
        {tomesAffiches.map((t) => {
          const possede = possedes.has(Number(t.id));
          return (
            <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={t.couverture}
                  alt={t.nom}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%', aspectRatio: '3 / 4', objectFit: 'contain',
                    background: 'var(--carte)', borderRadius: '8px', display: 'block',
                    outline: possede ? '3px solid var(--btn)' : 'none', outlineOffset: '-3px'
                  }}
                />
                {possede && (
                  <span style={{
                    position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%',
                    background: 'var(--btn)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check size={14} />
                  </span>
                )}
              </div>
              <b style={{ fontSize: '0.8rem', lineHeight: 1.25, color: 'var(--texte-principal)' }}>{t.nom}</b>
              {possede ? (
                <small style={{ color: 'var(--btn)', fontSize: '0.72rem', fontWeight: 'bold' }}>
                  {progression[t.id]?.coloriees || 0} / {t.nb_pages || '?'} pages
                </small>
              ) : t.nb_pages ? <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.72rem' }}>{t.nb_pages} pages</small> : null}
              <button
                type="button"
                className={possede ? 'btn alt' : 'btn'}
                disabled={enCours === Number(t.id)}
                onClick={() => basculer(t)}
                style={{ marginTop: 'auto', fontSize: '0.75rem', padding: '7px 6px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                {possede ? 'Retirer' : <><Plus size={13} /> Je l'ai</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

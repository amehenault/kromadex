'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gem, Trash2 } from 'lucide-react';
import Feuille from './Feuille';
import Pseudo from './Pseudo';
import TexteErreur from './TexteErreur';
import { Avatar } from '@/app/communaute/outils';

export function Cristaux({ note, taille = 14, onChoisir }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: onChoisir ? '2px' : '1px' }} aria-label={onChoisir ? undefined : `${note || 0} cristaux sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const plein = (note || 0) >= n - 0.25;
        const icone = <Gem size={taille} aria-hidden="true" fill={plein ? 'var(--btn)' : 'none'} style={{ color: plein ? 'var(--btn)' : 'var(--texte-secondaire)' }} />;
        return onChoisir ? (
          <button key={n} type="button" onClick={() => onChoisir(n)} aria-label={`${n} cristal${n > 1 ? 'aux' : ''} sur 5`} aria-pressed={note === n}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', minWidth: 44, minHeight: 44, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {icone}
          </button>
        ) : <span key={n}>{icone}</span>;
      })}
    </span>
  );
}

const quand = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

export default function AvisTome({ tome, onFermer, onMaj }) {
  const [donnees, setDonnees] = useState(null);
  const [note, setNote] = useState(0);
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState('');

  function appliquer(d) {
    setDonnees(d);
    const mien = d.avis?.find((a) => a.mien);
    setNote(mien?.note || 0); setTexte(mien?.avis || '');
    if (onMaj) {
      const notes = (d.avis || []).map((a) => a.note);
      onMaj(tome.id, { nb_avis: notes.length, moyenne: notes.length ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10 : null });
    }
  }
  useEffect(() => {
    fetch(`/api/tomes/avis?id=${tome.id}`).then((r) => r.json()).then(appliquer).catch(() => setDonnees({ avis: [], possede: false }));
  }, [tome.id]);

  async function appeler(method, corps) {
    setErreur('');
    const r = await fetch('/api/tomes/avis', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tomeId: tome.id, ...corps }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErreur(d.error || 'Erreur, réessaie.'); return; }
    appliquer(d);
  }

  const mien = donnees?.avis.find((a) => a.mien);
  const autres = donnees?.avis.filter((a) => !a.mien) || [];
  return (
    <Feuille titre={`Avis : ${tome.nom}`} onFermer={onFermer}>
      {donnees === null && <p>Chargement…</p>}
      {donnees && (
        <>
          {donnees.possede ? (
            <form onSubmit={(e) => { e.preventDefault(); appeler('POST', { note, avis: texte }); }} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <b>{mien ? 'Mon avis' : 'Donner mon avis'}</b>
              <Cristaux note={note} taille={24} onChoisir={setNote} />
              <textarea rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={300} placeholder="ex. Trop de détails, pages recto seulement…" aria-label="Mon avis" />
              {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn" disabled={!note} style={{ flex: 1, minHeight: '48px', fontWeight: 700 }}>{mien ? 'Mettre à jour' : 'Publier mon avis'}</button>
                {mien && (
                  <button type="button" className="btn alt danger" onClick={() => confirm('Retirer ton avis ?') && appeler('DELETE', {})}
                    style={{ minHeight: '48px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Trash2 size={16} aria-hidden="true" /> Retirer</button>
                )}
              </div>
            </form>
          ) : (
            <small style={{ color: 'var(--texte-secondaire)' }}>Ajoute ce {tome.type === 'cozy' ? 'livre' : 'tome'} à ta collection pour donner ton avis.</small>
          )}

          <b style={{ marginTop: '6px' }}>Avis de la communauté</b>
          {!autres.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun autre avis pour l’instant.</small>}
          {autres.map((a) => (
            <div key={a.auteur_id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0', borderTop: '1px solid var(--bordure-carte)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <Link href={`/membre/${a.auteur_id}`} aria-label="Voir le profil"><Avatar x={a} taille={24} /></Link>
                <small style={{ flex: 1, minWidth: 0 }}><Pseudo x={a} /></small>
                <Cristaux note={a.note} />
              </div>
              {a.avis && <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.avis}</p>}
              <small style={{ color: 'var(--texte-secondaire)' }}>{quand(a.maj_le)}</small>
            </div>
          ))}
        </>
      )}
    </Feuille>
  );
}

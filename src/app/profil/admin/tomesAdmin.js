'use client';
import { useEffect, useState } from 'react';
import { Search, Check, BookOpen } from 'lucide-react';
import { envoyer, colonne, ligneCarte, aide, petitBtn } from './outils';

const NOMS_TYPES = { mystere: 'Tome', cozy: 'Cozy colo' };

// Tomes et livres : changer le nombre de pages directement, sans modifier db/tomes.json ni relancer npm run db:tomes.
// Le changement s'applique tout de suite (collections, Roue du Destin, quêtes du Destin en cours).
export default function TomesAdmin() {
  const [tomes, setTomes] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [valeurs, setValeurs] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/tomes/admin').then((r) => (r.ok ? r.json() : null)).then((d) => d && setTomes(d.tomes || []));
  }, []);

  async function enregistrer(t) {
    const r = await envoyer('/api/tomes/admin', 'PUT', { id: t.id, nbPages: valeurs[t.id] });
    if (!r.ok) { setMessage(r.error); return; }
    setTomes((l) => l.map((x) => (x.id === t.id ? { ...x, nb_pages: r.nb_pages, nb_pages_manuel: true } : x)));
    setValeurs((v) => { const c = { ...v }; delete c[t.id]; return c; });
    setMessage(`« ${t.nom} » : ${r.nb_pages} pages enregistrées.`);
  }

  if (!tomes) return <p>Chargement…</p>;
  const q = recherche.trim().toLowerCase();
  const liste = q ? tomes.filter((t) => (t.nom || '').toLowerCase().includes(q) || (t.collection || '').toLowerCase().includes(q)) : [];

  return (
    <div className="carte" style={colonne}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={18} aria-hidden="true" /> Nombre de pages des tomes et livres</b>
      <p style={aide}>
        Cherche un tome ou un livre, change son nombre de pages et enregistre : c’est tout de suite à jour pour tout le monde,
        sans npm run db:tomes. Un nombre changé ici n’est plus écrasé par db/tomes.json.
      </p>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '10px', color: 'var(--texte-secondaire)' }} />
        <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom du tome ou du livre"
          aria-label="Rechercher un tome ou un livre" style={{ width: '100%', paddingLeft: '32px' }} />
      </div>
      {message && <small>{message}</small>}
      {q && !liste.length && <p style={aide}>Aucun tome trouvé.</p>}
      {liste.slice(0, 30).map((t) => {
        const valeur = valeurs[t.id] ?? (t.nb_pages ?? '');
        const change = String(valeur) !== String(t.nb_pages ?? '');
        return (
          <div key={t.id} style={{ ...ligneCarte, flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: 40, flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' }}>
              {t.couverture && <img src={t.couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{t.nom}</b>
              <small style={aide}>{NOMS_TYPES[t.type] || t.type}{t.collection ? ` · ${t.collection}` : ''}{t.nb_pages_manuel ? ' · changé ici' : ''}</small>
            </div>
            <input type="number" inputMode="numeric" min={1} max={500} value={valeur} aria-label={`Nombre de pages de ${t.nom}`}
              onChange={(e) => setValeurs((v) => ({ ...v, [t.id]: e.target.value }))} style={{ width: '72px', flex: '0 0 auto' }} />
            <button type="button" className="btn" disabled={!change || !valeur} onClick={() => enregistrer(t)} aria-label={`Enregistrer le nombre de pages de ${t.nom}`}
              style={{ ...petitBtn, minWidth: '44px', justifyContent: 'center', flex: '0 0 auto' }}>
              <Check size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

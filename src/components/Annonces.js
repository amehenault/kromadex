'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Trophy, X, AlertTriangle, MessageCircle } from 'lucide-react';

const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const poster = (url, corps) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });

// Accueil : avertissements, réponses aux demandes d'aide, défi du mois et missives non lues
export default function Annonces() {
  const [missives, setMissives] = useState([]);
  const [defi, setDefi] = useState(null);
  const [avertissements, setAvertissements] = useState([]);
  const [reponses, setReponses] = useState(0);
  const [ouverte, setOuverte] = useState(null);

  useEffect(() => {
    json('/api/missives').then((d) => d && setMissives((d.missives || []).filter((m) => !m.lue)));
    json('/api/defis').then((d) => d && setDefi(d.defis.find((x) => x.mois === d.moisActuel) || null));
    json('/api/moderation?miens=1').then((d) => d && setAvertissements(d.avertissements || []));
    json('/api/demandes').then((d) => d && setReponses((d.demandes || []).filter((x) => !x.reponse_vue).length));
  }, []);

  async function marquerLue(m) {
    setMissives((l) => l.filter((x) => x.id !== m.id));
    await poster('/api/missives', { lue: m.id });
  }

  async function avertissementsLus() {
    setAvertissements([]);
    await poster('/api/moderation', { lus: true });
  }

  if (!defi && !missives.length && !avertissements.length && !reponses) return null;

  const carte = {
    background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)',
    padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0,
  };
  const fermer = {
    flex: '0 0 auto', width: '36px', height: '36px', border: 'none', borderRadius: '50%', background: 'var(--carte)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--texte-principal)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' }}>
      {avertissements.length > 0 && (
        <div style={{ ...carte, border: '2px solid var(--danger)' }}>
          <AlertTriangle size={20} style={{ flex: '0 0 auto', color: 'var(--danger)', marginTop: '2px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: 'block' }}>Avertissement de la modération</b>
            {avertissements.map((a) => (
              <p key={a.id} style={{ margin: '4px 0 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.motif}</p>
            ))}
            <small style={{ color: 'var(--texte-secondaire)' }}>Merci de garder Kromadex accueillant pour tout le monde.</small>
          </div>
          <button type="button" aria-label="J'ai lu" onClick={avertissementsLus} style={fermer}><X size={16} /></button>
        </div>
      )}
      {reponses > 0 && (
        <Link href="/aide" style={{ ...carte, textDecoration: 'none', color: 'inherit', border: '2px solid var(--btn)' }}>
          <MessageCircle size={20} style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
          <b>{reponses > 1 ? `${reponses} nouvelles réponses` : 'Nouvelle réponse'} à tes demandes d'aide</b>
        </Link>
      )}
      {defi && (
        <div style={carte}>
          <Trophy size={20} style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
          <div style={{ minWidth: 0 }}>
            <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--texte-secondaire)' }}>Défi du mois</small>
            <b style={{ display: 'block' }}>{defi.titre}</b>
            {defi.description && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{defi.description}</p>}
          </div>
        </div>
      )}
      {missives.map((m) => (
        <div key={m.id} style={carte}>
          <Mail size={20} style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
          <div style={{ flex: 1, minWidth: 0 }} onClick={() => setOuverte(ouverte === m.id ? null : m.id)}>
            <b style={{ display: 'block', cursor: 'pointer' }}>{m.titre}</b>
            {m.contenu && (
              <p style={{
                margin: '4px 0 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap',
                ...(ouverte === m.id ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
              }}>{m.contenu}</p>
            )}
          </div>
          <button type="button" aria-label="Marquer comme lue" onClick={() => marquerLue(m)} style={fermer}><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

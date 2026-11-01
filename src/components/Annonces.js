'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, X, AlertTriangle, MessageCircle, Swords, Compass, Shield, Sparkles } from 'lucide-react';
import { TempsRestant } from '@/components/Fuseau';
import { NOMS_AVENTURES } from '@/lib/activites';

const ICONES_AVENTURES = { expedition: Compass, epopee: Shield, prophetie: Sparkles };

const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const poster = (url, corps) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });

export default function Annonces() {
  const [missives, setMissives] = useState([]);
  const [aventures, setAventures] = useState([]);
  const [avertissements, setAvertissements] = useState([]);
  const [reponses, setReponses] = useState(0);
  const [invitations, setInvitations] = useState(0);

  useEffect(() => {
    json('/api/missives').then((d) => d && setMissives((d.missives || []).filter((m) => !m.lue && !m.epinglee)));
    json('/api/aventures').then((d) => d && setAventures((d.aventures || []).filter((a) => !a.terminee)));
    json('/api/moderation?miens=1').then((d) => d && setAvertissements(d.avertissements || []));
    json('/api/demandes').then((d) => d && setReponses((d.demandes || []).filter((x) => !x.reponse_vue).length));
    json('/api/combats').then((d) => d && setInvitations((d.combats || []).filter((c) => c.statut === 'ouvert' && String(c.invite) === d.moi).length));
  }, []);

  async function avertissementsLus() {
    setAvertissements([]);
    await poster('/api/moderation', { lus: true });
  }

  if (!aventures.length && !missives.length && !avertissements.length && !reponses && !invitations) return null;

  const carte = {
    background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)',
    padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0,
  };
  const fermer = {
    flex: '0 0 auto', width: '44px', height: '44px', border: 'none', borderRadius: '50%', background: 'var(--carte)',
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
      {invitations > 0 && (
        <Link href="/combats" style={{ ...carte, textDecoration: 'none', color: 'inherit', border: '2px solid var(--btn)' }}>
          <Swords size={20} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
          <b>{invitations > 1 ? `${invitations} invitations` : 'Une invitation'} à un combat</b>
        </Link>
      )}
      {reponses > 0 && (
        <Link href="/aide" style={{ ...carte, textDecoration: 'none', color: 'inherit', border: '2px solid var(--btn)' }}>
          <MessageCircle size={20} style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
          <b>{reponses > 1 ? `${reponses} nouvelles réponses` : 'Nouvelle réponse'} à tes demandes d'aide</b>
        </Link>
      )}
      {aventures.map((a) => {
        const Icone = ICONES_AVENTURES[a.genre] || Compass;
        const type = NOMS_AVENTURES[a.genre]?.singulier || 'aventure';
        return (
          <Link key={a.id} href="/aventures" style={{ ...carte, textDecoration: 'none', color: 'inherit', border: '2px solid var(--btn)' }}>
            <Icone size={20} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
            <div style={{ minWidth: 0 }}>
              <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--texte-secondaire)' }}>{type} · {a.titre}</small>
              <b style={{ display: 'block' }}>Une nouvelle aventure est disponible ! Vas-tu y participer pour gagner des XP et une récompense spéciale ?</b>
              <TempsRestant fin={a.fin_instant} style={{ display: 'flex', margin: '4px 0' }} />
              <small style={{ color: 'var(--btn)', fontWeight: 700 }}>{a.inscrit ? 'Tu participes · voir l’aventure' : 'Voir l’aventure'}</small>
            </div>
          </Link>
        );
      })}
      {missives.length > 0 && (
        <Link href={`/missives#missive-${missives[0].id}`} style={{ ...carte, textDecoration: 'none', color: 'inherit', border: '2px solid var(--btn)' }}>
          <Mail size={20} style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
          <div style={{ minWidth: 0 }}>
            <b style={{ display: 'block' }}>
              {missives.length > 1 ? `${missives.length} missives non lues` : 'Nouvelle missive'}
            </b>
            <small style={{ display: 'block', overflowWrap: 'anywhere' }}>{missives[0].titre}</small>
            <small style={{ color: 'var(--btn)', fontWeight: 700 }}>Lire dans Missives</small>
          </div>
        </Link>
      )}
    </div>
  );
}

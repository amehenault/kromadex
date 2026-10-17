'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Bug, BookOpen, Palette, Lightbulb, Send, PlayCircle } from 'lucide-react';
import { TYPES_DEMANDE, nomType, nomStatut } from '@/lib/demandes';

const ICONES = { question: HelpCircle, bug: Bug, tome: BookOpen, crayons: Palette, fonctionnalite: Lightbulb };
const AIDE_TEXTE = {
  question: 'Pose ta question, on te répond ici.',
  bug: "Explique ce qui s'est passé, sur quelle page, et ce que tu essayais de faire.",
  tome: "Donne le titre, l'éditeur et si possible un lien ou le code EAN (au dos du livre).",
  crayons: 'Donne la marque, le nom du kit, le nombre de couleurs et si possible un lien.',
  fonctionnalite: "Décris l'idée et ce qu'elle t'aiderait à faire.",
};
const COULEUR_STATUT = { nouvelle: 'var(--texte-secondaire)', en_cours: 'var(--btn)', resolue: 'var(--btn-save)', ajoutee: 'var(--btn-save)', refusee: 'var(--danger)' };

// Page Aide : envoyer une demande et suivre les réponses
export default function AideClient() {
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [retour, setRetour] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [demandes, setDemandes] = useState([]);

  async function charger() {
    const res = await fetch('/api/demandes');
    if (!res.ok) return;
    const d = (await res.json()).demandes || [];
    setDemandes(d);
    // Les réponses affichées ici sont considérées comme vues
    if (d.some((x) => !x.reponse_vue)) {
      fetch('/api/demandes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vues: true }) })
        .then(() => window.dispatchEvent(new Event('kromadex-lu')));
    }
  }
  useEffect(() => { charger(); }, []);

  async function envoyer(e) {
    e.preventDefault();
    setOccupe(true); setRetour('');
    const res = await fetch('/api/demandes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, message }) });
    const d = await res.json().catch(() => ({}));
    setOccupe(false);
    if (res.ok) { setRetour('Merci ! Ta demande est envoyée'); setMessage(''); setType(''); charger(); }
    else setRetour(d.error || 'Erreur, réessaie.');
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Aide</h2>
      </div>

      <Link href="/?tutoriel=1" className="btn alt" style={{ display: 'flex', width: '100%', minHeight: '48px', marginBottom: 'var(--espace-3)', boxSizing: 'border-box' }}>
        <PlayCircle size={18} aria-hidden="true" /> Revoir la présentation de Kromadex
      </Link>

      <form onSubmit={envoyer} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <b>Que veux-tu faire ?</b>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {TYPES_DEMANDE.map((t) => {
            const Icone = ICONES[t.valeur];
            const actif = type === t.valeur;
            return (
              <button key={t.valeur} type="button" onClick={() => setType(t.valeur)} className={actif ? 'btn' : 'btn alt'}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start', minHeight: '48px', textAlign: 'left' }}>
                <Icone size={18} style={{ flex: '0 0 auto' }} /> {t.label}
              </button>
            );
          })}
        </div>

        {type && (
          <>
            <small style={{ color: 'var(--texte-secondaire)' }}>{AIDE_TEXTE[type]}</small>
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} placeholder="Ton message" />
            <button type="submit" className="btn" disabled={occupe || message.trim().length < 3}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '46px', fontWeight: 'bold' }}>
              <Send size={16} /> {occupe ? 'Envoi…' : 'Envoyer'}
            </button>
          </>
        )}
        {retour && <small style={{ textAlign: 'center' }}>{retour}</small>}
      </form>

      {demandes.length > 0 && (
        <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <b>Mes demandes</b>
          {demandes.map((d) => (
            <div key={d.id} style={{
              padding: '10px 12px', borderRadius: 'var(--rayon-m)', background: 'var(--fond-carte)', minWidth: 0,
              border: d.reponse_vue ? '1px solid var(--bordure-carte)' : '2px solid var(--btn)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <small style={{ fontWeight: 700 }}>{nomType(d.type)}</small>
                <small style={{ fontWeight: 700, color: COULEUR_STATUT[d.statut] }}>{nomStatut(d.statut)}</small>
              </div>
              <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.9rem' }}>{d.message}</p>
              <small style={{ color: 'var(--texte-secondaire)' }}>{new Date(d.cree_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</small>
              {d.reponse && (
                <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: 'var(--rayon-s)', background: 'var(--carte)' }}>
                  <small style={{ fontWeight: 700 }}>Réponse{!d.reponse_vue ? ' · nouveau' : ''}</small>
                  <p style={{ margin: '2px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.9rem' }}>{d.reponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

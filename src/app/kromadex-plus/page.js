import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, ExternalLink, Settings } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { abonnementDe, lienPaiement, GESTION_PLUS, PRIX_PLUS, AVANTAGES } from '@/lib/abonnement';

export const dynamic = 'force-dynamic';

const jour = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' });

// Kromadex+ : l'offre, le paiement (ThriveCart) et la gestion de l'abonnement (carte, annulation)
export default async function KromadexPlus() {
  const user = await getUser();
  if (!user) redirect('/login');
  const abo = await abonnementDe(user.id);
  const paye = abo.plus_jusqu && new Date(abo.plus_jusqu) > new Date() && abo.plus_statut !== 'aucun';

  const liste = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' };
  const ligne = { display: 'flex', gap: '8px', alignItems: 'flex-start' };
  const bouton = { display: 'flex', width: '100%', minHeight: '52px', boxSizing: 'border-box', fontWeight: 700 };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <img src="/kromadex-plus.svg" alt="Kromadex+" style={{ height: '34px', width: 'auto', maxWidth: '70%' }} />
      </div>

      {abo.plus ? (
        // Déjà Kromadex+ : état de l'abonnement et gestion
        <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)', marginBottom: 'var(--espace-3)' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Tu profites de Kromadex+</h2>
          {paye ? (
            <p style={{ margin: 0 }}>
              {abo.plus_statut === 'annule'
                ? <>Ton abonnement est annulé : Kromadex+ reste actif jusqu’au <b>{jour(abo.plus_jusqu)}</b>, puis tu repasses à la version gratuite.</>
                : <>Abonnement {abo.plus_formule === 'annuel' ? 'annuel' : 'mensuel'}, renouvelé automatiquement. Prochain renouvellement vers le <b>{jour(abo.plus_jusqu)}</b>.</>}
            </p>
          ) : (
            <p style={{ margin: 0 }}>{abo.role === 'admin' ? 'En tant qu’Invocatrice, tu as accès à tout.' : <>Kromadex+ t’est offert par l’Invocatrice jusqu’au <b>{jour(new Date(new Date(abo.plus_offert_jusqu) - 1))}</b>.</>}</p>
          )}
          {paye && (
            <>
              <a href={GESTION_PLUS} target="_blank" rel="noopener noreferrer" className="btn" style={bouton}>
                <Settings size={18} aria-hidden="true" /> Gérer l’abonnement <ExternalLink size={16} aria-hidden="true" />
              </a>
              <small style={{ color: 'var(--texte-secondaire)' }}>
                Change ta carte ou annule ton abonnement à tout moment. Après une annulation, tu gardes Kromadex+ jusqu’à la fin de la période déjà payée.
                Connecte-toi avec le courriel utilisé pour payer.
              </small>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)', marginBottom: 'var(--espace-3)' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Passe à Kromadex+</h2>
            <ul style={liste}>
              {AVANTAGES.plus.map((a) => (
                <li key={a} style={ligne}><Check size={18} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--accent-primaire)' }} /> {a}</li>
              ))}
            </ul>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              {[['Mensuel', PRIX_PLUS.mensuel, 'par mois'], ['Annuel', PRIX_PLUS.annuel, 'par année']].map(([nom, prix, periode]) => (
                <div key={nom} style={{ border: '2px solid var(--couleur-secondaire)', borderRadius: 'var(--rayon-m)', padding: '10px', textAlign: 'center', minWidth: 0 }}>
                  <small style={{ display: 'block', fontWeight: 700, color: 'var(--texte-secondaire)' }}>{nom}</small>
                  <b style={{ display: 'block', fontSize: '1.3rem' }}>{prix}</b>
                  <small>{periode}</small>
                </div>
              ))}
            </div>
            <a href={lienPaiement(user.id, user.email)} className="btn" style={bouton}>
              S’abonner à Kromadex+
            </a>
            <small style={{ color: 'var(--texte-secondaire)' }}>
              Prix en dollars canadiens, taxes en sus pour le Canada. Hors Canada, ta banque convertit le montant dans ta devise.
              Tu choisis la formule sur la page de paiement. Sans engagement : annule à tout moment depuis « Gérer l’abonnement ».
              Utilise de préférence le même courriel que ton compte Kromadex.
            </small>
          </div>
          <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-2)', marginBottom: 'var(--espace-3)' }}>
            <b>Toujours inclus gratuitement</b>
            <ul style={liste}>
              {AVANTAGES.gratuit.map((a) => (
                <li key={a} style={{ ...ligne, color: 'var(--texte-secondaire)' }}><Check size={16} aria-hidden="true" style={{ flex: '0 0 auto' }} /> {a}</li>
              ))}
            </ul>
          </div>
          <a href={GESTION_PLUS} target="_blank" rel="noopener noreferrer" className="btn alt" style={{ ...bouton, fontWeight: 600 }}>
            <Settings size={18} aria-hidden="true" /> Gérer l’abonnement <ExternalLink size={16} aria-hidden="true" />
          </a>
          <small style={{ display: 'block', color: 'var(--texte-secondaire)', marginTop: '6px' }}>
            Tu as déjà payé mais Kromadex+ ne s’affiche pas ? Écris-nous dans Aide et demandes.
          </small>
        </>
      )}
    </div>
  );
}

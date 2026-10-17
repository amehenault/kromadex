'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Plus, BookOpen, Users, Trophy, Grid3x3, Swords, Compass, Map, Crown, HelpCircle, ArrowLeft, ArrowRight, X,
} from 'lucide-react';

// Présentation de Kromadex : un écran par grande fonctionnalité.
// S'ouvre une seule fois après l'inscription, et se revoit depuis la page Aide.
const ECRANS = [
  {
    icone: Sparkles, titre: 'Bienvenue dans Kromadex',
    texte: 'Ton carnet de coloriages et une communauté de coloristes. Chaque coloriage, épreuve ou combat te fait gagner des XP pour monter de niveau.',
  },
  {
    icone: Plus, titre: 'Ajouter un coloriage',
    texte: 'Le bouton + du menu du bas : ta photo, le tome et la page, tes codes couleurs et un mémo privé.',
    points: ['Publie-le dans la communauté si tu veux le partager', 'Ajoute des mots-clefs pour retrouver une page facilement'],
  },
  {
    icone: BookOpen, titre: 'Ta bibliothèque',
    texte: 'Ajoute tes tomes (coloriage mystère) et tes livres (Cozy colo) : ta progression se remplit toute seule.',
    points: ['Ma collection : tes crayons et feutres', 'La Roue du destin choisit pour toi une page pas encore faite'],
  },
  {
    icone: Users, titre: 'La communauté',
    texte: 'Le fil des coloriages publiés : J’aime, commentaires, abonnements et recherche de codes couleurs.',
    points: ['Les missives : les nouvelles de Kromadex, dans ton profil', 'Un point rouge t’indique quand il y a du nouveau à lire'],
  },
  {
    icone: Trophy, titre: 'Les épreuves',
    texte: 'Un thème, un coloriage, puis l’Assemblée (les membres) rend son verdict. Les coloriages sont anonymes.',
    points: [
      'Épreuve mensuelle officielle : la personne gagnante devient Chef·fe des coloristes',
      'Épreuves des Sentinelles et des Chef·fes',
      'Épreuves de groupe : un objectif à atteindre ensemble',
    ],
  },
  {
    icone: Grid3x3, titre: 'Les bingos',
    texte: 'Une grille de 3 x 3 cases par mois. Ajoute un coloriage dans chaque case qui correspond : lignes et grille complète donnent des XP.',
  },
  {
    icone: Swords, titre: 'Les combats',
    points: [
      'Duel chromatique : tu invites une personne que tu suis (et qui te suit) sur un même thème',
      'Joute ouverte : tu lances un appel, quelqu’un l’accepte librement',
      'Tournoi du royaume : 8 ou 16 coloristes, ronde après ronde jusqu’à la finale',
    ],
    texte: 'Des coloristes s’affrontent sur un thème, l’Assemblée choisit le gagnant.',
  },
  {
    icone: Compass, titre: 'Les aventures',
    texte: 'Des activités spéciales avec des contraintes à respecter, à faire avec les coloriages de tes tomes et livres.',
    points: [
      'Expédition : courte, liée à une fête, un seul coloriage',
      'Épopée : 2 semaines, toute la communauté s’unit pour vaincre un dragon',
      'Prophétie : 1 par année, des étapes secrètes révélées chaque semaine',
    ],
  },
  {
    icone: Map, titre: 'XP, niveaux et quêtes',
    texte: 'Tes XP te font monter de niveau et débloquent des titres. Les quêtes se complètent toutes seules en utilisant l’appli.',
    points: ['Reviens plusieurs jours de suite pour un bonus de série', 'Tes récompenses s’affichent sur ton profil'],
  },
  {
    icone: Crown, titre: 'Les rôles',
    texte: 'La couleur d’un pseudo montre le rôle de la personne.',
    roles: [
      ['var(--coloriste)', 'Coloriste', 'tout le monde au départ'],
      ['var(--chef)', 'Chef·fe des coloristes', 'a gagné l’épreuve du mois'],
      ['var(--sentinelle)', 'Sentinelle du Kromadex', 'veille sur la communauté'],
      ['var(--admin)', 'Invocatrice des couleurs', 'la créatrice de Kromadex'],
    ],
  },
  {
    icone: HelpCircle, titre: 'Besoin d’aide ?',
    texte: 'Profil > Aide et demandes : pose une question, signale un bug ou propose une idée. Tu peux revoir cette présentation à tout moment depuis cette page.',
  },
];

export default function Tutoriel({ ouvertAuDepart }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(ouvertAuDepart);
  const [i, setI] = useState(0);

  // Pas de défilement de la page derrière la présentation
  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = avant; };
  }, [ouvert]);

  function terminer() {
    setOuvert(false);
    fetch('/api/user/tutoriel', { method: 'POST' }).catch(() => {});
    // Retire ?tutoriel=1 de l'adresse quand on venait de la page Aide
    if (window.location.search.includes('tutoriel')) router.replace('/');
  }

  if (!ouvert) return null;
  const e = ECRANS[i];
  const Icone = e.icone;
  const dernier = i === ECRANS.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="Présentation de Kromadex"
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--espace-4)' }}>
      <div style={{
        width: '100%', maxWidth: '460px', maxHeight: '100%', overflowY: 'auto', boxSizing: 'border-box',
        background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l)', padding: 'var(--espace-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <small style={{ color: 'var(--texte-secondaire)', fontWeight: 700 }}>{i + 1} / {ECRANS.length}</small>
          <button type="button" onClick={terminer} className="btn alt" aria-label="Passer la présentation"
            style={{ minHeight: '44px', padding: '0 12px', fontSize: '0.85rem' }}>
            Passer <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--espace-2)', textAlign: 'center' }}>
          <span style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-doux)', color: 'var(--accent-primaire)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icone size={32} aria-hidden="true" />
          </span>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{e.titre}</h2>
          {e.texte && <p style={{ margin: 0 }}>{e.texte}</p>}
        </div>

        {e.points && (
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {e.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
        {e.roles && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {e.roles.map(([couleur, nom, detail]) => (
              <div key={nom}>
                <b style={{ color: couleur }}>{nom}</b>
                <small style={{ color: 'var(--texte-secondaire)' }}> · {detail}</small>
              </div>
            ))}
          </div>
        )}

        {/* Points de progression */}
        <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {ECRANS.map((_, n) => (
            <span key={n} style={{ width: '8px', height: '8px', borderRadius: '50%', background: n === i ? 'var(--accent-primaire)' : 'var(--bordure)' }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: i ? '1fr 1fr' : '1fr', gap: '8px' }}>
          {i > 0 && (
            <button type="button" className="btn alt" onClick={() => setI(i - 1)} style={{ minHeight: '48px' }}>
              <ArrowLeft size={18} aria-hidden="true" /> Précédent
            </button>
          )}
          <button type="button" className="btn" onClick={() => (dernier ? terminer() : setI(i + 1))} style={{ minHeight: '48px', fontWeight: 700 }}>
            {dernier ? 'C’est parti !' : <>Suivant <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

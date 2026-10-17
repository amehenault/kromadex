'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Star, Map, Plus, BookOpen, Dices, Users, Mail, Trophy, Grid3x3, Swords, Compass, Crown, HelpCircle, Rocket,
  ArrowLeft, ArrowRight, X,
} from 'lucide-react';

// Présentation de Kromadex : un écran par grande fonctionnalité.
// S'ouvre une seule fois après l'inscription, et se revoit depuis la page Aide.
// Les textes finissent par un point ; les points de liste, jamais.
const ECRANS = [
  {
    icone: Sparkles, titre: 'Bienvenue dans Kromadex',
    texte: 'Ton application pour rassembler tes coloriages et tisser des liens avec d’autres coloristes.',
  },
  {
    icone: Star, titre: 'XP et niveaux',
    texte: 'Tes XP te font monter de niveau et débloquent des titres spéciaux.',
    points: ['Ton titre s’affiche sur ton profil'],
  },
  {
    icone: Map, titre: 'Quêtes',
    texte: 'Elles se complètent toutes seules en utilisant l’appli.',
    points: ['Tu peux les consulter sur ton profil'],
  },
  {
    icone: Plus, titre: 'Ajouter un coloriage',
    texte: 'Le bouton + du menu du bas te permet d’ajouter un coloriage et tous ses détails : une photo, le tome ou le livre dans lequel il se trouve, le numéro de page, les codes couleurs et même un mémo privé.',
    points: ['Publie-le dans la communauté pour que les autres coloristes voient tes talents', 'Ajoute des mots-clefs pour retrouver une page facilement et t’aider dans les différentes épreuves'],
  },
  {
    icone: BookOpen, titre: 'Ta bibliothèque',
    texte: 'Ajoute tes tomes de coloriage mystère et tes livres de Cozy colo pour suivre ta progression, qui se remplit toute seule.',
    points: ['Dans Ma collection, tu peux ajouter les différents crayons que tu possèdes'],
  },
  {
    icone: Dices, titre: 'Roue du Destin',
    texte: 'Elle te permet de choisir un coloriage au hasard parmi ta collection.',
    points: ['Tu peux aussi manipuler le Destin et choisir un tome ou un livre précis'],
  },
  {
    icone: Users, titre: 'La communauté',
    texte: 'C’est le fil des coloriages publiés : tu peux interagir avec chaque publication, t’abonner à d’autres coloristes et même voir les codes couleurs utilisés.',
    points: ['Plus tu interagis, plus tu fais vivre la communauté'],
  },
  {
    icone: Mail, titre: 'Les missives',
    texte: 'Elles se trouvent dans ton profil et racontent les nouvelles de Kromadex.',
    points: ['Un point rouge t’indique lorsqu’il y a du nouveau à lire'],
  },
  {
    icone: Trophy, titre: 'Les épreuves',
    texte: 'Ce sont des challenges de coloriage avec certaines contraintes. Tu peux y remporter des XP, des badges et différentes récompenses.',
    points: [
      'Épreuves mensuelles : chaque mois, je crée une épreuve. Les participations sont individuelles. La personne gagnante devient Chef.fe des coloristes pour un mois et choisit la thématique d’une prochaine épreuve',
      'Épreuves des Sentinelles et des Chef.fes : ces deux rôles de la communauté peuvent créer une épreuve sur la thématique de leur choix',
      'Épreuves de groupe : tous les coloristes peuvent créer des épreuves communautaires',
    ],
  },
  {
    icone: Grid3x3, titre: 'Les bingos',
    texte: 'Chaque mois, il y a deux grilles de bingo de 3 x 3. Tu ajoutes un coloriage dans chaque case qui correspond à ses critères.',
    points: ['Tu peux évidemment gagner des XP'],
  },
  {
    icone: Swords, titre: 'Les combats',
    points: [
      'Duel chromatique : tu invites une personne que tu suis (et qui te suit) à faire un coloriage sur le même thème',
      'Joute ouverte : tu lances un appel au Destin et quelqu’un peut l’accepter librement',
      'Tournoi du royaume : 8 ou 16 coloristes s’affrontent ronde après ronde jusqu’à la finale',
    ],
  },
  {
    icone: Compass, titre: 'Les aventures',
    texte: 'Ce sont des activités spéciales avec des contraintes à respecter, qui te donnent des XP et plusieurs récompenses à la clef.',
    points: [
      'Expédition : généralement de courte durée, elle est liée à une fête et demande peu de coloriages',
      'Épopée : elle dure 2 semaines, et la communauté s’unit pour vaincre un dragon qui sème la terreur dans un royaume. Plusieurs coloriages devront être soumis',
      'Prophétie : il n’y en a qu’une par année, et différentes étapes sont dévoilées chaque semaine',
    ],
  },
  {
    icone: Crown, titre: 'Les rôles',
    texte: 'La couleur d’un pseudo montre le rôle de la personne.',
    roles: [
      ['var(--coloriste)', 'Coloriste', 'les membres de l’Assemblée'],
      ['var(--chef)', 'Chef.fe des coloristes', 'a gagné une épreuve mensuelle'],
      ['var(--sentinelle)', 'Sentinelle', 'veille sur la communauté'],
      ['var(--admin)', 'Invocatrice des couleurs', 'la créatrice de Kromadex'],
      ['var(--noir)', 'Pionnière ou Pionnier', 'a testé Kromadex avant tout le monde'],
    ],
  },
  {
    icone: HelpCircle, titre: 'Besoin d’aide ?',
    texte: 'Dans ton profil, tu trouveras Aide et demandes. Tu pourras y poser une question, signaler un bug ou proposer une idée. Tu peux aussi revoir cette présentation à tout moment depuis cette même page.',
  },
  {
    icone: Rocket, titre: 'Bonne découverte',
    texte: 'Je te laisse explorer les contrées de Kromadex et ses différentes ressources.',
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

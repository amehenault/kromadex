import { sql } from '@/lib/db';
import { QUETES } from '@/lib/quetes';

export async function raisonsXP(userId, cles) {
  const ids = (prefixe, motif = '\\d+') => [...new Set(cles.map((c) => c.match(new RegExp(`^${prefixe}:(${motif})(?::|$)`))?.[1]).filter(Boolean))];
  const nums = (prefixe) => ids(prefixe).map(Number).filter(Number.isInteger);
  const uuids = ids('page', '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
  const [pages, defis, bingos, aventures, destins] = await Promise.all([
    uuids.length ? sql`SELECT id::text AS id, title FROM pages WHERE id = ANY(${uuids}::uuid[]) AND user_id = ${userId}` : [],
    [...nums('epreuve'), ...nums('groupe'), ...nums('victoire:epreuve')].length
      ? sql`SELECT id, titre FROM defis WHERE id = ANY(${[...nums('epreuve'), ...nums('groupe'), ...nums('victoire:epreuve')]})` : [],
    nums('bingo').length ? sql`SELECT id, titre FROM bingos WHERE id = ANY(${nums('bingo')})` : [],
    nums('aventure').length ? sql`SELECT id, titre FROM aventures WHERE id = ANY(${nums('aventure')})` : [],
    nums('destin').length ? sql`SELECT id, tome, page_no FROM roue_tirages WHERE id = ANY(${nums('destin')}) AND user_id = ${userId}` : [],
  ]);
  const nom = (liste, id, champ = 'titre') => liste.find((x) => String(x.id) === String(id))?.[champ];
  const guillemets = (t) => (t ? ` « ${t} »` : '');

  return Object.fromEntries(cles.map((cle) => {
    const [sorte, id] = cle.split(':');
    let raison;
    if (sorte === 'page') raison = cle.endsWith(':2')
      ? `ajouté la seconde page de la double page${guillemets(nom(pages, id, 'title'))}`
      : `ajouté le coloriage${guillemets(nom(pages, id, 'title'))}`;
    else if (sorte === 'quete') raison = `terminé la quête${guillemets(QUETES.find((q) => String(q.id) === id)?.titre)}`;
    else if (sorte === 'destin') {
      const d = destins.find((x) => String(x.id) === id);
      raison = `terminé ta quête du Destin${d ? ` (${d.tome}, page ${d.page_no})` : ''}`;
    } else if (cle.startsWith('serie-coloriage')) raison = 'colorié 7 jours de suite';
    else if (cle.startsWith('serie-connexion')) raison = 'visité Kromadex 7 jours de suite';
    else if (sorte === 'epreuve') raison = `participé à l’épreuve${guillemets(nom(defis, id))}`;
    else if (sorte === 'groupe') raison = `participé à l’épreuve de groupe${guillemets(nom(defis, id))}`;
    else if (cle.startsWith('victoire:epreuve:')) raison = `gagné l’épreuve${guillemets(nom(defis, cle.split(':')[2]))}`;
    else if (cle.startsWith('victoire:tournoi') || cle.startsWith('victoire:match')) raison = 'gagné au tournoi du royaume';
    else if (sorte === 'victoire') raison = 'remporté une victoire';
    else if (sorte === 'combat') raison = 'participé à un combat';
    else if (sorte === 'tournoi') raison = 'participé à un tournoi du royaume';
    else if (sorte === 'bingo') raison = `avancé dans le bingo${guillemets(nom(bingos, id))}`;
    else if (sorte === 'aventure') raison = `avancé dans l’aventure${guillemets(nom(aventures, id))}`;
    else if (sorte === 'relique') raison = 'complété une relique';
    else raison = 'participé à une activité';
    return [cle, raison];
  }));
}

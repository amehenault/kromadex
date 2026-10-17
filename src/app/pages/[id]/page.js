import { redirect, notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { listerMesTomes } from '@/lib/mesTomes';
import Editor from '@/components/Editor';

export default async function Fiche({ params, searchParams }) {
  const { id } = await params;
  const q = await searchParams;
  const user = await getUser();
  if (!user) redirect('/login');

  // Tomes et livres de la personne (possédés, perso ou déjà utilisés), avec leur type et leur nombre de pages
  const [mesTomes, [moi]] = await Promise.all([
    listerMesTomes(user.id),
    sql`select types_pratiques from users where id = ${user.id}`,
  ]);
  const bibliotheque = mesTomes.map((t) => ({ nom: t.nom, type: t.type, total: t.total || null }));

  let page = null;
  if (id !== 'new') {
    if (!isId(id)) notFound();
    const r = await sql`select id, title, tome, page_no, memo, codes, publiee, type_coloriage, image_type is not null as has_image, octet_length(image_b64) as img_size, palette_id
      from pages where id = ${id} and user_id = ${user.id}`;
    if (!r.length) notFound();
    page = r[0];
  }
  // Tome du catalogue du coloriage (les mots-clefs partagés s'y rattachent) et s'il est dans ma bibliothèque
  const [tomeCatalogue] = page?.tome ? await sql`
    select c.id, c.nom, exists (select 1 from user_tomes u where u.tome_id = c.id and u.user_id = ${String(user.id)}) as possede
    from tome_catalog c where lower(c.nom) = lower(${page.tome})
    order by possede desc limit 1` : [];
  const initial = page ? null : { tome: String(q?.tome || '').slice(0, 60), page_no: String(q?.page || '').slice(0, 10) };
  // Palette dont s'inspire le coloriage (?palette= depuis une palette, ou celle déjà liée)
  const idPalette = page ? page.palette_id : parseInt(q?.palette, 10) || null;
  const [palette] = idPalette ? await sql`
    select id, nom, couleurs from palettes where id = ${idPalette} and (user_id = ${user.id} or partagee)` : [];
  return (
    <Editor page={page} initial={initial} bibliotheque={bibliotheque} mesTypes={moi?.types_pratiques || []}
      tomeCatalogue={tomeCatalogue || null} palette={palette || null} />
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { pagesFaites } from '@/lib/mesTomes';
import NbPagesCozy from './nbPagesCozy';

export const dynamic = 'force-dynamic';

// Grille d'un tome : une case par coloriage, avec la photo quand la page est faite
export default async function TomePage({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');
  const nom = String((await searchParams)?.nom || '').trim();
  if (!nom) redirect('/profil');

  const uid = String(user.id);
  const [[cat], [perso], [couv], pages] = await Promise.all([
    sql`SELECT id, nom, couverture, nb_pages, type FROM tome_catalog WHERE lower(nom) = lower(${nom}) LIMIT 1`,
    sql`SELECT nb_pages FROM tomes_perso WHERE user_id = ${uid} AND lower(nom) = lower(${nom})`,
    sql`SELECT updated_at FROM tome_covers WHERE user_id = ${uid} AND lower(tome_name) = lower(${nom})`,
    sql`SELECT id, title, page_no, image_type IS NOT NULL AS has_image, OCTET_LENGTH(image_b64) AS img_size, created_at
        FROM pages WHERE user_id = ${user.id} AND lower(tome) = lower(${nom}) ORDER BY created_at DESC`,
  ]);

  const titre = cat?.nom || nom;
  const couverture = couv
    ? `/api/tomes/cover?name=${encodeURIComponent(nom)}&format=img&v=${new Date(couv.updated_at).getTime()}`
    : cat?.couverture || null;

  // Fiche la plus récente pour chaque numéro de page
  const parPage = new Map();
  for (const p of pages) {
    const n = parseInt(p.page_no, 10);
    if (n > 0 && !parPage.has(n)) parPage.set(n, p);
  }
  const faites = pagesFaites(pages).size;
  const total = cat ? cat.nb_pages : perso?.nb_pages ?? null;
  // Sans total connu : on affiche jusqu'à la plus grande page faite, arrondi à une rangée complète
  const maxFaite = Math.max(0, ...parPage.keys());
  const nbCases = total || Math.max(20, Math.ceil((maxFaite + 4) / 4) * 4);
  const pct = total ? Math.min(100, Math.round((faites / total) * 100)) : 0;
  const sansNumero = pages.filter((p) => !(parseInt(p.page_no, 10) > 0));

  return (
    <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div className="barre" style={{ marginBottom: 'var(--espace-3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{titre}</h2>
      </div>

      {/* En-tête : couverture et progression */}
      <div className="carte" style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: 'var(--espace-3)' }}>
        <div style={{ width: '84px', flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {couverture ? <img src={couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={28} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: '1.4rem' }}>{faites}{total ? ` / ${total}` : ''}</b>
          <span style={{ color: 'var(--texte-secondaire)' }}> pages coloriées</span>
          {total ? (
            <div style={{ height: '10px', borderRadius: '999px', background: 'var(--carte)', overflow: 'hidden', marginTop: '8px' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? 'var(--btn-save)' : 'var(--btn)' }} />
            </div>
          ) : (
            <small style={{ display: 'block', color: 'var(--texte-secondaire)', marginTop: '6px' }}>
              Nombre de coloriages du livre inconnu.
            </small>
          )}
          {cat && cat.type === 'cozy' && !cat.nb_pages && <NbPagesCozy tomeId={cat.id} />}
        </div>
      </div>

      {/* Grille des pages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
        {Array.from({ length: nbCases }, (_, i) => i + 1).map((n) => {
          const p = parPage.get(n);
          const fond = p?.has_image ? `url(/api/pages/${p.id}/image?s=${p.img_size || 0})` : null;
          return (
            <Link
              key={n}
              href={p ? `/pages/${p.id}` : `/pages/new?tome=${encodeURIComponent(titre)}&page=${n}`}
              aria-label={p ? `Page ${n} : ${p.title || 'coloriée'}` : `Page ${n} : ajouter un coloriage`}
              style={{
                aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', fontWeight: 800, fontSize: '1.15rem', position: 'relative', overflow: 'hidden',
                border: '2px solid var(--couleur-secondaire)',
                background: fond
                  ? `${fond} center / cover no-repeat`
                  : 'var(--couleur-secondaire)',
                color: fond ? 'var(--blanc)' : 'var(--noir)',
                textShadow: fond ? '0 1px 3px rgba(0,0,0,0.85)' : 'none',
              }}
            >
              {n}
            </Link>
          );
        })}
      </div>

      {sansNumero.length > 0 && (
        <div className="carte" style={{ marginTop: 'var(--espace-3)' }}>
          <b>Coloriages sans numéro de page</b>
          <small style={{ display: 'block', color: 'var(--texte-secondaire)', margin: '4px 0 8px' }}>
            Ajoute-leur un numéro de page pour qu'ils comptent dans ta progression.
          </small>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sansNumero.map((p) => <Link key={p.id} href={`/pages/${p.id}`}>{p.title || 'Sans titre'}</Link>)}
          </div>
        </div>
      )}
    </div>
  );
}

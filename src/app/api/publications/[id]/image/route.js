import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { enTetesImage } from '@/lib/images';

export const dynamic = 'force-dynamic';

// Image d'une publication de la communauté (?no=0 à 3), pour les membres connectés seulement
export async function GET(req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return new Response(null, { status: 404 });
  const no = Number(new URL(req.url).searchParams.get('no')) || 0;
  const [r] = await sql`SELECT image_b64 FROM publication_images WHERE publication_id = ${Number(id) || 0} AND no = ${no}`;
  if (!r) return new Response(null, { status: 404 });
  const contenu = Buffer.from(r.image_b64, 'base64');
  // Copie gardée 1 jour au plus sur l'appareil (une publication ne change pas d'image, mais peut être retirée)
  const entetes = enTetesImage(contenu, 'private, max-age=86400');
  if (!entetes) return new Response(null, { status: 404 });
  return new Response(contenu, { headers: entetes });
}

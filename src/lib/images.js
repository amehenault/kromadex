import sharp from 'sharp';

// Images envoyées par les membres (coloriages, couvertures de tomes, photos de profil).
// Le contenu réel est vérifié (premiers octets, puis décodage complet), jamais l'extension ni le type annoncé.
// Toute image acceptée est décodée puis réencodée en WebP : un fichier piégé (HTML, SVG, script caché)
// ne survit pas au réencodage, et les métadonnées (position GPS des photos) sont retirées.

export const POIDS_MAX = 4 * 1024 * 1024;   // 4 Mo reçus au maximum (l'interface compresse avant l'envoi)
export const COTE_MAX_ENTREE = 10000;        // largeur ou hauteur maximale de l'image reçue
export const PIXELS_MAX = 40_000_000;        // 40 mégapixels : au-delà, le décodage coûte trop cher (bombe de décompression)

export const COTE = { coloriage: 2400, couverture: 1200, avatar: 512 };

export class ErreurImage extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// Format réel d'après les premiers octets : jpeg, png, webp, sinon null
export function formatReel(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

// Vérifie, décode et réencode une image ; renvoie { buffer, b64, type }.
// Lance une ErreurImage (avec son code HTTP) si l'image est refusée.
export async function traiterImage(buf, { coteMax = COTE.coloriage, qualite = 82 } = {}) {
  if (!buf?.length) throw new ErreurImage('Image vide.');
  if (buf.length > POIDS_MAX) throw new ErreurImage('Image trop lourde : 4 Mo maximum.', 413);
  const format = formatReel(buf);
  if (!format) throw new ErreurImage('Format non accepté : JPG, PNG ou WebP seulement.', 415);

  const options = { limitInputPixels: PIXELS_MAX, failOn: 'error', animated: false };
  let meta;
  try { meta = await sharp(buf, options).metadata(); }
  catch { throw new ErreurImage('Image illisible ou trop grande.'); }
  if (meta.format !== format) throw new ErreurImage('Le contenu ne correspond pas à une image JPG, PNG ou WebP.', 415);
  if (!meta.width || !meta.height || meta.width > COTE_MAX_ENTREE || meta.height > COTE_MAX_ENTREE
      || meta.width * meta.height > PIXELS_MAX) {
    throw new ErreurImage('Image trop grande : 10 000 pixels de côté et 40 mégapixels au maximum.', 413);
  }

  let sortie;
  try {
    sortie = await sharp(buf, options)
      .rotate() // applique l'orientation de l'appareil photo avant de retirer les métadonnées
      .resize({ width: coteMax, height: coteMax, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: qualite })
      .toBuffer();
  } catch {
    throw new ErreurImage('Image illisible.');
  }
  return { buffer: sortie, b64: sortie.toString('base64'), type: 'image/webp' };
}

// Lit le fichier d'un formulaire et le traite ; null si aucun fichier n'est envoyé
export async function imageDuFormulaire(fichier, options) {
  if (!fichier || typeof fichier !== 'object' || !fichier.size) return null;
  if (fichier.size > POIDS_MAX) throw new ErreurImage('Image trop lourde : 4 Mo maximum.', 413);
  return traiterImage(Buffer.from(await fichier.arrayBuffer()), options);
}

// En-têtes pour servir une image enregistrée. Le type vient du contenu réel, jamais de la base :
// un fichier ancien qui n'est pas une vraie image n'est pas servi (null).
// Le CSP « sandbox » empêche tout script même si le fichier était ouvert directement.
export function enTetesImage(buf, cache) {
  const format = formatReel(buf);
  if (!format) return null;
  return {
    'Content-Type': `image/${format}`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cache-Control': cache,
  };
}

// Réponse d'erreur pour une image refusée
export const reponseErreurImage = (e) => Response.json({ error: e.message }, { status: e.status || 400 });

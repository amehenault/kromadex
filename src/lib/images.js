import sharp from 'sharp';


export const POIDS_MAX = 4 * 1024 * 1024;
export const COTE_MAX_ENTREE = 10000;
export const PIXELS_MAX = 40_000_000;

export const COTE = { coloriage: 2400, couverture: 1200, avatar: 512 };

export class ErreurImage extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function formatReel(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

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
      .rotate()
      .resize({ width: coteMax, height: coteMax, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: qualite })
      .toBuffer();
  } catch {
    throw new ErreurImage('Image illisible.');
  }
  return { buffer: sortie, b64: sortie.toString('base64'), type: 'image/webp' };
}

export async function imageDuFormulaire(fichier, options) {
  if (!fichier || typeof fichier !== 'object' || !fichier.size) return null;
  if (fichier.size > POIDS_MAX) throw new ErreurImage('Image trop lourde : 4 Mo maximum.', 413);
  return traiterImage(Buffer.from(await fichier.arrayBuffer()), options);
}

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

export const reponseErreurImage = (e) => Response.json({ error: e.message }, { status: e.status || 400 });

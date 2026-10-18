// Tests des images envoyées : node --test tests/unitaires/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import { traiterImage, formatReel, enTetesImage, ErreurImage, POIDS_MAX } from '../../src/lib/images.js';

const png = (w = 64, h = 48) => sharp({ create: { width: w, height: h, channels: 3, background: '#4bbca1' } }).png().toBuffer();

// En-tête PNG qui annonce des dimensions énormes (sans les pixels) : sert à tester le refus avant décodage
function pngAnnonce(largeur, hauteur) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0); ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8 bits, RVB
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', Buffer.alloc(0)), chunk('IEND', Buffer.alloc(0))]);
}

const refus = async (buf, status) => {
  await assert.rejects(traiterImage(buf), (e) => e instanceof ErreurImage && e.status === status);
};

test('une vraie image PNG est acceptée et réencodée en WebP', async () => {
  const r = await traiterImage(await png());
  assert.equal(r.type, 'image/webp');
  assert.equal(formatReel(r.buffer), 'webp');
  const meta = await sharp(r.buffer).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 64);
});

test('une grande image est réduite au côté maximum', async () => {
  const r = await traiterImage(await png(3000, 1000), { coteMax: 1200 });
  const meta = await sharp(r.buffer).metadata();
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 400);
});

test('les métadonnées (EXIF, position GPS) sont retirées', async () => {
  const avecExif = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#fff' } })
    .jpeg().withExif({ IFD0: { Artist: 'test', ImageDescription: 'secret' } }).toBuffer();
  assert.ok((await sharp(avecExif).metadata()).exif, 'le fichier de départ a bien des EXIF');
  const r = await traiterImage(avecExif);
  assert.equal((await sharp(r.buffer).metadata()).exif, undefined);
});

test('une page HTML déguisée en image est refusée (415)', async () => {
  await refus(Buffer.from('<html><script>alert(document.cookie)</script></html>'), 415);
});

test('un SVG avec script est refusé (415)', async () => {
  await refus(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 415);
});

test('un GIF est refusé (415)', async () => {
  const gif = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#000' } }).gif().toBuffer();
  await refus(gif, 415);
});

test('un fichier qui commence comme un JPEG mais contient du HTML est refusé', async () => {
  const faux = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('<html><script>alert(1)</script></html>'.repeat(5))]);
  await assert.rejects(traiterImage(faux), ErreurImage);
});

test('un fichier trop lourd est refusé (413) sans être décodé', async () => {
  const lourd = Buffer.concat([await png(), Buffer.alloc(POIDS_MAX)]);
  await refus(lourd, 413);
});

test('une image trop large est refusée (413)', async () => {
  await refus(pngAnnonce(12000, 10), 413);
});

test('une « bombe » de pixels (9000 x 9000) est refusée avant décodage', async () => {
  await assert.rejects(traiterImage(pngAnnonce(9000, 9000)), (e) => e instanceof ErreurImage && [400, 413].includes(e.status));
});

test('un fichier vide est refusé', async () => {
  await refus(Buffer.alloc(0), 400);
});

test('les en-têtes de service viennent du contenu réel, avec nosniff et sandbox', async () => {
  const r = await traiterImage(await png());
  const h = enTetesImage(r.buffer, 'private, no-cache');
  assert.equal(h['Content-Type'], 'image/webp');
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
  assert.match(h['Content-Security-Policy'], /sandbox/);
  assert.equal(enTetesImage(Buffer.from('<html><script>x</script></html>'), 'no-cache'), null);
});

export async function compresserImage(fichier, coteMax = 1600, qualite = 0.82) {
  if (!fichier) return fichier;
  try {
    const bitmap = await createImageBitmap(fichier);
    const k = Math.min(1, coteMax / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * k);
    canvas.height = Math.round(bitmap.height * k);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', qualite));
    return blob || fichier;
  } catch {
    return fichier;
  }
}

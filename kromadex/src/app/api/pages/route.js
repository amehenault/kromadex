export async function readForm(req) {
  const formData = await req.formData();
  
  const title = String(formData.get('title') || '').trim();
  const tome = String(formData.get('tome') || '').trim();
  const page_no = String(formData.get('page_no') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const difficulty = String(formData.get('difficulty') || '').trim();
  const rating = formData.get('rating') ? Number(formData.get('rating')) : null;

  // Récupération des codes sans AUCUN découpage de texte (.slice)
  let codes = [];
  try {
    const rawCodes = formData.get('codes');
    if (rawCodes) {
      codes = JSON.parse(rawCodes);
    }
  } catch (e) {
    codes = [];
  }

  // Traitement de l'image
  let image = null;
  const file = formData.get('image');
  if (file && typeof file === 'object' && file.arrayBuffer) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    image = {
      b64: buffer.toString('base64'),
      type: file.type || 'image/jpeg',
    };
  }

  return {
    data: {
      title,
      tome,
      page_no,
      category,
      difficulty,
      rating,
      codes,
    },
    image,
  };
}

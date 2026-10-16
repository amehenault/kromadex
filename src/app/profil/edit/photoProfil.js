'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash2, User } from 'lucide-react';

// Recadre l'image au centre en carré et la réduit à 256 px avant l'envoi
async function preparer(fichier) {
  const bitmap = await createImageBitmap(fichier);
  const cote = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  canvas.getContext('2d').drawImage(bitmap, (bitmap.width - cote) / 2, (bitmap.height - cote) / 2, cote, cote, 0, 0, 256, 256);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { type: 'image/jpeg', b64: dataUrl.split(',')[1], apercu: dataUrl };
}

export default function PhotoProfil() {
  const router = useRouter();
  const entree = useRef(null);
  const [apercu, setApercu] = useState(null);
  const [aUnePhoto, setAUnePhoto] = useState(false);
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    const src = `/api/user/avatar?v=${Date.now()}`;
    fetch(src).then((r) => { if (r.ok) { setApercu(src); setAUnePhoto(true); } });
  }, []);

  async function choisir(e) {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    setOccupe(true); setMessage('');
    try {
      const { type, b64, apercu: a } = await preparer(fichier);
      const res = await fetch('/api/user/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, b64 }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setApercu(a); setAUnePhoto(true); setMessage('Photo enregistrée ✓'); router.refresh(); }
      else setMessage(d.error || 'Erreur, réessaie.');
    } catch {
      setMessage("Cette image n'a pas pu être lue.");
    } finally {
      setOccupe(false);
    }
  }

  async function retirer() {
    if (!confirm('Retirer ta photo de profil ?')) return;
    const res = await fetch('/api/user/avatar', { method: 'DELETE' });
    if (res.ok) { setApercu(null); setAUnePhoto(false); setMessage('Photo retirée'); router.refresh(); }
  }

  return (
    <div className="carte" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--espace-3)' }}>
      <button type="button" onClick={() => entree.current?.click()} aria-label="Changer la photo de profil"
        style={{
          width: '84px', height: '84px', flex: '0 0 auto', borderRadius: '50%', overflow: 'hidden', padding: 0, cursor: 'pointer',
          border: '2px solid var(--btn)', background: 'var(--carte)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--texte-secondaire)', position: 'relative',
        }}>
        {apercu ? <img src={apercu} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} />}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: 1 }}>
        <b>Photo de profil</b>
        <button type="button" className="btn" disabled={occupe} onClick={() => entree.current?.click()}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '42px' }}>
          <Camera size={16} /> {occupe ? 'Envoi…' : aUnePhoto ? 'Changer la photo' : 'Choisir une photo'}
        </button>
        {aUnePhoto && (
          <button type="button" className="btn alt danger" onClick={retirer}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '36px', fontSize: '0.85rem' }}>
            <Trash2 size={14} /> Retirer
          </button>
        )}
        {message && <small style={{ color: 'var(--texte-secondaire)' }}>{message}</small>}
      </div>
      <input ref={entree} type="file" accept="image/*" hidden onChange={choisir} />
    </div>
  );
}

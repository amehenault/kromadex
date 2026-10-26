'use client';
import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Crosshair, Check } from 'lucide-react';
import Feuille from './Feuille';

const ZOOM_MAX = 4;

// Recadrer une photo dans un cadre 3:4 (celui de la fiche du coloriage) :
// glisser pour placer l'image, pincer à deux doigts (ou la molette) et le curseur pour zoomer, « Centrer » pour recentrer.
//  source : Blob ou adresse de l'image ; onValider(blob) reçoit l'image recadrée en JPEG
export default function Recadrage({ source, ratio = 3 / 4, coteMax = 1400, onValider, onFermer }) {
  const cadre = useRef(null);
  const [img, setImg] = useState(null);
  const [W, setW] = useState(0);
  // Zoom (1 = l'image remplit juste le cadre) et point de l'image (en pixels d'origine) placé au centre du cadre
  const [vue, setVue] = useState(null);
  const doigts = useRef(new Map());
  const geste = useRef(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const i = new Image();
    i.onload = () => { setImg(i); setVue({ z: 1, cx: i.naturalWidth / 2, cy: i.naturalHeight / 2 }); };
    i.onerror = () => setErreur("Cette image n'a pas pu être lue.");
    i.src = url;
    return () => { if (typeof source !== 'string') URL.revokeObjectURL(url); };
  }, [source]);

  // Largeur du cadre suivie à l'écran (rotation du téléphone, fenêtre redimensionnée)
  useEffect(() => {
    if (!cadre.current) return;
    const o = new ResizeObserver(([e]) => setW(e.contentRect.width));
    o.observe(cadre.current);
    return () => o.disconnect();
  }, [img]);

  const H = W / ratio;
  const echelleBase = img && W ? Math.max(W / img.naturalWidth, H / img.naturalHeight) : 1;

  // Garde l'image collée aux bords : jamais de vide dans le cadre
  function borner({ z, cx, cy }) {
    const zz = Math.min(ZOOM_MAX, Math.max(1, z));
    const s = echelleBase * zz;
    const demiL = W / (2 * s), demiH = H / (2 * s);
    return {
      z: zz,
      cx: Math.min(img.naturalWidth - demiL, Math.max(demiL, cx)),
      cy: Math.min(img.naturalHeight - demiH, Math.max(demiH, cy)),
    };
  }

  // Zoom autour d'un point du cadre (px depuis son coin haut gauche) : ce point reste sous le doigt
  function zoomer(v, z, px = W / 2, py = H / 2) {
    const s = echelleBase * v.z, s2 = echelleBase * Math.min(ZOOM_MAX, Math.max(1, z));
    const ix = v.cx + (px - W / 2) / s, iy = v.cy + (py - H / 2) / s;
    return borner({ z, cx: ix - (px - W / 2) / s2, cy: iy - (py - H / 2) / s2 });
  }

  const pointDuCadre = (e) => {
    const r = cadre.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function debut(e) {
    cadre.current.setPointerCapture(e.pointerId);
    doigts.current.set(e.pointerId, pointDuCadre(e));
    geste.current = null;
  }

  function bouger(e) {
    if (!doigts.current.has(e.pointerId) || !vue) return;
    const avant = [...doigts.current.values()];
    doigts.current.set(e.pointerId, pointDuCadre(e));
    const apres = [...doigts.current.values()];
    if (apres.length === 1) {
      setVue((v) => {
        const s = echelleBase * v.z;
        return borner({ ...v, cx: v.cx - (apres[0].x - avant[0].x) / s, cy: v.cy - (apres[0].y - avant[0].y) / s });
      });
    } else if (apres.length >= 2) {
      const [a, b] = apres;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const g = geste.current;
      geste.current = { d, m };
      if (!g) return;
      setVue((v) => {
        // Le milieu des deux doigts sert de point fixe pour le zoom, puis déplace l'image s'il bouge
        const z = zoomer(v, v.z * (d / g.d), m.x, m.y);
        const s = echelleBase * z.z;
        return borner({ ...z, cx: z.cx - (m.x - g.m.x) / s, cy: z.cy - (m.y - g.m.y) / s });
      });
    }
  }

  function fin(e) {
    doigts.current.delete(e.pointerId);
    geste.current = null;
  }

  // Molette (ordinateur) : zoom autour du pointeur
  useEffect(() => {
    const el = cadre.current;
    if (!el || !vue) return;
    const roue = (e) => {
      e.preventDefault();
      const p = pointDuCadre(e);
      setVue((v) => zoomer(v, v.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), p.x, p.y));
    };
    el.addEventListener('wheel', roue, { passive: false });
    return () => el.removeEventListener('wheel', roue);
  });

  const centrer = () => setVue((v) => borner({ ...v, cx: img.naturalWidth / 2, cy: img.naturalHeight / 2 }));

  async function valider() {
    const s = echelleBase * vue.z;
    const l = W / s, h = H / s;
    const sortieH = Math.round(Math.min(coteMax, h));
    const sortieL = Math.round(sortieH * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = sortieL;
    canvas.height = sortieH;
    canvas.getContext('2d').drawImage(img, vue.cx - l / 2, vue.cy - h / 2, l, h, 0, 0, sortieL, sortieH);
    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
    if (blob) onValider(blob);
    else setErreur("L'image n'a pas pu être recadrée.");
  }

  const s = echelleBase * (vue?.z || 1);
  return (
    <Feuille titre="Recadrer la photo" onFermer={onFermer}>
      {erreur && <p className="erreur" style={{ margin: 0 }}>{erreur}</p>}
      {img && (
        <>
          <small style={{ color: 'var(--texte-secondaire)' }}>Glisse la photo pour la placer. Pince à deux doigts ou utilise le curseur pour zoomer.</small>
          <div ref={cadre} onPointerDown={debut} onPointerMove={bouger} onPointerUp={fin} onPointerCancel={fin}
            style={{ position: 'relative', width: '100%', maxWidth: '340px', margin: '0 auto', aspectRatio: `${ratio}`, overflow: 'hidden',
              borderRadius: 'var(--rayon-m)', border: '2px solid var(--couleur-secondaire)', background: 'var(--blanc)', touchAction: 'none', cursor: 'grab', userSelect: 'none' }}>
            {vue && W > 0 && (
              <img src={img.src} alt="" draggable={false}
                style={{ position: 'absolute', left: 0, top: 0, width: img.naturalWidth, height: img.naturalHeight, maxWidth: 'none', transformOrigin: '0 0',
                  transform: `translate(${W / 2 - vue.cx * s}px, ${H / 2 - vue.cy * s}px) scale(${s})`, pointerEvents: 'none' }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '340px', margin: '0 auto' }}>
            <ZoomOut size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />
            <input type="range" min={1} max={ZOOM_MAX} step={0.01} value={vue?.z || 1} aria-label="Zoom"
              onChange={(e) => setVue((v) => zoomer(v, Number(e.target.value)))} style={{ flex: 1, minWidth: 0 }} />
            <ZoomIn size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn alt" onClick={centrer} style={{ flex: '1 1 120px', minHeight: '44px' }}>
              <Crosshair size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '6px' }} />Centrer
            </button>
            <button type="button" className="btn" onClick={valider} style={{ flex: '1 1 120px', minHeight: '44px' }}>
              <Check size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '6px' }} />Valider
            </button>
          </div>
        </>
      )}
    </Feuille>
  );
}

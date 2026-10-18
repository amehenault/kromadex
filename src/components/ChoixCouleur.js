'use client';
import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import Feuille from './Feuille';
import { estHex } from '@/lib/palettes';

// Conversions HSV (teinte 0-360, saturation et valeur 0-1) et hex
function hsvVersHex(h, s, v) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function hexVersHsv(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: ((h * 60) + 360) % 360, s: max ? d / max : 0, v: max };
}

// Changer une couleur de palette.
//  crayons : avec des coffrets choisis, on choisit parmi leurs crayons (comme dans Collection de crayons) ;
//  sans coffret : palette libre, on choisit sa nuance au doigt ou on écrit un code hex.
export default function ChoixCouleur({ valeur, crayons = [], packs = [], onChoisir, onFermer }) {
  const depart = estHex(valeur) ? valeur.toUpperCase() : '#CCCCCC';
  const [hsv, setHsv] = useState(() => hexVersHsv(depart));
  const [texte, setTexte] = useState(depart);
  const zone = useRef(null);
  const hex = hsvVersHex(hsv.h, hsv.s, hsv.v);

  function changerHsv(n) { setHsv(n); setTexte(hsvVersHex(n.h, n.s, n.v)); }
  function toucher(e) {
    const r = zone.current.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    changerHsv({ ...hsv, s, v });
  }
  function ecrire(t) {
    let x = t.trim().toUpperCase();
    if (x && !x.startsWith('#')) x = `#${x}`;
    setTexte(x);
    if (estHex(x)) setHsv(hexVersHsv(x));
  }

  if (crayons.length) {
    return (
      <Feuille titre="Choisir un crayon" onFermer={onFermer}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '65dvh', overflowY: 'auto' }}>
          {packs.map((p) => {
            const liste = crayons.filter((c) => c.pack === p.id);
            if (!liste.length) return null;
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {packs.length > 1 && <b style={{ fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{p.nom}</b>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px' }}>
                  {liste.map((c, i) => {
                    const actif = c.hex?.toUpperCase() === depart;
                    return (
                      <button key={`${c.code}-${i}`} type="button" onClick={() => onChoisir(c.hex.toUpperCase())} aria-pressed={actif}
                        aria-label={[c.code, c.nom].filter(Boolean).join(' ') || c.hex}
                        style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0, minHeight: '64px', textAlign: 'center' }}>
                        <span aria-hidden="true" style={{
                          width: 36, height: 36, borderRadius: '50%', background: c.hex, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          border: actif ? '3px solid var(--noir)' : '1px solid var(--bordure-carte)', color: 'var(--blanc)',
                        }}>
                          {actif && <Check size={16} />}
                        </span>
                        <small style={{ fontWeight: 700, overflowWrap: 'anywhere', lineHeight: 1.2, fontSize: '0.72rem' }}>{c.code || c.nom || c.hex}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Feuille>
    );
  }

  return (
    <Feuille titre="Choisir une couleur" onFermer={onFermer}>
      {/* Nuance : saturation à l'horizontale, clarté à la verticale */}
      <div ref={zone} role="slider" tabIndex={0} aria-label="Nuance" aria-valuetext={hex}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); toucher(e); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') toucher(e); }}
        onKeyDown={(e) => {
          const pas = 0.02;
          const d = { ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, pas], ArrowDown: [0, -pas] }[e.key];
          if (!d) return;
          e.preventDefault();
          changerHsv({ ...hsv, s: Math.max(0, Math.min(1, hsv.s + d[0])), v: Math.max(0, Math.min(1, hsv.v + d[1])) });
        }}
        style={{
          position: 'relative', width: '100%', aspectRatio: '3 / 2', borderRadius: 'var(--rayon-m)', touchAction: 'none', cursor: 'crosshair',
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv.h} 100% 50%)`,
        }}>
        <span aria-hidden="true" style={{
          position: 'absolute', left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, width: 22, height: 22, transform: 'translate(-50%, -50%)',
          borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 0 0 1px rgb(0 0 0 / 0.5)', background: hex, pointerEvents: 'none',
        }} />
      </div>

      {/* Teinte */}
      <input type="range" min={0} max={360} value={Math.round(hsv.h)} aria-label="Teinte"
        onChange={(e) => changerHsv({ ...hsv, h: Number(e.target.value) })}
        style={{ width: '100%', minHeight: '44px', accentColor: hex,
          background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)', borderRadius: '999px', height: '16px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span aria-hidden="true" style={{ width: 48, height: 48, flex: '0 0 auto', borderRadius: 'var(--rayon-s)', background: hex, border: '1px solid var(--bordure-carte)' }} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, flex: 1, minWidth: 0 }}>Code hex
          <input value={texte} onChange={(e) => ecrire(e.target.value)} maxLength={7} spellCheck={false} autoCapitalize="characters"
            placeholder="#F4C7C3" aria-invalid={!estHex(texte)} />
        </label>
      </div>
      {!estHex(texte) && <small style={{ color: 'var(--danger)', fontWeight: 600 }}>Écris un code de 6 caractères, par exemple #F4C7C3.</small>}

      <button type="button" className="btn" disabled={!estHex(texte)} onClick={() => onChoisir(texte)}
        style={{ minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <Check size={18} aria-hidden="true" /> Choisir cette couleur
      </button>
    </Feuille>
  );
}

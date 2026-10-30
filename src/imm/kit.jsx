import React from 'react';
/* eslint-disable react-refresh/only-export-components */
// Kit dell'interfaccia immersiva: icone, freccia "Scorri", mondo di sfondo, scorrimento lento, comparse.
import { useEffect, useRef } from 'react';

const P = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  home: '<path d="M3.5 11L12 4l8.5 7v8.5a1 1 0 01-1 1H15v-6H9v6H4.5a1 1 0 01-1-1z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 5.5v15"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.8.5-1.5 1-1.5 2M12 17h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  site: '<path d="M7 17L17 7M9 7h8v8"/>',
  tablet: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M11 18h2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};

export function Ico({ n, className = 'i' }) {
  if (n === 'play') return <svg viewBox="0 0 24 24" className="i-play" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>;
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] || '' }} />;
}

// scorrimento lento (si interrompe se l'utente usa rotellina o dito)
let glideRaf = 0;
export function glideTo(y) {
  cancelAnimationFrame(glideRaf);
  const from = window.scrollY, dist = y - from;
  const dur = Math.min(4200, Math.max(1400, Math.abs(dist) * 1.1)), t0 = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const stop = () => { cancelAnimationFrame(glideRaf); removeEventListener('wheel', stop); removeEventListener('touchstart', stop); };
  addEventListener('wheel', stop, { passive: true }); addEventListener('touchstart', stop, { passive: true });
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    window.scrollTo({ top: from + dist * ease(p), behavior: 'instant' });
    if (p < 1) glideRaf = requestAnimationFrame(step); else stop();
  };
  glideRaf = requestAnimationFrame(step);
}
export function glideToStop(k) {
  const el = document.querySelector(`[data-stop="${k}"] .node`);
  if (!el) return;
  const r = el.getBoundingClientRect();
  glideTo(window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.5);
}
export function glideToNextSection(fromEl) {
  const sec = fromEl?.closest('section');
  const next = sec?.nextElementSibling;
  if (!next) return;
  // scene con contenuto fisso (barra della Home): si arriva esattamente all'inizio, così tutto il blocco è nello schermo
  const offset = next.querySelector('.pin') ? 0 : 70;
  glideTo(window.scrollY + next.getBoundingClientRect().top - offset);
}

export function Cue({ label, onClick }) {
  return (
    <a className="cue" href="#" aria-label={label}
      onClick={(e) => { e.preventDefault(); if (onClick) onClick(e); else glideToNextSection(e.currentTarget); }}>
      <span className="cue-l">{label}</span>
      <span className="cue-o"><i className="halo" /><i className="halo h2" /><b><Ico n="down" /><Ico n="down" /></b></span>
    </a>
  );
}

// Titolo con parole che salgono una dopo l'altra
export const Split = ({ words, as: Tag = 'h1', className = '' }) => (
  <Tag className={`split ${className}`}>{words.filter(Boolean).map((w, k) => <React.Fragment key={k}>{k > 0 && ' '}<span>{w}</span></React.Fragment>)}</Tag>
);

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const topOf = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + window.scrollY : 0; };

// Mondo fisso dietro la pagina. scenes: [{ src | video | strip:[...] | palette, at: selettore|0, offset: frazione di schermo, dim }]
// Ogni scena è piena quando lo scorrimento arriva a top(at) + offset * altezza schermo.
export function World({ scenes, deps = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current; if (!root) return undefined;
    let ys = [], raf = 0;
    let split = 0; // striscia con video: scorrimento al quale lo spazio ha lasciato posto al cielo
    const measure = () => {
      ys = scenes.map((s) => (s.at ? topOf(s.at) : 0) + (s.offset || 0) * window.innerHeight);
      const sv = scenes.find((s) => s.stripVideo && s.stripVideo.until);
      split = sv ? Math.max(1, topOf(sv.stripVideo.until) + (sv.stripVideo.untilOffset || 0) * window.innerHeight) : 0;
    };
    const paint = () => {
      raf = 0;
      const y = window.scrollY, vh = window.innerHeight;
      const layers = root.querySelectorAll('.layer');
      let dim = scenes[0]?.dim ?? 0.3;
      for (let k = 1; k < scenes.length; k++) {
        const t = smooth((y - ys[k - 1]) / Math.max(1, ys[k] - ys[k - 1]));
        if (layers[k]) layers[k].style.opacity = t.toFixed(3);
        if (t > 0) dim = scenes[k - 1].dim + (scenes[k].dim - scenes[k - 1].dim) * t;
      }
      const d = root.querySelector('.dim'); if (d) d.style.opacity = dim.toFixed(3);
      const strip = root.querySelector('.strip');
      if (strip) {
        const max = Math.max(1, document.documentElement.scrollHeight - vh);
        const travel = strip.offsetHeight - vh;
        const vid = strip.querySelector('.strip-vid');
        let off;
        if (vid && split) {
          // due tempi: prima si scende dallo spazio fino al cielo, poi dal cielo al prato
          const sky = vid.nextElementSibling; // cielo quasi pieno a ~60% schermo dal suo bordo alto (sfumatura)
          const V = Math.min(travel, sky ? sky.offsetTop + vh * 0.6 : vid.offsetHeight);
          off = y <= split ? Math.pow(Math.min(1, y / split), 1.6) * V : V + smooth(Math.min(1, (y - split) / Math.max(1, max - split))) * (travel - V);
        } else off = smooth(Math.min(1, y / max)) * travel;
        strip.style.transform = `translate3d(0,${Math.round(-off)}px,0)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const onResize = () => { measure(); onScroll(); };
    measure(); paint();
    const t1 = setTimeout(onResize, 400), t2 = setTimeout(onResize, 1500); // dopo font e immagini
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    return () => { clearTimeout(t1); clearTimeout(t2); cancelAnimationFrame(raf); removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return (
    <div className="world" aria-hidden="true" ref={ref}>
      <div className="layers">
        {scenes.map((s, k) => s.video
          ? <video key={k} className="layer" data-k={k} autoPlay muted loop={!s.once} playsInline preload="auto" poster={s.poster}
              src={s.videoM && window.matchMedia('(max-width: 760px)').matches ? s.videoM : s.video} />
          : s.strip
            ? (
              <div key={k} className={`layer strip ${s.stripVideo ? 'has-vid' : ''}`} data-k={k}>
                {/* video in cima alla striscia (es. spazio in loop): scorrendo si "scende" verso le immagini sotto */}
                {s.stripVideo && <video className="strip-vid" autoPlay muted loop playsInline preload="auto" poster={s.stripVideo.poster}
                  src={s.stripVideo.srcM && window.matchMedia('(max-width: 760px)').matches ? s.stripVideo.srcM : s.stripVideo.src} />}
                {s.strip.map((src) => <div key={src} className="strip-img" style={{ backgroundImage: `url(${src})` }} />)}
              </div>
            )
            : s.palette
              ? <div key={k} className="layer palette" data-k={k}><i /><i /><i /></div>
              : <div key={k} className="layer" data-k={k} style={{ backgroundImage: `url(${s.src})` }} />)}
      </div>
      <div className="dim" />
    </div>
  );
}

// Comparse morbide degli elementi .rv quando entrano nello schermo
export function useReveal(deps = []) {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll('#view .rv:not(.in)').forEach((el, k) => { el.style.setProperty('--k', k % 6); io.observe(el); });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const IMG = {
  heroVideo: '/immersive/hero.mp4', heroPoster: '/immersive/hero-poster.jpg', heroBlur: '/immersive/hero-poster-blur.jpg',
  space: '/immersive/space-loop.mp4', spaceM: '/immersive/space-loop-m.mp4', spacePoster: '/immersive/space-loop-poster.jpg',
  meadow: '/immersive/bg-pc.jpg', meadowBlur: '/immersive/bg-pc-blur.jpg', sky: '/immersive/bg-clouds.jpg', skyBlur: '/immersive/bg-clouds-blur.jpg',
  logo: '/immersive/logo-white.png', lemon: '/immersive/lemon.png', mascot: '/immersive/mascot.webp',
};

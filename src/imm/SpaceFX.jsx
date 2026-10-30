import { useEffect, useRef } from 'react';

// Strato animato sopra il video dello spazio: stelle che vengono incontro (si vola in avanti),
// asteroidi che ruotano e attraversano la scena a profondità diverse, stelle cadenti frequenti,
// leggera parallasse col mouse. Si ferma quando non è visibile o la scheda è in background.
const rnd = (a, b) => a + Math.random() * (b - a);

function makeRock(size) {
  const c = document.createElement('canvas');
  const s = Math.ceil(size * 2.4); c.width = c.height = s;
  const g = c.getContext('2d');
  const n = 11 + Math.floor(Math.random() * 5), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = size * rnd(0.72, 1.05);
    pts.push([s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r * rnd(0.75, 0.95)]);
  }
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  // luce calda da destra (la spirale), ombra viola a sinistra
  const body = g.createRadialGradient(s * 0.62, s * 0.4, size * 0.1, s / 2, s / 2, size * 1.1);
  body.addColorStop(0, '#9c8577'); body.addColorStop(0.45, '#5b4a52'); body.addColorStop(1, '#1d1530');
  g.fillStyle = body; g.fill();
  g.save(); g.clip();
  for (let k = 0; k < 5; k++) { // crateri
    const x = s / 2 + rnd(-0.5, 0.5) * size, y = s / 2 + rnd(-0.5, 0.5) * size, r = rnd(0.08, 0.2) * size;
    const cg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    cg.addColorStop(0, 'rgba(20,12,30,.55)'); cg.addColorStop(1, 'rgba(20,12,30,0)');
    g.fillStyle = cg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  const rim = g.createLinearGradient(s, 0, s * 0.4, 0);
  rim.addColorStop(0, 'rgba(255,170,90,.55)'); rim.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = rim; g.fillRect(0, 0, s, s);
  g.restore();
  return c;
}

export default function SpaceFX() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0, last = performance.now(), visible = true, mx = 0, my = 0, pmx = 0, pmy = 0;
    const small = window.matchMedia('(max-width: 760px)').matches;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // stelle: x,y in coordinate relative al centro di fuga, z profondità (1 lontano -> 0 vicino)
    const STARS = small ? 140 : 260;
    const newStar = (far) => ({ x: rnd(-1, 1), y: rnd(-1, 1), z: far ? 1 : rnd(0.05, 1), t: rnd(0, 6.28), hue: Math.random() < 0.25 ? 'rgba(200,180,255,' : Math.random() < 0.2 ? 'rgba(255,210,170,' : 'rgba(255,255,255,' });
    const stars = Array.from({ length: STARS }, () => newStar(false));

    // asteroidi
    const ROCKS = small ? 5 : 8;
    const newRock = (init) => {
      const depth = rnd(0.25, 1); // 1 = vicino
      const size = (small ? 26 : 40) * depth * rnd(0.6, 1.4);
      const fromLeft = Math.random() < 0.6;
      return {
        img: makeRock(size), size, depth,
        x: init ? rnd(0, W) : fromLeft ? -size * 2 : W + size * 2,
        y: rnd(H * 0.08, H * 0.8),
        vx: (fromLeft ? 1 : -1) * rnd(14, 34) * depth, vy: rnd(-8, 8) * depth,
        a: rnd(0, 6.28), va: rnd(-0.5, 0.5),
      };
    };
    let rocks = Array.from({ length: ROCKS }, () => newRock(true));

    // stelle cadenti
    let meteors = [], nextMeteor = 0.6;
    const newMeteor = () => {
      const ang = rnd(0.35, 0.75) * (Math.random() < 0.7 ? 1 : -1) + (Math.random() < 0.7 ? 0 : Math.PI);
      return { x: rnd(W * 0.05, W * 0.95), y: rnd(-H * 0.05, H * 0.45), vx: Math.cos(ang) * rnd(700, 1200), vy: Math.abs(Math.sin(ang)) * rnd(300, 600), life: 0, max: rnd(0.6, 1.1), len: rnd(90, 220) };
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible || document.hidden) return;
      const r = cv.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // fuori schermo: niente lavoro
      pmx += (mx - pmx) * 0.05; pmy += (my - pmy) * 0.05;
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.62 - pmx * 20, cy = H * 0.42 - pmy * 14, span = Math.max(W, H) * 0.75;

      // stelle che vengono incontro
      for (const s of stars) {
        s.z -= dt * 0.045; s.t += dt * 3;
        if (s.z <= 0.03) Object.assign(s, newStar(true));
        const k = 1 / s.z, px = cx + s.x * span * k * 0.18, py = cy + s.y * span * k * 0.18;
        if (px < -20 || px > W + 20 || py < -20 || py > H + 20) { Object.assign(s, newStar(true)); continue; }
        const near = 1 - s.z, rad = 0.35 + near * near * 2.1;
        const tw = 0.55 + 0.45 * Math.sin(s.t);
        ctx.fillStyle = `${s.hue}${(0.25 + near * 0.75) * tw})`;
        ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.283); ctx.fill();
        if (near > 0.75) { // scia corta sulle stelle vicine: sensazione di velocità
          const bx = cx + s.x * span * (1 / (s.z + 0.04)) * 0.18, by = cy + s.y * span * (1 / (s.z + 0.04)) * 0.18;
          ctx.strokeStyle = `${s.hue}${0.35 * tw})`; ctx.lineWidth = rad; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
        }
      }

      // asteroidi (i lontani prima)
      rocks.sort((a, b) => a.depth - b.depth);
      rocks = rocks.map((o) => {
        o.x += o.vx * dt; o.y += o.vy * dt; o.a += o.va * dt;
        if (o.x < -o.size * 3 || o.x > W + o.size * 3 || o.y < -o.size * 3 || o.y > H + o.size * 3) return newRock(false);
        const ox = o.x - pmx * 30 * o.depth, oy = o.y - pmy * 20 * o.depth;
        ctx.save(); ctx.globalAlpha = 0.55 + o.depth * 0.45; ctx.translate(ox, oy); ctx.rotate(o.a);
        ctx.drawImage(o.img, -o.img.width / 2, -o.img.height / 2); ctx.restore();
        return o;
      });

      // stelle cadenti
      nextMeteor -= dt;
      if (nextMeteor <= 0) { meteors.push(newMeteor()); nextMeteor = rnd(0.5, 1.8); }
      meteors = meteors.filter((m) => {
        m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt;
        const p = m.life / m.max; if (p >= 1) return false;
        const a = Math.sin(p * Math.PI), sp = Math.hypot(m.vx, m.vy);
        const tx = m.x - (m.vx / sp) * m.len, ty = m.y - (m.vy / sp) * m.len;
        const gr = ctx.createLinearGradient(m.x, m.y, tx, ty);
        gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.3, `rgba(200,180,255,${a * 0.5})`); gr.addColorStop(1, 'rgba(200,180,255,0)');
        ctx.strokeStyle = gr; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(m.x, m.y, 1.8, 0, 6.283); ctx.fill();
        return true;
      });
    };
    raf = requestAnimationFrame(frame);

    const onMove = (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); });
    io.observe(cv);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="space-fx" aria-hidden="true" />;
}

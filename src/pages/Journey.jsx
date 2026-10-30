import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { fmt } from '../i18n/ui';
import { Cue, Ico, IMG, Split, World, glideToStop } from '../imm/kit';
import CertificateDownload from '../CertificateDownload';

const certUser = (p) => ({ name: p?.name, lastName: p?.last_name, hospital: p?.hospital, department: p?.department });

export default function Journey() {
  const { u } = useLang();
  const J = u.journey;
  const acc = useAccount();
  const { lessons, total, doneCount, allDone, passed, currentStop, usesTablet, finalQuestions } = acc;
  const [params, setParams] = useSearchParams();
  const jRef = useRef(null);
  const [back, setBack] = useState(null); // { dir, text }
  const backKey = useRef('null');

  // arrivo con "riprendi" o "traguardo": discesa lenta fino alla tappa
  useEffect(() => {
    const vai = params.get('vai');
    if (!vai) return undefined;
    // "tappa": di ritorno da una lezione si arriva subito sulla tappa successiva, senza discesa
    if (vai === 'tappa') {
      const jump = () => { const el = document.querySelector(`[data-stop="${currentStop}"] .node`); if (el) { const r = el.getBoundingClientRect(); window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - innerHeight * 0.5, behavior: 'instant' }); } };
      jump(); const t1 = setTimeout(jump, 120); const t2 = setTimeout(jump, 600);
      setParams({}, { replace: true });
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    const tm = setTimeout(() => { glideToStop(vai === 'traguardo' ? total + 1 : currentStop); setParams({}, { replace: true }); }, 700);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sentiero, linea arancione fino alla tappa in corso, comparse, pulsante "torna alla tappa"
  useEffect(() => {
    const j = jRef.current; if (!j) return undefined;
    let raf = 0;
    // Geometria (posizione delle tappe, forma del sentiero, tabella lunghezza→altezza della linea)
    // calcolata una volta e di nuovo solo se cambia l'impaginazione; durante lo scorrimento solo conti semplici.
    let geo = null;
    const measure = () => {
      const nodes = [...j.querySelectorAll('.node')];
      if (!nodes.length) return;
      const jr = j.getBoundingClientRect();
      const ys = nodes.map((n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2 - jr.top; });
      const first = ys[0], span = Math.max(1, ys[ys.length - 1] - first);
      const svg = j.querySelector('.j-path'); svg.style.top = first + 'px'; svg.style.height = span + 'px';
      const key = ys.map(Math.round).join(',');
      if (svg.dataset.key !== key) { // sentiero che passa esattamente per ogni pallino
        svg.dataset.key = key;
        let d = 'M100 0';
        for (let k = 1; k < ys.length; k++) { const y0 = ys[k - 1] - first, y1 = ys[k] - first, h = (y1 - y0) / 3, sw = k % 2 ? 70 : -70; d += ` C ${100 + sw} ${y0 + h}, ${100 + sw} ${y1 - h}, 100 ${y1}`; }
        svg.setAttribute('viewBox', `0 0 200 ${span}`);
        svg.querySelectorAll('path').forEach((pa) => pa.setAttribute('d', d));
      }
      const rail = j.querySelector('.j-rail'); rail.style.top = first + 'px'; rail.style.height = span + 'px';
      const line = svg.querySelector('.j-line'); const L = line.getTotalLength();
      const N = 240, tab = new Float32Array(N + 1); // altezza raggiunta a ogni frazione della linea
      for (let i = 0; i <= N; i++) tab[i] = line.getPointAtLength((L * i) / N).y;
      geo = { ys, first, span, tab, N, stops: [...j.querySelectorAll('[data-stop]')], top: jr.top + window.scrollY };
    };
    const reachAt = (y) => { // frazione di linea che arriva all'altezza y (ricerca binaria sulla tabella)
      const { tab, N } = geo; let lo = 0, hi = N;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tab[mid] < y) lo = mid; else hi = mid; }
      const a = tab[lo], b = tab[hi]; return (lo + (b > a ? Math.min(1, Math.max(0, (y - a) / (b - a))) : 0)) / N;
    };
    const paint = () => {
      raf = 0;
      if (!geo) { measure(); if (!geo) return; }
      const vh = innerHeight;
      const { ys, first, span, stops } = geo;
      const jTop = geo.top - window.scrollY; // posizione del sentiero nello schermo, senza misurare il DOM
      const focus = vh * 0.6 - jTop;
      const t = Math.min(1, Math.max(0, (focus - first) / span));
      const cur = Math.min(currentStop, ys.length - 1);
      const yNow = Math.min(t * span, ys[cur] - first);
      j.style.setProperty('--reach', (yNow <= 0 ? 0 : reachAt(yNow)).toFixed(4));
      stops.forEach((s, k) => { const on = ys[k] < focus + vh * 0.15; if (s.classList.contains('in') !== on) s.classList.toggle('in', on); });
      const nodeTop = jTop + ys[cur] - 30, nodeBottom = jTop + ys[cur] + 30, inJourney = jTop < vh * 0.3;
      const off = nodeBottom < 70 ? 'up' : nodeTop > vh - 90 ? 'down' : '';
      const show = inJourney && off && cur <= total;
      const nb = show ? { dir: off, text: cur < total ? fmt(J.backto, { i: cur + 1, t: lessons[cur].title }) : J.backtoFinal } : null;
      const k = JSON.stringify(nb);
      if (k !== backKey.current) { backKey.current = k; setBack(nb); }
    };
    const remeasure = () => { geo = null; on(); };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint();
    // si rimisura quando cambia l'impaginazione (font, immagini, finestra), non a ogni scorrimento
    const t1 = setTimeout(remeasure, 500), t2 = setTimeout(remeasure, 1500);
    const ro = new ResizeObserver(remeasure); ro.observe(j);
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', remeasure);
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); cancelAnimationFrame(raf); removeEventListener('scroll', on); removeEventListener('resize', remeasure); };
  }, [currentStop, total, lessons, J]);

  const cueLabel = doneCount === 0 ? u.cue.start : allDone ? (passed ? u.cue.finish : u.cue.final) : u.cue.resume;
  const finalState = !allDone ? 'locked' : passed ? 'done' : 'now';
  const left = total - doneCount;

  return (
    <>
      {/* si parte nello spazio (video in loop), scorrendo si scende tra le nuvole, la mongolfiera e il prato */}
      <World scenes={[
        { strip: [IMG.sky, IMG.meadow], stripVideo: { src: IMG.space, srcM: IMG.spaceM, poster: IMG.spacePoster, until: '.journey', untilOffset: -0.25 }, dim: 0.08 },
      ]} />
      <section className="scene hero short space-hero">
        <div className="hero-in">
          <Split words={J.title} />
          <p className="lead">{fmt(J.lead, { n: total })}</p>
          <p className="pill-progress"><b>{doneCount}</b> {fmt(J.pill, { d: '', n: total }).trim()}</p>
          <div className="tab-set" role="group" aria-label={J.tablet}>
            <span><Ico n="tablet" /> {J.tablet}</span>
            <button type="button" aria-pressed={usesTablet} onClick={() => acc.setTablet(true)}>{J.yes}</button>
            <button type="button" aria-pressed={!usesTablet} onClick={() => acc.setTablet(false)}>{J.no}</button>
          </div>
        </div>
        <Cue label={cueLabel} onClick={() => glideToStop(currentStop)} />
      </section>

      <section className="journey" ref={jRef}>
        <div className="j-rail"><i /></div>
        <svg className="j-path" viewBox="0 0 200 1000" preserveAspectRatio="none" aria-hidden="true">
          <path className="j-track" pathLength="1" d="M100 0" />
          <path className="j-line" pathLength="1" d="M100 0" />
        </svg>
        <ol className="stops">
          {lessons.map((m, i) => {
            const s = acc.stopState(i);
            return (
              <li key={m.id} className={`stop s-${s} ${i % 2 ? 'right' : 'left'}`} data-stop={i}>
                <span className="node">{s === 'done' ? <Ico n="check" /> : s === 'locked' ? <Ico n="lock" /> : <img className="lemon" src={IMG.lemon} alt="" width="88" height="88" />}</span>
                <div className="card">
                  <p className="kicker">{fmt(J.stop, { i: i + 1, m: m.min })}</p>
                  <h2>{m.title}</h2>
                  {s === 'locked'
                    ? <span className="btn btn-ghost"><Ico n="lock" /> {fmt(J.locked, { i })}</span>
                    : s === 'done'
                      ? <Link className="btn btn-line" to={`/formazione/${i + 1}`}>{J.review} <Ico n="arrow" /></Link>
                      : <Link className="btn btn-accent" to={`/formazione/${i + 1}`}><Ico n="play" /> {i === 0 ? J.start : J.resume}</Link>}
                </div>
              </li>
            );
          })}
          <li className={`stop s-${finalState} ${total % 2 ? 'right' : 'left'} final`} data-stop={total}>
            <span className="node">{finalState === 'done' ? <Ico n="check" /> : finalState === 'locked' ? <Ico n="lock" /> : <img className="lemon" src={IMG.lemon} alt="" width="88" height="88" />}</span>
            <div className="card">
              <p className="kicker">{fmt(J.finalKicker, { n: finalQuestions.length })}</p>
              <h2>{J.finalTitle}</h2>
              {finalState === 'locked'
                ? <span className="btn btn-ghost"><Ico n="lock" /> {J.finalLocked}</span>
                : finalState === 'done'
                  ? <span className="btn btn-line"><Ico n="check" /> {J.finalDone}</span>
                  : <Link className="btn btn-accent" to="/verifica"><Ico n="award" /> {J.finalStart}</Link>}
            </div>
          </li>
        </ol>
        <div className={`arrival ${passed ? 'open' : ''}`} data-stop={total + 1}>
          <span className="node big">{passed ? <Ico n="award" /> : <Ico n="flag" />}</span>
          <h2>{passed ? J.arrivalOpen : J.arrival}</h2>
          <p>{passed ? J.arrivalReady : allDone ? J.arrivalQuiz : left === 1 ? J.arrivalLeft1 : fmt(J.arrivalLeftN, { n: left })}</p>
          {passed && <CertificateDownload user={certUser(acc.profile)} date={acc.profile?.final_quiz_passed_at} label={u.home.cert} />}
        </div>
      </section>

      {back && (
        <a className="backto" href="#" data-dir={back.dir} onClick={(e) => { e.preventDefault(); glideToStop(currentStop); }}>
          <span className="bt-i"><Ico n="down" /></span><span className="bt-t">{back.text}</span>
        </a>
      )}
    </>
  );
}

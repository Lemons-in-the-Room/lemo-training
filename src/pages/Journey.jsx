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
    const tm = setTimeout(() => { glideToStop(vai === 'traguardo' ? total + 1 : currentStop); setParams({}, { replace: true }); }, 700);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sentiero, linea arancione fino alla tappa in corso, comparse, pulsante "torna alla tappa"
  useEffect(() => {
    const j = jRef.current; if (!j) return undefined;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const vh = innerHeight;
      const nodes = [...j.querySelectorAll('.node')];
      const jr = j.getBoundingClientRect();
      const c = (n) => { const r = n.getBoundingClientRect(); return { y: r.top + r.height / 2 - jr.top }; };
      const first = c(nodes[0]), last = c(nodes[nodes.length - 1]);
      const span = Math.max(1, last.y - first.y);
      const svg = j.querySelector('.j-path'); svg.style.top = first.y + 'px'; svg.style.height = span + 'px';
      const key = nodes.map((n) => Math.round(c(n).y)).join(',');
      if (svg.dataset.key !== key) { // sentiero che passa esattamente per ogni pallino
        svg.dataset.key = key;
        const ys = nodes.map((n) => c(n).y - first.y); let d = 'M100 0';
        for (let k = 1; k < ys.length; k++) { const a = ys[k - 1], b = ys[k], h = (b - a) / 3, sw = k % 2 ? 70 : -70; d += ` C ${100 + sw} ${a + h}, ${100 + sw} ${b - h}, 100 ${b}`; }
        svg.setAttribute('viewBox', `0 0 200 ${span}`);
        svg.querySelectorAll('path').forEach((pa) => pa.setAttribute('d', d));
      }
      const rail = j.querySelector('.j-rail'); rail.style.top = first.y + 'px'; rail.style.height = span + 'px';
      const focus = vh * 0.6 - jr.top;
      const t = Math.min(1, Math.max(0, (focus - first.y) / span));
      const cur = Math.min(currentStop, nodes.length - 1);
      const yNow = Math.min(t * span, c(nodes[cur]).y - first.y);
      const line = svg.querySelector('.j-line'); const Ltot = line.getTotalLength(); let lo = 0, hi = Ltot;
      for (let it = 0; it < 22; it++) { const mid = (lo + hi) / 2; if (line.getPointAtLength(mid).y < yNow) lo = mid; else hi = mid; }
      j.style.setProperty('--reach', (yNow <= 0 ? 0 : lo / Ltot).toFixed(4));
      j.querySelectorAll('[data-stop]').forEach((s, k) => s.classList.toggle('in', c(nodes[k]).y < focus + vh * 0.15));
      const nr = nodes[cur].getBoundingClientRect(), inJourney = jr.top < vh * 0.3;
      const off = nr.bottom < 70 ? 'up' : nr.top > vh - 90 ? 'down' : '';
      const show = inJourney && off && cur <= total;
      const nb = show ? { dir: off, text: cur < total ? fmt(J.backto, { i: cur + 1, t: lessons[cur].title }) : J.backtoFinal } : null;
      const k = JSON.stringify(nb);
      if (k !== backKey.current) { backKey.current = k; setBack(nb); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint();
    const t1 = setTimeout(on, 500), t2 = setTimeout(on, 1500);
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    return () => { clearTimeout(t1); clearTimeout(t2); cancelAnimationFrame(raf); removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [currentStop, total, lessons, J]);

  const cueLabel = doneCount === 0 ? u.cue.start : allDone ? (passed ? u.cue.finish : u.cue.final) : u.cue.resume;
  const finalState = !allDone ? 'locked' : passed ? 'done' : 'now';
  const left = total - doneCount;

  return (
    <>
      <World scenes={[{ strip: [IMG.sky, IMG.meadow], dim: 0.08 }]} />
      <section className="scene hero short">
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
                <span className="node">{s === 'done' ? <Ico n="check" /> : s === 'locked' ? <Ico n="lock" /> : <Ico n="play" />}</span>
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
            <span className="node">{finalState === 'done' ? <Ico n="check" /> : finalState === 'locked' ? <Ico n="lock" /> : <Ico n="award" />}</span>
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

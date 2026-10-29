import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { fmt } from '../i18n/ui';
import { Cue, Ico, IMG, Split, World } from '../imm/kit';
import NewsletterAsk from '../components/NewsletterAsk';
import CertificateDownload from '../CertificateDownload';

export default function HomePage() {
  const { t, u } = useLang();
  const h = u.home;
  const acc = useAccount();
  const { lessons, total, doneCount, allDone, passed, nextIndex, finalQuestions } = acc;
  const sceneRef = useRef(null);
  const countRef = useRef(null);
  const firstName = acc.profile?.first_name || (acc.profile?.name || '').split(' ')[0] || '';
  const next = lessons[Math.max(0, nextIndex)];

  // barra che si riempie mentre la scena entra + numero che conta
  useEffect(() => {
    const s = sceneRef.current; let raf = 0;
    const f = () => { raf = 0; const r = s.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 1.1))); s.style.setProperty('--p', p.toFixed(3)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(f); };
    f(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    const c = countRef.current; let r2 = 0; const t0 = performance.now() + 500;
    const tick = (now) => { const p = Math.max(0, Math.min(1, (now - t0) / 1200)); c.textContent = Math.round(doneCount * (1 - Math.pow(1 - p, 3))); if (p < 1) r2 = requestAnimationFrame(tick); };
    r2 = requestAnimationFrame(tick);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); cancelAnimationFrame(r2); };
  }, [doneCount]);

  const st = (i) => acc.stopState(i);
  const lead = allDone && passed ? h.leadDone : allDone ? h.leadAll : t.home.subtitle;
  const sub = allDone && passed ? t.home.descDone : allDone ? h.subAll : doneCount === 0 ? fmt(h.subZero, { n: total }) : t.home.descProgress;

  return (
    <>
      <World scenes={[
        { video: IMG.heroVideo, poster: IMG.heroPoster, dim: 0.12 },
        { src: IMG.heroBlur, at: '.progress-scene', offset: -0.75, dim: 0.4 },
        { src: IMG.meadowBlur, at: '.progress-scene', offset: -0.45, dim: 0.36 },
        { src: IMG.meadow, at: '.progress-scene', offset: -0.15, dim: 0.26 },
      ]} />
      <section className="scene hero">
        <div className="hero-in">
          <Split words={[h.hello, firstName ? `${firstName}.` : '']} />
          <p className="lead">{lead}</p>
        </div>
        <Cue label={u.cue.scroll} />
      </section>

      <section className="scene progress-scene" ref={sceneRef}>
        <div className="pin">
          <div className="prog-in">
            <p className="kicker">{h.kicker}</p>
            <div className="bignum"><b ref={countRef}>0</b><span>{fmt(h.ofModules, { n: total })}</span></div>
            <div className="trail" style={{ '--to': (doneCount + (allDone && passed ? 1 : 0)) / (total + 1) }}>
              <div className={`mascot-walk ${doneCount === 0 ? 'at-start' : doneCount >= total - 1 ? 'at-end' : ''}`} aria-hidden="true">
                <span className="say">{allDone && passed ? h.sayDone : allDone ? h.sayAll : total - doneCount === 1 ? h.say1 : doneCount === 0 ? h.say0 : fmt(h.sayN, { n: total - doneCount })}</span>
                <img src={IMG.mascot} alt="" width="230" height="284" />
              </div>
              <div className="bar">
                <i className="fill" />
                {lessons.map((m, i) => (
                  <span key={m.id} className={`tick t-${st(i)}`} style={{ left: `${((i + 1) / (total + 1)) * 100}%` }}>
                    <b>{st(i) === 'done' ? <Ico n="check" /> : i + 1}</b>
                    <em>{m.title.split(/[ &]/)[0]}</em>
                  </span>
                ))}
                <span className={`goal ${allDone && passed ? 'won' : ''}`} title={h.finish}><Ico n={allDone && passed ? 'award' : 'flag'} /></span>
              </div>
            </div>
            <p className="sub">{sub}</p>
            {allDone && passed
              ? <CertificateDownload user={{ name: acc.profile?.name, lastName: acc.profile?.last_name, hospital: acc.profile?.hospital, department: acc.profile?.department }} date={acc.profile?.final_quiz_passed_at} label={h.cert} />
              : allDone
                ? <Link className="btn btn-accent big btn-live" to="/verifica"><Ico n="award" /> {h.quiz}<small>{fmt(h.questions, { n: finalQuestions.length })}</small></Link>
                : <Link className="btn btn-accent big btn-live" to="/formazione?vai=riprendi"><span className="play-dot"><Ico n="play" /></span> {doneCount === 0 ? h.start : h.resume}<small>{next?.title} · {fmt(h.min, { m: next?.min })}</small><Ico n="arrow" /></Link>}
          </div>
        </div>
      </section>
      <NewsletterAsk />
    </>
  );
}

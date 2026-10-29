import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { fmt } from '../i18n/ui';
import { Cue, Ico, IMG, Split, World, useReveal } from '../imm/kit';

const md = (t) => String(t ?? '').split(/\*\*(.+?)\*\*/g).map((part, k) => (k % 2 ? <b key={k}>{part}</b> : part));

// Video della lezione. La prima volta (tappa non ancora completata) non si può mandare avanti
// né accelerare; il punto massimo raggiunto resta salvato, così si può riprendere dopo una pausa.
function Player({ src, title, sub, locked, storeKey, onProgress }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const maxRef = useRef(Number(localStorage.getItem(storeKey) || 0));
  useEffect(() => {
    const v = ref.current; if (!v) return undefined;
    const report = () => { const d = v.duration || 0; onProgress?.(d ? Math.min(1, maxRef.current / d) : 0, v.ended); };
    const onTime = () => {
      if (!v.seeking && v.currentTime > maxRef.current && v.currentTime - maxRef.current < 2) {
        maxRef.current = v.currentTime; localStorage.setItem(storeKey, String(Math.floor(maxRef.current)));
      }
      report();
    };
    const onSeeking = () => { if (locked && v.currentTime > maxRef.current + 0.5) v.currentTime = maxRef.current; };
    const onRate = () => { if (locked && v.playbackRate !== 1) v.playbackRate = 1; };
    const onEnded = () => { maxRef.current = v.duration || maxRef.current; localStorage.setItem(storeKey, String(Math.ceil(maxRef.current))); onProgress?.(1, true); };
    const onMeta = () => { if (locked && maxRef.current > 1 && maxRef.current < (v.duration || 0) - 1) v.currentTime = maxRef.current; report(); };
    v.addEventListener('timeupdate', onTime); v.addEventListener('seeking', onSeeking);
    v.addEventListener('ratechange', onRate); v.addEventListener('ended', onEnded); v.addEventListener('loadedmetadata', onMeta);
    return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('seeking', onSeeking); v.removeEventListener('ratechange', onRate); v.removeEventListener('ended', onEnded); v.removeEventListener('loadedmetadata', onMeta); };
  }, [locked, storeKey, onProgress]);
  return (
    <div className={`player rv ${locked ? 'locked' : ''}`}>
      <video ref={ref} controls preload="metadata" playsInline src={src}
        controlsList={locked ? 'noplaybackrate nodownload' : 'nodownload'} disablePictureInPicture />
      {!playing && (
        <button type="button" className="cover" onClick={() => { setPlaying(true); ref.current?.play().catch(() => {}); }}>
          <span className="playbtn"><Ico n="play" /></span><b>{title}</b><span>{sub}</span>
        </button>
      )}
    </div>
  );
}

export default function LessonPage() {
  const { n } = useParams();
  const { u } = useLang();
  const L = u.lesson;
  const acc = useAccount();
  const navigate = useNavigate();
  const i = Number(n) - 1;
  const m = acc.lessons[i];
  const [prog, setProg] = useState({ main: 0, tablet: 0, mainEnd: false, tabletEnd: false });
  const onMain = useCallback((p, end) => setProg((s) => ({ ...s, main: Math.max(s.main, p), mainEnd: s.mainEnd || end })), []);
  const onTab = useCallback((p, end) => setProg((s) => ({ ...s, tablet: Math.max(s.tablet, p), tabletEnd: s.tabletEnd || end })), []);
  useReveal([i]);
  if (!m || acc.stopState(i) === 'locked') return <Navigate to="/formazione" replace />;
  const done = acc.stopState(i) === 'done';
  const last = i + 1 >= acc.total;
  const uid = acc.profile?.id || 'u';
  const needTablet = acc.usesTablet && !!m.tablet;
  const mainOk = prog.mainEnd || prog.main >= 0.98;
  const tabOk = !needTablet || prog.tabletEnd || prog.tablet >= 0.98;
  const canComplete = done || (mainOk && tabOk);
  const pct = Math.round((needTablet ? (prog.main + prog.tablet) / 2 : prog.main) * 100);

  const complete = async () => {
    await acc.completeLesson(m.id);
    navigate('/formazione?vai=riprendi');
  };

  return (
    <>
      <World scenes={[
        { src: IMG.meadow, dim: 0.25 },
        { src: IMG.meadowBlur, at: '.lesson', offset: -0.4, dim: 0.62 },
      ]} deps={[i]} />
      <section className="scene hero short lesson-hero">
        <div className="hero-in">
          <Link className="back" to="/formazione"><Ico n="back" /> {L.back}</Link>
          <p className="kicker">{fmt(L.kicker, { i: i + 1, n: acc.total, m: m.min })}</p>
          <Split words={[m.title]} />
          <p className="lead">{m.desc}</p>
        </div>
        <Cue label={u.cue.watch} />
      </section>
      <section className="lesson">
        <Player src={m.video} title={m.title} sub={fmt(L.watch, { m: m.min })} locked={!done} storeKey={`lemo_seen_${uid}_${m.id}`} onProgress={onMain} />
        {!done && <p className="no-skip rv"><Ico n="clock" /> {L.noSkip}</p>}
        {acc.usesTablet && m.tablet && (
          <>
            <h2 className="sec rv">{L.tablet}</h2>
            <Player src={m.tablet} title={`${m.title} · ${L.tablet}`} sub={L.tablet} locked={!done} storeKey={`lemo_seen_${uid}_${m.id}_tab`} onProgress={onTab} />
          </>
        )}
        <h2 className="sec rv">{L.keys}</h2>
        <div className="keys">
          {m.slides.map((s, k) => (
            <article key={k} className="key rv"><span className="kn">{k + 1}</span><div><h3>{s.title}</h3><p>{md(s.content)}</p></div></article>
          ))}
        </div>
        <div className="finish rv">
          {done ? (
            <><p>{L.doneAlready}</p><Link className="btn btn-line big" to="/formazione?vai=riprendi"><Ico n="back" /> {L.backJourney}</Link></>
          ) : (
            <>
              <div className="finish-txt">
                <p>{canComplete ? L.ask : L.mustWatch}</p>
                {!canComplete && <div className="watch-bar" aria-label={fmt(L.watched, { p: pct })}><i style={{ width: `${pct}%` }} /><span>{fmt(L.watched, { p: pct })}</span></div>}
              </div>
              <button type="button" className="btn btn-accent big" disabled={!canComplete} onClick={complete}>
                {canComplete ? <Ico n="check" /> : <Ico n="lock" />} {last ? L.complete : L.completeNext}
              </button>
            </>
          )}
        </div>
      </section>
    </>
  );
}

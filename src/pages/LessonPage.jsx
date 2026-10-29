import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { fmt } from '../i18n/ui';
import { Cue, Ico, IMG, Split, World, useReveal } from '../imm/kit';

const md = (t) => String(t ?? '').split(/\*\*(.+?)\*\*/g).map((part, k) => (k % 2 ? <b key={k}>{part}</b> : part));

function Player({ src, title, sub }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  return (
    <div className="player rv">
      <video ref={ref} controls preload="none" playsInline src={src} />
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
  useReveal([i]);
  if (!m || acc.stopState(i) === 'locked') return <Navigate to="/formazione" replace />;
  const done = acc.stopState(i) === 'done';
  const last = i + 1 >= acc.total;

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
        <Player src={m.video} title={m.title} sub={fmt(L.watch, { m: m.min })} />
        {acc.usesTablet && m.tablet && (
          <>
            <h2 className="sec rv">{L.tablet}</h2>
            <Player src={m.tablet} title={`${m.title} · ${L.tablet}`} sub={L.tablet} />
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
            <><p>{L.ask}</p><button type="button" className="btn btn-accent big" onClick={complete}><Ico n="check" /> {last ? L.complete : L.completeNext}</button></>
          )}
        </div>
      </section>
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { fmt } from '../i18n/ui';
import { Cue, Ico, Split, World, useReveal } from '../imm/kit';

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((v) => v[1]);

export default function FinalQuiz() {
  const { u } = useLang();
  const Q = u.quiz;
  const acc = useAccount();
  const qs = acc.finalQuestions;
  const PASS = acc.passMark;
  const [attempt, setAttempt] = useState(0);
  const [q, setQ] = useState(0);
  const [picks, setPicks] = useState([]);
  const [busy, setBusy] = useState(false);
  // ordine delle risposte rimescolato a ogni tentativo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const order = useMemo(() => qs.map((x) => shuffle(x.answers.map((_, k) => k))), [qs, attempt]);
  const finished = q >= qs.length;
  const wrong = finished ? qs.map((x, k) => ({ x, k, pick: picks[k] })).filter((w) => w.pick !== w.x.correct) : [];
  const score = qs.length - wrong.length;
  const ok = finished && score >= PASS;
  useReveal([]);

  useEffect(() => { if (finished) acc.saveQuizResult(score, ok); /* salva una volta per tentativo */ }, [finished, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!acc.allDone) return <Navigate to="/formazione" replace />;

  const choose = (k) => {
    if (busy) return;
    setBusy(true);
    setPicks((p) => { const n = [...p]; n[q] = k; return n; });
    setTimeout(() => { setQ((v) => v + 1); setBusy(false); }, 350);
  };
  const retry = () => {
    setAttempt((a) => a + 1); setQ(0); setPicks([]);
    document.querySelector('.quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const cur = qs[q];

  return (
    <>
      <World scenes={[{ palette: true, dim: 0 }]} />
      <section className="scene hero short">
        <div className="hero-in">
          <Link className="back" to="/formazione"><Ico n="back" /> {u.lesson.back}</Link>
          <Split words={Q.title} />
          <p className="lead">{fmt(Q.lead, { n: qs.length, p: PASS })}</p>
        </div>
        <Cue label={Q.start} />
      </section>
      <section className="lesson">
        <div className="quiz rv in" aria-live="polite">
          {!finished ? (
            <div key={`${attempt}-${q}`}>
              <div className="q-top"><span>{fmt(Q.q, { i: q + 1, n: qs.length })}</span><div className="q-bar"><i style={{ width: `${(q / qs.length) * 100}%` }} /></div></div>
              <h3>{cur.question}</h3>
              <div className="q-opts">
                {order[q].map((k) => (
                  <button type="button" key={k} disabled={busy} className={picks[q] === k ? 'picked' : ''} onClick={() => choose(k)}>{cur.answers[k]}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className={`q-res ${ok ? 'pass' : 'fail'}`}>
                <div className="q-score"><b>{score}</b><span>{fmt(Q.of, { n: qs.length })}</span></div>
                <h3>{ok ? Q.pass : Q.fail}</h3>
                <p>{ok ? (wrong.length ? Q.passWrong : Q.passAll) : fmt(Q.failText, { p: PASS })}</p>
              </div>
              {wrong.length > 0 && (
                <ol className="q-review">
                  {wrong.map(({ x, k, pick }) => (
                    <li key={k}>
                      <p className="q-n">{fmt(Q.reviewHead, { i: k + 1, s: x.stop + 1, t: acc.lessons[x.stop]?.title })}</p>
                      <h4>{x.question}</h4>
                      <p className="q-wrong"><Ico n="close" /> {x.answers[pick]}</p>
                      <p className="q-right"><Ico n="check" /> {x.answers[x.correct]}</p>
                      <Link to={`/formazione/${x.stop + 1}`}>{Q.reviewLink} <Ico n="arrow" /></Link>
                    </li>
                  ))}
                </ol>
              )}
              <div className="q-actions">
                {ok
                  ? <Link className="btn btn-accent big" to="/formazione?vai=traguardo"><Ico n="award" /> {Q.toFinish}</Link>
                  : <button type="button" className="btn btn-accent big" onClick={retry}>{Q.retry}</button>}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { fmt } from '../i18n/ui';
import { Ico, IMG, World } from '../imm/kit';

// Domande del primo accesso. A chi è già certificato chiediamo solo il tablet.
export default function Onboarding() {
  const { u } = useLang();
  const O = u.onb;
  const acc = useAccount();
  const navigate = useNavigate();
  // deciso una sola volta: dopo la risposta l'avanzamento cambia e non deve ricalcolare i passi
  const [askPrior] = useState(() => !acc.passed && !acc.allDone);
  const steps = [
    ...(askPrior ? [{ k: 'prior', q: O.q1, h: O.h1, y: O.y1, n: O.n1 }] : []),
    { k: 'tablet', q: O.q2, h: O.h2, y: O.y2, n: O.n2 },
  ];
  const [step, setStep] = useState(0);
  const [prior, setPrior] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const S = steps[Math.min(step, steps.length - 1)];

  const answer = async (v) => {
    if (S.k === 'prior') { setPrior(v); setStep(step + 1); return; }
    setBusy(true);
    await acc.answerOnboarding({ prior, tablet: v });
    navigate('/home', { replace: true });
  };

  return (
    <>
      <World scenes={[{ src: IMG.heroBlur, dim: 0.35 }]} />
      <section className="scene hero onb">
        <div className="hero-in" key={step}>
          <p className="kicker">{fmt(O.kicker, { i: step + 1, n: steps.length })}</p>
          <h1 className="onb-q">{S.q}</h1>
          <p className="lead">{S.h}</p>
          <div className="onb-a">
            <button type="button" className="btn btn-accent big" disabled={busy} onClick={() => answer(true)}><Ico n="check" /> {S.y}</button>
            <button type="button" className="btn btn-line big" disabled={busy} onClick={() => answer(false)}>{S.n}</button>
          </div>
          {steps.length > 1 && <div className="onb-dots" aria-hidden="true">{steps.map((_, k) => <i key={k} className={k <= step ? 'on' : ''} />)}</div>}
        </div>
      </section>
    </>
  );
}

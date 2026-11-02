// Proposta newsletter (regola decisa da Leonardo):
// - solo in Home, 3 secondi dopo l'apertura;
// - a ogni accesso alla Home finché l'operatore non risponde (Iscriviti oppure No grazie);
// - non nella stessa visita in cui ha appena risposto alle domande del primo accesso.
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { Ico } from '../imm/kit';

export default function NewsletterAsk() {
  const { t } = useLang();
  const h = t.home;
  const acc = useAccount();
  const [show, setShow] = useState(false);
  const [state, setState] = useState('idle');
  const eligible = !!acc.profile && acc.profile.newsletter_opt_in == null && !sessionStorage.getItem('lemo_onb_now');

  useEffect(() => {
    if (!eligible) return undefined;
    const tm = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(tm);
  }, [eligible]);

  const answer = async (yes) => {
    const p = acc.profile;
    if (yes) {
      setState('loading');
      await supabase.from('newsletter').upsert({ email: p.email }, { onConflict: 'email' });
      await acc.setNewsletter(true);
      setState('done');
      setTimeout(() => setShow(false), 2200);
    } else {
      setShow(false);
      await acc.setNewsletter(false);
    }
  };

  if (!show) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="nl-t">
      <div className="modal-card nl">
        {state === 'done' ? (
          <><span className="nl-ok"><Ico n="check" /></span><h2 id="nl-t">{h.newsletterSuccessTitle}</h2><p>{h.newsletterSuccessDesc}</p></>
        ) : (
          <>
            <h2 id="nl-t">{h.newsletterTitle} <em>{h.newsletterTitleAccent}</em></h2>
            <p>{h.newsletterDesc}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-line" onClick={() => answer(false)}>{h.newsletterNo}</button>
              <button type="button" className="btn btn-accent" disabled={state === 'loading'} onClick={() => answer(true)}>{state === 'loading' ? h.newsletterSubmitting : h.newsletterSubmit}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

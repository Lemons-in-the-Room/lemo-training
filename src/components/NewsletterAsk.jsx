// Proposta newsletter: una sola volta (finché l'operatore non risponde), solo dopo la prima tappa.
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
  const eligible = acc.profile && acc.profile.newsletter_opt_in == null && acc.doneCount >= 1
    && !sessionStorage.getItem('lemo_nl_seen');

  useEffect(() => {
    if (!eligible) return undefined;
    const tm = setTimeout(() => { setShow(true); sessionStorage.setItem('lemo_nl_seen', '1'); }, 2500);
    return () => clearTimeout(tm);
  }, [eligible]);

  const answer = async (yes) => {
    const p = acc.profile;
    if (yes) {
      setState('loading');
      await supabase.from('newsletter').upsert({ email: p.email }, { onConflict: 'email' });
      await supabase.from('users').update({ newsletter_opt_in: true }).eq('id', p.id);
      setState('done');
      setTimeout(() => setShow(false), 2200);
    } else {
      setShow(false);
      await supabase.from('users').update({ newsletter_opt_in: false }).eq('id', p.id);
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

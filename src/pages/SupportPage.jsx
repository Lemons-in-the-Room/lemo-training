import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAccount } from '../account';
import { supabase } from '../utils/supabase';
import { Cue, Ico, IMG, Split, World, glideTo, useReveal } from '../imm/kit';
import { openChat } from '../components/ChatWidget';

const PHONE = '+39 348 758 9509';

export default function SupportPage() {
  const { t, u, lang } = useLang();
  const s = t.support;
  const S = u.support;
  const acc = useAccount();
  const { hash } = useLocation();
  const [type, setType] = useState('Tecnico');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [err, setErr] = useState('');
  useReveal([]);

  const toTicket = () => {
    const el = document.getElementById('ticket');
    if (el) glideTo(window.scrollY + el.getBoundingClientRect().top - 110);
  };
  useEffect(() => { if (hash === '#ticket') { const tm = setTimeout(toTicket, 500); return () => clearTimeout(tm); } return undefined; }, [hash]);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setState('sending'); setErr('');
    const p = acc.profile || {};
    const payload = {
      subject, ticketType: type, message, lang,
      user_name: p.name || '—', hospital: p.hospital || '—', department: p.department || '—', patientType: p.patient_type || '—',
    };
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token || '';
      const r = await fetch('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(s.errorSend);
      setState('sent'); setSubject(''); setMessage('');
      setTimeout(() => setState('idle'), 6000);
    } catch (ex) {
      setErr(ex.message === s.errorSend ? s.errorSend : s.errorConnection);
      setState('error');
    }
  };

  return (
    <>
      <World scenes={[
        { video: IMG.library, videoM: IMG.libraryM, poster: IMG.libraryPoster, dim: 0.25 },
        { src: IMG.libraryBlur, at: '.support', offset: -0.7, dim: 0.3 },
        { palette: true, at: '.support', offset: -0.15, dim: 0 },
      ]} />
      <section className="scene hero short">
        <div className="hero-in">
          <Split words={S.title} />
          <p className="lead">{S.lead}</p>
          <div className="quick">
            <button type="button" className="btn btn-accent" onClick={openChat}><Ico n="chat" /> {S.ask}</button>
            <button type="button" className="btn btn-line" onClick={toTicket}>{S.ticket}</button>
            <a className="btn btn-line" href={`tel:${PHONE.replace(/\s/g, '')}`}><Ico n="phone" /> {S.call}</a>
          </div>
        </div>
        <Cue label={u.cue.scroll} />
      </section>
      <section className="support">
        <div className="sup-in">
          <div className="faq">
            <h2 className="sec rv">{s.faqTitle}</h2>
            {s.faqs.map((f, k) => (
              <details key={k} className="rv" open={k === 0}>
                <summary><span><small>{s.tagLabels?.[f.tag] || f.tag}</small>{f.q}</span><Ico n="down" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div className="side">
            <h2 className="sec rv">{S.ticket}</h2>
            <form className={`ticket rv ${state === 'sent' ? 'sent' : ''}`} id="ticket" onSubmit={submit}>
              <p className="sla"><Ico n="clock" /><span>{s.ticketSla}</span></p>
              <div className="seg2" role="radiogroup" aria-label={s.ticketType}>
                {[['Tecnico', s.optionTech], ['Operativo', s.optionOp]].map(([v, l]) => (
                  <label key={v}><input type="radio" name="ttype" checked={type === v} onChange={() => setType(v)} /><span>{l}</span></label>
                ))}
              </div>
              <label className="fld"><span>{s.ticketSubject}</span><input required maxLength={140} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={s.placeholderSubject} /></label>
              <label className="fld"><span>{s.ticketDetails}</span><textarea required rows={4} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={s.placeholderDetails} /></label>
              {err && <p className="form-err" role="alert">{err}</p>}
              <button className="btn btn-accent wide" disabled={state === 'sending'}>{state === 'sending' ? s.submitting : s.submitBtn} <Ico n="send" /></button>
              <div className="sent-msg" role="status"><Ico n="check" /><b>{s.sentTitle}</b><span>{s.sentDesc}</span></div>
            </form>
            <a className="call rv" href={`tel:${PHONE.replace(/\s/g, '')}`}>
              <span className="call-i"><Ico n="phone" /></span>
              <span><small>{S.urgent}</small><b>Ing. Leonardo Bragalli</b><em>{PHONE}</em></span>
              <Ico n="arrow" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

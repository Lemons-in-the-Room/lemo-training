import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useLang } from '../LanguageContext';
import { Ico } from '../imm/kit';

const TXT = {
  it: { title: 'Assistente Lemons', hello: "Ciao! Chiedimi qualsiasi cosa sull'uso dei visori o della piattaforma.", placeholder: 'Scrivi una domanda…', disclaimer: 'Non inserire dati dei pazienti. Per indicazioni cliniche rivolgiti al personale medico.', ticket: 'Apri un ticket', sources: 'Fonti', error: 'Qualcosa è andato storto. Riprova.', login: "Accedi per usare l'assistente.", send: 'Invia', open: 'Apri l\'assistente' },
  en: { title: 'Lemons Assistant', hello: 'Hi! Ask me anything about using the headsets or the platform.', placeholder: 'Type a question…', disclaimer: 'Do not enter patient data. For clinical guidance, refer to medical staff.', ticket: 'Open a ticket', sources: 'Sources', error: 'Something went wrong. Please try again.', login: 'Log in to use the assistant.', send: 'Send', open: 'Open the assistant' },
  es: { title: 'Asistente Lemons', hello: '¡Hola! Pregúntame lo que quieras sobre los visores o la plataforma.', placeholder: 'Escribe una pregunta…', disclaimer: 'No introduzcas datos de pacientes. Para indicaciones clínicas, consulta al personal médico.', ticket: 'Abrir un ticket', sources: 'Fuentes', error: 'Algo salió mal. Inténtalo de nuevo.', login: 'Inicia sesión para usar el asistente.', send: 'Enviar', open: 'Abrir el asistente' },
};

// apertura dall'esterno (es. pulsante "Chiedi all'assistente" in Supporto)
// eslint-disable-next-line react-refresh/only-export-components
export const openChat = () => window.dispatchEvent(new Event('lemo:open-chat'));

const ChatWidget = () => {
  const { lang, u } = useLang();
  const tx = TXT[lang] || TXT.en;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // il fumetto compare solo dove non copre lezioni e verifica
  const nudgeHere = pathname === '/home' || pathname === '/supporto';
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    const f = () => { setOpen(true); setNudge(false); };
    window.addEventListener('lemo:open-chat', f);
    return () => window.removeEventListener('lemo:open-chat', f);
  }, []);
  useEffect(() => { document.querySelector('.imm')?.classList.toggle('chat-open', open); }, [open]);

  // fumetto di benvenuto: una volta per sessione, poi si chiude da solo
  useEffect(() => {
    if (sessionStorage.getItem('lemo_nudge')) return undefined;
    let b = 0;
    const tryShow = () => {
      if (document.querySelector('.imm .modal')) { a = setTimeout(tryShow, 4000); return; } // non sopra un'altra finestra
      setNudge(true); b = setTimeout(() => setNudge(false), 12000);
    };
    let a = setTimeout(tryShow, 3500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const dismissNudge = () => { setNudge(false); sessionStorage.setItem('lemo_nudge', '1'); };

  const send = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error(tx.login);
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ question, lang, history }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || tx.error);
      setMessages((m) => [...m, { role: 'assistant', text: j.answer, sources: j.sources || [], answered: j.answered }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: err.message || tx.error, error: true, answered: false }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {nudge && nudgeHere && !open && (
        <div className="nudge" role="status" onClick={() => { dismissNudge(); setOpen(true); }}>
          <button type="button" className="nudge-x" aria-label={u.chat.close} onClick={(e) => { e.stopPropagation(); dismissNudge(); }}><Ico n="close" /></button>
          <b>{u.chat.nudgeTitle}</b><span>{u.chat.nudgeText}</span>
        </div>
      )}
      <button type="button" className="fab" aria-label={tx.open} aria-expanded={open} onClick={() => { dismissNudge(); setOpen(true); }}>
        <svg viewBox="0 0 48 48" className="bot" aria-hidden="true">
          <path className="bubble" d="M24 7c9.9 0 18 6.6 18 15s-8.1 15-18 15c-1.9 0-3.7-.2-5.4-.7L10 40l1.6-7.3C8 29.9 6 26.2 6 22 6 13.6 14.1 7 24 7z" />
          <circle className="dot d1" cx="17" cy="22" r="2.6" /><circle className="dot d2" cx="24" cy="22" r="2.6" /><circle className="dot d3" cx="31" cy="22" r="2.6" />
          <path className="spark" d="M39 4l1.2 3.3L43.5 8.5l-3.3 1.2L39 13l-1.2-3.3L34.5 8.5l3.3-1.2z" />
        </svg>
        <i className="online" />
      </button>
      {open && (
        <section className="chat" role="dialog" aria-label={tx.title}>
          <header><b>{tx.title}</b><button type="button" className="chat-x" aria-label={u.chat.close} onClick={() => setOpen(false)}><Ico n="close" /></button></header>
          <div className="chat-body" aria-live="polite">
            <p className="msg bot">{tx.hello}</p>
            {messages.map((m, k) => (
              <div key={k} className={`msg ${m.role === 'user' ? 'me' : 'bot'} ${m.error ? 'err' : ''}`}>
                <p>{m.text}</p>
                {m.role === 'assistant' && m.sources?.length > 0 && <small>{tx.sources}: {m.sources.join(' · ')}</small>}
                {m.role === 'assistant' && m.answered === false && (
                  <button type="button" className="msg-ticket" onClick={() => { setOpen(false); navigate('/supporto#ticket'); }}><Ico n="help" /> {tx.ticket}</button>
                )}
              </div>
            ))}
            {loading && <p className="msg bot typing" aria-label="…"><i /><i /><i /></p>}
            <span ref={endRef} />
          </div>
          <form className="chat-in" onSubmit={send}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={tx.placeholder} aria-label={tx.placeholder} maxLength={500} />
            <button type="submit" aria-label={tx.send} disabled={loading || !input.trim()}><Ico n="send" /></button>
          </form>
          <p className="chat-note">{tx.disclaimer}</p>
        </section>
      )}
    </>
  );
};

export default ChatWidget;

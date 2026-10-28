import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, LifeBuoy, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useLang } from '../LanguageContext';

const TXT = {
  it: { title: 'Assistente Lemons', hello: 'Ciao! Chiedimi qualsiasi cosa sull\'uso dei visori o della piattaforma.', placeholder: 'Scrivi una domanda…', disclaimer: 'Non inserire dati dei pazienti. Per indicazioni cliniche rivolgiti al personale medico.', ticket: 'Apri un ticket', sources: 'Fonti', error: 'Qualcosa è andato storto. Riprova.', login: 'Accedi per usare l\'assistente.' },
  en: { title: 'Lemons Assistant', hello: 'Hi! Ask me anything about using the headsets or the platform.', placeholder: 'Type a question…', disclaimer: 'Do not enter patient data. For clinical guidance, refer to medical staff.', ticket: 'Open a ticket', sources: 'Sources', error: 'Something went wrong. Please try again.', login: 'Log in to use the assistant.' },
  es: { title: 'Asistente Lemons', hello: '¡Hola! Pregúntame lo que quieras sobre los visores o la plataforma.', placeholder: 'Escribe una pregunta…', disclaimer: 'No introduzcas datos de pacientes. Para indicaciones clínicas, consulta al personal médico.', ticket: 'Abrir un ticket', sources: 'Fuentes', error: 'Algo salió mal. Inténtalo de nuevo.', login: 'Inicia sesión para usar el asistente.' },
};

const ChatWidget = () => {
  const { lang } = useLang();
  const tx = TXT[lang] || TXT.en;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, open]);

  const send = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    setMessages(m => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error(tx.login);
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question, lang, history }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || tx.error);
      setMessages(m => [...m, { role: 'assistant', text: j.answer, sources: j.sources || [], answered: j.answered }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: err.message || tx.error, error: true, answered: false }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="fixed z-[90] right-4 left-4 bottom-44 md:left-auto md:right-8 md:bottom-28 md:w-[400px] h-[min(560px,calc(100dvh-13rem))] md:h-[min(560px,calc(100dvh-10rem))] flex flex-col rounded-[1.75rem] overflow-hidden bg-[#040F2A]/95 backdrop-blur-[40px] border border-white/[0.12] shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8756FA] to-[#FF8731] flex items-center justify-center"><MessageCircle className="w-4 h-4" /></span>
                {tx.title}
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-1" aria-label="close"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.06] text-slate-200 text-sm leading-relaxed">{tx.hello}</div>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                    ? 'rounded-tr-md bg-gradient-to-br from-[#FF8731] to-[#FF9E54] text-white'
                    : m.error ? 'rounded-tl-md bg-red-500/10 border border-red-500/20 text-red-300' : 'rounded-tl-md bg-white/[0.06] text-slate-200'}`}>
                    {m.text}
                    {m.role === 'assistant' && m.sources?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-slate-400">{tx.sources}: {m.sources.join(' · ')}</div>
                    )}
                    {m.role === 'assistant' && m.answered === false && (
                      <button onClick={() => { setOpen(false); navigate('/support'); }} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#FF8731] hover:text-white">
                        <LifeBuoy className="w-3.5 h-3.5" /> {tx.ticket}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div className="flex items-center gap-2 text-slate-400 text-sm px-2"><Loader2 className="w-4 h-4 animate-spin" />…</div>}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="px-4 pt-3 pb-3 border-t border-white/[0.08]">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1} value={input} maxLength={1000}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                  placeholder={tx.placeholder}
                  className="flex-1 resize-none max-h-28 bg-white/[0.06] border border-white/[0.10] rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-[#FF8731]/50"
                />
                <button type="submit" disabled={!input.trim() || loading} className="w-11 h-11 shrink-0 rounded-full bg-[#FF8731] hover:bg-[#FF9E54] disabled:opacity-40 flex items-center justify-center text-white" aria-label="send">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-500 leading-snug">{tx.disclaimer}</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        aria-label={tx.title}
        className="fixed z-[90] right-5 bottom-28 md:right-8 md:bottom-8 w-14 h-14 rounded-full bg-gradient-to-br from-[#8756FA] to-[#FF8731] text-white shadow-[0_15px_35px_rgba(255,135,49,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
};

export default ChatWidget;

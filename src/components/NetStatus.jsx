import { useEffect, useState } from 'react';
import { useLang } from '../LanguageContext';
import { Ico } from '../imm/kit';

// Wi-Fi di reparto instabile: avviso quando cade la rete; al ritorno i video che stavano andando ripartono da soli.
export default function NetStatus() {
  const { u } = useLang();
  const [state, setState] = useState(navigator.onLine ? 'ok' : 'off'); // ok | off | back
  useEffect(() => {
    let playing = [], tm = 0;
    const off = () => {
      playing = [...document.querySelectorAll('.player video')].filter((v) => !v.paused && !v.ended);
      clearTimeout(tm); setState('off');
    };
    const on = () => {
      setState('back');
      playing.forEach((v) => {
        const t = v.currentTime;
        // se il caricamento si era bloccato, si ricarica dal punto raggiunto
        if (v.readyState < 3) { v.load(); v.currentTime = t; }
        v.play().catch(() => {});
      });
      playing = [];
      tm = setTimeout(() => setState('ok'), 2500);
    };
    addEventListener('offline', off); addEventListener('online', on);
    return () => { clearTimeout(tm); removeEventListener('offline', off); removeEventListener('online', on); };
  }, []);
  if (state === 'ok') return null;
  return (
    <div className={`net ${state}`} role="status" aria-live="polite">
      <Ico n={state === 'off' ? 'close' : 'check'} /> {state === 'off' ? u.net.off : u.net.on}
    </div>
  );
}

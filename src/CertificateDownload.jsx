import { useEffect, useState } from 'react';
import { useLang } from './LanguageContext';
import { Ico } from './imm/kit';

// Pulsante + modello del certificato (PDF generato nel browser).
// date = giorno in cui è stata superata la verifica finale.
// Telefono = schermo touch; app con browser interno (Gmail, WhatsApp, Instagram, Facebook, Teams…) non salvano file.
const isPhone = () => window.matchMedia('(pointer: coarse)').matches;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const inAppBrowser = () => /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|GSA\/|Teams|LinkedInApp|; wv\)/i.test(navigator.userAgent);
const cache = new Map(); // creazione in corso o finita (chiave: dati + lingua)
const files = new Map(); // certificati già pronti, leggibili all'istante

const CertificateDownload = ({ user, date, className = 'btn btn-accent big', label }) => {
  const { t, u, lang } = useLang();
  const h = t.home;
  const C = u.cert;
  const [state, setState] = useState('idle'); // idle | working | ready | done | inapp | error
  const [now] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  const certificateCode = `LMR-${new Date(date || now).getFullYear()}-${String(user?.name || '').length * 137 % 9000 + 1000}`;
  const certificateDate = new Date(date || now).toLocaleDateString('it-IT');
  const filename = `${['Certificato Lemons', user?.name || user?.lastName || 'Operatore', user?.hospital].filter(Boolean).join(' - ').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()}.pdf`;
  const key = JSON.stringify([user?.name, user?.hospital, user?.department, certificateDate, lang]);

  // crea il PDF (in memoria, senza scaricarlo)
  const build = async () => {
    if (cache.has(key)) return cache.get(key);
    const job = (async () => {
      const element = document.getElementById('certificate-template-shared');
      element.style.display = 'block';
      try {
        const { default: html2pdf } = await import('html2pdf.js');
        const blob = await html2pdf().set({
          margin: 0, filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        }).from(element).outputPdf('blob');
        return new File([blob], filename, { type: 'application/pdf' });
      } finally { element.style.display = 'none'; }
    })();
    cache.set(key, job);
    job.then((f) => files.set(key, f), () => cache.delete(key));
    return job;
  };

  // Su telefono il PDF si prepara in anticipo, appena la pagina è ferma: così il tocco sul pulsante
  // salva il file subito (Safari e Chrome permettono di salvare solo nell'istante del tocco).
  useEffect(() => {
    if (!isPhone()) return undefined;
    const go = () => { build().catch(() => {}); };
    const id = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 4000 }) : window.setTimeout(go, 2500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // consegna il file: deve partire DENTRO il tocco dell'utente
  const deliver = (file) => {
    if (isPhone() && isIOS() && navigator.canShare?.({ files: [file] })) {
      // iPhone: si apre il foglio di condivisione con l'anteprima del PDF e "Salva su File"
      navigator.share({ files: [file], title: file.name }).then(() => setState('done')).catch((e) => setState(e?.name === 'AbortError' ? 'idle' : 'error'));
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setState('done');
  };

  const onClick = async () => {
    if (inAppBrowser()) { setState('inapp'); return; }
    // già pronto? si salva subito, dentro il tocco
    let file = files.get(key);
    if (file) { deliver(file); return; }
    setState('working');
    try {
      file = await build();
      if (isPhone()) setState('ready'); // serve un secondo tocco: il primo è "scaduto" mentre si creava il PDF
      else deliver(file);
    } catch { setState('error'); }
  };

  const onReady = async () => { try { deliver(await build()); } catch { setState('error'); } };
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.origin + '/home'); setCopied(true); } catch { /* niente */ } };

  return (
    <>
      {state === 'ready'
        ? <button type="button" className={`${className} btn-live`} onClick={onReady}><Ico n="award" /> {C.ready}</button>
        : <button type="button" className={className} onClick={onClick} disabled={state === 'working'} aria-busy={state === 'working'}>
            <Ico n="award" /> {state === 'working' ? C.preparing : (label || h.getCert)}
          </button>}
      {state === 'done' && <p className="cert-msg ok" role="status">{!isPhone() ? C.savedPc : isIOS() ? C.savedIos : C.saved}</p>}
      {state === 'error' && <p className="cert-msg err" role="alert">{C.error}</p>}
      {state === 'inapp' && (
        <p className="cert-msg err" role="alert">{C.inApp} <button type="button" className="cert-copy" onClick={copyLink}>{copied ? C.copied : C.copy}</button></p>
      )}

      {/* Hidden certificate template */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <div id="certificate-template-shared" style={{ display: 'none', width: '1123px', height: '794px', backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden', fontFamily: "'Nunito', sans-serif" }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '25px solid #03091B', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', top: '35px', left: '35px', right: '35px', bottom: '35px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', bottom: '40px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', backgroundColor: '#FF8731', borderRadius: '50%', opacity: '0.2' }} />
          <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', backgroundColor: '#03091B', borderRadius: '50%', opacity: '0.05' }} />
          <div style={{ position: 'relative', zIndex: 10, height: '100%', padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <img src="/images/logos/logo esteso nero png.png" alt="Lemons in the room" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>{h.certCode}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#03091B', letterSpacing: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>{certificateCode}</p>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '-20px' }}>
              <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '56px', fontWeight: '900', color: '#03091B', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: "'Recoleta Alt', serif" }}>{h.certTitle}</h1>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#FF8731', margin: '15px auto 0 auto' }} />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase' }}>{h.certConferredTo}</p>
                <h2 style={{ margin: 0, fontSize: '48px', fontWeight: 'bold', color: '#03091B', textTransform: 'capitalize' }}>{user?.name || 'Mario Rossi'}</h2>
              </div>
              <p style={{ margin: '0 auto', fontSize: '18px', color: '#475569', lineHeight: '1.5', maxWidth: '800px' }}>
                {h.certBody('Lemons in the room', user?.hospital || h.certFallbackHospital, user?.department || h.certFallbackDept)}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ margin: '0 auto 8px auto', fontSize: '20px', fontWeight: 'bold', color: '#03091B', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', maxWidth: '180px' }}>{certificateDate}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>{h.certDate}</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#03091B', textAlign: 'center', lineHeight: '1.2', marginBottom: '8px', letterSpacing: '1px' }}>LEMONS<br/>CERTIFIED</span>
                <img src="/images/logos/Logo nero png.png" alt="Lemons Certified" style={{ width: '40px', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ margin: '0 auto 8px auto', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', maxWidth: '220px', display: 'flex', justifyContent: 'center' }}>
                  <img src="/images/firma-ceo.png" alt="Firma CEO Lemons" style={{ height: '50px', objectFit: 'contain' }} />
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>{h.certSig}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CertificateDownload;

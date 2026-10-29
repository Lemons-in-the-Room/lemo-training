import { useState } from 'react';
import { useLang } from './LanguageContext';
import { Ico } from './imm/kit';

// Pulsante + modello del certificato (PDF generato nel browser).
// date = giorno in cui è stata superata la verifica finale.
const CertificateDownload = ({ user, date, className = 'btn btn-accent big', label }) => {
  const { t } = useLang();
  const h = t.home;
  const [loading, setLoading] = useState(false);
  const [now] = useState(() => Date.now());

  const certificateCode = `LMR-${new Date(date || now).getFullYear()}-${String(user?.name || '').length * 137 % 9000 + 1000}`;
  const certificateDate = new Date(date || now).toLocaleDateString('it-IT');

  const download = async () => {
    setLoading(true);
    const element = document.getElementById('certificate-template-shared');
    element.style.display = 'block';
    const { default: html2pdf } = await import('html2pdf.js');
    html2pdf().set({
      margin: 0,
      filename: `Certificato_Lemons_${user?.lastName || 'Utente'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    }).from(element).save().then(() => {
      element.style.display = 'none';
      setLoading(false);
    });
  };

  return (
    <>
      <button type="button" className={className} onClick={download} disabled={loading} aria-busy={loading}>
        <Ico n="award" /> {loading ? '…' : (label || h.getCert)}
      </button>

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

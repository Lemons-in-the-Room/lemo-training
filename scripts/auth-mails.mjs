// Genera i modelli delle mail di Supabase Auth (conferma registrazione, recupero password, cambio email)
// in un unico file per tipo, con le tre lingue scelte da user_metadata.lang (italiano se manca).
// Uscita: supabase/templates/<tipo>.html + supabase/templates/subjects.txt + anteprima .design/tmp/auth_mails_preview.html
// Uso: node scripts/auth-mails.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const T = {
  confirmation: {
    it: { subject: 'Conferma la tua email · Lemons in the room', title: 'Conferma la tua email', hi: 'Ciao', body: 'grazie per la registrazione a Lemons in the room. Conferma il tuo indirizzo email per iniziare il percorso formativo.', button: 'Conferma email', note: 'Se non hai richiesto tu la registrazione, puoi ignorare questa mail.' },
    en: { subject: 'Confirm your email · Lemons in the room', title: 'Confirm your email', hi: 'Hi', body: 'thanks for signing up to Lemons in the room. Confirm your email address to start your training path.', button: 'Confirm email', note: "If you didn't sign up, you can ignore this email." },
    es: { subject: 'Confirma tu email · Lemons in the room', title: 'Confirma tu email', hi: 'Hola', body: 'gracias por registrarte en Lemons in the room. Confirma tu dirección de email para empezar el recorrido formativo.', button: 'Confirmar email', note: 'Si no te has registrado tú, puedes ignorar este correo.' },
  },
  recovery: {
    it: { subject: 'Reimposta la password · Lemons in the room', title: 'Reimposta la password', hi: 'Ciao', body: 'abbiamo ricevuto una richiesta per reimpostare la password del tuo account. Tocca il pulsante e scegline una nuova.', button: 'Scegli la nuova password', note: "Il link vale una sola volta e per un tempo limitato. Se non l'hai chiesto tu, ignora questa mail: la tua password resta la stessa." },
    en: { subject: 'Reset your password · Lemons in the room', title: 'Reset your password', hi: 'Hi', body: 'we received a request to reset the password for your account. Tap the button to choose a new one.', button: 'Choose a new password', note: "The link works only once and for a limited time. If you didn't request it, ignore this email: your password stays the same." },
    es: { subject: 'Restablece tu contraseña · Lemons in the room', title: 'Restablece tu contraseña', hi: 'Hola', body: 'hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón y elige una nueva.', button: 'Elegir nueva contraseña', note: 'El enlace solo funciona una vez y durante un tiempo limitado. Si no lo has pedido tú, ignora este correo: tu contraseña no cambia.' },
  },
  email_change: {
    it: { subject: 'Conferma il nuovo indirizzo email · Lemons in the room', title: 'Conferma il nuovo indirizzo email', hi: 'Ciao', body: 'hai chiesto di cambiare l\'email del tuo account da <b>{{ .Email }}</b> a <b>{{ .NewEmail }}</b>. Conferma per completare il cambio.', button: 'Conferma il nuovo indirizzo', note: "Se non l'hai chiesto tu, ignora questa mail e scrivici dalla pagina Supporto della piattaforma." },
    en: { subject: 'Confirm your new email address · Lemons in the room', title: 'Confirm your new email address', hi: 'Hi', body: 'you asked to change your account email from <b>{{ .Email }}</b> to <b>{{ .NewEmail }}</b>. Confirm to complete the change.', button: 'Confirm new address', note: "If you didn't request this, ignore this email and contact us from the platform's Support page." },
    es: { subject: 'Confirma tu nueva dirección de email · Lemons in the room', title: 'Confirma tu nueva dirección de email', hi: 'Hola', body: 'has pedido cambiar el email de tu cuenta de <b>{{ .Email }}</b> a <b>{{ .NewEmail }}</b>. Confírmalo para completar el cambio.', button: 'Confirmar nueva dirección', note: 'Si no lo has pedido tú, ignora este correo y escríbenos desde la página de Soporte de la plataforma.' },
  },
};
const FOOT = { it: 'Lemons in the room · Training & Support', en: 'Lemons in the room · Training & Support', es: 'Lemons in the room · Training & Support' };
const LOGO = '{{ .SiteURL }}/images/logos/logo%20esteso%20bianco%20png.png';

// corpo di una lingua (HTML per client di posta: tabelle e stili in linea)
const body = (L, lang) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F1FA;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:20px;overflow:hidden">
  <tr><td style="background:#03091B;padding:24px 28px"><img src="${LOGO}" alt="Lemons in the room" width="150" style="display:block;border:0"></td></tr>
  <tr><td style="padding:28px">
    <h1 style="margin:0 0 14px;font:700 22px/1.3 Arial,Helvetica,sans-serif;color:#151233">${L.title}</h1>
    <p style="margin:0 0 22px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#3B3753">${L.hi}{{ with .Data.first_name }} {{ . }}{{ end }}, ${L.body}</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 22px;border-radius:12px;background:#FF8731;font:700 15px Arial,Helvetica,sans-serif;color:#FFFFFF;text-decoration:none">${L.button}</a>
    <p style="margin:24px 0 0;font:400 13px/1.55 Arial,Helvetica,sans-serif;color:#8A86A0">${L.note}</p>
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid #EEEAF7;font:600 12px/1.4 Arial,Helvetica,sans-serif;color:#8A86A0"><a href="{{ .SiteURL }}" style="color:#8A86A0;text-decoration:none">${FOOT[lang]}</a></td></tr>
</table></td></tr></table>`;

// Scelta della lingua: printf "%v" rende sicuro il confronto anche se la chiave manca (utenti registrati prima)
const pick = (parts) => `{{ $lang := printf "%v" .Data.lang }}{{ if eq $lang "en" }}${parts.en}{{ else if eq $lang "es" }}${parts.es}{{ else }}${parts.it}{{ end }}`;

const doc = (type) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#F3F1FA">
${pick({ it: body(T[type].it, 'it'), en: body(T[type].en, 'en'), es: body(T[type].es, 'es') })}
</body></html>
`;

mkdirSync('supabase/templates', { recursive: true });
const subjects = [];
for (const type of Object.keys(T)) {
  writeFileSync(`supabase/templates/${type}.html`, doc(type));
  subjects.push(`## ${type}\n${pick({ it: T[type].it.subject, en: T[type].en.subject, es: T[type].es.subject })}\n`);
}
writeFileSync('supabase/templates/subjects.txt', subjects.join('\n'));

// anteprima: le 9 mail già "compilate" (nome di esempio, link finto)
const fill = (html) => html
  .replace(/\{\{ with \.Data\.first_name \}\} \{\{ \. \}\}\{\{ end \}\}/g, ' Giulia')
  .replace(/\{\{ \.ConfirmationURL \}\}/g, '#')
  .replace(/\{\{ \.SiteURL \}\}/g, 'https://lemons-training.vercel.app')
  .replace(/\{\{ \.Email \}\}/g, 'giulia@ospedale.it').replace(/\{\{ \.NewEmail \}\}/g, 'giulia.rossi@ospedale.it');
let prev = '<!doctype html><html><head><meta charset="utf-8"><title>Anteprima mail Supabase</title></head><body style="margin:0;background:#ddd;font-family:Arial">';
for (const type of Object.keys(T)) for (const lang of ['it', 'en', 'es']) {
  prev += `<h3 style="margin:24px 24px 0;font:700 14px Arial">${type} · ${lang.toUpperCase()} — Oggetto: ${T[type][lang].subject}</h3>${fill(body(T[type][lang], lang))}`;
}
writeFileSync('.design/tmp/auth_mails_preview.html', prev + '</body></html>');
console.log('ok');

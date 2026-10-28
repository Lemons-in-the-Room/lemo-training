/* global process */
// POST /api/ticket — ticket di supporto dalla piattaforma.
// - Solo utenti loggati: i dati dell'operatore vengono letti dal suo profilo, non dal browser.
// - Crea la scheda su Notion (Feedback Log) e invia una mail HTML via SMTP Aruba.
// Variabili Vercel: NOTION_TOKEN, SMTP_USER, SMTP_PASS, opzionali SMTP_HOST, SMTP_PORT, TICKET_TO.
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../src/utils/supabase.js';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const FEEDBACK_LOG_DB = '2f3e69fb-b9e6-80b7-a5ee-ea8f3730f7ab';
const AZIENDE_DB = '1d5e69fb-b9e6-8001-ba04-eb705213fb30';

const SMTP_HOST = process.env.SMTP_HOST || 'smtps.aruba.it';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const TICKET_TO = (process.env.TICKET_TO || 'leonardo@lemonsintheroom.com,emma@lemonsintheroom.com')
  .split(',').map(x => x.trim()).filter(Boolean);

const SITE = 'https://lemons-training.vercel.app';
const LOGO = `${SITE}/images/logos/logo%20esteso%20bianco%20png.png`;
const SLA_HOURS = 72;

// ---------- Notion ----------
const notionHeaders = () => ({
  Authorization: `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
});

async function findAziendaId(hospitalName) {
  if (!hospitalName) return null;
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${AZIENDE_DB}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify({ filter: { property: 'Name', title: { contains: hospitalName } }, page_size: 1 }),
    });
    const data = await res.json();
    return data.results?.[0]?.id || null;
  } catch {
    return null;
  }
}

async function createNotionTicket({ subject, ticketType, message, hospital, department }) {
  if (!NOTION_TOKEN) throw new Error('NOTION_TOKEN mancante');
  const aziendaId = await findAziendaId(hospital);
  const properties = {
    'Support Event': { title: [{ text: { content: subject } }] },
    'Descrizione problema': { rich_text: [{ text: { content: message.slice(0, 1900) } }] },
    'Feedback': { select: { name: ticketType === 'Tecnico' ? 'Operations' : 'Support' } },
    'Category': { select: { name: 'Support' } },
    'Request type': { select: { name: 'inbound' } },
    'Data richiesta': { date: { start: new Date().toISOString().split('T')[0] } },
  };
  if (department) properties['Reparto'] = { select: { name: department } };
  if (aziendaId) properties['Aziende'] = { relation: [{ id: aziendaId }] };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({ parent: { database_id: FEEDBACK_LOG_DB }, properties }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Notion error');
  return data.url || null;
}

// ---------- Mail ----------
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d) => d.toLocaleString('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function ticketCode(d) {
  const p = (n) => String(n).padStart(2, '0');
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LT-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${rnd}`;
}

function buildMail(t) {
  const tech = t.ticketType === 'Tecnico';
  const accent = tech ? '#FF8731' : '#8756FA';
  const typeLabel = tech ? 'Tecnico · Guasto hardware o sistema' : 'Operativo · App o formazione';
  const replySubject = encodeURIComponent(`Re: [${t.code}] ${t.subject}`);
  const row = (label, value) => value ? `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #EEEAF7;width:150px;font:600 12px/1.4 Arial,Helvetica,sans-serif;color:#8A86A0;text-transform:uppercase;letter-spacing:.06em;vertical-align:top">${label}</td>
        <td style="padding:10px 0;border-bottom:1px solid #EEEAF7;font:600 14px/1.5 Arial,Helvetica,sans-serif;color:#151233">${value}</td>
      </tr>` : '';
  const button = (href, label, bg, color = '#FFFFFF', border = bg) => `
      <td style="padding:0 8px 8px 0">
        <a href="${href}" style="display:inline-block;padding:13px 22px;border-radius:12px;background:${bg};border:1px solid ${border};font:700 14px Arial,Helvetica,sans-serif;color:${color};text-decoration:none">${label}</a>
      </td>`;

  const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(t.subject)}</title></head>
<body style="margin:0;padding:0;background:#F3F1FA">
<div style="display:none;max-height:0;overflow:hidden">${esc(t.hospital || '')} · ${esc(t.message.slice(0, 120))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F1FA;padding:28px 12px">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(21,18,51,.10)">
    <tr><td style="background:#040F2A;background-image:linear-gradient(135deg,#040F2A 0%,#1B1347 60%,#3A1E6E 100%);padding:28px 32px 26px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><img src="${LOGO}" alt="Lemons in the Room" height="26" style="display:block;height:26px;width:auto;border:0"></td>
        <td align="right" style="font:700 11px Arial,Helvetica,sans-serif;color:#B9B3E6;letter-spacing:.14em;text-transform:uppercase">Support Center</td>
      </tr></table>
      <div style="height:22px"></div>
      <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${accent};font:800 11px Arial,Helvetica,sans-serif;color:#FFFFFF;letter-spacing:.08em;text-transform:uppercase">Nuovo ticket · ${typeLabel}</span>
      <h1 style="margin:14px 0 6px;font:800 24px/1.25 Georgia,'Times New Roman',serif;color:#FFFFFF">${esc(t.subject)}</h1>
      <div style="font:600 13px Arial,Helvetica,sans-serif;color:#B9B3E6">${esc(t.code)} · ${esc(t.when)}</div>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:#8756FA;background-image:linear-gradient(90deg,#8756FA,#B385FF,#FF9E54,#FF8731)">&nbsp;</td></tr>

    <tr><td style="padding:22px 32px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF4EB;border:1px solid #FFD9BC;border-radius:14px">
        <tr><td style="padding:14px 16px;font:600 13px/1.5 Arial,Helvetica,sans-serif;color:#7A3D0E">
          ⏱ Da risolvere entro <b>${SLA_HOURS} ore</b>: scadenza <b>${esc(t.deadline)}</b>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 32px 6px">
      <div style="font:700 11px Arial,Helvetica,sans-serif;color:#8A86A0;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">Messaggio dell'operatore</div>
      <div style="border-left:4px solid ${accent};background:#F8F7FD;border-radius:0 14px 14px 0;padding:16px 18px;font:400 15px/1.65 Arial,Helvetica,sans-serif;color:#151233;white-space:pre-wrap">${esc(t.message)}</div>
    </td></tr>

    <tr><td style="padding:22px 32px 8px">
      <div style="font:700 11px Arial,Helvetica,sans-serif;color:#8A86A0;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px">Chi l'ha aperto</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Operatore', esc(t.name))}
        ${row('Email', t.email ? `<a href="mailto:${esc(t.email)}" style="color:#6A3FE0;text-decoration:none">${esc(t.email)}</a>` : '')}
        ${row('Telefono', t.phone ? `<a href="tel:${esc(t.phone.replace(/\s/g, ''))}" style="color:#6A3FE0;text-decoration:none">${esc(t.phone)}</a>` : '')}
        ${row('Ospedale', esc(t.hospital))}
        ${row('Reparto', esc(t.department))}
        ${row('Percorso', esc(t.patientType))}
        ${row('Lingua', esc((t.lang || '').toUpperCase()))}
      </table>
    </td></tr>

    <tr><td style="padding:18px 32px 26px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        ${t.email ? button(`mailto:${esc(t.email)}?subject=${replySubject}`, `Rispondi a ${esc(t.firstName || 'operatore')}`, '#FF8731') : ''}
        ${t.notionUrl ? button(esc(t.notionUrl), 'Apri su Notion', '#FFFFFF', '#151233', '#DAD6EA') : ''}
        ${t.phone ? button(`tel:${esc(t.phone.replace(/\s/g, ''))}`, 'Chiama', '#FFFFFF', '#151233', '#DAD6EA') : ''}
      </tr></table>
      ${t.notionUrl ? '' : '<div style="font:600 12px Arial,Helvetica,sans-serif;color:#B4472B;margin-top:6px">⚠ La scheda Notion non è stata creata: registrala a mano.</div>'}
    </td></tr>

    <tr><td style="background:#F8F7FD;padding:18px 32px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#8A86A0">
      Inviato automaticamente dalla piattaforma di formazione <a href="${SITE}" style="color:#6A3FE0;text-decoration:none">Lemons in the Room</a>.
      Rispondendo a questa mail scrivi direttamente all'operatore.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `NUOVO TICKET ${t.ticketType.toUpperCase()} — ${t.code}`,
    `Oggetto: ${t.subject}`,
    `Aperto: ${t.when} · Scadenza ${SLA_HOURS}h: ${t.deadline}`,
    '',
    t.message,
    '',
    `Operatore: ${t.name}`,
    t.email && `Email: ${t.email}`,
    t.phone && `Telefono: ${t.phone}`,
    `Ospedale: ${t.hospital || '—'} · Reparto: ${t.department || '—'} · Percorso: ${t.patientType || '—'}`,
    t.notionUrl ? `Notion: ${t.notionUrl}` : 'ATTENZIONE: scheda Notion non creata.',
  ].filter(Boolean).join('\n');

  return {
    subject: `[Ticket ${t.ticketType}] ${t.subject}${t.hospital ? ` · ${t.hospital}` : ''}`,
    html,
    text,
  };
}

async function sendMail(t) {
  if (!SMTP_USER || !SMTP_PASS) throw new Error('SMTP non configurato');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  const m = buildMail(t);
  await transporter.sendMail({
    from: { name: 'Lemons · Supporto Piattaforma', address: SMTP_USER },
    to: TICKET_TO,
    replyTo: t.email ? { name: t.name, address: t.email } : undefined,
    subject: m.subject,
    html: m.html,
    text: m.text,
    headers: { 'X-Lemons-Ticket': t.code },
  });
}

// ---------- Handler ----------
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Login richiesto' });

  const db = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await db.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Sessione non valida' });

  const body = req.body || {};
  const subject = String(body.subject || '').trim().slice(0, 150);
  const message = String(body.message || '').trim().slice(0, 5000);
  const ticketType = body.ticketType === 'Tecnico' ? 'Tecnico' : 'Operativo';
  if (!subject || !message) return res.status(400).json({ error: 'Missing required fields' });

  const { data: p } = await db.from('users').select('name, first_name, last_name, email, phone, hospital, department, patient_type').eq('id', userData.user.id).maybeSingle();
  const now = new Date();
  const t = {
    code: ticketCode(now),
    when: fmtDate(now),
    deadline: fmtDate(new Date(now.getTime() + SLA_HOURS * 3600e3)),
    subject, message, ticketType,
    lang: String(body.lang || '').slice(0, 5),
    name: p?.name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || userData.user.email,
    firstName: p?.first_name || '',
    email: p?.email || userData.user.email,
    phone: p?.phone || '',
    hospital: p?.hospital || '',
    department: p?.department || '',
    patientType: p?.patient_type === 'pediatria' ? 'Pediatria' : p?.patient_type === 'adulti' ? 'Adulti' : (p?.patient_type || ''),
  };

  let notionOk = false;
  try {
    t.notionUrl = await createNotionTicket(t);
    notionOk = true;
  } catch (e) {
    console.error('notion', e.message);
  }

  let mailOk = false;
  try {
    await sendMail(t);
    mailOk = true;
  } catch (e) {
    console.error('mail', e.message);
  }

  if (!mailOk && !notionOk) return res.status(500).json({ error: 'All delivery methods failed' });
  return res.status(200).json({ ok: true, code: t.code, mail: mailOk, notion: notionOk });
}

export { buildMail };

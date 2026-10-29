// Percorsi formativi: quali moduli vede ogni profilo, video, verifica finale.
// Testi (titoli, punti chiave, domande) in translations.js -> modules.lessons[tl].

export const R2 = 'https://pub-a5b0afd78ca4495dbcc59862b6e90b23.r2.dev';

// id = id storico salvato in users.completed_modules; tl = indice in translations.modules.lessons
const PATHS = {
  adulti: [
    { id: 1,  tl: 0, video: `${R2}/Introduzione.mp4` },
    { id: 2,  tl: 1, video: `${R2}/Accensione%20%26%20Stand-by.mp4` },
    { id: 3,  tl: 2, video: `${R2}/Posizionamento%20e%20ricarica.mp4` },
    { id: 4,  tl: 3, video: `${R2}/Sanificazione.mp4` },
    { id: 5,  tl: 4, video: `${R2}/Menu%20%26%20Click.mp4` },
    { id: 9,  tl: 8, video: `${R2}/Simulazione.mp4` },
  ],
  pediatria: [
    { id: 10, tl: 9,  video: `${R2}/Introduzione%20Lemo%20jr.mp4` },
    { id: 11, tl: 10, video: `${R2}/Accensione%20%26%20Stand-by%20-%20JR.mp4` },
    { id: 12, tl: 2,  video: `${R2}/Posizionare%20%2B%20Spie%20-%20Ok.mp4` },
    { id: 4,  tl: 3,  video: `${R2}/Sanificazione.mp4` },
    { id: 6,  tl: 5,  video: `${R2}/Posizionamento%20sul%20paziente.mp4` },
    { id: 13, tl: 11, video: `${R2}/Navigare%20tra%20le%20applicazioni%20Lemons.mp4` },
    { id: 7,  tl: 6,  video: `${R2}/Rabbits.mp4` },
    { id: 8,  tl: 7,  video: `${R2}/Telly.mp4` },
    { id: 5,  tl: 4,  video: `${R2}/Menu%20%26%20Click.mp4`, descKey: 'menuClickDescPediatria' },
  ],
};

// Verifica finale: domande scelte per modulo (indice della domanda nel modulo).
// Adulti 12 (le più operative), pediatria 18 (2 per modulo). Soglia: massimo 3 errori.
const FINAL_PICK = {
  adulti:    { 1: [3], 2: [1, 2], 3: [1, 2], 4: [0, 1, 2], 5: [2], 9: [2, 3, 5] },
  pediatria: { 10: [2, 0], 11: [1, 2], 12: [1, 2], 4: [0, 2], 6: [1, 2], 13: [0, 2], 7: [0, 2], 8: [0, 2], 5: [0, 2] },
};
export const MAX_ERRORS = 3;

// Video sull'uso del tablet, per id modulo. Vuoto finché non vengono girati:
// il blocco "Con il tablet" compare solo dove c'è un video.
export const TABLET_VIDEOS = {};
// 3 domande sul tablet (stesso formato delle altre: question, answers[], correct, lesson: id modulo).
// Vuote finché non ci sono i video; quando ci sono, chi usa il tablet ha 15 / 21 domande.
export const TABLET_QUESTIONS = { it: [], en: [], es: [] };

export const profileOf = (patientType) => (patientType === 'pediatria' ? 'pediatria' : 'adulti');

export function getLessons(t, patientType) {
  const m = t.modules;
  return PATHS[profileOf(patientType)].map((p) => {
    const d = m.lessons[p.tl];
    return {
      id: p.id, video: p.video, tablet: TABLET_VIDEOS[p.id] || null,
      title: d.title, min: Number(d.duration) || 1,
      desc: (p.descKey && (t.home[p.descKey] || m[p.descKey])) || d.description,
      slides: d.slides || [], questions: d.questions || [],
    };
  });
}

export function getFinalQuestions(lessons, patientType, lang, usesTablet) {
  const pick = FINAL_PICK[profileOf(patientType)];
  const out = [];
  lessons.forEach((l, idx) => (pick[l.id] || []).forEach((q) => {
    const Q = l.questions[q];
    if (Q) out.push({ ...Q, stop: idx });
  }));
  if (usesTablet) {
    (TABLET_QUESTIONS[lang] || TABLET_QUESTIONS.it).forEach((Q) => {
      const idx = lessons.findIndex((l) => l.id === Q.lesson);
      out.push({ ...Q, stop: Math.max(0, idx) });
    });
  }
  return out;
}

export const passMark = (n) => Math.max(1, n - MAX_ERRORS);

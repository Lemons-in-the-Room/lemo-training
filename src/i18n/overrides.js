// Testi modificati dalla dashboard (tabella content_strings): si sovrappongono ai testi nel codice.
// Nel database ci sono SOLO le frasi cambiate, quindi lo scaricamento è minimo.
// Chiavi: 'lang.<percorso>' per i file lang-xx.js, 'ui.<percorso>' per ui.js.
import { supabase } from '../utils/supabase';

const LS = 'lemo_text_overrides';

export const readCachedOverrides = () => {
  try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; }
};

export async function fetchOverrides() {
  const { data, error } = await supabase.from('content_strings').select('key,it,en,es');
  if (error || !data) return null;
  try { localStorage.setItem(LS, JSON.stringify(data)); } catch { /* spazio pieno: pazienza */ }
  return data;
}

export const getPath = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);

// imposta il valore solo se nel testo di base al posto indicato c'è già una stringa (niente strutture inventate)
const setPath = (obj, path, val) => {
  const parent = getPath(obj, path.slice(0, -1));
  const last = path[path.length - 1];
  if (parent && typeof parent[last] === 'string') parent[last] = val;
};

const deepClone = (o) => (Array.isArray(o) ? o.map(deepClone) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deepClone(v)])) : o); // copia anche oggetti con funzioni (structuredClone non può)

export function applyOverrides(t, u, rows, lang) {
  const mine = (rows || []).filter((r) => r[lang] != null && r[lang] !== '');
  if (!mine.length) return { t, u };
  const T = deepClone(t), U = deepClone(u);
  for (const r of mine) {
    const [root, ...p] = r.key.split('.');
    if (root === 'lang') setPath(T, p, r[lang]);
    else if (root === 'ui') setPath(U, p, r[lang]);
  }
  return { t: T, u: U };
}

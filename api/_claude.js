/* global process */
// Chiamata a Claude (API Anthropic) con risposta strutturata: il modello compila uno "strumento" con lo schema dato,
// così il risultato è sempre un oggetto valido (niente JSON da ripulire).
// La parte fissa del prompt (es. la conoscenza del chatbot) viene messa in cache: le domande successive costano meno.
const API = 'https://api.anthropic.com/v1/messages';

export const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;

export async function claudeTool({ model, system, cached, messages, schema, name = 'risposta', description = 'Restituisci il risultato.', maxTokens = 1000 }) {
  const sys = [];
  // prima la parte fissa (in cache), poi le istruzioni che possono cambiare da utente a utente
  if (cached) sys.push({ type: 'text', text: cached, cache_control: { type: 'ephemeral' } });
  if (system) sys.push({ type: 'text', text: system });
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model, max_tokens: maxTokens, system: sys, messages,
      tools: [{ name, description, input_schema: schema }],
      tool_choice: { type: 'tool', name },
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Claude HTTP ${r.status}`);
  const block = (j.content || []).find((c) => c.type === 'tool_use');
  if (!block) throw new Error('Risposta di Claude senza contenuto');
  return block.input;
}

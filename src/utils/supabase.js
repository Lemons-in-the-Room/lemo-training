import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://nzlctxteymrysmvqbquc.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56bGN0eHRleW1yeXNtdnFicXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NzQ5NzMsImV4cCI6MjEwNDQ1MDk3M30.hzz8b5oC7jrPZQvb9lsMWNJEpd8mAE1SSexaIouB29M'

// Link di recupero password (o link scaduto): va letto PRIMA che il client consumi l'indirizzo,
// così l'app sa di dover mostrare "Scegli la nuova password" invece di entrare dritta nella Home.
// Questo file è importato anche dalle API sul server: lì window non esiste.
if (typeof window !== 'undefined') {
  const h = new URLSearchParams(window.location.hash.slice(1));
  if (h.get('type') === 'recovery') sessionStorage.setItem('lemo_recovery', '1');
  if (h.get('error_code')) sessionStorage.setItem('lemo_auth_error', h.get('error_code'));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// indirizzo a cui tornano i link delle mail (conferma registrazione, recupero password): segue il dominio in uso
export const authRedirect = (path = '/') => (typeof window !== 'undefined' ? window.location.origin + path : undefined);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nzlctxteymrysmvqbquc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56bGN0eHRleW1yeXNtdnFicXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NzQ5NzMsImV4cCI6MjEwNDQ1MDk3M30.hzz8b5oC7jrPZQvb9lsMWNJEpd8mAE1SSexaIouB29M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

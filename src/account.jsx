// Stato dell'operatore collegato: profilo Supabase, avanzamento, verifica finale, risposte del primo accesso.
// Il database è la fonte; localStorage 'lemo_user' resta solo come copia per chi la legge ancora.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './utils/supabase';
import { useLang } from './LanguageContext';
import { getLessons, getFinalQuestions, passMark } from './course';

const AccountContext = createContext(null);

const toLocalUser = (p) => ({
  name: p.name, firstName: p.first_name, lastName: p.last_name, email: p.email, phone: p.phone,
  hospital: p.hospital, department: p.department, patientType: p.patient_type, mode: p.mode,
});

export function AccountProvider({ children }) {
  const { t, lang } = useLang();
  const [status, setStatus] = useState('loading'); // loading | ready | anon
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id;
    if (!uid) return { anon: true };
    const { data } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
    return { profile: data || { id: uid, email: sess.session.user.email, completed_modules: [] } };
  }, []);

  useEffect(() => {
    let alive = true;
    load().then((r) => {
      if (!alive) return;
      if (r.anon) { setStatus('anon'); return; }
      setProfile(r.profile);
      localStorage.setItem('lemo_user', JSON.stringify(toLocalUser(r.profile)));
      setStatus('ready');
    });
    return () => { alive = false; };
  }, [load]);

  const save = useCallback(async (patch) => {
    setProfile((p) => ({ ...p, ...patch }));
    const id = profile?.id;
    if (!id) return { error: 'no-user' };
    const { error } = await supabase.from('users').update(patch).eq('id', id);
    return { error };
  }, [profile?.id]);

  const lessons = useMemo(() => getLessons(t, profile?.patient_type), [t, profile?.patient_type]);
  const doneIds = useMemo(() => new Set(profile?.completed_modules || []), [profile?.completed_modules]);
  const doneCount = lessons.filter((l) => doneIds.has(l.id)).length;
  const total = lessons.length;
  const nextIndex = lessons.findIndex((l) => !doneIds.has(l.id)); // -1 = tutte fatte
  const allDone = nextIndex === -1;
  const passed = !!profile?.final_quiz_passed_at;
  const usesTablet = !!profile?.uses_tablet;
  const finalQuestions = useMemo(
    () => getFinalQuestions(lessons, profile?.patient_type, lang, usesTablet),
    [lessons, profile?.patient_type, lang, usesTablet],
  );

  // stato di una tappa: done | now | locked
  const stopState = (i) => (doneIds.has(lessons[i]?.id) ? 'done' : i === nextIndex ? 'now' : 'locked');
  // tappa "corrente" per i pulsanti Riprendi: tappa, verifica (= total) o traguardo (= total + 1)
  const currentStop = allDone ? (passed ? total + 1 : total) : nextIndex;

  const completeLesson = (id) => {
    if (doneIds.has(id)) return Promise.resolve({});
    return save({ completed_modules: [...doneIds, id] });
  };
  const answerOnboarding = ({ prior, tablet }) => {
    const patch = { onboarding_answered_at: new Date().toISOString(), uses_tablet: !!tablet };
    if (prior !== undefined) {
      patch.prior_onboarding = !!prior;
      if (prior) patch.completed_modules = [...new Set([...doneIds, ...lessons.map((l) => l.id)])];
    }
    return save(patch);
  };
  const setTablet = (v) => save({ uses_tablet: !!v });
  const saveQuizResult = (score, ok) => {
    const patch = { final_quiz_best_score: Math.max(score, profile?.final_quiz_best_score || 0) };
    if (ok && !passed) patch.final_quiz_passed_at = new Date().toISOString();
    return save(patch);
  };

  const value = {
    status, profile, lessons, total, doneIds, doneCount, nextIndex, allDone, passed, usesTablet,
    finalQuestions, passMark: passMark(finalQuestions.length), stopState, currentStop,
    needsOnboarding: status === 'ready' && !profile?.onboarding_answered_at,
    completeLesson, answerOnboarding, setTablet, saveQuizResult,
  };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAccount = () => useContext(AccountContext);

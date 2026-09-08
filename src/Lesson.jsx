import { useState, useRef, useEffect } from 'react';
import { CheckCircle, FileText, AlertTriangle, ChevronRight, X, ArrowLeft, Zap, Maximize, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { audio } from './utils/audio';
import { useLang } from './LanguageContext';
import { supabase } from './utils/supabase';

const Lesson = ({ lesson, mode, onComplete, autoplay = false }) => {
  const { t } = useLang();
  const l = t.lesson;
  const [hasWatched, setHasWatched] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [maxTime, setMaxTime] = useState(0);
  const maxTimeRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const questions = lesson.questions || (lesson.question ? [{ question: lesson.question, answers: lesson.answers, correct: lesson.correct }] : []);
  const currentQuestion = questions[currentQuestionIndex];

  const playerRef = useRef(null);
  const videoContainerRef = useRef(null);

  const nextSlide = () => {
    if (lesson && currentSlideIndex < lesson.slides.length - 1) { setCurrentSlideIndex(prev => prev + 1); } else audio.playError();
  };
  const prevSlide = () => {
    if (currentSlideIndex > 0) { setCurrentSlideIndex(prev => prev - 1); } else audio.playError();
  };

  useEffect(() => {
    const fetchedUser = JSON.parse(localStorage.getItem('lemo_user'));
    if (fetchedUser) {
      const p = JSON.parse(localStorage.getItem(`lemo_progress_${fetchedUser.name}`)) || [];
      if (p.includes(parseInt(lesson.id))) {
        setHasWatched(true);
        setQuizPassed(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  useEffect(() => {
    if (!autoplay || !playerRef.current) return;
    const timer = setTimeout(() => {
      const video = playerRef.current;
      if (!video) return;
      video.play().catch(() => {});
      setTimeout(() => enterFullscreen(), 300);
    }, 300);
    return () => clearTimeout(timer);
  }, [autoplay]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterFullscreen = () => {
    const el = videoContainerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.currentTime;
    const duration = playerRef.current.duration;
    if (duration > 0) setProgress(currentTime / duration);
    if (hasWatched) return;
    if (currentTime > maxTimeRef.current + 2) {
      playerRef.current.currentTime = maxTimeRef.current;
      audio.playError();
      return;
    }
    if (currentTime > maxTimeRef.current) {
      maxTimeRef.current = currentTime;
      setMaxTime(currentTime);
    }
    if (duration > 0 && currentTime > duration * 0.95 && !showQuiz) {
      setShowQuiz(true);
    }
  };

  const handleEnded = () => {
    if (!hasWatched && mode === 'guided') setShowQuiz(true);
  };

  const handleAnswer = async (index) => {
    if (!currentQuestion) return;
    if (index === currentQuestion.correct) {
      audio.playSuccess();
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setQuizPassed(true);
        setHasWatched(true);
        setShowQuiz(false);
          const currentUser = JSON.parse(localStorage.getItem('lemo_user'));
          if (currentUser) {
            const progressKey = `lemo_progress_${currentUser.name}`;
            const savedProgress = JSON.parse(localStorage.getItem(progressKey)) || [];
            if (!savedProgress.includes(lesson.id)) {
              const newProgress = [...savedProgress, lesson.id];
              localStorage.setItem(progressKey, JSON.stringify(newProgress));
              
              if (currentUser.email) {
                const { data: existing } = await supabase
                  .from('users').select('completed_modules').eq('email', currentUser.email).maybeSingle();
                if (existing) {
                  const updated = [...new Set([...(existing.completed_modules || []), lesson.id])];
                  await supabase.from('users').update({ completed_modules: updated }).eq('email', currentUser.email);
                }
              }
              if (onComplete) onComplete(lesson.id);
            }
          }
      }
    } else {
      audio.playError();
      setWrongAnswer(true);
      setTimeout(() => setWrongAnswer(false), 1800);
    }
  };

  const markAsCompleted = () => {
    if (!quizPassed && mode === 'guided') return;
    audio.playClick();
    const currentUser = JSON.parse(localStorage.getItem('lemo_user'));
    if (currentUser) {
      const progressKey = `lemo_progress_${currentUser.name}`;
      const savedProgress = JSON.parse(localStorage.getItem(progressKey)) || [];
      if (!savedProgress.includes(lesson.id)) {
        localStorage.setItem(progressKey, JSON.stringify([...savedProgress, lesson.id]));
        if (onComplete) onComplete(lesson.id);
      }
    }
  };

  if (!lesson) return null;

  const canCertify = quizPassed || mode === 'full';

  return (
    <div className="w-full overflow-hidden rounded-b-[2rem] 2xl:rounded-b-[3rem] bg-[#02061A]/50">

      <div className="flex flex-col lg:flex-row">

        {/* ── VIDEO ── */}
        <div className="lg:w-[58%] xl:w-[60%] relative flex flex-col">
          <div ref={videoContainerRef} className="relative w-full bg-black overflow-hidden shrink-0">

            {/* Pill badges + fullscreen — hidden when native controls are visible */}
            {(!hasWatched && mode === 'guided') && (
              <>
                <div className="absolute top-3 left-3 z-20 flex gap-2 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-[0.14em] uppercase text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8731]" /> {lesson.type}
                  </span>
                </div>
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="absolute top-3 right-12 z-20 bg-black/60 backdrop-blur-xl border border-white/10 text-white text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-2 pointer-events-none shadow-lg">
                  <AlertTriangle className="w-3 h-3 text-[#FF8731]" />
                  <span className="tracking-wide uppercase">{l.mandatoryView}</span>
                </motion.div>
                <button
                  onClick={(e) => { e.stopPropagation(); enterFullscreen(); }}
                  className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <video
              ref={playerRef}
              src={lesson.videoUrl}
              controls={hasWatched || mode === 'full'}
              controlsList="nodownload noremoteplayback"
              onContextMenu={(e) => e.preventDefault()}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onRateChange={() => { if (!hasWatched && mode === 'guided' && playerRef.current) playerRef.current.playbackRate = 1; }}
              onClick={() => { if (!hasWatched && mode === 'guided') { playerRef.current?.paused ? playerRef.current.play() : playerRef.current?.pause(); } }}
              className="w-full h-auto block cursor-pointer"
            />

            {/* Progress bar */}
            {!hasWatched && mode === 'guided' && (
              <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress * 100}%`,
                    background: 'linear-gradient(90deg, #8756FA, #FF8731)',
                    boxShadow: '0 0 8px rgba(255,135,49,0.5)',
                  }}
                />
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lg:w-[42%] xl:w-[40%] border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col">

          {/* Section header */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 2xl:px-8 2xl:pt-8">
            <div className="h-px w-6 bg-white/[0.20]" />
            <span className="text-[9px] font-black tracking-[0.24em] uppercase text-slate-500">{l.additionalResources}</span>
          </div>

          <div className="flex-1 flex flex-col divide-y divide-white/[0.06]">

            {/* ── SLIDES row ── */}
            <button
              onClick={() => { audio.playClick(); setIsSlideModalOpen(true); }}
              className="group flex items-center gap-4 px-6 py-4 2xl:px-8 2xl:py-5 hover:bg-white/[0.03] transition-colors text-left"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,135,49,0.20), rgba(255,135,49,0.06))',
                  border: '1px solid rgba(255,135,49,0.25)',
                }}
              >
                <FileText className="w-4 h-4 text-[#FF9E54]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black tracking-[0.20em] uppercase text-slate-500 mb-0.5">{l.slideLabel}</div>
                <div className="font-serif font-black text-white text-[16px] lg:text-[17px] leading-tight">{l.teachingMaterial}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{l.slidesCount(lesson.slides.length)}</div>
              </div>
              <motion.div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                whileHover={{ x: 2 }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" strokeWidth={2.4} />
              </motion.div>
            </button>

            {/* ── VERIFICA row ── */}
            <AnimatePresence mode="wait">
              {quizPassed ? (
                <motion.div
                  key="passed"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-4 px-6 py-4 2xl:px-8 2xl:py-5"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.06))',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black tracking-[0.20em] uppercase text-slate-500 mb-0.5">{l.verifyLabel}</div>
                    <div className="font-serif font-black text-emerald-300 text-[16px] lg:text-[17px] leading-tight">{l.quizPassed}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{l.quizPassedHint}</div>
                  </div>
                </motion.div>
              ) : showQuiz ? (
                <motion.div
                  key={`quiz-${currentQuestionIndex}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-5 2xl:px-8 2xl:py-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#8756FA]" />
                      <span className="text-[9px] font-black tracking-[0.20em] uppercase text-slate-500">{l.interactiveCheck}</span>
                    </div>
                    {questions.length > 1 && (
                      <span className="text-[9px] font-bold text-slate-500">{l.questionOf(currentQuestionIndex + 1, questions.length)}</span>
                    )}
                  </div>
                  <p className="font-serif font-black text-white text-[15px] lg:text-[16px] leading-snug">{currentQuestion?.question}</p>
                  <div className="flex flex-col gap-2">
                    {currentQuestion?.answers.map((ans, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-[#8756FA]/20 border border-white/[0.08] hover:border-[#8756FA]/40 text-slate-300 hover:text-white font-medium text-[13px] transition-all duration-200"
                      >
                        {ans}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {wrongAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[12px] font-bold"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {l.wrongAnswer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-4 px-6 py-4 2xl:px-8 2xl:py-5 opacity-40"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Zap className="w-4 h-4 text-slate-500" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black tracking-[0.20em] uppercase text-slate-500 mb-0.5">{l.verifyLabel}</div>
                    <div className="font-serif font-black text-slate-400 text-[16px] lg:text-[17px] leading-tight">{l.waitingCompletion}</div>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">{l.unlockHint}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Nota tecnica ── */}
            {!quizPassed && mode === 'guided' && (
              <div className="px-6 py-4 2xl:px-8 2xl:py-5">
                <p className="text-[11.5px] text-slate-500 leading-relaxed">
                  <span className="font-black text-slate-400">{l.technicalNote} </span>
                  {l.technicalNoteText}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ── SLIDE MODAL ── */}
      {createPortal(
        <AnimatePresence>
          {isSlideModalOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-8 bg-[#03091B]/95 backdrop-blur-xl"
            >
              <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

              <motion.div
                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="relative bg-[#040F2A]/90 backdrop-blur-3xl w-full max-w-5xl rounded-[2.5rem] md:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col border border-white/[0.10]"
                style={{ height: '100%', maxHeight: '85dvh' }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 md:p-7 border-b border-white/[0.08] shrink-0">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10"
                      style={{ background: 'linear-gradient(135deg, rgba(255,135,49,0.20), rgba(255,135,49,0.06))' }}>
                      <img src="/images/logos/logo bianco panna png.png" alt="" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-black text-white text-lg md:text-xl leading-tight truncate">{l.teachingMaterial}</h3>
                      <p className="text-[10px] font-bold text-[#FF8731] tracking-widest uppercase mt-0.5">{l.slide} {currentSlideIndex + 1} {l.slideOf} {lesson.slides.length}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { audio.playClick(); setIsSlideModalOpen(false); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.08] transition-all shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Slide Content */}
                <div className="flex-1 overflow-y-auto flex flex-col justify-center p-8 md:p-16 relative">
                  <motion.div animate={{ opacity: [0.08, 0.14, 0.08] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-b from-[#8756FA]/10 to-transparent pointer-events-none" />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlideIndex}
                      initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                      transition={{ duration: 0.35, ease: "circOut" }}
                      className="w-full max-w-3xl mx-auto text-center relative z-10"
                    >
                      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black font-serif text-white mb-6 md:mb-10 leading-[1.05] drop-shadow-xl">
                        {lesson.slides[currentSlideIndex].title}
                      </h2>
                      <p className="text-lg md:text-2xl text-slate-300 leading-relaxed font-medium">
                        {lesson.slides[currentSlideIndex].content}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Modal Footer */}
                <div className="p-5 md:p-7 border-t border-white/[0.08] flex justify-between items-center bg-black/30 shrink-0">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlideIndex === 0}
                    className={`px-4 py-2.5 md:px-5 md:py-3 rounded-full font-black text-sm flex items-center gap-2 transition-all border ${currentSlideIndex === 0 ? 'opacity-30 cursor-not-allowed text-slate-500 border-white/[0.05] bg-transparent' : 'bg-white/[0.06] text-white hover:bg-white/[0.12] border-white/[0.10]'}`}
                  >
                    <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{l.prev}</span>
                  </button>

                  <div className="flex gap-2 bg-white/[0.04] p-2 rounded-full border border-white/[0.08]">
                    {lesson.slides.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => { setCurrentSlideIndex(i); }}
                        className={`h-2 rounded-full transition-all duration-400 cursor-pointer ${i === currentSlideIndex ? 'w-6 md:w-8' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                        style={i === currentSlideIndex ? {
                          background: 'linear-gradient(90deg, #FF8731, #FF9E54)',
                          boxShadow: '0 0 8px rgba(255,135,49,0.7)',
                        } : {}}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextSlide}
                    disabled={currentSlideIndex === lesson.slides.length - 1}
                    className={`px-4 py-2.5 md:px-5 md:py-3 rounded-full font-black text-sm flex items-center gap-2 transition-all border border-transparent ${currentSlideIndex === lesson.slides.length - 1 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-white'}`}
                    style={currentSlideIndex < lesson.slides.length - 1 ? {
                      background: 'linear-gradient(135deg, #8756FA, #6A35E8)',
                      boxShadow: '0 12px 28px -8px rgba(135,86,250,0.55)',
                    } : {}}
                  >
                    <span className="hidden sm:inline">{l.next}</span> <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};

export default Lesson;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import Layout from './Layout';
import { LanguageProvider } from './LanguageContext';

const Access     = lazy(() => import('./pages/Access'));
const HomePage   = lazy(() => import('./pages/HomePage'));
const Journey    = lazy(() => import('./pages/Journey'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const FinalQuiz  = lazy(() => import('./pages/FinalQuiz'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const Admin      = lazy(() => import('./Admin'));

function App() {
  useEffect(() => { if (window.__hideSplash) window.__hideSplash(); }, []);
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Access />} />
            <Route path="/admin" element={<Admin />} />
            <Route element={<Layout />}>
              <Route path="/benvenuto" element={<Onboarding />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/formazione" element={<Journey />} />
              <Route path="/formazione/:n" element={<LessonPage />} />
              <Route path="/verifica" element={<FinalQuiz />} />
              <Route path="/supporto" element={<SupportPage />} />
            </Route>
            {/* indirizzi della versione precedente */}
            <Route path="/modules" element={<Navigate to="/formazione" replace />} />
            <Route path="/support" element={<Navigate to="/supporto" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

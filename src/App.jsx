import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
const NotFound   = lazy(() => import('./pages/NotFound'));

// Titolo nella scheda del browser: Formazione -> Training, Supporto -> Support, il resto -> Training & Support
const BRAND = 'Lemons in the room';
function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const training = pathname.startsWith('/formazione') || pathname.startsWith('/verifica');
    const support = pathname.startsWith('/supporto');
    // nelle lezioni il titolo lo imposta LessonPage (nome della tappa)
    if (!/^\/formazione\/\d+/.test(pathname)) document.title = `${BRAND} · ${training ? 'Training' : support ? 'Support' : 'Training & Support'}`;
    // colore della barra del telefono (Android) intonato allo sfondo in cima alla pagina
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', training ? '#07051A' : support ? '#1A1030' : '#03091B');
  }, [pathname]);
  return null;
}

function App() {
  useEffect(() => { if (window.__hideSplash) window.__hideSplash(); }, []);
  return (
    <LanguageProvider>
      <BrowserRouter>
        <PageTitle />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

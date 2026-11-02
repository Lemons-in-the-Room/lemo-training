import { Link } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { Ico, IMG, World } from '../imm/kit';

// Indirizzo inesistente: pagina nello stile della piattaforma invece del rimando silenzioso alla Home.
export default function NotFound() {
  const { u } = useLang();
  const N = u.notFound;
  return (
    <div className="imm nf">
      <World scenes={[{ src: IMG.heroBlur, dim: 0.45 }]} />
      <header className="top"><span className="brand"><img src={IMG.logo} alt="Lemons in the Room" width="150" height="30" /></span></header>
      <section className="scene hero nf-in">
        <div className="hero-in">
          <p className="nf-code">404</p>
          <h1>{N.title}</h1>
          <p className="lead">{N.text}</p>
          <Link className="btn btn-accent big btn-live" to="/home"><Ico n="arrow" /> {N.back}</Link>
        </div>
      </section>
    </div>
  );
}

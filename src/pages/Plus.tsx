import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Crown, Heart, Infinity, LockKeyhole, MessageCircle, Sparkles, Ticket, Users, Zap } from 'lucide-react';
import { useStore } from '../lib/store';

const free = ['Scopri le serate senza limiti', 'Iscriviti e accedi alle chat', 'Crea fino a 2 serate al mese', 'Indirizzi privati dopo conferma'];
const premium = ['Tutto incluso nel piano Free', 'Crea serate senza limiti', 'Gestione richieste e chat evento', 'Supporti lo sviluppo della community'];
export function Plus() {
  const { pro, isLive, startCheckout } = useStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const activate = async () => { setError(''); setBusy(true); try { await startCheckout(); } catch(err) { setError(err instanceof Error ? err.message : 'Checkout non disponibile'); } finally { setBusy(false); } };
  return <div className="plus-page"><Link to="/profile" className="sub-back"><ArrowLeft size={18}/> Torna al profilo</Link><div className="plus-hero"><span className="plus-orb plus-orb-one"/><span className="plus-orb plus-orb-two"/><div className="plus-hero-content"><span className="plus-stamp"><Crown size={15}/> RITMO SOCIAL · PLUS</span><h1>Più serate.<br/><em>Più connessioni.</em></h1><p>Chi crea occasioni per ballare merita una pista senza limiti. Il resto della community continua a entrare gratis.</p><div className="plus-benefit-pills"><span><Infinity size={15}/> Eventi illimitati</span><span><Heart size={15}/> Community first</span></div></div><div className="plus-star">✳</div></div>
    <div className="pricing-grid"><div className="price-card"><span className="price-kind">PER TUTTI</span><h2>Ritmo Free</h2><p>Per chi vuole esserci, scoprire e fare nuove amicizie.</p><div className="price-number">0 € <small>/ sempre</small></div><div className="pricing-divider"/>{free.map(t => <div className="price-feature" key={t}><Check size={17}/>{t}</div>)}<Link to="/explore" className="btn btn-outline btn-wide">Continua gratis <ArrowUpRight size={17}/></Link></div>
      <div className="price-card premium-card"><span className="premium-label"><Sparkles size={14}/> PER CHI ORGANIZZA</span><h2>Organizzatore Plus</h2><p>Per chi trasforma un'idea in una serata da ricordare.</p><div className="price-number">3,90 € <small>/ mese</small></div><div className="pricing-divider"/>{premium.map(t => <div className="price-feature" key={t}><Check size={17}/>{t}</div>)}<button disabled={busy || pro} className="btn btn-primary btn-wide" onClick={() => void activate()}>{pro ? 'Plus è già attivo ✓' : busy ? 'Apertura checkout...' : 'Scegli Ritmo Plus'} <ArrowUpRight size={17}/></button>{!isLive && <p className="checkout-note"><LockKeyhole size={13}/> Pagamenti disattivati nella demo. Nessun addebito.</p>}</div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="plus-promises"><div><Users size={23}/><h3>Il ballo rimane accessibile.</h3><p>La ricerca, le iscrizioni e le chat restano gratuite per tutti.</p></div><div><Ticket size={23}/><h3>Niente commissioni sui biglietti.</h3><p>L'eventuale ingresso si paga al locale, non tramite Ritmo.</p></div><div><MessageCircle size={23}/><h3>Una community vera.</h3><p>In futuro potranno esserci eventi sponsorizzati, sempre chiaramente etichettati.</p></div></div>
    <div className="plus-cta"><Zap size={23}/><span>Inizia gratis, passa a Plus quando serve.</span><Link to="/create">Crea una serata <ArrowUpRight size={17}/></Link></div>
  </div>;
}

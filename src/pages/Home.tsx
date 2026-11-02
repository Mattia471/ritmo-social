import { ArrowRight, ArrowUpRight, Compass, MapPin, Plus, Radio, Search, Sparkles, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EventCard, SectionHeading, distanceFrom } from '../components/Shared';
import { useGeo } from '../components/Layout';
import { useStore } from '../lib/store';
import { isUpcoming } from '../lib/geo';
import { useState } from 'react';

export function Home() {
  const { profile, events, isLive } = useStore();
  const { location, radius } = useGeo();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const nearby = events.filter(e => isUpcoming(e.startsAt) && distanceFrom(e, location) <= radius).sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const featured = [...nearby].sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0,4);
  return <div className="home-page">
    <div className="greeting"><div><p>HEY, {profile.name.split(' ')[0].toUpperCase()} <span className="wave">✳</span></p><h1>Pronto a <em>ballare?</em></h1></div><Link to="/my-events" className="people-count"><span className="people-orbit"><Users size={19}/></span><span><strong>{nearby.length}</strong><small>eventi vicino a te</small></span></Link></div>
    <section className="hero-section">
      <div className="hero-visual" aria-hidden="true"/>
      <div className="hero-content"><div className="hero-brow"><span className="pulse-dot"/> LA COMMUNITY DEL BALLO CARAIBICO</div><h2>La prossima<br/><span>serata?</span><br/>È qui.</h2><p>Scopri persone, musica e nuove connessioni. La pista ti sta aspettando.</p><Link className="btn btn-primary hero-action" to="/explore">Trova la tua serata <ArrowUpRight size={19}/></Link></div><span className="hero-sideword">DANCE · MEET · REPEAT</span>
    </section>
    <form className="quick-search" onSubmit={e => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(query)}`); }}><Search size={21}/><input aria-label="Cerca eventi, generi o zone" placeholder="Cerca una serata, un genere, una zona..." value={query} onChange={e => setQuery(e.target.value)}/><button type="submit" aria-label="Cerca"><ArrowRight size={19}/></button></form>
    <div className="location-line"><span><MapPin size={16}/> Nei dintorni di <strong>{location.name}</strong> <span className="location-radius">· {radius} km</span></span><Link to="/explore">Modifica <ArrowUpRight size={14}/></Link></div>
    <section className="home-section"><SectionHeading eyebrow="✦ DA NON PERDERE" title="Serate in evidenza" action="Vedi tutte" href="/explore"/>
      {featured.length ? <div className="featured-scroller">{featured.map(e => <div className="featured-slide" key={e.id}><EventCard event={e} distance={distanceFrom(e,location)} horizontal/></div>)}</div> : <div className="inline-empty">Nessuna serata in questo raggio. <Link to="/explore">Prova ad allargare la ricerca.</Link></div>}
    </section>
    <section className="home-section"><SectionHeading eyebrow="LA PISTA NON DORME" title="Le prossime serate" action="Esplora" href="/explore"/>
      {nearby.length ? <div className="events-grid">{nearby.slice(0, 4).map(e => <EventCard event={e} distance={distanceFrom(e,location)} key={e.id}/>)}</div> : <div className="inline-empty">Non trovi una serata? <Link to="/create">Creala tu.</Link></div>}
    </section>
    <section className="feature-strip"><div className="feature-art"><span>✳</span><Radio size={35}/></div><div><p className="eyebrow">IL BELLO DI RITMO</p><h2>Non serve arrivare in coppia.</h2><p>Trova serate, conosci la community e parti con il piede giusto. Il resto lo fa la musica.</p></div><Link to="/chats" className="round-arrow" aria-label="Vai alla community"><ArrowUpRight size={23}/></Link></section>
    <section className="home-action-grid"><Link to="/explore" className="action-tile"><Compass size={23}/><span><strong>Esplora la mappa</strong><small>Scopri cosa succede vicino a te</small></span><ArrowUpRight size={20}/></Link><Link to="/create" className="action-tile"><Plus size={23}/><span><strong>Organizza qualcosa</strong><small>Fai incontrare nuovi ballerini</small></span><ArrowUpRight size={20}/></Link></section>
    {!isLive && <p className="demo-hint"><Sparkles size={15}/> Stai esplorando dati dimostrativi. Puoi creare serate, inviare richieste e messaggi senza registrarti.</p>}
  </div>;
}

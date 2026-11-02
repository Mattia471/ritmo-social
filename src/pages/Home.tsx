import { ArrowRight, ArrowUpRight, Bell, CalendarDays, Compass, MapPin, Plus, Radio, Search, Sparkles, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EventCard, SectionHeading, distanceFrom } from '../components/Shared';
import { useGeo } from '../components/Layout';
import { useStore } from '../lib/store';
import { useNotifications } from '../lib/notifications';
import { isUpcoming } from '../lib/geo';
import { useState } from 'react';
import { clock, tinyDate } from '../lib/geo';
import { SponsorSlot } from '../components/SponsorSlot';

export function Home() {
  const { profile, events, isLive } = useStore();
  const { pushEnabledOnDevice, preferences } = useNotifications();
  const [dismissedPushHint, setDismissedPushHint] = useState(() => { try { return localStorage.getItem('ritmo-push-hint-hidden') === '1'; } catch { return false; } });
  const { location, radius } = useGeo();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const nearby = events.filter(e => e.status !== 'canceled' && isUpcoming(e.startsAt) && distanceFrom(e, location) <= radius).sort((a,b) => {
    const aMatch = a.dances.some(d => profile.dances?.includes(d));
    const bMatch = b.dances.some(d => profile.dances?.includes(d));
    return Number(bMatch) - Number(aMatch) || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });
  const featured = [...nearby].sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0,4);
  const spotlight = featured[0];
  return <div className="home-page">
    <div className="greeting"><div><p>LA TUA COMMUNITY, IL TUO RITMO <span className="wave">✳</span></p><h1>Ciao <em>{profile.name.split(' ')[0]}!</em></h1></div><Link to="/my-events" className="people-count" aria-label={`${nearby.length} eventi entro ${radius} chilometri`}><span className="people-orbit"><Users size={19}/></span><span><strong>{nearby.length}</strong><small>serate vicine</small></span></Link></div>
    <div className="home-welcome"><span className="home-welcome-icon">✦</span> Stasera il ritmo lo scegli tu. <span>Scopri dove si balla.</span></div>
    {isLive && !dismissedPushHint && !(pushEnabledOnDevice && preferences.push_enabled) && <section className="home-push-hint" aria-label="Invito alle notifiche">
      <span className="home-push-hint-icon"><Bell size={19}/></span>
      <div><strong>Vuoi sapere quando arriva una serata vicino a te?</strong><p>Attiva gli avvisi su Ritmo Social. Su iPhone trovi anche i passaggi per installare l'app.</p></div>
      <Link to="/notifications" className="home-push-hint-action">Attiva <ArrowUpRight size={16}/></Link>
      <button type="button" aria-label="Non mostrare più questo avviso" className="home-push-hint-dismiss" onClick={() => { setDismissedPushHint(true); try { localStorage.setItem('ritmo-push-hint-hidden', '1'); } catch { /* Dismiss for this view only */ } }}><X size={16}/></button>
    </section>}
    <form className="quick-search" onSubmit={e => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(query)}`); }}><Search size={21}/><input aria-label="Cerca eventi, generi o zone" placeholder="Cerca eventi, locali, stili di danza..." value={query} onChange={e => setQuery(e.target.value)}/><button type="submit" aria-label="Cerca"><ArrowRight size={19}/></button></form>
    <div className="location-line"><span><MapPin size={16}/> Serate vicino a <strong>{location.name}</strong> <span className="location-radius">· {radius} km</span></span><Link to="/explore">Mappa <ArrowUpRight size={14}/></Link></div>
    <section className="hero-section" aria-label={spotlight ? `Evento in evidenza: ${spotlight.title}` : 'Scopri Ritmo Social'}>
      <div className="hero-visual" aria-hidden="true" style={spotlight ? { backgroundImage: `linear-gradient(90deg,rgba(5,17,22,.96) 0%,rgba(6,24,30,.77) 40%,rgba(5,17,22,.13) 100%),linear-gradient(0deg,rgba(2,16,21,.66),transparent 58%),url("${spotlight.cover}")` } : undefined}/>
      <div className="hero-content"><div className="hero-brow"><span className="pulse-dot"/> {spotlight ? '✦ SERATA IN EVIDENZA' : 'DANCE · MEET · REPEAT'}</div>
        <h2>{spotlight ? spotlight.title : <>La prossima<br/><span>serata?</span><br/>È qui.</>}</h2>
        <p>{spotlight ? spotlight.dances.join('  ·  ') : 'Scopri persone, musica e nuove connessioni. La pista ti sta aspettando.'}</p>
        {spotlight && <div className="hero-event-meta"><span><CalendarDays size={16}/>{tinyDate(spotlight.startsAt)} · {clock(spotlight.startsAt)}</span><span><MapPin size={16}/>{spotlight.area}, {spotlight.city}</span></div>}
        <Link className="btn btn-primary hero-action" to={spotlight ? `/event/${spotlight.id}` : '/explore'}>{spotlight ? "Scopri l'evento" : 'Esplora le serate'} <ArrowUpRight size={19}/></Link>
      </div><span className="hero-sideword">CARIBBEAN VIBES · RITMO SOCIAL</span>
    </section>
    <div className="home-dance-shortcuts" aria-label="Esplora per stile di ballo"><span>{profile.dances?.length ? 'Per te · ' + profile.dances.join(' + ') : 'Il tuo stile'}</span>{['Salsa','Bachata','Kizomba','Merengue'].map(dance => <Link key={dance} to={`/explore?dance=${encodeURIComponent(dance)}`}>{dance}<ArrowUpRight size={13}/></Link>)}</div>
    <section className="home-section"><SectionHeading eyebrow="✦ DA NON PERDERE" title="Serate in evidenza" action="Vedi tutte" href="/explore"/>
      {featured.length ? <div className="featured-scroller">{featured.map(e => <div className="featured-slide" key={e.id}><EventCard event={e} distance={distanceFrom(e,location)} horizontal/></div>)}</div> : <div className="inline-empty">Nessuna serata in questo raggio. <Link to="/explore">Prova ad allargare la ricerca.</Link></div>}
    </section>
    <section className="home-section"><SectionHeading eyebrow="LA PISTA NON DORME" title="Le prossime serate" action="Esplora" href="/explore"/>
      {nearby.length ? <div className="events-grid">{nearby.slice(0, 4).map(e => <EventCard event={e} distance={distanceFrom(e,location)} key={e.id}/>)}</div> : <div className="inline-empty">Non trovi una serata? <Link to="/create">Creala tu.</Link></div>}
    </section>
    <SponsorSlot placement="home"/>
    <section className="feature-strip"><div className="feature-art"><span>✳</span><Radio size={35}/></div><div><p className="eyebrow">IL BELLO DI RITMO</p><h2>Non serve arrivare in coppia.</h2><p>Trova serate, conosci la community e parti con il piede giusto. Il resto lo fa la musica.</p></div><Link to="/chats" className="round-arrow" aria-label="Vai alla community"><ArrowUpRight size={23}/></Link></section>
    <section className="home-action-grid"><Link to="/explore" className="action-tile"><Compass size={23}/><span><strong>Esplora la mappa</strong><small>Scopri cosa succede vicino a te</small></span><ArrowUpRight size={20}/></Link><Link to="/create" className="action-tile"><Plus size={23}/><span><strong>Organizza qualcosa</strong><small>Fai incontrare nuovi ballerini</small></span><ArrowUpRight size={20}/></Link></section>
    {!isLive && <p className="demo-hint"><Sparkles size={15}/> Stai esplorando dati dimostrativi. Puoi creare serate, inviare richieste e messaggi senza registrarti.</p>}
  </div>;
}

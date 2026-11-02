import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarCheck, Check, Clock3, MapPin, Plus, X, Users } from 'lucide-react';
import { EventCard, Avatar, EmptyState, Pill } from '../components/Shared';
import { useStore } from '../lib/store';
import { clock, prettyDate } from '../lib/geo';

export function MyEvents() {
  const { events, attendances, userId, resolve } = useStore();
  const [tab, setTab] = useState<'joined' | 'organized' | 'requests'>('joined');
  const [busy, setBusy] = useState<string | null>(null);
  const joined = events.filter(e => attendances.some(a => a.eventId === e.id && a.userId === userId));
  const organized = events.filter(e => e.hostId === userId);
  const requests = attendances.filter(a => a.status === 'pending' && organized.some(e => e.id === a.eventId && e.status !== 'canceled'));
  const act = async (id: string, status: 'approved' | 'rejected') => { setBusy(id); try { await resolve(id,status); } catch { /* handled */ } finally { setBusy(null); } };
  return <div className="my-events-page"><div className="page-intro"><p className="eyebrow">LA TUA VITA IN PISTA</p><h1>I miei <em>eventi.</em></h1><p>Le tue serate, le iscrizioni e le persone che vogliono unirsi.</p></div><div className="overview-stats"><div><span className="stat-icon stat-purple"><CalendarCheck size={19}/></span><strong>{joined.length}</strong><small>Iscrizioni</small></div><div><span className="stat-icon stat-lime"><Users size={19}/></span><strong>{organized.length}</strong><small>Organizzati</small></div><div><span className="stat-icon stat-orange"><Clock3 size={19}/></span><strong>{requests.length}</strong><small>Da approvare</small></div></div>
    <div className="my-tabs"><button className={tab === 'joined' ? 'active' : ''} onClick={() => setTab('joined')}>Le mie iscrizioni <span>{joined.length}</span></button><button className={tab === 'organized' ? 'active' : ''} onClick={() => setTab('organized')}>Organizzati <span>{organized.length}</span></button><button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>Richieste <span>{requests.length}</span></button></div>
    {tab === 'joined' && (joined.length ? <div className="events-grid">{joined.map(e => <EventCard event={e} key={e.id}/>)}</div> : <EmptyState title="La prima serata ti aspetta" description="Esplora gli eventi e richiedi di partecipare. Troverai qui tutte le tue iscrizioni." action="Trova serate" href="/explore"/>)}
    {tab === 'organized' && <><Link to="/create" className="create-banner"><div><span className="eyebrow">DIETRO OGNI SERATA C'È UNA PERSONA</span><h3>La prossima la organizzi tu?</h3><p>Invita la community a ballare.</p></div><span className="create-banner-icon"><Plus size={24}/></span></Link>{organized.length ? <div className="events-grid">{organized.map(e => <EventCard event={e} key={e.id}/>)}</div> : <EmptyState title="Non hai ancora creato eventi" description="Hai un'idea? Dalle una data e un luogo." action="Crea la prima serata" href="/create"/>}</>}
    {tab === 'requests' && (requests.length ? <div className="requests-list">{requests.map(a => {
      const event = events.find(e => e.id === a.eventId)!;
      return <div className="request-card" key={a.id}><Avatar name={a.userName} size="lg"/><div className="request-main"><strong>{a.userName}</strong><span>Vuole partecipare a <b>{event.title}</b></span><small><Clock3 size={12}/> {prettyDate(event.startsAt)}, {clock(event.startsAt)}</small></div><div className="request-actions"><button aria-label={`Accetta ${a.userName}`} className="accept-button" disabled={busy === a.id} onClick={() => void act(a.id,'approved')}><Check size={19}/><span>Accetta</span></button><button aria-label={`Rifiuta ${a.userName}`} className="decline-button" disabled={busy === a.id} onClick={() => void act(a.id,'rejected')}><X size={19}/></button></div></div>;
    })}</div> : <EmptyState title="Tutto in ordine!" description="Non ci sono richieste in attesa di approvazione. Le nuove richieste compariranno qui."/>)}
    {tab === 'organized' && organized.length > 0 && <div className="manage-tip"><MapPin size={16}/> Gli indirizzi degli eventi che organizzi sono protetti. <Link to={`/event/${organized[0].id}`}>Visualizza un evento <ArrowRight size={14}/></Link></div>}
    <div className="my-bottom-note"><Pill tone="lime">TIP</Pill> Confermando un partecipante, gli sblocchi automaticamente il luogo esatto e la chat della serata. <ArrowUpRight size={15}/></div>
  </div>;
}

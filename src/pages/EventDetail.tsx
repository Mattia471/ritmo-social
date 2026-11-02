import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleHelp, Clock3, ExternalLink, HeartHandshake, LockKeyhole, MapPin, MessageCircle, ShieldCheck, Ticket, UserRoundCheck, Users, X } from 'lucide-react';
import { useStore } from '../lib/store';
import { clock, distanceKm, prettyDate } from '../lib/geo';
import { useGeo } from '../components/Layout';
import { Avatar, EmptyState, Pill } from '../components/Shared';

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, attendances, venues, userId, isLive, join, cancelJoin, simulateApproval } = useStore();
  const { location } = useGeo();
  const [busy, setBusy] = useState(false);
  const event = events.find(e => e.id === id);
  if (!event) return <EmptyState title="Serata non trovata" description="L'evento non esiste oppure non è più disponibile." action="Esplora serate" href="/explore"/>;
  const own = event.hostId === userId;
  const attendance = attendances.find(a => a.eventId === event.id && a.userId === userId);
  const approved = own || attendance?.status === 'approved';
  const venue = approved ? venues.find(v => v.eventId === event.id) : undefined;
  const soldOut = event.approvedCount >= event.maxPeople;
  const distance = distanceKm({ lat: event.publicLat, lng: event.publicLng }, location);
  const action = async () => { setBusy(true); try { if (attendance) await cancelJoin(event.id); else await join(event.id); } catch { /* shown in global error */ } finally { setBusy(false); } };
  return <div className="detail-page">
    <button className="sub-back detail-back" onClick={() => navigate(-1)}><ArrowLeft size={18}/> Torna indietro</button>
    <div className="detail-cover" style={{ backgroundImage: `linear-gradient(0deg, rgba(11,10,15,.91), rgba(11,10,15,.03) 75%), url("${event.cover}")` }}><div className="detail-cover-label">{event.dances.map(d => <Pill key={d} tone="lime">{d}</Pill>)}</div><div className="detail-cover-footer"><span className="big-event-date"><strong>{new Date(event.startsAt).getDate()}</strong><small>{new Intl.DateTimeFormat('it-IT',{ month: 'short' }).format(new Date(event.startsAt))}</small></span><span className="detail-cover-label2">MEET. DANCE. REPEAT.</span></div></div>
    <div className="detail-grid"><div className="detail-primary">
      <div className="detail-title-row"><div><p className="eyebrow">RITMO SOCIAL EVENT</p><h1>{event.title}</h1></div><span className="price-bubble">{event.price === 0 ? 'GRATIS' : `€ ${event.price}`}</span></div>
      <div className="detail-facts"><div><span className="fact-icon"><CalendarDays size={19}/></span><span><small>Quando</small><strong>{prettyDate(event.startsAt)}</strong><em>Dalle {clock(event.startsAt)} alle {clock(event.endsAt)}</em></span></div><div><span className="fact-icon"><MapPin size={19}/></span><span><small>Dove</small><strong>{event.area}, {event.city}</strong><em>Circa {distance.toFixed(1)} km dal punto di ricerca</em></span></div><div><span className="fact-icon"><Users size={19}/></span><span><small>La community</small><strong>{event.approvedCount} partecipanti confermati</strong><em>Fino a {event.maxPeople} posti disponibili</em></span></div></div>
      <section className="detail-section"><h2>Di cosa si tratta <span>✳</span></h2><p className="detail-description">{event.description}</p></section>
      <section className="detail-section"><h2>La location <span>✳</span></h2>{approved && venue ? <div className="unlocked-venue"><div className="unlocked-head"><span><ShieldCheck size={20}/> ACCESSO SBLOCCATO</span><Pill tone="lime">Confermato</Pill></div><h3>{venue.address}</h3>{venue.directions && <p>{venue.directions}</p>}<a className="btn btn-primary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`} rel="noreferrer" target="_blank"><MapPin size={17}/> Apri il navigatore <ExternalLink size={16}/></a></div> : <div className="secret-location"><div className="secret-map"><span className="blurred-road road-one"/><span className="blurred-road road-two"/><span className="blurred-road road-three"/><span className="secret-target"><MapPin size={24}/></span></div><div className="secret-copy"><span className="lock-pill"><LockKeyhole size={13}/> POSIZIONE RISERVATA</span><h3>Il posto esatto? Solo dopo il sì.</h3><p>Per proteggere chi partecipa, l'indirizzo viene mostrato soltanto quando l'organizzatore conferma la tua richiesta.</p><span className="approx-address"><MapPin size={15}/> Zona {event.area}, {event.city}</span></div></div>}</section>
      <section className="detail-section"><h2>Chi organizza <span>✳</span></h2><div className="host-row"><Avatar name={event.hostName} size="lg"/><div><strong>{event.hostName}</strong><span>Organizzatore della serata</span></div><HeartHandshake size={20}/></div></section>
      <div className="safety-tip"><ShieldCheck size={20}/><p><strong>Community prima di tutto.</strong> Incontra persone in luoghi sicuri. Non condividere dati personali nella chat globale e rispetta sempre gli altri ballerini.</p></div>
    </div><aside className="detail-sidebar"><div id="event-booking" className="booking-panel"><div className="booking-top"><span>LA TUA PROSSIMA SERATA</span><Ticket size={23}/></div><h3>{event.price ? `€ ${event.price}` : 'Ingresso gratuito'}</h3><p>{event.price ? 'Il prezzo indicato si paga direttamente sul posto.' : 'Unisciti alla community e vieni a ballare.'}</p><div className="booking-divider"/>
      {own ? <><div className="booking-state confirmed"><UserRoundCheck size={20}/> Sei l'organizzatore</div><Link to="/my-events" className="btn btn-primary btn-wide">Gestisci richieste <ChevronRight size={18}/></Link></> : attendance?.status === 'approved' ? <><div className="booking-state confirmed"><Check size={19}/> Partecipazione confermata</div><Link to={`/chats/${event.id}`} className="btn btn-primary btn-wide"><MessageCircle size={18}/> Vai alla chat evento</Link><button className="btn btn-outline btn-wide" onClick={action} disabled={busy}>Annulla partecipazione</button></> : attendance?.status === 'pending' ? <><div className="booking-state pending"><Clock3 size={19}/> Richiesta inviata, in attesa</div><p className="booking-explain">L'organizzatore deve confermare la tua presenza prima di sbloccare indirizzo e chat.</p>{!isLive && <button className="btn btn-primary btn-wide" onClick={() => simulateApproval(event.id)}><Check size={18}/> Simula conferma (demo)</button>}<button className="btn btn-outline btn-wide" onClick={action} disabled={busy}>Ritira la richiesta</button></> : attendance?.status === 'rejected' ? <><div className="booking-state rejected"><X size={19}/> Richiesta non accettata</div><button className="btn btn-outline btn-wide" onClick={action} disabled={busy}>Elimina richiesta</button></> : soldOut ? <><div className="booking-state rejected"><Users size={19}/> Posti esauriti</div><p className="booking-explain">L'organizzatore ha raggiunto la capienza prevista.</p></> : <><button className="btn btn-primary btn-wide" onClick={action} disabled={busy}>{busy ? 'Invio...' : 'Richiedi di partecipare'} <ArrowUpRight size={19}/></button><p className="booking-explain"><LockKeyhole size={14}/> Nessun indirizzo condiviso prima dell'approvazione</p></>}
      <div className="booking-bottom"><CircleHelp size={16}/> Partecipazione gratuita tramite Ritmo. Il costo eventuale dell'ingresso è gestito dal locale.</div></div></aside></div>
    <div className="detail-mobile-action" aria-label="Azioni evento">
      <div className="detail-mobile-action-copy"><strong>{event.price ? `${event.price} €` : 'Gratis'}</strong><span>{approved ? 'Partecipazione confermata' : attendance?.status === 'pending' ? 'In attesa di conferma' : `${event.area} · ${clock(event.startsAt)}`}</span></div>
      {own ? <Link className="btn btn-primary" to="/my-events">Gestisci <ArrowUpRight size={17}/></Link>
        : approved ? <Link className="btn btn-primary" to={`/chats/${event.id}`}><MessageCircle size={17}/> Apri chat</Link>
        : attendance?.status === 'pending' ? <a className="btn btn-outline" href="#event-booking">Vedi richiesta <ArrowUpRight size={17}/></a>
        : attendance?.status === 'rejected' ? <a className="btn btn-outline" href="#event-booking">Richiesta rifiutata</a>
        : soldOut ? <button className="btn btn-outline" type="button" disabled>Posti esauriti</button>
        : <button className="btn btn-primary" disabled={busy} onClick={action}>{busy ? 'Invio...' : 'Partecipa'} <ArrowUpRight size={17}/></button>}
    </div>
  </div>;
}

import type { ReactNode } from 'react';
import { ArrowUpRight, CalendarDays, Heart, LockKeyhole, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SpotEvent } from '../types';
import { clock, distanceKm, tinyDate } from '../lib/geo';
import { useStore } from '../lib/store';

export const Brand = ({ compact = false }: { compact?: boolean }) => <Link to="/" className="brand" aria-label="Ritmo Social, torna alla home">
  <img className="brand-icon" src="/logo-icon.svg" alt="" width="42" height="42" />
  {!compact && <span className="brand-word">Ritmo <span className="brand-dot">Social</span><small>DANCE · MEET · REPEAT</small></span>}
</Link>;

export const Avatar = ({ name, size = 'md', tint }: { name: string; size?: 'sm' | 'md' | 'lg'; tint?: string }) => (
  <span className={`avatar avatar-${size}`} style={tint ? { background: tint } : undefined}>{name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}</span>
);

export const SectionHeading = ({ eyebrow, title, action, href }: { eyebrow: string; title: string; action?: string; href?: string }) => (
  <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action && href && <Link to={href} className="see-all">{action}<ArrowUpRight size={16}/></Link>}</div>
);

export const Pill = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'lime' | 'orange' | 'purple' }) => <span className={`pill pill-${tone}`}>{children}</span>;

export function EventCard({ event, distance, horizontal = false }: { event: SpotEvent; distance?: number; horizontal?: boolean }) {
  const { attendances, userId } = useStore();
  const attendance = attendances.find(a => a.eventId === event.id && a.userId === userId);
  const own = event.hostId === userId;
  return <Link to={`/event/${event.id}`} className={`event-card ${horizontal ? 'event-card-featured' : ''}`}>
    <div className="event-photo" style={{ backgroundImage: `linear-gradient(180deg, rgba(7,7,11,.04), rgba(7,7,11,.58)), url("${event.cover}")` }}>
      <div className="photo-top"><span className="date-square"><strong>{new Date(event.startsAt).getDate()}</strong><small>{new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(new Date(event.startsAt)).replace('.', '').toUpperCase()}</small></span>
        {event.featured && <span className="photo-feature">✦ IN EVIDENZA</span>}
      </div>
      <div className="photo-bottom"><span className="photo-tag">{event.dances.join(' · ')}</span><span className="photo-price">{event.price === 0 ? 'FREE' : `€${event.price}`}</span></div>
    </div>
    <div className="event-info"><div className="event-line"><h3>{event.title}</h3><ArrowUpRight className="card-arrow" size={18}/></div>
      <p className="event-subline"><MapPin size={14}/>{event.area}, {event.city}{distance !== undefined && <><span className="tiny-dot"/>~{distance.toFixed(1)} km</>}</p>
      <div className="event-footer"><span><CalendarDays size={14}/>{tinyDate(event.startsAt)} · {clock(event.startsAt)}</span><span><Users size={14}/>{event.approvedCount} iscritti</span></div>
      {(attendance || own) && <span className={`event-status ${own ? 'status-own' : attendance?.status === 'approved' ? 'status-approved' : attendance?.status === 'pending' ? 'status-pending' : 'status-rejected'}`}>
        {own ? 'Organizzi tu' : attendance?.status === 'approved' ? '✓ Confermato' : attendance?.status === 'pending' ? '⌛ In attesa' : 'Richiesta rifiutata'}</span>}
    </div>
  </Link>;
}

export function EmptyState({ icon = 'event', title, description, action, href }: { icon?: 'event' | 'chat' | 'lock'; title: string; description: string; action?: string; href?: string }) {
  return <div className="empty-state"><span className="empty-icon">{icon === 'chat' ? <Heart size={27}/> : icon === 'lock' ? <LockKeyhole size={27}/> : <CalendarDays size={27}/>}</span><h3>{title}</h3><p>{description}</p>{action && href && <Link className="btn btn-primary" to={href}>{action}<ArrowUpRight size={17}/></Link>}</div>;
}

export const distanceFrom = (event: SpotEvent, location: { lat: number; lng: number }) => distanceKm({ lat: event.publicLat, lng: event.publicLng }, location);

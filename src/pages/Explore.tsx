import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocateFixed, Map, MapPin, Search, SlidersHorizontal, List as ListIcon, X } from 'lucide-react';
import { useStore } from '../lib/store';
import { useGeo } from '../components/Layout';
import { EventCard, EmptyState, distanceFrom } from '../components/Shared';
import { ExploreMap } from '../components/ExploreMap';
import { CITY_AREAS, type Dance } from '../types';
import { cityCenter, isUpcoming } from '../lib/geo';

const dances: Array<'Tutte' | Dance> = ['Tutte', 'Bachata', 'Salsa', 'Kizomba', 'Merengue'];
export function Explore() {
  const { events } = useStore();
  const { location, setLocation, radius, setRadius } = useGeo();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [dance, setDance] = useState<'Tutte' | Dance>('Tutte');
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [onlyFree, setOnlyFree] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const filtered = useMemo(() => events.filter(e => {
    const distance = distanceFrom(e, location);
    const search = `${e.title} ${e.area} ${e.city} ${e.dances.join(' ')} ${e.description}`.toLowerCase();
    return isUpcoming(e.startsAt) && distance <= radius && (dance === 'Tutte' || e.dances.includes(dance)) && (!onlyFree || e.price === 0) && search.includes(query.trim().toLowerCase());
  }).sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [events, location, radius, dance, onlyFree, query]);
  const locateMe = () => {
    if (!navigator.geolocation) { setLocateError('Il browser non supporta la geolocalizzazione. Seleziona una città.'); return; }
    setLocating(true); setLocateError('');
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation({ name: 'La tua posizione', lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocating(false); setLocateError('Posizione non disponibile. Seleziona una città dal menu.'); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    );
  };
  return <div className="explore-page"><div className="page-intro"><p className="eyebrow">TUTTE LE VIBES. UN SOLO POSTO.</p><h1>Trova il tuo <em>ritmo.</em></h1><p>Filtra gli eventi e scopri dove si balla, senza perdere la sorpresa.</p></div>
    <div className="explore-toolbar"><div className="explore-search"><Search size={19}/><input placeholder="Serate, zone, stili..." aria-label="Cerca serate" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Pulisci ricerca" onClick={() => setQuery('')}><X size={17}/></button>}</div><button className={`filter-toggle ${showFilters ? 'filter-on' : ''}`} onClick={() => setShowFilters(x => !x)}><SlidersHorizontal size={19}/><span>Filtri</span></button></div>
    <div className="dance-chips" role="group" aria-label="Filtra per stile di ballo">{dances.map(d => <button key={d} className={`dance-chip ${dance === d ? 'dance-chip-active' : ''}`} onClick={() => setDance(d)}>{d === 'Tutte' ? '✦ ' : ''}{d}</button>)}</div>
    <div className={`filters-panel ${showFilters ? 'filters-visible' : ''}`}><div className="filter-field"><label htmlFor="city-select">Città</label><select id="city-select" value={CITY_AREAS[location.name] ? location.name : ''} onChange={e => setLocation(cityCenter(e.target.value))}><option value="" disabled>Posizione attuale</option>{Object.keys(CITY_AREAS).map(c => <option value={c} key={c}>{c}</option>)}</select></div><div className="filter-field"><label htmlFor="radius-select">Distanza massima</label><select id="radius-select" value={radius} onChange={e => setRadius(Number(e.target.value))}>{[5,10,15,25,50,100].map(km => <option value={km} key={km}>{km} km</option>)}</select></div><button className={`free-toggle ${onlyFree ? 'free-active' : ''}`} onClick={() => setOnlyFree(f => !f)}>€ Solo serate gratuite <span>{onlyFree ? '✓' : '+'}</span></button><button className="locate-button" onClick={locateMe} disabled={locating}><LocateFixed size={17}/>{locating ? 'Rilevamento...' : 'Usa la mia posizione'}</button></div>
    {locateError && <p className="form-error" role="status">{locateError}</p>}
    <div className="result-controls"><div><span className="result-count">{filtered.length}</span> <span className="result-text">{filtered.length === 1 ? 'serata trovata' : 'serate trovate'}</span><p><MapPin size={13}/> {location.name} · entro {radius} km circa</p></div><div className="view-switch"><button aria-label="Vista elenco" className={mode === 'list' ? 'current' : ''} onClick={() => setMode('list')}><ListIcon size={17}/>Lista</button><button aria-label="Vista mappa" className={mode === 'map' ? 'current' : ''} onClick={() => setMode('map')}><Map size={17}/>Mappa</button></div></div>
    {mode === 'map' && <ExploreMap events={filtered} location={location} radius={radius}/>}
    {filtered.length ? <div className={mode === 'map' ? 'map-result-list' : 'events-grid'}>{filtered.map(e => <EventCard event={e} distance={distanceFrom(e,location)} key={e.id}/>)}</div> : <EmptyState title="Qui la pista è ancora vuota" description="Prova ad aumentare il raggio o cambia i filtri. Oppure organizza tu una serata!" action="Crea un evento" href="/create"/>}
    <p className="location-disclaimer"><MapPin size={15}/> Il raggio usa la zona approssimativa indicata dall'organizzatore. L'indirizzo preciso è visibile solo agli iscritti approvati.</p>
  </div>;
}

import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Image, Info, LockKeyhole, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { CITY_AREAS, COVER_IMAGES, type Dance, type NewEventInput } from '../types';
import { useStore } from '../lib/store';
import { Pill } from '../components/Shared';

const danceChoices: Dance[] = ['Bachata', 'Salsa', 'Kizomba', 'Merengue'];
const startDefault = () => { const d = new Date(); d.setDate(d.getDate()+5); d.setHours(21,0,0,0); const offset = d.getTimezoneOffset() * 60000; return new Date(d.getTime()-offset).toISOString().slice(0,16); };
const endDefault = () => { const d = new Date(); d.setDate(d.getDate()+6); d.setHours(1,0,0,0); const offset = d.getTimezoneOffset() * 60000; return new Date(d.getTime()-offset).toISOString().slice(0,16); };
export function CreateEvent() {
  const navigate = useNavigate();
  const { createEvent, events, userId, pro } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Roma');
  const [area, setArea] = useState('Trastevere');
  const [address, setAddress] = useState('');
  const [directions, setDirections] = useState('');
  const [startsAt, setStartsAt] = useState(startDefault);
  const [endsAt, setEndsAt] = useState(endDefault);
  const [dances, setDances] = useState<Dance[]>(['Bachata']);
  const [price, setPrice] = useState('0');
  const [maxPeople, setMaxPeople] = useState('30');
  const [cover, setCover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const myEventsThisMonth = events.filter(e => e.hostId === userId && new Date(e.createdAt || e.startsAt).getMonth() === new Date().getMonth() && new Date(e.createdAt || e.startsAt).getFullYear() === new Date().getFullYear()).length;
  const freeLimitReached = !pro && myEventsThisMonth >= 2;
  const toggleDance = (d: Dance) => setDances(current => current.includes(d) ? (current.length === 1 ? current : current.filter(x => x !== d)) : [...current,d]);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (freeLimitReached) { setError('Hai raggiunto il limite del piano Free. Passa a Plus per creare altre serate.'); return; }
    if (new Date(startsAt) < new Date()) { setError('La serata deve iniziare in futuro.'); return; }
    if (new Date(endsAt) <= new Date(startsAt)) { setError('L’orario di fine deve essere successivo a quello di inizio.'); return; }
    if (!address.trim()) { setError('Inserisci un indirizzo preciso e completo.'); return; }
    if (!title.trim()) { setError('Aggiungi un titolo alla serata.'); return; }
    const chosen = CITY_AREAS[city].find(a => a.name === area)!;
    const input: NewEventInput = { title: title.trim(), description: description.trim(), city, area, address: address.trim(), directions: directions.trim(), startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), publicLat: chosen.lat, publicLng: chosen.lng, cover: COVER_IMAGES[cover], dances, price: Number(price), maxPeople: Number(maxPeople) };
    setBusy(true);
    try { const id = await createEvent(input); navigate(`/event/${id}`); } catch(err) { setError(err instanceof Error ? err.message : 'Impossibile creare la serata.'); } finally { setBusy(false); }
  };
  return <div className="create-page"><Link to="/my-events" className="sub-back"><ArrowLeft size={18}/> I miei eventi</Link>
    <div className="page-intro"><p className="eyebrow">YOU BRING THE PEOPLE, WE BRING THE VIBE</p><h1>Accendi la <em>pista.</em></h1><p>Organizzare una serata dovrebbe essere semplice quanto scegliere la prossima canzone.</p></div>
    <div className="create-grid"><form onSubmit={e => void save(e)} className="create-form">
      <section className="form-section"><div className="form-section-title"><span className="form-index">01</span><div><h2>Racconta la serata</h2><p>Dalle un nome e crea l'atmosfera</p></div><Sparkles size={20}/></div>
        <label className="form-label" htmlFor="event-title">Nome della serata *</label><input id="event-title" className="form-input" maxLength={90} required placeholder="Es. Bachata sotto le stelle" value={title} onChange={e => setTitle(e.target.value)}/>
        <label className="form-label" htmlFor="event-desc">Descrizione</label><textarea id="event-desc" className="form-input form-textarea" maxLength={2000} rows={4} placeholder="Cosa aspetta i partecipanti? Atmosfera, dress code, musica..." value={description} onChange={e => setDescription(e.target.value)}/>
        <label className="form-label">Quali ritmi si ballano? *</label><div className="choice-tags">{danceChoices.map(d => <button type="button" key={d} className={`choice-tag ${dances.includes(d) ? 'active' : ''}`} onClick={() => toggleDance(d)}>{dances.includes(d) && <Check size={15}/>} {d}</button>)}</div>
      </section>
      <section className="form-section"><div className="form-section-title"><span className="form-index">02</span><div><h2>Quando ci si vede?</h2><p>Imposta data e ora di inizio e fine</p></div><CalendarDays size={20}/></div>
        <div className="event-date-pair">
          <div className="event-date-group">
            <h3 className="event-date-heading">Inizio serata</h3>
            <div className="event-date-fields">
              <div className="event-date-field"><label className="form-label" htmlFor="start-date">Data *</label><input id="start-date" className="form-input event-date-control" type="date" lang="it-IT" required value={startsAt.slice(0,10)} onChange={e => setStartsAt(`${e.target.value}T${startsAt.slice(11,16) || '21:00'}`)}/></div>
              <div className="event-date-field"><label className="form-label" htmlFor="start-time">Ora *</label><input id="start-time" className="form-input event-date-control" type="time" lang="it-IT" required step="60" value={startsAt.slice(11,16)} onChange={e => setStartsAt(`${startsAt.slice(0,10)}T${e.target.value}`)}/></div>
            </div>
          </div>
          <div className="event-date-group">
            <h3 className="event-date-heading">Fine serata</h3>
            <div className="event-date-fields">
              <div className="event-date-field"><label className="form-label" htmlFor="end-date">Data *</label><input id="end-date" className="form-input event-date-control" type="date" lang="it-IT" required value={endsAt.slice(0,10)} onChange={e => setEndsAt(`${e.target.value}T${endsAt.slice(11,16) || '01:00'}`)}/></div>
              <div className="event-date-field"><label className="form-label" htmlFor="end-time">Ora *</label><input id="end-time" className="form-input event-date-control" type="time" lang="it-IT" required step="60" value={endsAt.slice(11,16)} onChange={e => setEndsAt(`${endsAt.slice(0,10)}T${e.target.value}`)}/></div>
            </div>
          </div>
        </div>
      </section>
      <section className="form-section"><div className="form-section-title"><span className="form-index">03</span><div><h2>Dove si balla?</h2><p>La privacy prima di tutto</p></div><MapPin size={20}/></div>
        <div className="form-row"><div><label className="form-label" htmlFor="event-city">Città *</label><select className="form-input" id="event-city" value={city} onChange={e => { setCity(e.target.value); setArea(CITY_AREAS[e.target.value][0].name); }}>{Object.keys(CITY_AREAS).map(c => <option key={c}>{c}</option>)}</select></div><div><label className="form-label" htmlFor="event-area">Zona visibile *</label><select className="form-input" id="event-area" value={area} onChange={e => setArea(e.target.value)}>{CITY_AREAS[city].map(a => <option key={a.name}>{a.name}</option>)}</select></div></div>
        <label className="form-label" htmlFor="event-address">Indirizzo esatto (riservato) *</label><input id="event-address" className="form-input" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Via, civico e città" maxLength={250}/>
        <label className="form-label" htmlFor="event-directions">Indicazioni per arrivare</label><input id="event-directions" className="form-input" value={directions} onChange={e => setDirections(e.target.value)} placeholder="Es. Ingresso sul retro, secondo piano" maxLength={400}/>
        <div className="privacy-field"><LockKeyhole size={19}/><p><strong>Indirizzo protetto.</strong> Gli utenti vedranno soltanto la zona <b>{area}, {city}</b>. L'indirizzo completo sarà accessibile solo agli iscritti approvati.</p></div>
      </section>
      <section className="form-section"><div className="form-section-title"><span className="form-index">04</span><div><h2>Gli ultimi dettagli</h2><p>Posti, ingresso e copertina</p></div><Image size={20}/></div><div className="form-row"><div><label className="form-label" htmlFor="event-price">Ingresso (€) *</label><input id="event-price" className="form-input" type="number" min="0" max="500" step="0.5" required value={price} onChange={e => setPrice(e.target.value)}/><small className="form-help">Pagato sul posto, non nell'app</small></div><div><label className="form-label" htmlFor="event-max">Partecipanti max *</label><input id="event-max" className="form-input" type="number" min="2" max="500" required value={maxPeople} onChange={e => setMaxPeople(e.target.value)}/></div></div><label className="form-label">Scegli una copertina</label><div className="cover-picker">{COVER_IMAGES.map((url,i) => <button type="button" aria-label={`Copertina ${i+1}`} aria-pressed={cover === i} key={url} onClick={() => setCover(i)} className={`cover-choice ${cover === i ? 'active' : ''}`} style={{ backgroundImage: `url("${url}")` }}>{cover === i && <span><Check size={17}/></span>}</button>)}</div></section>
      {error && <p className="form-error" role="alert"><Info size={18}/>{error}</p>}
      <button className="btn btn-primary btn-wide publish-button" disabled={busy || freeLimitReached} type="submit">{busy ? 'Pubblicazione in corso...' : 'Pubblica la serata'} <ArrowRight size={19}/></button><p className="publish-note"><ShieldCheck size={16}/> Controlla l'indirizzo prima di pubblicare. Non verrà mostrato ai visitatori non confermati.</p>
    </form><aside className="create-aside"><div className="preview-panel"><span className="preview-label">ANTEPRIMA DEL TUO EVENTO</span><div className="preview-cover" style={{ backgroundImage: `linear-gradient(0deg, rgba(11,11,16,.76), transparent 70%), url("${COVER_IMAGES[cover]}")` }}><span><Pill tone="lime">{dances.join(' · ')}</Pill></span></div><div className="preview-text"><h3>{title || 'La tua prossima serata ✳'}</h3><p><MapPin size={15}/> {area}, {city}</p><div><Clock size={15}/> {new Date(startsAt).toLocaleDateString('it-IT', { day:'numeric', month:'short' })} · {new Date(startsAt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</div></div></div><div className="quota-panel"><span><Users size={20}/> PIANO {pro ? 'PLUS' : 'FREE'}</span><h3>{pro ? 'Eventi illimitati' : `${myEventsThisMonth}/2 eventi questo mese`}</h3><div className="quota-track"><span style={{ width: `${pro ? 100 : Math.min(100, myEventsThisMonth/2*100)}%` }}/></div><p>{pro ? 'Continua a far crescere la community.' : 'Puoi creare fino a 2 eventi al mese gratuitamente.'}</p>{!pro && <Link to="/plus">Scopri Organizzatore Plus <ArrowRight size={16}/></Link>}</div>{freeLimitReached && <div className="limit-note"><LockKeyhole size={18}/> Hai raggiunto il limite gratuito. <Link to="/plus">Sblocca Plus</Link> per continuare.</div>}</aside></div>
  </div>;
}

import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Eye, Image, Info, LockKeyhole, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { CITY_AREAS, COVER_IMAGES, type Dance, type NewEventInput } from '../types';
import { useStore } from '../lib/store';
import { Pill } from '../components/Shared';

const danceChoices: Dance[] = ['Bachata', 'Salsa', 'Kizomba', 'Merengue'];
const steps = [
  { title: 'La tua serata', detail: 'Nome, descrizione e ritmi' },
  { title: 'Data e luogo', detail: 'Orari e posizione protetta' },
  { title: 'Ultimi dettagli', detail: 'Ingresso, posti e copertina' },
  { title: 'Controlla e pubblica', detail: 'Anteprima per gli altri ballerini' },
] as const;
function defaultTime(dayOffset: number, hour: number) {
  const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(hour, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
const formatDateTime = (value: string) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  : 'Non impostato';

export function CreateEvent() {
  const navigate = useNavigate();
  const { createEvent, events, userId, pro } = useStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Roma');
  const [area, setArea] = useState('Trastevere');
  const [address, setAddress] = useState('');
  const [directions, setDirections] = useState('');
  const [startsAt, setStartsAt] = useState(() => defaultTime(5, 21));
  const [endsAt, setEndsAt] = useState(() => defaultTime(6, 1));
  const [dances, setDances] = useState<Dance[]>(['Bachata']);
  const [price, setPrice] = useState('0');
  const [maxPeople, setMaxPeople] = useState('30');
  const [cover, setCover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const myEventsThisMonth = events.filter(e => e.hostId === userId && e.id !== 'own-1' && new Date(e.createdAt || e.startsAt).getMonth() === new Date().getMonth() && new Date(e.createdAt || e.startsAt).getFullYear() === new Date().getFullYear()).length;
  const freeLimitReached = !pro && myEventsThisMonth >= 2;
  const toggleDance = (dance: Dance) => setDances(list => list.includes(dance) ? (list.length === 1 ? list : list.filter(d => d !== dance)) : [...list, dance]);
  const goTo = (index: number) => {
    setStep(index); setError('');
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const validate = (index: number) => {
    if (freeLimitReached) return 'Hai raggiunto il limite del piano Free. Passa a Plus per creare altre serate.';
    if (index === 0 && title.trim().length < 4) return 'Inserisci un titolo di almeno 4 caratteri.';
    if (index === 1) {
      if (Number.isNaN(new Date(startsAt).getTime()) || new Date(startsAt) <= new Date()) return 'La data di inizio deve essere valida e futura.';
      if (Number.isNaN(new Date(endsAt).getTime()) || new Date(endsAt) <= new Date(startsAt)) return 'La fine deve essere successiva all’inizio della serata.';
      if (!address.trim()) return 'Inserisci l’indirizzo completo, che resterà privato fino all’approvazione.';
    }
    if (index === 2) {
      if (!Number.isFinite(Number(price)) || Number(price) < 0 || Number(price) > 500) return 'Inserisci un prezzo tra 0 e 500 €.';
      if (!Number.isInteger(Number(maxPeople)) || Number(maxPeople) < 2 || Number(maxPeople) > 500) return 'La capienza deve essere tra 2 e 500 partecipanti.';
    }
    return '';
  };
  const next = () => {
    const issue = validate(step);
    if (issue) { setError(issue); return; }
    goTo(Math.min(3, step + 1));
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== 3 || busy) return;
    for (let i = 0; i < 3; i++) {
      const issue = validate(i);
      if (issue) { goTo(i); setError(issue); return; }
    }
    const chosen = CITY_AREAS[city].find(item => item.name === area);
    if (!chosen) { goTo(1); setError('Seleziona una zona valida.'); return; }
    const input: NewEventInput = {
      title: title.trim(), description: description.trim(), city, area,
      address: address.trim(), directions: directions.trim(),
      startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(),
      publicLat: chosen.lat, publicLng: chosen.lng,
      cover: COVER_IMAGES[cover], dances, price: Number(price), maxPeople: Number(maxPeople),
    };
    setBusy(true); setError('');
    try { const id = await createEvent(input); navigate(`/event/${id}`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Impossibile creare la serata.'); }
    finally { setBusy(false); }
  };
  return <div className="create-page create-wizard">
    <Link to="/my-events" className="sub-back"><ArrowLeft size={18}/> I miei eventi</Link>
    <div className="page-intro wizard-intro"><p className="eyebrow">YOU BRING THE PEOPLE, WE BRING THE VIBE</p><h1>Crea la tua <em>serata.</em></h1><p>Quattro passaggi, poi si balla. La posizione esatta resta riservata.</p></div>
    <div className="create-grid"><form ref={formRef} className="create-form" onSubmit={e => void save(e)} noValidate>
      <div className="wizard-steps" aria-label="Avanzamento creazione serata"><div className="wizard-count">Passaggio {step + 1} di 4 <strong>{steps[step].title}</strong></div><div className="wizard-progress" aria-hidden="true">{steps.map((item, i) => <span key={item.title} className={i <= step ? 'on' : ''}/>)}</div><p>{steps[step].detail}</p></div>
      {step === 0 && <section className="form-section wizard-section" aria-label="Informazioni serata"><div className="form-section-title"><span className="form-index">01</span><div><h2>Racconta la serata</h2><p>Dalle un nome e crea l'atmosfera</p></div><Sparkles size={20}/></div>
        <label className="form-label" htmlFor="event-title">Nome della serata *</label><input id="event-title" className="form-input" maxLength={90} required placeholder="Es. Bachata sotto le stelle" value={title} onChange={e => setTitle(e.target.value)}/>
        <label className="form-label" htmlFor="event-desc">Descrizione</label><textarea id="event-desc" className="form-input form-textarea" maxLength={2000} rows={4} placeholder="Atmosfera, musica, dress code..." value={description} onChange={e => setDescription(e.target.value)}/>
        <label className="form-label">Quali ritmi si ballano? *</label><div className="choice-tags">{danceChoices.map(d => <button type="button" aria-pressed={dances.includes(d)} key={d} className={`choice-tag ${dances.includes(d) ? 'active' : ''}`} onClick={() => toggleDance(d)}>{dances.includes(d) && <Check size={15}/>} {d}</button>)}</div>
      </section>}
      {step === 1 && <><section className="form-section wizard-section" aria-label="Data e ora"><div className="form-section-title"><span className="form-index">02</span><div><h2>Quando ci si vede?</h2><p>Data e ora di inizio e fine</p></div><CalendarDays size={20}/></div>
        <div className="event-date-pair"><div className="event-date-group"><h3 className="event-date-heading">Inizio serata</h3><div className="event-date-fields"><div className="event-date-field"><label className="form-label" htmlFor="start-date">Data *</label><input id="start-date" className="form-input event-date-control" type="date" lang="it-IT" required value={startsAt.slice(0,10)} onChange={e => setStartsAt(`${e.target.value}T${startsAt.slice(11,16) || '21:00'}`)}/></div><div className="event-date-field"><label className="form-label" htmlFor="start-time">Ora *</label><input id="start-time" className="form-input event-date-control" type="time" lang="it-IT" required step="60" value={startsAt.slice(11,16)} onChange={e => setStartsAt(`${startsAt.slice(0,10)}T${e.target.value}`)}/></div></div></div>
          <div className="event-date-group"><h3 className="event-date-heading">Fine serata</h3><div className="event-date-fields"><div className="event-date-field"><label className="form-label" htmlFor="end-date">Data *</label><input id="end-date" className="form-input event-date-control" type="date" lang="it-IT" required value={endsAt.slice(0,10)} onChange={e => setEndsAt(`${e.target.value}T${endsAt.slice(11,16) || '01:00'}`)}/></div><div className="event-date-field"><label className="form-label" htmlFor="end-time">Ora *</label><input id="end-time" className="form-input event-date-control" type="time" lang="it-IT" required step="60" value={endsAt.slice(11,16)} onChange={e => setEndsAt(`${endsAt.slice(0,10)}T${e.target.value}`)}/></div></div></div></div>
        <p className="wizard-hint"><Clock size={15}/> Una serata può terminare anche il giorno dopo.</p>
      </section><section className="form-section wizard-section" aria-label="Posizione"><div className="form-section-title"><span className="form-index"><MapPin size={20}/></span><div><h2>Dove si balla?</h2><p>Pubblica una zona, proteggi l'indirizzo</p></div></div>
        <div className="form-row"><div><label className="form-label" htmlFor="event-city">Città *</label><select className="form-input" id="event-city" value={city} onChange={e => { setCity(e.target.value); setArea(CITY_AREAS[e.target.value][0].name); }}>{Object.keys(CITY_AREAS).map(c => <option key={c}>{c}</option>)}</select></div><div><label className="form-label" htmlFor="event-area">Zona visibile *</label><select className="form-input" id="event-area" value={area} onChange={e => setArea(e.target.value)}>{CITY_AREAS[city].map(a => <option key={a.name}>{a.name}</option>)}</select></div></div>
        <label className="form-label" htmlFor="event-address">Indirizzo esatto (riservato) *</label><input id="event-address" className="form-input" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Via, civico e città" maxLength={250}/>
        <label className="form-label" htmlFor="event-directions">Indicazioni per arrivare</label><input id="event-directions" className="form-input" value={directions} onChange={e => setDirections(e.target.value)} placeholder="Es. Ingresso sul retro" maxLength={400}/>
        <div className="privacy-field"><LockKeyhole size={19}/><p><strong>Indirizzo protetto.</strong> Chi esplora vedrà soltanto <b>{area}, {city}</b>. L'indirizzo completo si sblocca dopo l'approvazione.</p></div>
      </section></>}
      {step === 2 && <section className="form-section wizard-section" aria-label="Dettagli serata"><div className="form-section-title"><span className="form-index">03</span><div><h2>Gli ultimi dettagli</h2><p>Posti, ingresso e copertina</p></div><Image size={20}/></div>
        <div className="form-row"><div><label className="form-label" htmlFor="event-price">Ingresso (€) *</label><input id="event-price" className="form-input" type="number" min="0" max="500" step="0.5" required value={price} onChange={e => setPrice(e.target.value)}/><small className="form-help">Pagato sul posto, non nell'app</small></div><div><label className="form-label" htmlFor="event-max">Partecipanti max *</label><input id="event-max" className="form-input" type="number" min="2" max="500" required value={maxPeople} onChange={e => setMaxPeople(e.target.value)}/></div></div>
        <label className="form-label">Scegli una copertina</label><div className="cover-picker">{COVER_IMAGES.map((url, i) => <button type="button" aria-label={`Copertina ${i+1}`} aria-pressed={cover === i} key={url} onClick={() => setCover(i)} className={`cover-choice ${cover === i ? 'active' : ''}`} style={{ backgroundImage: `url("${url}")` }}>{cover === i && <span><Check size={17}/></span>}</button>)}</div>
      </section>}
      {step === 3 && <section className="form-section wizard-section wizard-review" aria-label="Anteprima pubblicazione"><div className="form-section-title"><span className="form-index"><Eye size={20}/></span><div><h2>Pronta per la pista?</h2><p>Ecco cosa vedranno gli altri ballerini</p></div></div>
        <div className="wizard-review-image" style={{ backgroundImage: `linear-gradient(0deg, #141022c9, transparent), url("${COVER_IMAGES[cover]}")` }}><Pill tone="lime">{dances.join(' · ')}</Pill><h3>{title}</h3></div>
        <div className="wizard-summary"><p><CalendarDays size={18}/><span><strong>Quando</strong>{formatDateTime(startsAt)} – {formatDateTime(endsAt)}</span></p><p><MapPin size={18}/><span><strong>Zona pubblica</strong>{area}, {city}</span></p><p><Users size={18}/><span><strong>Ingresso e posti</strong>{Number(price) === 0 ? 'Gratis' : `${price} € sul posto`} · {maxPeople} posti</span></p></div>
        <div className="wizard-private"><LockKeyhole size={21}/><div><strong>Visibile solo dopo conferma</strong><span>{address || 'Indirizzo non inserito'}{directions ? ` · ${directions}` : ''}</span></div></div>
        <button type="button" className="wizard-edit-link" onClick={() => goTo(1)}>Modifica data o luogo <ArrowRight size={16}/></button>
      </section>}
      {error && <p className="form-error" role="alert"><Info size={18}/>{error}</p>}
      <div className="wizard-navigation"><button type="button" className="btn btn-outline" disabled={step === 0 || busy} onClick={() => goTo(step - 1)}><ArrowLeft size={18}/> Indietro</button>{step < 3 ? <button type="button" className="btn btn-primary" onClick={next}>Continua <ArrowRight size={18}/></button> : <button type="submit" className="btn btn-primary" disabled={busy || freeLimitReached}>{busy ? 'Pubblicazione...' : 'Pubblica la serata'} <ArrowRight size={18}/></button>}</div>
      <p className="publish-note"><ShieldCheck size={16}/> Prima di pubblicare verifica che i dati siano corretti. L'indirizzo resta riservato.</p>
    </form><aside className="create-aside"><div className="quota-panel"><span><Users size={20}/> PIANO {pro ? 'PLUS' : 'FREE'}</span><h3>{pro ? 'Eventi illimitati' : `${myEventsThisMonth}/2 eventi questo mese`}</h3><div className="quota-track"><span style={{ width: `${pro ? 100 : Math.min(100, myEventsThisMonth / 2 * 100)}%` }}/></div><p>{pro ? 'Continua a far crescere la community.' : 'Puoi creare fino a 2 eventi al mese gratuitamente.'}</p>{!pro && <Link to="/plus">Scopri Organizzatore Plus <ArrowRight size={16}/></Link>}</div>{freeLimitReached && <div className="limit-note"><LockKeyhole size={18}/> Limite gratuito raggiunto. <Link to="/plus">Scopri Plus</Link>.</div>}</aside></div>
  </div>;
}

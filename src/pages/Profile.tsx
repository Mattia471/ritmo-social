import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, Crown, ExternalLink, HeartHandshake, LogOut, RotateCcw, Settings2, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, Pill } from '../components/Shared';
import { CITY_AREAS } from '../types';

export function Profile() {
  const { profile, pro, events, attendances, userId, updateProfile, signOut, isLive, restartDemo } = useStore();
  const [name,setName] = useState(profile.name);
  const [city,setCity] = useState(profile.city);
  const [bio,setBio] = useState(profile.bio);
  const [editing,setEditing] = useState(false);
  const [saved,setSaved] = useState(false);
  const [busy,setBusy] = useState(false);
  const [confirmReset,setConfirmReset] = useState(false);
  const save = async (e: FormEvent) => { e.preventDefault(); setBusy(true); try { await updateProfile(name, city, bio); setEditing(false); setSaved(true); setTimeout(() => setSaved(false),3500); } catch { /* global toast */ } finally { setBusy(false); } };
  return <div className="profile-page"><div className="page-intro"><p className="eyebrow">TU, LA MUSICA, LA COMMUNITY</p><h1>Il tuo <em>profilo.</em></h1><p>Ogni ballerino ha la sua storia. Questa è la tua.</p></div>
    <div className="profile-cover"><div className="profile-pattern">RITMO · RITMO · RITMO</div><span className="profile-sticker">KEEP MOVING ✳</span></div><div className="profile-identity"><Avatar name={profile.name} size="lg"/><div><h2>{profile.name}</h2><span>{profile.city} · {pro ? 'Organizzatore Plus' : 'Membro della community'}</span></div><button onClick={() => setEditing(x => !x)} className="edit-profile"><Settings2 size={17}/> {editing ? 'Annulla' : 'Modifica'}</button></div>
    <div className="profile-stats"><div><strong>{attendances.filter(a => a.userId === userId && a.status === 'approved').length}</strong><small>Serate confermate</small></div><div><strong>{events.filter(e => e.hostId === userId).length}</strong><small>Serate organizzate</small></div><div><strong>✳</strong><small>Ritmo member</small></div></div>
    {saved && <div className="profile-success"><Check size={17}/> Profilo aggiornato</div>}
    {editing ? <form className="profile-editor" onSubmit={e => void save(e)}><label className="form-label">Come ti chiami?</label><input className="form-input" required value={name} onChange={e => setName(e.target.value)} maxLength={64}/><label className="form-label">La tua città</label><select className="form-input" value={city} onChange={e => setCity(e.target.value)}>{Object.keys(CITY_AREAS).map(c => <option key={c}>{c}</option>)}</select><label className="form-label">Qualcosa su di te</label><textarea className="form-input form-textarea" value={bio} onChange={e => setBio(e.target.value)} maxLength={280} rows={3}/><button className="btn btn-primary" type="submit" disabled={busy}>Salva modifiche <Check size={17}/></button></form> : <div className="profile-bio"><span>SU DI ME</span><p>{profile.bio || 'Qual è il tuo stile preferito? Raccontalo alla community!'}</p></div>}
    <Link to="/plus" className="profile-pro"><span className="pro-symbol"><Crown size={27}/></span><div><span className="eyebrow">RITMO PLUS</span><h3>{pro ? 'Il tuo abbonamento è attivo' : 'Organizza senza limiti'}</h3><p>{pro ? 'Fai crescere il tuo giro di serate.' : 'Per chi mette insieme persone, musica e sorrisi.'}</p></div><ArrowRight size={22}/></Link>
    <div className="profile-links"><Link to="/my-events"><CalendarDays size={19}/> I miei eventi <ArrowRight size={18}/></Link><Link to="/chats"><HeartHandshake size={19}/> Community e chat <ArrowRight size={18}/></Link><Link to="/plus"><Sparkles size={19}/> Come funziona Ritmo Plus <ArrowRight size={18}/></Link><a href="mailto:hello@ritmo.social?subject=Segnalazione%20Ritmo" ><ShieldCheck size={19}/> Segnala un problema (email da configurare) <ExternalLink size={17}/></a></div>
    <div className="profile-session"><Pill tone={isLive ? 'lime' : 'orange'}>{isLive ? 'Connesso a Supabase' : 'Modalità demo locale'}</Pill>{isLive ? <button onClick={() => void signOut()}><LogOut size={17}/> Esci dall'account</button> : <button onClick={() => setConfirmReset(true)}><RotateCcw size={17}/> Ripristina la demo</button>}</div>
    {confirmReset && !isLive && <div className="reset-inline"><p>Ripristinare tutti gli eventi, i messaggi e le richieste di questa demo?</p><button onClick={() => setConfirmReset(false)} className="btn btn-outline">Annulla</button><button onClick={() => { restartDemo(); setEditing(false); setConfirmReset(false); }} className="btn btn-primary">Conferma ripristino</button></div>}
  </div>;
}

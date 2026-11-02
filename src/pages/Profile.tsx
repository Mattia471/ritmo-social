import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, HeartHandshake, LogOut, RotateCcw, UserX, Settings2, ShieldCheck, Bell } from 'lucide-react';
import { useStore } from '../lib/store';
import { useNotifications } from '../lib/notifications';
import { Avatar, Pill } from '../components/Shared';
import { CITY_AREAS, DANCE_CHOICES, type Dance } from '../types';

export function Profile() {
  const { profile, events, attendances, blockedUsers, userId, updateProfile, unblockUser, signOut, isLive, restartDemo } = useStore();
  const { disablePush } = useNotifications();
  const [name,setName] = useState(profile.name);
  const [city,setCity] = useState(profile.city);
  const [bio,setBio] = useState(profile.bio);
  const [dances,setDances] = useState<Dance[]>(profile.dances ?? []);
  const [yearsExperience,setYearsExperience] = useState(profile.yearsExperience ?? 0);
  const [editing,setEditing] = useState(false);
  const [saved,setSaved] = useState(false);
  const [saveError,setSaveError] = useState('');
  const [busy,setBusy] = useState(false);
  const [unblockBusy,setUnblockBusy] = useState<string | null>(null);
  const [blockError,setBlockError] = useState('');
  const [confirmReset,setConfirmReset] = useState(false);
  const save = async (e: FormEvent) => { e.preventDefault(); setSaveError(''); setBusy(true); try { await updateProfile(name, city, bio, dances, yearsExperience); setEditing(false); setSaved(true); setTimeout(() => setSaved(false),3500); } catch (err) { setSaveError(err instanceof Error ? err.message : 'Modifica non salvata. Riprova.'); } finally { setBusy(false); } };
  return <div className="profile-page"><div className="page-intro"><p className="eyebrow">TU, LA MUSICA, LA COMMUNITY</p><h1>Il tuo <em>profilo.</em></h1><p>Ogni ballerino ha la sua storia. Questa è la tua.</p></div>
    <div className="profile-cover"><div className="profile-pattern">RITMO · RITMO · RITMO</div><span className="profile-sticker">KEEP MOVING ✳</span></div><div className="profile-identity"><Avatar name={profile.name} size="lg"/><div><h2>{profile.name}</h2><span>{profile.city} · Membro della community</span></div><button onClick={() => { setSaveError(''); setEditing(x => !x); }} className="edit-profile"><Settings2 size={17}/> {editing ? 'Annulla' : 'Modifica'}</button></div>
    <div className="profile-stats"><div><strong>{attendances.filter(a => a.userId === userId && a.status === 'approved').length}</strong><small>Serate confermate</small></div><div><strong>{events.filter(e => e.hostId === userId).length}</strong><small>Serate organizzate</small></div><div><strong>✳</strong><small>Ritmo member</small></div></div>
    {saved && <div className="profile-success"><Check size={17}/> Profilo aggiornato</div>}
    {saveError && <p className="form-error" role="alert">{saveError}</p>}
    {editing ? <form className="profile-editor" onSubmit={e => void save(e)}><label className="form-label">Come ti chiami?</label><input className="form-input" required value={name} onChange={e => setName(e.target.value)} maxLength={64}/><label className="form-label">La tua città</label><select className="form-input" value={city} onChange={e => setCity(e.target.value)}>{Object.keys(CITY_AREAS).map(c => <option key={c}>{c}</option>)}</select><label className="form-label">Cosa balli?</label><div className="auth-dance-grid">{DANCE_CHOICES.map(d => <button type="button" key={d} aria-pressed={dances.includes(d)} className={`choice-tag ${dances.includes(d) ? 'active' : ''}`} onClick={() => setDances(s => s.includes(d) ? s.filter(v => v !== d) : [...s,d])}>{dances.includes(d) ? '✓ ' : '+ '}{d}</button>)}</div><label className="form-label" htmlFor="experience">Anni di esperienza</label><input id="experience" type="number" min="0" max="50" className="form-input" value={yearsExperience} onChange={e => setYearsExperience(Number(e.target.value))}/><label className="form-label">Qualcosa su di te</label><textarea className="form-input form-textarea" value={bio} onChange={e => setBio(e.target.value)} maxLength={280} rows={3}/><button className="btn btn-primary" type="submit" disabled={busy}>Salva modifiche <Check size={17}/></button></form> : <div className="profile-bio"><span>SU DI ME</span><p>{profile.bio || 'Racconta qualcosa di te alla community!'}</p><p className="profile-preferences">🎶 {profile.dances?.length ? profile.dances.join(' · ') : 'Stili da scegliere'} · {profile.yearsExperience ?? 0} anni di esperienza</p></div>}
    <Link to="/create" className="profile-pro"><span className="pro-symbol"><HeartHandshake size={27}/></span><div><span className="eyebrow">LA PISTA È DI TUTTI</span><h3>Organizza gratis</h3><p>Pubblica serate e invita nuovi ballerini. Nessun abbonamento.</p></div><ArrowRight size={22}/></Link>
    <div className="profile-links"><Link to="/notifications"><Bell size={19}/> Notifiche e preferenze <ArrowRight size={18}/></Link><Link to="/my-events"><CalendarDays size={19}/> I miei eventi <ArrowRight size={18}/></Link><Link to="/chats"><HeartHandshake size={19}/> Community e chat <ArrowRight size={18}/></Link><Link to="/chats"><ShieldCheck size={19}/> Segnala un messaggio dalla chat <ArrowRight size={17}/></Link></div>
    {isLive && <section className="profile-blocked" aria-labelledby="blocked-members-heading"><h3 id="blocked-members-heading"><UserX size={19}/> Persone bloccate <span>{blockedUsers.length}</span></h3><p>I loro messaggi restano nascosti nelle chat. Il blocco non impedisce di partecipare alla stessa serata.</p>{blockError && <p className="form-error" role="alert">{blockError}</p>}{blockedUsers.length ? <ul>{blockedUsers.map(block => <li key={block.id}><span>{block.name}</span><button type="button" disabled={unblockBusy !== null} onClick={() => { setBlockError(''); setUnblockBusy(block.id); void unblockUser(block.id).catch(err => setBlockError(err instanceof Error ? err.message : 'Impossibile sbloccare.')).finally(() => setUnblockBusy(null)); }}>{unblockBusy === block.id ? 'Sblocco...' : 'Sblocca'}</button></li>)}</ul> : <p className="profile-blocked-empty">Non hai bloccato nessuno.</p>}</section>}
    <div className="profile-session"><Pill tone={isLive ? 'lime' : 'orange'}>{isLive ? 'Connesso a Supabase' : 'Modalità demo locale'}</Pill>{isLive ? <button onClick={() => { void (async () => { try { await disablePush(); } catch { /* Sign-out must still succeed if browser permissions changed. */ } await signOut(); })(); }}><LogOut size={17}/> Esci dall'account</button> : <button onClick={() => setConfirmReset(true)}><RotateCcw size={17}/> Ripristina la demo</button>}</div>
    {confirmReset && !isLive && <div className="reset-inline"><p>Ripristinare tutti gli eventi, i messaggi e le richieste di questa demo?</p><button onClick={() => setConfirmReset(false)} className="btn btn-outline">Annulla</button><button onClick={() => { restartDemo(); setEditing(false); setConfirmReset(false); }} className="btn btn-primary">Conferma ripristino</button></div>}
  </div>;
}

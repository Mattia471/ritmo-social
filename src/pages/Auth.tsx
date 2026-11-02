import { useState, type FormEvent } from 'react';
import { ArrowRight, Heart, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, Phone } from 'lucide-react';
import { Brand } from '../components/Shared';
import { useStore } from '../lib/store';
import { CITY_AREAS, DANCE_CHOICES, type Dance, type SignupInput } from '../types';

type Mode = 'register' | 'login' | 'recover';
export function Auth() {
  const { signIn, signUp, resetPassword, pendingEmail, isLive } = useStore();
  const [mode,setMode] = useState<Mode>('register');
  const [form,setForm] = useState<SignupInput>({firstName:'',lastName:'',phone:'',email:'',password:'',city:'Roma',dances:['Bachata'],yearsExperience:0});
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const update = <K extends keyof SignupInput>(key:K, value:SignupInput[K]) => setForm(current => ({...current,[key]:value}));
  const toggleDance = (dance:Dance) => setForm(current => ({...current,dances:current.dances.includes(dance) ? current.dances.filter(d => d !== dance) : [...current.dances,dance]}));
  const submit = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return;
    setError('');setBusy(true);
    try {
      if(mode==='register') await signUp(form);
      if(mode==='login') await signIn(form.email,form.password);
      if(mode==='recover') await resetPassword(form.email);
    } catch(err) { setError(err instanceof Error ? err.message : 'Errore durante l’accesso.'); }
    finally {setBusy(false);}
  };
  return <div className="auth-shell"><div className="auth-art"><Brand/><div className="auth-art-inner"><div className="eyebrow">DANCE · MEET · REPEAT</div><h1>Si balla meglio <em>insieme.</em></h1><p>Trova social e ballerini nella tua città. Una community gratuita, per tutti i livelli.</p><span>✳ RITMO SOCIAL</span></div></div>
    <div className="auth-content"><div className="auth-mobile-brand"><Brand/></div><div className="auth-panel">
      <span className="auth-glyph"><Heart size={26}/></span>
      {pendingEmail ? <><p className="eyebrow">CONTROLLA LA POSTA</p><h2>Controlla la tua email</h2><p>Abbiamo inviato le istruzioni a <strong>{pendingEmail}</strong>. Per confermare l'account o recuperare la password, segui il link ricevuto.</p><span className="auth-small"><Mail size={16}/> Controlla anche lo spam.</span></> : <>
        {!isLive && <p className="auth-preview-note" role="status">Anteprima grafica: nessun account reale viene creato finché non colleghiamo Supabase.</p>}<p className="eyebrow">DANCE · MEET · REPEAT</p><h2>{mode==='register' ? 'Entra nella community.' : mode==='login' ? 'Bentornato in pista.' : 'Recupera la password.'}</h2>
        <p>{mode==='register' ? 'Registrati gratis in pochi passi. Ti mostreremo per prime le serate vicine ai tuoi balli preferiti.' : mode==='login' ? 'Accedi con la tua email e password.' : 'Ti invieremo un link per impostare una nuova password.'}</p>
        <div className="auth-mode-tabs"><button type="button" aria-pressed={mode==='register'} onClick={()=>{setMode('register');setError('');}}>Registrati</button><button type="button" aria-pressed={mode==='login'} onClick={()=>{setMode('login');setError('');}}>Accedi</button></div>
        <form onSubmit={e=>void submit(e)} className="auth-register-form">
          {mode==='register' && <>
            <div className="auth-two-cols"><label>Nome *<input className="form-input" required autoComplete="given-name" maxLength={40} value={form.firstName} onChange={e=>update('firstName',e.target.value)}/></label><label>Cognome *<input className="form-input" required autoComplete="family-name" maxLength={40} value={form.lastName} onChange={e=>update('lastName',e.target.value)}/></label></div>
            <label>Telefono *<span className="auth-help">Formato internazionale, es. +393331234567</span><div className="email-field"><Phone size={18}/><input required type="tel" autoComplete="tel" placeholder="+39 333 1234567" value={form.phone} onChange={e=>update('phone',e.target.value)}/></div></label>
            <label>Città di riferimento *<select className="form-input" value={form.city} onChange={e=>update('city',e.target.value)}>{Object.keys(CITY_AREAS).map(c=><option key={c}>{c}</option>)}</select></label>
            <div className="auth-dances"><span>Cosa balli? *</span><div className="auth-dance-grid">{DANCE_CHOICES.map(d=><button key={d} className={`choice-tag ${form.dances.includes(d)?'active':''}`} aria-pressed={form.dances.includes(d)} type="button" onClick={()=>toggleDance(d)}>{form.dances.includes(d)?'✓ ':'+ '}{d}</button>)}</div></div>
            <label>Anni di esperienza *<input className="form-input" required min="0" max="50" step="1" type="number" value={form.yearsExperience} onChange={e=>update('yearsExperience',Number(e.target.value))}/></label>
          </>}
          <label>Email *<div className="email-field"><Mail size={18}/><input required type="email" autoComplete="email" placeholder="nome@email.it" value={form.email} onChange={e=>update('email',e.target.value)}/></div></label>
          {mode!=='recover' && <label>Password *<div className="email-field"><LockKeyhole size={18}/><input required type="password" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Almeno 8 caratteri" value={form.password} onChange={e=>update('password',e.target.value)}/></div></label>}
          {mode==='register' && <p className="auth-privacy">Il telefono serve per il tuo account e non viene mostrato agli altri ballerini. Nessun abbonamento richiesto. Prima del lancio sarà disponibile l'informativa privacy.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-wide" disabled={busy || (mode==='register' && !form.dances.length)} type="submit">{busy?'Un momento...':mode==='register'?'Registrati gratis':mode==='login'?'Accedi':'Invia link'} <ArrowRight size={18}/></button>
        </form>
        {mode==='login' && <button type="button" className="auth-text-link" onClick={()=>setMode('recover')}>Password dimenticata?</button>}
        {mode==='recover' && <button type="button" className="auth-text-link" onClick={()=>setMode('login')}>Torna all’accesso</button>}
        <span className="auth-small"><UserRound size={15}/> Profilo gratuito · <ShieldCheck size={15}/> Indirizzo serate riservato agli iscritti approvati</span>
      </>}
      <div className="auth-footer"><Sparkles size={15}/> Salsa · Bachata · Kizomba · Merengue</div>
    </div></div></div>;
}

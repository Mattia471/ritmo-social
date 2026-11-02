import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
export function ResetPassword() {
 const [password,setPassword]=useState('');const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
 const save=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);const {error}=await supabase.auth.updateUser({password});setStatus(error?error.message:'Password aggiornata. Puoi tornare all’accesso.');setBusy(false);};
 return <div className="reset-password-page"><h1>Nuova password</h1><form onSubmit={e=>void save(e)}><label>Nuova password<input className="form-input" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy} className="btn btn-primary">Aggiorna password</button></form><p role="status">{status}</p><Link to="/">Torna alla Home</Link></div>;
}

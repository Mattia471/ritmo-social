import { useState, type FormEvent } from 'react';
import { ArrowRight, Heart, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Brand } from '../components/Shared';
import { useStore } from '../lib/store';

export function Auth() {
  const { signIn, pendingEmail } = useStore();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const login = async (e: FormEvent) => { e.preventDefault(); setError(''); setBusy(true); try { await signIn(email); } catch(err) { setError(err instanceof Error ? err.message : 'Riprova'); } finally { setBusy(false); } };
  return <div className="auth-shell"><div className="auth-art"><Brand/><div className="auth-art-inner"><div className="eyebrow">DANCE · MEET · REPEAT</div><h1>Si balla meglio <em>insieme.</em></h1><p>La serata giusta, le persone giuste. Benvenuto nella community caraibica.</p><span>✳ RITMO SOCIAL</span></div></div><div className="auth-content"><div className="auth-mobile-brand"><Brand/></div><div className="auth-panel"><span className="auth-glyph"><Heart size={28}/></span>{pendingEmail ? <><p className="eyebrow">CONTROLLA LA POSTA</p><h2>Ci siamo quasi!</h2><p>Ti abbiamo inviato un link di accesso a <strong>{pendingEmail}</strong>. Aprilo sullo stesso dispositivo per entrare in Ritmo.</p><span className="auth-small"><Mail size={16}/> Controlla anche la cartella spam.</span></> : <><p className="eyebrow">ENTRA IN RITMO</p><h2>La pista ti aspetta.</h2><p>Accedi con la tua email. Nessuna password da ricordare e nessun costo per partecipare.</p><form onSubmit={e => void login(e)}><label className="form-label" htmlFor="sign-email">La tua email</label><div className="email-field"><Mail size={20}/><input id="sign-email" required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.it"/></div>{error && <p className="form-error">{error}</p>}<button disabled={busy} className="btn btn-primary btn-wide" type="submit">{busy ? 'Invio in corso...' : 'Entra nella community'} <ArrowRight size={19}/></button></form><div className="auth-small"><LockKeyhole size={16}/> Link di accesso sicuro via email</div></> }<div className="auth-trust"><ShieldCheck size={18}/> La tua posizione precisa non viene pubblicata. Gli indirizzi delle serate si sbloccano solo dopo la conferma.</div><div className="auth-footer"><Sparkles size={15}/> Bachata · Salsa · Kizomba · Persone</div></div></div></div>;
}

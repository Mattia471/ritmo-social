import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Globe2, Hash, LockKeyhole, MessageCircle, Send, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Avatar } from '../components/Shared';
import { useStore } from '../lib/store';
import { clock, tinyDate } from '../lib/geo';

export function Chats() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { events, attendances, messages, userId, sendMessage } = useStore();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const memberships = events.filter(e => e.hostId === userId || attendances.some(a => a.eventId === e.id && a.userId === userId && a.status === 'approved'));
  const selectedEvent = events.find(e => e.id === roomId);
  const canRead = !roomId || memberships.some(e => e.id === roomId);
  const channel = roomId || null;
  const visibleMessages = useMemo(() => messages.filter(m => m.eventId === channel), [messages, channel]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [roomId, visibleMessages.length]);
  const submit = async (e: FormEvent) => { e.preventDefault(); if (!draft.trim() || sending || !canRead) return; setSending(true); const text = draft; setDraft(''); try { await sendMessage(channel,text); } catch { setDraft(text); } finally { setSending(false); } };
  return <div className="chats-page"><div className="page-intro chat-intro"><p className="eyebrow">NON SI BALLA MAI DA SOLI</p><h1>La <em>community.</em></h1><p>Parla, organizza, conosci persone. E poi tutti in pista.</p></div>
    <div className="chat-layout"><aside className="chat-channels"><div className="channel-heading"><span>LE TUE CHAT</span><MessageCircle size={17}/></div><Link to="/chats" className={`channel-item ${!roomId ? 'selected' : ''}`}><span className="channel-icon global-icon"><Globe2 size={21}/></span><span><strong>Chat globale</strong><small>La community di Ritmo</small></span><span className="channel-indicator"/></Link><div className="channels-label"><span>CHAT DELLE SERATE</span><span>{memberships.length}</span></div>
      {memberships.map(event => <Link to={`/chats/${event.id}`} className={`channel-item ${roomId === event.id ? 'selected' : ''}`} key={event.id}><span className="channel-icon event-icon"><Hash size={21}/></span><span><strong>{event.title}</strong><small>{event.area}, {event.city}</small></span></Link>)}
      {!memberships.length && <p className="channels-empty">Quando la tua iscrizione viene approvata, qui appare la chat della serata.</p>}
      <Link to="/explore" className="find-channel">Scopri altre serate <ArrowUpRight size={16}/></Link></aside>
      <section className="chat-conversation">{canRead ? <><div className="conversation-heading"><div className="chat-heading-icon">{roomId ? <Hash size={21}/> : <Globe2 size={21}/>}</div><span><strong>{roomId ? selectedEvent?.title : 'Chat globale'}</strong><small>{roomId ? 'Solo i partecipanti confermati' : 'Il punto di incontro dei ballerini'}</small></span><span className="live-presence"><span/> COMMUNITY</span></div>
        <div className="message-scroll"><div className="conversation-welcome"><span className="welcome-chat-icon"><Sparkles size={22}/></span><h3>{roomId ? 'La pista inizia da qui' : 'Benvenuto nella community!'}</h3><p>{roomId ? 'Questa chat è riservata agli iscritti approvati. Organizzatevi e divertitevi!' : 'Presentati, condividi i tuoi piani e scopri con chi andare a ballare.'}</p><span><ShieldCheck size={14}/> Rispetta la privacy e gli altri utenti</span></div>
          {visibleMessages.map((msg, i) => {
            const mine = msg.userId === userId;
            const previous = visibleMessages[i-1];
            const showAuthor = previous?.userId !== msg.userId || (new Date(msg.createdAt).getTime() - new Date(previous.createdAt).getTime() > 600000);
            return <div className={`message-row ${mine ? 'mine' : ''}`} key={msg.id}>{!mine && <div className="message-avatar">{showAuthor ? <Avatar name={msg.userName} size="sm"/> : null}</div>}<div className="message-stack">{!mine && showAuthor && <span className="sender-name">{msg.userName}</span>}<div className={`message-bubble ${mine ? 'message-mine' : ''}`}><p>{msg.content}</p><time dateTime={msg.createdAt}>{tinyDate(msg.createdAt)} {clock(msg.createdAt)}</time></div></div></div>;
          })}{!visibleMessages.length && <div className="no-messages">Nessun messaggio ancora. Rompi il ghiaccio! 👋</div>}<div ref={endRef}/></div>
        <form className="chat-compose" onSubmit={e => void submit(e)}><input aria-label="Scrivi un messaggio" value={draft} maxLength={1200} onChange={e => setDraft(e.target.value)} placeholder="Scrivi un messaggio alla community..."/><button type="submit" disabled={!draft.trim() || sending} aria-label="Invia messaggio"><Send size={19}/></button></form></> : <div className="locked-chat"><span className="locked-chat-icon"><LockKeyhole size={27}/></span><h3>Questa chat è riservata</h3><p>Solo i partecipanti confermati e l'organizzatore possono leggere e scrivere qui.</p><Link to={`/event/${roomId}`} className="btn btn-primary">Vai all'evento <ArrowUpRight size={18}/></Link><button onClick={() => navigate('/chats')} className="back-global"><ArrowLeft size={16}/> Torna alla chat globale</button></div>}</section>
    </div><div className="community-guidelines"><Users size={17}/> <span><strong>Qui siamo tutti della stessa squadra.</strong> Niente spam, molestie o condivisione di indirizzi privati. Per il lancio pubblico serviranno segnalazioni, blocco utenti e moderazione.</span></div>
  </div>;
}

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Globe2, Hash, LockKeyhole, MessageCircle, RefreshCw, Send, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Avatar } from '../components/Shared';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { clock, tinyDate } from '../lib/geo';
import '../chat-sync.css';

export function Chats() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { events, attendances, messages, userId, sendMessage, loadChatMessages } = useStore();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'live' | 'offline' | 'demo'>(supabase ? 'connecting' : 'demo');
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const stickToBottom = useRef(true);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const memberships = events.filter(e => e.hostId === userId || attendances.some(a => a.eventId === e.id && a.userId === userId && a.status === 'approved'));
  const isGlobal = !roomId || roomId === 'global';
  const selectedEvent = events.find(e => e.id === roomId);
  const canRead = isGlobal || memberships.some(e => e.id === roomId);
  const channel = isGlobal ? null : roomId || null;
  const visibleMessages = useMemo(() => messages.filter(m => m.eventId === channel), [messages, channel]);
  // iOS Safari changes the visual viewport when the software keyboard opens.
  // Use the actual visible height instead of trying to scroll the entire page.
  useEffect(() => {
    if (!roomId) return;
    const viewport = window.visualViewport;
    const syncViewport = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--ritmo-chat-height', `${Math.round(height)}px`);
      document.documentElement.style.setProperty('--ritmo-chat-top', `${Math.max(0, Math.round(viewport?.offsetTop ?? 0))}px`);
      document.documentElement.classList.toggle('ritmo-chat-keyboard', window.innerHeight - height > 120);
    };
    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('resize', syncViewport);
    return () => {
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('resize', syncViewport);
      document.documentElement.classList.remove('ritmo-chat-keyboard');
      document.documentElement.style.removeProperty('--ritmo-chat-height');
      document.documentElement.style.removeProperty('--ritmo-chat-top');
    };
  }, [roomId]);
  // Rooms subscribe individually so activity in another room cannot hide the
  // current conversation behind a global 300-message limit.
  useEffect(() => {
    if (!supabase || !canRead || !userId) {
      setSyncStatus(supabase ? 'offline' : 'demo');
      return;
    }
    const client = supabase;
    let disposed = false;
    let connected = false;
    setSyncStatus('connecting');
    setChatError('');
    const reload = () => {
      if (!disposed) void loadChatMessages(channel).catch(() => {
        if (!disposed) setChatError('Impossibile caricare i messaggi. Controlla la connessione e riprova.');
      });
    };
    reload();
    const subscription = client.channel(`ritmo-room-${channel || 'global'}-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        if ((payload.new.event_id ?? null) === channel) reload();
      })
      .subscribe(status => {
        if (disposed) return;
        connected = status === 'SUBSCRIBED';
        setSyncStatus(connected ? 'live' : 'offline');
        if (connected) reload();
      });
    const onResume = () => { if (!document.hidden) reload(); };
    window.addEventListener('focus', onResume);
    window.addEventListener('online', onResume);
    document.addEventListener('visibilitychange', onResume);
    // Fallback if Realtime is unavailable. No continuous polling while live.
    const fallback = window.setInterval(() => { if (!connected && !document.hidden) reload(); }, 30000);
    return () => {
      disposed = true;
      window.clearInterval(fallback);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('online', onResume);
      document.removeEventListener('visibilitychange', onResume);
      void client.removeChannel(subscription);
    };
  }, [channel, canRead, loadChatMessages, userId]);
  useEffect(() => {
    stickToBottom.current = true;
    setHasNewMessages(false);
  }, [roomId]);
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (stickToBottom.current) {
      container.scrollTop = container.scrollHeight;
      setHasNewMessages(false);
    } else if (visibleMessages.length) {
      setHasNewMessages(true);
    }
  }, [roomId, visibleMessages.length]);
  const trackScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    stickToBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (stickToBottom.current) setHasNewMessages(false);
  };
  const jumpToLatest = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    stickToBottom.current = true;
    setHasNewMessages(false);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || sending || !canRead) return;
    setSending(true);
    setChatError('');
    const text = draft;
    try {
      await sendMessage(channel, text);
      setDraft('');
      jumpToLatest();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Invio non riuscito. Riprova.');
    } finally { setSending(false); }
  };
  return <div className={`chats-page ${roomId ? 'chat-mobile-conversation' : 'chat-mobile-index'}`}>
    {!roomId && <section className="mobile-chat-index" aria-label="Elenco delle conversazioni"><div className="mobile-chat-index-title"><p className="eyebrow">LA COMMUNITY DEL BALLO</p><h1>Messaggi</h1><p>La pista inizia da una conversazione.</p></div><div className="mobile-chat-rooms"><Link to="/chats/global" className="mobile-chat-room"><span className="mobile-room-avatar global"><Globe2 size={23}/></span><span className="mobile-room-text"><strong>Chat globale</strong><small>Conosci nuovi ballerini e organizza uscite</small></span><ArrowUpRight size={19}/></Link>{memberships.map(event => <Link className="mobile-chat-room" key={event.id} to={`/chats/${event.id}`}><span className="mobile-room-avatar"><Hash size={23}/></span><span className="mobile-room-text"><strong>{event.title}</strong><small>{event.area}, {event.city} · Partecipazione confermata</small></span><ArrowUpRight size={19}/></Link>)}{!memberships.length && <div className="mobile-chat-zero"><LockKeyhole size={18}/> Le chat degli eventi appaiono dopo la conferma dell'organizzatore.</div>}</div><Link to="/explore" className="mobile-chat-explore">Scopri le prossime serate <ArrowUpRight size={17}/></Link></section>}
    <div className="page-intro chat-intro"><p className="eyebrow">NON SI BALLA MAI DA SOLI</p><h1>La <em>community.</em></h1><p>Parla, organizza, conosci persone. E poi tutti in pista.</p></div>
    <div className="chat-layout"><aside className="chat-channels"><div className="channel-heading"><span>LE TUE CHAT</span><MessageCircle size={17}/></div><Link to="/chats" className={`channel-item ${isGlobal ? 'selected' : ''}`}><span className="channel-icon global-icon"><Globe2 size={21}/></span><span><strong>Chat globale</strong><small>La community di Ritmo</small></span><span className="channel-indicator"/></Link><div className="channels-label"><span>CHAT DELLE SERATE</span><span>{memberships.length}</span></div>
      {memberships.map(event => <Link to={`/chats/${event.id}`} className={`channel-item ${roomId === event.id ? 'selected' : ''}`} key={event.id}><span className="channel-icon event-icon"><Hash size={21}/></span><span><strong>{event.title}</strong><small>{event.area}, {event.city}</small></span></Link>)}
      {!memberships.length && <p className="channels-empty">Quando la tua iscrizione viene approvata, qui appare la chat della serata.</p>}
      <Link to="/explore" className="find-channel">Scopri altre serate <ArrowUpRight size={16}/></Link></aside>
      <section className="chat-conversation">{canRead ? <><div className="conversation-heading"><Link to="/chats" className="chat-mobile-back" aria-label="Torna alle conversazioni"><ArrowLeft size={21}/></Link><div className="chat-heading-icon">{!isGlobal ? <Hash size={21}/> : <Globe2 size={21}/>}</div><span><strong>{!isGlobal ? selectedEvent?.title : 'Chat globale'}</strong><small>{!isGlobal ? 'Solo i partecipanti confermati' : 'Il punto di incontro dei ballerini'}</small></span><span className={`live-presence ${syncStatus === 'live' ? 'chat-is-live' : 'chat-is-offline'}`} aria-live="polite"><span/> {syncStatus === 'live' ? 'IN DIRETTA' : syncStatus === 'demo' ? 'DEMO' : syncStatus === 'connecting' ? 'CONNESSIONE...' : 'NON IN DIRETTA'}</span><button type="button" className="chat-retry" title="Aggiorna conversazione" aria-label="Aggiorna conversazione" onClick={() => { setChatError(''); void loadChatMessages(channel).catch(() => setChatError('Impossibile aggiornare la chat. Riprova.')); }}><RefreshCw size={18}/></button></div>
        <div className="message-scroll" ref={scrollRef} onScroll={trackScroll}><div className="conversation-welcome"><span className="welcome-chat-icon"><Sparkles size={22}/></span><h3>{!isGlobal ? 'La pista inizia da qui' : 'Benvenuto nella community!'}</h3><p>{!isGlobal ? 'Questa chat è riservata agli iscritti approvati. Organizzatevi e divertitevi!' : 'Presentati, condividi i tuoi piani e scopri con chi andare a ballare.'}</p><span><ShieldCheck size={14}/> Rispetta la privacy e gli altri utenti</span></div>
          {visibleMessages.map((msg, i) => {
            const mine = msg.userId === userId;
            const previous = visibleMessages[i-1];
            const showAuthor = previous?.userId !== msg.userId || (new Date(msg.createdAt).getTime() - new Date(previous.createdAt).getTime() > 600000);
            return <div className={`message-row ${mine ? 'mine' : ''}`} key={msg.id}>{!mine && <div className="message-avatar">{showAuthor ? <Avatar name={msg.userName} size="sm"/> : null}</div>}<div className="message-stack">{!mine && showAuthor && <span className="sender-name">{msg.userName}</span>}<div className={`message-bubble ${mine ? 'message-mine' : ''}`}><p>{msg.content}</p><time dateTime={msg.createdAt}>{tinyDate(msg.createdAt)} {clock(msg.createdAt)}</time></div></div></div>;
          })}{!visibleMessages.length && <div className="no-messages">Nessun messaggio ancora. Rompi il ghiaccio! 👋</div>}<div ref={endRef}/></div>
        {hasNewMessages && <button type="button" className="chat-new-messages" onClick={jumpToLatest}>Nuovi messaggi ↓</button>}
        {chatError && <p className="chat-error" role="alert">{chatError}</p>}
        <form className="chat-compose" onSubmit={e => void submit(e)}><input aria-label="Scrivi un messaggio" onFocus={jumpToLatest} value={draft} disabled={sending} maxLength={1200} onChange={e => setDraft(e.target.value)} placeholder="Scrivi un messaggio alla community..."/><button type="submit" disabled={!draft.trim() || sending} aria-label="Invia messaggio"><Send size={19}/></button></form></> : <div className="locked-chat"><span className="locked-chat-icon"><LockKeyhole size={27}/></span><h3>Questa chat è riservata</h3><p>Solo i partecipanti confermati e l'organizzatore possono leggere e scrivere qui.</p><Link to={`/event/${roomId}`} className="btn btn-primary">Vai all'evento <ArrowUpRight size={18}/></Link><button onClick={() => navigate('/chats')} className="back-global"><ArrowLeft size={16}/> Torna alla chat globale</button></div>}</section>
    </div><div className="community-guidelines"><Users size={17}/> <span><strong>Qui siamo tutti della stessa squadra.</strong> Niente spam, molestie o condivisione di indirizzi privati. Per il lancio pubblico serviranno segnalazioni, blocco utenti e moderazione.</span></div>
  </div>;
}

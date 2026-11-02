import '../notifications.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, Bell, BellOff, CalendarDays, Check, CheckCheck,
  CircleCheck, Clock3, MapPin, RefreshCw, Settings2, ShieldCheck, Smartphone, Users, X
} from 'lucide-react';
import { useNotifications, type NoticeKind } from '../lib/notifications';
import { useStore } from '../lib/store';

const labels: Record<NoticeKind, string> = {
  nearby_event: 'Nuova serata vicino a te',
  join_request: 'Nuova richiesta',
  request_approved: 'Partecipazione confermata',
  request_rejected: 'Richiesta rifiutata',
  event_canceled: 'Serata annullata',
};
const prefs = [
  { key: 'nearby_events' as const, title: 'Nuove serate nella tua città', detail: 'Quando qualcuno organizza un evento nella città del tuo profilo.', icon: MapPin },
  { key: 'join_requests' as const, title: 'Richieste ricevute', detail: 'Quando un ballerino chiede di partecipare a una tua serata.', icon: Users },
  { key: 'request_results' as const, title: 'Richieste accettate o rifiutate', detail: 'Quando l’organizzatore risponde a una tua richiesta.', icon: CircleCheck },
  { key: 'event_cancellations' as const, title: 'Serate annullate', detail: 'Se un evento a cui sei iscritto viene annullato.', icon: CalendarDays },
];

type PushCapability = 'needs-install' | 'unsupported' | 'denied' | 'allowed' | 'ready';
function detectPushCapability(): PushCapability {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'unsupported';
  const onIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (onIos && !standalone) return 'needs-install';
  if (!window.isSecureContext || !('Notification' in window)
    || !('PushManager' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.permission === 'granted' ? 'allowed' : 'ready';
}

export function NotificationsPage() {
  const { isLive, profile } = useStore();
  const {
    notices, unreadCount, preferences, status, pushEnabledOnDevice, pushReady, pushPreparationError, error,
    refresh, markRead, markAllRead, setPreference, enablePush, disablePush,
  } = useNotifications();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [localError, setLocalError] = useState('');
  const [pushFeedback, setPushFeedback] = useState('');
  const [filterBusy, setFilterBusy] = useState<string | null>(null);
  const [copyState, setCopyState] = useState('');
  const capability = detectPushCapability();
  const deviceReady = pushEnabledOnDevice && preferences.push_enabled;
  const copySiteLink = () => {
    const address = window.location.origin + '/notifications';
    if (!navigator.clipboard?.writeText) {
      setCopyState('Apri questo indirizzo direttamente in Safari: ' + address);
      return;
    }
    void navigator.clipboard.writeText(address)
      .then(() => setCopyState('Link copiato. Incollalo nella barra degli indirizzi di Safari.'))
      .catch(() => setCopyState('Apri questo indirizzo in Safari: ' + address));
  };
  const visible = tab === 'unread' ? notices.filter(n => !n.read_at) : notices;
  const run = async (fn: () => Promise<void>, action: string, success = '') => {
    setBusyAction(action); setLocalError('');
    try { await fn(); if (success) setPushFeedback(success); }
    catch (issue) { setLocalError(issue instanceof Error ? issue.message : 'Operazione non riuscita.'); }
    finally { setBusyAction(''); }
  };
  return <div className="notice-page">
    <div className="page-intro notice-intro"><p className="eyebrow">RESTA NEL RITMO</p>
      <h1>Le tue <em>notifiche.</em></h1>
      <p>Nuovi eventi, partecipazioni e aggiornamenti dalle tue serate. Tutto in un solo posto.</p></div>
    {isLive && <section className={`notice-activation-guide ${deviceReady ? 'notice-activation-success' : ''}`} aria-label="Attivazione notifiche push">
      <div className="notice-activation-title">
        <span className="notice-activation-icon"><Bell size={22}/></span>
        <div><span className="eyebrow">NOTIFICHE SUL TELEFONO</span>
          <h2>{deviceReady ? 'Notifiche push attive!' : capability === 'needs-install' ? 'Installa Ritmo Social per ricevere le notifiche' : capability === 'denied' ? 'Notifiche bloccate dal dispositivo' : 'Ricevi gli avvisi anche quando l’app è chiusa'}</h2>
          <p>{deviceReady
            ? 'Questo dispositivo è registrato. Riceverai gli avvisi che hai scelto nelle preferenze.'
            : capability === 'needs-install'
              ? 'Su iPhone le notifiche funzionano solo aprendo Ritmo Social dall’icona aggiunta alla schermata Home.'
              : capability === 'denied'
                ? 'Hai già negato il permesso. Abilita Ritmo Social nelle impostazioni delle notifiche del dispositivo.'
                : capability === 'unsupported'
                  ? 'Il browser attuale non permette le notifiche push. Gli avvisi dentro Ritmo Social restano disponibili.'
                  : 'Attiva una volta le notifiche per conoscere subito nuove serate, richieste e conferme.'}</p>
        </div>
      </div>
      {capability === 'needs-install' && !deviceReady && <div className="notice-install-steps">
        <span><strong>1</strong> Apri il sito in Safari.</span>
        <span><strong>2</strong> Premi Condividi e scegli «Aggiungi alla schermata Home».</span>
        <span><strong>3</strong> Apri Ritmo Social dalla nuova icona, poi premi «Attiva notifiche».</span>
        <button type="button" onClick={copySiteLink} className="notice-copy-link"><ArrowUpRight size={16}/> Copia link per Safari</button>
        {copyState && <p className="notice-copy-feedback" role="status">{copyState}</p>}
      </div>}
      {!deviceReady && (capability === 'ready' || capability === 'allowed') && <>
        <button type="button" className="btn btn-primary notice-activation-button"
          disabled={Boolean(busyAction) || !pushReady}
          onClick={() => void run(enablePush, 'push', 'Notifiche push attivate su questo dispositivo!')}>
          <Bell size={17}/> {busyAction === 'push' ? 'Attivazione...' : !pushReady ? 'Preparazione notifiche...' : capability === 'allowed' ? 'Completa attivazione push' : 'Attiva notifiche push'}
        </button>
        {!pushReady && pushPreparationError && <p className="notice-activation-help" role="alert">{pushPreparationError} Riapri questa pagina per riprovare.</p>}
        {!pushReady && !pushPreparationError && <p className="notice-activation-help">Sto preparando il servizio push prima di richiedere il permesso.</p>}
      </>}
      {capability === 'denied' && !deviceReady && <p className="notice-activation-help">Su iPhone: Impostazioni → Notifiche → Ritmo Social → Consenti notifiche. Poi riapri l'app dall'icona Home.</p>}
      {pushFeedback && <p className="notice-success" role="status"><Check size={15}/>{pushFeedback}</p>}
      {localError && <p className="notice-activation-help" role="alert">{localError}</p>}
      {deviceReady && <button type="button" className="notice-settings-link" onClick={() => setSettingsOpen(true)}><Settings2 size={16}/> Gestisci preferenze e dispositivi</button>}
    </section>}
    <div className="notice-top-actions">
      <div className="notice-tabs">
        <button type="button" className={tab === 'all' ? 'selected' : ''} onClick={() => setTab('all')}>Tutte <span>{notices.length}</span></button>
        <button type="button" className={tab === 'unread' ? 'selected' : ''} onClick={() => setTab('unread')}>Da leggere <span>{unreadCount}</span></button>
      </div>
      <div className="notice-action-buttons">
        <button type="button" title="Aggiorna notifiche" aria-label="Aggiorna notifiche" onClick={() => void run(refresh, 'reload')} disabled={Boolean(busyAction)}><RefreshCw size={17}/></button>
        <button type="button" title="Preferenze notifiche" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(v => !v)}><Settings2 size={17}/> <span>Preferenze</span></button>
        <button type="button" disabled={!unreadCount || Boolean(busyAction)} onClick={() => void run(markAllRead, 'read-all')}><CheckCheck size={17}/> <span>Segna tutte come lette</span></button>
      </div>
    </div>
    {(error || localError) && <div className="notice-error" role="alert">{localError || error}</div>}
    <section className="notice-preferences" hidden={!settingsOpen} aria-label="Preferenze notifiche">
      <div className="notice-setting-head"><h2>Personalizza i tuoi avvisi</h2><p>Decidi quali aggiornamenti tenere. Puoi cambiare idea in qualsiasi momento.</p></div>
      {prefs.map(({ key, title, detail, icon: Icon }) => <div className="notice-preference" key={key}>
        <span className="notice-pref-icon"><Icon size={19}/></span>
        <div><strong>{title}</strong><p>{detail}</p></div>
        <label className="notice-switch"><input type="checkbox" checked={preferences[key]} disabled={filterBusy !== null || !isLive} onChange={event => {
          const checked = event.target.checked; setFilterBusy(key); setLocalError('');
          void setPreference(key, checked).catch(err => setLocalError(err instanceof Error ? err.message : 'Impossibile salvare.')).finally(() => setFilterBusy(null));
        }} aria-label={title}/><span aria-hidden="true"/></label>
      </div>)}
      <div className="notice-push-panel">
        <div className="notice-push-main"><span className="notice-push-icon"><Smartphone size={23}/></span>
          <div><strong>Notifiche push sul dispositivo</strong><p>Ricevi gli avvisi anche quando Ritmo Social non è aperto, se il browser lo supporta.</p></div></div>
        <div className="notice-push-buttons">
          {pushEnabledOnDevice && preferences.push_enabled
            ? <button className="btn btn-outline" type="button" disabled={Boolean(busyAction)} onClick={() => void run(disablePush, 'push', 'Notifiche push disattivate su questo dispositivo.')}><BellOff size={16}/> Disattiva push</button>
            : <button className="btn btn-primary" type="button" disabled={Boolean(busyAction) || !isLive || !pushReady || capability === 'needs-install' || capability === 'denied' || capability === 'unsupported'} onClick={() => void run(enablePush, 'push', 'Notifiche push attivate su questo dispositivo!')}><Bell size={16}/> {capability === 'needs-install' ? 'Installa prima l’app' : !pushReady ? 'Preparazione push...' : 'Attiva notifiche push'}</button>}
        </div>
        {pushFeedback && <p className="notice-success" role="status"><Check size={15}/>{pushFeedback}</p>}
        <p className="notice-device-hint"><ShieldCheck size={14}/> Nessuna richiesta automatica di permessi. Su iPhone apri il sito da Safari, premi Condividi → Aggiungi alla schermata Home e avvia Ritmo dall’icona prima di attivare le push.</p>
      </div>
      <p className="notice-city-footnote"><MapPin size={15}/> La zona degli avvisi è attualmente la tua città di profilo: <strong>{profile.city}</strong>. Non usiamo il GPS né la posizione esatta.</p>
    </section>
    {!isLive && <p className="notice-demo-warning"><Bell size={16}/> Nella demo non vengono inviate notifiche reali.</p>}
    {status === 'loading' && <div className="notice-empty"><RefreshCw size={26}/><h3>Caricamento notifiche...</h3></div>}
    {status !== 'loading' && !visible.length && <div className="notice-empty"><Bell size={30}/><h3>{tab === 'unread' ? 'Sei in pari!' : 'Nessuna notifica per ora'}</h3><p>{tab === 'unread' ? 'Hai già letto tutti gli aggiornamenti.' : 'Quando arrivano nuove serate o risposte alle tue richieste, le troverai qui.'}</p><Link to="/explore" className="btn btn-primary">Esplora le serate <ArrowUpRight size={16}/></Link></div>}
    {visible.length > 0 && <div className="notice-feed" aria-label="Elenco notifiche">
      {visible.map(notice => {
        const Icon = notice.kind === 'nearby_event' ? MapPin : notice.kind === 'join_request' ? Users
          : notice.kind === 'request_approved' ? Check : notice.kind === 'request_rejected' ? X : CalendarDays;
        return <Link key={notice.id} to={notice.target_path} className={`notice-card ${notice.read_at ? '' : 'notice-unread'}`}
          onClick={() => { if (!notice.read_at) void markRead(notice.id).catch(() => {}); }}>
          <span className={`notice-card-icon notice-kind-${notice.kind}`}><Icon size={19}/></span>
          <span className="notice-card-copy"><small>{labels[notice.kind]}</small><strong>{notice.title}</strong><span>{notice.body}</span>
            <time dateTime={notice.created_at}><Clock3 size={13}/> {new Date(notice.created_at).toLocaleString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time>
          </span>
          <span className="notice-card-trail">{!notice.read_at && <i aria-label="Non letta"/>}<ArrowUpRight size={17}/></span>
        </Link>;
      })}
    </div>}
    <p className="notice-footer"><Link to="/profile"><ArrowLeft size={15}/> Torna al profilo</Link> Le notifiche più recenti vengono mostrate per prime.</p>
  </div>;
}

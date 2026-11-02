import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';

export type NoticeKind = 'nearby_event' | 'join_request' | 'request_approved' | 'request_rejected' | 'event_canceled';
export type Notice = {
  id: string; kind: NoticeKind; title: string; body: string; target_path: string;
  event_id: string | null; created_at: string; read_at: string | null;
};
export type NoticePreferences = {
  nearby_events: boolean; join_requests: boolean; request_results: boolean;
  event_cancellations: boolean; push_enabled: boolean;
};
type PreferenceKey = 'nearby_events' | 'join_requests' | 'request_results' | 'event_cancellations';
type Status = 'ready' | 'loading' | 'unsupported' | 'needs-install' | 'denied' | 'error';
type NoticeContextValue = {
  notices: Notice[];
  unreadCount: number;
  preferences: NoticePreferences;
  status: Status;
  pushEnabledOnDevice: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setPreference: (key: PreferenceKey, enabled: boolean) => Promise<void>;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
};

const defaults: NoticePreferences = {
  nearby_events: true, join_requests: true, request_results: true,
  event_cancellations: true, push_enabled: false,
};
const NotificationContext = createContext<NoticeContextValue | null>(null);
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const installed = () => window.matchMedia('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const supported = () => typeof window !== 'undefined'
  && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  && window.isSecureContext;
function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const raw = atob((value + '='.repeat((4 - value.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, item => item.charCodeAt(0));
}
function parseNotices(value: unknown): Notice[] {
  if (!Array.isArray(value)) return [];
  return value as Notice[];
}
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { userId, isLive } = useStore();
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [preferences, setPreferences] = useState<NoticePreferences>(defaults);
  const [status, setStatus] = useState<Status>('loading');
  const [devicePush, setDevicePush] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client || !userId) return;
    const [messagesResult, prefsResult] = await Promise.all([
      client.from('user_notifications')
        .select('id,kind,title,body,target_path,event_id,created_at,read_at')
        .order('created_at', { ascending: false }).limit(100),
      client.from('notification_preferences')
        .select('nearby_events,join_requests,request_results,event_cancellations,push_enabled')
        .eq('user_id', userId).single(),
    ]);
    if (currentUser.current !== userId) return;
    if (messagesResult.error) throw new Error(messagesResult.error.message);
    if (prefsResult.error) throw new Error(prefsResult.error.message);
    setNotices(parseNotices(messagesResult.data));
    setPreferences({ ...defaults, ...prefsResult.data });
  }, [userId]);

  useEffect(() => {
    setNotices([]);
    setPreferences(defaults);
    setError(null);
    setDevicePush(false);
    if (!userId || !supabase) { setStatus('ready'); return; }
    const client = supabase;
    let active = true;
    setStatus('loading');
    void refresh().then(() => { if (active) setStatus('ready'); }).catch(err => {
      if (active) { setError(err instanceof Error ? err.message : 'Notifiche non disponibili.'); setStatus('error'); }
    });
    const room = client.channel('ritmo-notices-' + userId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_notifications',
        filter: 'user_id=eq.' + userId,
      }, () => {
        if (active) void refresh().catch(() => {});
      }).subscribe();
    const focus = () => { if (active && !document.hidden) void refresh().catch(() => {}); };
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    if (supported()) {
      void navigator.serviceWorker.getRegistration('/').then(async reg => {
        const subscription = await reg?.pushManager.getSubscription();
        if (!subscription || !active || currentUser.current !== userId) return;
        const { data } = await client.from('push_subscriptions')
          .select('id').eq('user_id', userId).eq('endpoint', subscription.endpoint).maybeSingle();
        if (active && currentUser.current === userId) setDevicePush(Boolean(data));
      }).catch(() => {});
    }
    return () => {
      active = false;
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', focus);
      void client.removeChannel(room);
    };
  }, [userId, refresh]);

  const markRead = useCallback(async (id: string) => {
    if (!supabase || !userId) return;
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('user_notifications')
      .update({ read_at: now }).eq('id', id).eq('user_id', userId);
    if (updateError) throw new Error(updateError.message);
    if (currentUser.current === userId) setNotices(existing => existing.map(n => n.id === id ? { ...n, read_at: now } : n));
  }, [userId]);
  const markAllRead = useCallback(async () => {
    if (!supabase || !userId) return;
    const ids = notices.filter(n => !n.read_at).map(n => n.id);
    if (!ids.length) return;
    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('user_notifications')
      .update({ read_at: now }).eq('user_id', userId).in('id', ids);
    if (updateError) throw new Error(updateError.message);
    if (currentUser.current === userId) setNotices(existing => existing.map(n => ids.includes(n.id) ? { ...n, read_at: now } : n));
  }, [userId, notices]);
  const setPreference = useCallback(async (key: PreferenceKey, enabled: boolean) => {
    if (!supabase || !userId) return;
    const { error: updateError } = await supabase.from('notification_preferences')
      .update({ [key]: enabled }).eq('user_id', userId);
    if (updateError) throw new Error(updateError.message);
    if (currentUser.current === userId) setPreferences(existing => ({ ...existing, [key]: enabled }));
  }, [userId]);

  // Permission requests MUST happen at the start of a direct click handler.
  const enablePush = useCallback(async () => {
    if (!supabase || !userId || !isLive) throw new Error('Accedi per attivare le notifiche.');
    if (isIos() && !installed()) throw new Error('Su iPhone aggiungi Ritmo Social alla schermata Home da Safari, poi aprilo dall’icona.');
    if (!supported()) throw new Error('Questo browser non supporta le notifiche push per Ritmo Social.');
    if (Notification.permission === 'denied') throw new Error('Le notifiche sono bloccate nelle impostazioni del browser. Autorizzale e riprova.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Autorizzazione non concessa. Puoi riattivarla dalle impostazioni del browser.');
    const client = supabase;
    const { data, error: functionError } = await client.functions.invoke('ritmo-web-push', { body: { kind: 'public-key' } });
    if (functionError || typeof data?.publicKey !== 'string') throw new Error('Il servizio push non è disponibile. Riprova più tardi.');
    const worker = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    const ready = await navigator.serviceWorker.ready;
    let subscription = await ready.pushManager.getSubscription();
    if (subscription) {
      const { data: owned } = await client.from('push_subscriptions').select('id')
        .eq('endpoint', subscription.endpoint).eq('user_id', userId).maybeSingle();
      if (!owned) { await subscription.unsubscribe(); subscription = null; }
    }
    if (!subscription) {
      subscription = await ready.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: base64UrlToUint8Array(data.publicKey),
      });
    }
    const raw = subscription.toJSON();
    if (!raw.keys?.auth || !raw.keys.p256dh) throw new Error('Impossibile leggere la registrazione push dal dispositivo.');
    const { data: existing, error: lookupError } = await client.from('push_subscriptions')
      .select('id').eq('user_id', userId).eq('endpoint', subscription.endpoint).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (!existing) {
      const { error: insertError } = await client.from('push_subscriptions')
        .insert({ user_id: userId, endpoint: subscription.endpoint, p256dh: raw.keys.p256dh, auth: raw.keys.auth });
      if (insertError) throw new Error(insertError.message);
    }
    const { error: enabledError } = await client.from('notification_preferences')
      .update({ push_enabled: true }).eq('user_id', userId);
    if (enabledError) throw new Error(enabledError.message);
    if (currentUser.current === userId) {
      setPreferences(previous => ({ ...previous, push_enabled: true }));
      setDevicePush(true);
      setError(null);
    }
    void worker; // Registration persists after the browser tab closes.
  }, [userId, isLive]);
  const disablePush = useCallback(async () => {
    if (!supabase || !userId) return;
    if (supported()) {
      const worker = await navigator.serviceWorker.getRegistration('/');
      const subscription = await worker?.pushManager.getSubscription();
      if (subscription) {
        const { error: deleteError } = await supabase.from('push_subscriptions')
          .delete().eq('endpoint', subscription.endpoint).eq('user_id', userId);
        if (deleteError) throw new Error(deleteError.message);
        await subscription.unsubscribe();
      }
    }
    const { error: settingError } = await supabase.from('notification_preferences')
      .update({ push_enabled: false }).eq('user_id', userId);
    if (settingError) throw new Error(settingError.message);
    if (currentUser.current === userId) {
      setPreferences(previous => ({ ...previous, push_enabled: false }));
      setDevicePush(false);
    }
  }, [userId]);

  const value = useMemo<NoticeContextValue>(() => ({
    notices, unreadCount: notices.filter(n => !n.read_at).length,
    preferences, status, pushEnabledOnDevice: devicePush,
    error, refresh, markRead, markAllRead, setPreference, enablePush, disablePush,
  }), [notices, preferences, status, devicePush, error, refresh, markRead, markAllRead, setPreference, enablePush, disablePush]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
export function useNotifications(): NoticeContextValue {
  const state = useContext(NotificationContext);
  if (!state) throw new Error('NotificationsProvider missing');
  return state;
}

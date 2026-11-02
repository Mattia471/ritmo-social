import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Attendance, ChatMessage, NewEventInput, PrivateVenue, SpotEvent, UserProfile } from '../types';
import { initialDemo, readDemo, resetDemo, saveDemo, type DemoState } from '../data/demo';
import { isLive, supabase } from './supabase';

export type AppStore = DemoState & {
  isLive: boolean;
  loading: boolean;
  userId: string | null;
  pendingEmail: string | null;
  error: string | null;
  clearError: () => void;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  join: (eventId: string) => Promise<void>;
  cancelJoin: (eventId: string) => Promise<void>;
  resolve: (attendanceId: string, status: 'approved' | 'rejected') => Promise<void>;
  simulateApproval: (eventId: string) => void;
  createEvent: (input: NewEventInput) => Promise<string>;
  sendMessage: (eventId: string | null, content: string) => Promise<void>;
  updateProfile: (name: string, city: string, bio: string) => Promise<void>;
  startCheckout: () => Promise<void>;
  restartDemo: () => void;
};

const Context = createContext<AppStore | null>(null);
const optionalError = (error: { message: string } | null): void => { if (error) throw new Error(error.message); };
const shortName = (name: string) => name.split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

const toEvent = (row: Record<string, unknown>, author: Record<string, unknown> | undefined): SpotEvent => ({
  id: String(row.id), hostId: String(row.host_id), hostName: String(author?.display_name || 'Organizzatore'),
  title: String(row.title), description: String(row.description || ''), city: String(row.city), area: String(row.area),
  publicLat: Number(row.public_lat), publicLng: Number(row.public_lng), startsAt: String(row.starts_at), endsAt: String(row.ends_at),
  cover: String(row.cover_url || ''), dances: (row.dances as SpotEvent['dances']) || ['Bachata'], price: Number(row.price || 0),
  maxPeople: Number(row.max_people), approvedCount: Number(row.approved_count || 0), createdAt: String(row.created_at), featured: Boolean(row.featured),
});
const toAttendance = (row: Record<string, unknown>, author: Record<string, unknown> | undefined): Attendance => ({
  id: String(row.id), eventId: String(row.event_id), userId: String(row.user_id), userName: String(author?.display_name || 'Ballerino'),
  status: row.status as Attendance['status'], createdAt: String(row.created_at),
});
const toMessage = (row: Record<string, unknown>, author: Record<string, unknown> | undefined): ChatMessage => ({
  id: String(row.id), eventId: row.event_id ? String(row.event_id) : null, userId: String(row.user_id),
  userName: String(author?.display_name || 'Ballerino'), content: String(row.content), createdAt: String(row.created_at),
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoState>(() => isLive ? initialDemo() : readDemo());
  const [userId, setUserId] = useState<string | null>(isLive ? null : 'me');
  const [loading, setLoading] = useState(isLive);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fail = useCallback((err: unknown): never => {
    const message = err instanceof Error ? err.message : 'Si è verificato un errore. Riprova.';
    setError(message); throw new Error(message);
  }, []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => { if (!isLive) saveDemo(data); }, [data]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    optionalError(authErr);
    if (!user) { setUserId(null); setLoading(false); return; }
    setUserId(user.id);
    const [eventsRes, profilesRes, membershipRes, messagesRes, venueRes, subscriptionRes] = await Promise.all([
      supabase.from('events').select('*').eq('status', 'published').order('starts_at', { ascending: true }),
      supabase.from('profiles').select('id, display_name, city, bio'),
      supabase.from('attendances').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('event_private').select('event_id, address, directions'),
      supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle(),
    ]);
    for (const res of [eventsRes, profilesRes, membershipRes, messagesRes, venueRes, subscriptionRes]) optionalError(res.error);
    const profiles = new Map<string, Record<string, unknown>>((profilesRes.data || []).map(p => [String(p.id), p as Record<string, unknown>]));
    const current = profiles.get(user.id);
    const name = String(current?.display_name || user.email?.split('@')[0] || 'Ballerino');
    setData({
      events: (eventsRes.data || []).map(e => toEvent(e, profiles.get(e.host_id))),
      attendances: (membershipRes.data || []).map(a => toAttendance(a, profiles.get(a.user_id))),
      messages: (messagesRes.data || []).map(m => toMessage(m, profiles.get(m.user_id))).reverse(),
      venues: (venueRes.data || []).map(v => ({ eventId: v.event_id as string, address: v.address as string, directions: v.directions as string })) as PrivateVenue[],
      profile: { id: user.id, name, initials: shortName(name), city: String(current?.city || 'Roma'), bio: String(current?.bio || '') },
      pro: Boolean(subscriptionRes.data && ['active', 'trialing'].includes(subscriptionRes.data.status) && subscriptionRes.data.plan === 'organizer_plus'),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void refresh().catch(err => { if (mounted) { setError(String(err.message)); setLoading(false); } });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) { setUserId(null); setLoading(false); return; }
      // Defer queries outside the auth callback to prevent auth-client deadlocks.
      setTimeout(() => { if (mounted) void refresh().catch(err => setError(String(err.message))); }, 0);
    });
    const realtime = supabase.channel('ritmo-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, () => { if (mounted) void refresh().catch(() => {}); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => { if (mounted) void refresh().catch(() => {}); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { if (mounted) void refresh().catch(() => {}); })
      .subscribe();
    return () => { mounted = false; auth.subscription.unsubscribe(); void supabase.removeChannel(realtime); };
  }, [refresh]);

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return;
    try {
      const { error: signErr } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      optionalError(signErr); setPendingEmail(email); setError(null);
    } catch (err) { fail(err); }
  }, [fail]);
  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: signErr } = await supabase.auth.signOut();
    if (signErr) fail(signErr);
    setUserId(null); setPendingEmail(null);
  }, [fail]);

  const join = useCallback(async (eventId: string) => {
    if (!userId) return;
    if (!supabase) {
      setData(s => ({ ...s, attendances: [...s.attendances, { id: crypto.randomUUID(), eventId, userId, userName: s.profile.name, status: 'pending', createdAt: new Date().toISOString() }] }));
      return;
    }
    try {
      const { error: joinErr } = await supabase.from('attendances').insert({ event_id: eventId, user_id: userId });
      optionalError(joinErr); await refresh();
    } catch (err) { fail(err); }
  }, [userId, refresh, fail]);
  const cancelJoin = useCallback(async (eventId: string) => {
    if (!userId) return;
    if (!supabase) { setData(s => ({ ...s, attendances: s.attendances.filter(a => !(a.eventId === eventId && a.userId === userId)), events: s.events.map(e => e.id === eventId && s.attendances.some(a => a.eventId === eventId && a.userId === userId && a.status === 'approved') ? {...e, approvedCount: Math.max(0, e.approvedCount - 1)} : e) })); return; }
    try {
      const { error: deleteErr } = await supabase.from('attendances').delete().eq('event_id', eventId).eq('user_id', userId);
      optionalError(deleteErr); await refresh();
    } catch (err) { fail(err); }
  }, [userId, refresh, fail]);
  const resolve = useCallback(async (attendanceId: string, status: 'approved' | 'rejected') => {
    if (!supabase) {
      setData(s => {
        const prev = s.attendances.find(a => a.id === attendanceId);
        return { ...s,
          attendances: s.attendances.map(a => a.id === attendanceId ? { ...a, status } : a),
          events: s.events.map(e => e.id === prev?.eventId && prev.status !== 'approved' && status === 'approved' ? { ...e, approvedCount: e.approvedCount + 1 } : e),
        };
      }); return;
    }
    try {
      const { error: updateErr } = await supabase.rpc('resolve_join_request', { p_attendance_id: attendanceId, p_status: status });
      optionalError(updateErr); await refresh();
    } catch (err) { fail(err); }
  }, [refresh, fail]);
  const simulateApproval = useCallback((eventId: string) => {
    if (supabase) return;
    setData(s => ({ ...s, attendances: s.attendances.map(a => a.eventId === eventId && a.userId === 'me' ? { ...a, status: 'approved' } : a), events: s.events.map(e => e.id === eventId && s.attendances.some(a => a.eventId === eventId && a.userId === 'me' && a.status === 'pending') ? { ...e, approvedCount: e.approvedCount + 1 } : e) }));
  }, []);
  const createEvent = useCallback(async (input: NewEventInput): Promise<string> => {
    if (!userId) throw new Error('Devi accedere per creare un evento.');
    if (!supabase) {
      const now = new Date();
      const createdThisMonth = data.events.filter(e => e.hostId === userId && new Date(e.createdAt || e.startsAt).getMonth() === now.getMonth() && new Date(e.createdAt || e.startsAt).getFullYear() === now.getFullYear()).length;
      if (!data.pro && createdThisMonth >= 2) throw new Error('Limite Free raggiunto: massimo 2 eventi creati al mese.');
      const id = crypto.randomUUID();
      setData(s => ({ ...s, events: [{ ...input, id, hostId: userId, hostName: s.profile.name, approvedCount: 0, createdAt: new Date().toISOString() }, ...s.events], venues: [...s.venues, { eventId: id, address: input.address, directions: input.directions }] }));
      return id;
    }
    try {
      const { data: createdId, error: createErr } = await supabase.rpc('create_social_event', {
        p_title: input.title, p_description: input.description, p_city: input.city, p_area: input.area,
        p_public_lat: input.publicLat, p_public_lng: input.publicLng, p_starts_at: input.startsAt,
        p_ends_at: input.endsAt, p_cover_url: input.cover, p_dances: input.dances,
        p_price: input.price, p_max_people: input.maxPeople, p_address: input.address, p_directions: input.directions,
      });
      optionalError(createErr); await refresh(); return createdId as string;
    } catch (err) { return fail(err); }
  }, [userId, data.events, data.pro, refresh, fail]);
  const sendMessage = useCallback(async (eventId: string | null, content: string) => {
    const safeText = content.trim().slice(0, 1200);
    if (!safeText || !userId) return;
    if (!supabase) { setData(s => ({ ...s, messages: [...s.messages, { id: crypto.randomUUID(), eventId, userId, userName: s.profile.name, content: safeText, createdAt: new Date().toISOString() }] })); return; }
    try {
      const { error: sendErr } = await supabase.from('chat_messages').insert({ event_id: eventId, user_id: userId, content: safeText });
      optionalError(sendErr); await refresh();
    } catch (err) { fail(err); }
  }, [userId, refresh, fail]);
  const updateProfile = useCallback(async (name: string, city: string, bio: string) => {
    const safeName = name.trim().slice(0, 64); if (!safeName) throw new Error('Inserisci un nome.');
    if (!supabase) {
      setData(s => ({ ...s, profile: { ...s.profile, name: safeName, initials: shortName(safeName), city, bio },
        attendances: s.attendances.map(a => a.userId === 'me' ? { ...a, userName: safeName } : a),
        messages: s.messages.map(m => m.userId === 'me' ? { ...m, userName: safeName } : m),
      })); return;
    }
    if (!userId) return;
    try {
      const { error: saveErr } = await supabase.from('profiles').update({ display_name: safeName, city, bio }).eq('id', userId);
      optionalError(saveErr); await refresh();
    } catch (err) { fail(err); }
  }, [userId, refresh, fail]);
  const startCheckout = useCallback(async () => {
    if (!supabase) throw new Error('La demo non addebita denaro. Configura Supabase e Stripe per attivare il pagamento.');
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Accedi per attivare il piano.');
      const { data: result, error: fnErr } = await supabase.functions.invoke('create-checkout', { body: {} });
      optionalError(fnErr);
      if (!result?.url || !String(result.url).startsWith('https://checkout.stripe.com/')) throw new Error('Checkout non disponibile. Verifica la configurazione Stripe.');
      window.location.assign(result.url);
    } catch (err) { fail(err); }
  }, [fail]);
  const restartDemo = useCallback(() => { if (supabase) return; resetDemo(); setData(initialDemo()); }, []);

  const value = useMemo<AppStore>(() => ({ ...data, isLive, loading, userId, pendingEmail, error, clearError, signIn, signOut, refresh, join, cancelJoin, resolve, simulateApproval, createEvent, sendMessage, updateProfile, startCheckout, restartDemo }), [data, loading, userId, pendingEmail, error, clearError, signIn, signOut, refresh, join, cancelJoin, resolve, simulateApproval, createEvent, sendMessage, updateProfile, startCheckout, restartDemo]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useStore = (): AppStore => {
  const context = useContext(Context);
  if (!context) throw new Error('StoreProvider missing');
  return context;
};

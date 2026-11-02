import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Attendance, ChatMessage, Dance, NewEventInput, PrivateVenue, SignupInput, SpotEvent } from '../types';
import { initialDemo, readDemo, resetDemo, saveDemo, type DemoState } from '../data/demo';
import { isLive, supabase } from './supabase';

export type AppStore = DemoState & {
  isLive: boolean;
  loading: boolean;
  userId: string | null;
  pendingEmail: string | null;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignupInput) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  join: (eventId: string) => Promise<void>;
  cancelJoin: (eventId: string) => Promise<void>;
  resolve: (attendanceId: string, status: 'approved' | 'rejected') => Promise<void>;
  simulateApproval: (eventId: string) => void;
  createEvent: (input: NewEventInput) => Promise<string>;
  sendMessage: (eventId: string | null, content: string) => Promise<void>;
  reportMessage: (messageId: string, reason: 'spam' | 'harassment' | 'hate' | 'privacy' | 'other', note: string) => Promise<void>;
  loadChatMessages: (eventId: string | null) => Promise<void>;
  blockedUsers: Array<{ id: string; name: string }>;
  blockUser: (memberId: string) => Promise<void>;
  unblockUser: (memberId: string) => Promise<void>;
  updateProfile: (name: string, city: string, bio: string, dances?: Dance[], yearsExperience?: number) => Promise<void>;
  restartDemo: () => void;
};

const Context = createContext<AppStore | null>(null);
const optionalError = (error: { message: string } | null): void => { if (error) throw new Error(error.message); };
const explainError = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : 'Si è verificato un errore. Riprova.';
  if (/email rate limit exceeded|email rate limit|over_email_send_rate_limit/i.test(raw))
    return 'Limite temporaneo delle email raggiunto. Riprova più tardi: il servizio di prova Supabase consente pochi invii.';
  if (/invalid login credentials/i.test(raw)) return 'Email o password non corrette.';
  if (/email not confirmed/i.test(raw)) return 'Devi ancora confermare la tua email. Controlla la posta e lo spam.';
  if (/user already registered/i.test(raw)) return 'Questa email risulta già registrata. Prova ad accedere.';
  if (/duplicate key.*message_reports|message_reports_reporter_id_message_id_key/i.test(raw)) return 'Hai già segnalato questo messaggio.';
  return raw;
};
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
  const [data, setData] = useState<DemoState>(() => { const saved = isLive ? { ...initialDemo(), events: [], attendances: [], messages: [], venues: [], profile: { ...initialDemo().profile, name: 'Ballerino', initials: 'BA', dances: [], yearsExperience: 0 } } : readDemo(); return { ...saved, profile: { ...saved.profile, dances: saved.profile.dances || [], yearsExperience: saved.profile.yearsExperience ?? 0 } }; });
  const [userId, setUserId] = useState<string | null>(isLive ? null : 'me');
  const [loading, setLoading] = useState(isLive);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; name: string }>>([]);
  // Invalidate requests started by a previous session before they can update UI.
  const sessionRevision = useRef(0);
  // Live conversations are loaded per room. Avoid fetching every private room
  // on each unrelated event/attendance refresh.
  const emptyLiveChats = () => ({
    events: [], attendances: [], messages: [], venues: [],
    // Never show the previous account's profile after logout or session expiry.
    profile: { id: '', name: 'Ballerino', initials: 'BA', city: 'Roma', bio: '', dances: [] as Dance[], yearsExperience: 0 },
    pro: false,
  });
  const fail = useCallback((err: unknown): never => {
    const message = explainError(err);
    setError(message); throw new Error(message);
  }, []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => { if (!isLive) saveDemo(data); }, [data]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const revision = sessionRevision.current;
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    optionalError(authErr);
    if (revision !== sessionRevision.current) return;
    if (!user) { setBlockedUsers([]); setUserId(null); setData(s => ({ ...s, ...emptyLiveChats() })); setLoading(false); return; }
    setUserId(user.id);
    const [eventsRes, profilesRes, membershipRes, venueRes, blocksRes] = await Promise.all([
      supabase.from('events').select('*').eq('status', 'published').order('starts_at', { ascending: true }),
      supabase.from('profiles').select('id, display_name, city, bio, dances, years_experience'),
      supabase.from('attendances').select('*').order('created_at', { ascending: false }),
      supabase.from('event_private').select('event_id, address, directions'),
      supabase.from('user_blocks').select('blocked_id'),
    ]);
    if (revision !== sessionRevision.current) return;
    for (const res of [eventsRes, profilesRes, membershipRes, venueRes, blocksRes]) optionalError(res.error);
    const profiles = new Map<string, Record<string, unknown>>((profilesRes.data || []).map(p => [String(p.id), p as Record<string, unknown>]));
    const current = profiles.get(user.id);
    setBlockedUsers((blocksRes.data || []).map(block => ({ id: String(block.blocked_id), name: String(profiles.get(String(block.blocked_id))?.display_name || 'Utente') })));
    const name = String(current?.display_name || user.email?.split('@')[0] || 'Ballerino');
    setData(s => ({
      events: (eventsRes.data || []).map(e => toEvent(e, profiles.get(e.host_id))),
      attendances: (membershipRes.data || []).map(a => toAttendance(a, profiles.get(a.user_id))),
      messages: s.messages,
      venues: (venueRes.data || []).map(v => ({ eventId: v.event_id as string, address: v.address as string, directions: v.directions as string })) as PrivateVenue[],
      profile: { id: user.id, name, initials: shortName(name), city: String(current?.city || 'Roma'), bio: String(current?.bio || ''), dances: Array.isArray(current?.dances) ? current.dances as Dance[] : [], yearsExperience: Number(current?.years_experience || 0) },
      pro: false,
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void refresh().catch(err => { if (mounted) { setError(String(err.message)); setLoading(false); } });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      sessionRevision.current += 1;
      if (!session) { setBlockedUsers([]); setUserId(null); setData(s => ({ ...s, ...emptyLiveChats() })); setLoading(false); return; }
      // Defer queries outside the auth callback to prevent auth-client deadlocks.
      setTimeout(() => { if (mounted) void refresh().catch(err => setError(String(err.message))); }, 0);
    });
    const realtime = supabase.channel('ritmo-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, () => { if (mounted) void refresh().catch(() => {}); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { if (mounted) void refresh().catch(() => {}); })
      .subscribe();
    return () => { mounted = false; auth.subscription.unsubscribe(); void supabase?.removeChannel(realtime); };
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Autenticazione reale non configurata.');
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      optionalError(signErr); setError(null); await refresh();
    } catch (err) { fail(err); }
  }, [fail, refresh]);
  const signUp = useCallback(async (input: SignupInput) => {
    if (!supabase) throw new Error('Registrazione disponibile solo quando il database sarà collegato.');
    const firstName = input.firstName.trim().slice(0, 40);
    const lastName = input.lastName.trim().slice(0, 40);
    const phone = input.phone.replace(/[\s().-]/g, '');
    if (!firstName || !lastName || !/^\+[1-9]\d{6,14}$/.test(phone)) throw new Error('Inserisci nome, cognome e un numero internazionale (es. +393331234567).');
    if (input.dances.length < 1 || !Number.isInteger(input.yearsExperience) || input.yearsExperience < 0 || input.yearsExperience > 50) throw new Error('Seleziona almeno un ballo e gli anni di esperienza.');
    if (input.password.length < 8) throw new Error('La password deve contenere almeno 8 caratteri.');
    try {
      // The auth trigger saves non-secret profile metadata; the password remains inside Supabase Auth.
      const { data: registered, error: signErr } = await supabase.auth.signUp({ email: input.email.trim().toLowerCase(), password: input.password, options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName, last_name: lastName, phone, city: input.city, dances: input.dances, years_experience: input.yearsExperience },
      } });
      optionalError(signErr);
      if (!registered.session) setPendingEmail(input.email.trim().toLowerCase());
      else await refresh();
      setError(null);
    } catch (err) { fail(err); }
  }, [fail, refresh]);
  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Recupero password non configurato.');
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      optionalError(resetErr); setPendingEmail(email.trim());
    } catch (err) { fail(err); }
  }, [fail]);
  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: signErr } = await supabase.auth.signOut();
    if (signErr) fail(signErr);
    sessionRevision.current += 1;
    setBlockedUsers([]); setUserId(null); setPendingEmail(null);
    setData(s => ({ ...s, ...emptyLiveChats() }));
  }, [fail]);

  const join = useCallback(async (eventId: string) => {
    if (!userId) return;
    if (!supabase) {
      const event = data.events.find(e => e.id === eventId);
      if (!event) return fail(new Error('Serata non trovata.'));
      if (event.hostId === userId) return fail(new Error('Non puoi iscriverti alla tua serata.'));
      if (new Date(event.startsAt).getTime() <= Date.now()) return fail(new Error('Questa serata è già iniziata.'));
      if (event.approvedCount >= event.maxPeople) return fail(new Error('Tutti i posti sono occupati.'));
      // Check the latest state too: rapid repeated taps must never duplicate a request.
      setData(s => s.attendances.some(a => a.eventId === eventId && a.userId === userId)
        ? s
        : ({ ...s, attendances: [...s.attendances, { id: crypto.randomUUID(), eventId, userId, userName: s.profile.name, status: 'pending', createdAt: new Date().toISOString() }] }));
      return;
    }
    try {
      const { error: joinErr } = await supabase.from('attendances').insert({ event_id: eventId, user_id: userId });
      optionalError(joinErr); await refresh();
    } catch (err) { fail(err); }
  }, [userId, data.events, refresh, fail]);
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
      const request = data.attendances.find(a => a.id === attendanceId);
      const event = data.events.find(e => e.id === request?.eventId);
      if (!request || !event || request.status !== 'pending') return fail(new Error('Richiesta non più disponibile.'));
      if (event.hostId !== userId) return fail(new Error('Solo chi organizza può gestire le richieste.'));
      if (status === 'approved' && event.approvedCount >= event.maxPeople) return fail(new Error('Capienza raggiunta: non puoi approvare altri partecipanti.'));
      setData(s => ({ ...s,
        attendances: s.attendances.map(a => a.id === attendanceId ? { ...a, status } : a),
        events: s.events.map(e => e.id === request.eventId && status === 'approved' ? { ...e, approvedCount: e.approvedCount + 1 } : e),
      })); return;
    }
    try {
      const { error: updateErr } = await supabase.rpc('resolve_join_request', { p_attendance_id: attendanceId, p_status: status });
      optionalError(updateErr); await refresh();
    } catch (err) { fail(err); }
  }, [data.attendances, data.events, userId, refresh, fail]);
  const simulateApproval = useCallback((eventId: string) => {
    if (supabase) return;
    const event = data.events.find(e => e.id === eventId);
    if (event && event.approvedCount >= event.maxPeople) {
      setError('Capienza raggiunta: non puoi simulare altre approvazioni.'); return;
    }
    setData(s => ({ ...s, attendances: s.attendances.map(a => a.eventId === eventId && a.userId === 'me' && a.status === 'pending' ? { ...a, status: 'approved' } : a), events: s.events.map(e => e.id === eventId && s.attendances.some(a => a.eventId === eventId && a.userId === 'me' && a.status === 'pending') ? { ...e, approvedCount: e.approvedCount + 1 } : e) }));
  }, [data.events]);
  const createEvent = useCallback(async (input: NewEventInput): Promise<string> => {
    if (!userId) throw new Error('Devi accedere per creare un evento.');
    if (!supabase) {
      const createdToday = data.events.filter(e => e.hostId === userId && e.id !== 'own-1' && new Date(e.createdAt || e.startsAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length;
      if (createdToday >= 10) throw new Error('Limite anti-spam raggiunto: massimo 10 eventi in 24 ore.');
      const id = crypto.randomUUID();
      const { address, directions, ...publicEvent } = input;
      setData(s => ({ ...s, events: [{ ...publicEvent, id, hostId: userId, hostName: s.profile.name, approvedCount: 0, createdAt: new Date().toISOString() }, ...s.events], venues: [...s.venues, { eventId: id, address, directions }] }));
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
  }, [userId, data.events, refresh, fail]);
  const loadChatMessages = useCallback(async (eventId: string | null) => {
    if (!supabase || !userId) return;
    const revision = sessionRevision.current;
    // The database enforces room membership with RLS. Load only the latest
    // messages for the current conversation; never truncate across all rooms.
    let query = supabase.from('chat_messages')
      .select('id, event_id, user_id, content, created_at, author:profiles!chat_messages_user_id_fkey(display_name)')
      .order('created_at', { ascending: false }).limit(100);
    query = eventId === null ? query.is('event_id', null) : query.eq('event_id', eventId);
    const { data: rows, error: loadErr } = await query;
    optionalError(loadErr);
    if (revision !== sessionRevision.current) return;
    const loaded = (rows || []).map(row => {
      const author = Array.isArray(row.author) ? row.author[0] : row.author;
      return toMessage(row, author as Record<string, unknown> | undefined);
    }).reverse();
    setData(s => ({
      ...s,
      messages: [...s.messages.filter(msg => msg.eventId !== eventId), ...loaded]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
  }, [userId]);

  const sendMessage = useCallback(async (eventId: string | null, content: string) => {
    const revision = sessionRevision.current;
    const safeText = content.trim().slice(0, 1200);
    if (!safeText) throw new Error('Scrivi un messaggio prima di inviarlo.');
    if (!userId) throw new Error('Accedi per inviare un messaggio.');
    if (!supabase) {
      setData(s => ({ ...s, messages: [...s.messages, { id: crypto.randomUUID(), eventId, userId, userName: s.profile.name, content: safeText, createdAt: new Date().toISOString() }] }));
      return;
    }
    try {
      const { data: inserted, error: sendErr } = await supabase.from('chat_messages')
        .insert({ event_id: eventId, user_id: userId, content: safeText })
        .select('id, event_id, user_id, content, created_at').single();
      optionalError(sendErr);
      if (revision !== sessionRevision.current) return;
      if (inserted) setData(s => ({
        ...s,
        messages: s.messages.some(msg => msg.id === inserted.id) ? s.messages : [...s.messages, toMessage(inserted, { display_name: s.profile.name })]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      }));
    } catch (err) { fail(err); }
  }, [userId, fail]);
  const reportMessage = useCallback(async (messageId: string, reason: 'spam' | 'harassment' | 'hate' | 'privacy' | 'other', note: string) => {
    if (!supabase || !userId) throw new Error('Le segnalazioni sono disponibili solo per gli account connessi.');
    try {
      const { error: reportErr } = await supabase.from('message_reports')
        .insert({ reporter_id: userId, message_id: messageId, reason, note: note.trim().slice(0, 500) });
      optionalError(reportErr);
    } catch (err) { fail(err); }
  }, [userId, fail]);

  const blockUser = useCallback(async (memberId: string) => {
    if (!supabase || !userId) throw new Error('Accedi per bloccare una persona.');
    if (!memberId || memberId === userId) throw new Error('Non puoi bloccare questo account.');
    try {
      const { error: blockErr } = await supabase.from('user_blocks')
        .insert({ blocker_id: userId, blocked_id: memberId });
      optionalError(blockErr);
      // Hide already-loaded content immediately, before any Realtime event.
      setData(s => ({ ...s, messages: s.messages.filter(message => message.userId !== memberId) }));
      await refresh();
    } catch (err) { fail(err); }
  }, [userId, refresh, fail]);
  const unblockUser = useCallback(async (memberId: string) => {
    if (!supabase || !userId) throw new Error('Accedi per sbloccare una persona.');
    try {
      const { error: unblockErr } = await supabase.from('user_blocks')
        .delete().eq('blocker_id', userId).eq('blocked_id', memberId);
      optionalError(unblockErr);
      await refresh();
    } catch (err) { fail(err); }
  }, [userId, refresh, fail]);

  const updateProfile = useCallback(async (name: string, city: string, bio: string, dances?: Dance[], yearsExperience?: number) => {
    const safeName = name.trim().slice(0, 64); if (!safeName) throw new Error('Inserisci un nome.');
    if (!supabase) {
      setData(s => ({ ...s, profile: { ...s.profile, name: safeName, initials: shortName(safeName), city, bio, dances: dances ?? s.profile.dances, yearsExperience: yearsExperience ?? s.profile.yearsExperience },
        attendances: s.attendances.map(a => a.userId === 'me' ? { ...a, userName: safeName } : a),
        messages: s.messages.map(m => m.userId === 'me' ? { ...m, userName: safeName } : m),
      })); return;
    }
    if (!userId) return;
    try {
      const { error: saveErr } = await supabase.from('profiles').update({ display_name: safeName, city, bio, ...(dances ? { dances } : {}), ...(yearsExperience !== undefined ? { years_experience: yearsExperience } : {}) }).eq('id', userId).select('id').single();
      optionalError(saveErr); await refresh();
    } catch (err) { fail(err); }
  }, [userId, refresh, fail]);
  const restartDemo = useCallback(() => { if (supabase) return; resetDemo(); setData(initialDemo()); }, []);

  const value = useMemo<AppStore>(() => ({ ...data, blockedUsers, blockUser, unblockUser, isLive, loading, userId, pendingEmail, error, clearError, signIn, signUp, resetPassword, signOut, refresh, join, cancelJoin, resolve, simulateApproval, createEvent, sendMessage, reportMessage, loadChatMessages, updateProfile, restartDemo }), [data, blockedUsers, blockUser, unblockUser, loading, userId, pendingEmail, error, clearError, signIn, signUp, resetPassword, signOut, refresh, join, cancelJoin, resolve, simulateApproval, createEvent, sendMessage, reportMessage, loadChatMessages, updateProfile, restartDemo]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useStore = (): AppStore => {
  const context = useContext(Context);
  if (!context) throw new Error('StoreProvider missing');
  return context;
};

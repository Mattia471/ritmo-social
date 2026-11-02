import { CITY_AREAS, COVER_IMAGES, type SpotEvent, type Attendance, type ChatMessage, type PrivateVenue, type UserProfile } from '../types';

export type DemoState = { events: SpotEvent[]; attendances: Attendance[]; messages: ChatMessage[]; venues: PrivateVenue[]; profile: UserProfile; pro: boolean };
const slot = (daysFromNow: number, hour: number) => {
  const d = new Date(); d.setDate(d.getDate() + daysFromNow); d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const next = (weekday: number, hour: number, weekOffset = 0) => {
  const d = new Date(); let delta = (weekday - d.getDay() + 7) % 7; if (delta === 0 && d.getHours() >= hour) delta = 7;
  return slot(delta + weekOffset * 7, hour);
};
const area = (city: string, name: string) => CITY_AREAS[city].find(a => a.name === name)!;
const event = (id: string, title: string, hostName: string, city: string, zone: string, date: string, cover: number, dances: SpotEvent['dances'], price: number, people: number, description: string, featured = false): SpotEvent => {
  const a = area(city, zone);
  return { id, title, hostId: id === 'own-1' ? 'me' : `host-${id}`, hostName, city, area: zone, publicLat: a.lat, publicLng: a.lng, startsAt: date, endsAt: new Date(new Date(date).getTime() + 4 * 3600000).toISOString(), cover: COVER_IMAGES[cover], dances, price, maxPeople: 55, approvedCount: people, createdAt: new Date().toISOString(), description, featured };
};
export function initialDemo(): DemoState {
  return {
    profile: { id: 'me', name: 'Mattia', initials: 'MC', city: 'Roma', bio: 'Bachata lover. Sempre pronto per una social! 💃' }, pro: false,
    events: [
      event('e1', 'Bachata under the stars', 'Sofia R.', 'Roma', 'Trastevere', next(5, 22), 0, ['Bachata', 'Salsa'], 10, 28, 'Una notte di connessione, musica e sorrisi. Social aperta a tutti i livelli, vieni anche da solo!', true),
      event('e2', 'Salsa & Sunset Social', 'Marco D.', 'Roma', 'Ostiense', next(6, 21), 1, ['Salsa', 'Bachata'], 8, 39, 'Cuba, New York e un pizzico di magia. DJ set con i migliori brani salsa e qualche sorpresa.', true),
      event('e3', 'Bachata Flow Night', 'Giulia P.', 'Roma', 'Pigneto', next(4, 21), 2, ['Bachata'], 0, 17, 'Un social tra amici per conoscere nuovi ballerini. Dress code: come ti senti meglio.'),
      event('e4', 'Kizomba Connection', 'Luis F.', 'Roma', 'Eur', next(6, 22, 1), 3, ['Kizomba', 'Bachata'], 12, 24, 'Musica, rispetto e tanta connessione. Un ambiente inclusivo per ballare senza pressioni.'),
      event('e5', 'Domingo Latino', 'Elena B.', 'Roma', 'San Lorenzo', next(0, 19, 1), 4, ['Salsa', 'Merengue'], 6, 32, 'Il modo perfetto per salutare il weekend a ritmo latino.'),
      event('e6', 'Bachata in città', 'Antonio S.', 'Roma', 'Monte Mario', next(5, 21, 1), 0, ['Bachata'], 5, 14, 'Serata raccolta per fare nuove amicizie e ballare fino a tardi.'),
      event('own-1', 'Social friends & ritmo', 'Mattia', 'Roma', 'Tiburtina', next(6, 20, 1), 1, ['Bachata', 'Salsa'], 0, 8, 'Una serata aperta a chi vuole conoscere nuovi amici e divertirsi.'),
      event('e7', 'Napoli Latin Rooftop', 'Francesca M.', 'Napoli', 'Vomero', next(6, 21), 3, ['Bachata', 'Salsa'], 9, 22, 'Sul rooftop tra musica latina e vista mozzafiato.'),
      event('e8', 'Milano Social Club', 'Andrea T.', 'Milano', 'Navigli', next(5, 21), 2, ['Bachata', 'Kizomba'], 12, 30, 'La community incontra la pista da ballo.'),
    ],
    venues: [
      { eventId: 'e1', address: 'Via della Lungaretta 77, Roma', directions: 'Ingresso laterale, chiedi del gruppo Ritmo.' },
      { eventId: 'e2', address: 'Via del Porto Fluviale 35, Roma', directions: 'Primo piano, sala grande.' },
      { eventId: 'e3', address: 'Via del Pigneto 48, Roma', directions: 'Ingresso sul cortile.' },
      { eventId: 'e4', address: 'Viale Europa 145, Roma', directions: 'Sala al piano -1.' },
      { eventId: 'e5', address: 'Via dei Volsci 34, Roma', directions: 'Al banco chiedi della serata social.' },
      { eventId: 'e6', address: 'Via Trionfale 7200, Roma', directions: 'Ingresso sul retro.' },
      { eventId: 'own-1', address: 'Via Tiburtina 320, Roma', directions: 'Piano terra, porta a sinistra.' },
      { eventId: 'e7', address: 'Via Luca Giordano 12, Napoli', directions: 'Quinto piano.' },
      { eventId: 'e8', address: 'Alzaia Naviglio Grande 24, Milano', directions: 'Ingresso cortile.' },
    ],
    attendances: [
      { id: 'a1', eventId: 'e2', userId: 'me', userName: 'Mattia', status: 'approved', createdAt: slot(-2, 12) },
      { id: 'a2', eventId: 'e1', userId: 'me', userName: 'Mattia', status: 'pending', createdAt: slot(-1, 10) },
      { id: 'a3', eventId: 'own-1', userId: 'u3', userName: 'Chiara', status: 'pending', createdAt: slot(-1, 14) },
      { id: 'a4', eventId: 'own-1', userId: 'u4', userName: 'Luca', status: 'pending', createdAt: slot(-1, 15) },
      { id: 'a5', eventId: 'own-1', userId: 'u5', userName: 'Camilla', status: 'approved', createdAt: slot(-1, 12) },
    ],
    messages: [
      { id: 'm1', eventId: null, userId: 'u1', userName: 'Sofia', content: 'Ciao ballerini! 💃 Chi c’è venerdì a Roma?', createdAt: slot(-1, 19) },
      { id: 'm2', eventId: null, userId: 'u2', userName: 'Marco', content: 'Io! Cerco anche qualcuno per fare due passi prima della social 😄', createdAt: slot(-1, 19) },
      { id: 'm3', eventId: null, userId: 'u3', userName: 'Chiara', content: 'Qualche evento con tanta bachata questa settimana?', createdAt: slot(0, 10) },
      { id: 'm4', eventId: 'e2', userId: 'u2', userName: 'Marco', content: 'Benvenuti! Ci vediamo sabato 🔥', createdAt: slot(-1, 17) },
      { id: 'm5', eventId: 'e2', userId: 'u3', userName: 'Chiara', content: 'Io arrivo verso le 21:30!', createdAt: slot(-1, 18) },
      { id: 'm6', eventId: 'own-1', userId: 'u5', userName: 'Camilla', content: 'Non vedo l’ora! 🎶', createdAt: slot(-1, 18) },
    ],
  };
}

const KEY = 'ritmo-social-demo-v1';
export const readDemo = (): DemoState => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      // Migrate old demo snapshots that embedded the private address in public event objects.
      parsed.events = (parsed.events || []).map(event => { const publicEvent = { ...event } as SpotEvent & { address?: string; directions?: string }; delete publicEvent.address; delete publicEvent.directions; return publicEvent; });
      return parsed;
    }
  } catch { /* Storage disabled: ephemeral demo */ }
  return initialDemo();
};
export const saveDemo = (state: DemoState) => {
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* no-op */ }
};
export const resetDemo = () => { window.localStorage.removeItem(KEY); };

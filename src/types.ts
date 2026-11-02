export type Dance = 'Bachata' | 'Salsa' | 'Kizomba' | 'Merengue';
export type JoinStatus = 'pending' | 'approved' | 'rejected';
export type Tab = 'home' | 'explore' | 'chats' | 'my-events' | 'profile';

export type UserProfile = { id: string; name: string; initials: string; city: string; bio: string };
export type SpotEvent = {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  city: string;
  area: string;
  publicLat: number;
  publicLng: number;
  startsAt: string;
  endsAt: string;
  cover: string;
  dances: Dance[];
  price: number;
  maxPeople: number;
  approvedCount: number;
  createdAt?: string;
  featured?: boolean;
};
export type PrivateVenue = { eventId: string; address: string; directions: string };
export type Attendance = { id: string; eventId: string; userId: string; userName: string; status: JoinStatus; createdAt: string };
export type ChatMessage = { id: string; eventId: string | null; userId: string; userName: string; content: string; createdAt: string };
export type UserLocation = { name: string; lat: number; lng: number };
export type NewEventInput = Omit<SpotEvent, 'id' | 'hostId' | 'hostName' | 'approvedCount' | 'featured'> & { address: string; directions: string };

export const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
];

export const CITY_AREAS: Record<string, { name: string; lat: number; lng: number }[]> = {
  Roma: [
    { name: 'Trastevere', lat: 41.889, lng: 12.469 },
    { name: 'San Lorenzo', lat: 41.898, lng: 12.516 },
    { name: 'Ostiense', lat: 41.862, lng: 12.481 },
    { name: 'Pigneto', lat: 41.889, lng: 12.533 },
    { name: 'Monte Mario', lat: 41.941, lng: 12.442 },
    { name: 'Eur', lat: 41.831, lng: 12.469 },
    { name: 'Tiburtina', lat: 41.911, lng: 12.540 },
    { name: 'Centro', lat: 41.900, lng: 12.490 },
  ],
  Napoli: [
    { name: 'Vomero', lat: 40.844, lng: 14.228 },
    { name: 'Chiaia', lat: 40.831, lng: 14.232 },
    { name: 'Centro storico', lat: 40.850, lng: 14.257 },
    { name: 'Fuorigrotta', lat: 40.823, lng: 14.191 },
  ],
  Milano: [
    { name: 'Navigli', lat: 45.451, lng: 9.174 },
    { name: 'Isola', lat: 45.489, lng: 9.186 },
    { name: 'Porta Romana', lat: 45.452, lng: 9.200 },
  ],
  Bologna: [
    { name: 'Centro', lat: 44.494, lng: 11.342 },
    { name: 'Bolognina', lat: 44.511, lng: 11.348 },
  ],
  Firenze: [
    { name: 'Centro', lat: 43.771, lng: 11.255 },
    { name: 'Novoli', lat: 43.790, lng: 11.226 },
  ],
};
export const DEFAULT_LOCATION: UserLocation = { name: 'Roma', lat: 41.900, lng: 12.490 };

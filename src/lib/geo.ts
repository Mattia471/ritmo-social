import { CITY_AREAS, type UserLocation } from '../types';

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}
export const cityCenter = (city: string): UserLocation => {
  const locations = CITY_AREAS[city] || CITY_AREAS.Roma;
  return { name: city, lat: locations.reduce((sum, a) => sum + a.lat, 0) / locations.length, lng: locations.reduce((sum, a) => sum + a.lng, 0) / locations.length };
};
export const prettyDate = (date: string) => new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(date));
export const tinyDate = (date: string) => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(new Date(date));
export const clock = (date: string) => new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
export const isUpcoming = (date: string) => new Date(date).getTime() > Date.now();

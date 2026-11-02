import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import type { SpotEvent, UserLocation } from '../types';

function FollowCenter({ center }: { center: UserLocation }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng], map.getZoom(), { animate: true }); }, [map, center.lat, center.lng]);
  return null;
}
export function ExploreMap({ events, location, radius }: { events: SpotEvent[]; location: UserLocation; radius: number }) {
  const navigate = useNavigate();
  return <div className="explore-map" aria-label="Mappa delle zone approssimative degli eventi">
    <MapContainer center={[location.lat, location.lng]} zoom={radius <= 10 ? 12 : radius <= 25 ? 11 : 10} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
      <FollowCenter center={location}/>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <Circle center={[location.lat, location.lng]} radius={radius * 1000} pathOptions={{ color: '#737cff', weight: 1.5, fillColor: '#737cff', fillOpacity: .065, dashArray: '6 5' }}/>
      <CircleMarker center={[location.lat, location.lng]} radius={7} pathOptions={{ color: '#fff', fillColor: '#8b73ff', fillOpacity: 1, weight: 3 }}><Tooltip>Il tuo punto di ricerca</Tooltip></CircleMarker>
      {events.map(e => <CircleMarker key={e.id} center={[e.publicLat, e.publicLng]} radius={12} pathOptions={{ color: '#22232d', fillColor: '#d6fc6c', fillOpacity: 1, weight: 3 }} eventHandlers={{ click: () => navigate(`/event/${e.id}`) }}><Tooltip direction="top">{e.title} · {e.area} (zona indicativa)</Tooltip></CircleMarker>)}
    </MapContainer>
    <span className="map-note"> <span className="note-dot"/> Le posizioni sono indicative, non i locali precisi</span>
  </div>;
}

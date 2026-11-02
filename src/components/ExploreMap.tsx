import { useEffect, useMemo, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, LockKeyhole, MapPin, X } from 'lucide-react';
import { clock, tinyDate } from '../lib/geo';
import type { Dance, SpotEvent, UserLocation } from '../types';

const danceTone: Record<Dance, { color: string; symbol: string }> = {
  Bachata: { color: '#ff7196', symbol: 'B' },
  Salsa: { color: '#ffbc70', symbol: 'S' },
  Kizomba: { color: '#ae86ff', symbol: 'K' },
  Merengue: { color: '#68dfd0', symbol: 'M' },
};

type MarkerGroup = { key: string; events: SpotEvent[]; center: LatLngExpression };

function FollowSearch({ location, radius }: { location: UserLocation; radius: number }) {
  const map = useMap();
  useEffect(() => {
    // Center on a new search and fit the requested distance without revealing any private event address.
    const latitudeSpan = radius / 111.32;
    const longitudeSpan = radius / (111.32 * Math.max(.2, Math.cos(location.lat * Math.PI / 180)));
    map.fitBounds([
      [location.lat - latitudeSpan, location.lng - longitudeSpan],
      [location.lat + latitudeSpan, location.lng + longitudeSpan],
    ], { animate: false, padding: [16, 16], maxZoom: 14 });
    // Leaflet needs an extra layout pass after switching from List to Map.
    requestAnimationFrame(() => map.invalidateSize());
  }, [map, location.lat, location.lng, radius]);
  return null;
}

function ZoomObserver({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({ zoomend: e => onZoom(e.target.getZoom()) });
  return null;
}

function EventMarkers({ events, zoom, activeIds, onSelect }: {
  events: SpotEvent[];
  zoom: number;
  activeIds: string[];
  onSelect: (events: SpotEvent[]) => void;
}) {
  const map = useMap();
  const groups = useMemo<MarkerGroup[]>(() => {
    // View-dependent light clustering; exact same public zones always share one pin.
    const unit = zoom <= 10 ? .029 : zoom <= 12 ? .011 : zoom <= 14 ? .004 : .0001;
    const buckets = new Map<string, SpotEvent[]>();
    for (const event of events) {
      const key = `${Math.round(event.publicLat / unit)}:${Math.round(event.publicLng / unit)}`;
      buckets.set(key, [...(buckets.get(key) ?? []), event]);
    }
    return [...buckets].map(([key, grouped]) => ({
      key,
      events: grouped,
      center: [grouped.reduce((s, e) => s + e.publicLat, 0) / grouped.length, grouped.reduce((s, e) => s + e.publicLng, 0) / grouped.length],
    }));
  }, [events, zoom]);

  return <>{groups.map(group => {
    const { events: grouped, key, center } = group;
    const cluster = grouped.length > 1;
    const selected = grouped.some(e => activeIds.includes(e.id));
    const first = grouped[0];
    const style = danceTone[first.dances[0]] || danceTone.Bachata;
    const pin = divIcon({
      className: 'event-pin-icon',
      html: `<div class="event-pin-shell${selected ? ' selected' : ''}${cluster ? ' cluster' : ''}"><div class="event-pin" style="--pin-color:${cluster ? '#ffe1a3' : style.color}"><span class="pin-symbol">${cluster ? grouped.length : style.symbol}</span></div></div>`,
      iconSize: [44, 52], iconAnchor: [22, 48],
    });
    return <Marker key={key} icon={pin} position={center} keyboard title={cluster ? `${grouped.length} eventi in questa zona` : `${first.title}, ${first.area}`} eventHandlers={{
      click: () => {
        onSelect(grouped);
        if (cluster && zoom < 14) map.flyTo(center, Math.min(14, zoom + 2), { duration: .4 });
      },
    }}>
      <Tooltip offset={[0, -40]} direction="top">{cluster ? `${grouped.length} serate in questa zona` : `${first.title} · ${first.area}`}</Tooltip>
    </Marker>;
  })}</>;
}

export function ExploreMap({ events, location, radius }: { events: SpotEvent[]; location: UserLocation; radius: number }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(12);
  const selected = useMemo(() => selectedIds.map(id => events.find(e => e.id === id)).filter((e): e is SpotEvent => !!e), [events, selectedIds]);
  useEffect(() => setSelectedIds([]), [location.lat, location.lng, radius]);
  const center: LatLngExpression = [location.lat, location.lng];
  return <>
    <div className="map-control-row"><span className="map-summary"><MapPin size={15}/> Tocca un pin per vedere la serata</span><span className="map-radius-pill">Raggio {radius} km</span></div>
    <div className="map-legend" aria-label="Legenda tipologie evento">{Object.entries(danceTone).map(([dance, tone]) => <span key={dance}><i style={{ background: tone.color }}/>{dance}</span>)}</div>
    <div className="explore-map" aria-label="Mappa interattiva con i pin delle zone approssimative degli eventi">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} zoomControl={false} style={{ width: '100%', height: '100%' }}>
        <FollowSearch location={location} radius={radius}/>
        <ZoomObserver onZoom={setZoom}/>
        <ZoomControl position="topright"/>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" maxZoom={19}/>
        <Circle center={center} radius={radius * 1000} pathOptions={{ color: '#9567ed', weight: 2, fillColor: '#a274ed', fillOpacity: .07, dashArray: '5 6' }}/>
        <CircleMarker center={center} radius={7} pathOptions={{ color: '#fff', fillColor: '#645dff', fillOpacity: 1, weight: 3 }}><Tooltip>Centro della tua ricerca</Tooltip></CircleMarker>
        <EventMarkers events={events} zoom={zoom} activeIds={selectedIds} onSelect={list => setSelectedIds(list.map(e => e.id))}/>
      </MapContainer>
      {!events.length && <div className="map-empty-note">Nessuna serata in questo raggio. Prova a cambiare città o ad allargare la ricerca.</div>}
      {selected.length > 0 && <div className="map-selection" role="region" aria-label="Serate selezionate dalla mappa">
        <div className="map-selection-heading"><span>{selected.length > 1 ? `${selected.length} serate in questa zona` : '✦ Hai trovato una serata'}</span><button aria-label="Chiudi anteprima evento" onClick={() => setSelectedIds([])}><X size={16}/></button></div>
        <div className="map-selection-content">{selected.map(event => <Link to={`/event/${event.id}`} key={event.id} className="map-preview-event" aria-label={`Apri ${event.title}`}>
          <img className="map-preview-cover" src={event.cover} alt="" loading="lazy"/>
          <span className="map-preview-copy"><strong>{event.title}</strong><small><MapPin size={11}/> {event.area}, {event.city} · zona indicativa</small><small><CalendarDays size={11}/>{tinyDate(event.startsAt)} · {clock(event.startsAt)} <span className="map-preview-price">{event.price ? `€${event.price}` : 'Gratis'}</span></small></span>
          <ArrowUpRight className="arrow" size={21}/>
        </Link>)}</div>
      </div>}
      <div className="map-note"><LockKeyhole size={15}/><span>Posizioni indicative. L'indirizzo esatto si sblocca solo dopo l'approvazione.</span></div>
    </div>
  </>;
}

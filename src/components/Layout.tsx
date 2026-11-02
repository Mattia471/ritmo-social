import { useState, createContext, useContext, type ReactNode } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { CalendarHeart, Compass, House, MessageCircle, Plus, UserRound, MapPin, X, Bell, Crown, ArrowLeft, LogOut } from 'lucide-react';
import { Brand, Avatar } from './Shared';
import { useStore } from '../lib/store';
import { DEFAULT_LOCATION, type UserLocation } from '../types';

const GeoContext = createContext<{ location: UserLocation; setLocation: (loc: UserLocation) => void; radius: number; setRadius: (km: number) => void }>({ location: DEFAULT_LOCATION, setLocation: () => {}, radius: 10, setRadius: () => {} });
export const useGeo = () => useContext(GeoContext);
const links = [
  { href: '/', label: 'Scopri', icon: House, end: true },
  { href: '/explore', label: 'Esplora', icon: Compass },
  { href: '/chats', label: 'Chat', icon: MessageCircle },
  { href: '/my-events', label: 'I miei eventi', icon: CalendarHeart },
  { href: '/profile', label: 'Profilo', icon: UserRound },
];
const Header = () => {
  const { profile, pro, isLive } = useStore();
  const { location, radius } = useGeo();
  const pathname = useLocation().pathname;
  const titles: Record<string, string> = { '/explore': 'Esplora eventi', '/chats': 'Community', '/my-events': 'I tuoi eventi', '/profile': 'Il tuo profilo', '/create': 'Nuova serata', '/plus': 'Organizzatore Plus' };
  const isRoot = pathname === '/';
  return <header className="topbar">
    <div className="topbar-desktop"><Brand/><span className="topbar-location"><MapPin size={15}/>{location.name} <span>· {radius} km</span></span></div>
    <div className="topbar-mobile">{isRoot ? <Brand/> : <><Link to="/" className="back-mobile" aria-label="Torna alla home"><ArrowLeft size={20}/></Link><span className="page-label">{titles[pathname] || 'Ritmo Social'}</span></> }</div>
    <div className="topbar-actions"><span className="demo-badge">{isLive ? 'LIVE' : 'DEMO'}</span>{pro && <Crown className="premium-crown" size={17}/>}<Link to="/my-events" className="icon-button desktop-icon" title="Le tue richieste"><Bell size={19}/></Link><Link to="/profile" title="Profilo" className="profile-link"><Avatar name={profile.name} size="sm"/></Link></div>
  </header>;
};
function SideNav() {
  const { pro } = useStore();
  return <aside className="sidebar"><Brand/><nav className="side-links">{links.map(({ href, label, icon: Icon, end }) => <NavLink key={href} end={end} to={href} className={({ isActive }) => `side-link ${isActive ? 'selected' : ''}`}><Icon size={20}/>{label}</NavLink>)}<Link to="/create" className="btn btn-primary side-create"><Plus size={19}/> Crea un evento</Link></nav><div className="side-bottom"><Link className="side-pro" to="/plus"><Crown size={19}/><span><strong>{pro ? 'Ritmo Plus attivo' : 'Passa a Plus'}</strong><small>{pro ? 'Grazie per il supporto!' : 'Più serate, più community'}</small></span></Link><p>Ogni serata è una nuova storia. ✦</p></div></aside>;
}
function BottomNav() {
  return <nav className="bottom-nav" aria-label="Navigazione principale"><NavLink end to="/" className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}><House size={21}/><span>Scopri</span></NavLink><NavLink to="/explore" className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}><Compass size={21}/><span>Esplora</span></NavLink><Link to="/create" className="bottom-create" aria-label="Crea un evento"><Plus size={26}/></Link><NavLink to="/chats" className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}><MessageCircle size={21}/><span>Chat</span></NavLink><NavLink to="/profile" className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}><UserRound size={21}/><span>Profilo</span></NavLink></nav>;
}
export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation>(() => {
    try { const saved = localStorage.getItem('ritmo-geo'); return saved ? JSON.parse(saved) as UserLocation : DEFAULT_LOCATION; } catch { return DEFAULT_LOCATION; }
  });
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('ritmo-radius') || 10));
  const { error, clearError, userId } = useStore();
  const setLocationPersist = (loc: UserLocation) => { setLocation(loc); localStorage.setItem('ritmo-geo', JSON.stringify(loc)); };
  const setRadiusPersist = (km: number) => { setRadius(km); localStorage.setItem('ritmo-radius', String(km)); };
  const pathname = useLocation().pathname;
  return <GeoContext.Provider value={{ location, setLocation: setLocationPersist, radius, setRadius: setRadiusPersist }}>
    <div className="app-shell"><SideNav/><div className="main-area"><Header/><main key={pathname} className={`page-content ${pathname.startsWith('/chats') ? 'chat-page-main' : ''}`}>{children}</main><footer className="app-footer"><span>© {new Date().getFullYear()} Ritmo Social · La pista è di tutti.</span><a href="https://www.instagram.com/mattiacucuzza_/" target="_blank" rel="noreferrer">Made with ♡ by Mattia Cucuzza ↗</a></footer></div><BottomNav/></div>
    {error && <div className="toast-error" role="alert"><span>{error}</span><button aria-label="Chiudi errore" onClick={clearError}><X size={18}/></button></div>}
    {!userId && <span className="sr-only">Sessione non autenticata</span>}
  </GeoContext.Provider>;
}
export const LogoutIcon = LogOut;

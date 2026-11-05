import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StoreProvider, useStore } from './lib/store';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { EventDetail } from './pages/EventDetail';
import { MyEvents } from './pages/MyEvents';
import { Chats } from './pages/Chats';
import { CreateEvent } from './pages/CreateEvent';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';

function RequireAuth({ children }: { children: ReactNode }) {
  const { userId } = useStore();
  const location = useLocation();
  if (userId) return <>{children}</>;
  const next = `${location.pathname}${location.search}`;
  return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace/>;
}

function InsideApp() {
  const { loading, userId } = useStore();
  const location = useLocation();
  if (loading) return <div className="splash-screen"><span className="splash-mark">R<span>.</span></span><p>Prepariamo la pista...</p></div>;
  if (location.pathname === '/auth') {
    const requested = new URLSearchParams(location.search).get('next');
    const safeNext = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/';
    return userId ? <Navigate to={safeNext} replace/> : <Auth/>;
  }
  return <Layout><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/explore" element={<Explore/>}/>
    <Route path="/event/:id" element={<EventDetail/>}/>
    <Route path="/my-events" element={<RequireAuth><MyEvents/></RequireAuth>}/>
    <Route path="/chats" element={<RequireAuth><Chats/></RequireAuth>}/>
    <Route path="/chats/:roomId" element={<RequireAuth><Chats/></RequireAuth>}/>
    <Route path="/create" element={<RequireAuth><CreateEvent/></RequireAuth>}/>
    <Route path="/profile" element={<RequireAuth><Profile/></RequireAuth>}/>
    <Route path="/plus" element={<RequireAuth><Navigate to="/create" replace/></RequireAuth>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Layout>;
}
export function App() { return <StoreProvider><InsideApp/></StoreProvider>; }

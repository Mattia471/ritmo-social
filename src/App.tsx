import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
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
import { ResetPassword } from './pages/ResetPassword';

function ScrollToTop() {
  const route = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.querySelectorAll<HTMLElement>('.main-area, .page-content').forEach(node => { node.scrollTop = 0; });
  }, [route.pathname, route.search, route.key]);
  return null;
}
function InsideApp() {
  const { loading, userId } = useStore();
  if (loading) return <div className="splash-screen"><span className="splash-mark">R<span>.</span></span><p>Prepariamo la pista...</p></div>;
  if (!userId) return window.location.pathname === '/reset-password' ? <ResetPassword/> : <Auth/>;
  return <Layout><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/explore" element={<Explore/>}/>
    <Route path="/event/:id" element={<EventDetail/>}/>
    <Route path="/my-events" element={<MyEvents/>}/>
    <Route path="/chats" element={<Chats/>}/>
    <Route path="/chats/:roomId" element={<Chats/>}/>
    <Route path="/create" element={<CreateEvent/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/reset-password" element={<ResetPassword/>}/>
    <Route path="/plus" element={<Navigate to="/create" replace/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Layout>;
}
export function App() { return <StoreProvider><ScrollToTop/><InsideApp/>{import.meta.env.PROD && <Analytics />}</StoreProvider>; }

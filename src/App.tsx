import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StoreProvider, useStore } from './lib/store';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { EventDetail } from './pages/EventDetail';
import { MyEvents } from './pages/MyEvents';
import { Chats } from './pages/Chats';
import { CreateEvent } from './pages/CreateEvent';
import { Profile } from './pages/Profile';
import { Plus } from './pages/Plus';
import { Auth } from './pages/Auth';

function InsideApp() {
  const { loading, userId } = useStore();
  if (loading) return <div className="splash-screen"><span className="splash-mark">R<span>.</span></span><p>Prepariamo la pista...</p></div>;
  if (!userId) return <Auth/>;
  return <Layout><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/explore" element={<Explore/>}/>
    <Route path="/event/:id" element={<EventDetail/>}/>
    <Route path="/my-events" element={<MyEvents/>}/>
    <Route path="/chats" element={<Chats/>}/>
    <Route path="/chats/:roomId" element={<Chats/>}/>
    <Route path="/create" element={<CreateEvent/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/plus" element={<Plus/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Layout>;
}
export function App() { return <StoreProvider><InsideApp/></StoreProvider>; }

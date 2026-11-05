-- Ritmo Social | Guest public discovery
-- Guests can browse published events and the public display name of hosts.
-- Private venues, attendances, chats and full profiles remain inaccessible.

grant select on table public.events to anon;
grant select (id, display_name) on table public.profiles to anon;

drop policy if exists events_public_read on public.events;
create policy events_public_read
on public.events for select
to anon
using (status = 'published');

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read
on public.profiles for select
to anon
using (true);

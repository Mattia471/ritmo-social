# Ritmo Social v0.7 · Release candidate (NOT public multi-user yet)

- Scroll-to-top for every pathname/query/navigation key; chat separate viewport remains managed.
- Supabase Auth signup with first name, last name, international phone, email, password, city, dance styles, years of experience. Email confirmation and password recovery. Only when a dedicated Supabase project is configured.
- Dance preference filtering and recommendations. Profile supports updating styles and experience.
- Four primary launch cities: Roma, Milano, Napoli, Palermo, with approximate public city-area coordinates.
- `@vercel/analytics` for pageviews and routes (enable in Vercel dashboard). Custom funnels require Pro.
- AdSense manual slots prepared for Home/Explore only. Disabled by default; requires approved site, publisher/slot IDs, Google-certified CMP TCF consent, compliant hosting and actual legal pages.
- Sponsor cards still supported. No forced subscriptions or fake sponsor content.

**Do not treat this as a production real user launch:** no dedicated Ritmo Social Supabase project has been provisioned or migrated; the only existing Supabase project belongs to Synchro Step. Do not use it. Need email delivery, privacy/legal terms, RLS audit, multi-account access tests, abuse and spam controls, HTTPS domain, AdSense approval, commercial hosting.

- Demo preview available at `/anteprima-iscrizione`, clearly labeled not real signup; live mode never seeds fake events.

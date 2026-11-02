# Ritmo Social launch checklist

## Provision dedicated Supabase
- Create a new Ritmo Social project (prefer EU region). NEVER use Synchro Step.
- Use `supabase migration new` for any subsequent migrations. Apply initial and free-community schema in order. Inspect existing migrations and check RLS and SQL security advisors; do not publish until security verified with distinct test accounts.
- Enable email/password and email confirmation; set Site URL to the production domain and configure redirect URL for `/reset-password` and root. Configure production SMTP (default Supabase email has limited delivery).
- Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel; NEVER expose any Supabase secret or service role to Vite.
- Test attendee A, organizer B, anonymous C: private address and event chat only to approved attendee or host, no cross-account phone access; test concurrent seat approvals.
- No access to live user data from the local demo.

## Analytics
- Enable Vercel Web Analytics in Vercel dashboard for the project. `@vercel/analytics/react` is included.
- Hobby supports pageviews and referring pages, NOT Pro-only custom funnel events.
- Avoid sending phone, email, names, exact coordinates, or private addresses in analytics event properties or URLs.

## Monetization
- Upgrade from Vercel Hobby for commercial traffic BEFORE enabling monetization.
- Obtain AdSense publisher ID and ad unit IDs, verify ownership, secure site approval and ads.txt.
- Publish legal pages, privacy policy, advertising notice; connect a Google-certified CMP supporting IAB TCF v2 and test reject/accept states.
- Set `VITE_ADS_ENABLED=true` and `VITE_ADS_APPROVED=true` only after approval and legal review; first ad request will wait for CMP consent. Never show ads on chat, RSVP, maps or private location pages.
- The direct local sponsor card needs actual authorized sponsorship details before showing. Do not fake endorsements.

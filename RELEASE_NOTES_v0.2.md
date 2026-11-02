# Ritmo Social v0.2 · Blocco 1

- Rebranding completo del tema: Deep Indigo, Coral, Electric Purple, Warm Amber e Teal.
- Nuovo brand icon SVG, logo lockup, favicon SVG, PNG PWA e Apple touch icon, preview OG 1200×630.
- Metadata SEO/OpenGraph/Twitter, manifest aggiornato, robots.txt, sitemap e SPA routing Vercel.
- Mappa come vista predefinita in `/explore`, opzione Lista mantenuta.
- Pin per serate, colore per stile e legenda, cluster leggero dipendente dallo zoom, mini card in overlay, anteprima multi-evento e link dettaglio.
- Cerchio del raggio (5/10/15/25/50/100 km), cambio città, indicazione che i punti sono soltanto zone approssimative.
- Corretti due errori preesistenti TypeScript nello store: import inutilizzato e pulizia subscription con client opzionale.
- Test: 9/9 automatici superati via Node + TypeScript; build Vercel di produzione READY (deployment dpl_75CfHMR1FnuQQ41eEoeAa1PJd8By).

## Limiti attuali

- Dati e chat della demo persistono nel solo browser locale, non condivisi tra utenti.
- I punti sono zone indicative (centroidi di quartiere), non coordinate di locali reali.
- Geolocalizzazione dipende dal consenso dell'utente e da HTTPS.
- Mappa richiede connessione ai tile OSM/CARTO.
- Test end-to-end nel browser reale ancora da completare con l'utente.
- Restano avvisi npm audit delle dipendenze: da approfondire prima del lancio con utenti reali.
- Attivazione Stripe e backend Supabase **non ancora effettuata**.

## Prossimo checkpoint

Procedere con B01-B03 di `TESTING_ROADMAP.md`, chiudere i P0/P1 in un solo blocco correttivo, poi B04-B06. Solo dopo congelare schema e RLS di Supabase.

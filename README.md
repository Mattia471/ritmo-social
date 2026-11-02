# RITMO SOCIAL ✳

**La tua prossima serata inizia qui.** Concept/MVP mobile-first per la community di salsa, bachata, kizomba e merengue.

React 18 + Vite 6 + TypeScript + Tailwind CSS 3 + React Router + Lucide + React Leaflet/OpenStreetMap + Supabase (Auth, PostgreSQL, RLS, Realtime, Edge Functions) + Stripe Checkout per gli abbonamenti.

## Avvio immediato (demo funzionante)

Requisiti: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Apri `http://localhost:5173` dal browser, oppure dallo smartphone connesso alla stessa rete usando l'IP locale del computer e la porta `5173` (assicurati che il firewall consenta l'accesso). **Non servono credenziali** in modalità demo. Dati, richieste, chat, approvazioni e nuove serate sono salvati sul dispositivo via `localStorage`. Dal Profilo puoi ripristinare la demo.

> La demo è intenzionalmente monoutente. I dati di esempio sono inventati e la privacy è simulata solo a livello UI; **non mettere in produzione la demo come backend multiutente**.

## Funzionalità incluse

- Home con eventi in evidenza, ricerca e serate vicine.
- Ricerca per stile, città, keyword, gratuiti, raggio **5/10/15/25/50/100 km**, con geolocalizzazione **solo su richiesta**.
- Mappa OpenStreetMap con **zone approssimative**. Il raggio è calcolato rispetto al centro di zona, perciò la distanza è indicativa.
- Scheda evento con programma, iscritti, prezzo d'ingresso indicativo e organizzatore.
- **Richiesta -> attesa -> approvazione/rifiuto**. L'organizzatore gestisce le richieste nella sua area.
- **Indirizzo preciso e indicazioni disponibili solo al creatore e agli iscritti approvati**, con accesso regolato dalle policy RLS in modalità live.
- Chat globale e chat evento riservate, con messaggi aggiornati tramite realtime Supabase in modalità live.
- Creazione di eventi con copertine predefinite, generi, date, capienza, città/zona e indirizzo riservato.
- Profilo e abbonamento **Organizzatore Plus a €3,90/mese**; Free con massimo 2 creazioni per mese.
- Interfaccia responsive dark club, tab bar mobile, manifest per installazione dalla schermata Home.
- Credito allo sviluppatore nel footer.

## Attivazione Supabase live

1. Crea un progetto Supabase **di test** e recupera **Project URL** e **publishable key** (non la service_role).
2. Esegui in SQL Editor lo script `supabase/migrations/20261101120000_initial.sql` in un progetto nuovo, **dopo averlo revisionato e testato**. Per progetti già avviati, usa le migrazioni Supabase CLI e non incollare lo script indiscriminatamente.
3. Crea `.env` partendo da `.env.example`, inserendo `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Su Supabase Authentication attiva accesso via email OTP/magic link, configura Site URL e redirect URL per `http://localhost:5173` e per il futuro dominio HTTPS.
5. Riavvia Vite. Se le credenziali esistono, l'app passa automaticamente dalla demo a Supabase. Gli utenti accedono via email.
6. Ricarica la pagina dopo aver approvato una richiesta, se l'aggiornamento realtime non arriva (la migration aggiunge le 3 tabelle a `supabase_realtime`).

**Database/Privacy**: `events` contiene solo la città, la zona e il centro approssimativo della zona. Il server usa la propria tabella `area_centers` e **ignora coordinate personalizzate inviate dal client**. `event_private` contiene indirizzo e indicazioni. RLS permette `SELECT` soltanto al creatore o a un membro con `attendances.status = 'approved'`. Le chat evento hanno la stessa restrizione a livello di database. `resolve_join_request()` controlla l'identità dell'organizzatore e la capienza con lock transazionale. `create_social_event()` salva evento + indirizzo in un'unica operazione. Il database applica il limite Free, senza fidarsi dell'interfaccia. Le policy negano ai client il diritto di modificare autonomamente abbonamenti e stati d'iscrizione.

### Attivare Stripe (solo dopo aver impostato un soggetto che possa incassare)

1. In Stripe crea un **Product** e un **Price ricorrente** da **€3,90/mese** e copia il `price_...`.
2. Aggiungi i segreti **solo alle Edge Functions** Supabase: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`. Le funzioni ricevono anche gli environment Supabase di progetto. Non inserire mai chiavi Stripe segrete nel `.env` frontend.
3. Pubblica la funzione `create-checkout`, con verifica JWT abilitata, e la funzione `stripe-webhook`, che necessita della verifica della firma Stripe nel codice e dell'eventuale configurazione `verify_jwt=false` **solo per il webhook**.
4. Registra in Stripe l'endpoint `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook` per `checkout.session.completed` e `customer.subscription.created`, `.updated`, `.deleted`.
5. Prova in **Stripe test mode**: checkout, successo, rifiuto pagamento, rinnovo, annullamento, webhook duplicato; assicurati che `subscriptions` abbia status attivo solo dopo conferma Stripe.
6. Prima di incassare denaro reale, configura dominio HTTPS, termini di acquisto, privacy e cookie policy, identità commerciale, regime fiscale, rimborsi/cancellazioni, fatturazione/IVA e assistenza. Considera un portale Stripe per la gestione/disdetta abbonamento.

Le tariffe Stripe possono variare. Per carte standard SEE, come ordine di grandezza, il listino pubblico indica **1,5% + €0,25** a pagamento e **0,7%** del volume Billing, da verificare prima della pubblicazione. A €3,90 il costo indicativo è ~€0,34, **prima di imposte, IVA, altri costi e possibili variazioni tariffarie**.

### Nota tecnica sui costi

Suggerisco **partecipazione gratis**, **chat gratis**, e Plus soltanto a chi organizza spesso. Niente ads invasive nel MVP: ostacolerebbero la crescita della community. Più avanti puoi aggiungere schede **“Sponsorizzato”** a pagamento, esplicitamente riconoscibili. L'app non vende biglietti né processa quote di ingresso: il prezzo scritto sull'evento è soltanto informativo e si paga eventualmente sul posto.

## Da completare prima di un vero lancio pubblico

Questo repository è un **MVP e una base tecnica**, non un prodotto production-ready verificato end-to-end. Sono ancora da completare/testare:

- Sistema di **segnalazione, blocco, moderazione e anti-spam** nelle chat, protezione da abusi e account sospesi.
- Console admin per gestione utenti/eventi, segnalazioni, reclami e supporto.
- Test di integrazione delle RLS e dell'isolamento tra più utenti **su un vero progetto Supabase**, test di regressione e penetration check.
- Stripe Billing Portal per disdire, gestire pagamenti e fatture; copertura dei casi limite webhook/ritardi/riordino eventi.
- Configurazione reale email assistenza (il placeholder `hello@ritmo.social` è **da sostituire** e non è una casella dichiarata attiva), testi legali GDPR e gestione consensi.
- Caricamento foto tramite storage ottimizzato (ora copertine predefinite esterne), notifiche push, email di conferma, preferiti e ricerca geografica server-side per grandi volumi.
- Verifica di gestione fusi orari/DST, controllo contenuti creati dagli utenti, limiti chat, osservabilità e policy di conservazione dati.
- **Non inviare la posizione precisa del dispositivo al server**: la geolocalizzazione nella demo è usata nel browser per cercare i centri approssimativi degli eventi.

## Struttura

```text
src/
  App.tsx                 Routing
  components/             Layout, card eventi e mappa
  data/demo.ts            Demo e localStorage
  lib/store.tsx           Adapter demo/live + stato applicazione
  lib/supabase.ts         Client Supabase (solo publishable key)
  lib/geo.ts              Distanza Haversine e date
  pages/                  Home, Explore, EventDetail, CreateEvent,
                          Chats, MyEvents, Profile, Plus, Auth
supabase/
  migrations/             Schema SQL + RLS
  functions/              Checkout + webhook firmato Stripe
public/                   Favicon, icon e webmanifest
```

## Comandi

```bash
npm run dev
npm run check
npm test
npm run build
npm run preview
```

**Nota sulla consegna**: il codice ha dipendenze con versioni fissate in `package.json`. In questo ambiente non è stato possibile raggiungere il registry npm, quindi non sono inclusi `node_modules` né `package-lock.json`. Esegui `npm install` su una macchina con accesso a Internet, poi conserva e committa il lockfile generato. Prima della pubblicazione vanno eseguiti `npm run check` e `npm run build`.

### Crediti

Concept e sviluppo: Mattia Cucuzza. Foto dimostrative caricate da Unsplash, mappa © OpenStreetMap contributors. Nome e brand **Ritmo Social** sono provvisori e devono essere verificati prima dell'uso commerciale (dominio/marchio).

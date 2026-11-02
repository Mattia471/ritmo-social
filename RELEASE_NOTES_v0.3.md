# Ritmo Social v0.3 · UI/UX mobile fix batch

- Home: ricerca e zona immediatamente visibili; hero mobile compatta.
- Mappa: basemap OpenStreetMap standard per la demo, attribuzione visibile; eliminato tooltip Leaflet duplicato; privacy note compatta e apribile; selezione pin conservata.
- Chat: elenco mobile a pagina piena e conversazione dedicata con solo messaggi a scroll; tabbar nascosta nella conversazione; chat globale ora su /chats/global (desktop /chats continua a mostrare la globale).
- Creazione: mantenuto il form data/ora stabilizzato nella v0.2.2.
- Dettaglio: nascosto doppio pulsante indietro su mobile.
- Privacy: i nuovi eventi demo non duplicano indirizzo/directions nell'oggetto evento pubblico; vecchi stati demo migrati in lettura. Non è controllo di autorizzazione server: servirà RLS Supabase.

## Da testare su Safari iPhone
1. Home: input visibile subito, footer e bottom-nav senza coprire eventi.
2. Mappa: tasselli caricati, pin / cluster / anteprima, raggio; noticina privacy apribile.
3. Chat: /chats elenco; /chats/global chat globale; /chats/:eventId chat riservata; composer sempre visibile anche con tastiera.
4. Iscrizione, creazione, profilo e Plus non regrediti; dati demo persistenti.
5. Verificare errori Console JS, date, scrolling e safe area.

Per un vero lancio pubblico è necessario configurare un provider cartografico con limiti e SLA adeguati: tile.openstreetmap.org è soltanto un fallback demo, soggetto a fair use.

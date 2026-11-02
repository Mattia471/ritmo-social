# Ritmo Social v0.4 · UX Mobile Hardening

## Cosa cambia
- Chat iPhone: layout ancorato alla VisualViewport quando compare la tastiera, header unico, compositore vicino alla tastiera, scroll riservato ai messaggi.
- Mappa: clustering basato su distanza in pixel e non su arrotondamenti geografici; indicazione del numero di eventi, lista di eventi per pin, card compatta e scrollabile.
- Creazione evento: wizard in quattro passaggi, validazioni per step, data e ora native separate, anteprima finale e distinzione tra zona pubblica e indirizzo riservato.
- Dettaglio evento: barra CTA mobile persistente sopra la bottom navigation, con stati coerenti con richiesta/approvazione/organizzatore.
- La demo resta locale, priva di account multiutente e di incassi reali. Nessuna migrazione database è stata applicata.

## Test regressione manuale su iPhone
1. Chat globale: apri tastiera, digita, invia, controlla che header e composer rimangano visibili e senza salti.
2. Mappa: zoom, trascinamento, cluster numerico, tocco, scelta evento e dettaglio.
3. Creazione: step 1-4, date che oltrepassano la mezzanotte, indirizzo riservato, navigazione avanti/indietro e pubblicazione.
4. Dettaglio: CTA sticky in stato libero/in attesa/approvato; verifica che non copra contenuti e barra inferiore.
5. Profilo, Plus e home: verifica regressione.

## Sicurezza prima del lancio
Non basta la logica frontend per proteggere i dati. Prima della fase pubblica con utenti reali implementare autenticazione e RLS Supabase per luoghi privati, richieste e chat, oltre a moderazione, limiti anti-spam e verifica dei pagamenti server-side.

# Ritmo Social · Roadmap collaudo demo (v0.2)

**Approccio:** mobile-first, 1 blocco alla volta. Al termine di ciascun blocco: registrare difetti, priorità e screenshot, correggere per gruppi, rifare i test regressivi e approvare il blocco prima di passare al successivo. Tutti gli eventi, utenti, chat e abbonamenti rimangono **simulati nel browser**. Nessun pagamento viene realmente incassato.

## Ambienti di collaudo

- Mobile: iPhone Safari (375–430 px), Android Chrome (360–412 px), tastiera aperta e chiusa, landscape, barra browser e safe-area.
- Desktop: Chrome/Edge 1280 e 1440 px; browser zoom al 100%.
- Condizioni: accesso iniziale e reload, cambio città e raggio, geolocalizzazione negata, rete lenta/offline (registrare comportamento), navigazione avanti/indietro.
- Privacy: coordinate pubbliche solo indicative; indirizzo completo visibile **unicamente dopo approvazione**. Nella demo i dati di esempio sono locali: non sono garanzia di sicurezza di produzione.
- Nota mappa: richiede connessione a internet per i tasselli Carto/OpenStreetMap. Geolocalizzazione reale richiede HTTPS e permesso browser.

| ID | Blocco | Procedura e comportamento atteso | Priorità | Stato iniziale |
|---|---|---|---|---|
| B01 | Identità visuale e navigazione | Verifica logo sidebar/header, favicon, icona PWA, contrasto, bottom navigation, tutte le CTA e comportamento a 360 px; apri link OG in anteprima | P0 | Pronto per test |
| B02 | Esplora lista e filtri | Cerca nome/area/stile; filtra Bachata/Salsa/Kizomba; cambia città e 5/10/25 km; attiva solo gratuiti; ripristina filtri; verifica il contatore e risultato vuoto | P0 | Pronto per test |
| B03 | Mappa e pin | Apri vista Mappa; verifica pin nella zona corretta, colori/legenda, tap sul pin → anteprima, tap anteprima → dettaglio, X chiude, cluster su zoom, cambio raggio e città, no indirizzo esatto | P0 | Pronto per test |
| B04 | Dettaglio evento | Apri evento da lista e da pin; verifica foto, date, prezzo, organizzatore, quota posti, descrizione e CTA; indirizzo esatto nascosto prima dell'approvazione | P0 | Da testare |
| B05 | Creazione serata | Compila form con dati validi/invalidi, zone, capienza, prezzo 0/positivo, orari, cover, anteprima e pubblicazione; verifica visibilità in esplora e quota Free | P0 | Da testare |
| B06 | Richieste e approvazioni | Come ballerino: richiedi accesso e verifica stato pending; come organizzatore: approva o rifiuta; con conferma: luogo esatto e chat evento; verifica che il rifiutato resti escluso | P0 | Da testare |
| B07 | Chat | Invio messaggi globali, apertura chat evento confermato, input tastiera mobile, scroll nuovi messaggi, nessun accesso evento per utente pending | P1 | Da testare |
| B08 | Profilo e dati demo | Aggiorna profilo, avatar, preferenze, verifica salvataggio al reload e reset demo; navigazione my events | P1 | Da testare |
| B09 | Plus e monetizzazione | Confronta Free/Plus, promozioni, verifica che il checkout sia mock e non generi addebiti; controlla il paywall dopo la quota demo | P1 | Da testare |
| B10 | Regressione e preparazione backend | Smoke test di tutte le rotte, modali/shortcut, console errors, reload su deep link, accessibilità tastiera, controlli RLS da progettare prima del backend | P0 | Da testare |

## Ritmo del collaudo guidato

1. Parti da **B01 + B02 + B03**. Per ogni blocco annotiamo screenshot e osservazioni; non cambiamo codice dopo ogni singolo feedback.
2. Terminiamo un blocco con lista ordinata P0/P1/P2, una singola sessione di fix e re-test.
3. Passiamo a **B04, B05 e B06** (conversione / trust).
4. Poi **B07–B09** (community, profilo, monetizzazione).
5. **B10** chiude la demo e congela i requisiti per il database.

## Formato per segnalare un difetto

`[B03][P0] Dispositivo/browser - Azione eseguita - Comportamento atteso - Comportamento ottenuto - Screenshot/link`.

Severità: **P0** blocca flusso, rivela dati o rende app inutilizzabile; **P1** degrada funzioni importanti; **P2** solo rifinitura UI/testi.

## Checkpoint prima di Supabase

- [ ] Tutti i P0 della demo chiusi
- [ ] Verificata l'UX mobile con zoom 100%
- [ ] Contratto dati evento stabilizzato (zona pubblica vs luogo privato)
- [ ] Matrice permessi concordata (ballerino, organizzatore, admin)
- [ ] Decisioni su chat moderazione, segnalazioni e blocchi
- [ ] Pricing demo validato con organizzatori reali

### Solo dopo: schema database e Supabase

Entità di massima (non ancora migrate): `profiles`, `events`, `event_private_locations`, `event_memberships`, `conversations`, `messages`, `subscriptions`, `promotions`, `reports`, `blocks`. Geo search con coordinate indicative server-generated e RLS sulla tabella privata. Approvazioni atomiche; messaggi evento visibili solo agli iscritti approvati; pagamenti con webhook Stripe verificati sul server; rate limits e antispam.

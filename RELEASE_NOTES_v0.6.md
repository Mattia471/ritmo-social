# Ritmo Social v0.6 · Tropical After Dark

Redesign grafico della web app ispirato alla palette petrolio, turchese, sabbia e arancione della selezione condivisa. Nessuna modifica alle condizioni di accesso o ai permessi dell'app.

## Design

- Nuovi token: blu notte `#071923`, petrolio `#0F3D3E`, blu-verde `#2E6F73`, turchese `#55E4E7`, sabbia `#F4E6D1`, arancione `#FFAD32`.
- Home riprogettata con copertina e dati **reali della serata in evidenza** (solo area pubblica), ricerca, scorciatoie per stile e schede più leggibili.
- Bottom navigation, sidebar, barra di ricerca e pulsanti con bordi più morbidi e ombre contenute.
- Filtri Esplora, mappa, dettaglio evento, form in quattro passaggi, profilo e chat allineati al nuovo tema.
- Logo SVG, favicon, icone PWA 192/512, banner Open Graph e tema browser aggiornati.
- CSS aggiuntivo `src/tropical.css` separato dalle regole stabili del collaudo v0.4.
- I filtri Salsa/Bachata/Kizomba/Merengue sulla Home aprono Esplora prefiltrata.

## Privacy e annunci

La Home mostra esclusivamente zona e città **pubbliche** per eventi in evidenza. Gli indirizzi privati rimangono subordinati all'approvazione del partecipante. Nessun nuovo tracker o annuncio automatico. Le sponsorizzazioni già previste in v0.5 restano invisibili finché non è configurato uno sponsor reale.

## Test manuali consigliati

1. iPhone: Home, banner evento, ricerca, scorciatoie per genere, bottom navigation.
2. Esplora: selezione città, elenco/mappa, anteprima pin e indirizzo ancora riservato.
3. Crea evento: quattro passaggi, campi data/ora, tastiera iOS e navigazione adesiva.
4. Chat: apertura tastiera, scroll messaggi, input fisso e nessun doppio header.
5. Profilo e RSVP: approvazione, gestione capienza e dettaglio privacy.

## Note operative

Progetto ancora in modalità demo locale fino a integrazione Supabase. La v0.6 modifica la presentazione e la navigazione dei filtri, non abilita monetizzazione né modifica le policy RLS. La pubblicazione da GitHub attiva la pipeline Vercel del progetto esistente.

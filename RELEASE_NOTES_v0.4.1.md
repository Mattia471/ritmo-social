# Ritmo Social v0.4.1 · Correzioni di regressione demo

- Richieste di iscrizione deduplicate a livello di store, anche con tap molto rapidi.
- La demo impedisce richieste quando l’evento è iniziato o ha raggiunto la capienza.
- Approvazioni demo riservate all’organizzatore e bloccate a capienza raggiunta.
- CTA evento segnala **Posti esauriti** senza invitare a iscriversi.
- La serata precompilata `own-1` non consuma uno dei due slot mensili Free nella demo; gli eventi creati dall’utente restano conteggiati.
- Nessun dato o schema Supabase di produzione modificato.

## Da verificare prima del lancio con utenti reali

- Policy RLS, privilegi di RPC, accessi alle posizioni private e revoca immediata dopo annullamento.
- Sincronizzazione multi-dispositivo, limiti transazionali e accesso chat Realtime.
- Dipendenze npm, moderazione chat, privacy e integrazione Stripe.

## Test

`npm test` dal progetto.

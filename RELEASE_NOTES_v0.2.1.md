# Ritmo Social v0.2.1 — Mobile input focus fix

**Fix B05-F07 (iPhone/Safari):** Safari ingrandiva l'intera pagina al focus dei campi con `font-size` tra 11 e 12px. I campi di testo, i selettori e le aree di testo ora hanno un font minimo di 16px su dispositivi mobili/tablet, mantenendo lo zoom manuale disponibile.

Miglioramenti aggiuntivi al form mobile: campi data/ora su righe singole, etichette più leggibili, altezza degli input almeno 48px, margine di scorrimento quando un campo riceve il focus e barra di navigazione temporaneamente nascosta durante la scrittura.

## Verifica manuale su iPhone
1. Ricarica la pagina con `?v=021`, poi apri **+ Nuova serata**.
2. Seleziona Nome, Descrizione, Data, Città, Indirizzo, Prezzo e Capienza, uno dopo l'altro.
3. Il viewport non deve ingrandirsi al focus; i campi non devono uscire dai margini.
4. Mentre scrivi la barra con Scopri/Esplora/+ dovrebbe sparire; ricompare dopo la chiusura della tastiera.
5. Pizzica con due dita: lo zoom manuale deve continuare a funzionare.

Questa release non attiva Supabase/Stripe e non include il redesign completo della creazione serata, previsto dopo la raccolta dei feedback.

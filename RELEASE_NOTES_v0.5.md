# Ritmo Social v0.5 | Gratis per la community

- Eliminati i percorsi di abbonamento Plus e i richiami commerciali. La rotta `/plus` reindirizza alla creazione evento gratuita.
- Pubblicazione gratuita con limite anti-spam uguale per tutti: 10 serate nelle ultime 24 ore. La migration SQL aggiuntiva applica la stessa regola nel backend futuro.
- Predisposti spazi sponsor contestuali etichettati in Home e in Esplora, senza pubblicità nelle chat, nella mappa, nelle richieste o nei dettagli di location privata.
- Nessuno script pubblicitario, cookie di tracciamento o inserzionista fittizio: gli slot sono invisibili finché non è configurato uno sponsor reale con URL HTTPS.
- Le reti pubblicitarie automatiche e il consenso europeo richiedono configurazione e verifica successive.

## Configurazione sponsor

Impostare in Vercel solo dopo accordi con uno sponsor reale:

- `VITE_SPONSOR_NAME`
- `VITE_SPONSOR_DESCRIPTION`
- `VITE_SPONSOR_URL` (HTTPS)

Non configurare per la demo: lo spazio non viene mostrato.

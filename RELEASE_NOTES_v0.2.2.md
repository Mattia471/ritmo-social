# Ritmo Social v0.2.2 — B05-F08 Date e orari mobile

- Sostituiti gli input `datetime-local` con campi separati per data e ora per inizio e fine.
- Griglia in colonna singola su smartphone e larghezze controllate con `min-width:0`, `box-sizing:border-box` per i selettori nativi iOS.
- Conservato il formato `YYYY-MM-DDTHH:mm` e la conversione attuale a ISO per il salvataggio.
- Mantenuto il font minimo 16px della fix anti-zoom precedente.
- Test automatici per i quattro campi e il contenimento su schermi stretti.

**Test manuale iPhone:** apri Nuova serata, scorri a «Quando ci si vede?», tocca data e ora di inizio e fine e verifica che nessun campo esca dai bordi anche quando Safari apre il selettore.

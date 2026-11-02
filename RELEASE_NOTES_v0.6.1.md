# Ritmo Social v0.6.1 · iPhone PWA Safe Area

## Correzione

- In modalità **Aggiungi alla schermata Home** su iOS, l’header e il logo non vengono più coperti dall’orologio o dalla Dynamic Island.
- Conservata la visualizzazione standalone (senza barra Safari), con banda superiore in tinta con l'header Tropical After Dark.
- La chat a schermo intero rispetta il margine superiore, mantenendo la gestione separata dell’altezza della tastiera.
- Nessuna variazione alle pagine aperte normalmente in Safari, a RSVP o agli indirizzi riservati.

## Collaudo manuale iPhone

1. Da Safari, aprire https://ritmo-social-theta.vercel.app/ e aggiungere alla Home.
2. Avviare dal collegamento: logo e header devono apparire sotto l’ora / Dynamic Island.
3. Aprire una pagina secondaria e verificare la freccia Indietro.
4. Aprire chat globale, scrivere con tastiera e verificare che intestazione e messaggi siano visibili.
5. Tornare in Safari e verificare che non compaia un margine superiore in più.

Nota: test automatici dei selettori; verifica fisica necessaria sui diversi modelli iPhone.

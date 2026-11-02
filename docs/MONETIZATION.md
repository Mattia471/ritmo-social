# Monetizzazione · Ritmo Social

## Decisione consigliata per l'MVP

**Nessun abbonamento obbligatorio per ballerini o organizzatori all'inizio.** Ricerca, creazione eventi entro quote ragionevoli, richieste, conferme e chat gratuite, così da costruire liquidità di offerta (serate) e domanda (partecipanti) prima di chiedere denaro.

Sperimentare due flussi pubblicitari:

1. **Annunci contestuali automatici sul sito**, esclusivamente nei punti a basso attrito (fra le card di Esplora o in sezioni informative); nessun banner sopra chat, input, modali di conferma o indirizzi riservati.
2. **Eventi in evidenza e sponsor locali diretti** chiaramente segnalati con la dicitura “Sponsorizzato”. Ricerca del locale/dell'evento sempre pertinente, anche quando promossa.

Nella **v0.5 la schermata Organizzatore Plus è rimossa**: nessun abbonamento è acquistabile, anche per chi organizza. I futuri servizi professionali richiederanno una scelta di prodotto separata.

## Economics illustrativa, non previsioni

Esempio di valutazione con RPM pagina di **1–3 € ogni 1.000 visualizzazioni monetizzate**. È una **fascia assunta per simulare**, non un tasso di mercato garantito né una stima verificata per questa app. Le entrate effettive dipendono da Paese, impressioni vendute, visibilità, tasso di consenso, ad-blocker e politiche della rete pubblicitaria.

| Utenti attivi mensili | Pagine monetizzate per utente | Visualizzazioni mensili | Lordo @ 1 € RPM | Lordo @ 3 € RPM |
|---:|---:|---:|---:|---:|
| 1.000 | 20 | 20.000 | 20 € | 60 € |
| 5.000 | 20 | 100.000 | 100 € | 300 € |
| 20.000 | 20 | 400.000 | 400 € | 1.200 € |

Da questi importi sottrarre hosting commerciale, servizi, imposte, eventuale assistenza e acquisizione utenti. Il ricavo non è profitto.

**Sponsor diretti di esempio:** 10 serate in evidenza da 7 € generano 70 € di fatturato lordo e richiedono capacità commerciale, misurazione e corretta etichettatura della pubblicità. Prezzo e domanda non sono ancora validati.

## Perché non affidarsi solo ad AdSense

Una community locale è un mercato di nicchia: le visite possono essere poche, ma **l'intento di uscire la sera** è forte. Le reti automatiche valorizzano volume e impressioni; lo sponsor di un locale valorizza il risultato (prenotazioni/partecipanti). La pubblicità automatica può essere secondaria fino a quando l'utenza è consistente.

Per il prodotto attuale (React + Vite, **web app/PWA**) si valutano reti pubblicitarie **web**, non l'SDK mobile nativo AdMob per iOS/Android. Valutare AdMob solo se l'app verrà distribuita nativamente e se soddisfa i requisiti SDK.

La pubblicità basata su profilazione e strumenti di tracciamento non tecnici richiede valutazioni GDPR/ePrivacy, informativa e appropriato consenso. Privilegiare sponsorizzazioni per area/stile dell'evento **senza profilare il singolo ballerino**, dove possibile.

**Nota operativa Vercel:** verificare il piano prima della monetizzazione: il piano Hobby è per utilizzo personale non commerciale; un'app con ads/sponsor non dovrebbe essere lanciata commercialmente su Hobby.

## Metriche per decidere

- Numero eventi attivi e percentuale che ricevono richieste.
- Ricerche per città, raggio e stile (aggregate, minimizzate, senza divulgare posizione esatta).
- Numero di richieste confermate per evento.
- Utenti attivi mensili, retention 7/30 giorni.
- Impressioni pubblicitarie monetizzate, RPM, viewability, tasso di consenso.
- CTR degli eventi sponsorizzati e richieste attribuibili (senza affermazioni ingannevoli).

## Guardrail UX

Non nascondere gli eventi organici dietro gli sponsor; non mostrare annunci nelle chat, durante la richiesta di partecipazione o nella schermata dell'indirizzo sbloccato. Etichettare sempre i posizionamenti a pagamento. Offrire opzioni di segnalazione e blocco utenti prima di aprire le chat al pubblico.

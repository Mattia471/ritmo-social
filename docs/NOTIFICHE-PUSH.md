# Ritmo Social v0.7.1 | Notifiche e Web Push

## Esperienza utente

- **Campanella** nell'intestazione desktop/mobile, con contatore dei messaggi non letti.
- **/notifications**: storico, scheda evento cliccabile, lettura singola e «Segna tutte come lette».
- **Preferenze** per nuove serate in città, richieste ricevute, approvazioni/rifiuti e annullamenti.
- **Push opzionali per dispositivo**: attivazione soltanto tramite un click esplicito dell'utente, revoca possibile.
- Le serate «in zona» sono riferite alla **città del profilo**, non alla posizione GPS o ai metri dal dispositivo. Non si salva la posizione precisa dell'utente.

## Come funzionano

Le notifiche vengono inserite da trigger PostgreSQL al verificarsi degli eventi applicativi:
- nuovo evento pubblicato, verso gli altri profili della stessa città;
- richiesta di partecipazione, verso l'organizzatore;
- richiesta approvata o rifiutata, verso il partecipante;
- annullamento evento, verso partecipanti approvati e in attesa.

Gli invii sono deduplicati per utente+azione. Ogni riga è privata tramite RLS. I messaggi non contengono mai l'indirizzo riservato di una serata.

Il frontend ascolta le modifiche Realtime e, al rientro in pagina, recupera la cronologia dalla tabella `user_notifications`.

Per le push a browser chiuso:
1. L'utente autorizza Web Push nel proprio browser e viene registrato un endpoint privato in `push_subscriptions`.
2. Il trigger di notifica chiama `pg_net`, esclusivamente se l'utente ha abilitato le push e possiede una registrazione dispositivo.
3. La Edge Function `ritmo-web-push` convalida un token conservato in Supabase Vault, legge la notifica e usa Web Push/VAPID.
4. `public/sw.js` riceve la push, mostra la notifica e apre una pagina dello stesso sito.

Chiavi VAPID e token webhook sono creati e conservati in Supabase Vault. Il client e GitHub non devono mai contenere la chiave privata. Nessun servizio email, Firebase o dominio personalizzato è necessario per Web Push su HTTPS.

## iPhone

Le push sono supportate su **iOS 16.4 e successivi** per le web app aggiunte alla schermata Home. Apri il sito in Safari, scegli **Condividi → Aggiungi alla schermata Home**, avvia l'app dall'icona, entra con l'account e premi **Attiva notifiche push** nelle preferenze. I normali tab di Safari su iPhone non possono essere usati come sostituti della web app installata per questa funzione.

## Checklist collaudo

1. Due account nella stessa città. Da A crea un evento: B deve vedere l'avviso.
2. Da B richiedi di partecipare: A riceve una notifica.
3. Da A approva o rifiuta: B riceve la decisione.
4. Annulla un evento di test dopo aver approvato B: B vede l'avviso; indirizzo e chat evento chiusi.
5. Disattiva «Nuove serate nella tua città»: gli eventi successivi non generano quel tipo di notifica.
6. Prova «Segna tutte come lette» e il contatore dopo un aggiornamento pagina.
7. Su due browser/dispositivi distinti, abilita le push. Verifica la notifica reale con il sito in background e una nuova azione.
8. Disattiva un solo dispositivo: non deve interrompere la registrazione dell'altro.
9. Esegui logout: il browser deve disiscriversi dalla push del precedente account.

**Limiti:** la consegna Web Push dipende dal sistema operativo, dal consenso, dalla connessione e dal servizio push del browser. L'app conserva comunque lo storico interno. Le notifiche nel sistema operativo non devono essere considerate un canale di emergenza o di recapito garantito.

## Release

L'ambiente di test usa il ramo `feature/v0.7-public-launch`. Non pubblicare su main senza collaudo finale delle push su un dispositivo reale, verifica dei permessi, informativa privacy e SMTP per le registrazioni pubbliche.

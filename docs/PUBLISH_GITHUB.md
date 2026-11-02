# Pubblicazione su GitHub con cronologia ricostruita

Per importare **tutti i commit e i tag** conservati nel bundle Git:

1. Crea dal tuo account GitHub una repository vuota chiamata `ritmo-social` (senza inizializzarla con README o .gitignore).
2. Scarica `ritmo-social-version-history.bundle` dalla consegna.
3. Esegui questi comandi nella cartella dove hai salvato il bundle:

```bash
git clone ritmo-social-version-history.bundle ritmo-social
cd ritmo-social
git remote rename origin archive
git remote add origin git@github.com:Mattia471/ritmo-social.git
git push -u origin main
git push origin --tags
```

In alternativa puoi usare HTTPS come URL del nuovo remote. Richiede che la tua macchina abbia già l'autenticazione GitHub configurata. Non condividere token di accesso nella chat.

**Attenzione:** questa cronologia è ricostruita dagli snapshot v0.1.0–v0.4.1, perché gli ZIP non contenevano `.git`. Non è possibile recuperare hash e commit intermedi originali da un semplice archivio dei file. Se esiste una repo sorgente precedente con vero storico, parti da quella e non usare questo bundle per sovrascriverla.

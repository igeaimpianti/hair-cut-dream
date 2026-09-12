# Hair Cut Dream V1

File inclusi:
- index.html
- config.js
- manifest.webmanifest
- sw.js
- banner-haircutdream.png
- icon-192.png
- icon-512.png
- apple-touch-icon.png
- supabase_patch_v2.sql

## Ordine consigliato
1. Esegui `supabase_patch_v2.sql` in Supabase SQL Editor.
2. In Supabase > Authentication > Providers > Email, lascia attiva la conferma email.
3. In `config.js` inserisci:
   - Project URL
   - anon/public key
4. Carica tutti i file nella root del repository GitHub Pages.
5. Apri l'app e prova registrazione, conferma email e login.

## Nota
Gli orari disponibili per le prenotazioni cliente compariranno solo dopo aver inserito `working_hours` per i barbieri.
La biometria/Passkey non è simulata nella V1: verrà implementata in una fase dedicata con WebAuthn.

# Direttiva: Setup Google Cloud e OAuth 2.0

## Obiettivo

Configurare Google Cloud Console da zero per permettere l'accesso ai video privati del canale YouTube tramite YouTube Data API v3 con autenticazione OAuth 2.0.

## Prerequisiti

- Account Google con accesso come proprietario/gestore del canale YouTube ABA (ID: `UC18Pm8LKXwtK2uUSoif5RVw`)
- Browser web
- Accesso al progetto locale dove salvare `credentials.json`

## Input Necessari

- Email dell'account Google proprietario del canale
- Nome del progetto Google Cloud (es: "Lezioni Live ABA")

## Script da Usare (dopo questo setup)

- `execution/youtube_oauth_setup.py` — Per la prima autenticazione e salvataggio token

## Procedura Passo-Passo

### Step 1: Creare Progetto Google Cloud

1. Vai su https://console.cloud.google.com
2. Clicca su **"Select a project"** in alto
3. Clicca su **"New Project"**
4. Compila:
   - **Project name:** `Lezioni Live ABA` (o nome a scelta)
   - **Organization:** (lascia vuoto se non hai un'organizzazione)
5. Clicca **"Create"**
6. Attendi che il progetto venga creato (10-30 secondi)
7. Seleziona il progetto appena creato dal dropdown

### Step 2: Abilitare YouTube Data API v3

1. Nel menu laterale, vai su **"APIs & Services"** → **"Library"**
2. Cerca **"YouTube Data API v3"** nella barra di ricerca
3. Clicca sulla card "YouTube Data API v3"
4. Clicca **"Enable"**
5. Attendi l'abilitazione (pochi secondi)

### Step 3: Configurare Schermata di Consenso OAuth

1. Nel menu laterale, vai su **"APIs & Services"** → **"OAuth consent screen"**
2. Seleziona **"External"** come User Type (potrai limitare ai tester dopo)
3. Clicca **"Create"**
4. **Pagina 1 — App information:**
   - **App name:** `Lezioni Live ABA`
   - **User support email:** (seleziona il tuo indirizzo email)
   - **App logo:** (opzionale, puoi saltare)
   - **Application home page:** (opzionale)
   - **Developer contact information:** (inserisci la tua email)
5. Clicca **"Save and Continue"**
6. **Pagina 2 — Scopes:**
   - Clicca **"Add or Remove Scopes"**
   - Cerca e seleziona: `https://www.googleapis.com/auth/youtube.readonly`
     - Descrizione: "View your YouTube account"
   - Clicca **"Update"**
   - Clicca **"Save and Continue"**
7. **Pagina 3 — Test users:**
   - Clicca **"Add Users"**
   - Inserisci l'email del tuo account Google (quello proprietario del canale)
   - Clicca **"Add"**
   - Clicca **"Save and Continue"**
8. **Pagina 4 — Summary:**
   - Rivedi le informazioni
   - Clicca **"Back to Dashboard"**

**NOTA:** L'app resterà in modalità "Testing" finché non la pubblichi. In modalità Testing, il token OAuth scade dopo 7 giorni e dovrai ri-autenticarti. Per evitarlo, puoi pubblicare l'app (richiede verifica Google) oppure ri-eseguire `youtube_oauth_setup.py` settimanalmente.

### Step 4: Creare Credenziali OAuth 2.0

1. Nel menu laterale, vai su **"APIs & Services"** → **"Credentials"**
2. Clicca **"Create Credentials"** in alto
3. Seleziona **"OAuth client ID"**
4. **Application type:** Seleziona **"Desktop app"**
5. **Name:** `Lezioni Live ABA Desktop Client` (o nome a scelta)
6. Clicca **"Create"**
7. Apparirà un popup con "OAuth client created"
8. Clicca **"Download JSON"**
9. Salva il file scaricato come **`credentials.json`** nella root del progetto `lezioni-live-aba/`

**IMPORTANTE:** NON committare questo file su Git! È incluso in `.gitignore`.

### Step 5: Configurare Variabili .env

Crea o modifica il file `.env` nella root del progetto con queste variabili:

```bash
# YouTube API
YOUTUBE_CHANNEL_ID=UC18Pm8LKXwtK2uUSoif5RVw

# Google OAuth
GOOGLE_CLIENT_SECRET_FILE=credentials.json
GOOGLE_TOKEN_FILE=token.json
```

### Step 6: Prima Autenticazione OAuth

Esegui lo script di autenticazione:

```bash
python execution/youtube_oauth_setup.py
```

**Cosa succederà:**
1. Lo script leggerà `credentials.json`
2. Aprirà automaticamente il browser
3. Ti chiederà di fare login con l'account Google
4. Mostrerà una schermata "Google hasn't verified this app"
   - Clicca **"Advanced"**
   - Clicca **"Go to Lezioni Live ABA (unsafe)"** (è sicuro, è la tua app)
5. Richiederà il permesso di "View your YouTube account"
   - Clicca **"Allow"**
6. Tornerai a una pagina con "The authentication flow has completed"
7. Lo script salverà il token in `token.json`

**Output Atteso:**

```
Autenticazione completata con successo!
Token salvato in: token.json
Il token è valido per 7 giorni (modalità Testing).
```

### Step 7: Verifica Token

Controlla che il file `token.json` sia stato creato nella root del progetto.

**IMPORTANTE:** NON committare questo file su Git! È incluso in `.gitignore`.

## Output Atteso

Al termine del setup, dovresti avere:

- ✅ Progetto Google Cloud creato
- ✅ YouTube Data API v3 abilitata
- ✅ OAuth consent screen configurato
- ✅ Credenziali OAuth 2.0 create
- ✅ File `credentials.json` scaricato e salvato nella root
- ✅ File `.env` configurato con variabili corrette
- ✅ File `token.json` generato dopo prima autenticazione

## Casi Limite e Troubleshooting

### Caso 1: "Access blocked: This app's request is invalid"
**Causa:** Lo scope OAuth non è stato configurato correttamente.
**Soluzione:**
1. Vai su OAuth consent screen
2. Clicca "Edit App"
3. Vai alla sezione Scopes
4. Aggiungi `https://www.googleapis.com/auth/youtube.readonly`
5. Salva e riprova l'autenticazione

### Caso 2: "The authentication flow has completed" ma nessun token.json
**Causa:** Lo script potrebbe essere stato interrotto o ci sono problemi di permessi.
**Soluzione:**
1. Controlla i permessi della directory (deve essere scrivibile)
2. Riesegui `python execution/youtube_oauth_setup.py`
3. Controlla eventuali errori nel terminale

### Caso 3: Token scade dopo 7 giorni
**Causa:** L'app è in modalità "Testing" (limite di Google).
**Soluzioni:**
- **Opzione A (semplice):** Ri-esegui `youtube_oauth_setup.py` ogni 7 giorni
- **Opzione B (automatica):** Implementa refresh automatico del token nello script (già incluso)
- **Opzione C (permanente):** Pubblica l'app OAuth (richiede verifica Google, processo lungo)

**Raccomandazione:** Usa Opzione B (già implementata negli script). Il token viene automaticamente rinnovato quando scade.

### Caso 4: "Daily Limit Exceeded"
**Causa:** Hai superato le 10.000 unità giornaliere.
**Soluzione:**
1. Vai su https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
2. Controlla l'utilizzo
3. Attendi il reset (mezzanotte Pacific Time)
4. Opzionale: Richiedi aumento quota (raramente necessario)

### Caso 5: "Invalid Client Secret" durante autenticazione
**Causa:** Il file `credentials.json` è corrotto o non corrisponde al progetto.
**Soluzione:**
1. Torna su Google Cloud Console → Credentials
2. Elimina il client OAuth esistente
3. Crea un nuovo OAuth client ID
4. Scarica il nuovo `credentials.json`
5. Sostituisci il vecchio file
6. Riesegui l'autenticazione

## Manutenzione

### Verifica Periodica (settimanale)

```bash
# Controlla se il token è ancora valido
python -c "import os; from google.oauth2.credentials import Credentials; creds = Credentials.from_authorized_user_file('token.json'); print('Token valido' if creds.valid else 'Token scaduto - riesegui youtube_oauth_setup.py')"
```

### Rotazione Token (automatica)

Gli script `fetch_all_videos.py` e `refresh_cache.py` includono già la logica per:
1. Verificare se il token è scaduto
2. Tentare il refresh automatico
3. Se il refresh fallisce, mostrare un messaggio chiaro per ri-autenticare

## Sicurezza

- **NON condividere** `credentials.json` o `token.json` pubblicamente
- **NON committare** questi file su Git (usa `.gitignore`)
- **NON pubblicare** screenshot della Google Cloud Console che mostrino client secrets
- Se compromessi, **revoca immediatamente** le credenziali:
  1. Vai su https://console.cloud.google.com/apis/credentials
  2. Elimina il client OAuth
  3. Crea nuove credenziali
  4. Ri-autentica

## Link Utili

- Google Cloud Console: https://console.cloud.google.com
- YouTube Data API Docs: https://developers.google.com/youtube/v3
- OAuth 2.0 Playground: https://developers.google.com/oauthplayground
- Quota Calculator: https://developers.google.com/youtube/v3/determine_quota_cost

## Prossimi Passi

Dopo aver completato questo setup, puoi procedere con:
1. `execution/fetch_all_videos.py` — Scarica tutti i video live
2. `directives/fetch_youtube_videos.md` — SOP per il recupero video

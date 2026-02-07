# 🎓 Lezioni Live ABA

Applicazione web per visualizzare tutte le lezioni live di teoria patente dell'**Autoscuola ABA** (Bassano del Grappa e Cartigliano) pubblicate su YouTube dal maggio 2020 ad oggi.

## 📋 Caratteristiche

- 🎨 **Interfaccia stile post-it** — Ogni lezione è rappresentata come un post-it colorato con rotazione realistica
- 📺 **~1.530 video live** — Tutte le lezioni dal 18 maggio 2020
- 📱 **Responsive** — Ottimizzato per desktop, tablet e mobile
- ⚡ **Cache intelligente** — Nessuna chiamata API durante le visite degli utenti
- 🔍 **Navigazione per anni** — Barra sticky per saltare rapidamente agli anni
- 🎯 **Zero configurazione frontend** — Usa dati mock per sviluppo senza OAuth

## 🏗️ Architettura

Il progetto segue un'architettura a **3 livelli**:

1. **Direttive** (`directives/`) — SOP in Markdown che descrivono COSA fare
2. **Orchestrazione** — (Non presente, gestione manuale/cron)
3. **Esecuzione** (`execution/`) — Script Python deterministici

### Stack Tecnologico

- **Frontend**: Next.js 14 + React + Tailwind CSS + TypeScript
- **Backend**: FastAPI (Python 3.10+)
- **API**: YouTube Data API v3 (OAuth 2.0)
- **Deploy**: Vercel/Netlify (frontend) + Railway/Render (backend)

## 📁 Struttura Progetto

```
lezioni-live-aba/
├── frontend/                # App Next.js
│   ├── app/                # Pages (App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/         # Componenti React
│   │   ├── Layout/        # Header, Footer, YearNavBar
│   │   ├── PostIt/        # PostItCard, PostItGrid
│   │   ├── Sections/      # YearSection, MonthSection
│   │   ├── Stats/         # StatsBar
│   │   └── UI/            # ScrollToTop
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
├── backend/                # API FastAPI
│   ├── main.py            # Entry point
│   └── requirements.txt
├── directives/            # SOP in Markdown
│   ├── setup_google_cloud.md
│   ├── fetch_youtube_videos.md
│   ├── cache_strategy.md
│   └── deploy_integration.md
├── execution/             # Script Python
│   ├── youtube_oauth_setup.py
│   ├── fetch_all_videos.py
│   ├── refresh_cache.py
│   ├── generate_static_json.py
│   └── generate_mock_data.py
├── data/                  # Cache JSON
│   ├── videos_cache.json         (generato da fetch_all_videos.py)
│   └── videos_cache_mock.json    (dati di test)
├── brand-guidelines.md
├── CLAUDE.md             # Architettura e principi
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Opzione 1: Sviluppo con Dati Mock (consigliata per iniziare)

**Nessuna configurazione OAuth necessaria!**

```bash
# 1. Clona il repository
cd lezioni-live-aba

# 2. I dati mock sono già stati generati in data/videos_cache_mock.json

# 3. Avvia backend (usa dati mock automaticamente)
cd backend
pip install -r requirements.txt
python main.py
# Backend su http://localhost:8000

# 4. Avvia frontend (in un altro terminale)
cd frontend
npm install
npm run dev
# Frontend su http://localhost:3000

# 5. Apri http://localhost:3000 nel browser
```

✅ Ora puoi sviluppare e testare l'app con 50 video mock realistici!

### Opzione 2: Produzione con Dati Reali YouTube

**Richiede configurazione Google Cloud OAuth.**

#### Step 1: Setup Google Cloud

Segui la guida dettagliata in [`directives/setup_google_cloud.md`](directives/setup_google_cloud.md):

1. Crea progetto su https://console.cloud.google.com
2. Abilita YouTube Data API v3
3. Crea credenziali OAuth 2.0 (Desktop app)
4. Scarica `credentials.json` e salvalo nella root del progetto
5. Configura `.env`:

```bash
cp .env.example .env
# Modifica .env con i tuoi valori
```

#### Step 2: Prima Autenticazione

```bash
python3 execution/youtube_oauth_setup.py
```

Si aprirà il browser per l'OAuth flow. Segui le istruzioni.

#### Step 3: Fetch Tutti i Video

```bash
python3 execution/fetch_all_videos.py
```

- ⏱️ Durata: ~40 secondi
- 💰 Costo API: ~63 unità su 10.000 giornaliere
- 📄 Output: `data/videos_cache.json`

#### Step 4: Avvia Backend e Frontend

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (altro terminale)
cd frontend
npm install
npm run dev
```

## 📊 Aggiornamento Cache

I video storici non cambiano, ma nuovi video vengono pubblicati. Aggiorna la cache:

### Manuale

```bash
python3 execution/refresh_cache.py
```

- ⏱️ Durata: ~10 secondi
- 💰 Costo API: ~10 unità
- 📝 Logica: Fetch solo ultimi 100 video, merge con cache esistente

### Automatico (Cron Job)

**Linux/macOS:**

```bash
crontab -e
# Aggiungi questa riga per eseguire ogni giorno alle 2 AM:
0 2 * * * cd /path/to/lezioni-live-aba && python3 execution/refresh_cache.py >> .tmp/cron.log 2>&1
```

**Windows Task Scheduler:** Vedi `directives/cache_strategy.md`

## 🎨 Design System

Tutti i colori, font e stili sono definiti in [`brand-guidelines.md`](brand-guidelines.md):

- **Colori principali:**
  - Rosso ABA: `#D32F2F`
  - Giallo post-it: `#FFEB3B`
  - Background: `#FFF8E1`

- **Font:**
  - Titoli: Poppins (600/700)
  - Corpo: Inter (400/500)

- **Stile post-it:**
  - Ombra realistica
  - Rotazione casuale -3° a +3° (deterministica)
  - Hover: raddrizzamento + scale 1.03

## 🛠️ Comandi Utili

### Backend

```bash
# Sviluppo
cd backend
python main.py

# Con reload automatico
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test endpoint
curl http://localhost:8000/api/health
curl http://localhost:8000/api/videos | jq '.total_videos'
```

### Frontend

```bash
cd frontend

# Sviluppo
npm run dev

# Build produzione
npm run build

# Preview build
npm run start

# Lint
npm run lint
```

### Script Python

```bash
# OAuth setup (prima volta)
python3 execution/youtube_oauth_setup.py

# Sync completo (~63 unità API, ~40s)
python3 execution/fetch_all_videos.py

# Sync incrementale (~10 unità API, ~10s)
python3 execution/refresh_cache.py

# Genera JSON frontend ottimizzato
python3 execution/generate_static_json.py

# Genera dati mock per test
python3 execution/generate_mock_data.py
```

## 📦 Deploy

Vedi [`directives/deploy_integration.md`](directives/deploy_integration.md) per strategie complete.

### Opzione Consigliata: Subdirectory + Backend Separato

1. **Frontend static export:**
   ```bash
   cd frontend
   # Modifica next.config.js: decomment output: 'export' e basePath
   npm run build
   # Upload cartella out/ su server → /var/www/html/lezioni-live/
   ```

2. **Backend su Railway:**
   - Deploy gratuito su https://railway.app
   - Configura variabili ambiente
   - Auto-deploy da GitHub

3. **Cron job per refresh:**
   - Setup su server backend
   - Esegui `refresh_cache.py` giornalmente

## 🔒 Sicurezza

### File da NON committare su Git

Già in `.gitignore`:
- `credentials.json` — Client secret Google
- `token.json` — Token OAuth
- `.env` — Variabili ambiente
- `.tmp/` — Log e file temporanei

### Best Practices

- ✅ Token OAuth scade dopo 7 giorni (modalità Testing)
- ✅ Refresh automatico implementato negli script
- ✅ CORS configurato solo per domini autorizzati
- ✅ Endpoint `/api/refresh` protetto da API key

## 📖 Documentazione

- [`CLAUDE.md`](CLAUDE.md) — Architettura e principi di sviluppo
- [`brand-guidelines.md`](brand-guidelines.md) — Colori, font, stile visivo
- [`directives/`](directives/) — Guide operative dettagliate:
  - `setup_google_cloud.md` — Setup OAuth passo-passo
  - `fetch_youtube_videos.md` — Strategia API e ottimizzazione quota
  - `cache_strategy.md` — Gestione cache e refresh
  - `deploy_integration.md` — Opzioni di deploy

## 🐛 Troubleshooting

### "Token scaduto"

```bash
python3 execution/youtube_oauth_setup.py
```

### "Cache non trovata" (Backend)

```bash
# Usa dati mock
python3 execution/generate_mock_data.py

# Oppure fetch reali
python3 execution/fetch_all_videos.py
```

### "Quota API esaurita"

- Limite: 10.000 unità/giorno
- Reset: Mezzanotte Pacific Time
- Verifica: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

### Frontend non carica video

1. Verifica backend sia running: http://localhost:8000/api/health
2. Controlla CORS in `backend/main.py`
3. Verifica `NEXT_PUBLIC_API_URL` in frontend `.env`

## 📊 Statistiche Progetto

- **Video totali:** ~1.530 lezioni live
- **Periodo:** Maggio 2020 - Oggi
- **Ore totali:** ~1.200 ore di lezione
- **Costo sync completo:** 63 unità API (0.63% quota giornaliera)
- **Costo sync incrementale:** 10 unità API (0.1% quota giornaliera)

## 🤝 Contatti

**Autoscuola ABA**
- Bassano del Grappa
- Cartigliano
- Canale YouTube ID: `UC18Pm8LKXwtK2uUSoif5RVw`

## 📄 Licenza

Progetto privato per Autoscuola ABA.

---

**Developed with ❤️ for Autoscuola ABA students**

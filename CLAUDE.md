# CLAUDE.md — Architettura Progetto Lezioni Live ABA

## Contesto

Questo progetto è un'applicazione web per **Autoscuola ABA** che permette agli allievi di sfogliare tutte le lezioni live fatte su YouTube dal 18 maggio 2020 ad oggi (~1.530 video privati).

## Architettura a 3 Livelli

Questo progetto segue un'architettura rigorosa a **3 livelli**:

### Livello 1: Direttive (directives/)
**Cosa sono:** SOP (Standard Operating Procedures) in formato Markdown che descrivono **COSA** fare e **PERCHÉ**.

**Caratteristiche:**
- Scritte in linguaggio naturale
- Contengono: Obiettivo, Input, Script da usare, Output atteso, Casi limite
- Non contengono codice eseguibile
- Sono la documentazione di riferimento per ogni operazione

**File in questo livello:**
- `setup_google_cloud.md` — Come configurare Google Cloud e OAuth
- `fetch_youtube_videos.md` — Come recuperare i video da YouTube API
- `cache_strategy.md` — Come gestire la cache dei dati
- `deploy_integration.md` — Come integrare l'app nel sito esistente

### Livello 2: Orchestrazione (non presente in questo progetto)
**Cosa sarebbe:** Script che coordinano più esecuzioni o prendono decisioni basate su condizioni.

**In questo progetto:** Non necessario. L'orchestrazione è manuale o tramite cron job.

### Livello 3: Esecuzione (execution/)
**Cosa sono:** Script Python **deterministici** che eseguono operazioni specifiche.

**Caratteristiche:**
- Codice Python eseguibile
- Ogni script ha uno scopo singolo e ben definito
- Gestione errori robusta
- Logging dettagliato
- Usano variabili da `.env`
- NON prendono decisioni complesse, solo eseguono

**File in questo livello:**
- `youtube_oauth_setup.py` — Autenticazione OAuth e salvataggio token
- `fetch_all_videos.py` — Sync completo di tutti i video live
- `refresh_cache.py` — Aggiornamento incrementale della cache
- `generate_static_json.py` — Genera JSON ottimizzato per il frontend

## Stack Tecnologico

### Frontend
- **Framework:** Next.js 14+ con App Router
- **UI:** React + Tailwind CSS
- **Stile:** Post-it realistici (ombra, rotazione, hover effects)
- **Fonts:** Poppins (titoli), Inter (corpo)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Ruolo:** Servire dati cached, NON chiamare YouTube API durante richieste utente
- **CORS:** Configurato per sito autoscuola + localhost

### Integrazione YouTube
- **API:** YouTube Data API v3
- **Auth:** OAuth 2.0 (scope: youtube.readonly)
- **Quota:** ~63 unità per sync completo su 10.000 giornaliere

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                  FASE INIZIALE (UNA VOLTA)              │
└─────────────────────────────────────────────────────────┘
1. Utente: Configura Google Cloud (segue setup_google_cloud.md)
2. Utente: Scarica credentials.json da Google Cloud Console
3. Script: python execution/youtube_oauth_setup.py
   → Apre browser, OAuth flow, salva token.json
4. Script: python execution/fetch_all_videos.py
   → Chiama YouTube API, scarica ~1.530 video, salva data/videos_cache.json

┌─────────────────────────────────────────────────────────┐
│              AGGIORNAMENTO PERIODICO (GIORNALIERO)      │
└─────────────────────────────────────────────────────────┘
1. Cron job o manuale: python execution/refresh_cache.py
   → Scarica solo ultimi 100 video, merge con cache esistente
2. Script: python execution/generate_static_json.py
   → Raggruppa per anno/mese, salva frontend/public/data/videos.json

┌─────────────────────────────────────────────────────────┐
│                   RICHIESTA UTENTE                      │
└─────────────────────────────────────────────────────────┘
1. Utente apre app nel browser
2. Frontend Next.js chiama → GET /api/videos
3. Backend FastAPI legge → data/videos_cache.json
4. Frontend renderizza → Grid di post-it
5. Click su post-it → Apre YouTube in nuova tab
```

## Quote YouTube API

**CRITICO:** Non usare `search.list` (costa 100 unità). Usa invece:

1. `channels.list` (1 unità) → Ottieni uploads playlist ID
2. `playlistItems.list` (1 unità/pagina) → Ottieni tutti i videoId (~31 chiamate)
3. `videos.list` (1 unità/50 video) → Ottieni dettagli (~31 chiamate)

**Totale: ~63 unità per sync completo** (puoi farlo 158 volte al giorno).

## Gestione Cache

- **Cache primaria:** `data/videos_cache.json` (usata dal backend)
- **Cache frontend:** `frontend/public/data/videos.json` (inclusa nel build statico)
- **Refresh:** Manuale o cron job, NON durante richieste utente
- **Invalidazione:** Non necessaria, i video non cambiano retroattivamente

## Design System

**Vedi `brand-guidelines.md` per:**
- Colori (Rosso ABA: #D32F2F, Giallo post-it: #FFEB3B)
- Font (Poppins, Inter)
- Stile visivo (post-it realistici con ombra e rotazione)

## Principi di Sviluppo

1. **Separazione netta:** Direttive → Esecuzione. No codice nelle direttive, no decisioni negli script.
2. **Idempotenza:** Gli script possono essere rieseguiti senza danni (es. fetch_all_videos sovrascrive, non appende).
3. **Gestione errori esplicita:** Ogni script cattura e logga errori con messaggi chiari.
4. **Zero segreti in Git:** `.env`, `token.json`, `credentials.json` sono in .gitignore.
5. **Dati mock per sviluppo:** Il frontend può essere sviluppato con `videos_cache_mock.json` senza attendere OAuth.

## Deploy

### Opzione 1: Static Export (consigliata)
1. Backend genera `frontend/public/data/videos.json`
2. `cd frontend && npm run build`
3. Copia `out/` in subdirectory del sito autoscuola (`/lezioni-live/`)

### Opzione 2: Con Backend Live
1. Deploy backend su server Python (es. DigitalOcean, Railway)
2. Deploy frontend su Vercel/Netlify
3. Configura CORS per permettere chiamate

### Opzione 3: Sottodominio
1. `lezioni.autoscuolaaba.it` punta all'app
2. Deploy completo (frontend + backend)

## File da NON committare

- `.env` — Variabili d'ambiente
- `token.json` — Token OAuth (scade dopo 7 giorni in modalità Testing)
- `credentials.json` — Client secret Google
- `.tmp/` — File temporanei e log
- `node_modules/` — Dipendenze npm
- `__pycache__/` — Cache Python
- `.next/` — Build Next.js

## Comandi Principali

```bash
# Setup iniziale
python execution/youtube_oauth_setup.py

# Sync completo (~63 unità API)
python execution/fetch_all_videos.py

# Aggiornamento incrementale (~10 unità API)
python execution/refresh_cache.py

# Genera JSON per frontend
python execution/generate_static_json.py

# Sviluppo frontend
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build

# Sviluppo backend
cd backend && uvicorn main:app --reload
```

## Testing

- **Frontend:** Usa dati mock (`data/videos_cache_mock.json`)
- **Backend:** Testa endpoint con curl o Postman
- **Script Python:** Esegui singolarmente, controlla log in `.tmp/`

## Manutenzione

- **Giornaliera:** Esegui `refresh_cache.py` (automatizzabile con cron)
- **Settimanale:** Verifica che `token.json` non sia scaduto
- **Mensile:** Controlla quota API usata su Google Cloud Console

## Contatti

**Autoscuola ABA**
- Bassano del Grappa
- Cartigliano
- Canale YouTube ID: UC18Pm8LKXwtK2uUSoif5RVw

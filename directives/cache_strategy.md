# Direttiva: Cache Strategy

## Obiettivo

Minimizzare le chiamate alla YouTube Data API durante le richieste degli utenti, garantendo dati aggiornati con un sistema di cache efficiente e aggiornamenti periodici.

## Problema

La YouTube Data API ha un limite di **10.000 unità al giorno**. Se ogni visita di un utente facesse chiamate API:
- Con 100 visitatori al giorno → 6.300 unità (63 × 100) → vicini al limite
- Con 200 visitatori → quota esaurita
- Esperienza utente lenta (ogni chiamata API impiega ~1-2 secondi)

## Soluzione

**Caching aggressivo** con aggiornamenti periodici offline.

### Principi

1. **Mai chiamare YouTube API durante richieste utente**
2. **Cache primaria:** `data/videos_cache.json` (usata dal backend)
3. **Sync offline:** Aggiornamenti schedulati o manuali
4. **Dati semi-statici:** I video storici non cambiano, solo nuovi video vengono aggiunti

## Architettura Cache

```
┌──────────────────────────────────────────────────────────┐
│                    AGGIORNAMENTO CACHE                   │
│                   (Offline, periodico)                   │
└──────────────────────────────────────────────────────────┘

[Cron Job / Manuale]
    ↓
execution/refresh_cache.py
    ↓
YouTube Data API (~10 unità)
    ↓
data/videos_cache.json (aggiornato)
    ↓
execution/generate_static_json.py (opzionale)
    ↓
frontend/public/data/videos.json


┌──────────────────────────────────────────────────────────┐
│                    RICHIESTA UTENTE                      │
│                 (Nessuna chiamata API)                   │
└──────────────────────────────────────────────────────────┘

[Browser Utente]
    ↓
GET /api/videos
    ↓
Backend FastAPI
    ↓
Legge data/videos_cache.json (file locale)
    ↓
Risposta JSON (< 100ms)
```

## File di Cache

### 1. `data/videos_cache.json` (Cache Backend)

**Ruolo:** Cache primaria usata dal backend FastAPI.

**Struttura:**
```json
{
  "last_updated": "2025-02-07T14:30:00Z",
  "total_videos": 1530,
  "videos": [
    {
      "id": "VIDEO_ID",
      "title": "Lezione live - ...",
      "published_at": "2024-12-15T18:00:00Z",
      "year": 2024,
      "month": 12,
      "duration_seconds": 5025,
      "duration_formatted": "1h 23m",
      "thumbnail_url": "https://...",
      "watch_url": "https://..."
    }
  ]
}
```

**Aggiornamento:**
- **Completo:** `python execution/fetch_all_videos.py` (prima volta o reset)
- **Incrementale:** `python execution/refresh_cache.py` (giornaliero)

**Tempo di vita (TTL):**
- Nessun TTL hard-coded
- Si aggiorna quando lo script viene eseguito
- Considerato "fresco" per 24 ore

### 2. `frontend/public/data/videos.json` (Cache Frontend - Opzionale)

**Ruolo:** JSON ottimizzato per il frontend, generato da `videos_cache.json`.

**Quando usarlo:**
- Se il frontend è deployato come **static export** (Next.js `npm run build`)
- Il JSON viene incluso nel build e servito direttamente (nessun backend)

**Struttura:**
```json
{
  "last_updated": "2025-02-07T14:30:00Z",
  "total_videos": 1530,
  "total_hours": 1200,
  "years": [
    {
      "year": 2024,
      "total": 312,
      "months": [
        {
          "month": 12,
          "month_name": "Dicembre",
          "total": 18,
          "videos": [...]
        }
      ]
    }
  ]
}
```

**Aggiornamento:**
```bash
python execution/generate_static_json.py
```

**Quando generarlo:**
- Dopo ogni `refresh_cache.py`
- Prima di fare `npm run build` del frontend

## Script di Aggiornamento

### Sync Completo: `fetch_all_videos.py`

**Quando eseguirlo:**
- Prima volta (setup iniziale)
- Reset completo della cache
- Sospetti corruzione dati

**Costo API:** ~63 unità

**Durata:** ~40 secondi

**Comando:**
```bash
python execution/fetch_all_videos.py
```

**Output:**
- Sovrascrive `data/videos_cache.json`
- Log in `.tmp/fetch_errors.log`

### Sync Incrementale: `refresh_cache.py`

**Quando eseguirlo:**
- Giornalmente (automatico via cron)
- Dopo aver caricato nuovi video live su YouTube

**Costo API:** ~10 unità (fetch solo ultime 2 pagine = 100 video)

**Durata:** ~10 secondi

**Comando:**
```bash
python execution/refresh_cache.py
```

**Logica:**
1. Carica `data/videos_cache.json` esistente
2. Fetch solo ultime 2 pagine di `playlistItems` (100 video più recenti)
3. Confronta ID: se un video è già in cache → skippa
4. Fetch dettagli solo per video nuovi
5. Merge con cache esistente
6. Ordina per data decrescente
7. Salva cache aggiornata

**Output:**
```
Aggiunti 3 nuovi video. Totale: 1.533
Quota API usata: ~8 unità
Cache aggiornata in: data/videos_cache.json
```

## Schedulazione Automatica

### Opzione 1: Cron Job (Linux/macOS)

**Setup:**
```bash
crontab -e
```

**Aggiungi questa riga per eseguire ogni giorno alle 2:00 AM:**
```cron
0 2 * * * cd /path/to/lezioni-live-aba && python execution/refresh_cache.py >> .tmp/cron.log 2>&1
```

**Con generazione JSON frontend:**
```cron
0 2 * * * cd /path/to/lezioni-live-aba && python execution/refresh_cache.py && python execution/generate_static_json.py >> .tmp/cron.log 2>&1
```

### Opzione 2: Task Scheduler (Windows)

1. Apri **Task Scheduler**
2. Crea nuova task
3. **Trigger:** Giornaliero, ore 2:00
4. **Action:** Esegui `python.exe`
5. **Arguments:** `execution/refresh_cache.py`
6. **Start in:** `C:\path\to\lezioni-live-aba`

### Opzione 3: Systemd Timer (Linux Server)

Crea `/etc/systemd/system/refresh-aba-cache.service`:
```ini
[Unit]
Description=Refresh ABA Videos Cache

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/var/www/lezioni-live-aba
ExecStart=/usr/bin/python3 execution/refresh_cache.py
ExecStartPost=/usr/bin/python3 execution/generate_static_json.py
```

Crea `/etc/systemd/system/refresh-aba-cache.timer`:
```ini
[Unit]
Description=Refresh ABA Cache Daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Abilita:
```bash
sudo systemctl enable refresh-aba-cache.timer
sudo systemctl start refresh-aba-cache.timer
```

### Opzione 4: Cloud Function (Google Cloud)

Se il backend è su Google Cloud:
1. Deploy `refresh_cache.py` come Cloud Function
2. Trigger: Cloud Scheduler (daily)
3. Salva `videos_cache.json` su Cloud Storage
4. Backend FastAPI legge da Cloud Storage

## Invalidazione Cache

### Quando invalidare manualmente

**Scenario 1:** Hai eliminato un video su YouTube
```bash
python execution/fetch_all_videos.py  # Reset completo
```

**Scenario 2:** Hai modificato titolo/descrizione di un video
```bash
python execution/fetch_all_videos.py  # Gli edit vengono riflessi
```

**Scenario 3:** Hai caricato molti nuovi video in blocco
```bash
python execution/refresh_cache.py  # Incrementale basta (se < 100 video nuovi)
# oppure
python execution/fetch_all_videos.py  # Se > 100 video nuovi
```

### Cache Browser (Frontend)

Il backend FastAPI deve inviare header HTTP per cache browser:

```python
@app.get("/api/videos")
async def get_videos():
    return JSONResponse(
        content=videos_data,
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache 1 ora
            "ETag": f'"{videos_data["last_updated"]}"',  # ETag basato su timestamp
        }
    )
```

**Comportamento:**
- Prima richiesta: browser scarica JSON (~500KB)
- Richieste successive (entro 1 ora): usa cache locale
- Dopo 1 ora: richiede nuovamente (ma probabilmente i dati sono identici)

## Monitoraggio Cache

### Endpoint Health Backend

```python
@app.get("/api/health")
async def health():
    cache_file = "data/videos_cache.json"
    if not os.path.exists(cache_file):
        return {"status": "error", "message": "Cache non trovata"}

    cache_age_seconds = time.time() - os.path.getmtime(cache_file)
    cache_age_hours = cache_age_seconds / 3600

    data = json.load(open(cache_file))

    return {
        "status": "ok",
        "cache_age_hours": round(cache_age_hours, 2),
        "total_videos": data["total_videos"],
        "last_updated": data["last_updated"],
    }
```

**Risposta esempio:**
```json
{
  "status": "ok",
  "cache_age_hours": 6.5,
  "total_videos": 1530,
  "last_updated": "2025-02-07T02:00:00Z"
}
```

### Alert Automatici

**Controlla se la cache è troppo vecchia:**
```bash
#!/bin/bash
# Script di monitoring: .tmp/check_cache_age.sh

CACHE_FILE="data/videos_cache.json"
MAX_AGE_HOURS=48  # Alert se > 48 ore

if [ ! -f "$CACHE_FILE" ]; then
    echo "ALERT: Cache non trovata!"
    exit 1
fi

AGE_SECONDS=$(( $(date +%s) - $(stat -f %m "$CACHE_FILE") ))
AGE_HOURS=$(( AGE_SECONDS / 3600 ))

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
    echo "ALERT: Cache ha $AGE_HOURS ore (max $MAX_AGE_HOURS)"
    exit 1
else
    echo "OK: Cache ha $AGE_HOURS ore"
    exit 0
fi
```

Esegui con cron ogni 6 ore:
```cron
0 */6 * * * /path/to/.tmp/check_cache_age.sh || mail -s "ABA Cache Alert" admin@example.com
```

## Gestione Errori

### Errore durante refresh incrementale

**Se `refresh_cache.py` fallisce:**
1. Log dell'errore in `.tmp/fetch_errors.log`
2. La cache esistente **non viene modificata** (atomicità)
3. Gli utenti continuano a vedere i dati vecchi (meglio che niente)
4. Il prossimo cron job riproverà

**Strategia:**
```python
try:
    new_cache_data = fetch_and_merge()
    # Salva in file temporaneo prima
    with open('data/videos_cache.json.tmp', 'w') as f:
        json.dump(new_cache_data, f)
    # Solo se scrittura OK, sostituisci file originale
    os.replace('data/videos_cache.json.tmp', 'data/videos_cache.json')
except Exception as e:
    log_error(e)
    # videos_cache.json non è stato toccato
```

### Corruzione cache

**Sintomo:** `videos_cache.json` non è un JSON valido

**Soluzione:**
1. Backup automatico prima di ogni aggiornamento:
   ```bash
   cp data/videos_cache.json data/videos_cache.json.backup
   ```
2. Se parsing fallisce, ripristina backup:
   ```bash
   cp data/videos_cache.json.backup data/videos_cache.json
   ```
3. Esegui sync completo:
   ```bash
   python execution/fetch_all_videos.py
   ```

## Performance

### Dimensione File

**Stima per 1.530 video:**
- `videos_cache.json`: ~500 KB (compresso ~100 KB con gzip)
- `videos.json` (frontend): ~600 KB (più metadati)

**Ottimizzazione:**
- Backend serve con `Content-Encoding: gzip`
- Frontend usa lazy loading (non carica tutto in RAM)

### Tempo di Risposta API

**Lettura cache locale:**
- Lettura `videos_cache.json`: ~10-20 ms
- Parsing JSON: ~30-50 ms
- Serializzazione risposta: ~20-30 ms
- **Totale: ~60-100 ms** (molto veloce)

**Confronto con chiamata YouTube API:**
- Chiamata API: ~500-1.000 ms
- **Cache è 10× più veloce**

## Strategia Long-term

**Quando il numero di video cresce (> 5.000):**

1. **Paginazione backend:**
   ```
   GET /api/videos?page=1&limit=100
   GET /api/videos?year=2024&month=12
   ```

2. **Database invece di JSON:**
   - Migra a SQLite o PostgreSQL
   - Query più veloci su dataset grandi
   - Filtraggio server-side

3. **CDN per JSON statico:**
   - Servi `videos.json` da CDN (Cloudflare, AWS CloudFront)
   - Invalidazione cache CDN dopo ogni update

4. **Incremental Static Regeneration (Next.js):**
   - Usa ISR di Next.js per rigenerare pagine ogni 24h
   - Nessun backend necessario

## Checklist Implementazione

- [ ] Script `fetch_all_videos.py` crea `data/videos_cache.json`
- [ ] Script `refresh_cache.py` aggiorna cache incrementalmente
- [ ] Script `generate_static_json.py` crea JSON frontend (se serve)
- [ ] Cron job configurato per refresh giornaliero
- [ ] Backend FastAPI legge solo da file locale (mai API diretta)
- [ ] Header HTTP `Cache-Control` configurati
- [ ] Endpoint `/api/health` per monitorare cache age
- [ ] Backup automatico prima di ogni update
- [ ] Gestione errori atomica (no corruzione cache)
- [ ] Log in `.tmp/fetch_errors.log`

## Prossimi Passi

Dopo aver implementato la cache strategy:
1. Testa sync completo e incrementale
2. Verifica dimensione e formato JSON
3. Configura cron job di produzione
4. Procedi con sviluppo backend (`backend/main.py`)
5. Vedi `directives/deploy_integration.md` per deploy finale

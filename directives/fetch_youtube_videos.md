# Direttiva: Fetch YouTube Videos

## Obiettivo

Recuperare tutti i video live (~1.530) dal canale YouTube ABA in modo efficiente, minimizzando l'uso di quota API, e salvarli in un formato strutturato per l'applicazione.

## Contesto

Il canale YouTube ABA (ID: `UC18Pm8LKXwtK2uUSoif5RVw`) contiene circa 1.530 video live privati pubblicati dal 18 maggio 2020 ad oggi. Gli allievi sono autorizzati a visualizzarli, ma i video devono essere elencati nell'app per facilitare la navigazione.

## Problema Quota API

⚠️ **CRITICO:** La YouTube Data API v3 ha un limite di **10.000 unità al giorno**. È essenziale usare gli endpoint più economici.

### ❌ APPROCCIO ERRATO (DA NON USARE)

**NON usare** `search.list`:
- Costa **100 unità per chiamata**
- Con 1.530 video servirebbero ~31 chiamate (50 risultati per pagina)
- Costo totale: **3.100 unità** solo per la ricerca
- Inefficiente e spreca quota

### ✅ APPROCCIO CORRETTO (DA USARE)

Usa un flusso in **3 step** con endpoint economici:

#### Step 1: `channels.list` — Ottieni Uploads Playlist ID
- **Endpoint:** `channels.list`
- **Parametri:**
  - `part=contentDetails`
  - `id=UC18Pm8LKXwtK2uUSoif5RVw`
- **Costo:** 1 unità
- **Output:** `contentDetails.relatedPlaylists.uploads` → Playlist ID
  - Formato: `UU18Pm8LKXwtK2uUSoif5RVw` (sostituisce `UC` → `UU`)

#### Step 2: `playlistItems.list` — Elenca Tutti i Video
- **Endpoint:** `playlistItems.list`
- **Parametri:**
  - `part=snippet`
  - `playlistId=UU18Pm8LKXwtK2uUSoif5RVw` (uploads playlist)
  - `maxResults=50` (massimo consentito)
- **Paginazione:** Usa `nextPageToken` per scorrere tutte le pagine
- **Costo:** 1 unità per pagina
- **Numero chiamate:** ~31 (1.530 video ÷ 50 per pagina)
- **Costo totale:** ~31 unità
- **Output per video:**
  - `snippet.resourceId.videoId` — ID del video
  - `snippet.title` — Titolo
  - `snippet.publishedAt` — Data pubblicazione (ISO 8601)
  - `snippet.thumbnails.medium.url` — Thumbnail (320×180)

#### Step 3: `videos.list` — Ottieni Dettagli Video
- **Endpoint:** `videos.list`
- **Parametri:**
  - `part=contentDetails,liveStreamingDetails`
  - `id=VIDEO_ID1,VIDEO_ID2,...` (fino a 50 ID per chiamata)
- **Batching:** Raggruppa 50 videoId per chiamata
- **Costo:** 1 unità per chiamata
- **Numero chiamate:** ~31 (1.530 video ÷ 50 per batch)
- **Costo totale:** ~31 unità
- **Output per video:**
  - `contentDetails.duration` — Durata in formato ISO 8601 (es. `PT1H23M45S`)
  - `liveStreamingDetails` — Presente solo se è un video live/streaming

### Costo Totale

**1 + 31 + 31 = ~63 unità** per un sync completo di tutti i video.

Con 10.000 unità giornaliere, puoi fare **158 sync completi al giorno** senza problemi.

## Filtro Video Live

**Importante:** Il canale potrebbe contenere video normali (non live). Devi filtrare solo i live.

**Criteri di filtro:**
- Il video deve avere `liveStreamingDetails` nella risposta di `videos.list`
- Se `liveStreamingDetails` è assente → skippa (non è un live)

**Esempio:**
```python
if 'liveStreamingDetails' in video_data:
    # È un video live, includilo
else:
    # Non è un live, skippa
```

## Formattazione Durata

La YouTube API restituisce la durata in formato **ISO 8601** (es. `PT1H23M45S`).

**Conversioni necessarie:**
- `PT1H23M45S` → 5.025 secondi → "1h 23m" (formato leggibile)
- `PT45M30S` → 2.730 secondi → "45m"
- `PT2H5M` → 7.500 secondi → "2h 5m"
- `PT30S` → 30 secondi → "30s" (raro per un live)

**Formula:**
```python
import isodate

duration_iso = "PT1H23M45S"
duration_seconds = int(isodate.parse_duration(duration_iso).total_seconds())

hours = duration_seconds // 3600
minutes = (duration_seconds % 3600) // 60

if hours > 0:
    duration_formatted = f"{hours}h {minutes}m"
else:
    duration_formatted = f"{minutes}m"
```

## Struttura Output JSON

Salva i dati in `data/videos_cache.json` con questa struttura:

```json
{
  "last_updated": "2025-02-07T14:30:00Z",
  "total_videos": 1530,
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Lezione live - Segnaletica stradale e precedenze",
      "published_at": "2024-12-15T18:00:00Z",
      "year": 2024,
      "month": 12,
      "duration_seconds": 5025,
      "duration_formatted": "1h 23m",
      "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      "watch_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      "id": "another_video_id",
      "title": "Lezione live - Norme sulla circolazione",
      "published_at": "2024-12-14T18:00:00Z",
      "year": 2024,
      "month": 12,
      "duration_seconds": 2700,
      "duration_formatted": "45m",
      "thumbnail_url": "https://i.ytimg.com/vi/another_video_id/mqdefault.jpg",
      "watch_url": "https://www.youtube.com/watch?v=another_video_id"
    }
  ]
}
```

**Campi obbligatori:**
- `id`: String — ID video YouTube
- `title`: String — Titolo video
- `published_at`: String — Data ISO 8601 (timezone UTC)
- `year`: Integer — Anno estratto da published_at
- `month`: Integer — Mese (1-12) estratto da published_at
- `duration_seconds`: Integer — Durata in secondi
- `duration_formatted`: String — Durata leggibile (es. "1h 23m")
- `thumbnail_url`: String — URL thumbnail YouTube (mqdefault.jpg = 320×180)
- `watch_url`: String — URL completo per guardare il video

**Ordinamento:**
- I video devono essere ordinati per `published_at` **decrescente** (più recenti prima)

## Script da Usare

### Sync Completo
```bash
python execution/fetch_all_videos.py
```

**Quando usarlo:**
- Prima sincronizzazione
- Quando si sospetta che la cache sia corrotta
- Reset completo dei dati

### Sync Incrementale
```bash
python execution/refresh_cache.py
```

**Quando usarlo:**
- Aggiornamento giornaliero
- Controlla solo gli ultimi 100 video (2 pagine di playlistItems)
- Aggiunge solo video nuovi non presenti nella cache

## Casi Limite e Gestione Errori

### Caso 1: Token OAuth Scaduto
**Sintomo:** Errore HTTP 401 Unauthorized

**Messaggio da loggare:**
```
ERRORE: Token OAuth scaduto o non valido.
Soluzione: Esegui 'python execution/youtube_oauth_setup.py' per ri-autenticare.
```

**Azione script:**
1. Cattura l'eccezione
2. Logga il messaggio d'errore in `.tmp/fetch_errors.log`
3. Prova a fare refresh automatico del token (se supportato)
4. Se il refresh fallisce, esci con codice 1 e messaggio chiaro

### Caso 2: Quota API Esaurita
**Sintomo:** Errore HTTP 403 con messaggio "quotaExceeded"

**Messaggio da loggare:**
```
ERRORE: Quota API giornaliera esaurita (10.000 unità).
La quota si resetta a mezzanotte Pacific Time.
Riprova domani o controlla l'utilizzo su: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
```

**Azione script:**
1. Cattura l'eccezione
2. Logga quota usata fino al momento dell'errore
3. Esci con codice 1

### Caso 3: Video Senza liveStreamingDetails
**Sintomo:** Alcuni video non hanno il campo `liveStreamingDetails`

**Azione:**
- Skippa il video (non è un live)
- NON loggare come errore (è normale)
- Conta i video skippati e logga alla fine:
  ```
  Sincronizzati 1.530 video live su 1.580 totali (50 non-live skippati).
  ```

### Caso 4: Durata Assente o Invalida
**Sintomo:** Campo `duration` assente o valore `P0D`

**Azione:**
- Segna `duration_seconds = 0`
- Segna `duration_formatted = "Durata non disponibile"`
- Logga un warning (non un errore):
  ```
  WARNING: Video 'XYZ123' non ha durata valida. Impostata a 0.
  ```

### Caso 5: Errori di Rete Temporanei
**Sintomo:** Timeout, connection reset, DNS error

**Azione:**
1. Implementa **retry con backoff esponenziale**:
   - 1° tentativo: attendi 2 secondi
   - 2° tentativo: attendi 4 secondi
   - 3° tentativo: attendi 8 secondi
   - Dopo 3 tentativi falliti → logga errore ed esci
2. Logga ogni retry:
   ```
   WARNING: Errore di rete durante chiamata API. Retry 1/3 tra 2 secondi...
   ```

### Caso 6: Video Eliminato Durante Sync
**Sintomo:** Un videoId presente in playlistItems non esiste in videos.list

**Azione:**
- Skippa il video (è stato eliminato)
- Logga un warning:
  ```
  WARNING: Video 'XYZ123' presente nella playlist ma non trovato in videos.list. Probabilmente eliminato.
  ```

## Logging

Ogni esecuzione dello script deve loggare in `.tmp/fetch_errors.log` con questo formato:

```
[2025-02-07 14:30:15] INFO: Inizio sync completo
[2025-02-07 14:30:16] INFO: Ottenuto uploads playlist ID: UU18Pm8LKXwtK2uUSoif5RVw
[2025-02-07 14:30:17] INFO: Paginazione playlistItems: pagina 1/31
[2025-02-07 14:30:18] INFO: Paginazione playlistItems: pagina 2/31
...
[2025-02-07 14:31:00] INFO: Raccolti 1.580 videoId dalla playlist
[2025-02-07 14:31:01] INFO: Batch fetch video dettagli: batch 1/32
...
[2025-02-07 14:32:00] INFO: Dettagli ottenuti per 1.580 video
[2025-02-07 14:32:01] INFO: Filtrati 1.530 video live (50 non-live skippati)
[2025-02-07 14:32:02] INFO: Ordinamento per data decrescente
[2025-02-07 14:32:03] INFO: Salvataggio in data/videos_cache.json
[2025-02-07 14:32:04] INFO: Sync completato con successo!
[2025-02-07 14:32:04] INFO: Quota API usata: ~63 unità su 10.000 giornaliere
[2025-02-07 14:32:04] INFO: Totale video live: 1.530
[2025-02-07 14:32:04] INFO: Prima lezione: 2020-05-18
[2025-02-07 14:32:04] INFO: Ultima lezione: 2025-02-06
[2025-02-07 14:32:04] INFO: Ore totali: ~1.200h
```

## Validazione Output

Dopo ogni sync, verifica che `data/videos_cache.json`:
- Sia un JSON valido (parsabile)
- Contenga il campo `last_updated` con timestamp recente
- Contenga il campo `total_videos` con numero corretto
- Contenga array `videos` con almeno 1.000 elementi (sanity check)
- Ogni video abbia tutti i campi obbligatori
- I video siano ordinati per `published_at` decrescente

**Script di validazione:**
```bash
python -c "import json; data = json.load(open('data/videos_cache.json')); print(f'✅ JSON valido: {data[\"total_videos\"]} video')"
```

## Performance

**Tempo atteso per sync completo:**
- Paginazione playlistItems (31 chiamate): ~15-20 secondi
- Batch fetch video dettagli (31 chiamate): ~15-20 secondi
- Parsing e salvataggio: ~2-3 secondi
- **Totale: ~35-45 secondi**

Se il sync impiega più di 2 minuti, controlla:
- Connessione internet lenta
- Rate limiting (aggiungi delay tra chiamate se necessario)
- Troppi retry per errori di rete

## Ottimizzazioni Future

Se il numero di video cresce molto (>5.000):
1. Considera di cachare anche i metadati paginati (non solo il JSON finale)
2. Implementa sync incrementale più sofisticato (confronta solo ultime N pagine)
3. Usa database SQLite invece di JSON flat per query più veloci

## Prossimi Passi

Dopo aver eseguito con successo `fetch_all_videos.py`:
1. Verifica `data/videos_cache.json` sia stato creato
2. Controlla il numero di video nel log
3. Procedi con `execution/generate_static_json.py` per creare il JSON frontend
4. Vedi `directives/cache_strategy.md` per la gestione cache

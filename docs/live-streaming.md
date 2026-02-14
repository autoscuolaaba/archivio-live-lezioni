# Live Streaming su ABAflix

## Panoramica

ABAflix ora supporta il **live streaming automatico**! Quando fai una diretta su YouTube, gli allievi iscritti vedono automaticamente un banner rosso in cima alla homepage con la possibilità di guardare la live direttamente dentro l'app.

## Come funziona

### 1. Durante la diretta

- **Tu**: Avvii una diretta sul canale YouTube (UC18Pm8LKXwtK2uUSoif5RVw)
- **ABAflix**: Controlla automaticamente ogni 30 secondi se c'è una live in corso
- **Banner**: Appare un banner rosso lampeggiante "🔴 DIRETTA IN CORSO - Clicca per guardare"
- **Allievi**: Cliccano sul banner e vedono la diretta embedded dentro ABAflix (solo se autenticati)

### 2. Dopo la diretta

- Il banner scompare automaticamente quando finisci la live
- Di notte, il GitHub Action sincronizza il video come sempre
- Il video appare nella griglia normale il giorno dopo

## Configurazione

### Variabile ambiente richiesta

Aggiungi questa variabile al file `.env` (locale) e su **Vercel** (produzione):

```env
YOUTUBE_API_KEY=AIza...
```

**Dove trovare la chiave:**
1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Progetto: `lezioni-live-aba` (o come lo hai chiamato)
3. **APIs & Services** → **Credentials**
4. Usa la stessa API key che usi per gli script Python (o creane una nuova)
5. Assicurati che **YouTube Data API v3** sia abilitata

**Su Vercel:**
1. Vai su **Settings** → **Environment Variables**
2. Aggiungi `YOUTUBE_API_KEY` con la tua chiave
3. Seleziona tutti gli ambienti (Production, Preview, Development)
4. Save → Rideploy

## Architettura

### API Endpoint: `/api/live-status`

**Funzione:** Controlla se c'è una live in corso sul canale.

**Come funziona:**
- Chiama YouTube Data API v3: `search.list` con `eventType=live`
- Parametri: `channelId`, `type=video`, `maxResults=1`
- Quota: **100 unità per chiamata** (molto economico)

**Response:**
```json
{
  "isLive": true,
  "videoId": "abc123",
  "title": "Lezione Live - Segnaletica",
  "thumbnail": "https://..."
}
```

oppure:
```json
{
  "isLive": false
}
```

### Componente: `LiveBanner.tsx`

**Posizione:** `/components/Live/LiveBanner.tsx`

**Features:**
- ✅ Polling automatico ogni 30 secondi
- ✅ Banner rosso lampeggiante con animazione
- ✅ Player YouTube embedded a schermo intero
- ✅ Responsive (mobile + desktop)
- ✅ Chiusura con ESC o click fuori
- ✅ Solo per utenti autenticati

**Stati:**
- `isChecking`: true durante il primo controllo
- `isLive`: true se c'è una live
- `showPlayer`: true quando l'utente apre il player

## Consumo Quota YouTube API

### Quota utilizzata:
- **search.list** con `eventType=live`: 100 unità/chiamata
- Polling ogni 30 secondi = 2 chiamate/minuto = 120 chiamate/ora
- **Quota oraria:** 12.000 unità (circa 120 live di 1 ora)
- **Quota giornaliera:** 10.000 unità totali (include sync notturno)

### Ottimizzazione:
Il polling parte solo quando:
1. L'utente apre ABAflix
2. L'utente è autenticato
3. La pagina è in foreground (tab attiva)

Se nessuno è online, nessuna chiamata API viene fatta! 🎯

## Testing

### Test in locale:
1. Avvia una live test su YouTube (anche unlisted)
2. `cd frontend && npm run dev`
3. Accedi su `http://localhost:3000`
4. Dovresti vedere il banner rosso entro 30 secondi

### Test in produzione:
1. Avvia una live su YouTube
2. Vai su `https://lezioni.autoscuoleaba.it`
3. Il banner appare automaticamente

### Debug:
Controlla i log:
```bash
# Locale
npm run dev
# Guarda console browser

# Produzione (Vercel)
Vercel Dashboard → Functions → /api/live-status → Logs
```

## Workflow consigliato

### Prima della diretta:
1. ✅ Nessuna configurazione necessaria
2. ✅ Nessun link da condividere
3. 💬 WhatsApp: "🔴 Live tra 5 minuti! Apri ABAflix"

### Durante la diretta:
1. 🎥 Streami normalmente su YouTube
2. 📱 Gli allievi vedono il banner su ABAflix
3. 👁️ Guardano la live dentro l'app (embedded)

### Dopo la diretta:
1. 🔴 Banner scompare automaticamente
2. 🌙 Di notte: GitHub Action sincronizza
3. 📹 Il giorno dopo: Video appare nella griglia

## Vantaggi

✅ **Zero link da condividere** - Nessun link YouTube su WhatsApp
✅ **Accesso controllato** - Solo iscritti autenticati possono vedere
✅ **Automatico** - Zero configurazione manuale
✅ **Professionale** - Esperienza premium dentro l'app
✅ **Economico** - Quota API minima (100 unità/check)

## WhatsApp Strategy

**PRIMA** (vecchio modo):
```
🔴 Live ora! Guarda qui: https://youtube.com/watch?v=...
```
❌ Link condivisibile ovunque
❌ Chiunque può vedere
❌ Poco controllo

**ADESSO** (nuovo modo):
```
🔴 Diretta in corso ora su ABAflix! Apri l'app per guardare 🎬
```
✅ Zero link
✅ Solo iscritti autenticati
✅ Controllo totale

## Troubleshooting

### Il banner non appare:

1. **Verifica API key su Vercel:**
   ```bash
   # Controlla che YOUTUBE_API_KEY sia impostata
   Vercel Dashboard → Settings → Environment Variables
   ```

2. **Controlla logs API:**
   ```bash
   # Su Vercel
   Functions → /api/live-status → Logs
   # Cerca: "Live broadcast detected" o errori API
   ```

3. **Verifica che la live sia effettivamente live:**
   - Deve essere **in corso** (non schedulata)
   - Deve essere sul canale corretto (UC18Pm8LKXwtK2uUSoif5RVw)

4. **Quota API esaurita:**
   - Google Cloud Console → APIs → YouTube Data API v3 → Quotas
   - Se esaurita, aumenta quota o aspetta reset (mezzanotte Pacific Time)

### Player non carica:

- Verifica che il video ID sia corretto
- Controlla che YouTube permetta embedding (alcuni video hanno restrizioni)
- Verifica console browser per errori iframe

## Future Improvements (opzionali)

- 📢 **Notifica push** quando parte la live (tramite Supabase Realtime)
- 💬 **Chat live** integrata (invece di chat YouTube)
- 📊 **Statistiche** spettatori live
- 🔔 **Reminder** 5 minuti prima della live schedulata

---

**Implementato:** 2026-02-14
**Versione:** 1.0
**Status:** ✅ Production Ready

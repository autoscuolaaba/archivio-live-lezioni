# Setup Sistema Notifiche

## Prerequisito: Aggiungere colonna `last_visit`

Prima di usare il sistema di notifiche, devi aggiungere la colonna `last_visit` alla tabella `allievi` in Supabase.

### Passaggi

1. Vai su **Supabase Dashboard** → https://supabase.com/dashboard/project/qoddxlyrltzhkwfuxbdg
2. Click su **SQL Editor** nella sidebar sinistra
3. Click su **New query**
4. Copia e incolla il contenuto del file `scripts/add_last_visit_column.sql`
5. Click su **Run** (o premi `Cmd+Enter`)

### Contenuto dello script

```sql
-- Add last_visit column to allievi table
-- Run this in Supabase SQL Editor

-- Add last_visit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'allievi'
    AND column_name = 'last_visit'
  ) THEN
    ALTER TABLE allievi
    ADD COLUMN last_visit TIMESTAMPTZ DEFAULT NOW();

    RAISE NOTICE 'Column last_visit added successfully';
  ELSE
    RAISE NOTICE 'Column last_visit already exists';
  END IF;
END $$;

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_allievi_last_visit
ON allievi(last_visit);

-- Comment on column
COMMENT ON COLUMN allievi.last_visit IS 'Timestamp dell''ultima visita dell''allievo alla homepage (per notifiche nuove lezioni)';
```

### Verifica

Dopo aver eseguito lo script, verifica che la colonna sia stata creata:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'allievi'
AND column_name = 'last_visit';
```

Dovresti vedere:

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| last_visit  | timestamp with time zone | YES |

## Come funziona il sistema

### 1. Tracciamento ultima visita

- Quando un utente visita la homepage, viene chiamato automaticamente `POST /api/notifications/mark-visited`
- Questo aggiorna `last_visit` con il timestamp corrente
- Il timestamp viene salvato nel database Supabase

### 2. Recupero notifiche

- Il componente `NotificationBell` chiama `GET /api/notifications` al mount
- L'API filtra i video con `published_at > last_visit`
- Vengono restituite max 10 notifiche ordinate per data (più recenti prima)

### 3. Visualizzazione

- Se ci sono nuove lezioni, il badge rosso mostra il numero (es. "3")
- Click sulla campanella apre il dropdown con le notifiche
- Click su una notifica apre il video di YouTube in una nuova tab

### 4. Reset notifiche

- Quando l'utente visita la homepage, `last_visit` viene aggiornato
- Le notifiche precedenti scompaiono automaticamente
- Solo i video pubblicati DOPO la nuova visita verranno mostrati come notifiche

## API Endpoints

### GET /api/notifications

Restituisce le nuove lezioni pubblicate dopo l'ultima visita.

**Response:**
```json
{
  "notifications": [
    {
      "id": "abc123",
      "title": "Titolo della lezione",
      "publishedAt": "2025-01-15T10:30:00Z",
      "watchUrl": "https://youtube.com/watch?v=...",
      "year": 2025,
      "month": 1
    }
  ],
  "count": 1
}
```

### POST /api/notifications/mark-visited

Aggiorna `last_visit` al timestamp corrente.

**Response:**
```json
{
  "success": true
}
```

## Note

- Il sistema è completamente automatico
- Non richiede azioni dall'utente
- Le notifiche sono personali (ogni utente ha il proprio `last_visit`)
- Prima visita in assoluto: nessuna notifica (last_visit = NULL)

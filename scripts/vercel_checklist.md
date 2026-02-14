# Checklist Vercel - Debugging Upload Avatar

## Problema
L'upload avatar funziona in locale ma fallisce su Vercel Production (`lezioni.autoscuoleaba.it`) con errore generico.

## 1. Verificare Variabili Ambiente su Vercel

1. Vai su **Vercel Dashboard** → https://vercel.com/dashboard
2. Seleziona il progetto `lezioni-live-aba-frontend` (o come si chiama)
3. Vai su **Settings** → **Environment Variables**
4. Verifica che esistano:
   - `SUPABASE_URL` = `https://qoddxlyrltzhkwfuxbdg.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (service role key, NON anon key!)
   - `JWT_SECRET` = `...` (stesso del locale)
   - `SESSION_DURATION_DAYS` = `7`

**IMPORTANTE:** Se modifichi le variabili, devi fare **redeploy**!

## 2. Verificare Bucket Supabase "avatars"

1. Vai su **Supabase Dashboard** → https://supabase.com/dashboard/project/qoddxlyrltzhkwfuxbdg
2. Click su **Storage** nella sidebar
3. Verifica che esista il bucket `avatars`
4. Click sul bucket → **Configuration**:
   - **Public bucket** deve essere ✅ **ATTIVO**
   - **File size limit:** 5242880 (5MB)
   - **Allowed MIME types:** `image/*` (o vuoto per tutti)

## 3. Verificare Policies del Bucket

Vai su **Storage** → **avatars** → **Policies**

Devono esistere almeno queste policy (o simili):

- **SELECT (public read):** Tutti possono leggere
- **INSERT (authenticated):** Utenti autenticati possono caricare
- **UPDATE (authenticated):** Utenti autenticati possono aggiornare
- **DELETE (authenticated):** Utenti autenticati possono eliminare

Se mancano, vai su **SQL Editor** ed esegui:

```sql
-- Policy per leggere (pubblico)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy per caricare (autenticato via service role)
CREATE POLICY "Service role can manage avatars"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'avatars');
```

## 4. Verificare Colonna avatar_url

Vai su **SQL Editor** ed esegui:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'allievi'
AND column_name = 'avatar_url';
```

Se non vedi nulla, esegui lo script: `scripts/add_avatar_column.sql`

## 5. Verificare Logs Vercel

1. Vai su **Vercel Dashboard** → Progetto → **Deployments**
2. Click sull'ultimo deployment
3. Vai su **Functions** → Cerca `/api/profile/avatar`
4. Controlla i log real-time mentre fai un upload
5. Cerca errori tipo:
   - `Storage error: Bucket not found`
   - `Storage error: new row violates row-level security policy`
   - `Database error: column "avatar_url" does not exist`

## 6. Test Manuale API in Produzione

Usa questo comando per testare direttamente l'API (sostituisci `YOUR_SESSION_COOKIE`):

```bash
curl -X POST https://lezioni.autoscuoleaba.it/api/profile/avatar \
  -H "Cookie: aba_session=YOUR_SESSION_COOKIE" \
  -F "avatar=@/path/to/test-image.jpg"
```

La risposta ti dirà esattamente qual è l'errore.

## 7. Soluzioni Comuni

### Errore: "Bucket not found"
- Il bucket `avatars` non esiste su Supabase
- **Fix:** Crea il bucket come da `scripts/setup_supabase_storage.md`

### Errore: "new row violates row-level security policy"
- Le policy del bucket non permettono l'upload
- **Fix:** Aggiungi le policy sopra o rendi il bucket pubblico

### Errore: "column avatar_url does not exist"
- La colonna non esiste nella tabella `allievi`
- **Fix:** Esegui `scripts/add_avatar_column.sql`

### Errore: "Invalid JWT"
- Il `SUPABASE_SERVICE_ROLE_KEY` è sbagliato o mancante
- **Fix:** Copia il Service Role Key da Supabase → Settings → API → `service_role` (non `anon`!)

### Errore generico dopo deploy
- Le variabili ambiente sono state modificate ma non è stato fatto redeploy
- **Fix:** Vai su Deployments → ... → Redeploy

## 8. Verificare in Locale

Prima di tutto, testa che funzioni in locale:

```bash
cd frontend
npm run dev
```

Accedi, carica avatar. Se funziona qui ma non su Vercel, il problema è:
- Variabili ambiente diverse
- Bucket Supabase non configurato
- Policy RLS troppo restrittive

## 9. Log Dettagliato Aggiunto

Ho aggiunto logging dettagliato all'API che ora restituisce:
```json
{
  "error": "Errore durante l'upload dell'immagine",
  "details": "Bucket not found",  // ← messaggio esatto
  "code": "StorageError"
}
```

Questo messaggio apparirà nella UI e ti dirà esattamente cosa è successo!

# Setup Supabase Storage per Avatar

## 1. Creare il Bucket "avatars"

1. Vai su **Supabase Dashboard** → https://supabase.com/dashboard/project/qoddxlyrltzhkwfuxbdg
2. Click su **Storage** nella sidebar sinistra
3. Click su **Create a new bucket**
4. Compila:
   - **Name:** `avatars`
   - **Public bucket:** ✅ **ATTIVO** (per permettere l'accesso pubblico alle immagini)
   - **File size limit:** 5MB (opzionale)
   - **Allowed MIME types:** `image/*` (opzionale)
5. Click su **Create bucket**

## 2. Configurare le Policy (permessi)

Se il bucket non è pubblico, aggiungi queste policy SQL:

```sql
-- Policy per permettere a tutti di LEGGERE gli avatar
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy per permettere agli utenti autenticati di CARICARE avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy per permettere agli utenti autenticati di AGGIORNARE il proprio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy per permettere agli utenti autenticati di ELIMINARE il proprio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

## 3. Aggiungere la colonna `avatar_url` alla tabella `allievi`

Esegui lo script SQL: `scripts/add_avatar_column.sql`

Oppure manualmente:

```sql
ALTER TABLE allievi
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN allievi.avatar_url IS 'URL pubblico dell''immagine avatar dell''allievo';
```

## 4. Verificare la configurazione

1. Vai su **Storage** → **avatars**
2. Clicca su **Policies** e verifica che ci siano le policy
3. Torna su **SQL Editor** e esegui:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'allievi'
AND column_name = 'avatar_url';
```

Se vedi il risultato, la colonna è stata creata correttamente! ✅

## 5. Test

Ora puoi testare l'upload:
1. Accedi all'app
2. Clicca sull'avatar
3. Click su "Modifica Profilo"
4. Carica un'immagine
5. L'immagine dovrebbe apparire immediatamente

## Note

- Le immagini sono salvate in Supabase Storage nel bucket `avatars`
- Struttura: `avatars/{user_id}/{timestamp}.{ext}`
- URL pubblico: `https://qoddxlyrltzhkwfuxbdg.supabase.co/storage/v1/object/public/avatars/{user_id}/{filename}`
- Quando un utente carica una nuova immagine, la vecchia viene automaticamente eliminata

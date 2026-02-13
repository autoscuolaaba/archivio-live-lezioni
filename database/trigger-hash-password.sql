-- =============================================================================
-- TRIGGER: Hash automatico password con bcrypt
-- =============================================================================
-- Questo trigger hasha automaticamente le password in plain text quando:
-- 1. Viene inserito un nuovo allievo (INSERT)
-- 2. Viene modificata la password di un allievo esistente (UPDATE)
--
-- IMPORTANTE: Esegui questo SQL nel Supabase SQL Editor
-- =============================================================================

-- 1. Abilita l'estensione pgcrypto per bcrypt (se non già abilitata)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Crea la funzione che hasha la password
CREATE OR REPLACE FUNCTION hash_password_if_plain_text()
RETURNS TRIGGER AS $$
BEGIN
  -- Controlla se la password è in plain text (NON inizia con $2a$ o $2b$)
  IF NEW.password_hash IS NOT NULL
     AND NOT (NEW.password_hash LIKE '$2a$%' OR NEW.password_hash LIKE '$2b$%') THEN

    -- Hash la password con bcrypt (costo 10)
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 10));

    RAISE NOTICE 'Password hashata automaticamente per utente: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crea il trigger per INSERT (nuovi allievi)
DROP TRIGGER IF EXISTS hash_password_on_insert ON allievi;
CREATE TRIGGER hash_password_on_insert
  BEFORE INSERT ON allievi
  FOR EACH ROW
  EXECUTE FUNCTION hash_password_if_plain_text();

-- 4. Crea il trigger per UPDATE (modifica password esistenti)
DROP TRIGGER IF EXISTS hash_password_on_update ON allievi;
CREATE TRIGGER hash_password_on_update
  BEFORE UPDATE OF password_hash ON allievi
  FOR EACH ROW
  WHEN (OLD.password_hash IS DISTINCT FROM NEW.password_hash)
  EXECUTE FUNCTION hash_password_if_plain_text();

-- =============================================================================
-- TEST: Verifica che il trigger funzioni
-- =============================================================================
-- Dopo aver eseguito questo SQL, prova a inserire un nuovo allievo:
--
-- INSERT INTO allievi (nome, cognome, email, password_hash, attivo)
-- VALUES ('Test', 'User', 'test@example.com', 'password123', true);
--
-- Poi verifica che la password sia stata hashata:
-- SELECT email, password_hash FROM allievi WHERE email = 'test@example.com';
--
-- Il password_hash dovrebbe iniziare con $2a$ o $2b$
-- =============================================================================

-- NOTA: Per disabilitare i trigger (sconsigliato):
-- DROP TRIGGER IF EXISTS hash_password_on_insert ON allievi;
-- DROP TRIGGER IF EXISTS hash_password_on_update ON allievi;

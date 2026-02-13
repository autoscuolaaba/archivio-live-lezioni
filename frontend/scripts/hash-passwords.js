/**
 * Script per hashare tutte le password in plain text nel database Supabase
 *
 * Utilizzo:
 *   node scripts/hash-passwords.js
 *
 * IMPORTANTE: Esegui questo script una volta sola per migrare le password esistenti.
 */

const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SALT_ROUNDS = 10

async function hashPasswords() {
  console.log('🔐 Inizio hashing password in plain text...\n')

  // Verifica variabili d'ambiente
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ ERRORE: Mancano SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  // Crea client Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    // 1. Recupera tutti gli allievi
    console.log('📥 Recupero allievi dal database...')
    const { data: allievi, error: fetchError } = await supabase
      .from('allievi')
      .select('id, email, password_hash')

    if (fetchError) {
      throw new Error(`Errore recupero allievi: ${fetchError.message}`)
    }

    if (!allievi || allievi.length === 0) {
      console.log('⚠️  Nessun allievo trovato nel database.')
      return
    }

    console.log(`✅ Trovati ${allievi.length} allievi\n`)

    // 2. Identifica password in plain text (quelle che NON iniziano con $2a$ o $2b$)
    const plainTextPasswords = allievi.filter(
      a => a.password_hash && !a.password_hash.startsWith('$2a$') && !a.password_hash.startsWith('$2b$')
    )

    if (plainTextPasswords.length === 0) {
      console.log('✅ Tutte le password sono già hashate con bcrypt!')
      return
    }

    console.log(`🔍 Trovate ${plainTextPasswords.length} password in plain text da hashare:\n`)

    // 3. Hasha ogni password e aggiorna il database
    let successCount = 0
    let errorCount = 0

    for (const allievo of plainTextPasswords) {
      try {
        console.log(`  → Hashing password per: ${allievo.email}`)

        // Hasha la password
        const hashedPassword = await bcrypt.hash(allievo.password_hash, SALT_ROUNDS)

        // Aggiorna nel database
        const { error: updateError } = await supabase
          .from('allievi')
          .update({ password_hash: hashedPassword })
          .eq('id', allievo.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        console.log(`    ✅ Hash salvato: ${hashedPassword.substring(0, 20)}...`)
        successCount++
      } catch (error) {
        console.error(`    ❌ ERRORE per ${allievo.email}:`, error.message)
        errorCount++
      }
    }

    // 4. Report finale
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT FINALE')
    console.log('='.repeat(60))
    console.log(`✅ Password hashate con successo: ${successCount}`)
    if (errorCount > 0) {
      console.log(`❌ Errori: ${errorCount}`)
    }
    console.log(`📝 Password già hashate (saltate): ${allievi.length - plainTextPasswords.length}`)
    console.log(`📊 Totale allievi: ${allievi.length}`)
    console.log('='.repeat(60))

    if (successCount > 0) {
      console.log('\n✅ Migrazione completata! Tutte le password sono ora hashate con bcrypt.')
      console.log('ℹ️  Gli utenti possono continuare a fare login con le stesse password.')
    }

  } catch (error) {
    console.error('\n❌ ERRORE FATALE:', error.message)
    process.exit(1)
  }
}

// Esegui lo script
hashPasswords()

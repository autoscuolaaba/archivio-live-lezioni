/**
 * Script di test per verificare che bcrypt funzioni correttamente
 *
 * Questo script simula il processo di login:
 * 1. Hasha una password di esempio
 * 2. Verifica che bcrypt.compare() funzioni con l'hash generato
 * 3. Verifica che una password errata venga rifiutata
 */

const bcrypt = require('bcryptjs')

async function testBcrypt() {
  console.log('🧪 Test bcrypt - Verifica funzionamento\n')
  console.log('='.repeat(60))

  // Password di esempio
  const passwordCorretta = 'TestPassword123!'
  const passwordErrata = 'WrongPassword456'

  try {
    // 1. Hasha la password
    console.log('1️⃣  Hashing password...')
    const hash = await bcrypt.hash(passwordCorretta, 10)
    console.log(`   ✅ Hash generato: ${hash}`)
    console.log(`   📝 Inizia con: ${hash.substring(0, 4)}`)

    // Verifica che l'hash inizi con $2a$ o $2b$
    if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
      throw new Error('❌ Hash non valido - non inizia con $2a$ o $2b$')
    }
    console.log('   ✅ Formato hash corretto ($2a$ o $2b$)\n')

    // 2. Test password corretta
    console.log('2️⃣  Test password CORRETTA...')
    const isValidCorretta = await bcrypt.compare(passwordCorretta, hash)
    if (isValidCorretta) {
      console.log('   ✅ bcrypt.compare() = true (CORRETTO)\n')
    } else {
      throw new Error('❌ bcrypt.compare() = false per password corretta!')
    }

    // 3. Test password errata
    console.log('3️⃣  Test password ERRATA...')
    const isValidErrata = await bcrypt.compare(passwordErrata, hash)
    if (!isValidErrata) {
      console.log('   ✅ bcrypt.compare() = false (CORRETTO)\n')
    } else {
      throw new Error('❌ bcrypt.compare() = true per password errata!')
    }

    console.log('='.repeat(60))
    console.log('✅ TUTTI I TEST PASSATI!')
    console.log('='.repeat(60))
    console.log('\n✅ bcrypt funziona correttamente')
    console.log('✅ Il sistema di login dovrebbe funzionare con le password hashate')
    console.log('\n📝 Prossimi passi:')
    console.log('   1. Testa il login con un utente reale nell\'applicazione')
    console.log('   2. Verifica che il login funzioni con la password corretta')
    console.log('   3. Verifica che il login fallisca con password errata')

  } catch (error) {
    console.error('\n❌ TEST FALLITO:', error.message)
    process.exit(1)
  }
}

testBcrypt()

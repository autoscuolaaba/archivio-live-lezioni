# Direttiva: Deploy e Integrazione

## Obiettivo

Integrare l'applicazione "Lezioni Live ABA" nel sito web esistente dell'Autoscuola ABA, scegliendo la strategia di deploy più adatta e garantendo una user experience fluida.

## Contesto

Il sito dell'autoscuola è un **sito custom HTML/CSS/JS** (non un CMS come WordPress). L'applicazione Lezioni Live deve essere accessibile agli allievi come pagina dedicata.

## Opzioni di Integrazione

### Opzione 1: Subdirectory (Consigliata per semplicit à)

**Descrizione:** L'app Next.js viene buildata come **static export** e la cartella `out/` viene copiata in una subdirectory del sito esistente.

**URL finale:** `https://www.autoscuolaaba.it/lezioni-live/`

**Vantaggi:**
- ✅ Stesso dominio (nessun problema CORS)
- ✅ Nessun server aggiuntivo necessario
- ✅ Deploy semplice (copia file)
- ✅ SEO-friendly (stesso dominio)

**Svantaggi:**
- ❌ Richiede accesso FTP/SSH al server esistente
- ❌ Backend separato necessario (se serve API dinamica)

**Prerequisiti:**
- Accesso al web server (FTP, SSH, o pannello di controllo)
- Next.js configurato per static export

**Procedura:**

1. **Configura Next.js per static export**

   Modifica `frontend/next.config.js`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     basePath: '/lezioni-live',  // Importante per subdirectory
     images: {
       unoptimized: true,  // Export statico non supporta Image Optimization
     },
   }
   module.exports = nextConfig
   ```

2. **Genera JSON statico prima del build**
   ```bash
   python execution/refresh_cache.py
   python execution/generate_static_json.py
   cp data/videos.json frontend/public/data/videos.json
   ```

3. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

   Output: cartella `frontend/out/`

4. **Upload sul server**
   ```bash
   # Via FTP/SFTP: copia frontend/out/ → /var/www/html/lezioni-live/
   # Via SSH:
   scp -r frontend/out/* user@server:/var/www/html/lezioni-live/
   ```

5. **Configura web server (Apache)**

   Aggiungi `.htaccess` in `/var/www/html/lezioni-live/`:
   ```apache
   # Abilita compressione gzip
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
   </IfModule>

   # Cache statico
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpeg "access plus 1 month"
     ExpiresByType image/png "access plus 1 month"
     ExpiresByType text/css "access plus 1 week"
     ExpiresByType application/javascript "access plus 1 week"
     ExpiresByType application/json "access plus 1 hour"
   </IfModule>

   # Rewrite per Next.js routes (se serve)
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule ^ index.html [L]
   </IfModule>
   ```

6. **Link dal sito principale**

   Nel menu del sito esistente, aggiungi:
   ```html
   <a href="/lezioni-live/">Lezioni Live YouTube</a>
   ```

**Note:**
- Aggiornamento: Ripeti build + upload ogni volta che aggiorni il codice
- Dati: Rigenera `videos.json` giornalmente con cron + rebuild (o usa Opzione 2 con backend)

---

### Opzione 2: Subdirectory + Backend API Separato

**Descrizione:** Frontend statico in subdirectory, backend FastAPI su server separato (o stesso server, porta diversa).

**URL finale:**
- Frontend: `https://www.autoscuolaaba.it/lezioni-live/`
- Backend API: `https://api.autoscuolaaba.it/` o `http://server-ip:8000/`

**Vantaggi:**
- ✅ Dati sempre aggiornati (backend legge cache live)
- ✅ Nessun rebuild frontend per aggiornare dati
- ✅ Supporto API dinamiche (filtri, ricerca server-side)

**Svantaggi:**
- ❌ Richiede server Python (VPS, cloud, Heroku, Railway)
- ❌ Configurazione CORS necessaria
- ❌ Complessità maggiore

**Procedura:**

1. **Deploy Backend**

   **Opzione A: VPS (DigitalOcean, Linode, etc.)**
   ```bash
   # SSH nel server
   ssh user@server-ip

   # Installa Python + dipendenze
   sudo apt update
   sudo apt install python3-pip python3-venv
   cd /opt/lezioni-live-aba/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Configura .env
   nano .env  # Inserisci variabili

   # Esegui con uvicorn + supervisord (per auto-restart)
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

   **Configurare come servizio systemd:**
   ```ini
   # /etc/systemd/system/aba-api.service
   [Unit]
   Description=ABA Lezioni API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/opt/lezioni-live-aba/backend
   Environment="PATH=/opt/lezioni-live-aba/backend/venv/bin"
   ExecStart=/opt/lezioni-live-aba/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   Abilita:
   ```bash
   sudo systemctl enable aba-api
   sudo systemctl start aba-api
   ```

   **Opzione B: Railway / Render / Heroku**
   - Railway: Deploy con 1-click da GitHub
   - Render: Simile, free tier disponibile
   - Heroku: Dyno gratuito (limitato)

2. **Configura CORS nel backend**

   `backend/main.py`:
   ```python
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://www.autoscuolaaba.it"],
       allow_methods=["GET"],
       allow_headers=["*"],
   )
   ```

3. **Frontend chiama API backend**

   `frontend/app/page.jsx`:
   ```javascript
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.autoscuolaaba.it';

   useEffect(() => {
     fetch(`${API_URL}/api/videos`)
       .then(res => res.json())
       .then(data => setVideos(data.videos));
   }, []);
   ```

4. **Build e deploy frontend come Opzione 1**

---

### Opzione 3: Sottodominio

**Descrizione:** L'app gira su un sottodominio dedicato.

**URL finale:** `https://lezioni.autoscuolaaba.it`

**Vantaggi:**
- ✅ Isolamento completo dall'app principale
- ✅ Deploy indipendente (Vercel, Netlify, etc.)
- ✅ URL pulito e facile da ricordare
- ✅ SSL automatico (con Vercel/Netlify)

**Svantaggi:**
- ❌ Richiede configurazione DNS
- ❌ Potenziale costo hosting (Vercel free tier ok per traffico moderato)

**Procedura:**

1. **Deploy su Vercel (consigliato per Next.js)**

   ```bash
   cd frontend
   npm install -g vercel
   vercel login
   vercel --prod
   ```

   Vercel ti darà un URL tipo `lezioni-live-aba.vercel.app`

2. **Configura custom domain**

   - Vai su Vercel Dashboard → Project Settings → Domains
   - Aggiungi `lezioni.autoscuolaaba.it`
   - Vercel ti darà record DNS da configurare

3. **Configura DNS**

   Nel pannello del registrar (GoDaddy, Namecheap, Cloudflare, etc.):
   ```
   Type: CNAME
   Name: lezioni
   Value: cname.vercel-dns.com (o valore dato da Vercel)
   TTL: Auto
   ```

4. **Backend (se necessario)**

   - Deploy backend su Railway/Render
   - Configura CORS per `https://lezioni.autoscuolaaba.it`

**Costo:**
- Vercel: Gratis fino a 100GB bandwidth/mese (ampiamente sufficiente)
- Railway/Render: Gratis tier con limiti (500h/mese)

---

### Opzione 4: Iframe Embed (Ultima spiaggia)

**Descrizione:** L'app gira su dominio esterno ed è embeddata nel sito via iframe.

**Vantaggi:**
- ✅ Nessuna modifica al server esistente
- ✅ Deploy totalmente separato

**Svantaggi:**
- ❌ SEO penalizzato (contenuto iframe non indicizzato)
- ❌ Esperienza utente peggiore (scroll annidato, no deep linking)
- ❌ Problemi mobile (iframe piccoli)

**Solo se:** Le altre opzioni non sono percorribili.

**Procedura:**
```html
<!-- Pagina nel sito esistente: lezioni-live.html -->
<iframe
  src="https://lezioni-live-aba.vercel.app"
  width="100%"
  height="800"
  frameborder="0"
  title="Lezioni Live ABA">
</iframe>
```

---

## Strategia Consigliata

**Per questo progetto, consigliamo: Opzione 2 (Subdirectory + Backend API)**

**Motivo:**
1. L'autoscuola ha già un sito → integrazione pulita
2. I dati cambiano periodicamente → backend serve cache aggiornata
3. Nessun rebuild frontend ogni giorno
4. Facile da mantenere

**Setup consigliato:**
- Frontend: Static export in `/var/www/html/lezioni-live/`
- Backend: Railway (gratuito, facile deploy)
- Cron: Sul server backend, refresh_cache.py giornaliero

---

## Workflow di Deploy

### Setup Iniziale

1. **Prima volta:**
   ```bash
   # 1. Setup Google Cloud e OAuth
   # Segui directives/setup_google_cloud.md

   # 2. Fetch tutti i video
   python execution/fetch_all_videos.py

   # 3. Deploy backend (Railway)
   cd backend
   git init
   git add .
   git commit -m "Initial backend"
   # Connetti a Railway e fai push

   # 4. Configura variabili Railway
   # YOUTUBE_CHANNEL_ID, GOOGLE_TOKEN_FILE, etc.

   # 5. Build frontend
   cd ../frontend
   npm run build

   # 6. Upload frontend su server
   scp -r out/* user@server:/var/www/html/lezioni-live/
   ```

2. **Configurare cron sul server backend (Railway):**

   Railway non supporta cron nativo, opzioni:
   - **Opzione A:** Deploy script su server separato con cron
   - **Opzione B:** Usa servizio esterno come cron-job.org per chiamare `POST /api/refresh`
   - **Opzione C:** GitHub Actions scheduled workflow

### Aggiornamenti

**Aggiornare dati (giornaliero - automatico):**
```bash
# Via cron o GitHub Actions
python execution/refresh_cache.py
# Backend legge automaticamente la nuova cache
```

**Aggiornare frontend (solo se cambia codice):**
```bash
cd frontend
npm run build
scp -r out/* user@server:/var/www/html/lezioni-live/
```

**Aggiornare backend (solo se cambia codice):**
```bash
cd backend
git add .
git commit -m "Update API"
git push railway main  # Deploy automatico
```

---

## Checklist Pre-Deploy

**Backend:**
- [ ] File `.env` configurato correttamente
- [ ] `credentials.json` e `token.json` presenti
- [ ] Endpoint `/api/videos` funzionante
- [ ] Endpoint `/api/health` funzionante
- [ ] CORS configurato per dominio frontend
- [ ] Log in `.tmp/` funzionanti
- [ ] Cache `data/videos_cache.json` popolata

**Frontend:**
- [ ] Build Next.js completa senza errori
- [ ] `basePath` configurato se subdirectory
- [ ] API URL configurato (env variable)
- [ ] Post-it rendering corretto
- [ ] Navigazione anni funzionante
- [ ] Responsive testato (mobile, tablet, desktop)
- [ ] Link ai video aprono YouTube in nuova tab

**Integrazione:**
- [ ] DNS configurato (se sottodominio)
- [ ] SSL attivo (HTTPS)
- [ ] Link nel sito principale aggiornato
- [ ] .htaccess/nginx config per cache headers
- [ ] Test di carico (simulare 100+ utenti)

**Monitoring:**
- [ ] Endpoint `/api/health` monitorato
- [ ] Alert se cache > 48 ore
- [ ] Log errori controllati settimanalmente
- [ ] Google Cloud quota monitorata

---

## Testing in Produzione

**Dopo il deploy:**

1. **Test funzionalità:**
   ```bash
   # Backend health
   curl https://api.autoscuolaaba.it/api/health

   # Fetch videos
   curl https://api.autoscuolaaba.it/api/videos | jq '.total_videos'
   ```

2. **Test frontend:**
   - Apri `https://www.autoscuolaaba.it/lezioni-live/`
   - Verifica che i post-it si carichino
   - Clicca su un video → deve aprire YouTube
   - Testa su mobile, tablet, desktop
   - Testa navigazione anni

3. **Test performance:**
   - Usa Google PageSpeed Insights
   - Target: > 90 performance score
   - Comprimi immagini se score basso
   - Abilita gzip/brotli compression

4. **Test accesso video:**
   - Verifica che un allievo autorizzato possa vedere i video privati
   - Verifica che un utente non autorizzato veda "Video privato"

---

## Manutenzione Post-Deploy

### Giornaliera (Automatica)
- Cron esegue `refresh_cache.py`
- Backend serve dati aggiornati

### Settimanale (Manuale)
- Controlla log in `.tmp/fetch_errors.log`
- Verifica che token OAuth non sia scaduto
- Controlla usage quota API su Google Cloud Console

### Mensile (Manuale)
- Review analytics: quanti utenti visitano la pagina
- Controlla feedback allievi
- Valuta se servono nuove feature (filtri, ricerca avanzata, etc.)

---

## Rollback Plan

**Se il deploy va male:**

1. **Backend down:**
   - Railway conserva deploy precedente
   - Rollback con 1-click da dashboard

2. **Frontend rotto:**
   - Ripristina backup `out.backup/`:
     ```bash
     mv /var/www/html/lezioni-live /var/www/html/lezioni-live.broken
     mv /var/www/html/lezioni-live.backup /var/www/html/lezioni-live
     ```

3. **Cache corrotta:**
   - Ripristina backup:
     ```bash
     cp data/videos_cache.json.backup data/videos_cache.json
     ```
   - Oppure rifai sync:
     ```bash
     python execution/fetch_all_videos.py
     ```

**Best practice:**
- Fai sempre backup prima di deploy
- Testa in ambiente staging prima di produzione
- Deploy in orari di basso traffico (notte)

---

## Costi Stimati

**Scenario: Opzione 2 (Subdirectory + Backend Railway)**

| Servizio | Costo Mensile |
|----------|---------------|
| Hosting frontend (incluso in hosting esistente) | €0 |
| Railway (backend Python - free tier) | €0 (500h/mese) |
| Google Cloud (YouTube API) | €0 (sotto quota) |
| **Totale** | **€0** |

**Note:**
- Railway free tier: 500h/mese (più che sufficienti)
- Se superi, Railway costa ~$5/mese
- Google API è gratuita fino a 10.000 unità/giorno (ne usi <100/giorno)

---

## Scalabilità Futura

**Se il numero di video cresce molto (> 5.000):**

1. **Paginazione API:**
   - `GET /api/videos?page=1&limit=100`
   - Frontend carica pagine on-demand

2. **Database:**
   - Migra da JSON a PostgreSQL
   - Query più veloci
   - Full-text search

3. **CDN:**
   - Servi `videos.json` da Cloudflare CDN
   - Invalidazione automatica dopo refresh

4. **Serverless:**
   - Backend su AWS Lambda / Google Cloud Functions
   - Auto-scaling, paghi solo per richieste

---

## Contatti e Supporto

Per problemi tecnici durante il deploy:
1. Controlla log in `.tmp/`
2. Verifica configurazione `.env`
3. Testa endpoint manualmente con `curl`
4. Consulta documentazione:
   - Next.js: https://nextjs.org/docs/deployment
   - FastAPI: https://fastapi.tiangolo.com/deployment/
   - Railway: https://docs.railway.app/

---

## Prossimi Passi

Dopo aver scelto e implementato la strategia di deploy:
1. Testa in staging
2. Backup di sicurezza
3. Deploy in produzione
4. Monitora per 48h
5. Raccogli feedback utenti
6. Itera e migliora

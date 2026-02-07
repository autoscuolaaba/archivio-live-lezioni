"""
Backend FastAPI - Autoscuola ABA Lezioni Live
Scopo: Servire dati cached al frontend senza chiamare YouTube API direttamente
"""

import os
import json
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import logging

# Carica variabili ambiente
load_dotenv()

# Configurazione
CACHE_FILE = os.getenv('CACHE_FILE', '../data/videos_cache.json')
CACHE_FILE_MOCK = '../data/videos_cache_mock.json'  # Fallback per sviluppo
REFRESH_API_KEY = os.getenv('REFRESH_API_KEY', 'dev-secret-key')
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inizializza FastAPI
app = FastAPI(
    title="Lezioni Live ABA API",
    description="API per servire video lezioni live di Autoscuola ABA",
    version="1.0.0"
)

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Cache in memoria per performance
_cache_data = None
_cache_load_time = None


def get_cache_file_path():
    """Determina quale file cache usare"""
    if os.path.exists(CACHE_FILE):
        return CACHE_FILE
    elif os.path.exists(CACHE_FILE_MOCK):
        logger.warning(f"Cache reale non trovata, uso mock: {CACHE_FILE_MOCK}")
        return CACHE_FILE_MOCK
    else:
        return None


def load_cache():
    """Carica cache da file JSON"""
    global _cache_data, _cache_load_time

    cache_path = get_cache_file_path()

    if not cache_path:
        logger.error("Nessun file cache trovato!")
        raise FileNotFoundError("Cache non disponibile")

    try:
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        _cache_data = data
        _cache_load_time = time.time()

        logger.info(f"Cache caricata: {data['total_videos']} video da {cache_path}")
        return data

    except Exception as e:
        logger.error(f"Errore caricamento cache: {e}")
        raise


def get_cached_data(max_age_seconds=60):
    """
    Ottieni dati cache con invalidazione automatica

    Args:
        max_age_seconds: Secondi dopo i quali ricaricare la cache (default 60s)
    """
    global _cache_data, _cache_load_time

    # Se non caricato o troppo vecchio, ricarica
    if _cache_data is None or (time.time() - _cache_load_time > max_age_seconds):
        load_cache()

    return _cache_data


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Lezioni Live ABA API",
        "version": "1.0.0",
        "endpoints": {
            "videos": "/api/videos",
            "stats": "/api/videos/stats",
            "health": "/api/health"
        }
    }


@app.get("/api/videos")
async def get_videos(response: Response):
    """
    Endpoint principale: ritorna tutti i video cached

    Headers:
        - Cache-Control: public, max-age=3600 (1 ora)
        - ETag: basato su last_updated
    """
    try:
        data = get_cached_data(max_age_seconds=60)

        # Header per caching browser
        response.headers["Cache-Control"] = "public, max-age=3600"
        response.headers["ETag"] = f'"{data["last_updated"]}"'

        return data

    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Cache non disponibile. Esegui: python execution/fetch_all_videos.py"
        )
    except Exception as e:
        logger.error(f"Errore get_videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/videos/stats")
async def get_stats():
    """
    Endpoint statistiche: ritorna metadati aggregati

    Response:
        - total_videos: numero totale video
        - total_hours: ore totali di lezione
        - first_video_date: data prima lezione
        - last_updated: ultimo aggiornamento cache
    """
    try:
        data = get_cached_data(max_age_seconds=60)

        videos = data.get('videos', [])

        # Calcola ore totali
        total_seconds = sum(v.get('duration_seconds', 0) for v in videos)
        total_hours = int(total_seconds / 3600)

        # Trova prima e ultima lezione
        if videos:
            dates = [v['published_at'] for v in videos if 'published_at' in v]
            first_video_date = min(dates) if dates else None
            last_video_date = max(dates) if dates else None
        else:
            first_video_date = None
            last_video_date = None

        return {
            "total_videos": data.get('total_videos', 0),
            "total_hours": total_hours,
            "first_video_date": first_video_date,
            "last_video_date": last_video_date,
            "last_updated": data.get('last_updated')
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Cache non disponibile"
        )
    except Exception as e:
        logger.error(f"Errore get_stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """
    Endpoint health check: verifica stato del servizio

    Response:
        - status: "ok" o "error"
        - cache_age_hours: età della cache in ore
        - total_videos: numero video in cache
        - cache_file: path del file cache usato
    """
    try:
        cache_path = get_cache_file_path()

        if not cache_path:
            return {
                "status": "error",
                "message": "Nessun file cache trovato",
                "cache_file": None
            }

        # Età cache (modifica file)
        cache_age_seconds = time.time() - os.path.getmtime(cache_path)
        cache_age_hours = cache_age_seconds / 3600

        # Carica dati
        data = get_cached_data(max_age_seconds=300)  # Ricarica ogni 5 min per health

        status = "ok" if cache_age_hours < 48 else "warning"  # Warning se > 48h

        return {
            "status": status,
            "cache_age_hours": round(cache_age_hours, 2),
            "total_videos": data.get('total_videos', 0),
            "last_updated": data.get('last_updated'),
            "cache_file": os.path.basename(cache_path),
            "message": "Cache più vecchia di 48 ore" if status == "warning" else "OK"
        }

    except Exception as e:
        logger.error(f"Errore health_check: {e}")
        return {
            "status": "error",
            "message": str(e),
            "cache_file": None
        }


@app.post("/api/refresh")
async def trigger_refresh(authorization: str = Header(None)):
    """
    Endpoint per trigger manuale refresh cache (PROTETTO)

    Headers:
        - Authorization: Bearer <REFRESH_API_KEY>

    Questo endpoint NON chiama YouTube API direttamente.
    Chiama lo script refresh_cache.py che fa il lavoro.
    """
    # Verifica API key
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header mancante")

    token = authorization.replace("Bearer ", "")
    if token != REFRESH_API_KEY:
        raise HTTPException(status_code=403, detail="API key non valida")

    try:
        # Esegui script di refresh
        import subprocess

        result = subprocess.run(
            ["python3", "execution/refresh_cache.py"],
            capture_output=True,
            text=True,
            cwd=".."  # Esegui dalla root del progetto
        )

        if result.returncode == 0:
            # Invalida cache in memoria per ricaricare
            global _cache_data
            _cache_data = None

            return {
                "status": "success",
                "message": "Cache refresh completato",
                "output": result.stdout
            }
        else:
            return {
                "status": "error",
                "message": "Refresh fallito",
                "error": result.stderr
            }

    except Exception as e:
        logger.error(f"Errore trigger_refresh: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Startup event
@app.on_event("startup")
async def startup_event():
    """Eseguito all'avvio del server"""
    logger.info("=" * 60)
    logger.info("Lezioni Live ABA API - Starting...")
    logger.info("=" * 60)

    try:
        load_cache()
        logger.info("✅ Cache caricata con successo")
    except Exception as e:
        logger.error(f"⚠️  Impossibile caricare cache: {e}")
        logger.error("L'API partirà ma /api/videos restituirà errore 503")
        logger.error("Esegui: python execution/fetch_all_videos.py o usa dati mock")

    logger.info(f"CORS origins: {CORS_ORIGINS}")
    logger.info("Server pronto su http://localhost:8000")
    logger.info("Docs: http://localhost:8000/docs")
    logger.info("=" * 60)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload durante sviluppo
        log_level="info"
    )

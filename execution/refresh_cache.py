#!/usr/bin/env python3
"""
Script: Refresh Cache (Sync Incrementale)
Scopo: Aggiornare data/videos_cache.json con nuovi video senza riscaricare tutto
Direttiva di riferimento: directives/cache_strategy.md
Costo API: ~10 unità (fetch solo ultime 2 pagine = 100 video)
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
import isodate
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configurazione
CHANNEL_ID = os.getenv('YOUTUBE_CHANNEL_ID', 'UC18Pm8LKXwtK2uUSoif5RVw')
TOKEN_FILE = os.getenv('GOOGLE_TOKEN_FILE', 'token.json')
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
CACHE_FILE = 'data/videos_cache.json'
LOG_FILE = '.tmp/fetch_errors.log'

# Configurazione sync incrementale
MAX_PAGES_TO_FETCH = 2  # Fetch solo ultime 2 pagine (100 video)
ITEMS_PER_PAGE = 50

# Setup logging
os.makedirs('.tmp', exist_ok=True)
os.makedirs('data', exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def load_existing_cache():
    """Carica cache esistente"""
    if not os.path.exists(CACHE_FILE):
        logger.warning(f"Cache non trovata: {CACHE_FILE}")
        logger.warning("Esegui prima: python execution/fetch_all_videos.py")
        return None

    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)

        logger.info(f"Cache caricata: {cache['total_videos']} video")
        logger.info(f"Ultimo aggiornamento: {cache['last_updated']}")
        return cache
    except Exception as e:
        logger.error(f"Errore lettura cache: {e}")
        return None

def get_authenticated_service():
    """Carica credenziali e crea servizio YouTube API"""
    if not os.path.exists(TOKEN_FILE):
        logger.error(f"Token file '{TOKEN_FILE}' non trovato!")
        logger.error("Esegui prima: python execution/youtube_oauth_setup.py")
        sys.exit(1)

    try:
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        return build('youtube', 'v3', credentials=creds)
    except Exception as e:
        logger.error(f"Errore durante autenticazione: {e}")
        logger.error("Prova a rieseguire: python execution/youtube_oauth_setup.py")
        sys.exit(1)

def get_uploads_playlist_id(youtube, channel_id):
    """Ottieni uploads playlist ID"""
    try:
        request = youtube.channels().list(
            part='contentDetails',
            id=channel_id
        )
        response = request.execute()

        if not response.get('items'):
            logger.error(f"Canale {channel_id} non trovato!")
            sys.exit(1)

        uploads_playlist_id = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        return uploads_playlist_id

    except HttpError as e:
        logger.error(f"Errore API: {e}")
        sys.exit(1)

def get_recent_playlist_items(youtube, playlist_id, max_pages=2):
    """
    Recupera solo le ultime N pagine di video dalla playlist
    (invece di tutti i video come in fetch_all_videos.py)
    """
    logger.info(f"Recupero ultime {max_pages} pagine ({max_pages * ITEMS_PER_PAGE} video max)")

    all_videos = []
    next_page_token = None

    for page_num in range(max_pages):
        try:
            request = youtube.playlistItems().list(
                part='snippet',
                playlistId=playlist_id,
                maxResults=ITEMS_PER_PAGE,
                pageToken=next_page_token
            )
            response = request.execute()

            items = response.get('items', [])
            logger.info(f"Pagina {page_num + 1}/{max_pages}: {len(items)} video")

            for item in items:
                video_data = {
                    'id': item['snippet']['resourceId']['videoId'],
                    'title': item['snippet']['title'],
                    'published_at': item['snippet']['publishedAt'],
                    'thumbnail_url': '/thumbnail-default.png'
                }
                all_videos.append(video_data)

            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                logger.info("Fine playlist raggiunta")
                break

        except HttpError as e:
            logger.error(f"Errore durante recupero playlist items: {e}")
            break

    logger.info(f"Recuperati {len(all_videos)} video recenti")
    return all_videos

def get_video_details(youtube, video_ids):
    """Recupera dettagli video (durata, liveStreamingDetails)"""
    logger.info(f"Recupero dettagli per {len(video_ids)} video")

    all_details = []
    batch_size = 50

    for i in range(0, len(video_ids), batch_size):
        batch = video_ids[i:i + batch_size]

        try:
            request = youtube.videos().list(
                part='contentDetails,liveStreamingDetails',
                id=','.join(batch)
            )
            response = request.execute()
            all_details.extend(response.get('items', []))
        except HttpError as e:
            logger.error(f"Errore durante recupero video details: {e}")
            continue

    return all_details

def parse_duration(duration_iso):
    """Converte durata ISO 8601 in secondi e formato leggibile"""
    try:
        duration = isodate.parse_duration(duration_iso)
        total_seconds = int(duration.total_seconds())

        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60

        if hours > 0:
            formatted = f"{hours}h {minutes}m"
        elif minutes > 0:
            formatted = f"{minutes}m"
        else:
            formatted = f"{total_seconds}s"

        return total_seconds, formatted
    except Exception as e:
        return 0, "Durata non disponibile"

def filter_new_videos(recent_videos, existing_cache):
    """
    Confronta video recenti con cache esistente
    Ritorna solo video nuovi (non presenti in cache)
    """
    existing_ids = {v['id'] for v in existing_cache['videos']}
    new_videos = [v for v in recent_videos if v['id'] not in existing_ids]

    logger.info(f"Trovati {len(new_videos)} nuovi video da {len(recent_videos)} recenti")
    return new_videos

def merge_with_cache(new_videos_data, existing_cache):
    """
    Merge nuovi video con cache esistente
    Ordina per data decrescente
    """
    all_videos = existing_cache['videos'] + new_videos_data

    # Rimuovi duplicati (per sicurezza)
    seen_ids = set()
    unique_videos = []
    for v in all_videos:
        if v['id'] not in seen_ids:
            seen_ids.add(v['id'])
            unique_videos.append(v)

    # Ordina per data decrescente
    sorted_videos = sorted(unique_videos, key=lambda x: x['published_at'], reverse=True)

    return sorted_videos

def save_cache(videos):
    """Salva cache aggiornata"""
    # Crea backup prima di sovrascrivere
    if os.path.exists(CACHE_FILE):
        backup_file = f"{CACHE_FILE}.backup"
        try:
            with open(CACHE_FILE, 'r') as src:
                with open(backup_file, 'w') as dst:
                    dst.write(src.read())
            logger.info(f"Backup creato: {backup_file}")
        except Exception as e:
            logger.warning(f"Impossibile creare backup: {e}")

    # Salva nuova cache
    cache_data = {
        'last_updated': datetime.utcnow().isoformat() + 'Z',
        'total_videos': len(videos),
        'videos': videos
    }

    try:
        # Scrivi in file temporaneo prima (atomicità)
        temp_file = f"{CACHE_FILE}.tmp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)

        # Solo se scrittura OK, sostituisci file originale
        os.replace(temp_file, CACHE_FILE)
        logger.info(f"Cache aggiornata: {CACHE_FILE}")
    except Exception as e:
        logger.error(f"Errore durante salvataggio cache: {e}")
        raise

def main():
    """Funzione principale"""
    logger.info("=" * 60)
    logger.info("Refresh Cache - Sync Incrementale")
    logger.info("=" * 60)

    try:
        # Carica cache esistente
        existing_cache = load_existing_cache()
        if not existing_cache:
            logger.error("Impossibile procedere senza cache esistente")
            logger.error("Esegui prima: python execution/fetch_all_videos.py")
            sys.exit(1)

        # Autenticazione
        youtube = get_authenticated_service()

        # Ottieni uploads playlist ID
        uploads_playlist_id = get_uploads_playlist_id(youtube, CHANNEL_ID)

        # Fetch solo video recenti (ultime 2 pagine)
        recent_videos = get_recent_playlist_items(youtube, uploads_playlist_id, MAX_PAGES_TO_FETCH)

        if not recent_videos:
            logger.info("Nessun video recente trovato")
            logger.info("Cache non modificata")
            return

        # Filtra solo video nuovi (non in cache)
        new_videos = filter_new_videos(recent_videos, existing_cache)

        if not new_videos:
            logger.info("✅ Nessun nuovo video. Cache già aggiornata!")
            logger.info(f"Totale video in cache: {existing_cache['total_videos']}")
            return

        # Fetch dettagli solo per video nuovi
        video_ids = [v['id'] for v in new_videos]
        video_details = get_video_details(youtube, video_ids)

        # Crea dict per lookup
        details_dict = {item['id']: item for item in video_details}

        # Processa nuovi video
        new_videos_data = []
        for video in new_videos:
            video_id = video['id']
            details = details_dict.get(video_id)

            if not details:
                logger.warning(f"Dettagli non trovati per {video_id}")
                continue

            # Filtra solo video live
            if 'liveStreamingDetails' not in details:
                logger.info(f"Video {video_id} non è un live, skippato")
                continue

            # Parse durata
            duration_iso = details.get('contentDetails', {}).get('duration', 'P0D')
            duration_seconds, duration_formatted = parse_duration(duration_iso)

            # Parse data
            published_at = video['published_at']
            published_datetime = datetime.fromisoformat(published_at.replace('Z', '+00:00'))

            # Costruisci oggetto
            video_obj = {
                'id': video_id,
                'title': video['title'],
                'published_at': published_at,
                'year': published_datetime.year,
                'month': published_datetime.month,
                'duration_seconds': duration_seconds,
                'duration_formatted': duration_formatted,
                'thumbnail_url': '/thumbnail-default.png',
                'watch_url': f"https://www.youtube.com/watch?v={video_id}"
            }

            new_videos_data.append(video_obj)

        if not new_videos_data:
            logger.info("Nessun nuovo video live trovato")
            logger.info("Cache non modificata")
            return

        # Merge con cache esistente
        merged_videos = merge_with_cache(new_videos_data, existing_cache)

        # Salva cache aggiornata
        save_cache(merged_videos)

        # Riepilogo
        logger.info("=" * 60)
        logger.info("🎉 REFRESH COMPLETATO CON SUCCESSO!")
        logger.info("=" * 60)
        logger.info(f"Nuovi video aggiunti: {len(new_videos_data)}")
        logger.info(f"Totale video in cache: {len(merged_videos)}")
        logger.info(f"Quota API usata: ~{3 + (len(new_videos_data) // 50 + 1)} unità su 10.000")
        logger.info("")
        logger.info("Prossimi passi (opzionali):")
        logger.info("  - Rigenera JSON frontend: python execution/generate_static_json.py")
        logger.info("  - Rebuild frontend: cd frontend && npm run build")
        logger.info("")

    except KeyboardInterrupt:
        logger.warning("\n⚠️  Refresh interrotto dall'utente")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ ERRORE IMPREVISTO: {e}", exc_info=True)
        logger.error("La cache esistente NON è stata modificata")
        logger.error("Consulta .tmp/fetch_errors.log per dettagli")
        sys.exit(1)

if __name__ == '__main__':
    main()

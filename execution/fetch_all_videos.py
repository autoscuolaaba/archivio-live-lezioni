#!/usr/bin/env python3
"""
Script: Fetch All Videos (Sync Completo)
Scopo: Recuperare tutti i video live dal canale YouTube ABA e salvarli in data/videos_cache.json
Direttiva di riferimento: directives/fetch_youtube_videos.md
Costo API: ~63 unità (1 + 31 + 31)
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import isodate
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configurazione
CHANNEL_ID = os.getenv('YOUTUBE_CHANNEL_ID', 'UC18Pm8LKXwtK2uUSoif5RVw')
TOKEN_FILE = os.getenv('GOOGLE_TOKEN_FILE', 'token.json')
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
OUTPUT_FILE = 'data/videos_cache.json'
FRONTEND_CACHE_FILE = 'frontend/public/data/videos_cache.json'
THUMBNAILS_DIR = 'frontend/public/thumbnails'
LOG_FILE = '.tmp/fetch_errors.log'

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
    """
    Step 1: Ottieni l'ID della playlist uploads del canale
    Costo: 1 unità
    """
    logger.info(f"Step 1: Ottengo uploads playlist ID per canale {channel_id}")

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
        logger.info(f"Uploads playlist ID: {uploads_playlist_id}")
        return uploads_playlist_id

    except HttpError as e:
        if e.resp.status == 401:
            logger.error("Token OAuth scaduto o non valido (401 Unauthorized)")
            logger.error("Esegui: python execution/youtube_oauth_setup.py")
        elif e.resp.status == 403:
            logger.error("Quota API esaurita (403 Forbidden)")
            logger.error("La quota si resetta a mezzanotte Pacific Time")
        else:
            logger.error(f"Errore HTTP {e.resp.status}: {e}")
        sys.exit(1)

def get_all_playlist_items(youtube, playlist_id):
    """
    Step 2: Recupera TUTTI i video dalla playlist uploads
    Usa paginazione con nextPageToken
    Costo: ~1 unità per pagina (50 items/pagina) → ~31 unità per 1.530 video
    """
    logger.info(f"Step 2: Recupero tutti i video dalla playlist {playlist_id}")

    all_videos = []
    next_page_token = None
    page_num = 1

    while True:
        try:
            request = youtube.playlistItems().list(
                part='snippet',
                playlistId=playlist_id,
                maxResults=50,
                pageToken=next_page_token
            )
            response = request.execute()

            items = response.get('items', [])
            logger.info(f"Pagina {page_num}: {len(items)} video")

            for item in items:
                video_id = item['snippet']['resourceId']['videoId']
                # Save the API thumbnail URL (needed for download, especially for unlisted videos)
                api_thumb_url = item['snippet']['thumbnails'].get('medium', {}).get('url', '')
                video_data = {
                    'id': video_id,
                    'title': item['snippet']['title'],
                    'published_at': item['snippet']['publishedAt'],
                    'api_thumbnail_url': api_thumb_url,
                    'thumbnail_url': f"/thumbnails/{video_id}.jpg"
                }
                all_videos.append(video_data)

            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break

            page_num += 1

        except HttpError as e:
            logger.error(f"Errore durante recupero playlist items: {e}")
            sys.exit(1)

    logger.info(f"Totale video recuperati dalla playlist: {len(all_videos)}")
    return all_videos

def get_video_details(youtube, video_ids):
    """
    Step 3: Recupera dettagli dei video (durata, liveStreamingDetails)
    Usa batching (50 ID per chiamata)
    Costo: 1 unità per chiamata → ~31 unità per 1.530 video
    """
    logger.info(f"Step 3: Recupero dettagli per {len(video_ids)} video")

    all_details = []
    batch_size = 50
    num_batches = (len(video_ids) + batch_size - 1) // batch_size

    for i in range(0, len(video_ids), batch_size):
        batch = video_ids[i:i + batch_size]
        batch_num = (i // batch_size) + 1

        logger.info(f"Batch {batch_num}/{num_batches}: Fetching {len(batch)} video")

        try:
            request = youtube.videos().list(
                part='contentDetails,liveStreamingDetails',
                id=','.join(batch)
            )
            response = request.execute()

            all_details.extend(response.get('items', []))

        except HttpError as e:
            logger.error(f"Errore durante recupero video details (batch {batch_num}): {e}")
            # Continua con i batch successivi invece di fermarsi
            continue

    logger.info(f"Dettagli recuperati per {len(all_details)} video")
    return all_details

def parse_duration(duration_iso):
    """
    Converte durata ISO 8601 (es. PT1H23M45S) in secondi e formato leggibile

    Returns:
        tuple: (duration_seconds: int, duration_formatted: str)
    """
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
        logger.warning(f"Errore parsing durata '{duration_iso}': {e}")
        return 0, "Durata non disponibile"

def merge_and_filter_videos(playlist_videos, video_details):
    """
    Merge dati da playlist e dettagli video
    Filtra solo video live (hanno liveStreamingDetails)
    """
    logger.info("Step 4: Merge e filtro video live")

    # Crea dict per lookup veloce
    details_dict = {item['id']: item for item in video_details}

    filtered_videos = []
    non_live_count = 0
    missing_details_count = 0

    for video in playlist_videos:
        video_id = video['id']

        # Cerca dettagli
        details = details_dict.get(video_id)
        if not details:
            logger.warning(f"Video {video_id} non trovato in details (probabilmente eliminato)")
            missing_details_count += 1
            continue

        # Filtra solo video live
        if 'liveStreamingDetails' not in details:
            non_live_count += 1
            continue

        # Parse durata
        duration_iso = details.get('contentDetails', {}).get('duration', 'P0D')
        duration_seconds, duration_formatted = parse_duration(duration_iso)

        # Parse data pubblicazione
        published_at = video['published_at']
        published_datetime = datetime.fromisoformat(published_at.replace('Z', '+00:00'))

        # Costruisci oggetto finale
        video_obj = {
            'id': video_id,
            'title': video['title'],
            'published_at': published_at,
            'year': published_datetime.year,
            'month': published_datetime.month,
            'duration_seconds': duration_seconds,
            'duration_formatted': duration_formatted,
            'thumbnail_url': video['thumbnail_url'],
            'api_thumbnail_url': video.get('api_thumbnail_url', ''),
            'watch_url': f"https://www.youtube.com/watch?v={video_id}"
        }

        filtered_videos.append(video_obj)

    logger.info(f"Video live filtrati: {len(filtered_videos)}")
    logger.info(f"Video non-live skippati: {non_live_count}")
    if missing_details_count > 0:
        logger.warning(f"Video senza dettagli (eliminati): {missing_details_count}")

    return filtered_videos

def download_single_thumbnail(video, thumbnails_dir):
    """Scarica una singola thumbnail. Ritorna True se scaricata, False se skippata/errore."""
    video_id = video['id']
    filepath = os.path.join(thumbnails_dir, f"{video_id}.jpg")

    # Skip se già scaricata
    if os.path.exists(filepath) and os.path.getsize(filepath) > 500:
        return 'skipped'

    api_url = video.get('api_thumbnail_url', '')
    if not api_url:
        return 'no_url'

    try:
        response = requests.get(api_url, timeout=15)
        if response.status_code == 200 and len(response.content) > 500:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            return 'downloaded'
        else:
            return 'failed'
    except Exception:
        return 'error'


def download_all_thumbnails(videos, thumbnails_dir):
    """Scarica tutte le thumbnail in parallelo."""
    os.makedirs(thumbnails_dir, exist_ok=True)

    logger.info(f"Step 5: Download thumbnail in {thumbnails_dir}")

    downloaded = 0
    skipped = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {
            executor.submit(download_single_thumbnail, video, thumbnails_dir): video
            for video in videos
        }

        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()
            if result == 'downloaded':
                downloaded += 1
            elif result == 'skipped':
                skipped += 1
            else:
                failed += 1

            if i % 100 == 0:
                logger.info(f"  Thumbnail progress: {i}/{len(videos)} (scaricate: {downloaded}, già presenti: {skipped}, fallite: {failed})")

    logger.info(f"Thumbnail completate: {downloaded} scaricate, {skipped} già presenti, {failed} fallite")
    return downloaded, skipped, failed


def save_cache(videos):
    """Salva i video in data/videos_cache.json"""
    logger.info("Step 5: Salvataggio cache")

    # Ordina per data decrescente (più recenti prima)
    videos_sorted = sorted(videos, key=lambda x: x['published_at'], reverse=True)

    # Calcola statistiche
    total_hours = sum(v['duration_seconds'] for v in videos_sorted) / 3600

    if videos_sorted:
        first_video_date = min(v['published_at'] for v in videos_sorted)
        last_video_date = max(v['published_at'] for v in videos_sorted)
    else:
        first_video_date = None
        last_video_date = None

    # Costruisci JSON finale
    cache_data = {
        'last_updated': datetime.utcnow().isoformat() + 'Z',
        'total_videos': len(videos_sorted),
        'videos': videos_sorted
    }

    # Salva con formattazione leggibile
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache_data, f, indent=2, ensure_ascii=False)

    # Copia anche nella cartella public del frontend (servito direttamente da Vercel)
    os.makedirs(os.path.dirname(FRONTEND_CACHE_FILE), exist_ok=True)
    import shutil
    shutil.copy2(OUTPUT_FILE, FRONTEND_CACHE_FILE)

    logger.info(f"Cache salvata in: {OUTPUT_FILE}")
    logger.info(f"Cache copiata in: {FRONTEND_CACHE_FILE}")
    logger.info(f"Dimensione file: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")

    return total_hours, first_video_date, last_video_date

def main():
    """Funzione principale"""
    logger.info("=" * 60)
    logger.info("Fetch All Videos - Sync Completo")
    logger.info("=" * 60)

    try:
        # Autenticazione
        youtube = get_authenticated_service()

        # Step 1: Ottieni uploads playlist ID (1 unità)
        uploads_playlist_id = get_uploads_playlist_id(youtube, CHANNEL_ID)

        # Step 2: Recupera tutti i video dalla playlist (~31 unità)
        playlist_videos = get_all_playlist_items(youtube, uploads_playlist_id)

        # Step 3: Recupera dettagli video (~31 unità)
        video_ids = [v['id'] for v in playlist_videos]
        video_details = get_video_details(youtube, video_ids)

        # Step 4: Merge e filtra solo video live
        live_videos = merge_and_filter_videos(playlist_videos, video_details)

        if not live_videos:
            logger.error("ATTENZIONE: Nessun video live trovato!")
            logger.error("Verifica che il canale abbia video con liveStreamingDetails")
            sys.exit(1)

        # Step 5: Download thumbnail
        download_all_thumbnails(live_videos, THUMBNAILS_DIR)

        # Remove api_thumbnail_url from final data (internal use only)
        for video in live_videos:
            video.pop('api_thumbnail_url', None)

        # Step 6: Salva cache
        total_hours, first_date, last_date = save_cache(live_videos)

        # Riepilogo finale
        logger.info("=" * 60)
        logger.info("🎉 SYNC COMPLETATO CON SUCCESSO!")
        logger.info("=" * 60)
        logger.info(f"Totale video live: {len(live_videos)}")
        logger.info(f"Ore totali: ~{total_hours:.0f}h")
        logger.info(f"Prima lezione: {first_date[:10] if first_date else 'N/A'}")
        logger.info(f"Ultima lezione: {last_date[:10] if last_date else 'N/A'}")
        logger.info(f"Quota API usata: ~63 unità su 10.000 giornaliere")
        logger.info(f"Cache salvata in: {OUTPUT_FILE}")
        logger.info("")
        logger.info("Prossimi passi:")
        logger.info("  1. Verifica il file data/videos_cache.json")
        logger.info("  2. Esegui: python execution/generate_static_json.py")
        logger.info("  3. Sviluppa il frontend")
        logger.info("")

    except KeyboardInterrupt:
        logger.warning("\n⚠️  Sync interrotto dall'utente")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ ERRORE IMPREVISTO: {e}", exc_info=True)
        logger.error("Consulta .tmp/fetch_errors.log per dettagli")
        sys.exit(1)

if __name__ == '__main__':
    main()

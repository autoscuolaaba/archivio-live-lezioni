#!/usr/bin/env python3
"""
Script: Generate Mock Data
Scopo: Genera dati mock realistici per sviluppo frontend senza attendere OAuth/API YouTube
Output: data/videos_cache_mock.json
"""

import json
import random
from datetime import datetime, timedelta

# Titoli realistici per lezioni di teoria patente
LESSON_TOPICS = [
    "Segnaletica stradale - Segnali di pericolo",
    "Segnaletica stradale - Segnali di precedenza",
    "Segnaletica stradale - Segnali di divieto",
    "Segnaletica stradale - Segnali di obbligo",
    "Segnaletica stradale - Segnali di indicazione",
    "Norme sulla precedenza agli incroci",
    "Distanza di sicurezza e tempo di reazione",
    "Limiti di velocità e sanzioni",
    "Sorpasso e cambio di corsia",
    "Fermata e sosta - Regole e divieti",
    "Uso delle luci - Anabbaglianti, abbaglianti, fendinebbia",
    "Uso delle luci - Frecce e luci di emergenza",
    "Cinture di sicurezza e sistemi di ritenuta",
    "Comportamento in caso di incidente",
    "Alcol, droghe e guida - Normativa",
    "Documenti di circolazione - Patente e libretto",
    "Assicurazione RCA obbligatoria",
    "Revisione periodica del veicolo",
    "Categorie di patenti A, B, C, D",
    "Norme di comportamento con pedoni e ciclisti",
    "Attraversamento pedonale - Regole",
    "Rotatorie - Come affrontarle",
    "Autostrada - Norme di circolazione",
    "Trasporto di persone e merci",
    "Patente a punti - Decurtazione e recupero",
    "Guida in condizioni difficili - Pioggia, nebbia, neve",
    "Manutenzione del veicolo - Pneumatici e freni",
    "Educazione stradale - Comportamento corretto",
    "Circolazione nei centri abitati",
    "Segnaletica orizzontale - Strisce e zebre",
]

def generate_random_date(start_date, end_date):
    """Genera una data casuale tra start_date e end_date"""
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

def generate_mock_videos(count=50):
    """Genera N video mock realistici"""
    videos = []

    # Range date: dal 18 maggio 2020 a oggi
    start_date = datetime(2020, 5, 18)
    end_date = datetime.now()

    # Genera date distribuite uniformemente
    dates = sorted([generate_random_date(start_date, end_date) for _ in range(count)], reverse=True)

    for i, pub_date in enumerate(dates):
        # ID video realistico (11 caratteri come YouTube)
        video_id = f"mock{i:04d}{''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=5))}"

        # Titolo casuale
        topic = random.choice(LESSON_TOPICS)
        title = f"Lezione live - {topic}"

        # Durata casuale tra 30 min e 2.5 ore
        duration_minutes = random.randint(30, 150)
        duration_seconds = duration_minutes * 60
        hours = duration_seconds // 3600
        minutes = (duration_seconds % 3600) // 60

        if hours > 0:
            duration_formatted = f"{hours}h {minutes}m"
        else:
            duration_formatted = f"{minutes}m"

        # Thumbnail fittizio (usa un'immagine placeholder)
        thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"

        video = {
            "id": video_id,
            "title": title,
            "published_at": pub_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "year": pub_date.year,
            "month": pub_date.month,
            "duration_seconds": duration_seconds,
            "duration_formatted": duration_formatted,
            "thumbnail_url": thumbnail_url,
            "watch_url": f"https://www.youtube.com/watch?v={video_id}"
        }

        videos.append(video)

    return videos

def main():
    print("Generazione dati mock...")

    # Genera 50 video mock
    videos = generate_mock_videos(50)

    # Crea struttura cache
    cache_data = {
        "last_updated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_videos": len(videos),
        "videos": videos
    }

    # Salva in data/videos_cache_mock.json
    output_file = "data/videos_cache_mock.json"

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cache_data, f, indent=2, ensure_ascii=False)

    print(f"✅ {len(videos)} video mock generati")
    print(f"📄 File salvato: {output_file}")
    print(f"📊 Range date: {videos[-1]['published_at'][:10]} → {videos[0]['published_at'][:10]}")
    print(f"⏱️  Durata totale: ~{sum(v['duration_seconds'] for v in videos) / 3600:.0f}h")
    print("\nQuesto file può essere usato per sviluppare il frontend senza API YouTube reale.")

if __name__ == '__main__':
    main()

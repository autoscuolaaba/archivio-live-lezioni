#!/usr/bin/env python3
"""
Script: Generate Static JSON
Scopo: Genera JSON ottimizzato per il frontend, raggruppato per anno/mese
Input: data/videos_cache.json
Output: frontend/public/data/videos.json (o data/videos_frontend.json)
Direttiva di riferimento: directives/cache_strategy.md
"""

import os
import sys
import json
import logging
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# Configurazione
INPUT_FILE = 'data/videos_cache.json'
OUTPUT_FILE = 'data/videos_frontend.json'  # Cambia in 'frontend/public/data/videos.json' se frontend esiste
LOG_FILE = '.tmp/fetch_errors.log'

# Setup logging
os.makedirs('.tmp', exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, mode='a'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Nomi mesi in italiano
MONTH_NAMES_IT = {
    1: 'Gennaio',
    2: 'Febbraio',
    3: 'Marzo',
    4: 'Aprile',
    5: 'Maggio',
    6: 'Giugno',
    7: 'Luglio',
    8: 'Agosto',
    9: 'Settembre',
    10: 'Ottobre',
    11: 'Novembre',
    12: 'Dicembre'
}

def load_cache():
    """Carica videos_cache.json"""
    if not os.path.exists(INPUT_FILE):
        logger.error(f"File non trovato: {INPUT_FILE}")
        logger.error("Esegui prima: python execution/fetch_all_videos.py")
        sys.exit(1)

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)

        logger.info(f"Cache caricata: {cache['total_videos']} video")
        return cache
    except Exception as e:
        logger.error(f"Errore lettura cache: {e}")
        sys.exit(1)

def group_by_year_month(videos):
    """
    Raggruppa video per anno → mese

    Returns:
        dict: {year: {month: [videos]}}
    """
    grouped = defaultdict(lambda: defaultdict(list))

    for video in videos:
        year = video['year']
        month = video['month']
        grouped[year][month].append(video)

    return grouped

def build_frontend_structure(grouped_videos, cache_metadata):
    """
    Costruisci struttura JSON ottimizzata per frontend

    Output:
    {
      "last_updated": "...",
      "total_videos": 1530,
      "total_hours": 1200,
      "years": [
        {
          "year": 2024,
          "total": 312,
          "months": [
            {
              "month": 12,
              "month_name": "Dicembre",
              "total": 18,
              "videos": [...]
            }
          ]
        }
      ]
    }
    """
    # Calcola ore totali
    total_seconds = sum(v['duration_seconds'] for v in cache_metadata['videos'])
    total_hours = int(total_seconds / 3600)

    years_list = []

    # Ordina anni decrescenti (2024, 2023, 2022, ...)
    for year in sorted(grouped_videos.keys(), reverse=True):
        months_data = grouped_videos[year]

        months_list = []

        # Ordina mesi decrescenti (12, 11, 10, ...)
        for month in sorted(months_data.keys(), reverse=True):
            videos = months_data[month]

            # Ordina video per data decrescente all'interno del mese
            videos_sorted = sorted(videos, key=lambda x: x['published_at'], reverse=True)

            month_obj = {
                'month': month,
                'month_name': MONTH_NAMES_IT[month],
                'total': len(videos_sorted),
                'videos': videos_sorted
            }
            months_list.append(month_obj)

        # Totale video nell'anno
        year_total = sum(m['total'] for m in months_list)

        year_obj = {
            'year': year,
            'total': year_total,
            'months': months_list
        }
        years_list.append(year_obj)

    # Struttura finale
    frontend_data = {
        'last_updated': cache_metadata['last_updated'],
        'total_videos': cache_metadata['total_videos'],
        'total_hours': total_hours,
        'years': years_list
    }

    return frontend_data

def save_json(data, output_path):
    """Salva JSON formattato"""
    try:
        # Crea directory se non esiste
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        # Salva JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        # Info dimensione
        file_size_kb = os.path.getsize(output_path) / 1024
        logger.info(f"JSON salvato: {output_path}")
        logger.info(f"Dimensione: {file_size_kb:.1f} KB")

        return True
    except Exception as e:
        logger.error(f"Errore durante salvataggio: {e}")
        return False

def validate_output(data):
    """Validazione sanity check"""
    issues = []

    if data['total_videos'] == 0:
        issues.append("Nessun video nel JSON")

    if data['total_hours'] == 0:
        issues.append("Ore totali = 0 (sospetto)")

    if not data['years']:
        issues.append("Array 'years' vuoto")

    # Controlla che tutti gli anni abbiano mesi
    for year_obj in data['years']:
        if not year_obj['months']:
            issues.append(f"Anno {year_obj['year']} non ha mesi")

        # Controlla che tutti i mesi abbiano video
        for month_obj in year_obj['months']:
            if not month_obj['videos']:
                issues.append(f"Mese {month_obj['month_name']} {year_obj['year']} non ha video")

    if issues:
        logger.warning("⚠️  Validazione trovato problemi:")
        for issue in issues:
            logger.warning(f"  - {issue}")
        return False
    else:
        logger.info("✅ Validazione OK")
        return True

def main():
    """Funzione principale"""
    logger.info("=" * 60)
    logger.info("Generate Static JSON per Frontend")
    logger.info("=" * 60)

    try:
        # Carica cache
        cache = load_cache()

        # Raggruppa per anno/mese
        logger.info("Raggruppamento per anno e mese...")
        grouped = group_by_year_month(cache['videos'])

        # Costruisci struttura frontend
        logger.info("Costruzione struttura frontend...")
        frontend_data = build_frontend_structure(grouped, cache)

        # Validazione
        logger.info("Validazione output...")
        validate_output(frontend_data)

        # Determina output path
        # Se frontend/public/data/ esiste, usa quello; altrimenti data/
        frontend_path = 'frontend/public/data/videos.json'
        if os.path.exists('frontend/public/data'):
            output_path = frontend_path
            logger.info("Directory frontend trovata, salvo in frontend/public/data/")
        else:
            output_path = OUTPUT_FILE
            logger.info("Directory frontend non trovata, salvo in data/")

        # Salva JSON
        success = save_json(frontend_data, output_path)

        if not success:
            logger.error("Salvataggio fallito")
            sys.exit(1)

        # Riepilogo
        logger.info("=" * 60)
        logger.info("🎉 JSON FRONTEND GENERATO CON SUCCESSO!")
        logger.info("=" * 60)
        logger.info(f"File: {output_path}")
        logger.info(f"Totale video: {frontend_data['total_videos']}")
        logger.info(f"Ore totali: ~{frontend_data['total_hours']}h")
        logger.info(f"Anni coperti: {len(frontend_data['years'])}")
        logger.info("")
        logger.info("Struttura:")
        for year_obj in frontend_data['years']:
            logger.info(f"  {year_obj['year']}: {year_obj['total']} video in {len(year_obj['months'])} mesi")
        logger.info("")
        logger.info("Prossimi passi:")
        logger.info("  - Sviluppa il frontend Next.js")
        logger.info("  - Usa questo JSON per popolare l'UI")
        logger.info("")

    except KeyboardInterrupt:
        logger.warning("\n⚠️  Generazione interrotta dall'utente")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ ERRORE IMPREVISTO: {e}", exc_info=True)
        logger.error("Consulta .tmp/fetch_errors.log per dettagli")
        sys.exit(1)

if __name__ == '__main__':
    main()

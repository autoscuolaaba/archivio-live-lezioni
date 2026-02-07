#!/usr/bin/env python3
"""
Script: YouTube OAuth Setup
Scopo: Prima autenticazione OAuth 2.0 e salvataggio token per accesso YouTube Data API
Direttiva di riferimento: directives/setup_google_cloud.md
"""

import os
import sys
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Configurazione
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
CLIENT_SECRET_FILE = os.getenv('GOOGLE_CLIENT_SECRET_FILE', 'credentials.json')
TOKEN_FILE = os.getenv('GOOGLE_TOKEN_FILE', 'token.json')

def check_credentials_file():
    """Verifica che il file credentials.json esista"""
    if not os.path.exists(CLIENT_SECRET_FILE):
        print(f"❌ ERRORE: File '{CLIENT_SECRET_FILE}' non trovato!")
        print("\nPer ottenere questo file:")
        print("1. Vai su https://console.cloud.google.com/apis/credentials")
        print("2. Crea OAuth 2.0 Client ID (tipo: Desktop app)")
        print("3. Scarica il JSON e salvalo come 'credentials.json' nella root del progetto")
        print("\nPer istruzioni dettagliate, consulta: directives/setup_google_cloud.md")
        sys.exit(1)

def get_authenticated_service():
    """
    Autentica l'utente e salva il token.

    Flusso:
    1. Controlla se esiste token.json valido
    2. Se valido → usa quello
    3. Se scaduto → prova refresh automatico
    4. Se refresh fallisce o token non esiste → apri browser per OAuth flow
    5. Salva nuovo token
    """
    creds = None

    # Controlla se esiste già un token salvato
    if os.path.exists(TOKEN_FILE):
        print(f"📄 Token esistente trovato: {TOKEN_FILE}")
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    # Se non ci sono credenziali valide disponibili
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Token scaduto. Tentativo di refresh automatico...")
            try:
                creds.refresh(Request())
                print("✅ Token refreshato con successo!")
            except Exception as e:
                print(f"⚠️  Refresh automatico fallito: {e}")
                print("Procedo con nuovo OAuth flow...")
                creds = None

        # Se ancora non abbiamo credenziali valide, fai OAuth flow
        if not creds:
            print("\n🌐 Apertura browser per autenticazione OAuth...")
            print("Ti verrà chiesto di:")
            print("  1. Fare login con il tuo account Google")
            print("  2. Autorizzare l'accesso (clicca 'Advanced' se vedi warning)")
            print("  3. Permettere 'View your YouTube account'\n")

            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CLIENT_SECRET_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
                print("\n✅ Autenticazione completata!")
            except Exception as e:
                print(f"\n❌ ERRORE durante autenticazione: {e}")
                sys.exit(1)

        # Salva il token per usi futuri
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
        print(f"💾 Token salvato in: {TOKEN_FILE}")
    else:
        print("✅ Token esistente è ancora valido!")

    return creds

def main():
    """Funzione principale"""
    print("=" * 60)
    print("YouTube OAuth Setup - Autoscuola ABA")
    print("=" * 60)
    print()

    # Verifica che credentials.json esista
    check_credentials_file()

    # Autenticazione
    try:
        creds = get_authenticated_service()

        print("\n" + "=" * 60)
        print("🎉 SETUP COMPLETATO CON SUCCESSO!")
        print("=" * 60)
        print(f"\nFile creati:")
        print(f"  ✓ {TOKEN_FILE}")
        print(f"\nIl token è valido per 7 giorni (modalità Testing di Google).")
        print(f"Dopo 7 giorni, dovrai ri-eseguire questo script OPPURE")
        print(f"gli altri script proveranno automaticamente a refreshare il token.")
        print(f"\nProssimi passi:")
        print(f"  1. Esegui: python execution/fetch_all_videos.py")
        print(f"  2. Consulta: directives/fetch_youtube_videos.md")
        print()

    except Exception as e:
        print(f"\n❌ ERRORE IMPREVISTO: {e}")
        print("\nPer supporto, consulta:")
        print("  - directives/setup_google_cloud.md (sezione Troubleshooting)")
        print("  - .tmp/fetch_errors.log (log dettagliati)")
        sys.exit(1)

if __name__ == '__main__':
    main()

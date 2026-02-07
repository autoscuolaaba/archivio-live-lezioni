#!/bin/bash

# Script per avviare Backend + Frontend in modalità sviluppo

echo "🚀 Avvio Lezioni Live ABA - Modalità Sviluppo"
echo "=============================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funzione per cleanup
cleanup() {
    echo ""
    echo -e "${RED}⏹  Arresto servizi...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Controlla che le dipendenze siano installate
echo -e "${BLUE}📦 Controllo dipendenze...${NC}"

if [ ! -d "backend/venv" ]; then
    echo "  Creo virtual environment Python..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "  Installo dipendenze npm..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo -e "${GREEN}✅ Dipendenze OK${NC}"
echo ""

# Avvia Backend
echo -e "${BLUE}🐍 Avvio Backend (FastAPI)...${NC}"
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

# Controlla che il backend sia partito
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running su http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Errore avvio backend. Vedi backend.log${NC}"
    tail -20 backend.log
    exit 1
fi

echo ""

# Avvia Frontend
echo -e "${BLUE}⚛️  Avvio Frontend (Next.js)...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5

echo ""
echo -e "${GREEN}✅ Frontend running su http://localhost:3000${NC}"
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Applicazione avviata!${NC}"
echo ""
echo "  📱 Frontend: http://localhost:3000"
echo "  🔧 Backend:  http://localhost:8000"
echo "  📖 API Docs: http://localhost:8000/docs"
echo ""
echo -e "${BLUE}Premi Ctrl+C per fermare tutto${NC}"
echo "=============================================="
echo ""

# Mostra log in real-time
tail -f frontend.log backend.log

# Cleanup alla fine
cleanup

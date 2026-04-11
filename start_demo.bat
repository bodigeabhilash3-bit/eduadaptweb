@echo off
echo ==========================================
echo Starting EduAdapt Demo (Fresh State)
echo ==========================================

echo [1/2] Resetting database to a clean state...
if exist eduadapt.db (
    del eduadapt.db
    echo Database deleted.
) else (
    echo No existing database found.
)

echo [2/2] Starting full-stack application...
echo (This will start both FastAPI backend and Next.js frontend)
echo Press Ctrl+C to stop the servers when you are done.
echo ------------------------------------------

npm run dev

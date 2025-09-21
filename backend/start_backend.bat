@echo off
echo Starting Excel Table Maker Backend...
cd /d "%~dp0"

echo Installing dependencies...
pip install -r requirements.txt

echo Starting FastAPI server with 4 workers for high performance...
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload --workers 4

pause

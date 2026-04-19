@echo off
echo ===================================================
echo SimVesto AI Backend - One-Click Installer
echo ===================================================

echo 1. Downloading Python 3.12 (Silently)...
winget install -e --id Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements

echo 2. Creating Virtual Environment...
py -3.12 -m venv venv

echo 3. Installing AI Packages (This takes 2-3 minutes)...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo ===================================================
echo SETUP COMPLETE! You can now start the server with:
echo venv\Scripts\activate.bat
echo uvicorn main:app --reload
pause

@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0galleytex-autocompile.ps1" %*
if errorlevel 1 pause

@echo off
title AmandaBOT Stop
cd /d "%~dp0"
taskkill /F /IM node.exe
echo Bot parado com sucesso!
pause 
@echo off
title AmandaBOT Clean Start
cd /d "%~dp0"

echo Parando processos Node.js...
taskkill /F /IM node.exe 2>nul

echo Removendo arquivos de sessao...
if exist baileys_auth_info rmdir /s /q baileys_auth_info
if exist .amanda.lock del /f /q .amanda.lock

echo Removendo pasta dist...
if exist dist rmdir /s /q dist

echo Compilando o projeto...
call npm run build

echo Iniciando o bot...
node --max-old-space-size=1024 --optimize_for_size dist/index.js

pause 
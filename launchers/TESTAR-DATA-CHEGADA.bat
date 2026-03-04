@echo off
chcp 65001 > nul
title Testar Data de Chegada e Alertas DG

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     TESTE - DATA DE CHEGADA E ALERTAS DE DG               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

node testar-data-chegada.js

echo.
echo ════════════════════════════════════════════════════════════
echo Pressione qualquer tecla para fechar...
pause > nul

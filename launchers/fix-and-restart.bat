@echo off
echo Limpando cache do Next.js...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo Reinstalando dependencias...
npm install

echo Iniciando servidor de desenvolvimento...
npm run dev
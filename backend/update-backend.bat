@echo off
cd /d C:\Users\josu\Documents\repos\falco-app\backend

REM bajar últimos cambios
git pull origin develop

REM instalar dependencias nuevas (por las dudas)
npm install

REM reiniciar el proceso que ya tenemos en pm2
pm2 restart backend

echo [%date% %time%] Backend actualizado >> C:\Users\josu\Documents\repos\falco-app\backend\update-log.txt

@echo off
echo Cleaning up...
rmdir /s /q node_modules
del package-lock.json

echo Installing dependencies...
call npm install
call npm install react-router-dom axios

echo Starting application...
call npm start

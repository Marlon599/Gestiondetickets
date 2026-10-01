# Gestión de Mantenimiento

Sistema web para registrar y controlar mantenimientos realizados por mecánicos.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Base de datos: SQL Server

## Primer paso
1. Ejecutar `db/01_schema.sql` en SQL Server.
2. Copiar `backend/.env.example` a `backend/.env` y colocar las credenciales.
3. En `backend`: `npm install` y `npm run dev`.
4. En `frontend`: `npm install` y `npm run dev`.

## Próxima implementación
- Login y roles
- CRUD de mecánicos y máquinas
- Formulario de ticket
- Carga de fotos
- Dashboard administrativo
- Historial por máquina
- Métricas y reportes
- QR por máquina

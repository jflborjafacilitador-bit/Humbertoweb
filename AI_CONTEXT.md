# Contexto Compartido de Desarrollo AI
**Proyecto:** Humberto Web ("Mis Asesores Inmobiliarios")
**Stack:** React, TypeScript, Vite, Tailwind/Vanilla CSS

Este documento sirve como base de memoria si vas a trabajar con otro asistente de inteligencia artificial (Claude, ChatGPT, Cursor, etc.). Aliméntalo con este texto antes de pedirle cambios.

## 1. Despliegue y Entorno
- **Despliegue Únicamente vía GitHub Actions:** El proyecto se sube y compila automáticamente hacia un servidor de Hostinger (`humberto.misasesoresinmobiliarios.com`) mediante Pushes a GitHub.
- **NO pre-visualizar en el navegador localmente:** El usuario prefiere ver los cambios directo en la URL de producción o usar su monitor. No inyectar scripts que fuercen abrir ventanas (`open http://localhost...`).
- **Enrutamiento Apache Hostinger:** Existe un archivo `public/.htaccess` ya configurado para evitar el error 404 al navegar a los diferentes componentes del panel `/admin`.

## 2. Base de Datos e Inventario (Firebase)
- Backend enteramente manejado desde Google Firebase (Firestore para base de datos y Storage para imágenes).
- **Nuevo modelo de dominio Storage:** Se utiliza `.firebasestorage.app` en vez del antiguo `.appspot.com` (Ver variable local `VITE_FIREBASE_STORAGE_BUCKET` en `.env`).
- Las reglas de seguridad de **CORS** obligaron a inyectar el permiso manualmente en Google Cloud Console para autorizar las subidas de imágenes usando el archivo base `cors.json`.

## 3. Estado de Módulos (Panel Administrador)
- Todo el CMS está construido a la medida en la ruta `src/admin/`.
- **Propiedades (Creación y Edición):** Usa autocompletado en cascada estricto de la librería `<Autocomplete />` de Google Maps, NO el modal o widget interno por problemas z-index.
- **Calendario (Disponibilidad de Rentas):** Integrado un calendario de fechas a través de `react-big-calendar`. Cuando la `operación` es "Renta", en el dashboard estático se despliegan automáticamente los datos `disponibleDesde` y `disponibleHasta`. Esta información ya está conectada al cliente final para los usuarios navegando.

## 4. Convención de Versiones
- Cualquier LLM/Agente que despache una nueva función a este código está **OBLIGADO** a abrir el archivo `src/admin/AdminLayout.tsx` e incrementar un punto la versión estática que se muestra en el menú inferior-izquierdo (ej: `v1.0.1` -> `v1.0.2`). Esto le permite al Dueño/Director confirmar que se limpió el caché de servidor.

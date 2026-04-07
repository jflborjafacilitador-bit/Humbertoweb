# Contexto Compartido de Desarrollo AI
**Proyecto:** Humberto Web ("Mis Asesores Inmobiliarios")
**Stack:** React, TypeScript, Vite, Vanilla CSS
**Versión actual:** `v1.0.7`
**URL Producción:** https://humberto.misasesoresinmobiliarios.com

Este documento sirve como base de memoria para cualquier asistente AI.
Aliméntalo antes de pedir cambios en sesiones futuras.

---

## 1. Despliegue y Entorno

- **Flujo:** Local primero (`npm run dev` ya corre siempre) → usuario aprueba → `git add` + `git commit` + `git push` → GitHub Actions despliega en Hostinger automáticamente.
- **NUNCA** abrir navegadores automáticamente ni hacer push sin aprobación explícita del usuario.
- **Shell:** PowerShell en Windows — usar comandos separados, NO `&&` entre comandos git.
- **Enrutamiento:** `public/.htaccess` ya configurado para evitar 404 en sub-rutas (`/admin`, etc.).

---

## 2. Firebase (Backend)

- **Firestore:** Colecciones activas: `propiedades`, `reservas`, `leads`.
- **Storage bucket:** `.firebasestorage.app` (NO el antiguo `.appspot.com`). Variable: `VITE_FIREBASE_STORAGE_BUCKET` en `.env`.
- **CORS:** Configurado via `cors.json` inyectado en Google Cloud Console.
- **Auth:** Dominio `humberto.misasesoresinmobiliarios.com` debe estar en Firebase Console → Authentication → Settings → Authorized domains.
- **Google Maps API:** `VITE_GOOGLE_MAPS_API_KEY` en `.env`. APIs habilitadas: Maps JavaScript, Places API, Places API (New). Cargado via bootstrap loader en `index.html`.

---

## 3. Modelo de Datos — Propiedad (`propiedades`)

### Tipo: Venta / Renta Mensual
```
operacion: "Venta" | "Renta"
nombre, precio, ubicacion, descripcion
recamaras, banos, m2Terreno, m2Construccion
salas, comedores, cocinas, estacionamientos
status: "Disponible" | "Vendida" | "Rentada" | "En Pausa"
tipo: "Casa" | "Departamento" | "Terreno" | "Local Comercial" | "Oficina" | "Bodega"
amenidades: string[]
imagenes: string[]  (URLs de Firebase Storage)
createdAt: Timestamp
```

### Tipo: Renta por Evento (🎉 Airbnb-style)
```
operacion: "Evento"
tipoEvento: "Hacienda" | "Finca" | "Rancho" | "Villa" | "Cabaña" | "Glamping" | ...
diasDisponibles: number[]  (0=Dom, 1=Lun ... 6=Sáb)
horaEntrada: "14:00"     (string HH:MM)
horaSalida: "12:00"      (string HH:MM)
capacidadPersonas: string (número de personas)
precioEvento: string      (precio por evento/día)
notasEvento: string       (políticas del espacio)
+ todos los campos base anteriores
```

### Colección `reservas`
```
propertyId, propertyName, clientName
personas, notas
start: "2026-04-10T00:00:00"
end:   "2026-04-12T23:59:59"
```

---

## 4. Módulos del Panel Admin (`src/admin/`)

### `Propiedades.tsx` — Sistema Dual
- **Paso 0:** Al hacer "+ Agregar Propiedad", aparece un **selector de tipo** con dos cards:
  - 🏷️ Venta / Renta Mensual → formulario tradicional
  - 🎉 Renta por Evento → formulario extendido con: días disponibles (pills), horarios check-in/out, capacidad personas, amenidades de evento, notas/políticas
- **Input de Ubicación:** Componente `PlacesInput` = input controlado (`value`+`onChange`) que SIEMPRE guarda lo que escribe el usuario. Google Autocomplete se inicializa opcionalmente encima si la API carga. **NUNCA usar `defaultValue`** en este input (no captura cambios).
- **Bug histórico resuelto:** Al editar una propiedad, el `...prop` spread incluía `createdAt` (Firestore Timestamp). Se resuelve con destructuring: `const { id: _id, createdAt: _createdAt, ...cleanProp } = prop`.

### `CalendarioAdmin.tsx` — Calendario Inteligente
- Filtra SOLO propiedades con `operacion === "Evento"`.
- `dayPropGetter`: días NO disponibles → fondo gris rayado. Días disponibles → fondo dorado sutil.
- Banner informativo al seleccionar propiedad: días + horarios + capacidad + precio.
- Validación al hacer clic en slot: si el día no está en `diasDisponibles`, muestra alerta roja animada.
- Modal de reserva extendido: campo personas, notas, info del espacio.

### `AdminLayout.tsx` — Sidebar
- Versión visible en esquina inferior: actualmente `v1.0.7`.
- **OBLIGATORIO:** Incrementar versión en cada deploy con nuevas funciones.

---

## 5. Frontend Público (`src/App.tsx`)

### Ficha de Propiedad (modal de detalle)
- Galería de imágenes con carrusel.
- Specs: recámaras, baños, m², estacionamiento.
- Amenidades, descripción.
- **Botón "Ver Ubicación en Google Maps":** Solo aparece si `prop.ubicacion` existe. Enlace: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prop.ubicacion)}`. Muestra también la dirección en texto debajo.
- **Botón "Solicitar Información":** cierra modal y abre formulario de contacto.
- **Botón "WhatsApp":** abre chat con mensaje pre-llenado con el nombre de la propiedad.

### Tarjetas de Propiedad (listado)
- Botón **"Ver Detalle"** → abre modal de ficha.
- Botón **"Contactar"** → abre WhatsApp con mensaje: *"Hola Humberto, me interesa la propiedad: [nombre], ¿me puede dar más información?"*. URL: `https://wa.me/527352704429?text=...`

---

## 6. Reglas de Oro

1. **Versión en sidebar** — siempre incrementar en `AdminLayout.tsx` al hacer deploy.
2. **Input ubicación** — usar `value` controlado, NUNCA `defaultValue`.
3. **Firestore spread** — al editar propiedades, desestructurar y excluir `createdAt`, `updatedAt`, `id` antes de meter al state.
4. **PowerShell** — separar comandos git en líneas individuales (no `&&`).
5. **Google Maps API** — si hay error `ApiTargetBlockedMapError`, es problema de Google Cloud Console (billing o APIs no habilitadas), no de código.
6. **Estética:** Gold `#D4AF37` / `#BF9B2D`, dark `#111827`, font Playfair Display para títulos, Inter para cuerpo.
7. **NO abrir navegador** automáticamente.

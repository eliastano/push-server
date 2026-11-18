# Pokédex PWA - Proyecto de Desempeño

Aplicación Web Progresiva (PWA) desarrollada con **Angular 22**, soporte offline mediante **Angular Service Worker (NGSW)** consumiendo la **PokéAPI REST pública**, e integración cliente-servidor para **Notificaciones Push Web** con autenticación **VAPID**.

---

## ⚡ Formas Rápidas de Levantar el Proyecto Localmente

Tienes dos formas muy sencillas de levantarlo:

### Opción 1: Ejecutar desde la raíz del proyecto (`SHD`)

Abre dos terminales en la carpeta `SHD`:

- **Terminal 1 (Servidor Push en puerto 3000):**
  ```powershell
  npm run server
  ```
- **Terminal 2 (PWA con Service Worker en puerto 8080):**
  ```powershell
  npm run pwa
  ```

---

### Opción 2: Doble clic en los ejecutables (Windows)

En la carpeta `SHD` encontrarás dos archivos listos:
1. `iniciar-servidor.bat` (Arranca el backend de notificaciones en `http://localhost:3000`)
2. `iniciar-pwa.bat` (Compila y arranca la PWA en `http://localhost:8080`)

---

## 🌐 Ver en el Navegador

Abre tu navegador (Google Chrome o Edge) en:
```text
http://localhost:8080
```

1. **Service Worker:** En la consola (`F12`) y en la barra superior verás **`SW Activo`** y el contador de recursos en **`CacheStorage`**.
2. **Modo Offline:** En `F12 → Network` activa **Offline** y recarga con `F5`: la app continuará funcionando con los datos y sprites cacheados.
3. **Notificaciones Push:** En la pestaña **Notificaciones Push** suscríbete y dispara alertas de prueba directamente a tu dispositivo.

---

## 📋 Resumen de Cumplimiento de Instrucciones

| Paso | Requisito | Archivo Principal |
| :--- | :--- | :--- |
| **Paso 1** | Standalone, rutas y manifiesto | `poke-pwa/public/manifest.webmanifest`, `app.routes.ts` |
| **Paso 2** | Consumo PokeAPI con HttpClient | `poke-pwa/src/app/services/pokemon.service.ts` |
| **Paso 3** | `@angular/pwa`, Asset y Data Groups | `poke-pwa/package.json`, `poke-pwa/ngsw-config.json` |
| **Paso 4** | Servidor Push VAPID (/subscribe, /push) | `push-server/src/server.js`, `push-server/.env` |
| **Paso 5** | Integración SwPush cliente-servidor | `poke-pwa/src/app/services/push-notification.ts` |
| **Paso 6** | Compilación de producción y despliegue | `poke-pwa/vercel.json`, `poke-pwa/public/_redirects` |

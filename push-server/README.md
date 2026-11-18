# PWA Push Server

Backend pequeño de Web Push para la PWA Angular. Expone la misma forma de API que usa el servicio de la app: `POST /api/subscribe` y `POST /api/push`.

## Requisitos

- Node.js 20 o posterior.
- Una clave pública y privada VAPID.
- Para despliegue persistente, una base PostgreSQL configurada con `DATABASE_URL`.

## Probar localmente

En PowerShell, desde esta carpeta:

```powershell
npm install
npm run generate:vapid
npm start
```

El comando `generate:vapid` crea `.env` con un par de claves local y muestra la clave pública. Copia esa clave pública a la configuración de la PWA; la privada se queda únicamente en `.env` y en las variables secretas del hosting.

Comprueba que arrancó visitando `http://localhost:3000/api/health`. Debe responder JSON con `"status":"ok"`.

## Rutas

- `GET /api/health`: estado del proceso y número de suscripciones registradas.
- `GET /api/vapid-public-key`: entrega la clave pública para clientes autorizados por CORS.
- `POST /api/subscribe`: registra o actualiza una suscripción Web Push.
- `POST /api/push`: difunde `{ "title": "...", "body": "..." }` a todas las suscripciones guardadas. Responde con `enviadas`, `fallidas` y `suscripciones`.

## Variables de entorno

Configura estas variables localmente en `.env` o en la sección Environment de Render:

- `PORT`: Render lo proporciona automáticamente; localmente el valor predeterminado es `3000`.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`: genera un par por entorno con `npm run generate:vapid`. No reutilices la privada del servidor del profesor.
- `VAPID_SUBJECT`: contacto VAPID, por ejemplo `mailto:tu-correo@example.com`.
- `CORS_ORIGINS`: lista de orígenes exactos separados por comas, incluyendo protocolo y puerto. Agrega el dominio final de la PWA.
- `DATABASE_URL`: conexión PostgreSQL opcional para el desarrollo local y necesaria para conservar suscripciones entre reinicios en producción.
- `DATABASE_SSL=true`: activa TLS para una base que lo requiera.

Sin `DATABASE_URL`, el servidor sirve para probar localmente, pero guarda las suscripciones solo en memoria. En Render esa opción no es confiable: al reiniciarse la instancia se pierden. Para el despliegue de clase, crea/configura PostgreSQL y conecta su URL privada al Web Service.

## Publicar en Render

1. Sube la carpeta `push-server` a un repositorio GitHub.
2. Crea un Render **Web Service** desde ese repositorio.
3. Define `Root Directory` como `push-server`, `Build Command` como `npm install` y `Start Command` como `npm start`.
4. Agrega `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CORS_ORIGINS` y `DATABASE_URL` en Environment. Mantén la privada como variable secreta, no en GitHub.
5. Si tu base requiere TLS, configura `DATABASE_SSL=true`.
6. Despliega y comprueba `https://TU-SERVICIO.onrender.com/api/health`.
7. En Angular configura la URL base como `https://TU-SERVICIO.onrender.com/api` y usa el mismo valor de `VAPID_PUBLIC_KEY`.

Cada PWA debe usar la clave pública que corresponde a la privada de este servidor y registrar su propia suscripción mediante `/api/subscribe`. El servidor envía una notificación push a todas las suscripciones registradas.

## Alcance de práctica

Este backend es para una demostración de clase. `/api/push` permite a cualquier cliente autorizado por CORS solicitar un envío; CORS no es autenticación. No lo uses para notificaciones sensibles o un servicio público sin agregar autenticación y límites de uso.

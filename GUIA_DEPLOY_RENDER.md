# 🚀 Guía Completa de Despliegue en Render

Esta guía te ayudará a desplegar tu sistema completo (Backend FastAPI, Frontend Next.js y Base de Datos PostgreSQL) en Render de forma **GRATUITA**.

## 📋 Requisitos Previos

1. ✅ Cuenta en GitHub (gratis)
2. ✅ Cuenta en Render (gratis en https://render.com)
3. ✅ Tu código subido a un repositorio de GitHub

---

## 🎯 Opción 1: Despliegue Automático con render.yaml (RECOMENDADO)

Si tienes el archivo `render.yaml` en la raíz de tu repositorio, Render puede crear todos los servicios automáticamente.

### Paso 1: Subir código a GitHub

1. Asegúrate de que todo tu código esté en GitHub
2. Verifica que el archivo `render.yaml` esté en la raíz del repositorio

### Paso 2: Conectar con Render

1. Ve a https://dashboard.render.com
2. Inicia sesión con tu cuenta de GitHub
3. Click en **"New +"** → **"Blueprint"**
4. Selecciona tu repositorio
5. Render detectará automáticamente el `render.yaml`
6. Click en **"Apply"**
7. Render creará automáticamente:
   - Base de datos PostgreSQL
   - Servicio Backend
   - Servicio Frontend

### Paso 3: Esperar el despliegue

- El backend puede tardar 5-10 minutos en buildear
- El frontend puede tardar 3-5 minutos
- La base de datos se crea casi instantáneamente

### Paso 4: Ejecutar migraciones

Una vez que el backend esté desplegado:

1. Ve a tu servicio `ferreteria-backend` en Render
2. Click en **"Shell"** (en la parte superior)
3. Ejecuta:
   ```bash
   alembic upgrade head
   ```
4. Si necesitas datos iniciales:
   ```bash
   python scripts/seed.py
   ```

### Paso 5: Actualizar CORS (IMPORTANTE)

1. Ve a `ferreteria-backend` → **"Environment"**
2. Busca `CORS_ORIGINS`
3. Reemplaza `["*"]` con la URL de tu frontend:
   ```
   ["https://ferreteria-frontend.onrender.com"]
   ```
   (Reemplaza con la URL real que Render te asignó)
4. Guarda los cambios (esto reiniciará el servicio)

---

## 🎯 Opción 2: Despliegue Manual (Paso a Paso)

Si prefieres crear cada servicio manualmente:

### Paso 1: Crear Base de Datos PostgreSQL

1. Ve a https://dashboard.render.com
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `ferreteria-db`
   - **Database**: `ferreteria`
   - **User**: `ferreteria_user`
   - **PostgreSQL Version**: `15`
   - **Plan**: `Free`
4. Click en **"Create Database"**
5. **IMPORTANTE**: Guarda la **Internal Database URL** (la necesitarás después)

### Paso 2: Desplegar Backend (FastAPI)

1. En Render Dashboard, click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name**: `ferreteria-backend`
   - **Environment**: `Docker`
   - **Region**: Elige el más cercano (ej: `Oregon (US West)`)
   - **Branch**: `main` (o la rama que uses)
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile.render`
   - **Docker Context**: `.` (punto)
4. En **Environment Variables**, agrega:
   ```
   DATABASE_URL = [Pega la Internal Database URL del paso 1]
   JWT_SECRET = [Genera uno: openssl rand -hex 32]
   CORS_ORIGINS = ["*"]
   APP_ENV = production
   API_PREFIX = /api
   ACCESS_TOKEN_EXPIRE_MINUTES = 30
   REFRESH_TOKEN_EXPIRE_MINUTES = 43200
   ```
5. Click en **"Create Web Service"**
6. Espera a que el build termine (5-10 minutos)

### Paso 3: Ejecutar Migraciones

1. Ve a `ferreteria-backend` → **"Shell"**
2. Ejecuta:
   ```bash
   alembic upgrade head
   ```
3. (Opcional) Para datos iniciales:
   ```bash
   python scripts/seed.py
   ```

### Paso 4: Desplegar Frontend (Next.js)

1. En Render Dashboard, click en **"New +"** → **"Web Service"**
2. Conecta el mismo repositorio de GitHub
3. Configura:
   - **Name**: `ferreteria-frontend`
   - **Environment**: `Node`
   - **Region**: La misma que el backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. En **Environment Variables**, agrega:
   ```
   NEXT_PUBLIC_API_BASE = https://ferreteria-backend.onrender.com
   NEXT_PUBLIC_API_PREFIX = /api/v1
   ```
   (Reemplaza `ferreteria-backend` con el nombre real de tu servicio)
5. Click en **"Create Web Service"**
6. Espera a que el build termine (3-5 minutos)

### Paso 5: Actualizar CORS en Backend

1. Ve a `ferreteria-backend` → **"Environment"**
2. Actualiza `CORS_ORIGINS`:
   ```
   CORS_ORIGINS = ["https://ferreteria-frontend.onrender.com"]
   ```
   (Reemplaza con la URL real de tu frontend)
3. Guarda los cambios

---

## ✅ Verificar que Todo Funcione

1. **Backend Health Check**:
   - Visita: `https://ferreteria-backend.onrender.com/api/v1/health`
   - Deberías ver: `{"status":"ok"}`

2. **Frontend**:
   - Visita: `https://ferreteria-frontend.onrender.com`
   - Deberías ver la página de inicio

3. **Probar Login/Registro**:
   - Intenta crear una cuenta o iniciar sesión
   - Verifica que las peticiones al backend funcionen

---

## 🔧 Solución de Problemas

### ❌ El backend no inicia

**Problemas comunes:**
- `DATABASE_URL` incorrecta → Usa la **Internal Database URL** (no la externa)
- Error de conexión a DB → Verifica que la base de datos esté creada
- Error en Dockerfile → Revisa los logs en Render Dashboard → Logs

**Solución:**
1. Ve a `ferreteria-backend` → **"Logs"**
2. Revisa los errores
3. Verifica las variables de entorno en **"Environment"**

### ❌ El frontend no se conecta al backend

**Problemas comunes:**
- `NEXT_PUBLIC_API_BASE` incorrecta → Debe ser la URL completa del backend
- CORS bloqueado → Actualiza `CORS_ORIGINS` en el backend
- Backend dormido → El primer request puede tardar ~30 segundos

**Solución:**
1. Verifica `NEXT_PUBLIC_API_BASE` en el frontend
2. Verifica `CORS_ORIGINS` en el backend
3. Prueba el health check del backend directamente

### ❌ Error de base de datos

**Problemas comunes:**
- Migraciones no ejecutadas → Ejecuta `alembic upgrade head`
- `DATABASE_URL` incorrecta → Usa la Internal URL
- Tablas no existen → Ejecuta las migraciones

**Solución:**
1. Ve a `ferreteria-backend` → **"Shell"**
2. Ejecuta: `alembic upgrade head`
3. Verifica que las tablas se crearon

### ❌ El servicio se "duerme"

**Esto es normal en el plan gratuito:**
- Los servicios se duermen después de 15 minutos de inactividad
- El primer request después de dormir puede tardar ~30 segundos
- Esto es normal y no se puede evitar en el plan gratuito

---

## 📝 Notas Importantes

### Plan Gratuito de Render

✅ **Ventajas:**
- Completamente gratis
- SSL/HTTPS incluido
- Deploy automático desde GitHub

⚠️ **Limitaciones:**
- Servicios se "duermen" después de 15 min de inactividad
- Primer request después de dormir tarda ~30 segundos
- Base de datos gratuita tiene 90 días de retención
- Builds pueden tardar más que en planes de pago

### URLs de tus Servicios

- **Backend**: `https://ferreteria-backend.onrender.com`
- **Frontend**: `https://ferreteria-frontend.onrender.com`
- **Base de datos**: Solo accesible internamente (no tiene URL pública)

### Actualizaciones Automáticas

- Cada vez que hagas `git push` a GitHub, Render desplegará automáticamente
- Puedes desactivar el auto-deploy en la configuración del servicio
- Los builds se ejecutan automáticamente

### Variables de Entorno Importantes

**Backend:**
- `DATABASE_URL`: URL interna de PostgreSQL
- `JWT_SECRET`: Secreto para tokens JWT (genera uno seguro)
- `CORS_ORIGINS`: URLs permitidas para CORS

**Frontend:**
- `NEXT_PUBLIC_API_BASE`: URL completa del backend
- `NEXT_PUBLIC_API_PREFIX`: Prefijo de la API (`/api/v1`)

---

## 🎉 ¡Listo!

Tu sistema debería estar funcionando en:
- 🌐 Frontend: `https://ferreteria-frontend.onrender.com`
- 🔧 Backend: `https://ferreteria-backend.onrender.com`
- 💾 Base de datos: Interna (solo accesible desde el backend)

Si tienes problemas, revisa los logs en Render Dashboard → Logs de cada servicio.

---

## 📞 Próximos Pasos

1. ✅ Verifica que todo funcione
2. ✅ Prueba login/registro
3. ✅ Prueba las funcionalidades principales
4. ✅ (Opcional) Configura un dominio personalizado
5. ✅ (Opcional) Configura monitoreo y alertas

¡Felicitaciones! 🎊 Tu sistema está en producción.


# Guía de Despliegue en Render

Esta guía te ayudará a desplegar tu sistema completo (Backend, Frontend y Base de Datos) en Render de forma gratuita.

## 📋 Requisitos Previos

1. Cuenta en GitHub (gratis)
2. Cuenta en Render (gratis en https://render.com)
3. Tu código subido a un repositorio de GitHub

## 🚀 Pasos para Desplegar

### Paso 1: Preparar el Repositorio

1. Asegúrate de que todo tu código esté en GitHub
2. Verifica que el archivo `render.yaml` esté en la raíz del repositorio

### Paso 2: Crear Base de Datos PostgreSQL

1. Ve a https://dashboard.render.com
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `ferreteria-db`
   - **Database**: `ferreteria`
   - **User**: `ferreteria_user`
   - **PostgreSQL Version**: `15`
   - **Plan**: `Free`
4. Click en **"Create Database"**
5. **IMPORTANTE**: Guarda la **Internal Database URL** que aparece (la necesitarás después)

### Paso 3: Desplegar Backend (FastAPI)

1. En Render Dashboard, click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name**: `ferreteria-backend`
   - **Environment**: `Docker`
   - **Region**: Elige el más cercano a tus usuarios
   - **Branch**: `main` (o la rama que uses)
   - **Root Directory**: `backend` (deja vacío si render.yaml está en la raíz)
   - **Dockerfile Path**: `backend/Dockerfile.render`
   - **Docker Context**: `backend`
4. En **Environment Variables**, agrega:
   ```
   DATABASE_URL = [Pega la Internal Database URL del paso 2]
   JWT_SECRET = [Genera uno aleatorio, ej: openssl rand -hex 32]
   CORS_ORIGINS = ["*"]
   APP_ENV = production
   API_PREFIX = /api
   ACCESS_TOKEN_EXPIRE_MINUTES = 30
   REFRESH_TOKEN_EXPIRE_MINUTES = 43200
   ```
5. Click en **"Create Web Service"**
6. Espera a que el build termine (puede tardar 5-10 minutos)

### Paso 4: Ejecutar Migraciones de Base de Datos

Una vez que el backend esté desplegado:

1. Ve a tu servicio backend en Render
2. Click en **"Shell"** (en la parte superior)
3. Ejecuta:
   ```bash
   cd /app
   alembic upgrade head
   ```
4. Si necesitas datos iniciales, puedes ejecutar:
   ```bash
   python scripts/seed.py
   ```

### Paso 5: Desplegar Frontend (Next.js)

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
   (Reemplaza `ferreteria-backend` con el nombre real de tu servicio backend)
5. Click en **"Create Web Service"**
6. Espera a que el build termine

### Paso 6: Actualizar CORS en Backend

1. Ve a tu servicio backend en Render
2. Click en **"Environment"**
3. Actualiza `CORS_ORIGINS` con la URL de tu frontend:
   ```
   CORS_ORIGINS = ["https://ferreteria-frontend.onrender.com"]
   ```
   (Reemplaza con la URL real de tu frontend)
4. Guarda los cambios (esto reiniciará el servicio)

### Paso 7: Verificar que Todo Funcione

1. Visita la URL de tu frontend: `https://ferreteria-frontend.onrender.com`
2. Prueba hacer login/registro
3. Verifica que las peticiones al backend funcionen

## 🔧 Solución de Problemas

### El backend no inicia
- Verifica que `DATABASE_URL` esté correctamente configurada
- Revisa los logs en Render Dashboard → Logs
- Asegúrate de que el Dockerfile.render esté correcto

### El frontend no se conecta al backend
- Verifica que `NEXT_PUBLIC_API_BASE` apunte a la URL correcta del backend
- Revisa la configuración de CORS en el backend
- Verifica que el backend esté funcionando visitando: `https://tu-backend.onrender.com/api/v1/health`

### Error de base de datos
- Verifica que las migraciones se hayan ejecutado
- Revisa que `DATABASE_URL` use la **Internal Database URL** (no la externa)

## 📝 Notas Importantes

1. **Plan Gratuito de Render**:
   - Los servicios se "duermen" después de 15 minutos de inactividad
   - El primer request después de dormir puede tardar ~30 segundos
   - La base de datos gratuita tiene 90 días de retención

2. **URLs**:
   - Backend: `https://ferreteria-backend.onrender.com`
   - Frontend: `https://ferreteria-frontend.onrender.com`
   - Base de datos: Solo accesible internamente

3. **Actualizaciones**:
   - Cada vez que hagas push a GitHub, Render desplegará automáticamente
   - Puedes desactivar el auto-deploy en la configuración del servicio

## 🎉 ¡Listo!

Tu sistema debería estar funcionando. Si tienes problemas, revisa los logs en Render Dashboard.


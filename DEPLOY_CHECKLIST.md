# ✅ Checklist de Despliegue en Render

Usa esta lista para asegurarte de que todo esté configurado correctamente antes y después del despliegue.

## Antes de Desplegar

### Repositorio GitHub
- [ ] Todo el código está subido a GitHub
- [ ] El archivo `render.yaml` está en la raíz del repositorio
- [ ] El archivo `backend/Dockerfile.render` existe y está actualizado

### Variables de Entorno - Backend
- [ ] `DATABASE_URL` - Se configurará automáticamente desde la base de datos
- [ ] `JWT_SECRET` - Se generará automáticamente
- [ ] `CORS_ORIGINS` - Configurado para permitir el frontend
- [ ] `APP_ENV` = `production`
- [ ] `API_PREFIX` = `/api`

### Variables de Entorno - Frontend
- [ ] `NEXT_PUBLIC_API_BASE` - URL del backend en Render
- [ ] `NEXT_PUBLIC_API_PREFIX` = `/api/v1`

## Durante el Despliegue

### Base de Datos
- [ ] Base de datos PostgreSQL creada en Render
- [ ] Nombre: `ferreteria-db`
- [ ] Plan: Free
- [ ] Internal Database URL guardada

### Backend
- [ ] Servicio web creado con Docker
- [ ] Dockerfile: `backend/Dockerfile.render`
- [ ] Context: `backend`
- [ ] Health check path: `/api/v1/health`
- [ ] Build completado sin errores
- [ ] Servicio está "Live" (verde)

### Frontend
- [ ] Servicio web creado con Node
- [ ] Root directory: `frontend`
- [ ] Build command: `cd frontend && npm install && npm run build`
- [ ] Start command: `cd frontend && npm start`
- [ ] Build completado sin errores
- [ ] Servicio está "Live" (verde)

## Después del Despliegue

### Migraciones
- [ ] Conectado al shell del backend
- [ ] Ejecutado: `alembic upgrade head`
- [ ] Migraciones aplicadas correctamente
- [ ] (Opcional) Datos iniciales cargados con `python scripts/seed.py`

### Verificaciones
- [ ] Backend responde en: `https://ferreteria-backend.onrender.com/api/v1/health`
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Las peticiones API funcionan desde el frontend
- [ ] CORS configurado correctamente

### URLs Finales
- [ ] Backend URL: `https://ferreteria-backend.onrender.com`
- [ ] Frontend URL: `https://ferreteria-frontend.onrender.com`
- [ ] URLs guardadas para referencia

## Problemas Comunes

### Backend no inicia
- [ ] Verificar logs en Render Dashboard
- [ ] Verificar que DATABASE_URL esté correcta
- [ ] Verificar que el Dockerfile.render esté correcto
- [ ] Verificar que todas las dependencias estén en requirements.txt

### Frontend no se conecta al backend
- [ ] Verificar NEXT_PUBLIC_API_BASE en variables de entorno
- [ ] Verificar CORS_ORIGINS en el backend
- [ ] Verificar que el backend esté funcionando
- [ ] Revisar la consola del navegador para errores

### Error de base de datos
- [ ] Verificar que DATABASE_URL use Internal Database URL
- [ ] Verificar que las migraciones se hayan ejecutado
- [ ] Verificar que la base de datos esté activa

## Notas

- Los servicios gratuitos se "duermen" después de 15 minutos de inactividad
- El primer request después de dormir puede tardar ~30 segundos
- La base de datos gratuita tiene 90 días de retención
- Cada push a GitHub desplegará automáticamente (puedes desactivarlo)


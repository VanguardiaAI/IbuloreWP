# 📝 API de Comentarios del Blog - Configuración y Uso

## 🎯 Descripción

Esta API proporciona funcionalidades completas para gestionar comentarios del blog de WordPress desde el panel de administración de IbuloreWP. Incluye operaciones CRUD, gestión de estados, respuestas y acciones masivas.

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# WordPress/WooCommerce Configuration
WC_STORE_URL=https://tu-sitio-wordpress.com
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WordPress API Authentication (para comentarios y media)
WP_USER_LOGIN=tu_usuario_admin
WP_APPLICATION_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# Flask Configuration
FLASK_DEBUG=True
```

### 2. Configuración de WordPress

#### Crear Application Password:
1. Ve a tu WordPress Admin → Usuarios → Tu Perfil
2. Baja hasta "Application Passwords"
3. Crea una nueva contraseña con nombre "IbuloreWP Backend"
4. Copia la contraseña generada (formato: xxxx xxxx xxxx xxxx xxxx xxxx)
5. Úsala en `WP_APPLICATION_PASSWORD`

#### Permisos Requeridos:
- El usuario debe tener permisos de `Administrator` o `Editor`
- WordPress debe tener la API REST habilitada (por defecto está habilitada)

### 3. Instalación de Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 4. Iniciar el Servidor

```bash
cd backend
python app.py
```

El servidor estará disponible en `http://localhost:5001`

## 📚 Endpoints Disponibles

### 🔍 Obtener Comentarios

```http
GET /api/blog/comments
```

**Parámetros de consulta:**
- `page` (int): Página (default: 1)
- `per_page` (int): Comentarios por página (default: 20, max: 100)
- `search` (string): Buscar en contenido y autor
- `status` (string): `approved`, `hold`, `spam`, `trash`
- `post` (int): ID del post
- `_embed` (boolean): Incluir datos relacionados
- `order` (string): `asc`, `desc` (default: desc)
- `orderby` (string): `date`, `author`, etc. (default: date)

**Respuesta:**
```json
{
  "comments": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### 🔍 Obtener Comentario Específico

```http
GET /api/blog/comments/{comment_id}
```

**Parámetros:**
- `_embed` (boolean): Incluir datos relacionados

### 📊 Obtener Contadores por Estado

```http
GET /api/blog/comments/counts
```

**Respuesta:**
```json
{
  "approved": 45,
  "hold": 12,
  "spam": 3,
  "trash": 1,
  "total": 61
}
```

### ✅ Aprobar Comentario

```http
POST /api/blog/comments/{comment_id}/approve
```

### ⏸️ Rechazar Comentario (Marcar como Pendiente)

```http
POST /api/blog/comments/{comment_id}/reject
```

### 🚫 Marcar como Spam

```http
POST /api/blog/comments/{comment_id}/spam
```

### ✏️ Actualizar Comentario

```http
PUT /api/blog/comments/{comment_id}
```

**Body:**
```json
{
  "status": "approved",
  "content": "Contenido actualizado",
  "author_name": "Nuevo nombre",
  "author_email": "nuevo@email.com"
}
```

### 🗑️ Eliminar Comentario

```http
DELETE /api/blog/comments/{comment_id}?force=true
```

**Parámetros:**
- `force` (boolean): Eliminar permanentemente (default: false)

### 💬 Responder a Comentario

```http
POST /api/blog/comments/{comment_id}/replies
```

**Body:**
```json
{
  "content": "Contenido de la respuesta",
  "author_name": "Administrador",
  "author_email": "admin@ibulore.com",
  "author_url": "https://ibulore.com" // opcional
}
```

### 🔄 Acciones Masivas

```http
POST /api/blog/comments/bulk
```

**Body:**
```json
{
  "comment_ids": [1, 2, 3, 4],
  "action": "approve" // approve, hold, spam, trash, delete
}
```

**Respuesta:**
```json
{
  "success": true,
  "processed": 4,
  "successful": 3,
  "failed": 1,
  "results": [...],
  "errors": [...]
}
```

## 🧪 Pruebas

### Ejecutar Script de Pruebas

```bash
cd backend
python test_comments_api.py
```

Este script probará todas las funcionalidades automáticamente.

### Pruebas Manuales con curl

```bash
# Obtener comentarios
curl "http://localhost:5001/api/blog/comments"

# Obtener contadores
curl "http://localhost:5001/api/blog/comments/counts"

# Aprobar comentario
curl -X POST "http://localhost:5001/api/blog/comments/1/approve"

# Responder a comentario
curl -X POST "http://localhost:5001/api/blog/comments/1/replies" \
  -H "Content-Type: application/json" \
  -d '{"content": "Gracias por tu comentario", "author_name": "Admin"}'
```

## 🔒 Seguridad

### Autenticación
- Usa Application Passwords de WordPress (más seguro que contraseñas normales)
- Las credenciales se envían via Basic Auth sobre HTTPS

### Permisos
- Solo usuarios con permisos de administrador pueden gestionar comentarios
- Las respuestas se crean automáticamente como aprobadas

### Validación
- Todos los inputs son validados
- Los IDs de comentarios se verifican antes de las operaciones
- Límites en el número de comentarios por página

## 🐛 Solución de Problemas

### Error: "WordPress API credentials are not fully configured"
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que el archivo `.env` esté en la carpeta `backend/`

### Error: "401 Unauthorized"
- Verifica que el usuario y Application Password sean correctos
- Asegúrate de que el usuario tenga permisos de administrador

### Error: "404 Not Found"
- Verifica que la URL de WordPress sea correcta
- Asegúrate de que WordPress tenga la API REST habilitada

### Error: "Connection refused"
- Verifica que WordPress esté accesible desde el servidor
- Revisa la configuración de firewall/proxy

### No se encuentran comentarios
- Verifica que el blog tenga comentarios publicados
- Revisa los filtros de estado aplicados

## 📈 Monitoreo

### Logs
Los logs se guardan en `backend/app.log` y incluyen:
- Errores de API
- Operaciones exitosas
- Problemas de conectividad

### Métricas
- Tiempo de respuesta de endpoints
- Número de comentarios procesados
- Errores por tipo

## 🚀 Optimizaciones

### Performance
- Usa paginación para grandes volúmenes de comentarios
- Implementa caché para contadores si es necesario
- Considera índices en WordPress para búsquedas frecuentes

### Escalabilidad
- Las acciones masivas procesan comentarios de uno en uno para evitar timeouts
- Límite de 100 comentarios por página para evitar sobrecarga

## 🔄 Integración con Frontend

El frontend en React ya está configurado para usar esta API. Los endpoints coinciden exactamente con las funciones definidas en `frontend/src/lib/api.ts`.

### Estados de Conexión
- El frontend detecta automáticamente si el backend está disponible
- Modo demo disponible cuando el backend no está conectado
- Reconexión automática cuando el backend vuelve a estar disponible

## 📝 Notas Adicionales

- Todas las fechas están en formato ISO 8601
- Los contenidos HTML son manejados automáticamente por WordPress
- Las respuestas mantienen la jerarquía padre-hijo correctamente
- Los contadores se actualizan en tiempo real 
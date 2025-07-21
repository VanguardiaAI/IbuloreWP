# Backend del Blog - IbuloreWP

Este documento describe la implementación del backend para la funcionalidad del blog en IbuloreWP.

## 🚀 Configuración Rápida

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# WooCommerce API Configuration
WC_STORE_URL=https://tu-sitio.com/wp-json/wc/v3/
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WordPress API para Blog (usar Application Password)
WP_USER_LOGIN=tu_usuario_wp
WP_APPLICATION_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# Flask Configuration
FLASK_DEBUG=True
```

### 2. Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 3. Ejecutar el Servidor

```bash
python app.py
```

El servidor se ejecutará en `http://localhost:5001`

### 4. Probar los Endpoints

```bash
python test_blog_api.py
```

## 📁 Archivos Nuevos Agregados

### `utils/wordpress_api.py`
Cliente para conectar con la API REST de WordPress. Maneja:
- Autenticación básica HTTP
- Peticiones GET, POST, PUT, DELETE
- Subida de archivos de media
- Manejo de errores

### `routes/blog.py`
Endpoints del blog que incluyen:
- **Posts**: CRUD completo con filtros y búsqueda
- **Categorías**: Gestión completa de categorías
- **Tags**: Creación y listado de tags
- **Media**: Subida y listado de archivos
- **Comentarios**: Listado y moderación

### `test_blog_api.py`
Script de prueba automatizada que verifica:
- Conexión con WordPress
- Funcionalidad CRUD de posts
- Gestión de categorías y tags
- Acceso a media y comentarios

### `BLOG_API_ENDPOINTS.md`
Documentación completa de todos los endpoints disponibles.

## 🔧 Configuración de WordPress

### Application Password

1. Ve a tu panel de WordPress
2. Navega a **Usuarios > Tu Perfil**
3. Baja hasta **Application Passwords**
4. Crea una nueva contraseña con nombre "IbuloreWP API"
5. Copia la contraseña generada (formato: `xxxx xxxx xxxx xxxx xxxx xxxx`)
6. Úsala en la variable `WP_APPLICATION_PASSWORD`

### Permisos Requeridos

El usuario debe tener permisos para:
- Crear y editar posts
- Gestionar categorías y tags
- Subir archivos de media
- Moderar comentarios

## 🛠️ Endpoints Principales

### Posts
- `GET /api/blog/posts` - Listar posts
- `POST /api/blog/posts` - Crear post
- `GET /api/blog/posts/{id}` - Obtener post específico
- `PUT /api/blog/posts/{id}` - Actualizar post
- `DELETE /api/blog/posts/{id}` - Eliminar post

### Categorías
- `GET /api/blog/categories` - Listar categorías
- `POST /api/blog/categories` - Crear categoría
- `PUT /api/blog/categories/{id}` - Actualizar categoría
- `DELETE /api/blog/categories/{id}` - Eliminar categoría

### Tags
- `GET /api/blog/tags` - Listar tags
- `POST /api/blog/tags` - Crear tag

### Media
- `GET /api/blog/media` - Listar archivos
- `POST /api/blog/media` - Subir archivo

### Comentarios
- `GET /api/blog/comments` - Listar comentarios
- `PUT /api/blog/comments/{id}` - Moderar comentario
- `DELETE /api/blog/comments/{id}` - Eliminar comentario

## 🧪 Pruebas

### Ejecutar Pruebas Automáticas

```bash
python test_blog_api.py
```

### Pruebas Manuales con curl

```bash
# Obtener posts
curl "http://localhost:5001/api/blog/posts?per_page=5"

# Crear post
curl -X POST "http://localhost:5001/api/blog/posts" \
  -H "Content-Type: application/json" \
  -d '{"title": "Mi Post", "content": "<p>Contenido</p>", "status": "draft"}'

# Obtener categorías
curl "http://localhost:5001/api/blog/categories"
```

## 🔍 Solución de Problemas

### Error 500 en endpoints

1. **Verificar credenciales**: Asegúrate de que `WP_USER_LOGIN` y `WP_APPLICATION_PASSWORD` sean correctos
2. **Verificar URL**: La `WC_STORE_URL` debe ser accesible y terminar en `/wp-json/wc/v3/`
3. **Verificar permisos**: El usuario debe tener permisos de editor o administrador
4. **Verificar WordPress**: Asegúrate de que WordPress esté funcionando y la API REST esté habilitada

### Error de conexión

1. **Verificar servidor**: Asegúrate de que Flask esté ejecutándose en el puerto 5001
2. **Verificar CORS**: Los headers CORS están configurados para localhost:3000
3. **Verificar firewall**: Asegúrate de que no haya bloqueos de red

### Error de autenticación

1. **Regenerar Application Password**: Crea una nueva contraseña de aplicación
2. **Verificar formato**: La contraseña debe tener espacios (formato: `xxxx xxxx xxxx xxxx xxxx xxxx`)
3. **Verificar usuario**: Asegúrate de usar el nombre de usuario correcto (no email)

## 📊 Estructura de Datos

### Post
```json
{
  "id": 123,
  "title": {"rendered": "Título"},
  "content": {"rendered": "Contenido HTML"},
  "excerpt": {"rendered": "Extracto"},
  "status": "publish|draft|private",
  "categories": [1, 2],
  "tags": [3, 4],
  "featured_media": 456,
  "date": "2024-01-15T10:30:00",
  "slug": "titulo-del-post"
}
```

### Categoría
```json
{
  "id": 1,
  "name": "Santería",
  "slug": "santeria",
  "description": "Artículos sobre santería",
  "count": 15,
  "parent": 0
}
```

### Tag
```json
{
  "id": 1,
  "name": "Orishas",
  "slug": "orishas",
  "description": "Posts sobre orishas",
  "count": 25
}
```

## 🔄 Integración con Frontend

El frontend en Next.js ya está configurado para usar estos endpoints. Los archivos relevantes son:

- `frontend/src/lib/api.ts` - Cliente API con funciones `blogApi`
- `frontend/src/app/dashboard/blog/` - Páginas del blog
- `frontend/src/components/blog/` - Componentes del blog

## 🚀 Próximos Pasos

1. **Configurar variables de entorno** en tu servidor de producción
2. **Probar endpoints** con el script de prueba
3. **Configurar SSL** para conexiones seguras en producción
4. **Implementar cache** para mejorar rendimiento
5. **Configurar logging** más detallado
6. **Implementar rate limiting** si es necesario

## 📝 Notas Importantes

- Todos los endpoints usan autenticación básica HTTP
- Los errores se devuelven en español
- La paginación sigue el estándar de WordPress
- Los archivos de media se suben directamente a WordPress
- Los posts se crean como borradores por defecto para revisión 
# API Endpoints del Blog - IbuloreWP

Esta documentación describe todos los endpoints disponibles para la funcionalidad del blog en el backend de IbuloreWP.

## Configuración Requerida

Asegúrate de tener las siguientes variables de entorno configuradas en tu archivo `.env`:

```env
WC_STORE_URL=https://tu-sitio.com/wp-json/wc/v3/
WP_USER_LOGIN=tu_usuario_wp
WP_APPLICATION_PASSWORD=tu_password_aplicacion_wp
```

## Posts del Blog

### GET /api/blog/posts
Obtiene una lista de posts del blog.

**Parámetros de consulta:**
- `page` (int): Número de página (default: 1)
- `per_page` (int): Posts por página (default: 20, máximo: 100)
- `search` (string): Buscar en título y contenido
- `status` (string): Estado del post (publish, draft, private, etc.)
- `categories` (string): IDs de categorías separados por coma
- `tags` (string): IDs de tags separados por coma
- `author` (int): ID del autor
- `_embed` (boolean): Incluir datos embebidos (default: false)

**Respuesta:**
```json
{
  "posts": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### GET /api/blog/posts/{id}
Obtiene un post específico por ID.

**Respuesta:**
```json
{
  "id": 123,
  "title": {"rendered": "Título del Post"},
  "content": {"rendered": "Contenido del post..."},
  "excerpt": {"rendered": "Extracto..."},
  "status": "publish",
  "categories": [1, 2],
  "tags": [3, 4, 5],
  "featured_media": 456,
  "date": "2024-01-15T10:30:00",
  "modified": "2024-01-15T11:00:00",
  "slug": "titulo-del-post",
  "meta": {...}
}
```

### POST /api/blog/posts
Crea un nuevo post del blog.

**Body (JSON):**
```json
{
  "title": "Título del Post",
  "content": "Contenido del post en HTML",
  "excerpt": "Extracto del post",
  "status": "draft",
  "categories": [1, 2],
  "tags": [3, 4],
  "slug": "titulo-del-post",
  "featured_media": 456,
  "meta": {
    "seo_title": "Título SEO",
    "seo_description": "Descripción SEO"
  }
}
```

**Respuesta:** Objeto del post creado (201 Created)

### PUT /api/blog/posts/{id}
Actualiza un post existente.

**Body (JSON):** Misma estructura que POST, pero todos los campos son opcionales.

**Respuesta:** Objeto del post actualizado

### DELETE /api/blog/posts/{id}
Elimina un post del blog.

**Parámetros de consulta:**
- `force` (boolean): Eliminar permanentemente (default: false, envía a papelera)

**Respuesta:** Objeto del post eliminado

## Categorías del Blog

### GET /api/blog/categories
Obtiene categorías del blog.

**Parámetros de consulta:**
- `page` (int): Número de página (default: 1)
- `per_page` (int): Categorías por página (default: 100)
- `search` (string): Buscar por nombre
- `hide_empty` (boolean): Ocultar categorías vacías (default: false)

**Respuesta:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Santería",
      "slug": "santeria",
      "description": "Artículos sobre santería yoruba",
      "count": 15,
      "parent": 0
    }
  ],
  "pagination": {...}
}
```

### POST /api/blog/categories
Crea una nueva categoría.

**Body (JSON):**
```json
{
  "name": "Nueva Categoría",
  "description": "Descripción de la categoría",
  "slug": "nueva-categoria",
  "parent": 0
}
```

### PUT /api/blog/categories/{id}
Actualiza una categoría existente.

### DELETE /api/blog/categories/{id}
Elimina una categoría.

## Tags del Blog

### GET /api/blog/tags
Obtiene tags del blog.

**Parámetros similares a categorías**

**Respuesta:**
```json
{
  "tags": [
    {
      "id": 1,
      "name": "Orishas",
      "slug": "orishas",
      "description": "Posts sobre orishas",
      "count": 25
    }
  ],
  "pagination": {...}
}
```

### POST /api/blog/tags
Crea un nuevo tag.

**Body (JSON):**
```json
{
  "name": "Nuevo Tag",
  "description": "Descripción del tag",
  "slug": "nuevo-tag"
}
```

## Media/Archivos

### POST /api/blog/media
Sube un archivo de media a WordPress.

**Body (multipart/form-data):**
- `file`: Archivo a subir
- `alt_text`: Texto alternativo (opcional)

**Respuesta:**
```json
{
  "id": 456,
  "title": {"rendered": "nombre-archivo.jpg"},
  "source_url": "https://tu-sitio.com/wp-content/uploads/2024/01/archivo.jpg",
  "alt_text": "Texto alternativo",
  "media_type": "image",
  "mime_type": "image/jpeg"
}
```

### GET /api/blog/media
Obtiene archivos de media.

**Parámetros de consulta:**
- `page`, `per_page`: Paginación
- `media_type`: Tipo de media (image, video, audio, etc.)
- `mime_type`: Tipo MIME específico

## Comentarios

### GET /api/blog/comments
Obtiene comentarios del blog.

**Parámetros de consulta:**
- `page`, `per_page`: Paginación
- `search`: Buscar en contenido
- `status`: Estado del comentario (approved, pending, spam, trash)
- `post`: ID del post

**Respuesta:**
```json
{
  "comments": [
    {
      "id": 789,
      "post": 123,
      "author_name": "Juan Pérez",
      "author_email": "juan@example.com",
      "content": {"rendered": "Excelente artículo!"},
      "date": "2024-01-15T12:00:00",
      "status": "approved"
    }
  ],
  "pagination": {...}
}
```

### PUT /api/blog/comments/{id}
Actualiza un comentario (principalmente para moderar).

**Body (JSON):**
```json
{
  "status": "approved",
  "content": "Contenido editado del comentario"
}
```

### DELETE /api/blog/comments/{id}
Elimina un comentario.

**Parámetros de consulta:**
- `force` (boolean): Eliminar permanentemente

## Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Datos inválidos o faltantes
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

## Manejo de Errores

Todos los endpoints devuelven errores en el siguiente formato:

```json
{
  "error": "Descripción del error en español"
}
```

## Autenticación

La API utiliza autenticación básica HTTP con las credenciales de WordPress configuradas en las variables de entorno `WP_USER_LOGIN` y `WP_APPLICATION_PASSWORD`.

## Consideraciones Especiales para Santería Yoruba

### Categorías Sugeridas
- Orishas
- Rituales
- Ceremonias
- Historia
- Tradiciones
- Consejos Espirituales

### Tags Comunes
- Elegguá, Obatalá, Yemayá, Changó, Oshún, Oyá, etc.
- Ebó, Addimú, Rogación
- Caracoles, Diloggun
- Ifá, Babalawo, Santero

### Meta Fields SEO Recomendados
```json
{
  "meta": {
    "seo_title": "Título optimizado para SEO",
    "seo_description": "Descripción meta de 150-160 caracteres",
    "og_title": "Título para Open Graph",
    "og_description": "Descripción para redes sociales",
    "og_image": "URL de imagen para compartir",
    "twitter_title": "Título para Twitter",
    "twitter_description": "Descripción para Twitter",
    "twitter_image": "URL de imagen para Twitter"
  }
}
```

## Próximos Pasos

1. Configurar las variables de entorno en el servidor
2. Probar los endpoints con herramientas como Postman
3. Implementar validaciones adicionales según necesidades
4. Agregar logging más detallado
5. Implementar cache para mejorar rendimiento
6. Configurar límites de rate limiting si es necesario 
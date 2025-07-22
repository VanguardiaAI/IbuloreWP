from flask import Blueprint, jsonify, request
from utils.wordpress_api import get_wp_api
from config import Config
import math
import requests
import json
from werkzeug.utils import secure_filename
from requests.auth import HTTPBasicAuth

blog_bp = Blueprint('blog_bp', __name__)

# ==================== POSTS ====================

@blog_bp.route('/blog/posts', methods=['GET'])
def get_posts():
    """
    Obtiene posts del blog desde WordPress.
    """
    try:
        wp_api = get_wp_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search')
        status = request.args.get('status')
        categories = request.args.get('categories')
        tags = request.args.get('tags')
        author = request.args.get('author')
        embed = request.args.get('_embed', 'false').lower() == 'true'
        
        # Construir parámetros para WordPress
        params = {
            'page': page,
            'per_page': min(per_page, 100),  # Limitar a 100 por página
            'orderby': 'date',
            'order': 'desc'
        }
        
        if search:
            params['search'] = search
        
        if status:
            params['status'] = status
        else:
            # Si no se especifica estado, mostrar todos los estados en el admin
            params['status'] = 'any'
        
        if categories:
            params['categories'] = categories
        
        if tags:
            params['tags'] = tags
        
        if author:
            params['author'] = author
        
        if embed:
            params['_embed'] = 'true'
        
        response = wp_api.get('posts', params=params)
        posts = response.json()
        
        # Obtener información de paginación de los headers
        total = int(response.headers.get('X-WP-Total', 0))
        total_pages = int(response.headers.get('X-WP-TotalPages', 1))
        
        return jsonify({
            'posts': posts,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages
            }
        })
        
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return jsonify({"error": "Error al obtener los posts"}), 500

@blog_bp.route('/blog/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """
    Obtiene un post específico del blog.
    """
    try:
        wp_api = get_wp_api()
        response = wp_api.get(f'posts/{post_id}', params={'_embed': 'true'})
        post = response.json()
        return jsonify(post)
        
    except Exception as e:
        print(f"Error fetching post {post_id}: {e}")
        return jsonify({"error": "Error al obtener el post"}), 500

@blog_bp.route('/blog/posts', methods=['POST'])
def create_post():
    """
    Crea un nuevo post del blog.
    """
    try:
        post_data = request.get_json()
        if not post_data:
            return jsonify({"error": "No se proporcionaron datos del post"}), 400
        
        # Validar campos requeridos
        if not post_data.get('title'):
            return jsonify({"error": "El título es obligatorio"}), 400
        
        wp_api = get_wp_api()
        
        # Preparar datos para WordPress
        wp_post_data = {
            'title': post_data['title'],
            'content': post_data.get('content', ''),
            'excerpt': post_data.get('excerpt', ''),
            'status': post_data.get('status', 'draft'),
            'categories': post_data.get('categories', []),
            'tags': post_data.get('tags', [])
        }
        
        if post_data.get('slug'):
            wp_post_data['slug'] = post_data['slug']
        
        if post_data.get('featured_media'):
            wp_post_data['featured_media'] = post_data['featured_media']
        
        # Agregar meta fields para SEO si están presentes
        if post_data.get('meta'):
            wp_post_data['meta'] = post_data['meta']
        
        response = wp_api.post('posts', wp_post_data)
        new_post = response.json()
        
        return jsonify(new_post), 201
        
    except Exception as e:
        print(f"Error creating post: {e}")
        return jsonify({"error": "Error al crear el post"}), 500

@blog_bp.route('/blog/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """
    Actualiza un post existente del blog.
    """
    try:
        post_data = request.get_json()
        if not post_data:
            return jsonify({"error": "No se proporcionaron datos del post"}), 400
        
        wp_api = get_wp_api()
        
        # Preparar datos para WordPress
        wp_post_data = {}
        
        if 'title' in post_data:
            wp_post_data['title'] = post_data['title']
        
        if 'content' in post_data:
            wp_post_data['content'] = post_data['content']
        
        if 'excerpt' in post_data:
            wp_post_data['excerpt'] = post_data['excerpt']
        
        if 'status' in post_data:
            wp_post_data['status'] = post_data['status']
        
        if 'categories' in post_data:
            wp_post_data['categories'] = post_data['categories']
        
        if 'tags' in post_data:
            wp_post_data['tags'] = post_data['tags']
        
        if 'slug' in post_data:
            wp_post_data['slug'] = post_data['slug']
        
        if 'featured_media' in post_data:
            wp_post_data['featured_media'] = post_data['featured_media']
        
        if 'meta' in post_data:
            wp_post_data['meta'] = post_data['meta']
        
        response = wp_api.put(f'posts/{post_id}', wp_post_data)
        updated_post = response.json()
        
        return jsonify(updated_post)
        
    except Exception as e:
        print(f"Error updating post {post_id}: {e}")
        return jsonify({"error": "Error al actualizar el post"}), 500

@blog_bp.route('/blog/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """
    Elimina un post del blog.
    """
    try:
        force = request.args.get('force', 'false').lower() == 'true'
        
        wp_api = get_wp_api()
        params = {'force': force} if force else {}
        
        response = wp_api.delete(f'posts/{post_id}', params=params)
        deleted_post = response.json()
        
        return jsonify(deleted_post)
        
    except Exception as e:
        print(f"Error deleting post {post_id}: {e}")
        return jsonify({"error": "Error al eliminar el post"}), 500

# ==================== CATEGORÍAS ====================

@blog_bp.route('/blog/categories', methods=['GET'])
def get_categories():
    """
    Obtiene categorías del blog desde WordPress.
    """
    try:
        wp_api = get_wp_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        search = request.args.get('search')
        hide_empty = request.args.get('hide_empty', 'false').lower() == 'true'
        
        params = {
            'page': page,
            'per_page': min(per_page, 100),
            'orderby': 'name',
            'order': 'asc'
        }
        
        if search:
            params['search'] = search
        
        if hide_empty:
            params['hide_empty'] = 'true'
        
        response = wp_api.get('categories', params=params)
        categories = response.json()
        
        # Obtener información de paginación
        total = int(response.headers.get('X-WP-Total', 0))
        total_pages = int(response.headers.get('X-WP-TotalPages', 1))
        
        return jsonify({
            'categories': categories,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages
            }
        })
        
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return jsonify({"error": "Error al obtener las categorías"}), 500

@blog_bp.route('/blog/categories', methods=['POST'])
def create_category():
    """
    Crea una nueva categoría del blog.
    """
    try:
        category_data = request.get_json()
        if not category_data:
            return jsonify({"error": "No se proporcionaron datos de la categoría"}), 400
        
        if not category_data.get('name'):
            return jsonify({"error": "El nombre es obligatorio"}), 400
        
        wp_api = get_wp_api()
        
        wp_category_data = {
            'name': category_data['name']
        }
        
        if category_data.get('description'):
            wp_category_data['description'] = category_data['description']
        
        if category_data.get('slug'):
            wp_category_data['slug'] = category_data['slug']
        
        if category_data.get('parent'):
            wp_category_data['parent'] = category_data['parent']
        
        response = wp_api.post('categories', wp_category_data)
        new_category = response.json()
        
        return jsonify(new_category), 201
        
    except Exception as e:
        print(f"Error creating category: {e}")
        return jsonify({"error": "Error al crear la categoría"}), 500

@blog_bp.route('/blog/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """
    Actualiza una categoría existente.
    """
    try:
        category_data = request.get_json()
        if not category_data:
            return jsonify({"error": "No se proporcionaron datos de la categoría"}), 400
        
        wp_api = get_wp_api()
        
        wp_category_data = {}
        
        if 'name' in category_data:
            wp_category_data['name'] = category_data['name']
        
        if 'description' in category_data:
            wp_category_data['description'] = category_data['description']
        
        if 'slug' in category_data:
            wp_category_data['slug'] = category_data['slug']
        
        if 'parent' in category_data:
            wp_category_data['parent'] = category_data['parent']
        
        response = wp_api.put(f'categories/{category_id}', wp_category_data)
        updated_category = response.json()
        
        return jsonify(updated_category)
        
    except Exception as e:
        print(f"Error updating category {category_id}: {e}")
        return jsonify({"error": "Error al actualizar la categoría"}), 500

@blog_bp.route('/blog/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """
    Elimina una categoría del blog.
    """
    try:
        force = request.args.get('force', 'false').lower() == 'true'
        
        wp_api = get_wp_api()
        params = {'force': force} if force else {}
        
        response = wp_api.delete(f'categories/{category_id}', params=params)
        
        # Verificar si la respuesta es exitosa
        if response.status_code == 200:
            deleted_category = response.json()
            return jsonify(deleted_category)
        else:
            # Manejar errores específicos de WordPress
            error_data = response.json()
            error_code = error_data.get('code', 'unknown_error')
            error_message = error_data.get('message', 'Error desconocido')
            
            if error_code == 'rest_trash_not_supported':
                return jsonify({
                    "error": "Las categorías no se pueden enviar a la papelera. Use force=true para eliminar permanentemente.",
                    "code": error_code,
                    "suggestion": "force_required"
                }), 400
            elif error_code == 'rest_cannot_delete':
                return jsonify({
                    "error": "No se puede eliminar esta categoría. Puede tener posts asignados o ser una categoría padre.",
                    "code": error_code,
                    "suggestion": "check_dependencies"
                }), 400
            else:
                return jsonify({
                    "error": error_message,
                    "code": error_code
                }), response.status_code
        
    except Exception as e:
        print(f"Error deleting category {category_id}: {e}")
        return jsonify({"error": "Error al eliminar la categoría"}), 500

# ==================== TAGS ====================

@blog_bp.route('/blog/tags', methods=['GET'])
def get_tags():
    """
    Obtiene tags del blog desde WordPress.
    """
    try:
        wp_api = get_wp_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        search = request.args.get('search')
        hide_empty = request.args.get('hide_empty', 'false').lower() == 'true'
        
        params = {
            'page': page,
            'per_page': min(per_page, 100),
            'orderby': 'name',
            'order': 'asc'
        }
        
        if search:
            params['search'] = search
        
        if hide_empty:
            params['hide_empty'] = 'true'
        
        response = wp_api.get('tags', params=params)
        tags = response.json()
        
        # Obtener información de paginación
        total = int(response.headers.get('X-WP-Total', 0))
        total_pages = int(response.headers.get('X-WP-TotalPages', 1))
        
        return jsonify({
            'tags': tags,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages
            }
        })
        
    except Exception as e:
        print(f"Error fetching tags: {e}")
        return jsonify({"error": "Error al obtener los tags"}), 500

@blog_bp.route('/blog/tags', methods=['POST'])
def create_tag():
    """
    Crea un nuevo tag del blog.
    """
    try:
        tag_data = request.get_json()
        if not tag_data:
            return jsonify({"error": "No se proporcionaron datos del tag"}), 400
        
        if not tag_data.get('name'):
            return jsonify({"error": "El nombre es obligatorio"}), 400
        
        wp_api = get_wp_api()
        
        wp_tag_data = {
            'name': tag_data['name']
        }
        
        if tag_data.get('description'):
            wp_tag_data['description'] = tag_data['description']
        
        if tag_data.get('slug'):
            wp_tag_data['slug'] = tag_data['slug']
        
        response = wp_api.post('tags', wp_tag_data)
        new_tag = response.json()
        
        return jsonify(new_tag), 201
        
    except Exception as e:
        print(f"Error creating tag: {e}")
        return jsonify({"error": "Error al crear el tag"}), 500

# ==================== MEDIA ====================

@blog_bp.route('/blog/media', methods=['POST'])
def upload_media():
    """
    Sube un archivo de media a WordPress usando el mismo método que productos.
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No se proporcionó ningún archivo"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No se seleccionó ningún archivo"}), 400
        
        alt_text = request.form.get('alt_text', '')
        
        # Usar el mismo método que funciona para productos
        filename = secure_filename(file.filename)
        
        # Construir la URL base desde WC_STORE_URL
        if '/wp-json/wc/v3' in Config.WC_STORE_URL:
            wp_base_url = Config.WC_STORE_URL.split('/wp-json/wc/v3')[0]
        else:
            wp_base_url = Config.WC_STORE_URL.rstrip('/')
        
        media_endpoint = f"{wp_base_url}/wp-json/wp/v2/media"
        
        # Usar las credenciales de WordPress
        if Config.WP_USER_LOGIN and Config.WP_APPLICATION_PASSWORD:
            auth = HTTPBasicAuth(Config.WP_USER_LOGIN, Config.WP_APPLICATION_PASSWORD)
        else:
            auth = HTTPBasicAuth(Config.WC_CONSUMER_KEY, Config.WC_CONSUMER_SECRET)
            print("WARN: Using WC API keys for media upload.")

        # Establecer la cabecera del nombre del archivo
        headers = {
            'Content-Disposition': f'attachment; filename={filename}'
        }
        
        if alt_text:
            headers['Content-Description'] = alt_text

        print(f"Uploading media: {filename} to {media_endpoint}")

        # Enviar el archivo usando el parámetro `files` para multipart/form-data
        response = requests.post(
            media_endpoint, 
            headers=headers,
            files={'file': (filename, file.stream, file.mimetype)},
            auth=auth,
            timeout=30
        )
        
        print(f"WP Media API Response Status: {response.status_code}")
        print(f"WP Media API Response Body: {response.text}")

        if not response.ok:
            error_data = response.json() if response.content else {"error": "No response content"}
            print(f"Error uploading media: {error_data}")
            return jsonify({"error": f"Error al subir el archivo: {error_data.get('message', 'Error desconocido')}"}), response.status_code

        uploaded_image_data = response.json()
        
        # Comprobar si la subida falló silenciosamente
        if not uploaded_image_data.get('id'):
            error_msg = uploaded_image_data.get('message', 'WordPress returned null data after upload.')
            print(f"ERROR: Silent failure from WordPress: {error_msg}")
            return jsonify({"error": error_msg}), 500

        print(f"Successfully uploaded media: ID {uploaded_image_data.get('id')}")
        
        return jsonify(uploaded_image_data), 201
        
    except Exception as e:
        print(f"Error uploading media: {e}")
        return jsonify({"error": "Error al subir el archivo"}), 500

@blog_bp.route('/blog/media', methods=['GET'])
def get_media():
    """
    Obtiene archivos de media desde WordPress.
    """
    try:
        wp_api = get_wp_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        media_type = request.args.get('media_type')
        mime_type = request.args.get('mime_type')
        
        params = {
            'page': page,
            'per_page': min(per_page, 100),
            'orderby': 'date',
            'order': 'desc'
        }
        
        if media_type:
            params['media_type'] = media_type
        
        if mime_type:
            params['mime_type'] = mime_type
        
        response = wp_api.get('media', params=params)
        media = response.json()
        
        # Obtener información de paginación
        total = int(response.headers.get('X-WP-Total', 0))
        total_pages = int(response.headers.get('X-WP-TotalPages', 1))
        
        return jsonify({
            'media': media,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages
            }
        })
        
    except Exception as e:
        print(f"Error fetching media: {e}")
        return jsonify({"error": "Error al obtener los archivos de media"}), 500

@blog_bp.route('/blog/media/<int:media_id>', methods=['GET'])
def get_media_by_id(media_id):
    """
    Obtiene un archivo de media específico por su ID.
    """
    try:
        wp_api = get_wp_api()
        response = wp_api.get(f'media/{media_id}')
        media = response.json()
        return jsonify(media)
        
    except Exception as e:
        print(f"Error fetching media {media_id}: {e}")
        return jsonify({"error": "Error al obtener el archivo de media"}), 500

# ==================== COMENTARIOS ====================

@blog_bp.route('/blog/comments', methods=['GET'])
def get_comments():
    """
    Obtiene comentarios del blog desde WordPress.
    """
    try:
        wp_api = get_wp_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search')
        status = request.args.get('status')
        post = request.args.get('post')
        embed = request.args.get('_embed', 'false').lower() == 'true'
        order = request.args.get('order', 'desc')
        orderby = request.args.get('orderby', 'date')
        
        # Si no se especifica estado o es "all", obtener comentarios de todos los estados
        if not status or status == 'all':
            all_comments = []
            # WordPress usa 'approve' para comentarios aprobados, no 'approved'
            statuses = ['approve', 'hold', 'spam', 'trash']
            
            for state in statuses:
                try:
                    params = {
                        'status': state,
                        'per_page': 100,  # Obtener muchos para luego paginar
                        'orderby': orderby,
                        'order': order
                    }
                    
                    if search:
                        params['search'] = search
                    
                    if post:
                        params['post'] = post
                    
                    if embed:
                        params['_embed'] = 'true'
                    
                    response = wp_api.get('comments', params=params)
                    comments = response.json()
                    all_comments.extend(comments)
                    
                except Exception as e:
                    print(f"Error fetching comments for status {state}: {e}")
                    continue
            
            # Ordenar todos los comentarios por fecha
            if orderby == 'date':
                all_comments.sort(key=lambda x: x.get('date', ''), reverse=(order == 'desc'))
            elif orderby == 'id':
                all_comments.sort(key=lambda x: x.get('id', 0), reverse=(order == 'desc'))
            
            # Aplicar paginación manual
            total = len(all_comments)
            start_index = (page - 1) * per_page
            end_index = start_index + per_page
            paginated_comments = all_comments[start_index:end_index]
            total_pages = (total + per_page - 1) // per_page
            
            return jsonify({
                'comments': paginated_comments,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'total_pages': total_pages
                }
            })
        
        else:
            # Estado específico - usar la lógica original
            # Convertir 'approved' a 'approve' para WordPress
            wp_status = 'approve' if status == 'approved' else status
            
            params = {
                'page': page,
                'per_page': min(per_page, 100),
                'orderby': orderby,
                'order': order,
                'status': wp_status
            }
            
            if search:
                params['search'] = search
            
            if post:
                params['post'] = post
            
            if embed:
                params['_embed'] = 'true'
            
            response = wp_api.get('comments', params=params)
            comments = response.json()
            
            # Obtener información de paginación
            total = int(response.headers.get('X-WP-Total', 0))
            total_pages = int(response.headers.get('X-WP-TotalPages', 1))
            
            return jsonify({
                'comments': comments,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'total_pages': total_pages
                }
            })
        
    except Exception as e:
        print(f"Error fetching comments: {e}")
        return jsonify({"error": "Error al obtener los comentarios"}), 500

@blog_bp.route('/blog/comments/<int:comment_id>', methods=['PUT'])
def update_comment(comment_id):
    """
    Actualiza un comentario (principalmente para cambiar el estado).
    """
    try:
        comment_data = request.get_json()
        if not comment_data:
            return jsonify({"error": "No se proporcionaron datos del comentario"}), 400
        
        wp_api = get_wp_api()
        
        wp_comment_data = {}
        
        if 'status' in comment_data:
            wp_comment_data['status'] = comment_data['status']
        
        if 'content' in comment_data:
            wp_comment_data['content'] = comment_data['content']
        
        response = wp_api.put(f'comments/{comment_id}', wp_comment_data)
        updated_comment = response.json()
        
        return jsonify(updated_comment)
        
    except Exception as e:
        print(f"Error updating comment {comment_id}: {e}")
        return jsonify({"error": "Error al actualizar el comentario"}), 500

@blog_bp.route('/blog/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    """
    Elimina un comentario del blog.
    """
    try:
        force = request.args.get('force', 'false').lower() == 'true'
        
        wp_api = get_wp_api()
        params = {'force': force} if force else {}
        
        response = wp_api.delete(f'comments/{comment_id}', params=params)
        deleted_comment = response.json()
        
        return jsonify(deleted_comment)
        
    except Exception as e:
        print(f"Error deleting comment {comment_id}: {e}")
        return jsonify({"error": "Error al eliminar el comentario"}), 500

@blog_bp.route('/blog/comments/<int:comment_id>', methods=['GET'])
def get_comment(comment_id):
    """
    Obtiene un comentario específico del blog.
    """
    try:
        wp_api = get_wp_api()
        embed = request.args.get('_embed', 'false').lower() == 'true'
        
        params = {}
        if embed:
            params['_embed'] = 'true'
        
        response = wp_api.get(f'comments/{comment_id}', params=params)
        comment = response.json()
        
        return jsonify(comment)
        
    except Exception as e:
        print(f"Error fetching comment {comment_id}: {e}")
        return jsonify({"error": "Error al obtener el comentario"}), 500

@blog_bp.route('/blog/comments/<int:comment_id>/approve', methods=['POST'])
def approve_comment(comment_id):
    """
    Aprueba un comentario (cambia el estado a 'approved').
    """
    try:
        wp_api = get_wp_api()
        
        wp_comment_data = {
            'status': 'approved'
        }
        
        response = wp_api.put(f'comments/{comment_id}', wp_comment_data)
        updated_comment = response.json()
        
        return jsonify(updated_comment)
        
    except Exception as e:
        print(f"Error approving comment {comment_id}: {e}")
        return jsonify({"error": "Error al aprobar el comentario"}), 500

@blog_bp.route('/blog/comments/<int:comment_id>/reject', methods=['POST'])
def reject_comment(comment_id):
    """
    Rechaza un comentario (cambia el estado a 'hold' - pendiente).
    """
    try:
        wp_api = get_wp_api()
        
        # Primero obtener el comentario actual para verificar su estado
        current_response = wp_api.get(f'comments/{comment_id}')
        current_comment = current_response.json()
        
        print(f"Estado actual del comentario {comment_id}: {current_comment.get('status', 'desconocido')}")
        
        wp_comment_data = {
            'status': 'hold'
        }
        
        print(f"Cambiando comentario {comment_id} a estado 'hold'")
        response = wp_api.put(f'comments/{comment_id}', wp_comment_data)
        updated_comment = response.json()
        
        print(f"Nuevo estado del comentario {comment_id}: {updated_comment.get('status', 'desconocido')}")
        
        return jsonify(updated_comment)
        
    except Exception as e:
        print(f"Error rejecting comment {comment_id}: {e}")
        return jsonify({"error": "Error al rechazar el comentario"}), 500

@blog_bp.route('/blog/comments/<int:comment_id>/spam', methods=['POST'])
def mark_comment_as_spam(comment_id):
    """
    Marca un comentario como spam.
    """
    try:
        wp_api = get_wp_api()
        
        wp_comment_data = {
            'status': 'spam'
        }
        
        response = wp_api.put(f'comments/{comment_id}', wp_comment_data)
        updated_comment = response.json()
        
        return jsonify(updated_comment)
        
    except Exception as e:
        print(f"Error marking comment {comment_id} as spam: {e}")
        return jsonify({"error": "Error al marcar el comentario como spam"}), 500

@blog_bp.route('/blog/comments/counts', methods=['GET'])
def get_comment_counts():
    """
    Obtiene el conteo de comentarios por estado.
    """
    try:
        wp_api = get_wp_api()
        
        # Obtener comentarios de cada estado y contar manualmente
        # WordPress usa 'approve' para comentarios aprobados, no 'approved'
        wp_statuses = ['approve', 'hold', 'spam', 'trash']
        api_statuses = ['approved', 'hold', 'spam', 'trash']  # Lo que espera el frontend
        counts = {}
        total = 0
        
        for wp_status, api_status in zip(wp_statuses, api_statuses):
            try:
                # Obtener todos los comentarios de este estado
                response = wp_api.get('comments', params={
                    'status': wp_status,
                    'per_page': 100  # Obtener muchos para contar
                })
                comments = response.json()
                count = len(comments)
                counts[api_status] = count  # Usar el nombre que espera el frontend
                total += count
                
                print(f"Estado {wp_status} -> {api_status}: {count} comentarios")
                
            except Exception as e:
                print(f"Error getting count for status {wp_status}: {e}")
                counts[api_status] = 0
        
        counts['total'] = total
        
        print(f"Contadores finales: {counts}")
        
        return jsonify(counts)
        
    except Exception as e:
        print(f"Error getting comment counts: {e}")
        return jsonify({"error": "Error al obtener los contadores de comentarios"}), 500

@blog_bp.route('/blog/comments/bulk', methods=['POST'])
def bulk_update_comments():
    """
    Aplica una acción masiva a múltiples comentarios.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        
        comment_ids = data.get('comment_ids', [])
        action = data.get('action')
        
        if not comment_ids:
            return jsonify({"error": "No se proporcionaron IDs de comentarios"}), 400
        
        if not action:
            return jsonify({"error": "No se proporcionó una acción"}), 400
        
        wp_api = get_wp_api()
        results = []
        errors = []
        
        # Mapear acciones a estados de WordPress
        action_mapping = {
            'approve': 'approved',
            'hold': 'hold',
            'spam': 'spam',
            'trash': 'trash'
        }
        
        for comment_id in comment_ids:
            try:
                if action == 'delete':
                    # Eliminar permanentemente
                    response = wp_api.delete(f'comments/{comment_id}', params={'force': True})
                else:
                    # Cambiar estado
                    if action not in action_mapping:
                        errors.append(f"Acción desconocida: {action}")
                        continue
                    
                    wp_comment_data = {
                        'status': action_mapping[action]
                    }
                    
                    response = wp_api.put(f'comments/{comment_id}', wp_comment_data)
                
                result = response.json()
                results.append({
                    'comment_id': comment_id,
                    'success': True,
                    'data': result
                })
                
            except Exception as e:
                print(f"Error processing comment {comment_id}: {e}")
                errors.append(f"Error en comentario {comment_id}: {str(e)}")
                results.append({
                    'comment_id': comment_id,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'processed': len(comment_ids),
            'successful': len([r for r in results if r['success']]),
            'failed': len([r for r in results if not r['success']]),
            'results': results,
            'errors': errors
        })
        
    except Exception as e:
        print(f"Error in bulk update: {e}")
        return jsonify({"error": "Error en la actualización masiva"}), 500

@blog_bp.route('/blog/comments/<int:comment_id>/replies', methods=['POST'])
def reply_to_comment(comment_id):
    """
    Crea una respuesta a un comentario específico.
    """
    try:
        reply_data = request.get_json()
        if not reply_data:
            return jsonify({"error": "No se proporcionaron datos de la respuesta"}), 400
        
        # Validar campos requeridos
        if not reply_data.get('content'):
            return jsonify({"error": "El contenido de la respuesta es obligatorio"}), 400
        
        wp_api = get_wp_api()
        
        # Primero, obtener el comentario padre para obtener el post_id
        parent_response = wp_api.get(f'comments/{comment_id}')
        parent_comment = parent_response.json()
        
        if not parent_comment:
            return jsonify({"error": "Comentario padre no encontrado"}), 404
        
        # Preparar datos para la respuesta
        wp_reply_data = {
            'post': parent_comment['post'],  # ID del post
            'parent': comment_id,  # ID del comentario padre
            'content': reply_data['content'],
            'status': 'approved',  # Las respuestas del admin se aprueban automáticamente
            'author_name': reply_data.get('author_name', 'Administrador'),
            'author_email': reply_data.get('author_email', 'admin@ibulore.com')
        }
        
        # Si se proporciona author_url, agregarlo
        if reply_data.get('author_url'):
            wp_reply_data['author_url'] = reply_data['author_url']
        
        response = wp_api.post('comments', wp_reply_data)
        new_reply = response.json()
        
        return jsonify(new_reply), 201
        
    except Exception as e:
        print(f"Error creating reply to comment {comment_id}: {e}")
        return jsonify({"error": "Error al crear la respuesta"}), 500

# ==================== AI CONTENT GENERATION ====================

def clean_json_response(content):
    """
    Limpia la respuesta de OpenAI para extraer JSON válido.
    Maneja casos donde la respuesta viene con ```json o ``` al inicio/final.
    """
    if not content:
        return None
    
    cleaned_content = content.strip()
    
    # Remover ```json del inicio
    if cleaned_content.startswith('```json'):
        cleaned_content = cleaned_content[7:]
    elif cleaned_content.startswith('```'):
        cleaned_content = cleaned_content[3:]
    
    # Remover ``` del final
    if cleaned_content.endswith('```'):
        cleaned_content = cleaned_content[:-3]
    
    return cleaned_content.strip()

@blog_bp.route('/blog/ai/generate-content', methods=['POST'])
def generate_ai_content():
    """
    Genera contenido para artículos de blog usando OpenAI GPT.
    Especializado en santería yoruba con enfoque SEO.
    """
    try:
        # Verificar que la API key de OpenAI esté configurada
        if not Config.OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key no configurada en el servidor"}), 500
        
        # Obtener datos de la solicitud
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        
        # Extraer parámetros
        selected_idea = data.get('selectedIdea', '')
        additional_context = data.get('additionalContext', '')
        keywords = data.get('keywords', [])
        target_audience = data.get('targetAudience', 'principiante')
        article_length = data.get('articleLength', 'mediano')
        image_prompts = data.get('imagePrompts', [])
        uploaded_images = data.get('uploadedImages', [])
        
        if not selected_idea:
            return jsonify({"error": "Debe seleccionar una idea para el artículo"}), 400
        
        # Construir el prompt para OpenAI
        system_prompt = """
Eres un experto escritor especializado en santería yoruba y SEO. Tu tarea es crear artículos informativos, respetuosos y culturalmente precisos sobre temas de la religión yoruba.

Debes seguir estas pautas:
1. Ser respetuoso con las tradiciones y creencias yorubas
2. Proporcionar información histórica y cultural precisa
3. Optimizar el contenido para SEO
4. Usar un lenguaje claro y accesible según la audiencia
5. Estructurar el contenido con subtítulos HTML apropiados
6. Incluir palabras clave de manera natural
7. Crear meta descripciones atractivas y precisas

Tu respuesta debe ser ÚNICAMENTE un JSON válido con la estructura especificada, sin texto adicional antes o después.
        """
        
        user_prompt = f"""
Crea un artículo completo sobre "{selected_idea}" para un blog de santería yoruba.

DETALLES DEL ARTÍCULO:
- Audiencia objetivo: {target_audience}
- Longitud del artículo: {article_length}
- Palabras clave a incluir naturalmente: {', '.join(keywords)}
- Contexto adicional: {additional_context if additional_context else 'Ninguno específico'}
{"- Imágenes disponibles para incluir: " + ", ".join([img['filename'] + " (" + img['alt_text'] + ") - URL: " + img['url'] for img in uploaded_images]) if uploaded_images else ""}
{f"- Referencias de imágenes a mencionar: {', '.join(image_prompts)}" if image_prompts else ""}

REQUISITOS:
1. El artículo debe ser respetuoso con la tradición yoruba
2. Incluir información histórica y cultural relevante
3. Estar optimizado para SEO sin sonar artificial
4. Ser informativo y educativo
5. Incluir subtítulos en HTML (h2, h3) para estructura
6. Tener párrafos bien estructurados y fluidos
{f"7. INCLUIR las imágenes subidas en el contenido HTML usando las URLs exactas proporcionadas con tags <img> apropiados y alt text descriptivo" if uploaded_images else ""}
8. Longitud apropiada según especificación:
   - Corto: 500-800 palabras
   - Mediano: 800-1500 palabras  
   - Largo: 1500+ palabras

ESTRUCTURA DEL JSON DE RESPUESTA:
{{
  "title": "Título atractivo y descriptivo del artículo",
  "content": "Contenido completo en HTML con subtítulos h2 y h3, párrafos p, listas ul/ol si es apropiado",
  "excerpt": "Resumen atractivo de 150-160 caracteres que invite a leer",
  "seoTitle": "Título SEO optimizado máximo 60 caracteres",
  "seoDescription": "Meta descripción SEO de 150-160 caracteres",
  "keywords": ["array", "de", "palabras", "clave", "relevantes"],
  "categories": ["Categorías", "apropiadas", "para", "el", "artículo"],
  "tags": ["tags", "relevantes", "del", "artículo"]
}}

Responde ÚNICAMENTE con el JSON, sin texto adicional.
        """
        
        # Configurar headers para OpenAI
        headers = {
            'Authorization': f'Bearer {Config.OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Configurar payload para OpenAI
        openai_payload = {
            'model': Config.OPENAI_MODEL,  # Usar modelo configurado en .env
            'messages': [
                {
                    'role': 'system',
                    'content': system_prompt
                },
                {
                    'role': 'user',
                    'content': user_prompt
                }
            ],
            'max_tokens': 3000,
            'temperature': 0.7,
            'top_p': 1,
            'frequency_penalty': 0,
            'presence_penalty': 0
        }
        
        print(f"Generando contenido para: {selected_idea}")
        print(f"Audiencia: {target_audience}, Longitud: {article_length}")
        print(f"Palabras clave: {keywords}")
        print(f"Imágenes subidas: {len(uploaded_images)}")
        
        # Hacer la llamada a OpenAI
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=openai_payload,
            timeout=60  # Timeout de 60 segundos
        )
        
        if not response.ok:
            error_data = response.json() if response.content else {"error": "No response content"}
            print(f"Error de OpenAI API: {error_data}")
            return jsonify({"error": "Error al comunicarse con OpenAI API"}), 500
        
        openai_response = response.json()
        generated_content = openai_response.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        if not generated_content:
            return jsonify({"error": "No se pudo generar contenido"}), 500
        
        # Intentar parsear el JSON generado
        try:
            content_json = json.loads(generated_content)
            
            print(f"Contenido generado exitosamente para: {selected_idea}")
            
            return jsonify({
                'success': True,
                'content': json.dumps(content_json),
                'usage': openai_response.get('usage', {}),
                'model': openai_response.get('model', Config.OPENAI_MODEL)
            })
            
        except json.JSONDecodeError as e:
            print(f"Error parseando JSON generado: {e}")
            print(f"Contenido generado: {generated_content[:500]}...")
            
            # Intentar limpiar el JSON usando la función helper
            cleaned_content = clean_json_response(generated_content)
            
            try:
                content_json = json.loads(cleaned_content)
                print(f"JSON limpiado exitosamente para: {selected_idea}")
                return jsonify({
                    'success': True,
                    'content': json.dumps(content_json),
                    'usage': openai_response.get('usage', {}),
                    'model': openai_response.get('model', Config.OPENAI_MODEL)
                })
            except json.JSONDecodeError as e2:
                print(f"Error parseando JSON limpiado: {e2}")
                print(f"Contenido limpiado: {cleaned_content[:500]}...")
                return jsonify({"error": "El contenido generado no tiene el formato JSON correcto"}), 500
        
    except requests.exceptions.Timeout:
        return jsonify({"error": "Timeout al generar contenido. Intenta de nuevo."}), 500
    except requests.exceptions.RequestException as e:
        print(f"Error de conexión con OpenAI: {e}")
        return jsonify({"error": "Error de conexión con OpenAI API"}), 500
    except Exception as e:
        print(f"Error inesperado en generate_ai_content: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@blog_bp.route('/blog/ai/generate-ideas', methods=['POST'])
def generate_ai_ideas():
    """
    Genera nuevas ideas para artículos de santería yoruba usando OpenAI.
    """
    try:
        # Verificar que la API key de OpenAI esté configurada
        if not Config.OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key no configurada en el servidor"}), 500
        
        # Obtener parámetros opcionales
        data = request.get_json() or {}
        focus_area = data.get('focusArea', '')
        audience_level = data.get('audienceLevel', 'todos')
        
        # Construir el prompt para generar ideas
        system_prompt = """
Eres un experto en santería yoruba y marketing de contenidos. Genera ideas originales y atractivas para artículos de blog sobre santería yoruba que sean educativos, respetuosos y optimizados para SEO.
        """
        
        user_prompt = f"""
Genera 6 ideas únicas y atractivas para artículos de blog sobre santería yoruba.

{f"Área de enfoque: {focus_area}" if focus_area else ""}
{f"Nivel de audiencia: {audience_level}" if audience_level != 'todos' else ""}

Cada idea debe incluir:
- Un título atractivo y SEO-friendly
- Una descripción breve pero informativa
- Una categoría temática
- Un nivel de dificultad (Principiante, Intermedio, Avanzado)

Las ideas deben ser:
1. Respetuosas con la tradición yoruba
2. Educativas e informativas
3. Atractivas para lectores interesados en espiritualidad
4. Optimizadas para búsquedas SEO
5. Originales y no repetitivas

Responde ÚNICAMENTE con un JSON en este formato:
{{
  "ideas": [
    {{
      "title": "Título del artículo",
      "description": "Descripción breve del contenido",
      "category": "Categoría temática",
      "difficulty": "Principiante|Intermedio|Avanzado"
    }}
  ]
}}
        """
        
        # Configurar headers para OpenAI
        headers = {
            'Authorization': f'Bearer {Config.OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Configurar payload para OpenAI
        openai_payload = {
            'model': Config.OPENAI_MODEL,
            'messages': [
                {
                    'role': 'system',
                    'content': system_prompt
                },
                {
                    'role': 'user',
                    'content': user_prompt
                }
            ],
            'max_tokens': 1500,
            'temperature': 0.8,  # Más creatividad para ideas
            'top_p': 1,
            'frequency_penalty': 0.3,  # Evitar repeticiones
            'presence_penalty': 0.3
        }
        
        print(f"Generando nuevas ideas de artículos...")
        
        # Hacer la llamada a OpenAI
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=openai_payload,
            timeout=30
        )
        
        if not response.ok:
            error_data = response.json() if response.content else {"error": "No response content"}
            print(f"Error de OpenAI API: {error_data}")
            return jsonify({"error": "Error al comunicarse con OpenAI API"}), 500
        
        openai_response = response.json()
        generated_content = openai_response.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        if not generated_content:
            return jsonify({"error": "No se pudieron generar ideas"}), 500
        
        # Intentar parsear el JSON generado
        try:
            ideas_json = json.loads(generated_content)
            
            print(f"Ideas generadas exitosamente: {len(ideas_json.get('ideas', []))}")
            
            return jsonify({
                'success': True,
                'ideas': ideas_json.get('ideas', []),
                'usage': openai_response.get('usage', {}),
                'model': openai_response.get('model', Config.OPENAI_MODEL)
            })
            
        except json.JSONDecodeError as e:
            print(f"Error parseando JSON de ideas: {e}")
            print(f"Contenido generado: {generated_content[:500]}...")
            
            # Intentar limpiar el JSON usando la función helper
            cleaned_content = clean_json_response(generated_content)
            
            try:
                ideas_json = json.loads(cleaned_content)
                print(f"JSON de ideas limpiado exitosamente: {len(ideas_json.get('ideas', []))}")
                return jsonify({
                    'success': True,
                    'ideas': ideas_json.get('ideas', []),
                    'usage': openai_response.get('usage', {}),
                    'model': openai_response.get('model', Config.OPENAI_MODEL)
                })
            except json.JSONDecodeError as e2:
                print(f"Error parseando JSON de ideas limpiado: {e2}")
                print(f"Contenido limpiado: {cleaned_content[:500]}...")
                return jsonify({"error": "Las ideas generadas no tienen el formato correcto"}), 500
        
    except requests.exceptions.Timeout:
        return jsonify({"error": "Timeout al generar ideas. Intenta de nuevo."}), 500
    except requests.exceptions.RequestException as e:
        print(f"Error de conexión con OpenAI: {e}")
        return jsonify({"error": "Error de conexión con OpenAI API"}), 500
    except Exception as e:
        print(f"Error inesperado en generate_ai_ideas: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500
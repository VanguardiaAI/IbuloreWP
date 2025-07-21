from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api

categories_bp = Blueprint('categories_bp', __name__)

@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    Obtiene todas las categorías de productos de WooCommerce con soporte para filtros y paginación.
    """
    try:
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        search = request.args.get('search', '')
        parent = request.args.get('parent', type=int)
        orderby = request.args.get('orderby', 'name')
        order = request.args.get('order', 'asc')
        hide_empty = request.args.get('hide_empty', 'false').lower() == 'true'
        
        # Construir parámetros para WooCommerce API
        params = {
            "page": page,
            "per_page": min(per_page, 100),  # Limitar a máximo 100 por página
            "orderby": orderby,
            "order": order,
            "hide_empty": hide_empty
        }
        
        # Añadir filtros opcionales
        if search:
            params["search"] = search
        if parent is not None:
            params["parent"] = parent
            
        wc_api = get_wc_api()
        response = wc_api.get("products/categories", params=params)
        categories = response.json()
        
        # Añadir información de paginación en los headers si está disponible
        result = {
            "categories": categories,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": response.headers.get('X-WP-Total', len(categories)),
                "total_pages": response.headers.get('X-WP-TotalPages', 1)
            }
        }
        
        # Si se solicita solo las categorías (para compatibilidad)
        if request.args.get('format') == 'simple':
            return jsonify(categories)
            
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al obtener las categorías: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@categories_bp.route('/categories', methods=['POST'])
def create_category():
    """
    Crea una nueva categoría de producto en WooCommerce.
    """
    try:
        category_data = request.get_json()
        if not category_data:
            return jsonify({"error": "No se proporcionaron datos de categoría"}), 400
        
        # Validación de campos requeridos
        if not category_data.get('name'):
            return jsonify({"error": "El nombre de la categoría es requerido"}), 400
        
        # Generar slug automáticamente si no se proporciona
        if not category_data.get('slug') or category_data.get('slug').strip() == '':
            import re
            import unicodedata
            
            # Convertir nombre a slug: normalizar unicode, minúsculas, espacios a guiones
            name = category_data['name']
            # Normalizar caracteres unicode (ñ -> n, á -> a, etc.)
            slug = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
            slug = re.sub(r'[^a-zA-Z0-9\s-]', '', slug.lower())
            slug = re.sub(r'\s+', '-', slug.strip())
            slug = re.sub(r'-+', '-', slug)  # Eliminar guiones múltiples
            slug = slug.strip('-')  # Eliminar guiones al inicio y final
            category_data['slug'] = slug
            print(f"Slug generado automáticamente: '{slug}' para la categoría: '{category_data['name']}'")
        
        # Validar categoría padre si se especifica
        if category_data.get('parent') and category_data['parent'] != 0:
            wc_api = get_wc_api()
            try:
                parent_response = wc_api.get(f"products/categories/{category_data['parent']}")
                if parent_response.status_code != 200:
                    return jsonify({"error": "La categoría padre especificada no existe"}), 400
            except Exception:
                return jsonify({"error": "Error al validar la categoría padre"}), 400
        
        # Crear la categoría
        wc_api = get_wc_api()
        response = wc_api.post("products/categories", category_data)
        
        if response.status_code not in [200, 201]:
            error_message = "Error al crear la categoría"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_message = error_data['message']
            except:
                pass
            return jsonify({"error": error_message}), response.status_code
        
        # Verificar si la respuesta tiene contenido
        if response.text.strip():
            new_category = response.json()
        else:
            # Si la respuesta está vacía pero el status es exitoso, crear una respuesta básica
            new_category = {
                "id": None,
                "name": category_data.get('name'),
                "slug": category_data.get('slug', ''),
                "description": category_data.get('description', ''),
                "parent": category_data.get('parent', 0),
                "count": 0,
                "display": category_data.get('display', 'default'),
                "menu_order": category_data.get('menu_order', 0),
                "message": "Categoría creada exitosamente"
            }
        
        return jsonify(new_category), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al crear la categoría: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """
    Actualiza una categoría existente en WooCommerce.
    """
    try:
        category_data = request.get_json()
        if not category_data:
            return jsonify({"error": "No se proporcionaron datos de categoría"}), 400

        # Validar categoría padre si se especifica y es diferente de la actual
        if category_data.get('parent') and category_data['parent'] != 0:
            if category_data['parent'] == category_id:
                return jsonify({"error": "Una categoría no puede ser padre de sí misma"}), 400
                
            wc_api = get_wc_api()
            try:
                parent_response = wc_api.get(f"products/categories/{category_data['parent']}")
                if parent_response.status_code != 200:
                    return jsonify({"error": "La categoría padre especificada no existe"}), 400
            except Exception:
                return jsonify({"error": "Error al validar la categoría padre"}), 400

        # Actualizar la categoría
        wc_api = get_wc_api()
        response = wc_api.put(f"products/categories/{category_id}", category_data)
        
        if response.status_code not in [200, 201]:
            error_message = "Error al actualizar la categoría"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_message = error_data['message']
            except:
                pass
            return jsonify({"error": error_message}), response.status_code
        
        # Verificar si la respuesta tiene contenido
        if response.text.strip():
            updated_category = response.json()
        else:
            # Si la respuesta está vacía pero el status es exitoso, crear una respuesta básica
            updated_category = {
                "id": category_id,
                "name": category_data.get('name'),
                "slug": category_data.get('slug', ''),
                "description": category_data.get('description', ''),
                "parent": category_data.get('parent', 0),
                "count": 0,
                "display": category_data.get('display', 'default'),
                "menu_order": category_data.get('menu_order', 0),
                "message": "Categoría actualizada exitosamente"
            }
        
        return jsonify(updated_category)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al actualizar la categoría {category_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """
    Elimina una categoría de WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        
        # Verificar si la categoría tiene subcategorías
        subcategories = wc_api.get("products/categories", params={"parent": category_id}).json()
        if subcategories:
            return jsonify({
                "error": f"No se puede eliminar la categoría porque tiene {len(subcategories)} subcategorías. Elimina o reasigna las subcategorías primero."
            }), 400
        
        # Verificar si la categoría tiene productos
        category_info = wc_api.get(f"products/categories/{category_id}").json()
        if category_info.get('count', 0) > 0:
            return jsonify({
                "error": f"No se puede eliminar la categoría porque contiene {category_info['count']} productos. Reasigna los productos a otra categoría primero."
            }), 400
        
        # Eliminar la categoría
        deleted_category = wc_api.delete(f"products/categories/{category_id}", params={"force": True}).json()
        return jsonify(deleted_category)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al eliminar la categoría {category_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@categories_bp.route('/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """
    Obtiene una categoría específica por su ID.
    """
    try:
        wc_api = get_wc_api()
        category = wc_api.get(f"products/categories/{category_id}").json()
        return jsonify(category)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al obtener la categoría {category_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@categories_bp.route('/categories/bulk', methods=['DELETE'])
def bulk_delete_categories():
    """
    Elimina múltiples categorías en una sola operación.
    """
    try:
        data = request.get_json()
        if not data or 'ids' not in data:
            return jsonify({"error": "Se requiere una lista de IDs de categorías"}), 400
        
        category_ids = data['ids']
        if not isinstance(category_ids, list) or not category_ids:
            return jsonify({"error": "La lista de IDs debe ser un array no vacío"}), 400
        
        wc_api = get_wc_api()
        results = []
        errors = []
        
        for category_id in category_ids:
            try:
                # Verificar subcategorías y productos antes de eliminar
                subcategories = wc_api.get("products/categories", params={"parent": category_id}).json()
                if subcategories:
                    errors.append(f"Categoría {category_id}: tiene {len(subcategories)} subcategorías")
                    continue
                
                category_info = wc_api.get(f"products/categories/{category_id}").json()
                if category_info.get('count', 0) > 0:
                    errors.append(f"Categoría {category_id}: contiene {category_info['count']} productos")
                    continue
                
                # Eliminar la categoría
                deleted = wc_api.delete(f"products/categories/{category_id}", params={"force": True}).json()
                results.append({"id": category_id, "status": "deleted", "data": deleted})
                
            except Exception as e:
                errors.append(f"Categoría {category_id}: {str(e)}")
        
        return jsonify({
            "deleted": results,
            "errors": errors,
            "summary": {
                "total_requested": len(category_ids),
                "deleted": len(results),
                "errors": len(errors)
            }
        })
        
    except Exception as e:
        print(f"Error en eliminación masiva: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@categories_bp.route('/categories/hierarchy', methods=['GET'])
def get_categories_hierarchy():
    """
    Obtiene las categorías organizadas en estructura jerárquica.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener todas las categorías
        all_categories = wc_api.get("products/categories", params={
            "per_page": 100,
            "orderby": "menu_order",
            "order": "asc"
        }).json()
        
        # Construir estructura jerárquica
        def build_hierarchy(categories, parent_id=0, level=0):
            hierarchy = []
            for category in categories:
                if category['parent'] == parent_id:
                    category_with_children = {
                        **category,
                        'level': level,
                        'children': build_hierarchy(categories, category['id'], level + 1)
                    }
                    hierarchy.append(category_with_children)
            return hierarchy
        
        hierarchy = build_hierarchy(all_categories)
        
        return jsonify({
            "hierarchy": hierarchy,
            "total_categories": len(all_categories)
        })
        
    except Exception as e:
        print(f"Error al obtener jerarquía de categorías: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500 
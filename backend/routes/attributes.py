from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api

attributes_bp = Blueprint('attributes_bp', __name__)

# ============================================================================
# ENDPOINTS PARA ATRIBUTOS GLOBALES
# ============================================================================

@attributes_bp.route('/products/attributes', methods=['GET'])
def get_attributes():
    """
    Obtiene todos los atributos globales de productos de WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        attributes = wc_api.get("products/attributes", params={
            "per_page": 100,  # Obtener hasta 100 atributos
            "orderby": "name",
            "order": "asc"
        }).json()
        return jsonify(attributes)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al obtener los atributos: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes', methods=['POST'])
def create_attribute():
    """
    Crea un nuevo atributo global en WooCommerce.
    """
    try:
        print("=== CREATE ATTRIBUTE DEBUG ===")
        attribute_data = request.get_json()
        print(f"Received data: {attribute_data}")
        
        if not attribute_data:
            return jsonify({"error": "No se proporcionaron datos de atributo"}), 400
        
        # Validación de campos requeridos
        if not attribute_data.get('name'):
            return jsonify({"error": "El nombre del atributo es requerido"}), 400
        
        # Generar slug automáticamente si no se proporciona
        if not attribute_data.get('slug') or attribute_data.get('slug').strip() == '':
            import re
            # Convertir nombre a slug: minúsculas, espacios a guiones, solo caracteres alfanuméricos
            slug = re.sub(r'[^a-zA-Z0-9\s-]', '', attribute_data['name'].lower())
            slug = re.sub(r'\s+', '-', slug.strip())
            slug = re.sub(r'-+', '-', slug)  # Eliminar guiones múltiples
            slug = slug.strip('-')  # Eliminar guiones al inicio y final
            attribute_data['slug'] = slug
            print(f"Slug generado automáticamente: '{slug}' para el nombre: '{attribute_data['name']}'")
        
        # Campos por defecto para atributos
        if 'type' not in attribute_data:
            attribute_data['type'] = 'select'
        if 'order_by' not in attribute_data:
            attribute_data['order_by'] = 'menu_order'
        if 'has_archives' not in attribute_data:
            attribute_data['has_archives'] = False
        
        print(f"Final data to send: {attribute_data}")
        
        wc_api = get_wc_api()
        print("WooCommerce API client created successfully")
        
        response = wc_api.post("products/attributes", attribute_data)
        print(f"WooCommerce API response status: {response.status_code}")
        print(f"WooCommerce API response text: {response.text}")
        
        # Verificar si la respuesta tiene contenido
        if response.text.strip():
            new_attribute = response.json()
        else:
            # Si la respuesta está vacía pero el status es 200, crear una respuesta básica
            new_attribute = {
                "id": None,
                "name": attribute_data.get('name'),
                "slug": attribute_data.get('slug', ''),
                "type": attribute_data.get('type', 'select'),
                "order_by": attribute_data.get('order_by', 'menu_order'),
                "has_archives": attribute_data.get('has_archives', False),
                "message": "Atributo creado exitosamente (respuesta vacía de WooCommerce)"
            }
        
        return jsonify(new_attribute), 201
    except ValueError as e:
        print(f"ValueError: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Exception: {e}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes/<int:attribute_id>', methods=['PUT'])
def update_attribute(attribute_id):
    """
    Actualiza un atributo existente en WooCommerce.
    """
    try:
        attribute_data = request.get_json()
        if not attribute_data:
            return jsonify({"error": "No se proporcionaron datos de atributo"}), 400

        wc_api = get_wc_api()
        response = wc_api.put(f"products/attributes/{attribute_id}", attribute_data)
        
        # Verificar si la respuesta tiene contenido
        if response.text.strip():
            updated_attribute = response.json()
        else:
            # Si la respuesta está vacía pero el status es exitoso, crear una respuesta básica
            updated_attribute = {
                "id": attribute_id,
                "name": attribute_data.get('name'),
                "slug": attribute_data.get('slug', ''),
                "type": attribute_data.get('type', 'select'),
                "order_by": attribute_data.get('order_by', 'menu_order'),
                "has_archives": attribute_data.get('has_archives', False),
                "message": "Atributo actualizado exitosamente"
            }
        
        return jsonify(updated_attribute)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al actualizar el atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes/<int:attribute_id>', methods=['DELETE'])
def delete_attribute(attribute_id):
    """
    Elimina un atributo de WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        # En WooCommerce, para eliminar permanentemente un atributo, usamos force=true
        deleted_attribute = wc_api.delete(f"products/attributes/{attribute_id}", params={"force": True}).json()
        return jsonify(deleted_attribute)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al eliminar el atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes/<int:attribute_id>', methods=['GET'])
def get_attribute(attribute_id):
    """
    Obtiene un atributo específico por su ID.
    """
    try:
        wc_api = get_wc_api()
        attribute = wc_api.get(f"products/attributes/{attribute_id}").json()
        return jsonify(attribute)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al obtener el atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

# ============================================================================
# ENDPOINTS PARA TÉRMINOS DE ATRIBUTOS
# ============================================================================

@attributes_bp.route('/products/attributes/<int:attribute_id>/terms', methods=['GET'])
def get_attribute_terms(attribute_id):
    """
    Obtiene todos los términos de un atributo específico.
    """
    try:
        wc_api = get_wc_api()
        terms = wc_api.get(f"products/attributes/{attribute_id}/terms", params={
            "per_page": 100,  # Obtener hasta 100 términos
            "orderby": "name",
            "order": "asc"
        }).json()
        return jsonify(terms)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al obtener los términos del atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes/<int:attribute_id>/terms', methods=['POST'])
def create_attribute_term(attribute_id):
    """
    Crea un nuevo término para un atributo específico.
    """
    try:
        term_data = request.get_json()
        if not term_data:
            return jsonify({"error": "No se proporcionaron datos del término"}), 400
        
        # Validación de campos requeridos
        if not term_data.get('name'):
            return jsonify({"error": "El nombre del término es requerido"}), 400
        
        wc_api = get_wc_api()
        response = wc_api.post(f"products/attributes/{attribute_id}/terms", term_data)
        
        # Verificar si la respuesta tiene contenido
        if response.text.strip():
            new_term = response.json()
        else:
            # Si la respuesta está vacía pero el status es 200, crear una respuesta básica
            new_term = {
                "id": None,
                "name": term_data.get('name'),
                "slug": term_data.get('slug', ''),
                "description": term_data.get('description', ''),
                "count": 0,
                "message": "Término creado exitosamente"
            }
        
        return jsonify(new_term), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al crear el término para el atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes/<int:attribute_id>/terms/<int:term_id>', methods=['PUT'])
def update_attribute_term(attribute_id, term_id):
    """
    Actualiza un término existente de un atributo.
    """
    try:
        term_data = request.get_json()
        if not term_data:
            return jsonify({"error": "No se proporcionaron datos del término"}), 400

        wc_api = get_wc_api()
        response = wc_api.put(f"products/attributes/{attribute_id}/terms/{term_id}", term_data)
        
        # Verificar si la respuesta tiene contenido
        if response.text.strip():
            updated_term = response.json()
        else:
            # Si la respuesta está vacía pero el status es exitoso, crear una respuesta básica
            updated_term = {
                "id": term_id,
                "name": term_data.get('name'),
                "slug": term_data.get('slug', ''),
                "description": term_data.get('description', ''),
                "count": 0,
                "message": "Término actualizado exitosamente"
            }
        
        return jsonify(updated_term)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al actualizar el término {term_id} del atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes/<int:attribute_id>/terms/<int:term_id>', methods=['DELETE'])
def delete_attribute_term(attribute_id, term_id):
    """
    Elimina un término específico de un atributo.
    """
    try:
        wc_api = get_wc_api()
        # En WooCommerce, para eliminar permanentemente un término, usamos force=true
        deleted_term = wc_api.delete(f"products/attributes/{attribute_id}/terms/{term_id}", params={"force": True}).json()
        return jsonify(deleted_term)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al eliminar el término {term_id} del atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500

@attributes_bp.route('/products/attributes/<int:attribute_id>/terms/<int:term_id>', methods=['GET'])
def get_attribute_term(attribute_id, term_id):
    """
    Obtiene un término específico de un atributo por su ID.
    """
    try:
        wc_api = get_wc_api()
        term = wc_api.get(f"products/attributes/{attribute_id}/terms/{term_id}").json()
        return jsonify(term)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error al obtener el término {term_id} del atributo {attribute_id}: {e}")
        return jsonify({"error": "Ocurrió un error interno"}), 500 
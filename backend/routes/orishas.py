from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api

orishas_bp = Blueprint('orishas', __name__)

# The slug for product brands taxonomy is 'product_brand'
TAXONOMY_SLUG = '6'

@orishas_bp.route('/orishas', methods=['GET'])
def get_orishas():
    """
    Get all product brands (orishas).
    """
    try:
        wc_api = get_wc_api()
        response = wc_api.get('products/brands')
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        print(f"Error fetching orishas: {e}")
        return jsonify({"error": "Failed to fetch brands from WooCommerce"}), 500

@orishas_bp.route('/orishas', methods=['POST'])
def create_orisha():
    """
    Create a new product brand (orisha).
    """
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({"error": "Name is required"}), 400
        
        # Construir el payload solo con los datos que no son None
        payload = {
            key: data[key] 
            for key in ['name', 'slug', 'description'] 
            if data.get(key) is not None
        }
        
        # Añadir imagen si se proporciona
        if 'image' in data and data['image'] and 'id' in data['image']:
            payload['image'] = {'id': data['image']['id']}

        wc_api = get_wc_api()
        response = wc_api.post('products/brands', payload)
        response.raise_for_status()
        return jsonify(response.json()), 201
            
    except Exception as e:
        print(f"Error creating orisha: {e}")
        return jsonify({"error": "Failed to create brand"}), 500

@orishas_bp.route('/orishas/<int:id>', methods=['GET'])
def get_orisha(id):
    """
    Get a single product brand (orisha) by ID.
    """
    try:
        wc_api = get_wc_api()
        response = wc_api.get(f'products/brands/{id}')
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        print(f"Error fetching orisha {id}: {e}")
        return jsonify({"error": "Brand not found"}), 404

@orishas_bp.route('/orishas/<int:id>', methods=['PUT'])
def update_orisha(id):
    """
    Update a product brand (orisha).
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request data is empty"}), 400

        payload = {}
        if 'name' in data:
            payload['name'] = data['name']
        if 'slug' in data:
            payload['slug'] = data['slug']
        if 'description' in data:
            payload['description'] = data['description']
        
        # Manejo de la imagen: puede ser un ID o null para eliminarla
        if 'image' in data:
            if data['image'] and 'id' in data['image']:
                payload['image'] = {'id': data['image']['id']}
            else:
                # Si image es null o no tiene id, se elimina la imagen de la marca
                payload['image'] = {'id': 0}

        wc_api = get_wc_api()
        response = wc_api.put(f'products/brands/{id}', payload)
        response.raise_for_status()
        return jsonify(response.json()), 200

    except Exception as e:
        print(f"Error updating orisha {id}: {e}")
        return jsonify({"error": "Failed to update brand"}), 500

@orishas_bp.route('/orishas/<int:id>', methods=['DELETE'])
def delete_orisha(id):
    """
    Delete a product brand (orisha).
    """
    try:
        wc_api = get_wc_api()
        # `force=True` es necesario para borrar términos que tienen productos asociados
        response = wc_api.delete(f'products/brands/{id}', params={'force': True})
        response.raise_for_status()
        return jsonify(response.json()), 200
            
    except Exception as e:
        print(f"Error deleting orisha {id}: {e}")
        return jsonify({"error": "Failed to delete brand"}), 500 
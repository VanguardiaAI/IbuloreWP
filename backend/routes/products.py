from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api

products_bp = Blueprint('products_bp', __name__)

@products_bp.route('/products', methods=['GET'])
def get_products():
    """
    Fetches products from WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        # Obtener más productos por página y ordenar por fecha de creación (más recientes primero)
        products = wc_api.get("products", params={
            "per_page": 50,  # Aumentar a 50 productos por página
            "orderby": "date",
            "order": "desc"  # Más recientes primero
        }).json()
        return jsonify(products)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        # Log the exception for debugging purposes
        print(f"An error occurred: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@products_bp.route('/products', methods=['POST'])
def create_product():
    """
    Creates a new product in WooCommerce.
    """
    try:
        product_data = request.get_json()
        if not product_data:
            return jsonify({"error": "No product data provided"}), 400
        
        wc_api = get_wc_api()
        new_product = wc_api.post("products", product_data).json()
        return jsonify(new_product), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"An error occurred while creating product: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@products_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """
    Updates an existing product in WooCommerce.
    """
    try:
        product_data = request.get_json()
        if not product_data:
            return jsonify({"error": "No product data provided"}), 400

        wc_api = get_wc_api()
        updated_product = wc_api.put(f"products/{product_id}", product_data).json()
        return jsonify(updated_product)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"An error occurred while updating product {product_id}: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@products_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """
    Deletes a product from WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        # En WooCommerce, para eliminar permanentemente un producto, usamos force=true
        deleted_product = wc_api.delete(f"products/{product_id}", params={"force": True}).json()
        return jsonify(deleted_product)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"An error occurred while deleting product {product_id}: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@products_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """
    Gets a single product from WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        product = wc_api.get(f"products/{product_id}").json()
        return jsonify(product)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"An error occurred while fetching product {product_id}: {e}")
        return jsonify({"error": "An internal error occurred"}), 500



@products_bp.route('/products/<int:product_id>/images', methods=['POST'])
def upload_product_image(product_id):
    """
    Placeholder endpoint for uploading images to a product.
    This will be implemented in the future.
    """
    return jsonify({
        "message": "Image upload functionality will be available soon",
        "product_id": product_id
    }), 501  # Not Implemented

@products_bp.route('/products/bulk-delete', methods=['POST'])
def bulk_delete_products():
    """
    Deletes multiple products from WooCommerce in bulk.
    Expects a JSON body with { "product_ids": [1, 2, 3, ...] }
    """
    try:
        data = request.get_json()
        if not data or 'product_ids' not in data:
            return jsonify({"error": "No product IDs provided"}), 400
        
        product_ids = data['product_ids']
        if not isinstance(product_ids, list) or len(product_ids) == 0:
            return jsonify({"error": "product_ids must be a non-empty array"}), 400
        
        wc_api = get_wc_api()
        deleted_products = []
        failed_deletions = []
        
        for product_id in product_ids:
            try:
                # Eliminar cada producto permanentemente
                result = wc_api.delete(f"products/{product_id}", params={"force": True})
                if result.status_code == 200:
                    deleted_products.append(product_id)
                else:
                    failed_deletions.append({
                        "id": product_id,
                        "error": f"Status code: {result.status_code}"
                    })
            except Exception as e:
                failed_deletions.append({
                    "id": product_id,
                    "error": str(e)
                })
        
        return jsonify({
            "deleted": deleted_products,
            "failed": failed_deletions,
            "total_deleted": len(deleted_products),
            "total_failed": len(failed_deletions)
        })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"An error occurred during bulk deletion: {e}")
        return jsonify({"error": "An internal error occurred"}), 500 
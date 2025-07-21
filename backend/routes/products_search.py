from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api
import logging

products_search_bp = Blueprint('products_search_bp', __name__)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@products_search_bp.route('/products/search', methods=['GET'])
def search_products():
    """
    Busca productos por diferentes criterios con información completa para pedidos.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de búsqueda
        query = request.args.get('q', '')
        limit = request.args.get('limit', 10, type=int)
        category = request.args.get('category')
        in_stock = request.args.get('in_stock', 'true').lower() == 'true'
        
        if not query:
            return jsonify({"products": []})
        
        # Buscar por nombre, SKU, descripción, etc.
        search_params = {
            'search': query,
            'per_page': min(limit, 50),
            'status': 'publish'
        }
        
        # Filtrar por categoría si se especifica
        if category:
            search_params['category'] = category
        
        # Filtrar por stock si se especifica
        if in_stock:
            search_params['stock_status'] = 'instock'
        
        products = wc_api.get("products", params=search_params).json()
        
        # Enriquecer datos de productos para la interfaz de pedidos
        enhanced_products = []
        if isinstance(products, list):
            for product in products:
                # Obtener categorías del producto
                categories = []
                if product.get('categories'):
                    for cat in product['categories']:
                        categories.append(cat.get('name', ''))
                
                # Determinar disponibilidad y stock
                manage_stock = product.get('manage_stock', False)
                stock_quantity = product.get('stock_quantity')
                stock_status = product.get('stock_status', 'outofstock')
                in_stock_status = stock_status == 'instock'
                
                # Obtener imagen principal
                image_url = None
                if product.get('images') and len(product['images']) > 0:
                    image_url = product['images'][0].get('src')
                
                # Obtener precio
                price = float(product.get('price', 0)) if product.get('price') else 0
                regular_price = float(product.get('regular_price', 0)) if product.get('regular_price') else 0
                sale_price = float(product.get('sale_price', 0)) if product.get('sale_price') else 0
                
                enhanced_product = {
                    'id': product.get('id'),
                    'name': product.get('name', ''),
                    'sku': product.get('sku', ''),
                    'price': price,
                    'regular_price': regular_price,
                    'sale_price': sale_price,
                    'stock_quantity': stock_quantity if manage_stock else None,
                    'manage_stock': manage_stock,
                    'in_stock': in_stock_status,
                    'stock_status': stock_status,
                    'image': image_url,
                    'type': product.get('type', 'simple'),
                    'categories': categories,
                    'short_description': product.get('short_description', ''),
                    'weight': product.get('weight', ''),
                    'dimensions': product.get('dimensions', {}),
                    'shipping_required': product.get('shipping_required', True),
                    'virtual': product.get('virtual', False),
                    'downloadable': product.get('downloadable', False)
                }
                enhanced_products.append(enhanced_product)
        
        return jsonify({"products": enhanced_products})
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error searching products: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@products_search_bp.route('/products/by-category/<int:category_id>', methods=['GET'])
def get_products_by_category(category_id):
    """
    Obtiene productos por categoría específica.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        orderby = request.args.get('orderby', 'menu_order')
        order = request.args.get('order', 'asc')
        
        params = {
            'category': category_id,
            'page': page,
            'per_page': min(per_page, 100),
            'orderby': orderby,
            'order': order,
            'status': 'publish'
        }
        
        response = wc_api.get("products", params=params)
        products = response.json()
        
        # Obtener headers para metadatos de paginación
        headers = response.headers
        total = headers.get('X-WP-Total', 0)
        total_pages = headers.get('X-WP-TotalPages', 1)
        
        return jsonify({
            'products': products,
            'category_id': category_id,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': int(total),
                'total_pages': int(total_pages)
            }
        })
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching products for category {category_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@products_search_bp.route('/products/low-stock', methods=['GET'])
def get_low_stock_products():
    """
    Obtiene productos con stock bajo.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener todos los productos que manejan stock
        all_products = wc_api.get("products", params={
            'per_page': 100,
            'status': 'publish',
            'manage_stock': True
        }).json()
        
        # Filtrar productos con stock bajo (menos de 5 unidades)
        low_stock_threshold = request.args.get('threshold', 5, type=int)
        low_stock_products = []
        
        if isinstance(all_products, list):
            for product in all_products:
                stock_quantity = product.get('stock_quantity', 0)
                if stock_quantity is not None and stock_quantity <= low_stock_threshold:
                    # Obtener categorías
                    categories = []
                    if product.get('categories'):
                        for cat in product['categories']:
                            categories.append(cat.get('name', ''))
                    
                    low_stock_product = {
                        'id': product.get('id'),
                        'name': product.get('name', ''),
                        'sku': product.get('sku', ''),
                        'stock_quantity': stock_quantity,
                        'stock_status': product.get('stock_status', ''),
                        'categories': categories,
                        'price': product.get('price', 0)
                    }
                    low_stock_products.append(low_stock_product)
        
        # Ordenar por stock (menor a mayor)
        low_stock_products.sort(key=lambda x: x['stock_quantity'] or 0)
        
        return jsonify({
            'products': low_stock_products,
            'threshold': low_stock_threshold,
            'total_low_stock': len(low_stock_products)
        })
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching low stock products: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@products_search_bp.route('/products/recent', methods=['GET'])
def get_recent_products():
    """
    Obtiene los productos añadidos recientemente.
    """
    try:
        wc_api = get_wc_api()
        
        limit = request.args.get('limit', 10, type=int)
        
        params = {
            'per_page': min(limit, 50),
            'orderby': 'date',
            'order': 'desc',
            'status': 'publish'
        }
        
        products = wc_api.get("products", params=params).json()
        
        # Enriquecer con información básica
        recent_products = []
        if isinstance(products, list):
            for product in products:
                categories = []
                if product.get('categories'):
                    for cat in product['categories']:
                        categories.append(cat.get('name', ''))
                
                image_url = None
                if product.get('images') and len(product['images']) > 0:
                    image_url = product['images'][0].get('src')
                
                recent_product = {
                    'id': product.get('id'),
                    'name': product.get('name', ''),
                    'sku': product.get('sku', ''),
                    'price': product.get('price', 0),
                    'date_created': product.get('date_created'),
                    'categories': categories,
                    'image': image_url,
                    'stock_status': product.get('stock_status', ''),
                    'manage_stock': product.get('manage_stock', False),
                    'stock_quantity': product.get('stock_quantity')
                }
                recent_products.append(recent_product)
        
        return jsonify({"products": recent_products})
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching recent products: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@products_search_bp.route('/products/<int:product_id>/stock', methods=['GET'])
def get_product_stock(product_id):
    """
    Obtiene información detallada del stock de un producto específico.
    """
    try:
        wc_api = get_wc_api()
        product = wc_api.get(f"products/{product_id}").json()
        
        if 'id' not in product:
            return jsonify({"error": "Producto no encontrado"}), 404
        
        stock_info = {
            'product_id': product.get('id'),
            'name': product.get('name', ''),
            'sku': product.get('sku', ''),
            'manage_stock': product.get('manage_stock', False),
            'stock_quantity': product.get('stock_quantity'),
            'stock_status': product.get('stock_status', ''),
            'backorders': product.get('backorders', 'no'),
            'backorders_allowed': product.get('backorders_allowed', False),
            'backordered': product.get('backordered', False),
            'sold_individually': product.get('sold_individually', False),
            'low_stock_amount': product.get('low_stock_amount'),
        }
        
        return jsonify(stock_info)
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching stock for product {product_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500 
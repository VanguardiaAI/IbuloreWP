from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api

inventory_bp = Blueprint('inventory_bp', __name__)

@inventory_bp.route('/inventory', methods=['GET'])
def get_inventory():
    """
    Obtiene todos los productos con sus datos de inventario desde WooCommerce.
    Incluye filtros por estado de stock y búsqueda.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        stock_status = request.args.get('stock_status', '')  # instock, outofstock, onbackorder
        low_stock = request.args.get('low_stock', False, type=bool)
        
        # Construir parámetros para WooCommerce API
        params = {
            'page': page,
            'per_page': per_page,
            'orderby': 'date',
            'order': 'desc'
        }
        
        # Agregar búsqueda si se proporciona
        if search:
            params['search'] = search
            
        # Agregar filtro de estado de stock
        if stock_status:
            params['stock_status'] = stock_status
            
        print(f"Fetching inventory with params: {params}")
        
        # Obtener productos desde WooCommerce
        response = wc_api.get("products", params=params)
        products = response.json()
        
        # Si se solicita filtro de stock bajo, filtrar localmente
        if low_stock:
            products = [
                product for product in products 
                if (product.get('manage_stock', False) and 
                    product.get('stock_quantity', 0) <= product.get('low_stock_amount', 5))
            ]
        
        # Formatear datos para el frontend
        inventory_data = []
        for product in products:
            inventory_item = {
                'id': product.get('id'),
                'name': product.get('name'),
                'sku': product.get('sku', ''),
                'regular_price': product.get('regular_price', '0'),
                'sale_price': product.get('sale_price', ''),
                'manage_stock': product.get('manage_stock', False),
                'stock_quantity': product.get('stock_quantity'),
                'stock_status': product.get('stock_status', 'instock'),
                'backorders': product.get('backorders', 'no'),
                'low_stock_amount': product.get('low_stock_amount'),
                'images': product.get('images', []),
                'categories': product.get('categories', []),
                'type': product.get('type', 'simple'),
                'status': product.get('status', 'publish')
            }
            inventory_data.append(inventory_item)
        
        return jsonify({
            'products': inventory_data,
            'total': len(inventory_data),
            'page': page,
            'per_page': per_page
        })
        
    except ValueError as e:
        print(f"ValueError in get_inventory: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error in get_inventory: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@inventory_bp.route('/inventory/<int:product_id>', methods=['PUT'])
def update_inventory(product_id):
    """
    Actualiza los datos de inventario de un producto específico.
    """
    try:
        inventory_data = request.get_json()
        if not inventory_data:
            return jsonify({"error": "No se proporcionaron datos de inventario"}), 400
        
        wc_api = get_wc_api()
        
        # Preparar datos para WooCommerce
        update_data = {}
        
        # Campos de inventario
        if 'manage_stock' in inventory_data:
            update_data['manage_stock'] = inventory_data['manage_stock']
            
        if 'stock_quantity' in inventory_data:
            update_data['stock_quantity'] = inventory_data['stock_quantity']
            
        if 'stock_status' in inventory_data:
            update_data['stock_status'] = inventory_data['stock_status']
            
        if 'backorders' in inventory_data:
            update_data['backorders'] = inventory_data['backorders']
            
        if 'low_stock_amount' in inventory_data:
            update_data['low_stock_amount'] = inventory_data['low_stock_amount']
            
        # Campos de precios
        if 'regular_price' in inventory_data:
            update_data['regular_price'] = str(inventory_data['regular_price'])
            
        if 'sale_price' in inventory_data:
            update_data['sale_price'] = str(inventory_data['sale_price'])
        
        print(f"Updating product {product_id} with data: {update_data}")
        
        # Actualizar producto en WooCommerce
        response = wc_api.put(f"products/{product_id}", update_data)
        updated_product = response.json()
        
        return jsonify(updated_product)
        
    except ValueError as e:
        print(f"ValueError in update_inventory: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error in update_inventory: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@inventory_bp.route('/inventory/bulk-update', methods=['POST'])
def bulk_update_inventory():
    """
    Actualiza múltiples productos de inventario de forma masiva.
    """
    try:
        bulk_data = request.get_json()
        if not bulk_data or 'products' not in bulk_data:
            return jsonify({"error": "No se proporcionaron datos para actualización masiva"}), 400
        
        wc_api = get_wc_api()
        products_to_update = bulk_data['products']
        update_type = bulk_data.get('update_type', 'individual')  # individual, stock, price
        
        results = []
        errors = []
        
        for product_update in products_to_update:
            try:
                product_id = product_update.get('id')
                if not product_id:
                    errors.append({"error": "ID de producto faltante", "data": product_update})
                    continue
                
                # Preparar datos según el tipo de actualización
                update_data = {}
                
                if update_type == 'stock' or update_type == 'individual':
                    if 'stock_quantity' in product_update:
                        update_data['stock_quantity'] = product_update['stock_quantity']
                    if 'stock_status' in product_update:
                        update_data['stock_status'] = product_update['stock_status']
                    if 'manage_stock' in product_update:
                        update_data['manage_stock'] = product_update['manage_stock']
                
                if update_type == 'price' or update_type == 'individual':
                    if 'regular_price' in product_update:
                        update_data['regular_price'] = str(product_update['regular_price'])
                    if 'sale_price' in product_update:
                        update_data['sale_price'] = str(product_update['sale_price'])
                
                if update_data:
                    response = wc_api.put(f"products/{product_id}", update_data)
                    updated_product = response.json()
                    results.append({
                        'id': product_id,
                        'success': True,
                        'data': updated_product
                    })
                else:
                    errors.append({
                        'id': product_id,
                        'error': 'No hay datos válidos para actualizar'
                    })
                    
            except Exception as e:
                errors.append({
                    'id': product_update.get('id', 'unknown'),
                    'error': str(e)
                })
        
        return jsonify({
            'success': len(results),
            'errors': len(errors),
            'results': results,
            'error_details': errors
        })
        
    except ValueError as e:
        print(f"ValueError in bulk_update_inventory: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error in bulk_update_inventory: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@inventory_bp.route('/inventory/low-stock', methods=['GET'])
def get_low_stock_products():
    """
    Obtiene productos con stock bajo.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener todos los productos que gestionan stock
        params = {
            'per_page': 100,
            'orderby': 'date',
            'order': 'desc'
        }
        
        response = wc_api.get("products", params=params)
        all_products = response.json()
        
        # Filtrar productos con stock bajo
        low_stock_products = []
        for product in all_products:
            if (product.get('manage_stock', False) and 
                product.get('stock_quantity') is not None):
                
                stock_quantity = product.get('stock_quantity', 0)
                low_stock_amount = product.get('low_stock_amount') or 5
                
                if stock_quantity <= low_stock_amount:
                    low_stock_products.append({
                        'id': product.get('id'),
                        'name': product.get('name'),
                        'sku': product.get('sku', ''),
                        'stock_quantity': stock_quantity,
                        'low_stock_amount': low_stock_amount,
                        'stock_status': product.get('stock_status', 'instock'),
                        'images': product.get('images', [])
                    })
        
        return jsonify({
            'products': low_stock_products,
            'total': len(low_stock_products)
        })
        
    except ValueError as e:
        print(f"ValueError in get_low_stock_products: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error in get_low_stock_products: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@inventory_bp.route('/inventory/out-of-stock', methods=['GET'])
def get_out_of_stock_products():
    """
    Obtiene productos agotados.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener productos con estado "outofstock"
        params = {
            'per_page': 100,
            'stock_status': 'outofstock',
            'orderby': 'date',
            'order': 'desc'
        }
        
        response = wc_api.get("products", params=params)
        out_of_stock_products = response.json()
        
        # Formatear datos
        formatted_products = []
        for product in out_of_stock_products:
            formatted_products.append({
                'id': product.get('id'),
                'name': product.get('name'),
                'sku': product.get('sku', ''),
                'stock_quantity': product.get('stock_quantity'),
                'stock_status': product.get('stock_status', 'outofstock'),
                'manage_stock': product.get('manage_stock', False),
                'images': product.get('images', []),
                'regular_price': product.get('regular_price', '0')
            })
        
        return jsonify({
            'products': formatted_products,
            'total': len(formatted_products)
        })
        
    except ValueError as e:
        print(f"ValueError in get_out_of_stock_products: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error in get_out_of_stock_products: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@inventory_bp.route('/inventory/stats', methods=['GET'])
def get_inventory_stats():
    """
    Obtiene estadísticas generales del inventario.
    """
    try:
        wc_api = get_wc_api()
        
        print("Fetching products for stats...")
        
        # Obtener todos los productos
        params = {
            'per_page': 100,
            'orderby': 'date',
            'order': 'desc'
        }
        
        response = wc_api.get("products", params=params)
        all_products = response.json()
        
        print(f"Retrieved {len(all_products)} products for stats")
        
        # Calcular estadísticas
        total_products = len(all_products)
        in_stock = 0
        out_of_stock = 0
        low_stock = 0
        total_stock_value = 0
        
        for product in all_products:
            try:
                stock_status = product.get('stock_status', 'instock')
                
                if stock_status == 'instock':
                    in_stock += 1
                elif stock_status == 'outofstock':
                    out_of_stock += 1
                
                # Verificar stock bajo
                if (product.get('manage_stock', False) and 
                    product.get('stock_quantity') is not None):
                    
                    stock_quantity = product.get('stock_quantity', 0)
                    low_stock_amount = product.get('low_stock_amount') or 5
                    
                    if stock_quantity <= low_stock_amount and stock_quantity > 0:
                        low_stock += 1
                    
                    # Calcular valor del stock
                    try:
                        regular_price_str = product.get('regular_price', '0')
                        regular_price = float(regular_price_str) if regular_price_str else 0
                        total_stock_value += stock_quantity * regular_price
                    except (ValueError, TypeError) as price_error:
                        print(f"Error parsing price for product {product.get('id', 'unknown')}: {price_error}")
                        continue
                        
            except Exception as product_error:
                print(f"Error processing product {product.get('id', 'unknown')}: {product_error}")
                continue
        
        stats = {
            'total_products': total_products,
            'in_stock': in_stock,
            'out_of_stock': out_of_stock,
            'low_stock': low_stock,
            'total_stock_value': round(total_stock_value, 2)
        }
        
        print(f"Calculated stats: {stats}")
        
        return jsonify(stats)
        
    except ValueError as e:
        print(f"ValueError in get_inventory_stats: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error in get_inventory_stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Error interno del servidor"}), 500 
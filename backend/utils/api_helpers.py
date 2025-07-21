from functools import wraps
from flask import jsonify
import logging

logger = logging.getLogger(__name__)

def handle_wc_errors(f):
    """
    Decorador para manejar errores comunes de la API de WooCommerce.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({
                "error": "Error interno del servidor",
                "message": str(e) if hasattr(e, 'message') else str(e)
            }), 500
    return decorated_function

def transform_order_for_frontend(order):
    """
    Transforma los datos de pedido de WooCommerce para el frontend.
    """
    if not order or 'id' not in order:
        return None
    
    # Mapear estados de WooCommerce a estados del frontend
    status_mapping = {
        'pending': 'pending',
        'processing': 'processing', 
        'on-hold': 'on-hold',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'refunded': 'refunded',
        'failed': 'failed'
    }
    
    # Transformar line_items para el frontend
    line_items = []
    for item in order.get('line_items', []):
        line_item = {
            'id': item.get('id'),
            'product_id': item.get('product_id'),
            'name': item.get('name', ''),
            'sku': item.get('sku', ''),
            'quantity': item.get('quantity', 1),
            'price': float(item.get('price', 0)),
            'total': float(item.get('total', 0)),
            'subtotal': float(item.get('subtotal', 0)),
            'image': item.get('image', {}).get('src') if item.get('image') else None
        }
        line_items.append(line_item)
    
    transformed_order = {
        'id': order.get('id'),
        'number': order.get('number'),
        'status': status_mapping.get(order.get('status'), order.get('status')),
        'date_created': order.get('date_created'),
        'date_modified': order.get('date_modified'),
        'date_paid': order.get('date_paid'),
        'customer_id': order.get('customer_id', 0),
        'customer_note': order.get('customer_note', ''),
        'billing': order.get('billing', {}),
        'shipping': order.get('shipping', {}),
        'payment_method': order.get('payment_method', ''),
        'payment_method_title': order.get('payment_method_title', ''),
        'transaction_id': order.get('transaction_id', ''),
        'line_items': line_items,
        'shipping_total': float(order.get('shipping_total', 0)),
        'total_tax': float(order.get('total_tax', 0)),
        'total': float(order.get('total', 0)),
        'subtotal': float(order.get('total', 0)) - float(order.get('shipping_total', 0)) - float(order.get('total_tax', 0)),
        'currency': order.get('currency', 'EUR'),
        'needs_shipping': order.get('shipping_lines', []) != [],
        'needs_payment': order.get('status') in ['pending', 'on-hold'],
        # Información adicional útil para el frontend
        'customer_name': f"{order.get('billing', {}).get('first_name', '')} {order.get('billing', {}).get('last_name', '')}".strip(),
        'customer_email': order.get('billing', {}).get('email', ''),
        'order_key': order.get('order_key', ''),
        'meta_data': order.get('meta_data', [])
    }
    
    return transformed_order

def transform_customer_for_frontend(customer):
    """
    Transforma los datos de cliente de WooCommerce para el frontend.
    """
    if not customer or 'id' not in customer:
        return None
    
    transformed_customer = {
        'id': customer.get('id'),
        'first_name': customer.get('first_name', ''),
        'last_name': customer.get('last_name', ''),
        'email': customer.get('email', ''),
        'phone': customer.get('billing', {}).get('phone', ''),
        'username': customer.get('username', ''),
        'avatar_url': customer.get('avatar_url', ''),
        'date_created': customer.get('date_created'),
        'date_modified': customer.get('date_modified'),
        'billing': customer.get('billing', {}),
        'shipping': customer.get('shipping', {}),
        # Campos adicionales que se pueden calcular
        'full_name': f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
        'role': customer.get('role', 'customer')
    }
    
    return transformed_customer

def transform_product_for_frontend(product):
    """
    Transforma los datos de producto de WooCommerce para el frontend.
    """
    if not product or 'id' not in product:
        return None
    
    # Obtener categorías
    categories = []
    if product.get('categories'):
        categories = [cat.get('name', '') for cat in product['categories']]
    
    # Obtener imagen principal
    image_url = None
    if product.get('images') and len(product['images']) > 0:
        image_url = product['images'][0].get('src')
    
    # Manejar precios
    price = float(product.get('price', 0)) if product.get('price') else 0
    regular_price = float(product.get('regular_price', 0)) if product.get('regular_price') else 0
    sale_price = float(product.get('sale_price', 0)) if product.get('sale_price') else 0
    
    transformed_product = {
        'id': product.get('id'),
        'name': product.get('name', ''),
        'sku': product.get('sku', ''),
        'price': price,
        'regular_price': regular_price,
        'sale_price': sale_price,
        'on_sale': product.get('on_sale', False),
        'stock_quantity': product.get('stock_quantity'),
        'manage_stock': product.get('manage_stock', False),
        'in_stock': product.get('stock_status') == 'instock',
        'stock_status': product.get('stock_status', 'outofstock'),
        'image': image_url,
        'type': product.get('type', 'simple'),
        'categories': categories,
        'short_description': product.get('short_description', ''),
        'description': product.get('description', ''),
        'weight': product.get('weight', ''),
        'dimensions': product.get('dimensions', {}),
        'shipping_required': product.get('shipping_required', True),
        'virtual': product.get('virtual', False),
        'downloadable': product.get('downloadable', False),
        'sold_individually': product.get('sold_individually', False),
        'backorders_allowed': product.get('backorders_allowed', False),
        'backordered': product.get('backordered', False)
    }
    
    return transformed_product

def paginate_response(data, page, per_page, total, total_pages):
    """
    Crea una respuesta paginada estándar.
    """
    return {
        'data': data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    }

def validate_order_data(order_data):
    """
    Valida los datos de pedido antes de enviarlos a WooCommerce.
    """
    errors = []
    
    # Validar line_items
    if not order_data.get('line_items'):
        errors.append("El pedido debe tener al menos un producto")
    else:
        for i, item in enumerate(order_data['line_items']):
            if not item.get('product_id'):
                errors.append(f"El producto {i+1} debe tener un ID válido")
            if not item.get('quantity') or item['quantity'] < 1:
                errors.append(f"El producto {i+1} debe tener una cantidad mayor a 0")
    
    # Validar información de facturación
    billing = order_data.get('billing', {})
    if not billing.get('email'):
        errors.append("El email de facturación es obligatorio")
    
    # Validar método de pago
    if not order_data.get('payment_method'):
        errors.append("El método de pago es obligatorio")
    
    return errors

def format_currency(amount, currency='EUR'):
    """
    Formatea un monto monetario.
    """
    try:
        return f"{float(amount):.2f} {currency}"
    except (ValueError, TypeError):
        return f"0.00 {currency}"

def calculate_order_totals(line_items, shipping_total=0, tax_rate=0.21):
    """
    Calcula los totales de un pedido.
    """
    subtotal = sum(float(item.get('total', 0)) for item in line_items)
    tax_total = subtotal * tax_rate
    total = subtotal + shipping_total + tax_total
    
    return {
        'subtotal': round(subtotal, 2),
        'tax_total': round(tax_total, 2),
        'shipping_total': round(shipping_total, 2),
        'total': round(total, 2)
    } 
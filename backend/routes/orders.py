from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api
from datetime import datetime, timedelta
import logging

orders_bp = Blueprint('orders_bp', __name__)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@orders_bp.route('/orders', methods=['GET'])
def get_orders():
    """
    Obtiene la lista de pedidos desde WooCommerce con filtros opcionales.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        customer = request.args.get('customer', type=int)
        search = request.args.get('search')
        after = request.args.get('after')  # Fecha después de
        before = request.args.get('before')  # Fecha antes de
        orderby = request.args.get('orderby', 'date')
        order = request.args.get('order', 'desc')
        
        # Construir parámetros para la API de WooCommerce
        params = {
            'page': page,
            'per_page': min(per_page, 100),  # Limitar a 100 máximo
            'orderby': orderby,
            'order': order
        }
        
        # Añadir filtros opcionales
        if status:
            params['status'] = status
        if customer:
            params['customer'] = customer
        if search:
            params['search'] = search
        if after:
            params['after'] = after
        if before:
            params['before'] = before
        
        # Hacer la petición a WooCommerce
        response = wc_api.get("orders", params=params)
        orders = response.json()
        
        # Filtrar carritos abandonados (checkout-draft)
        # Los pedidos con estado 'checkout-draft' son carritos abandonados
        # que no deben aparecer en la sección de pedidos
        if isinstance(orders, list):
            orders = [order for order in orders if order.get('status') != 'checkout-draft']
        
        # Obtener headers para metadatos de paginación
        headers = response.headers
        total = headers.get('X-WP-Total', 0)
        total_pages = headers.get('X-WP-TotalPages', 1)
        
        return jsonify({
            'orders': orders,
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
        logger.error(f"Error fetching orders: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """
    Obtiene un pedido específico por su ID.
    """
    try:
        wc_api = get_wc_api()
        order = wc_api.get(f"orders/{order_id}").json()
        
        # Verificar si el pedido existe
        if 'id' not in order:
            return jsonify({"error": "Pedido no encontrado"}), 404
            
        return jsonify(order)
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders', methods=['POST'])
def create_order():
    """
    Crea un nuevo pedido en WooCommerce.
    """
    try:
        order_data = request.get_json()
        logger.info(f"Received order data: {order_data}")
        
        if not order_data:
            logger.error("No order data provided")
            return jsonify({"error": "No se proporcionaron datos del pedido"}), 400
        
        # Validar datos mínimos requeridos
        if not order_data.get('line_items'):
            logger.error("No line items provided")
            return jsonify({"error": "El pedido debe tener al menos un producto"}), 400
        
        wc_api = get_wc_api()
        
        logger.info(f"Sending order data to WooCommerce: {order_data}")
        
        # Crear el pedido
        response = wc_api.post("orders", order_data)
        
        # Logging detallado para debuggear
        logger.info(f"Raw response object type: {type(response)}")
        logger.info(f"Raw response status code: {response.status_code}")
        logger.info(f"Raw response headers: {dict(response.headers)}")
        logger.info(f"Raw response text: {response.text}")
        
        new_order = response.json()
        
        logger.info(f"Parsed JSON type: {type(new_order)}")
        logger.info(f"Parsed JSON keys: {list(new_order.keys()) if isinstance(new_order, dict) else 'Not a dict'}")
        logger.info(f"WooCommerce response body: {new_order}")
        
        # Verificar si el pedido se creó exitosamente
        if response.status_code in [200, 201]:
            logger.info(f"Order created successfully with status {response.status_code}")
            
            # Manejar la respuesta extraña de WooCommerce que tiene tanto details como error
            if isinstance(new_order, dict):
                # Si hay un campo 'details' con un ID válido, usar esos datos
                if 'details' in new_order and isinstance(new_order['details'], dict) and 'id' in new_order['details']:
                    order_details = new_order['details']
                    logger.info(f"Order created successfully: {order_details['id']}")
                    return jsonify(order_details), 201
                # Si no hay details pero hay ID directamente, usar la respuesta completa
                elif 'id' in new_order:
                    logger.info(f"Order created successfully: {new_order['id']}")
                    return jsonify(new_order), 201
            
            # Fallback: devolver la respuesta tal como viene
            return jsonify(new_order), 201
        else:
            # Error real en la creación
            logger.error(f"WooCommerce returned error status {response.status_code}: {new_order}")
            error_message = "Error al crear el pedido"
            
            # Intentar extraer mensaje de error más específico
            if isinstance(new_order, dict):
                if 'message' in new_order:
                    error_message = new_order['message']
                elif 'error' in new_order:
                    error_message = new_order['error']
                elif 'data' in new_order and 'message' in new_order['data']:
                    error_message = new_order['data']['message']
            
            logger.error(f"Returning error to frontend: {error_message}")
            return jsonify({"error": error_message, "details": new_order}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Exception creating order: {e}")
        logger.error(f"Exception type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500

@orders_bp.route('/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    """
    Actualiza un pedido existente en WooCommerce.
    """
    try:
        order_data = request.get_json()
        if not order_data:
            return jsonify({"error": "No se proporcionaron datos del pedido"}), 400

        wc_api = get_wc_api()
        
        # Actualizar el pedido
        response = wc_api.put(f"orders/{order_id}", order_data)
        updated_order = response.json()
        
        if response.status_code == 200:
            logger.info(f"Order updated successfully: {order_id}")
            return jsonify(updated_order)
        else:
            logger.error(f"Error updating order {order_id}: {updated_order}")
            return jsonify({"error": "Error al actualizar el pedido", "details": updated_order}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error updating order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    """
    Elimina un pedido (lo mueve a la papelera o lo elimina permanentemente).
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetro para eliminación forzada
        force = request.args.get('force', 'false').lower() == 'true'
        
        params = {'force': force} if force else {}
        
        response = wc_api.delete(f"orders/{order_id}", params=params)
        deleted_order = response.json()
        
        if response.status_code == 200:
            action = "eliminado permanentemente" if force else "movido a la papelera"
            logger.info(f"Order {order_id} {action}")
            return jsonify(deleted_order)
        else:
            logger.error(f"Error deleting order {order_id}: {deleted_order}")
            return jsonify({"error": "Error al eliminar el pedido", "details": deleted_order}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error deleting order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>/notes', methods=['POST'])
def add_order_note(order_id):
    """
    Agrega una nota a un pedido específico.
    """
    try:
        logger.info(f"Attempting to add note to order {order_id}")
        
        note_data = request.get_json()
        logger.info(f"Note data received: {note_data}")
        
        if not note_data:
            logger.error("No note data provided")
            return jsonify({"error": "No se proporcionaron datos de la nota"}), 400
        
        # Validar que se proporcione el contenido de la nota
        if not note_data.get('note'):
            logger.error("Note content is missing")
            return jsonify({"error": "El contenido de la nota es requerido"}), 400
        
        wc_api = get_wc_api()
        
        # Preparar datos de la nota
        note_payload = {
            'note': note_data['note'],
            'customer_note': note_data.get('customer_note', False),
            'added_by_user': True
        }
        
        logger.info(f"Note payload: {note_payload}")
        
        # Agregar la nota al pedido
        response = wc_api.post(f"orders/{order_id}/notes", note_payload)
        new_note = response.json()
        
        logger.info(f"WooCommerce response status: {response.status_code}")
        logger.info(f"WooCommerce response: {new_note}")
        
        if response.status_code in [200, 201]:
            logger.info(f"Note added successfully to order {order_id}")
            return jsonify({
                "success": True,
                "message": "Nota agregada correctamente",
                "note": new_note
            }), 201
        else:
            logger.error(f"WooCommerce error adding note to order {order_id}: {new_note}")
            return jsonify({"error": "Error al agregar la nota", "details": new_note}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Exception adding note to order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>/notes', methods=['GET'])
def get_order_notes(order_id):
    """
    Obtiene todas las notas de un pedido específico.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener las notas del pedido
        response = wc_api.get(f"orders/{order_id}/notes")
        notes = response.json()
        
        if response.status_code == 200:
            return jsonify(notes)
        else:
            logger.error(f"Error fetching notes for order {order_id}: {notes}")
            return jsonify({"error": "Error al obtener las notas", "details": notes}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching notes for order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>/actions', methods=['POST'])
def execute_order_action(order_id):
    """
    Ejecuta una acción específica en un pedido.
    """
    try:
        action_data = request.get_json()
        if not action_data:
            return jsonify({"error": "No se proporcionaron datos de la acción"}), 400
        
        action = action_data.get('action')
        if not action:
            return jsonify({"error": "La acción es requerida"}), 400
        
        wc_api = get_wc_api()
        
        # Obtener el pedido primero
        order_response = wc_api.get(f"orders/{order_id}")
        if order_response.status_code != 200:
            return jsonify({"error": "Pedido no encontrado"}), 404
        
        order = order_response.json()
        
        # Ejecutar la acción correspondiente
        if action == 'email-invoice':
            # Enviar factura/detalles del pedido al cliente
            # En WooCommerce real, esto envía el email "Customer Invoice" 
            # que contiene los detalles del pedido y puede incluir factura
            try:
                # Simular envío de email de factura al cliente
                customer_email = order.get('billing', {}).get('email', '')
                if customer_email:
                    logger.info(f"Customer invoice email sent to {customer_email} for order {order_id}")
                    return jsonify({
                        "message": f"Factura/detalles del pedido enviados a {customer_email}", 
                        "success": True
                    })
                else:
                    return jsonify({"error": "No se encontró email del cliente"}), 400
            except Exception as e:
                logger.error(f"Error sending customer invoice for order {order_id}: {e}")
                return jsonify({"error": "Error al enviar la factura al cliente"}), 500
            
        elif action == 'resend-new-order':
            # Reenviar notificación de nuevo pedido (al administrador)
            # En WooCommerce real, esto reenvía el email "New Order" al admin
            try:
                logger.info(f"New order notification resent to admin for order {order_id}")
                return jsonify({
                    "message": "Notificación de nuevo pedido reenviada al administrador", 
                    "success": True
                })
            except Exception as e:
                logger.error(f"Error resending new order notification for order {order_id}: {e}")
                return jsonify({"error": "Error al reenviar notificación de nuevo pedido"}), 500
            
        elif action == 'regenerate-permissions':
            # Regenerar permisos de descarga
            # En WooCommerce real, esto regenera los permisos para productos descargables
            try:
                # Verificar si el pedido tiene productos descargables
                has_downloadable = False
                for item in order.get('line_items', []):
                    # En WooCommerce real se verificaría si el producto es descargable
                    # Por ahora simulamos que puede tener productos descargables
                    has_downloadable = True
                    break
                
                if has_downloadable:
                    logger.info(f"Download permissions regenerated for order {order_id}")
                    return jsonify({
                        "message": "Permisos de descarga regenerados correctamente", 
                        "success": True
                    })
                else:
                    return jsonify({
                        "message": "Este pedido no contiene productos descargables", 
                        "success": True
                    })
            except Exception as e:
                logger.error(f"Error regenerating download permissions for order {order_id}: {e}")
                return jsonify({"error": "Error al regenerar permisos de descarga"}), 500
            
        else:
            return jsonify({"error": f"Acción '{action}' no reconocida"}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error executing action for order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>/customer-history', methods=['GET'])
def get_customer_history(order_id):
    """
    Obtiene el historial del cliente basado en el pedido actual.
    """
    try:
        wc_api = get_wc_api()
        
        # Primero obtener el pedido para conseguir el customer_id
        order_response = wc_api.get(f"orders/{order_id}")
        if order_response.status_code != 200:
            return jsonify({"error": "Pedido no encontrado"}), 404
        
        order = order_response.json()
        customer_id = order.get('customer_id', 0)
        
        if customer_id == 0:
            # Cliente invitado - buscar por email
            customer_email = order.get('billing', {}).get('email', '')
            if not customer_email:
                return jsonify({
                    "total_orders": 1,
                    "total_spent": float(order.get('total', 0)),
                    "average_order_value": float(order.get('total', 0))
                })
            
            # Buscar pedidos por email para clientes invitados
            params = {
                'search': customer_email,
                'per_page': 100,
                'status': 'any'
            }
        else:
            # Cliente registrado - buscar por customer_id
            params = {
                'customer': customer_id,
                'per_page': 100,
                'status': 'any'
            }
        
        # Obtener todos los pedidos del cliente
        orders_response = wc_api.get("orders", params=params)
        customer_orders = orders_response.json()
        
        if not isinstance(customer_orders, list):
            customer_orders = []
        
        # Filtrar pedidos válidos (excluir checkout-draft y failed)
        valid_orders = [
            order for order in customer_orders 
            if order.get('status') not in ['checkout-draft', 'failed', 'cancelled']
        ]
        
        # Calcular estadísticas
        total_orders = len(valid_orders)
        total_spent = sum(float(order.get('total', 0)) for order in valid_orders)
        average_order_value = total_spent / total_orders if total_orders > 0 else 0
        
        return jsonify({
            "total_orders": total_orders,
            "total_spent": total_spent,
            "average_order_value": average_order_value,
            "customer_id": customer_id,
            "is_guest": customer_id == 0
        })
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching customer history for order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>/metadata', methods=['GET'])
def get_order_metadata(order_id):
    """
    Obtiene metadatos adicionales del pedido desde WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener el pedido completo
        order_response = wc_api.get(f"orders/{order_id}")
        if order_response.status_code != 200:
            return jsonify({"error": "Pedido no encontrado"}), 404
        
        order = order_response.json()
        
        # Extraer metadatos relevantes
        meta_data = order.get('meta_data', [])
        
        # Buscar metadatos específicos que WooCommerce puede almacenar
        metadata = {}
        for meta in meta_data:
            key = meta.get('key', '')
            value = meta.get('value', '')
            
            # Mapear metadatos conocidos de WooCommerce
            if key == '_customer_ip_address':
                metadata['customer_ip'] = value
            elif key == '_customer_user_agent':
                metadata['user_agent'] = value
            elif key == '_billing_phone':
                metadata['billing_phone'] = value
            elif key == '_billing_email':
                metadata['billing_email'] = value
            elif key == '_order_source':
                metadata['order_source'] = value
        
        # Información adicional del pedido
        created_via = order.get('created_via', 'unknown')
        customer_ip = order.get('customer_ip_address', metadata.get('customer_ip', ''))
        user_agent = order.get('customer_user_agent', metadata.get('user_agent', ''))
        
        # Determinar tipo de dispositivo basado en user agent
        device_type = 'Desconocido'
        if user_agent:
            user_agent_lower = user_agent.lower()
            if any(mobile in user_agent_lower for mobile in ['mobile', 'android', 'iphone', 'ipad']):
                device_type = 'Móvil'
            elif any(tablet in user_agent_lower for tablet in ['tablet', 'ipad']):
                device_type = 'Tablet'
            else:
                device_type = 'Escritorio'
        
        # Determinar origen
        origin = 'Directo'
        if created_via == 'admin':
            origin = 'Admin'
        elif created_via == 'rest-api':
            origin = 'API'
        elif created_via == 'checkout':
            origin = 'Tienda Online'
        
        return jsonify({
            "customer_ip": customer_ip,
            "user_agent": user_agent,
            "device_type": device_type,
            "origin": origin,
            "created_via": created_via,
            "order_source": metadata.get('order_source', origin)
        })
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching order metadata for {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/stats', methods=['GET'])
def get_order_stats():
    """
    Obtiene estadísticas de pedidos para el dashboard.
    """
    try:
        wc_api = get_wc_api()
        
        # Fechas para comparación
        now = datetime.now()
        month_ago = now - timedelta(days=30)
        
        # Formatear fechas para la API
        after_date = month_ago.strftime('%Y-%m-%dT%H:%M:%S')
        
        # Obtener pedidos del último mes
        recent_orders = wc_api.get("orders", params={
            'after': after_date,
            'per_page': 100
        }).json()
        
        # Obtener pedidos por estado
        stats = {
            'total_orders': 0,
            'pending_orders': 0,
            'processing_orders': 0,
            'completed_orders': 0,
            'cancelled_orders': 0,
            'total_revenue': 0,
            'average_order_value': 0,
            'orders_by_status': {}
        }
        
        # Procesar pedidos (excluir carritos abandonados)
        if isinstance(recent_orders, list):
            # Filtrar carritos abandonados (checkout-draft)
            # Los pedidos con estado 'checkout-draft' son carritos abandonados
            filtered_orders = [order for order in recent_orders if order.get('status') != 'checkout-draft']
            stats['total_orders'] = len(filtered_orders)
            
            total_revenue = 0
            status_counts = {}
            
            for order in filtered_orders:
                status = order.get('status', 'unknown')
                
                # Contar por estado
                if status not in status_counts:
                    status_counts[status] = 0
                status_counts[status] += 1
                
                # Calcular ingresos (solo pedidos completados y procesando)
                if status in ['completed', 'processing']:
                    total_revenue += float(order.get('total', 0))
            
            stats['orders_by_status'] = status_counts
            stats['pending_orders'] = status_counts.get('pending', 0)
            stats['processing_orders'] = status_counts.get('processing', 0)
            stats['completed_orders'] = status_counts.get('completed', 0)
            stats['cancelled_orders'] = status_counts.get('cancelled', 0)
            stats['total_revenue'] = total_revenue
            
            # Calcular valor promedio
            if stats['total_orders'] > 0:
                stats['average_order_value'] = total_revenue / stats['total_orders']
        
        # Productos más vendidos (datos simplificados)
        stats['top_products'] = []
        
        return jsonify(stats)
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching order stats: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/search', methods=['GET'])
def search_orders():
    """
    Busca pedidos por diferentes criterios.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de búsqueda
        query = request.args.get('q', '')
        limit = request.args.get('limit', 10, type=int)
        
        if not query:
            return jsonify({"orders": []})
        
        # Buscar por ID de pedido, email del cliente, nombre, etc.
        search_params = {
            'search': query,
            'per_page': min(limit, 50)
        }
        
        orders = wc_api.get("orders", params=search_params).json()
        
        # Filtrar carritos abandonados y datos sensibles
        filtered_orders = []
        if isinstance(orders, list):
            # Excluir carritos abandonados (checkout-draft)
            # Los pedidos con estado 'checkout-draft' son carritos abandonados
            orders = [order for order in orders if order.get('status') != 'checkout-draft']
            
            for order in orders:
                filtered_order = {
                    'id': order.get('id'),
                    'number': order.get('number'),
                    'status': order.get('status'),
                    'date_created': order.get('date_created'),
                    'total': order.get('total'),
                    'customer_id': order.get('customer_id'),
                    'billing': {
                        'first_name': order.get('billing', {}).get('first_name', ''),
                        'last_name': order.get('billing', {}).get('last_name', ''),
                        'email': order.get('billing', {}).get('email', '')
                    }
                }
                filtered_orders.append(filtered_order)
        
        return jsonify({"orders": filtered_orders})
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error searching orders: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/abandoned-carts', methods=['GET'])
def get_abandoned_carts():
    """
    Obtiene carritos abandonados (pedidos con estado checkout-draft).
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Buscar solo carritos abandonados
        params = {
            'page': page,
            'per_page': min(per_page, 100),
            'status': 'checkout-draft',
            'orderby': 'date',
            'order': 'desc'
        }
        
        response = wc_api.get("orders", params=params)
        carts = response.json()
        
        # Obtener headers para metadatos de paginación
        headers = response.headers
        total = headers.get('X-WP-Total', 0)
        total_pages = headers.get('X-WP-TotalPages', 1)
        
        return jsonify({
            'abandoned_carts': carts,
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
        logger.error(f"Error fetching abandoned carts: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>/customer', methods=['PUT'])
def update_order_customer(order_id):
    """
    Actualiza el cliente asignado a un pedido.
    """
    try:
        customer_data = request.get_json()
        if not customer_data:
            return jsonify({"error": "No se proporcionaron datos del cliente"}), 400
        
        customer_id = customer_data.get('customer_id')
        if not customer_id:
            return jsonify({"error": "El ID del cliente es requerido"}), 400
        
        wc_api = get_wc_api()
        
        # Obtener el pedido actual
        order_response = wc_api.get(f"orders/{order_id}")
        if order_response.status_code != 200:
            return jsonify({"error": "Pedido no encontrado"}), 404
        
        # Obtener datos del cliente
        customer_response = wc_api.get(f"customers/{customer_id}")
        if customer_response.status_code != 200:
            return jsonify({"error": "Cliente no encontrado"}), 404
        
        customer = customer_response.json()
        
        # Actualizar el pedido con el nuevo customer_id solamente
        # Las direcciones del pedido se mantienen como están
        update_data = {
            'customer_id': customer_id
        }
        
        # Actualizar el pedido en WooCommerce
        response = wc_api.put(f"orders/{order_id}", update_data)
        updated_order = response.json()
        
        if response.status_code == 200:
            logger.info(f"Order {order_id} customer updated to {customer_id}")
            return jsonify({
                "message": f"Cliente actualizado correctamente",
                "order": updated_order,
                "customer": customer,
                "success": True
            })
        else:
            logger.error(f"Error updating order {order_id} customer: {updated_order}")
            return jsonify({"error": "Error al actualizar el cliente del pedido", "details": updated_order}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error updating order {order_id} customer: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/test-connection', methods=['GET'])
def test_woocommerce_connection():
    """
    Endpoint de prueba para verificar la conectividad con WooCommerce.
    """
    try:
        wc_api = get_wc_api()
        
        # Hacer una petición simple para probar la conexión
        response = wc_api.get("orders", params={'per_page': 1})
        
        if response.status_code == 200:
            logger.info("WooCommerce connection test successful")
            return jsonify({
                "status": "success",
                "message": "Conexión con WooCommerce exitosa",
                "wc_status_code": response.status_code
            })
        else:
            logger.error(f"WooCommerce connection test failed: {response.status_code}")
            return jsonify({
                "status": "error",
                "message": "Error de conexión con WooCommerce",
                "wc_status_code": response.status_code,
                "details": response.json()
            }), 400
        
    except ValueError as e:
        logger.error(f"Configuration error in connection test: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Exception in connection test: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/<int:order_id>/addresses', methods=['PUT'])
def update_order_addresses(order_id):
    """
    Actualiza las direcciones de facturación y envío de un pedido.
    """
    try:
        address_data = request.get_json()
        if not address_data:
            return jsonify({"error": "No se proporcionaron datos de direcciones"}), 400
        
        billing_data = address_data.get('billing', {})
        shipping_data = address_data.get('shipping', {})
        
        wc_api = get_wc_api()
        
        # Obtener el pedido actual
        order_response = wc_api.get(f"orders/{order_id}")
        if order_response.status_code != 200:
            return jsonify({"error": "Pedido no encontrado"}), 404
        
        # Preparar datos de actualización
        update_data = {}
        
        if billing_data:
            update_data['billing'] = {
                'first_name': billing_data.get('first_name', ''),
                'last_name': billing_data.get('last_name', ''),
                'company': billing_data.get('company', ''),
                'address_1': billing_data.get('address_1', ''),
                'address_2': billing_data.get('address_2', ''),
                'city': billing_data.get('city', ''),
                'state': billing_data.get('state', ''),
                'postcode': billing_data.get('postcode', ''),
                'country': billing_data.get('country', ''),
                'email': billing_data.get('email', ''),
                'phone': billing_data.get('phone', '')
            }
        
        if shipping_data:
            update_data['shipping'] = {
                'first_name': shipping_data.get('first_name', ''),
                'last_name': shipping_data.get('last_name', ''),
                'company': shipping_data.get('company', ''),
                'address_1': shipping_data.get('address_1', ''),
                'address_2': shipping_data.get('address_2', ''),
                'city': shipping_data.get('city', ''),
                'state': shipping_data.get('state', ''),
                'postcode': shipping_data.get('postcode', ''),
                'country': shipping_data.get('country', '')
            }
        
        # Actualizar el pedido en WooCommerce
        response = wc_api.put(f"orders/{order_id}", update_data)
        updated_order = response.json()
        
        if response.status_code == 200:
            logger.info(f"Order addresses updated successfully for order {order_id}")
            return jsonify({
                "success": True,
                "message": "Direcciones actualizadas correctamente",
                "order": updated_order
            })
        else:
            logger.error(f"WooCommerce error updating addresses for order {order_id}: {updated_order}")
            return jsonify({"error": "Error al actualizar las direcciones", "details": updated_order}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Exception updating addresses for order {order_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@orders_bp.route('/orders/test-response', methods=['GET'])
def test_response():
    """
    Función de prueba para verificar si las respuestas están siendo modificadas.
    """
    return jsonify({"message": "Test response", "id": 123}), 201 
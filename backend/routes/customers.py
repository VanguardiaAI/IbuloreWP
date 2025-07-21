from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api
import logging

customers_bp = Blueprint('customers_bp', __name__)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@customers_bp.route('/customers', methods=['GET'])
def get_customers():
    """
    Obtiene la lista de clientes desde WooCommerce con filtros opcionales.
    Incluye tanto clientes registrados como clientes invitados (guest customers) de pedidos.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search')
        email = request.args.get('email')
        role = request.args.get('role', 'all')
        orderby = request.args.get('orderby', 'id')
        order = request.args.get('order', 'desc')
        
        # 1. Obtener clientes registrados
        registered_customers = []
        try:
            params = {
                'page': 1,
                'per_page': 100,  # Obtener todos los clientes registrados
                'orderby': orderby,
                'order': order,
                'role': 'all'  # Incluir todos los roles
            }
            
            if search:
                params['search'] = search
            if email:
                params['email'] = email
                
            response = wc_api.get("customers", params=params)
            registered_customers = response.json() if isinstance(response.json(), list) else []
            
            # Obtener información de último pedido para clientes registrados
            for customer in registered_customers:
                try:
                    customer_orders_response = wc_api.get("orders", params={
                        'customer': customer.get('id'),
                        'per_page': 1,
                        'orderby': 'date',
                        'order': 'desc'
                    })
                    customer_orders = customer_orders_response.json()
                    if customer_orders and len(customer_orders) > 0:
                        customer['last_order_date'] = customer_orders[0].get('date_created')
                    else:
                        customer['last_order_date'] = None
                except Exception as order_error:
                    logger.warning(f"Error fetching last order for customer {customer.get('id')}: {order_error}")
                    customer['last_order_date'] = None
                    
        except Exception as e:
            logger.warning(f"Error fetching registered customers: {e}")
        
        # 2. Obtener clientes invitados de pedidos
        guest_customers = []
        try:
            # Obtener pedidos para extraer clientes invitados
            orders_response = wc_api.get("orders", params={'per_page': 100, 'customer': 0})
            orders = orders_response.json() if isinstance(orders_response.json(), list) else []
            
            # Crear diccionario para evitar duplicados por email
            guest_customers_dict = {}
            
            for order in orders:
                billing = order.get('billing', {})
                email_addr = billing.get('email', '').strip().lower()
                
                if email_addr and email_addr not in guest_customers_dict:
                    # Verificar que no sea un cliente registrado CON ROL CUSTOMER
                    # Si es administrador pero hizo una compra como invitado, lo incluimos como invitado también
                    is_customer = any(c.get('email', '').lower() == email_addr and c.get('role') == 'customer' for c in registered_customers)
                    
                    if not is_customer:
                        # Calcular estadísticas del cliente invitado
                        customer_orders = [o for o in orders if o.get('billing', {}).get('email', '').lower() == email_addr]
                        orders_count = len(customer_orders)
                        total_spent = sum(float(o.get('total', 0)) for o in customer_orders if o.get('status') in ['completed', 'processing'])
                        
                        # Ordenar pedidos por fecha para obtener el primero y último
                        customer_orders_sorted = sorted(customer_orders, key=lambda x: x.get('date_created', ''))
                        last_order_date = customer_orders_sorted[-1].get('date_created') if customer_orders_sorted else ''
                        
                        guest_customer = {
                            'id': f"guest_{email_addr.replace('@', '_').replace('.', '_')}",  # ID único para invitados
                            'first_name': billing.get('first_name', ''),
                            'last_name': billing.get('last_name', ''),
                            'email': billing.get('email', ''),
                            'username': '',
                            'role': 'guest',
                            'date_created': customer_orders_sorted[0].get('date_created') if customer_orders_sorted else '',
                            'date_modified': customer_orders_sorted[-1].get('date_modified') if customer_orders_sorted else '',
                            'last_order_date': last_order_date,
                            'is_paying_customer': total_spent > 0,
                            'orders_count': orders_count,
                            'total_spent': str(total_spent),
                            'avatar_url': '',
                            'billing': billing,
                            'shipping': order.get('shipping', {}),
                            '_links': {'self': [{'href': f'guest_customer_{email_addr}'}]}
                        }
                        guest_customers_dict[email_addr] = guest_customer
            
            guest_customers = list(guest_customers_dict.values())
            
        except Exception as e:
            logger.warning(f"Error fetching guest customers: {e}")
        
        # 3. Combinar clientes registrados y invitados
        all_customers = registered_customers + guest_customers
        
        # 4. Aplicar filtros de búsqueda si es necesario
        if search:
            search_lower = search.lower()
            all_customers = [
                c for c in all_customers
                if (search_lower in c.get('first_name', '').lower() or
                    search_lower in c.get('last_name', '').lower() or
                    search_lower in c.get('email', '').lower() or
                    search_lower in c.get('username', '').lower())
            ]
        
        if email:
            email_lower = email.lower()
            all_customers = [c for c in all_customers if c.get('email', '').lower() == email_lower]
        
        # 5. Ordenar resultados
        if orderby == 'date':
            all_customers.sort(key=lambda x: x.get('date_created', ''), reverse=(order == 'desc'))
        elif orderby == 'name':
            all_customers.sort(key=lambda x: f"{x.get('first_name', '')} {x.get('last_name', '')}".strip(), reverse=(order == 'desc'))
        elif orderby == 'email':
            all_customers.sort(key=lambda x: x.get('email', ''), reverse=(order == 'desc'))
        
        # 6. Aplicar paginación
        total_customers = len(all_customers)
        start_index = (page - 1) * per_page
        end_index = start_index + per_page
        paginated_customers = all_customers[start_index:end_index]
        
        total_pages = (total_customers + per_page - 1) // per_page
        
        return jsonify({
            'customers': paginated_customers,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_customers,
                'total_pages': total_pages
            }
        })
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching customers: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@customers_bp.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """
    Obtiene un cliente específico por su ID.
    """
    try:
        wc_api = get_wc_api()
        customer = wc_api.get(f"customers/{customer_id}").json()
        
        # Verificar si el cliente existe
        if 'id' not in customer:
            return jsonify({"error": "Cliente no encontrado"}), 404
            
        return jsonify(customer)
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching customer {customer_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@customers_bp.route('/customers', methods=['POST'])
def create_customer():
    """
    Crea un nuevo cliente en WooCommerce.
    """
    try:
        customer_data = request.get_json()
        if not customer_data:
            return jsonify({"error": "No se proporcionaron datos del cliente"}), 400
        
        # Validar email requerido
        if not customer_data.get('email'):
            return jsonify({"error": "El email es obligatorio"}), 400
        
        wc_api = get_wc_api()
        
        # Crear el cliente
        response = wc_api.post("customers", customer_data)
        new_customer = response.json()
        
        if response.status_code == 201:
            logger.info(f"Customer created successfully: {new_customer.get('id')}")
            return jsonify(new_customer), 201
        else:
            logger.error(f"Error creating customer: {new_customer}")
            return jsonify({"error": "Error al crear el cliente", "details": new_customer}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@customers_bp.route('/customers/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """
    Actualiza un cliente existente en WooCommerce.
    """
    try:
        customer_data = request.get_json()
        if not customer_data:
            return jsonify({"error": "No se proporcionaron datos del cliente"}), 400

        wc_api = get_wc_api()
        
        # Actualizar el cliente
        response = wc_api.put(f"customers/{customer_id}", customer_data)
        updated_customer = response.json()
        
        if response.status_code == 200:
            logger.info(f"Customer updated successfully: {customer_id}")
            return jsonify(updated_customer)
        else:
            logger.error(f"Error updating customer {customer_id}: {updated_customer}")
            return jsonify({"error": "Error al actualizar el cliente", "details": updated_customer}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error updating customer {customer_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@customers_bp.route('/customers/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """
    Elimina un cliente (lo mueve a la papelera o lo elimina permanentemente).
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetro para eliminación forzada
        force = request.args.get('force', 'false').lower() == 'true'
        reassign = request.args.get('reassign', type=int)  # Reasignar pedidos a otro usuario
        
        params = {}
        if force:
            params['force'] = force
        if reassign:
            params['reassign'] = reassign
        
        response = wc_api.delete(f"customers/{customer_id}", params=params)
        deleted_customer = response.json()
        
        if response.status_code == 200:
            action = "eliminado permanentemente" if force else "movido a la papelera"
            logger.info(f"Customer {customer_id} {action}")
            return jsonify(deleted_customer)
        else:
            logger.error(f"Error deleting customer {customer_id}: {deleted_customer}")
            return jsonify({"error": "Error al eliminar el cliente", "details": deleted_customer}), 400
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error deleting customer {customer_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@customers_bp.route('/customers/search', methods=['GET'])
def search_customers():
    """
    Busca clientes por diferentes criterios (nombre, email, etc.).
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de búsqueda
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not query:
            return jsonify({"customers": []})
        
        logger.info(f"Searching customers with query: '{query}'")
        
        # 1. Obtener clientes registrados
        registered_customers = []
        try:
            params = {
                'page': 1,
                'per_page': 100,
                'role': 'all'  # Incluir todos los roles
            }
            response = wc_api.get("customers", params=params)
            registered_customers = response.json() if isinstance(response.json(), list) else []
            
            # Obtener información de último pedido para clientes registrados
            for customer in registered_customers:
                try:
                    customer_orders_response = wc_api.get("orders", params={
                        'customer': customer.get('id'),
                        'per_page': 1,
                        'orderby': 'date',
                        'order': 'desc'
                    })
                    customer_orders = customer_orders_response.json()
                    if customer_orders and len(customer_orders) > 0:
                        customer['last_order_date'] = customer_orders[0].get('date_created')
                    else:
                        customer['last_order_date'] = None
                except Exception as order_error:
                    logger.warning(f"Error fetching last order for customer {customer.get('id')}: {order_error}")
                    customer['last_order_date'] = None
                    
        except Exception as e:
            logger.warning(f"Error fetching registered customers: {e}")
        
        # 2. Obtener clientes invitados de pedidos
        guest_customers = []
        try:
            orders_response = wc_api.get("orders", params={'per_page': 100, 'customer': 0})
            orders = orders_response.json() if isinstance(orders_response.json(), list) else []
            
            guest_customers_dict = {}
            
            for order in orders:
                billing = order.get('billing', {})
                email_addr = billing.get('email', '').strip().lower()
                
                if email_addr and email_addr not in guest_customers_dict:
                    # Verificar que no sea un cliente registrado CON ROL CUSTOMER
                    is_customer = any(c.get('email', '').lower() == email_addr and c.get('role') == 'customer' for c in registered_customers)
                    
                    if not is_customer:
                        customer_orders = [o for o in orders if o.get('billing', {}).get('email', '').lower() == email_addr]
                        orders_count = len(customer_orders)
                        total_spent = sum(float(o.get('total', 0)) for o in customer_orders if o.get('status') in ['completed', 'processing'])
                        
                        # Ordenar pedidos por fecha para obtener el primero y último
                        customer_orders_sorted = sorted(customer_orders, key=lambda x: x.get('date_created', ''))
                        last_order_date = customer_orders_sorted[-1].get('date_created') if customer_orders_sorted else ''
                        
                        guest_customer = {
                            'id': f"guest_{email_addr.replace('@', '_').replace('.', '_')}",
                            'first_name': billing.get('first_name', ''),
                            'last_name': billing.get('last_name', ''),
                            'email': billing.get('email', ''),
                            'username': '',
                            'role': 'guest',
                            'date_created': customer_orders_sorted[0].get('date_created') if customer_orders_sorted else '',
                            'date_modified': customer_orders_sorted[-1].get('date_modified') if customer_orders_sorted else '',
                            'last_order_date': last_order_date,
                            'is_paying_customer': total_spent > 0,
                            'orders_count': orders_count,
                            'total_spent': str(total_spent),
                            'avatar_url': '',
                            'billing': billing,
                            'shipping': order.get('shipping', {})
                        }
                        guest_customers_dict[email_addr] = guest_customer
            
            guest_customers = list(guest_customers_dict.values())
            
        except Exception as e:
            logger.warning(f"Error fetching guest customers: {e}")
        
        # 3. Combinar clientes registrados y invitados
        all_customers = registered_customers + guest_customers
        
        if not isinstance(all_customers, list):
            logger.error(f"Expected list of customers, got: {type(all_customers)}")
            return jsonify({"customers": []})
        
        # 4. Filtrar localmente por nombre, apellido o email
        filtered_customers = []
        query_lower = query.lower()
        
        logger.info(f"Filtering {len(all_customers)} customers with query_lower: '{query_lower}'")
        
        for customer in all_customers:
            first_name = (customer.get('first_name', '') or '').lower()
            last_name = (customer.get('last_name', '') or '').lower()
            email = (customer.get('email', '') or '').lower()
            username = (customer.get('username', '') or '').lower()
            full_name = f"{first_name} {last_name}".strip()
            
            logger.info(f"Checking customer {customer.get('id')}: first_name='{first_name}', last_name='{last_name}', email='{email}', username='{username}', full_name='{full_name}'")
            
            # Buscar en cualquiera de los campos
            if (query_lower in first_name or 
                query_lower in last_name or 
                query_lower in email or 
                query_lower in username or
                query_lower in full_name):
                
                logger.info(f"MATCH FOUND for customer {customer.get('id')}")
                
                # Formatear el cliente para la respuesta
                filtered_customer = {
                    'id': customer.get('id'),
                    'first_name': customer.get('first_name', ''),
                    'last_name': customer.get('last_name', ''),
                    'name': f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
                    'email': customer.get('email', ''),
                    'username': customer.get('username', ''),
                    'date_created': customer.get('date_created'),
                    'orders_count': customer.get('orders_count', 0),
                    'total_spent': float(customer.get('total_spent', 0.0)),
                    'avatar_url': customer.get('avatar_url', ''),
                    'billing': customer.get('billing', {}),
                    'shipping': customer.get('shipping', {}),
                    'role': customer.get('role', 'customer')
                }
                filtered_customers.append(filtered_customer)
                
                # Limitar resultados
                if len(filtered_customers) >= limit:
                    break
        
        logger.info(f"Found {len(filtered_customers)} customers matching '{query}'")
        return jsonify({"customers": filtered_customers})
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error searching customers: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@customers_bp.route('/customers/<int:customer_id>/orders', methods=['GET'])
def get_customer_orders(customer_id):
    """
    Obtiene los pedidos de un cliente específico.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener parámetros de consulta
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        
        params = {
            'customer': customer_id,
            'page': page,
            'per_page': min(per_page, 100),
            'orderby': 'date',
            'order': 'desc'
        }
        
        if status:
            params['status'] = status
        
        response = wc_api.get("orders", params=params)
        orders = response.json()
        
        # Obtener headers para metadatos de paginación
        headers = response.headers
        total = headers.get('X-WP-Total', 0)
        total_pages = headers.get('X-WP-TotalPages', 1)
        
        return jsonify({
            'orders': orders,
            'customer_id': customer_id,
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
        logger.error(f"Error fetching orders for customer {customer_id}: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500 
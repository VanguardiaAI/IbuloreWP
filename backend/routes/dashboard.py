from flask import Blueprint, jsonify, request
from utils.woocommerce_api import get_wc_api
from datetime import datetime, timedelta
import logging

dashboard_bp = Blueprint('dashboard_bp', __name__)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Obtiene todas las estadísticas necesarias para el dashboard principal.
    Incluye ventas, pedidos, productos, clientes y actividad reciente.
    """
    try:
        wc_api = get_wc_api()
        
        # Fechas para comparación
        now = datetime.now()
        month_ago = now - timedelta(days=30)
        year_ago = now - timedelta(days=365)
        
        # Formatear fechas para la API
        after_month = month_ago.strftime('%Y-%m-%dT%H:%M:%S')
        after_year = year_ago.strftime('%Y-%m-%dT%H:%M:%S')
        
        # 1. Obtener estadísticas de pedidos
        recent_orders_response = wc_api.get("orders", params={
            'after': after_month,
            'per_page': 100,
            'status': 'any'
        })
        recent_orders = recent_orders_response.json()
        
        # Filtrar carritos abandonados
        if isinstance(recent_orders, list):
            recent_orders = [order for order in recent_orders if order.get('status') != 'checkout-draft']
        
        # Calcular estadísticas de pedidos
        total_orders = len(recent_orders)
        total_revenue = 0
        completed_orders = 0
        
        for order in recent_orders:
            status = order.get('status', '')
            if status in ['completed', 'processing']:
                total_revenue += float(order.get('total', 0))
                if status == 'completed':
                    completed_orders += 1
        
        # Calcular cambio porcentual (simulado por ahora)
        revenue_change = 20.1  # En el futuro, comparar con mes anterior
        orders_change = 180.1
        
        # 2. Obtener total de productos
        products_response = wc_api.get("products", params={
            'per_page': 1,
            'page': 1
        })
        total_products = int(products_response.headers.get('X-WP-Total', 0))
        
        # Obtener productos recientes
        recent_products_response = wc_api.get("products", params={
            'per_page': 5,
            'orderby': 'date',
            'order': 'desc'
        })
        recent_products = recent_products_response.json()
        
        # 3. Obtener total de clientes
        customers_response = wc_api.get("customers", params={
            'per_page': 1,
            'page': 1
        })
        total_customers = int(customers_response.headers.get('X-WP-Total', 0))
        
        # Obtener clientes recientes
        recent_customers_response = wc_api.get("customers", params={
            'per_page': 10,
            'orderby': 'registered_date',
            'order': 'desc'
        })
        recent_customers = recent_customers_response.json()
        
        # Contar clientes nuevos del último mes
        new_customers_month = 0
        if isinstance(recent_customers, list):
            for customer in recent_customers:
                registered_date = customer.get('date_created', '')
                if registered_date:
                    try:
                        customer_date = datetime.fromisoformat(registered_date.replace('Z', '+00:00'))
                        if customer_date > month_ago:
                            new_customers_month += 1
                    except:
                        pass
        
        # 4. Preparar actividad reciente
        recent_activity = []
        
        # Agregar pedidos recientes a la actividad
        if isinstance(recent_orders, list):
            for order in recent_orders[:3]:  # Solo los 3 más recientes
                created_date = order.get('date_created', '')
                if created_date:
                    try:
                        order_date = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
                        time_diff = now - order_date
                        
                        if time_diff.days > 0:
                            time_ago = f"Hace {time_diff.days} día{'s' if time_diff.days > 1 else ''}"
                        elif time_diff.seconds > 3600:
                            hours = time_diff.seconds // 3600
                            time_ago = f"Hace {hours} hora{'s' if hours > 1 else ''}"
                        else:
                            minutes = time_diff.seconds // 60
                            time_ago = f"Hace {minutes} minuto{'s' if minutes > 1 else ''}"
                        
                        recent_activity.append({
                            'type': 'order',
                            'title': f"Nuevo pedido #{order.get('number', order.get('id'))}",
                            'time': time_ago,
                            'status': order.get('status', 'pending')
                        })
                    except:
                        pass
        
        # Agregar productos actualizados a la actividad
        if isinstance(recent_products, list):
            for product in recent_products[:2]:  # Solo los 2 más recientes
                modified_date = product.get('date_modified', product.get('date_created', ''))
                if modified_date:
                    try:
                        product_date = datetime.fromisoformat(modified_date.replace('Z', '+00:00'))
                        time_diff = now - product_date
                        
                        if time_diff.days == 0 and time_diff.seconds < 3600:
                            minutes = time_diff.seconds // 60
                            time_ago = f"Hace {minutes} minuto{'s' if minutes > 1 else ''}"
                            recent_activity.append({
                                'type': 'product',
                                'title': f"Producto actualizado: {product.get('name', 'Sin nombre')}",
                                'time': time_ago,
                                'status': 'updated'
                            })
                    except:
                        pass
        
        # 5. Obtener datos para el gráfico de ventas (últimos 12 meses)
        sales_chart_data = []
        for i in range(12):
            month_start = now - timedelta(days=30 * (12 - i))
            month_end = now - timedelta(days=30 * (11 - i))
            
            # Por ahora, datos simulados. En el futuro, hacer consultas reales por mes
            month_revenue = total_revenue * (0.8 + (i * 0.02))  # Crecimiento simulado
            
            sales_chart_data.append({
                'month': month_start.strftime('%B %Y'),
                'revenue': round(month_revenue, 2)
            })
        
        # 6. Preparar respuesta final
        stats = {
            'sales': {
                'total': total_revenue,
                'change': revenue_change,
                'currency': 'MXN'  # En el futuro, obtener de configuración WC
            },
            'orders': {
                'total': total_orders,
                'change': orders_change,
                'completed': completed_orders
            },
            'products': {
                'total': total_products,
                'change': 19.0  # Simulado por ahora
            },
            'customers': {
                'total': total_customers,
                'new_this_month': new_customers_month,
                'change': new_customers_month  # Por ahora
            },
            'recent_activity': recent_activity[:5],  # Máximo 5 items
            'sales_chart': sales_chart_data
        }
        
        return jsonify(stats)
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@dashboard_bp.route('/dashboard/quick-stats', methods=['GET'])
def get_quick_stats():
    """
    Obtiene estadísticas rápidas para actualización en tiempo real.
    Versión más ligera que /dashboard/stats.
    """
    try:
        wc_api = get_wc_api()
        
        # Obtener solo conteos básicos
        orders_response = wc_api.get("orders", params={
            'per_page': 1,
            'status': 'any'
        })
        
        products_response = wc_api.get("products", params={
            'per_page': 1
        })
        
        customers_response = wc_api.get("customers", params={
            'per_page': 1
        })
        
        # Obtener totales de headers
        total_orders = int(orders_response.headers.get('X-WP-Total', 0))
        total_products = int(products_response.headers.get('X-WP-Total', 0))
        total_customers = int(customers_response.headers.get('X-WP-Total', 0))
        
        return jsonify({
            'orders': total_orders,
            'products': total_products,
            'customers': total_customers,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching quick stats: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500
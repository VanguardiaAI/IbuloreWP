from flask import Blueprint, request, jsonify
import json

webhooks_bp = Blueprint('webhooks_bp', __name__)

@webhooks_bp.route('/webhooks/orders', methods=['POST'])
def handle_order_webhook():
    """
    Handles order-related webhooks from WooCommerce.
    """
    data = request.get_json()
    
    # Process the webhook data here
    # For now, we'll just print it to the console
    print("Received order webhook:")
    print(json.dumps(data, indent=2))
    
    # You should add your logic here to process the order update.
    # For example, update your own database, send notifications, etc.

    return jsonify({"status": "received"}), 200 
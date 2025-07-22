from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.products import products_bp
from routes.products_search import products_search_bp
from routes.orders import orders_bp
from routes.customers import customers_bp
from routes.webhooks import webhooks_bp
from routes.media import media_bp
from routes.categories import categories_bp
from routes.attributes import attributes_bp
from routes.inventory import inventory_bp
from routes.orishas import orishas_bp
from routes.blog import blog_bp


def create_app():
    """
    Creates and configures a Flask application.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for the React frontend - más permisivo para desarrollo
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints
    app.register_blueprint(products_bp, url_prefix='/api')
    app.register_blueprint(products_search_bp, url_prefix='/api')
    app.register_blueprint(orders_bp, url_prefix='/api')
    app.register_blueprint(customers_bp, url_prefix='/api')
    app.register_blueprint(webhooks_bp, url_prefix='/api')
    app.register_blueprint(media_bp, url_prefix='/api')
    app.register_blueprint(categories_bp, url_prefix='/api')
    app.register_blueprint(attributes_bp, url_prefix='/api')
    app.register_blueprint(inventory_bp, url_prefix='/api')
    app.register_blueprint(orishas_bp, url_prefix='/api')
    app.register_blueprint(blog_bp, url_prefix='/api')


    @app.route("/")
    def index():
        return jsonify({"message": "Welcome to the IbuloreWP Backend!"})

    return app

# Create app instance for Gunicorn
app = create_app()

if __name__ == "__main__":
    print(f"Flask debug mode: {app.config.get('FLASK_DEBUG')}")
    print(f"WC Store URL: {app.config.get('WC_STORE_URL')}")
    print(f"WC Consumer Key: {app.config.get('WC_CONSUMER_KEY')[:10] if app.config.get('WC_CONSUMER_KEY') else 'Not set'}...")
    app.run(debug=app.config['FLASK_DEBUG'], port=5001) 
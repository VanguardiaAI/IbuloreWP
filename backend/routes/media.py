import os
from flask import Blueprint, request, jsonify
import requests
from requests.auth import HTTPBasicAuth
from werkzeug.utils import secure_filename

from config import Config

media_bp = Blueprint('media_bp', __name__)

WP_URL = Config.WC_STORE_URL
# Credenciales específicas para la API de Medios de WP
WP_AUTH_USER = Config.WP_USER_LOGIN
WP_AUTH_PASS = Config.WP_APPLICATION_PASSWORD
# Credenciales de fallback (API de WC)
WC_API_KEY = Config.WC_CONSUMER_KEY
WC_API_SECRET = Config.WC_CONSUMER_SECRET

print(WP_AUTH_USER)

@media_bp.route('/media/upload', methods=['POST'])
def upload_media():
    """
    Uploads an image to the WordPress Media Library.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        media_endpoint = f"{WP_URL}/wp-json/wp/v2/media"
        
        if WP_AUTH_USER and WP_AUTH_PASS:
            auth = HTTPBasicAuth(WP_AUTH_USER, WP_AUTH_PASS)
        else:
            auth = HTTPBasicAuth(WC_API_KEY, WC_API_SECRET)
            print("WARN: Using WC API keys for media upload.")

        # Establecer la cabecera del nombre del archivo es crucial
        headers = {
            'Content-Disposition': f'attachment; filename={filename}'
        }

        try:
            # Enviar el archivo usando el parámetro `files` para multipart/form-data
            # No es necesario establecer Content-Type, `requests` lo hace por nosotros.
            response = requests.post(
                media_endpoint, 
                headers=headers,
                files={'file': (filename, file.stream, file.mimetype)},
                auth=auth,
                timeout=30
            )
            
            print(f"WP Media API Response Status: {response.status_code}")
            print(f"WP Media API Response Body: {response.text}")

            response.raise_for_status()
            
            uploaded_image_data = response.json()
            
            # Comprobar si la subida falló silenciosamente
            if not uploaded_image_data.get('id'):
                error_msg = uploaded_image_data.get('message', 'WordPress returned null data after upload.')
                print(f"ERROR: Silent failure from WordPress: {error_msg}")
                return jsonify({"error": error_msg}), 500

            return jsonify({
                "id": uploaded_image_data.get('id'),
                "source_url": uploaded_image_data.get('source_url'),
                "alt_text": uploaded_image_data.get('alt_text', ''),
                "media_type": uploaded_image_data.get('media_type')
            }), 201

        except requests.exceptions.RequestException as e:
            error_message = f"Failed to upload to WordPress: {e}"
            if e.response is not None:
                try:
                    error_details = e.response.json()
                    # Extraer el mensaje de error específico de WordPress si está disponible
                    if 'message' in error_details:
                        error_message += f" | Details: {error_details['message']}"
                    else:
                        error_message += f" | Details: {e.response.text}"
                except ValueError:
                    error_message += f" | Details: {e.response.text}"
            
            print(error_message)
            return jsonify({"error": error_message}), 500
        except Exception as e:
            print(f"An unexpected error occurred: {e}")

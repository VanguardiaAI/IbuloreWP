from flask import Blueprint, request, jsonify, current_app, send_file
import os
import json
from datetime import datetime
import requests
from werkzeug.utils import secure_filename
import base64
from io import BytesIO
from PIL import Image

ai_bp = Blueprint('ai', __name__)

# Directorio para guardar imágenes generadas
GENERATED_IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'generated-images')
METADATA_FILE = os.path.join(GENERATED_IMAGES_DIR, 'metadata.json')

# Crear directorio si no existe
os.makedirs(GENERATED_IMAGES_DIR, exist_ok=True)

def load_metadata():
    """Cargar metadata de imágenes generadas"""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_metadata(metadata):
    """Guardar metadata de imágenes generadas"""
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

@ai_bp.route('/ai/generated-images', methods=['GET'])
def get_generated_images():
    """Obtener lista de imágenes generadas"""
    try:
        metadata = load_metadata()
        
        # Verificar que los archivos aún existen
        valid_images = []
        for item in metadata:
            file_path = os.path.join(GENERATED_IMAGES_DIR, item['fileName'])
            if os.path.exists(file_path):
                # Agregar URL completa para acceder a la imagen
                item['url'] = f"/panel/api/static/generated-images/{item['fileName']}"
                item['localUrl'] = item['url']  # Mantener compatibilidad
                valid_images.append(item)
        
        return jsonify({
            'success': True,
            'images': valid_images
        })
    
    except Exception as e:
        return jsonify({
            'error': 'Error al obtener las imágenes guardadas',
            'details': str(e)
        }), 500

@ai_bp.route('/ai/generate-product-photo', methods=['POST'])
def generate_product_photo():
    """Generar foto de producto con IA usando Replicate"""
    try:
        # Verificar que se recibió una imagen
        if 'image' not in request.files:
            return jsonify({'error': 'No se proporcionó ninguna imagen'}), 400
        
        image_file = request.files['image']
        prompt = request.form.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'No se proporcionó un prompt'}), 400
        
        # Verificar la API key de Replicate
        replicate_api_token = os.environ.get('REPLICATE_API_TOKEN')
        if not replicate_api_token:
            return jsonify({'error': 'API key de Replicate no configurada'}), 500
        
        # Convertir imagen a base64
        image_data = image_file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Preparar el prompt mejorado
        enhanced_prompt = f"Product photography: {prompt}. Professional studio lighting, high quality, commercial photography, clean background, sharp focus, high resolution"
        
        # Llamar a la API de Replicate
        headers = {
            'Authorization': f'Token {replicate_api_token}',
            'Content-Type': 'application/json'
        }
        
        # Usar el modelo SDXL-Lightning para generación rápida
        data = {
            'version': '5f24084160c9089501c1b3545d9be3c27883ae2239b6f412990e82d4a6210f8f',
            'input': {
                'prompt': enhanced_prompt,
                'image': f'data:image/jpeg;base64,{image_base64}',
                'num_outputs': 1,
                'guidance_scale': 7.5,
                'num_inference_steps': 4,
                'scheduler': 'K_EULER',
                'disable_safety_checker': True
            }
        }
        
        response = requests.post(
            'https://api.replicate.com/v1/predictions',
            headers=headers,
            json=data
        )
        
        if response.status_code != 201:
            return jsonify({'error': 'Error al iniciar la generación de imagen'}), 500
        
        prediction = response.json()
        prediction_id = prediction['id']
        
        # Esperar a que la predicción termine
        while prediction['status'] not in ['succeeded', 'failed', 'canceled']:
            response = requests.get(
                f'https://api.replicate.com/v1/predictions/{prediction_id}',
                headers=headers
            )
            prediction = response.json()
            
            if prediction['status'] == 'failed':
                return jsonify({'error': 'Error al generar la imagen'}), 500
        
        # Obtener la URL de la imagen generada
        if prediction['output'] and len(prediction['output']) > 0:
            generated_image_url = prediction['output'][0]
            
            # Descargar y guardar la imagen
            image_response = requests.get(generated_image_url)
            if image_response.status_code == 200:
                # Generar nombre único para el archivo
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"product_{timestamp}.png"
                file_path = os.path.join(GENERATED_IMAGES_DIR, filename)
                
                # Guardar imagen
                with open(file_path, 'wb') as f:
                    f.write(image_response.content)
                
                # Actualizar metadata
                metadata = load_metadata()
                metadata.append({
                    'fileName': filename,
                    'prompt': prompt,
                    'timestamp': datetime.now().isoformat(),
                    'localUrl': f"/api/static/generated-images/{filename}"
                })
                save_metadata(metadata)
                
                # Devolver URL completa que funcione en producción
                return jsonify({
                    'success': True,
                    'imageUrl': f"/panel/api/static/generated-images/{filename}",
                    'fileName': filename
                })
            
        return jsonify({'error': 'No se pudo obtener la imagen generada'}), 500
    
    except Exception as e:
        return jsonify({
            'error': 'Error al generar la imagen',
            'details': str(e)
        }), 500

# Servir archivos estáticos de imágenes generadas
@ai_bp.route('/static/generated-images/<filename>')
def serve_generated_image(filename):
    """Servir imágenes generadas"""
    try:
        file_path = os.path.join(GENERATED_IMAGES_DIR, secure_filename(filename))
        if os.path.exists(file_path):
            return send_file(file_path, mimetype='image/png', as_attachment=False)
        return jsonify({'error': 'Imagen no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
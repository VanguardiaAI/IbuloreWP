import requests
import base64
from config import Config

class WordPressAPI:
    """
    WordPress REST API client for blog functionality.
    """
    
    def __init__(self):
        if not all([Config.WC_STORE_URL, Config.WP_USER_LOGIN, Config.WP_APPLICATION_PASSWORD]):
            raise ValueError("WordPress API credentials are not fully configured.")
        
        # Extraer la URL base de WordPress desde WC_STORE_URL
        # WC_STORE_URL puede ser https://sitio.com/wp-json/wc/v3/ o https://sitio.com
        if '/wp-json/wc/v3' in Config.WC_STORE_URL:
            self.base_url = Config.WC_STORE_URL.split('/wp-json/wc/v3')[0]
        else:
            self.base_url = Config.WC_STORE_URL.rstrip('/')
        
        self.api_url = f"{self.base_url}/wp-json/wp/v2"
        
        # Crear credenciales de autenticación básica
        credentials = f"{Config.WP_USER_LOGIN}:{Config.WP_APPLICATION_PASSWORD}"
        self.auth_header = base64.b64encode(credentials.encode()).decode()
        
        self.headers = {
            'Authorization': f'Basic {self.auth_header}',
            'Content-Type': 'application/json'
        }
    
    def get(self, endpoint, params=None):
        """
        Realiza una petición GET a la API de WordPress.
        """
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        response = requests.get(url, headers=self.headers, params=params, timeout=30)
        response.raise_for_status()
        return response
    
    def post(self, endpoint, data=None):
        """
        Realiza una petición POST a la API de WordPress.
        """
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response
    
    def put(self, endpoint, data=None):
        """
        Realiza una petición PUT a la API de WordPress.
        """
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        response = requests.put(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response
    
    def delete(self, endpoint, params=None):
        """
        Realiza una petición DELETE a la API de WordPress.
        """
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        response = requests.delete(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response
    
    def upload_media(self, file_data, filename, alt_text=None):
        """
        Sube un archivo de media a WordPress.
        """
        import mimetypes
        
        upload_url = f"{self.base_url}/wp-json/wp/v2/media"
        
        # Determinar el tipo MIME basado en la extensión del archivo
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            # Fallback para tipos de imagen comunes
            if filename.lower().endswith(('.jpg', '.jpeg')):
                content_type = 'image/jpeg'
            elif filename.lower().endswith('.png'):
                content_type = 'image/png'
            elif filename.lower().endswith('.gif'):
                content_type = 'image/gif'
            elif filename.lower().endswith('.webp'):
                content_type = 'image/webp'
            else:
                content_type = 'application/octet-stream'
        
        headers = {
            'Authorization': f'Basic {self.auth_header}',
            'Content-Type': content_type,
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        if alt_text:
            headers['Content-Description'] = alt_text
        
        print(f"Uploading media: {filename} ({content_type})")
        
        response = requests.post(upload_url, headers=headers, data=file_data)
        
        if not response.ok:
            print(f"Error uploading media: {response.status_code} - {response.text}")
        
        response.raise_for_status()
        return response

def get_wp_api():
    """
    Inicializa y retorna el cliente de la API de WordPress.
    """
    return WordPressAPI() 
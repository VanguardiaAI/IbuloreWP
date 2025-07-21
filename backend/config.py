from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    WC_STORE_URL = os.getenv("WC_STORE_URL")
    WC_CONSUMER_KEY = os.getenv("WC_CONSUMER_KEY")
    WC_CONSUMER_SECRET = os.getenv("WC_CONSUMER_SECRET")
    
    # Credenciales para la API de Medios de WordPress
    WP_USER_LOGIN = os.getenv("WP_USER_LOGIN")
    WP_APPLICATION_PASSWORD = os.getenv("WP_APPLICATION_PASSWORD")
    
    # Configuración de OpenAI para generación de contenido con IA
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4-1106-preview")  # Modelo por defecto
    
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t") 
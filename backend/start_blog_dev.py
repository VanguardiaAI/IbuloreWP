#!/usr/bin/env python3
"""
Script para iniciar el servidor de desarrollo con verificaciones para el blog.
"""

import os
import sys
from dotenv import load_dotenv
from app import create_app

def check_environment():
    """
    Verifica que las variables de entorno estén configuradas correctamente.
    """
    load_dotenv()
    
    required_vars = [
        'WC_STORE_URL',
        'WC_CONSUMER_KEY', 
        'WC_CONSUMER_SECRET',
        'WP_USER_LOGIN',
        'WP_APPLICATION_PASSWORD'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Variables de entorno faltantes:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nCrea un archivo .env con estas variables o configúralas en tu sistema.")
        print("Consulta env.example para ver el formato.")
        return False
    
    print("✅ Variables de entorno configuradas correctamente")
    print(f"🔗 WordPress URL: {os.getenv('WC_STORE_URL')}")
    print(f"👤 Usuario WP: {os.getenv('WP_USER_LOGIN')}")
    return True

def check_blog_routes():
    """
    Verifica que las rutas del blog estén registradas.
    """
    try:
        app = create_app()
        blog_routes = [str(rule) for rule in app.url_map.iter_rules() if 'blog' in str(rule)]
        
        if blog_routes:
            print(f"✅ {len(blog_routes)} rutas del blog registradas")
            return True
        else:
            print("❌ No se encontraron rutas del blog")
            return False
            
    except Exception as e:
        print(f"❌ Error al crear la aplicación: {e}")
        return False

def main():
    """
    Función principal que ejecuta las verificaciones e inicia el servidor.
    """
    print("🚀 Iniciando servidor de desarrollo IbuloreWP Blog")
    print("=" * 50)
    
    # Verificar variables de entorno
    if not check_environment():
        sys.exit(1)
    
    # Verificar rutas del blog
    if not check_blog_routes():
        sys.exit(1)
    
    print("\n🎉 Todas las verificaciones pasaron exitosamente")
    print("🌐 Iniciando servidor en http://localhost:5001")
    print("📝 Endpoints del blog disponibles en /api/blog/*")
    print("🧪 Ejecuta 'python test_blog_api.py' en otra terminal para probar")
    print("\n" + "=" * 50)
    
    # Crear y ejecutar la aplicación
    try:
        app = create_app()
        app.run(debug=True, port=5001, host='0.0.0.0')
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido por el usuario")
    except Exception as e:
        print(f"\n❌ Error al ejecutar el servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
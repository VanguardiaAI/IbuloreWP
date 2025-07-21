#!/usr/bin/env python3
"""
Script de inicio rápido para desarrollo de la API de comentarios.
Verifica la configuración y inicia el servidor con logs detallados.
"""

import os
import sys
from dotenv import load_dotenv
from datetime import datetime

def check_env_vars():
    """Verifica que todas las variables de entorno estén configuradas."""
    print("🔍 Verificando variables de entorno...")
    
    required_vars = [
        'WC_STORE_URL',
        'WC_CONSUMER_KEY', 
        'WC_CONSUMER_SECRET',
        'WP_USER_LOGIN',
        'WP_APPLICATION_PASSWORD'
    ]
    
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
        else:
            # Mostrar valor parcial para verificación
            if 'PASSWORD' in var or 'SECRET' in var or 'KEY' in var:
                display_value = f"{value[:10]}..." if len(value) > 10 else "***"
            else:
                display_value = value
            print(f"  ✅ {var}: {display_value}")
    
    if missing_vars:
        print(f"\n❌ Variables faltantes: {', '.join(missing_vars)}")
        print("\n💡 Crea un archivo .env con las variables requeridas:")
        print("   cp env.example .env")
        print("   # Edita .env con tus credenciales")
        return False
    
    print("✅ Todas las variables de entorno están configuradas")
    return True

def test_wordpress_connection():
    """Prueba la conexión con WordPress."""
    print("\n🔗 Probando conexión con WordPress...")
    
    try:
        from utils.wordpress_api import get_wp_api
        
        wp_api = get_wp_api()
        
        # Probar con una petición simple
        response = wp_api.get('comments', params={'per_page': 1})
        
        if response.status_code == 200:
            print("✅ Conexión con WordPress exitosa")
            
            # Mostrar información básica
            total_comments = response.headers.get('X-WP-Total', 'desconocido')
            print(f"📊 Total de comentarios en WordPress: {total_comments}")
            return True
        else:
            print(f"❌ Error de conexión: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
        print("\n💡 Verifica:")
        print("   - URL de WordPress correcta")
        print("   - Credenciales válidas")
        print("   - WordPress accesible desde este servidor")
        return False

def show_endpoints():
    """Muestra los endpoints disponibles."""
    print("\n📚 Endpoints de Comentarios Disponibles:")
    print("=" * 50)
    
    endpoints = [
        ("GET", "/api/blog/comments", "Obtener comentarios"),
        ("GET", "/api/blog/comments/{id}", "Obtener comentario específico"),
        ("GET", "/api/blog/comments/counts", "Contadores por estado"),
        ("POST", "/api/blog/comments/{id}/approve", "Aprobar comentario"),
        ("POST", "/api/blog/comments/{id}/reject", "Rechazar comentario"),
        ("POST", "/api/blog/comments/{id}/spam", "Marcar como spam"),
        ("PUT", "/api/blog/comments/{id}", "Actualizar comentario"),
        ("DELETE", "/api/blog/comments/{id}", "Eliminar comentario"),
        ("POST", "/api/blog/comments/{id}/replies", "Responder a comentario"),
        ("POST", "/api/blog/comments/bulk", "Acciones masivas"),
    ]
    
    for method, endpoint, description in endpoints:
        print(f"  {method:6} {endpoint:35} - {description}")

def show_test_commands():
    """Muestra comandos de prueba útiles."""
    print("\n🧪 Comandos de Prueba:")
    print("=" * 50)
    
    commands = [
        ("Probar API completa", "python test_comments_api.py"),
        ("Obtener comentarios", "curl http://localhost:5001/api/blog/comments"),
        ("Obtener contadores", "curl http://localhost:5001/api/blog/comments/counts"),
        ("Ver logs en tiempo real", "tail -f app.log"),
    ]
    
    for description, command in commands:
        print(f"  {description:20} : {command}")

def main():
    """Función principal."""
    print("🚀 INICIO RÁPIDO - API DE COMENTARIOS")
    print("=" * 60)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Cargar variables de entorno
    load_dotenv()
    
    # Verificar configuración
    if not check_env_vars():
        sys.exit(1)
    
    # Probar conexión
    if not test_wordpress_connection():
        print("\n⚠️  Continuando sin conexión a WordPress...")
        print("   El servidor iniciará pero algunas funciones no estarán disponibles")
    
    # Mostrar información útil
    show_endpoints()
    show_test_commands()
    
    print(f"\n🌐 Servidor iniciando en: http://localhost:5001")
    print(f"📁 Frontend esperado en: http://localhost:3000")
    print(f"📝 Documentación: COMENTARIOS_API_SETUP.md")
    
    print("\n" + "=" * 60)
    print("🎯 INICIANDO SERVIDOR...")
    print("   Presiona Ctrl+C para detener")
    print("=" * 60)
    
    # Importar y ejecutar la aplicación
    try:
        from app import create_app
        app = create_app()
        app.run(debug=True, port=5001, host='0.0.0.0')
    except KeyboardInterrupt:
        print("\n\n👋 Servidor detenido por el usuario")
    except Exception as e:
        print(f"\n❌ Error al iniciar el servidor: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
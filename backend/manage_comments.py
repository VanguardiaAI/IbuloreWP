#!/usr/bin/env python3
"""
Script maestro para gestionar todas las herramientas de comentarios.
Proporciona un menú interactivo para todas las funciones disponibles.
"""

import os
import sys
import subprocess
from datetime import datetime

def show_menu():
    """Muestra el menú principal."""
    print("\n" + "="*60)
    print("🎛️  GESTOR DE COMENTARIOS - IBULORE WP")
    print("="*60)
    print("1. 🚀 Iniciar servidor con verificaciones")
    print("2. 🧪 Probar API completa")
    print("3. 🔧 Diagnosticar estados de comentarios")
    print("4. 📝 Crear comentarios de prueba")
    print("5. 📊 Ver contadores actuales")
    print("6. 🔍 Listar comentarios existentes")
    print("7. 📚 Ver documentación")
    print("8. 🌐 Abrir frontend")
    print("0. ❌ Salir")
    print("="*60)

def run_script(script_name, description):
    """Ejecuta un script y maneja errores."""
    print(f"\n🚀 {description}")
    print("-" * 50)
    
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=False, 
                              text=True)
        
        if result.returncode == 0:
            print(f"\n✅ {description} completado exitosamente")
        else:
            print(f"\n⚠️  {description} terminó con código {result.returncode}")
            
    except KeyboardInterrupt:
        print(f"\n⏹️  {description} interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error ejecutando {description}: {e}")

def show_current_counts():
    """Muestra los contadores actuales de comentarios."""
    print(f"\n📊 CONTADORES ACTUALES")
    print("-" * 30)
    
    try:
        import requests
        response = requests.get("http://localhost:5001/api/blog/comments/counts")
        
        if response.status_code == 200:
            counts = response.json()
            print(f"✅ Total: {counts.get('total', 0)}")
            print(f"✅ Aprobados: {counts.get('approved', 0)}")
            print(f"⏸️  Pendientes: {counts.get('hold', 0)}")
            print(f"🚫 Spam: {counts.get('spam', 0)}")
            print(f"🗑️  Papelera: {counts.get('trash', 0)}")
        else:
            print(f"❌ Error obteniendo contadores: HTTP {response.status_code}")
            print("💡 Asegúrate de que el servidor esté ejecutándose")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor")
        print("💡 Ejecuta la opción 1 para iniciar el servidor")
    except Exception as e:
        print(f"❌ Error: {e}")

def list_recent_comments():
    """Lista los comentarios más recientes."""
    print(f"\n🔍 COMENTARIOS RECIENTES")
    print("-" * 40)
    
    try:
        import requests
        response = requests.get("http://localhost:5001/api/blog/comments?per_page=5")
        
        if response.status_code == 200:
            data = response.json()
            comments = data.get('comments', [])
            
            if comments:
                for i, comment in enumerate(comments, 1):
                    status = comment.get('status', 'desconocido')
                    author = comment.get('author_name', 'Sin autor')
                    content = comment.get('content', {}).get('rendered', '')[:50]
                    
                    status_emoji = {
                        'approved': '✅',
                        'hold': '⏸️',
                        'spam': '🚫',
                        'trash': '🗑️'
                    }.get(status, '❓')
                    
                    print(f"{i}. {status_emoji} ID:{comment.get('id')} | {author}")
                    print(f"   📝 {content}...")
                    print(f"   📊 Estado: {status}")
                    print()
            else:
                print("📭 No hay comentarios disponibles")
                
        else:
            print(f"❌ Error obteniendo comentarios: HTTP {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor")
        print("💡 Ejecuta la opción 1 para iniciar el servidor")
    except Exception as e:
        print(f"❌ Error: {e}")

def show_documentation():
    """Muestra información de documentación."""
    print(f"\n📚 DOCUMENTACIÓN DISPONIBLE")
    print("-" * 40)
    
    docs = [
        ("COMENTARIOS_API_SETUP.md", "Configuración completa de la API"),
        ("README_BLOG.md", "Documentación general del blog"),
        ("BLOG_API_ENDPOINTS.md", "Lista de todos los endpoints"),
    ]
    
    for filename, description in docs:
        if os.path.exists(filename):
            print(f"✅ {filename} - {description}")
        else:
            print(f"❌ {filename} - No encontrado")
    
    print(f"\n💡 Para ver un archivo:")
    print(f"   cat COMENTARIOS_API_SETUP.md")
    print(f"   code COMENTARIOS_API_SETUP.md  # Si tienes VS Code")

def open_frontend():
    """Intenta abrir el frontend."""
    print(f"\n🌐 ABRIENDO FRONTEND")
    print("-" * 30)
    
    frontend_url = "http://localhost:3000/dashboard/blog/comments"
    
    try:
        import webbrowser
        webbrowser.open(frontend_url)
        print(f"✅ Frontend abierto en: {frontend_url}")
    except Exception as e:
        print(f"❌ Error abriendo navegador: {e}")
        print(f"💡 Abre manualmente: {frontend_url}")

def check_server_status():
    """Verifica si el servidor está ejecutándose."""
    try:
        import requests
        response = requests.get("http://localhost:5001/", timeout=2)
        return response.status_code == 200
    except:
        return False

def main():
    """Función principal con menú interactivo."""
    print("🎯 GESTOR DE COMENTARIOS - IBULORE WP")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    while True:
        show_menu()
        
        # Mostrar estado del servidor
        server_running = check_server_status()
        status_emoji = "🟢" if server_running else "🔴"
        status_text = "EJECUTÁNDOSE" if server_running else "DETENIDO"
        print(f"\n{status_emoji} Servidor: {status_text}")
        
        try:
            choice = input("\n👉 Selecciona una opción: ").strip()
            
            if choice == "0":
                print("\n👋 ¡Hasta luego!")
                break
                
            elif choice == "1":
                run_script("start_comments_dev.py", "Iniciando servidor con verificaciones")
                
            elif choice == "2":
                if not server_running:
                    print("\n⚠️  El servidor no está ejecutándose")
                    print("💡 Ejecuta la opción 1 primero")
                else:
                    run_script("test_comments_api.py", "Probando API completa")
                
            elif choice == "3":
                if not server_running:
                    print("\n⚠️  El servidor no está ejecutándose")
                    print("💡 Ejecuta la opción 1 primero")
                else:
                    run_script("debug_comment_states.py", "Diagnosticando estados de comentarios")
                
            elif choice == "4":
                if not server_running:
                    print("\n⚠️  El servidor no está ejecutándose")
                    print("💡 Ejecuta la opción 1 primero")
                else:
                    run_script("create_test_comments.py", "Creando comentarios de prueba")
                
            elif choice == "5":
                show_current_counts()
                
            elif choice == "6":
                list_recent_comments()
                
            elif choice == "7":
                show_documentation()
                
            elif choice == "8":
                open_frontend()
                
            else:
                print("\n❌ Opción no válida. Intenta de nuevo.")
                
        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta luego!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
        
        # Pausa antes de mostrar el menú de nuevo
        input("\n⏸️  Presiona Enter para continuar...")

if __name__ == "__main__":
    main() 
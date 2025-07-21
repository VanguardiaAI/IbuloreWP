#!/usr/bin/env python3
"""
Script de prueba para los endpoints del blog de IbuloreWP.
Ejecutar después de configurar las variables de entorno.
"""

import requests
import json
import sys
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Configuración
BASE_URL = "http://localhost:5001/api"
HEADERS = {"Content-Type": "application/json"}

def test_endpoint(method, endpoint, data=None, params=None):
    """
    Función auxiliar para probar endpoints.
    """
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, headers=HEADERS)
        elif method == "POST":
            response = requests.post(url, json=data, headers=HEADERS)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=HEADERS)
        elif method == "DELETE":
            response = requests.delete(url, params=params, headers=HEADERS)
        
        print(f"\n{method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code < 400:
            print("✅ Éxito")
            if response.content:
                try:
                    result = response.json()
                    if isinstance(result, dict) and 'pagination' in result:
                        print(f"Total items: {result['pagination']['total']}")
                    elif isinstance(result, list):
                        print(f"Items devueltos: {len(result)}")
                    elif isinstance(result, dict) and 'id' in result:
                        print(f"ID: {result['id']}")
                except:
                    print("Respuesta no JSON")
        else:
            print("❌ Error")
            try:
                error = response.json()
                print(f"Error: {error.get('error', 'Error desconocido')}")
            except:
                print(f"Error HTTP: {response.text}")
                
        return response
        
    except requests.exceptions.ConnectionError:
        print(f"❌ No se pudo conectar al servidor en {BASE_URL}")
        print("Asegúrate de que el servidor Flask esté ejecutándose en el puerto 5001")
        return None
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return None

def main():
    """
    Ejecuta las pruebas de los endpoints del blog.
    """
    print("🧪 Probando endpoints del blog de IbuloreWP")
    print("=" * 50)
    
    # Verificar configuración
    if not all([os.getenv('WC_STORE_URL'), os.getenv('WP_USER_LOGIN'), os.getenv('WP_APPLICATION_PASSWORD')]):
        print("❌ Variables de entorno no configuradas correctamente")
        print("Asegúrate de tener WC_STORE_URL, WP_USER_LOGIN y WP_APPLICATION_PASSWORD en tu .env")
        sys.exit(1)
    
    print(f"🔗 URL de WordPress: {os.getenv('WC_STORE_URL')}")
    print(f"👤 Usuario: {os.getenv('WP_USER_LOGIN')}")
    
    # Pruebas de Posts
    print("\n📝 PROBANDO POSTS")
    print("-" * 30)
    
    # Obtener posts
    test_endpoint("GET", "/blog/posts", params={"per_page": 5})
    
    # Obtener posts con búsqueda
    test_endpoint("GET", "/blog/posts", params={"search": "santeria", "per_page": 3})
    
    # Crear un post de prueba
    post_data = {
        "title": "Post de Prueba - API IbuloreWP",
        "content": "<p>Este es un post de prueba creado desde la API de IbuloreWP para verificar la funcionalidad del blog.</p>",
        "excerpt": "Post de prueba para verificar la API",
        "status": "draft",
        "categories": [],
        "tags": []
    }
    
    create_response = test_endpoint("POST", "/blog/posts", data=post_data)
    
    # Si se creó exitosamente, probar actualización y eliminación
    if create_response and create_response.status_code == 201:
        try:
            new_post = create_response.json()
            post_id = new_post['id']
            
            # Obtener el post específico
            test_endpoint("GET", f"/blog/posts/{post_id}")
            
            # Actualizar el post
            update_data = {
                "title": "Post de Prueba - ACTUALIZADO",
                "content": "<p>Contenido actualizado desde la API.</p>"
            }
            test_endpoint("PUT", f"/blog/posts/{post_id}", data=update_data)
            
            # Eliminar el post (enviar a papelera)
            test_endpoint("DELETE", f"/blog/posts/{post_id}")
            
        except Exception as e:
            print(f"Error procesando post creado: {e}")
    
    # Pruebas de Categorías
    print("\n📂 PROBANDO CATEGORÍAS")
    print("-" * 30)
    
    # Obtener categorías
    test_endpoint("GET", "/blog/categories", params={"per_page": 10})
    
    # Crear categoría de prueba
    category_data = {
        "name": "Categoría de Prueba API",
        "description": "Categoría creada para probar la API",
        "slug": "categoria-prueba-api"
    }
    
    cat_response = test_endpoint("POST", "/blog/categories", data=category_data)
    
    # Si se creó exitosamente, probar actualización y eliminación
    if cat_response and cat_response.status_code == 201:
        try:
            new_cat = cat_response.json()
            cat_id = new_cat['id']
            
            # Actualizar categoría
            update_cat_data = {
                "name": "Categoría de Prueba API - ACTUALIZADA",
                "description": "Descripción actualizada"
            }
            test_endpoint("PUT", f"/blog/categories/{cat_id}", data=update_cat_data)
            
            # Eliminar categoría
            test_endpoint("DELETE", f"/blog/categories/{cat_id}", params={"force": "true"})
            
        except Exception as e:
            print(f"Error procesando categoría creada: {e}")
    
    # Pruebas de Tags
    print("\n🏷️ PROBANDO TAGS")
    print("-" * 30)
    
    # Obtener tags
    test_endpoint("GET", "/blog/tags", params={"per_page": 10})
    
    # Crear tag de prueba
    tag_data = {
        "name": "Tag de Prueba API",
        "description": "Tag creado para probar la API",
        "slug": "tag-prueba-api"
    }
    
    test_endpoint("POST", "/blog/tags", data=tag_data)
    
    # Pruebas de Media
    print("\n🖼️ PROBANDO MEDIA")
    print("-" * 30)
    
    # Obtener archivos de media
    test_endpoint("GET", "/blog/media", params={"per_page": 5})
    
    # Pruebas de Comentarios
    print("\n💬 PROBANDO COMENTARIOS")
    print("-" * 30)
    
    # Obtener comentarios
    test_endpoint("GET", "/blog/comments", params={"per_page": 5})
    
    print("\n" + "=" * 50)
    print("🎉 Pruebas completadas!")
    print("\nSi ves errores 500, verifica:")
    print("1. Que WordPress esté funcionando")
    print("2. Que las credenciales en .env sean correctas")
    print("3. Que el usuario tenga permisos para crear/editar posts")
    print("4. Que la URL de WordPress sea accesible")

if __name__ == "__main__":
    main() 
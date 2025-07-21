#!/usr/bin/env python3
"""
Script de prueba de integración completa del sistema de blog
Verifica que posts, categorías y tags funcionen correctamente
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5001/api/blog"

def test_endpoint(method, endpoint, data=None, expected_status=200):
    """Función auxiliar para probar endpoints"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        elif method == "PUT":
            response = requests.put(url, json=data, headers={"Content-Type": "application/json"})
        elif method == "DELETE":
            response = requests.delete(url)
        
        print(f"✓ {method} {endpoint} - Status: {response.status_code}")
        
        if response.status_code != expected_status:
            print(f"  ⚠️  Esperado: {expected_status}, Obtenido: {response.status_code}")
            if response.text:
                print(f"  Error: {response.text}")
            return None
        
        if response.text:
            return response.json()
        return True
        
    except Exception as e:
        print(f"✗ {method} {endpoint} - Error: {str(e)}")
        return None

def main():
    print("🧪 Iniciando pruebas de integración del sistema de blog")
    print("=" * 60)
    
    # 1. Verificar categorías existentes
    print("\n📁 Probando categorías...")
    categories = test_endpoint("GET", "/categories")
    if categories and isinstance(categories, list):
        print(f"  📊 Categorías encontradas: {len(categories)}")
        for cat in categories[:3]:  # Mostrar solo las primeras 3
            print(f"    - {cat['name']} (ID: {cat['id']})")
    elif categories:
        print(f"  📊 Respuesta de categorías: {type(categories)}")
        print(f"  📊 Contenido: {categories}")
    
    # 2. Verificar tags existentes
    print("\n🏷️  Probando tags...")
    tags = test_endpoint("GET", "/tags")
    if tags and isinstance(tags, list):
        print(f"  📊 Tags encontrados: {len(tags)}")
        for tag in tags[:3]:  # Mostrar solo los primeros 3
            print(f"    - {tag['name']} (ID: {tag['id']})")
    elif tags:
        print(f"  📊 Respuesta de tags: {type(tags)}")
        print(f"  📊 Contenido: {tags}")
    
    # 3. Verificar posts con datos embebidos
    print("\n📝 Probando posts con datos embebidos...")
    posts_response = test_endpoint("GET", "/posts?_embed=true")
    if posts_response and 'posts' in posts_response:
        posts = posts_response['posts']
        print(f"  📊 Posts encontrados: {len(posts)}")
        
        for post in posts[:2]:  # Mostrar solo los primeros 2
            print(f"\n  📄 Post: {post['title']['rendered']}")
            print(f"    ID: {post['id']}")
            print(f"    Estado: {post['status']}")
            print(f"    Categorías: {post.get('categories', [])}")
            print(f"    Tags: {post.get('tags', [])}")
            
            # Verificar datos embebidos
            if '_embedded' in post:
                embedded = post['_embedded']
                
                # Autor
                if 'author' in embedded:
                    author = embedded['author'][0]
                    print(f"    Autor: {author['name']}")
                
                # Términos (categorías y tags)
                if 'wp:term' in embedded:
                    terms = embedded['wp:term']
                    if len(terms) > 0:
                        categories_embedded = [t for t in terms[0] if t.get('taxonomy') == 'category']
                        print(f"    Categorías embebidas: {[c['name'] for c in categories_embedded]}")
                    
                    if len(terms) > 1:
                        tags_embedded = [t for t in terms[1] if t.get('taxonomy') == 'post_tag']
                        print(f"    Tags embebidos: {[t['name'] for t in tags_embedded]}")
    
    # 4. Crear un post de prueba completo
    print("\n🆕 Creando post de prueba con categorías y tags...")
    
    # Obtener IDs de categorías y tags para el post
    category_ids = []
    tag_ids = []
    
    if categories and isinstance(categories, list) and len(categories) > 0:
        category_ids = [categories[0]['id']]  # Usar la primera categoría
    
    if tags and isinstance(tags, list) and len(tags) > 0:
        tag_ids = [tags[0]['id']]  # Usar el primer tag
    
    test_post_data = {
        "title": f"Post de Prueba Integración - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "content": """
        <h2>Post de Prueba de Integración</h2>
        <p>Este es un post creado automáticamente para probar la integración completa del sistema de blog.</p>
        <h3>Características probadas:</h3>
        <ul>
            <li>Creación de posts con categorías</li>
            <li>Asignación de tags</li>
            <li>Contenido HTML</li>
            <li>Extracto personalizado</li>
        </ul>
        <p>Si puedes ver este post en el frontend, ¡la integración funciona correctamente!</p>
        """,
        "excerpt": "Post de prueba automática para verificar la integración completa del sistema de blog.",
        "status": "publish",
        "categories": category_ids,
        "tags": tag_ids
    }
    
    new_post = test_endpoint("POST", "/posts", test_post_data, expected_status=201)
    if new_post:
        print(f"  ✅ Post creado exitosamente con ID: {new_post['id']}")
        print(f"  📝 Título: {new_post['title']['rendered']}")
        print(f"  🔗 URL: {new_post['link']}")
        
        # Verificar que el post se puede obtener con datos embebidos
        print(f"\n🔍 Verificando post creado con datos embebidos...")
        post_detail = test_endpoint("GET", f"/posts/{new_post['id']}?_embed=true")
        if post_detail:
            print("  ✅ Post obtenido correctamente con datos embebidos")
            
            # Verificar categorías y tags
            if post_detail.get('categories'):
                print(f"  📁 Categorías asignadas: {post_detail['categories']}")
            if post_detail.get('tags'):
                print(f"  🏷️  Tags asignados: {post_detail['tags']}")
    
    # 5. Verificar comentarios (si existen)
    print("\n💬 Probando comentarios...")
    comments = test_endpoint("GET", "/comments")
    if comments:
        print(f"  📊 Comentarios encontrados: {len(comments)}")
    
    print("\n" + "=" * 60)
    print("🎉 Pruebas de integración completadas")
    print("\n📋 Resumen:")
    print(f"  - Categorías: {'✅' if categories else '❌'}")
    print(f"  - Tags: {'✅' if tags else '❌'}")
    print(f"  - Posts: {'✅' if posts_response else '❌'}")
    print(f"  - Creación de posts: {'✅' if new_post else '❌'}")
    print(f"  - Comentarios: {'✅' if comments else '❌'}")
    
    print("\n🌐 Para probar el frontend:")
    print("  1. Asegúrate de que el frontend esté ejecutándose (npm run dev)")
    print("  2. Ve a http://localhost:3000/dashboard/blog")
    print("  3. Verifica que puedes ver los posts con categorías y tags")
    print("  4. Prueba crear/editar posts desde la interfaz")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Script para probar TODOS los endpoints de comentarios de forma exhaustiva
"""

import requests
import json
from datetime import datetime
from utils.wordpress_api import get_wp_api

BASE_URL = "http://localhost:5001/api"

def print_header(title):
    """Imprime un encabezado formateado."""
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}")

def print_success(message, data=None):
    """Imprime mensaje de éxito."""
    print(f"✅ {message}")
    if data:
        print(f"📊 Datos: {json.dumps(data, indent=2, ensure_ascii=False)}")

def print_error(message, error=None):
    """Imprime mensaje de error."""
    print(f"❌ {message}")
    if error:
        print(f"🔍 Error: {error}")

def test_get_comments():
    """Prueba obtener comentarios con diferentes filtros."""
    print_header("OBTENER COMENTARIOS")
    
    # Obtener todos los comentarios
    try:
        response = requests.get(f"{BASE_URL}/blog/comments")
        if response.status_code == 200:
            comments = response.json()
            print_success(f"Comentarios obtenidos: {len(comments)}")
            
            # Mostrar algunos comentarios
            for comment in comments[:3]:
                print(f"   ID: {comment['id']} | Estado: {comment['status']} | Autor: {comment['author_name']}")
        else:
            print_error(f"Error HTTP {response.status_code}", response.text)
    except Exception as e:
        print_error("Error obteniendo comentarios", str(e))
    
    # Probar filtros
    filters = [
        {'status': 'approved'},
        {'status': 'hold'},
        {'status': 'spam'},
        {'status': 'trash'},
        {'search': 'santería'},
        {'per_page': 2}
    ]
    
    for filter_params in filters:
        try:
            response = requests.get(f"{BASE_URL}/blog/comments", params=filter_params)
            if response.status_code == 200:
                comments = response.json()
                print_success(f"Filtro {filter_params}: {len(comments)} comentarios")
            else:
                print_error(f"Error con filtro {filter_params}", response.text)
        except Exception as e:
            print_error(f"Error con filtro {filter_params}", str(e))

def test_get_comment_counts():
    """Prueba obtener contadores de comentarios."""
    print_header("CONTADORES DE COMENTARIOS")
    
    try:
        response = requests.get(f"{BASE_URL}/blog/comments/counts")
        if response.status_code == 200:
            counts = response.json()
            print_success("Contadores obtenidos", counts)
        else:
            print_error(f"Error HTTP {response.status_code}", response.text)
    except Exception as e:
        print_error("Error obteniendo contadores", str(e))

def test_individual_comment_operations():
    """Prueba operaciones en comentarios individuales."""
    print_header("OPERACIONES EN COMENTARIOS INDIVIDUALES")
    
    # Obtener un comentario para probar
    try:
        wp_api = get_wp_api()
        response = wp_api.get('comments', params={'per_page': 1})
        comments = response.json()
        
        if not comments:
            print_error("No hay comentarios disponibles para probar")
            return
        
        comment_id = comments[0]['id']
        print(f"🎯 Usando comentario ID: {comment_id}")
        
        # Probar obtener comentario específico
        try:
            response = requests.get(f"{BASE_URL}/blog/comments/{comment_id}")
            if response.status_code == 200:
                comment = response.json()
                print_success(f"Comentario obtenido: {comment['author_name']}")
            else:
                print_error(f"Error obteniendo comentario {comment_id}", response.text)
        except Exception as e:
            print_error(f"Error obteniendo comentario {comment_id}", str(e))
        
        # Probar aprobar comentario
        try:
            response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/approve")
            if response.status_code == 200:
                result = response.json()
                print_success(f"Comentario aprobado. Estado: {result.get('status')}")
            else:
                print_error(f"Error aprobando comentario {comment_id}", response.text)
        except Exception as e:
            print_error(f"Error aprobando comentario {comment_id}", str(e))
        
        # Probar rechazar comentario
        try:
            response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/reject")
            if response.status_code == 200:
                result = response.json()
                print_success(f"Comentario rechazado. Estado: {result.get('status')}")
            else:
                print_error(f"Error rechazando comentario {comment_id}", response.text)
        except Exception as e:
            print_error(f"Error rechazando comentario {comment_id}", str(e))
        
        # Probar marcar como spam
        try:
            response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/spam")
            if response.status_code == 200:
                result = response.json()
                print_success(f"Comentario marcado como spam. Estado: {result.get('status')}")
            else:
                print_error(f"Error marcando como spam comentario {comment_id}", response.text)
        except Exception as e:
            print_error(f"Error marcando como spam comentario {comment_id}", str(e))
        
        # Probar actualizar comentario
        try:
            update_data = {
                'content': 'Comentario actualizado por prueba automática',
                'author_name': 'Usuario de Prueba Actualizado'
            }
            response = requests.put(f"{BASE_URL}/blog/comments/{comment_id}", json=update_data)
            if response.status_code == 200:
                result = response.json()
                print_success(f"Comentario actualizado. Autor: {result.get('author_name')}")
            else:
                print_error(f"Error actualizando comentario {comment_id}", response.text)
        except Exception as e:
            print_error(f"Error actualizando comentario {comment_id}", str(e))
        
        # Probar eliminar comentario
        try:
            response = requests.delete(f"{BASE_URL}/blog/comments/{comment_id}")
            if response.status_code == 200:
                result = response.json()
                print_success(f"Comentario eliminado. Estado: {result.get('status')}")
            else:
                print_error(f"Error eliminando comentario {comment_id}", response.text)
        except Exception as e:
            print_error(f"Error eliminando comentario {comment_id}", str(e))
        
    except Exception as e:
        print_error("Error general en operaciones individuales", str(e))

def test_reply_to_comment():
    """Prueba responder a comentarios."""
    print_header("RESPONDER A COMENTARIOS")
    
    try:
        wp_api = get_wp_api()
        response = wp_api.get('comments', params={'per_page': 1})
        comments = response.json()
        
        if not comments:
            print_error("No hay comentarios disponibles para responder")
            return
        
        comment_id = comments[0]['id']
        print(f"🎯 Respondiendo al comentario ID: {comment_id}")
        
        reply_data = {
            'content': 'Esta es una respuesta de prueba automática',
            'author_name': 'Administrador de Prueba',
            'author_email': 'admin@ibulore.com'
        }
        
        response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/replies", json=reply_data)
        if response.status_code == 200:
            result = response.json()
            print_success(f"Respuesta creada. ID: {result.get('id')}")
        else:
            print_error(f"Error creando respuesta", response.text)
            
    except Exception as e:
        print_error("Error respondiendo a comentario", str(e))

def test_bulk_operations():
    """Prueba operaciones masivas."""
    print_header("OPERACIONES MASIVAS")
    
    try:
        wp_api = get_wp_api()
        response = wp_api.get('comments', params={'per_page': 3})
        comments = response.json()
        
        if len(comments) < 2:
            print_error("No hay suficientes comentarios para pruebas masivas")
            return
        
        comment_ids = [comment['id'] for comment in comments[:2]]
        print(f"🎯 Usando comentarios IDs: {comment_ids}")
        
        # Probar diferentes acciones masivas
        bulk_actions = ['approve', 'reject', 'spam', 'trash']
        
        for action in bulk_actions:
            try:
                bulk_data = {
                    'action': action,
                    'comment_ids': comment_ids
                }
                
                response = requests.post(f"{BASE_URL}/blog/comments/bulk", json=bulk_data)
                if response.status_code == 200:
                    result = response.json()
                    print_success(f"Acción masiva '{action}': Procesados {result.get('processed', 0)}, Exitosos {result.get('successful', 0)}")
                else:
                    print_error(f"Error en acción masiva '{action}'", response.text)
                    
            except Exception as e:
                print_error(f"Error en acción masiva '{action}'", str(e))
                
    except Exception as e:
        print_error("Error general en operaciones masivas", str(e))

def test_edge_cases():
    """Prueba casos límite y errores."""
    print_header("CASOS LÍMITE Y ERRORES")
    
    # Comentario inexistente
    try:
        response = requests.get(f"{BASE_URL}/blog/comments/99999")
        if response.status_code == 404:
            print_success("Error 404 manejado correctamente para comentario inexistente")
        else:
            print_error(f"Respuesta inesperada para comentario inexistente: {response.status_code}")
    except Exception as e:
        print_error("Error probando comentario inexistente", str(e))
    
    # Datos inválidos para actualización
    try:
        invalid_data = {'invalid_field': 'invalid_value'}
        response = requests.put(f"{BASE_URL}/blog/comments/1", json=invalid_data)
        print_success(f"Datos inválidos manejados: HTTP {response.status_code}")
    except Exception as e:
        print_error("Error probando datos inválidos", str(e))
    
    # Acción masiva sin IDs
    try:
        bulk_data = {'action': 'approve', 'comment_ids': []}
        response = requests.post(f"{BASE_URL}/blog/comments/bulk", json=bulk_data)
        print_success(f"Acción masiva sin IDs manejada: HTTP {response.status_code}")
    except Exception as e:
        print_error("Error probando acción masiva sin IDs", str(e))

def main():
    """Función principal de pruebas."""
    print("🚀 PRUEBAS EXHAUSTIVAS DE ENDPOINTS DE COMENTARIOS")
    print(f"🔗 URL Base: {BASE_URL}")
    print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar todas las pruebas
    test_get_comments()
    test_get_comment_counts()
    test_individual_comment_operations()
    test_reply_to_comment()
    test_bulk_operations()
    test_edge_cases()
    
    print(f"\n🎉 PRUEBAS EXHAUSTIVAS COMPLETADAS")
    print(f"⏰ Finalizado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 
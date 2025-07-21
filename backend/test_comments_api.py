#!/usr/bin/env python3
"""
Script de prueba para la API de comentarios del blog.
Verifica que todas las funciones implementadas funcionen correctamente.
"""

import requests
import json
import time
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:5001/api"
HEADERS = {"Content-Type": "application/json"}

def print_test_header(test_name):
    """Imprime un encabezado para cada prueba."""
    print(f"\n{'='*60}")
    print(f"🧪 PRUEBA: {test_name}")
    print(f"{'='*60}")

def print_result(success, message, data=None):
    """Imprime el resultado de una prueba."""
    status = "✅ ÉXITO" if success else "❌ ERROR"
    print(f"{status}: {message}")
    if data and isinstance(data, dict):
        print(f"📊 Datos: {json.dumps(data, indent=2, ensure_ascii=False)}")
    elif data:
        print(f"📊 Datos: {data}")

def test_get_comments():
    """Prueba obtener comentarios."""
    print_test_header("Obtener Comentarios")
    
    try:
        # Prueba básica
        response = requests.get(f"{BASE_URL}/blog/comments", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Comentarios obtenidos: {len(data.get('comments', []))}")
            return data.get('comments', [])
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return []
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return []

def test_get_comment_counts():
    """Prueba obtener contadores de comentarios."""
    print_test_header("Obtener Contadores de Comentarios")
    
    try:
        response = requests.get(f"{BASE_URL}/blog/comments/counts", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Contadores obtenidos", data)
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return {}
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return {}

def test_get_single_comment(comment_id):
    """Prueba obtener un comentario específico."""
    print_test_header(f"Obtener Comentario #{comment_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/blog/comments/{comment_id}", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Comentario obtenido: {data.get('author_name', 'Sin autor')}")
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return None

def test_approve_comment(comment_id):
    """Prueba aprobar un comentario."""
    print_test_header(f"Aprobar Comentario #{comment_id}")
    
    try:
        response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/approve", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Comentario aprobado. Estado: {data.get('status', 'desconocido')}")
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return None

def test_reject_comment(comment_id):
    """Prueba rechazar un comentario."""
    print_test_header(f"Rechazar Comentario #{comment_id}")
    
    try:
        response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/reject", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Comentario rechazado. Estado: {data.get('status', 'desconocido')}")
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return None

def test_mark_as_spam(comment_id):
    """Prueba marcar un comentario como spam."""
    print_test_header(f"Marcar como Spam #{comment_id}")
    
    try:
        response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/spam", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Comentario marcado como spam. Estado: {data.get('status', 'desconocido')}")
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return None

def test_bulk_update(comment_ids, action):
    """Prueba actualización masiva de comentarios."""
    print_test_header(f"Actualización Masiva: {action}")
    
    try:
        payload = {
            "comment_ids": comment_ids,
            "action": action
        }
        response = requests.post(f"{BASE_URL}/blog/comments/bulk", 
                               headers=HEADERS, 
                               json=payload)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Procesados: {data.get('processed', 0)}, Exitosos: {data.get('successful', 0)}")
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return None

def test_reply_to_comment(comment_id):
    """Prueba responder a un comentario."""
    print_test_header(f"Responder a Comentario #{comment_id}")
    
    try:
        payload = {
            "content": f"Esta es una respuesta de prueba creada el {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "author_name": "Administrador de Prueba",
            "author_email": "admin@ibulore.com"
        }
        response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/replies", 
                               headers=HEADERS, 
                               json=payload)
        if response.status_code == 201:
            data = response.json()
            print_result(True, f"Respuesta creada. ID: {data.get('id', 'desconocido')}")
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return None

def test_update_comment(comment_id):
    """Prueba actualizar un comentario."""
    print_test_header(f"Actualizar Comentario #{comment_id}")
    
    try:
        payload = {
            "status": "approved",
            "content": f"Contenido actualizado el {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        response = requests.put(f"{BASE_URL}/blog/comments/{comment_id}", 
                              headers=HEADERS, 
                              json=payload)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"Comentario actualizado. Estado: {data.get('status', 'desconocido')}")
            return data
        else:
            print_result(False, f"Error HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Excepción: {str(e)}")
        return None

def main():
    """Función principal que ejecuta todas las pruebas."""
    print("🚀 INICIANDO PRUEBAS DE LA API DE COMENTARIOS")
    print(f"🔗 URL Base: {BASE_URL}")
    print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Obtener comentarios
    comments = test_get_comments()
    
    # 2. Obtener contadores
    counts = test_get_comment_counts()
    
    if not comments:
        print("\n⚠️  No hay comentarios disponibles para probar las demás funciones.")
        print("💡 Asegúrate de que WordPress tenga comentarios en el blog.")
        return
    
    # Usar el primer comentario para las pruebas
    test_comment_id = comments[0].get('id')
    if not test_comment_id:
        print("\n⚠️  No se pudo obtener un ID de comentario válido.")
        return
    
    print(f"\n🎯 Usando comentario #{test_comment_id} para las pruebas")
    
    # 3. Obtener comentario específico
    comment = test_get_single_comment(test_comment_id)
    
    # 4. Probar cambios de estado
    test_approve_comment(test_comment_id)
    time.sleep(1)  # Pausa entre requests
    
    test_reject_comment(test_comment_id)
    time.sleep(1)
    
    # 5. Probar actualización
    test_update_comment(test_comment_id)
    time.sleep(1)
    
    # 6. Probar respuesta
    test_reply_to_comment(test_comment_id)
    time.sleep(1)
    
    # 7. Probar actualización masiva (solo con un comentario para no afectar mucho)
    test_bulk_update([test_comment_id], "approve")
    
    print(f"\n🎉 PRUEBAS COMPLETADAS")
    print(f"⏰ Finalizado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 
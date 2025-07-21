#!/usr/bin/env python3
"""
Script para diagnosticar problemas con estados de comentarios
"""

import requests
import json
from utils.wordpress_api import get_wp_api

def analyze_comment_states():
    """Analiza los estados de comentarios en WordPress."""
    print("🔍 ANÁLISIS DE ESTADOS DE COMENTARIOS")
    print("=" * 40)
    
    try:
        wp_api = get_wp_api()
        
        # Obtener comentarios por estado
        states = ['approved', 'hold', 'spam', 'trash']
        
        for state in states:
            try:
                response = wp_api.get('comments', params={'status': state, 'per_page': 5})
                comments = response.json()
                print(f"\n📊 Estado '{state}': {len(comments)} comentarios")
                
                for comment in comments[:2]:  # Solo mostrar 2 por estado
                    print(f"   ID: {comment['id']} | Estado: {comment['status']} | Contenido: {comment['content']['rendered'][:50]}...")
                    
            except Exception as e:
                print(f"   ❌ Error obteniendo comentarios '{state}': {e}")
                
    except Exception as e:
        print(f"❌ Error general: {e}")

def test_state_changes():
    """Prueba cambios de estado directamente con WordPress API."""
    print(f"\n🔄 PRUEBA DE CAMBIOS DE ESTADO")
    print("=" * 40)
    
    try:
        wp_api = get_wp_api()
        
        # Obtener un comentario aprobado
        response = wp_api.get('comments', params={'status': 'approved', 'per_page': 1})
        comments = response.json()
        
        if not comments:
            print("❌ No hay comentarios aprobados para probar")
            return
        
        comment_id = comments[0]['id']
        original_status = comments[0]['status']
        print(f"🎯 Comentario ID: {comment_id} | Estado original: {original_status}")
        
        # Cambiar a pendiente (hold)
        print(f"\n🔄 Cambiando a 'hold'...")
        try:
            update_response = wp_api.post(f'comments/{comment_id}', json={'status': 'hold'})
            updated_comment = update_response.json()
            new_status = updated_comment.get('status', 'desconocido')
            print(f"   ✅ Nuevo estado: {new_status}")
            
            # Verificar que realmente cambió
            verify_response = wp_api.get(f'comments/{comment_id}')
            verified_comment = verify_response.json()
            verified_status = verified_comment.get('status', 'desconocido')
            print(f"   🔍 Estado verificado: {verified_status}")
            
        except Exception as e:
            print(f"   ❌ Error cambiando estado: {e}")
            
    except Exception as e:
        print(f"❌ Error general: {e}")

def test_specific_endpoints():
    """Prueba los endpoints específicos de cambio de estado."""
    print(f"\n🎯 PRUEBA DE ENDPOINTS ESPECÍFICOS")
    print("=" * 40)
    
    try:
        wp_api = get_wp_api()
        
        # Obtener un comentario para probar
        response = wp_api.get('comments', params={'per_page': 1, 'status': 'approved'})
        comments = response.json()
        
        if not comments:
            print("❌ No hay comentarios aprobados para probar")
            return
        
        comment_id = comments[0]['id']
        print(f"🎯 Usando comentario ID: {comment_id}")
        
        # Probar endpoint de rechazo
        print(f"\n🔄 Probando endpoint /reject...")
        try:
            reject_response = requests.post(f'http://localhost:5001/api/blog/comments/{comment_id}/reject')
            if reject_response.status_code == 200:
                result = reject_response.json()
                print(f"   ✅ Respuesta exitosa: Estado = {result.get('status', 'desconocido')}")
            else:
                print(f"   ❌ Error HTTP {reject_response.status_code}: {reject_response.text}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Verificar estado actual
        print(f"\n🔍 Verificando estado actual...")
        try:
            verify_response = wp_api.get(f'comments/{comment_id}')
            current_comment = verify_response.json()
            current_status = current_comment.get('status', 'desconocido')
            print(f"   📊 Estado actual: {current_status}")
        except Exception as e:
            print(f"   ❌ Error verificando: {e}")
            
    except Exception as e:
        print(f"❌ Error general: {e}")

if __name__ == "__main__":
    print("🚀 DIAGNÓSTICO DE COMENTARIOS")
    print("=" * 50)
    
    analyze_comment_states()
    test_state_changes()
    test_specific_endpoints()
    
    print(f"\n✅ Diagnóstico completado") 
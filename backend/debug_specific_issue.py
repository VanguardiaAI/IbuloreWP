#!/usr/bin/env python3
"""
Script específico para diagnosticar el problema de comentarios que desaparecen
al marcarlos como pendientes o spam
"""

import requests
import json
from utils.wordpress_api import get_wp_api
import time

BASE_URL = "http://localhost:5001/api"

def print_separator(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def get_comment_by_id_direct(comment_id):
    """Obtiene un comentario directamente de WordPress API."""
    try:
        wp_api = get_wp_api()
        response = wp_api.get(f'comments/{comment_id}')
        return response.json()
    except Exception as e:
        print(f"❌ Error obteniendo comentario {comment_id}: {e}")
        return None

def clean_content(content):
    """Limpia el contenido HTML para mostrar."""
    return content.replace('<p>', '').replace('</p>', '').replace('\n', ' ')[:50]

def list_all_comments_by_status():
    """Lista todos los comentarios por estado."""
    print_separator("LISTADO ACTUAL DE COMENTARIOS POR ESTADO")
    
    try:
        wp_api = get_wp_api()
        states = ['approved', 'hold', 'spam', 'trash']
        
        for state in states:
            try:
                response = wp_api.get('comments', params={'status': state, 'per_page': 20})
                comments = response.json()
                print(f"\n📊 Estado '{state}': {len(comments)} comentarios")
                
                for comment in comments:
                    content_clean = clean_content(comment['content']['rendered'])
                    author_name = comment['author_name'][:30]
                    print(f"   ID: {comment['id']:4} | Estado: {comment['status']:8} | Autor: {author_name:30} | Contenido: {content_clean}...")
                    
            except Exception as e:
                print(f"   ❌ Error obteniendo comentarios '{state}': {e}")
                
    except Exception as e:
        print(f"❌ Error general: {e}")

def test_reject_endpoint_step_by_step():
    """Prueba el endpoint de reject paso a paso."""
    print_separator("PRUEBA DETALLADA DEL ENDPOINT REJECT")
    
    try:
        wp_api = get_wp_api()
        
        # Obtener un comentario aprobado o crear uno
        response = wp_api.get('comments', params={'status': 'approved', 'per_page': 1})
        comments = response.json()
        
        if not comments:
            # Si no hay comentarios aprobados, buscar cualquier comentario
            response = wp_api.get('comments', params={'per_page': 1})
            comments = response.json()
            
            if not comments:
                print("❌ No hay comentarios disponibles para probar")
                return
        
        comment_id = comments[0]['id']
        original_status = comments[0]['status']
        
        print(f"🎯 Usando comentario ID: {comment_id}")
        print(f"📊 Estado original: {original_status}")
        print(f"👤 Autor: {comments[0]['author_name']}")
        content_clean = clean_content(comments[0]['content']['rendered'])
        print(f"📝 Contenido: {content_clean}...")
        
        # Paso 1: Verificar que el comentario existe antes
        print(f"\n🔍 PASO 1: Verificando comentario antes del cambio")
        before_comment = get_comment_by_id_direct(comment_id)
        if before_comment:
            print(f"   ✅ Comentario existe: ID {before_comment['id']}, Estado: {before_comment['status']}")
        else:
            print(f"   ❌ Comentario no encontrado")
            return
        
        # Paso 2: Llamar al endpoint de reject
        print(f"\n🔄 PASO 2: Llamando endpoint /reject")
        try:
            response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/reject")
            print(f"   📡 Código de respuesta: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Respuesta exitosa")
                print(f"   📊 Estado devuelto: {result.get('status', 'no especificado')}")
                print(f"   🆔 ID devuelto: {result.get('id', 'no especificado')}")
            else:
                print(f"   ❌ Error HTTP: {response.text}")
                return
                
        except Exception as e:
            print(f"   ❌ Error en la llamada: {e}")
            return
        
        # Paso 3: Verificar el comentario después del cambio
        print(f"\n🔍 PASO 3: Verificando comentario después del cambio")
        time.sleep(1)  # Esperar un poco
        
        after_comment = get_comment_by_id_direct(comment_id)
        if after_comment:
            print(f"   ✅ Comentario aún existe: ID {after_comment['id']}, Estado: {after_comment['status']}")
            
            if after_comment['status'] == 'hold':
                print(f"   ✅ Estado cambiado correctamente a 'hold'")
            else:
                print(f"   ⚠️  Estado inesperado: {after_comment['status']} (esperado: hold)")
        else:
            print(f"   ❌ PROBLEMA: Comentario ya no existe después del cambio")
        
        # Paso 4: Buscar el comentario en todos los estados
        print(f"\n🔍 PASO 4: Buscando comentario en todos los estados")
        found_in_states = []
        
        for state in ['approved', 'hold', 'spam', 'trash']:
            try:
                response = wp_api.get('comments', params={'status': state, 'include': [comment_id]})
                state_comments = response.json()
                
                if state_comments:
                    found_in_states.append(state)
                    print(f"   ✅ Encontrado en estado '{state}': {len(state_comments)} comentario(s)")
                    for comment in state_comments:
                        print(f"      ID: {comment['id']}, Estado: {comment['status']}")
                        
            except Exception as e:
                print(f"   ❌ Error buscando en estado '{state}': {e}")
        
        if not found_in_states:
            print(f"   ❌ PROBLEMA CRÍTICO: Comentario no encontrado en ningún estado")
        else:
            print(f"   📊 Comentario encontrado en estados: {found_in_states}")
            
    except Exception as e:
        print(f"❌ Error general en prueba de reject: {e}")

def test_spam_endpoint_step_by_step():
    """Prueba el endpoint de spam paso a paso."""
    print_separator("PRUEBA DETALLADA DEL ENDPOINT SPAM")
    
    try:
        wp_api = get_wp_api()
        
        # Obtener un comentario que no sea spam
        response = wp_api.get('comments', params={'status': 'approved,hold', 'per_page': 1})
        comments = response.json()
        
        if not comments:
            # Si no hay comentarios, buscar cualquier comentario
            response = wp_api.get('comments', params={'per_page': 1})
            comments = response.json()
            
            if not comments:
                print("❌ No hay comentarios disponibles para probar")
                return
        
        comment_id = comments[0]['id']
        original_status = comments[0]['status']
        
        print(f"🎯 Usando comentario ID: {comment_id}")
        print(f"📊 Estado original: {original_status}")
        
        # Paso 1: Verificar que el comentario existe antes
        print(f"\n🔍 PASO 1: Verificando comentario antes del cambio")
        before_comment = get_comment_by_id_direct(comment_id)
        if before_comment:
            print(f"   ✅ Comentario existe: ID {before_comment['id']}, Estado: {before_comment['status']}")
        else:
            print(f"   ❌ Comentario no encontrado")
            return
        
        # Paso 2: Llamar al endpoint de spam
        print(f"\n🔄 PASO 2: Llamando endpoint /spam")
        try:
            response = requests.post(f"{BASE_URL}/blog/comments/{comment_id}/spam")
            print(f"   📡 Código de respuesta: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Respuesta exitosa")
                print(f"   📊 Estado devuelto: {result.get('status', 'no especificado')}")
            else:
                print(f"   ❌ Error HTTP: {response.text}")
                return
                
        except Exception as e:
            print(f"   ❌ Error en la llamada: {e}")
            return
        
        # Paso 3: Verificar el comentario después del cambio
        print(f"\n🔍 PASO 3: Verificando comentario después del cambio")
        time.sleep(1)  # Esperar un poco
        
        after_comment = get_comment_by_id_direct(comment_id)
        if after_comment:
            print(f"   ✅ Comentario aún existe: ID {after_comment['id']}, Estado: {after_comment['status']}")
            
            if after_comment['status'] == 'spam':
                print(f"   ✅ Estado cambiado correctamente a 'spam'")
            else:
                print(f"   ⚠️  Estado inesperado: {after_comment['status']} (esperado: spam)")
        else:
            print(f"   ❌ PROBLEMA: Comentario ya no existe después del cambio")
            
    except Exception as e:
        print(f"❌ Error general en prueba de spam: {e}")

def main():
    """Función principal de diagnóstico."""
    print("🚀 DIAGNÓSTICO ESPECÍFICO DEL PROBLEMA DE COMENTARIOS")
    print("=" * 70)
    
    # Listar estado actual
    list_all_comments_by_status()
    
    # Probar endpoint de reject
    test_reject_endpoint_step_by_step()
    
    # Probar endpoint de spam
    test_spam_endpoint_step_by_step()
    
    # Listar estado final
    list_all_comments_by_status()
    
    print(f"\n🎉 DIAGNÓSTICO COMPLETADO")

if __name__ == "__main__":
    main() 
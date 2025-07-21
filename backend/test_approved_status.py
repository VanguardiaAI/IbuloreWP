#!/usr/bin/env python3
"""
Script para probar el estado 'approved' de comentarios
"""

from utils.wordpress_api import get_wp_api

def test_approved_status():
    """Prueba diferentes variaciones del estado approved."""
    print("🔍 PROBANDO ESTADO 'APPROVED'")
    print("=" * 40)
    
    wp_api = get_wp_api()
    
    # Probar diferentes variaciones
    states_to_test = [
        'approved', 
        'approve', 
        '1', 
        'publish',
        None  # Sin estado
    ]
    
    for state in states_to_test:
        try:
            if state is None:
                params = {'per_page': 10}
                state_label = "SIN ESTADO"
            else:
                params = {'status': state, 'per_page': 10}
                state_label = f'"{state}"'
            
            response = wp_api.get('comments', params=params)
            comments = response.json()
            
            print(f"\n📊 Estado {state_label}: {len(comments)} comentarios")
            
            for comment in comments[:3]:
                print(f"   ID: {comment['id']} | Estado real: '{comment['status']}' | Autor: {comment['author_name']}")
                
        except Exception as e:
            print(f"❌ Error con estado {state_label}: {e}")
    
    # Probar obtener un comentario específico que sabemos que existe
    print(f"\n🔍 PROBANDO COMENTARIO ESPECÍFICO (ID: 1288):")
    try:
        response = wp_api.get('comments/1288')
        comment = response.json()
        print(f"   ID: {comment['id']} | Estado: '{comment['status']}' | Autor: {comment['author_name']}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_approved_status() 
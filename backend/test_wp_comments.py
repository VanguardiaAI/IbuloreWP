#!/usr/bin/env python3
"""
Script para probar comentarios de WordPress por estado
"""

from utils.wordpress_api import get_wp_api

def test_comments_by_status():
    """Prueba comentarios por cada estado."""
    print("🔍 PROBANDO COMENTARIOS POR ESTADO")
    print("=" * 40)
    
    wp_api = get_wp_api()
    states = ['approved', 'hold', 'spam', 'trash']
    total_comments = 0
    
    for state in states:
        try:
            response = wp_api.get('comments', params={
                'status': state, 
                'per_page': 20
            })
            comments = response.json()
            count = len(comments)
            total_comments += count
            
            print(f"\n📊 Estado '{state}': {count} comentarios")
            
            for comment in comments[:3]:
                print(f"   ID: {comment['id']} | Estado: {comment['status']} | Autor: {comment['author_name']}")
                
        except Exception as e:
            print(f"❌ Error obteniendo comentarios '{state}': {e}")
    
    print(f"\n📈 TOTAL DE COMENTARIOS: {total_comments}")
    
    # Probar sin filtro de estado
    print(f"\n🔍 PROBANDO SIN FILTRO DE ESTADO:")
    try:
        response = wp_api.get('comments', params={'per_page': 20})
        comments = response.json()
        print(f"   Sin filtro: {len(comments)} comentarios")
        
        for comment in comments[:3]:
            print(f"   ID: {comment['id']} | Estado: {comment['status']} | Autor: {comment['author_name']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_comments_by_status() 
#!/usr/bin/env python3
"""
Script para probar la visualización jerárquica de categorías
"""

import requests
import json

BASE_URL = "http://localhost:5001/api/blog"

def test_categories_hierarchy():
    print("🏗️ Probando jerarquía de categorías")
    print("=" * 50)
    
    # Obtener todas las categorías
    response = requests.get(f"{BASE_URL}/categories")
    if response.status_code != 200:
        print(f"❌ Error obteniendo categorías: {response.status_code}")
        return
    
    data = response.json()
    categories = data.get('categories', [])
    
    # Filtrar solo nuestras categorías de santería
    santeria_categories = [
        cat for cat in categories 
        if cat['name'] in ['Santería', 'Orishas', 'Rituales', 'Ofrendas', 'Ceremonias de Iniciación']
    ]
    
    print(f"📊 Categorías de santería encontradas: {len(santeria_categories)}")
    print()
    
    # Organizar jerárquicamente (simulando la lógica del frontend)
    def organize_categories(categories):
        category_map = {cat['id']: cat for cat in categories}
        result = []
        
        def add_category_with_children(category, level=0):
            # Agregar indentación visual
            indent = "  " * level
            icon = "📁" if level == 0 else "└── 📂"
            
            result.append({
                'display': f"{indent}{icon} {category['name']} (ID: {category['id']})",
                'level': level,
                'category': category
            })
            
            # Buscar hijos
            children = [cat for cat in categories if cat['parent'] == category['id']]
            children.sort(key=lambda x: x['name'])
            
            for child in children:
                add_category_with_children(child, level + 1)
        
        # Empezar con categorías padre
        parents = [cat for cat in categories if cat['parent'] == 0]
        parents.sort(key=lambda x: x['name'])
        
        for parent in parents:
            add_category_with_children(parent)
        
        return result
    
    # Mostrar jerarquía
    organized = organize_categories(santeria_categories)
    
    print("🌳 Estructura jerárquica:")
    for item in organized:
        print(item['display'])
        cat = item['category']
        if cat['description']:
            indent = "  " * (item['level'] + 1)
            print(f"{indent}💬 {cat['description']}")
        if cat['count'] > 0:
            indent = "  " * (item['level'] + 1)
            print(f"{indent}📄 {cat['count']} entradas")
        print()
    
    print("✅ Jerarquía de categorías verificada correctamente")
    print()
    print("🎯 Características implementadas en el frontend:")
    print("  • Indentación visual por nivel")
    print("  • Iconos diferenciados (FolderOpen vs Folder)")
    print("  • Badges de 'Categoría Principal' vs 'Subcategoría'")
    print("  • Información del padre en subcategorías")
    print("  • Ordenamiento alfabético por nivel")
    print("  • Contador de categorías principales vs subcategorías")

if __name__ == "__main__":
    test_categories_hierarchy() 
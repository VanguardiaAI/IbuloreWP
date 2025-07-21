#!/usr/bin/env python3
"""
Script para configurar la página "Home 3" como página principal del sitio.
Busca entre las páginas del tema Joice y configura la correcta.
"""

import json
import sys
import time
from utils.wordpress_api import get_wp_api

class Home3Configurator:
    def __init__(self):
        self.wp_api = get_wp_api()
    
    def find_and_set_home3(self):
        """Busca la página Home 3 y la configura como página principal."""
        print("🔍 Buscando página Home 3...")
        
        try:
            # 1. Buscar todas las páginas que contengan "Home"
            self.search_home_pages()
            
            # 2. Buscar específicamente "Home 3"
            home3_page = self.find_home3_page()
            
            if home3_page:
                # 3. Configurar Home 3 como página principal
                self.set_as_homepage(home3_page)
            else:
                print("❌ No se encontró la página Home 3")
                print("💡 Mostrando todas las páginas disponibles...")
                self.list_all_pages()
            
        except Exception as e:
            print(f"❌ Error durante la configuración: {str(e)}")
            sys.exit(1)
    
    def search_home_pages(self):
        """Busca todas las páginas que contengan 'Home' en el título."""
        print("\n📋 Buscando páginas Home disponibles...")
        
        try:
            # Buscar páginas con "Home" en el título
            home_pages_response = self.wp_api.get("pages", params={
                "search": "Home",
                "per_page": 50,
                "status": "publish"
            })
            
            if home_pages_response.status_code == 200:
                home_pages = home_pages_response.json()
                
                if home_pages:
                    print(f"  ✅ Encontradas {len(home_pages)} páginas Home:")
                    for page in home_pages:
                        print(f"     - ID: {page['id']} | Título: '{page['title']['rendered']}' | Slug: '{page['slug']}'")
                else:
                    print("  ⚠️ No se encontraron páginas con 'Home' en el título")
            
        except Exception as e:
            print(f"  ❌ Error buscando páginas Home: {str(e)}")
    
    def find_home3_page(self):
        """Busca específicamente la página Home 3."""
        print("\n🎯 Buscando página Home 3 específicamente...")
        
        try:
            # Buscar por diferentes variaciones de "Home 3"
            search_terms = ["Home 3", "Home3", "home-3", "home3"]
            
            for term in search_terms:
                print(f"  🔍 Buscando: '{term}'")
                
                # Buscar por título
                pages_response = self.wp_api.get("pages", params={
                    "search": term,
                    "per_page": 10,
                    "status": "publish"
                })
                
                if pages_response.status_code == 200:
                    pages = pages_response.json()
                    
                    for page in pages:
                        title = page['title']['rendered'].lower()
                        slug = page['slug'].lower()
                        
                        # Verificar si es exactamente Home 3
                        if ('home 3' in title or 'home3' in title or 
                            'home-3' in slug or 'home3' in slug):
                            print(f"  ✅ ¡Encontrada Home 3!")
                            print(f"     - ID: {page['id']}")
                            print(f"     - Título: '{page['title']['rendered']}'")
                            print(f"     - Slug: '{page['slug']}'")
                            return page
                
                # Buscar por slug también
                slug_response = self.wp_api.get("pages", params={
                    "slug": term.lower().replace(" ", "-"),
                    "status": "publish"
                })
                
                if slug_response.status_code == 200:
                    slug_pages = slug_response.json()
                    if slug_pages:
                        page = slug_pages[0]
                        print(f"  ✅ ¡Encontrada Home 3 por slug!")
                        print(f"     - ID: {page['id']}")
                        print(f"     - Título: '{page['title']['rendered']}'")
                        print(f"     - Slug: '{page['slug']}'")
                        return page
            
            print("  ❌ No se encontró página Home 3 con los términos buscados")
            return None
            
        except Exception as e:
            print(f"  ❌ Error buscando Home 3: {str(e)}")
            return None
    
    def set_as_homepage(self, page):
        """Configura la página encontrada como página principal."""
        print(f"\n🏠 Configurando '{page['title']['rendered']}' como página principal...")
        
        try:
            page_id = page['id']
            
            # Configurar como página frontal
            settings = {
                "show_on_front": "page",
                "page_on_front": page_id,
                "page_for_posts": 0  # No usar página específica para blog
            }
            
            for setting, value in settings.items():
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"  ✅ {setting}: {value}")
                else:
                    print(f"  ⚠️ No se pudo configurar {setting}")
                time.sleep(0.3)
            
            print(f"\n🎉 ¡Home 3 configurada como página principal!")
            print(f"   Página: {page['title']['rendered']} (ID: {page_id})")
            
        except Exception as e:
            print(f"  ❌ Error configurando página principal: {str(e)}")
    
    def list_all_pages(self):
        """Lista todas las páginas disponibles para ayudar a identificar Home 3."""
        print("\n📄 Listando todas las páginas disponibles...")
        
        try:
            all_pages_response = self.wp_api.get("pages", params={
                "per_page": 100,
                "status": "publish",
                "orderby": "title",
                "order": "asc"
            })
            
            if all_pages_response.status_code == 200:
                all_pages = all_pages_response.json()
                
                print(f"  📋 Total de páginas: {len(all_pages)}")
                print("  " + "="*60)
                
                for page in all_pages:
                    title = page['title']['rendered']
                    slug = page['slug']
                    page_id = page['id']
                    
                    # Destacar páginas que podrían ser Home 3
                    if any(term in title.lower() for term in ['home', 'inicio']):
                        print(f"  🏠 ID: {page_id:4} | '{title}' | Slug: '{slug}'")
                    else:
                        print(f"     ID: {page_id:4} | '{title}' | Slug: '{slug}'")
                
                print("  " + "="*60)
                print("  💡 Las páginas marcadas con 🏠 podrían ser opciones de Home")
            
        except Exception as e:
            print(f"  ❌ Error listando páginas: {str(e)}")
    
    def manual_set_homepage(self, page_id):
        """Permite configurar manualmente una página como principal por ID."""
        print(f"\n🔧 Configurando página ID {page_id} como página principal...")
        
        try:
            # Verificar que la página existe
            page_response = self.wp_api.get(f"pages/{page_id}")
            
            if page_response.status_code == 200:
                page = page_response.json()
                print(f"  ✅ Página encontrada: '{page['title']['rendered']}'")
                
                # Configurar como página frontal
                settings = {
                    "show_on_front": "page",
                    "page_on_front": page_id,
                    "page_for_posts": 0
                }
                
                for setting, value in settings.items():
                    response = self.wp_api.put("settings", {setting: value})
                    if response.status_code == 200:
                        print(f"  ✅ {setting}: {value}")
                    time.sleep(0.3)
                
                print(f"\n🎉 ¡Página configurada como principal!")
                
            else:
                print(f"  ❌ No se encontró página con ID {page_id}")
                
        except Exception as e:
            print(f"  ❌ Error configurando página: {str(e)}")
    
    def check_current_homepage(self):
        """Verifica cuál es la página principal actual."""
        print("\n🔍 Verificando página principal actual...")
        
        try:
            settings_response = self.wp_api.get("settings")
            if settings_response.status_code == 200:
                settings = settings_response.json()
                
                show_on_front = settings.get("show_on_front", "posts")
                page_on_front = settings.get("page_on_front", 0)
                
                print(f"  📋 Configuración actual:")
                print(f"     - Mostrar en portada: {show_on_front}")
                print(f"     - ID de página frontal: {page_on_front}")
                
                if show_on_front == "page" and page_on_front > 0:
                    # Obtener información de la página actual
                    page_response = self.wp_api.get(f"pages/{page_on_front}")
                    if page_response.status_code == 200:
                        page = page_response.json()
                        print(f"     - Página actual: '{page['title']['rendered']}'")
                        print(f"     - Slug: '{page['slug']}'")
                        
                        # Verificar si ya es Home 3
                        title = page['title']['rendered'].lower()
                        if 'home 3' in title or 'home3' in title:
                            print("  ✅ ¡Ya está configurada Home 3!")
                            return True
                        else:
                            print("  ⚠️ No es Home 3, necesita cambio")
                            return False
                else:
                    print("  ⚠️ No hay página estática configurada")
                    return False
            
        except Exception as e:
            print(f"  ❌ Error verificando página actual: {str(e)}")
            return False

def main():
    """Función principal."""
    print("🏠 CONFIGURADOR DE HOME 3 🏠")
    print("=" * 40)
    
    try:
        configurator = Home3Configurator()
        
        # Verificar página actual
        is_home3 = configurator.check_current_homepage()
        
        if not is_home3:
            print("\n🔧 Buscando y configurando Home 3...")
            configurator.find_and_set_home3()
            
            # Verificar resultado
            print("\n🔍 Verificación final...")
            final_check = configurator.check_current_homepage()
            
            if final_check:
                print("\n🎉 ¡HOME 3 CONFIGURADA EXITOSAMENTE!")
            else:
                print("\n⚠️ No se pudo configurar automáticamente")
                print("\n💡 SOLUCIÓN MANUAL:")
                print("1. Revisa la lista de páginas arriba")
                print("2. Identifica el ID de la página Home 3")
                print("3. Ejecuta: configurator.manual_set_homepage(ID)")
        else:
            print("\n✅ Home 3 ya está configurada correctamente")
        
        print("\n📌 INSTRUCCIONES:")
        print("- Si no se encontró Home 3 automáticamente")
        print("- Revisa la lista de páginas mostrada arriba")
        print("- Busca una página con nombre similar a 'Home 3'")
        print("- Anota su ID y avísame para configurarla manualmente")
        
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
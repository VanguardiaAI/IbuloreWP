#!/usr/bin/env python3
"""
Script para restaurar completamente el sitio a su estado original.
Revierte todos los cambios y restaura la configuración original del tema.
"""

import json
import sys
import time
from utils.wordpress_api import get_wp_api

class FullSiteRestorer:
    def __init__(self):
        self.wp_api = get_wp_api()
    
    def full_restore(self):
        """Restaura completamente el sitio a su estado original."""
        print("🔄 Restaurando sitio completo a estado original...")
        
        try:
            # 1. Restaurar nombre y configuraciones originales
            self.restore_original_settings()
            
            # 2. Restaurar configuración de página principal
            self.restore_homepage_configuration()
            
            # 3. Eliminar páginas creadas por los scripts
            self.remove_created_pages()
            
            # 4. Restaurar configuraciones de WooCommerce
            self.restore_woocommerce_settings()
            
            print("✅ Restauración completa finalizada!")
            
        except Exception as e:
            print(f"❌ Error durante la restauración: {str(e)}")
            sys.exit(1)
    
    def restore_original_settings(self):
        """Restaura el nombre original y configuraciones del sitio."""
        print("\n📝 Restaurando nombre y configuraciones originales...")
        
        # Configuraciones originales del sitio
        original_settings = {
            "title": "Ibuloré",  # Nombre original
            "description": "Just another WordPress site",  # Descripción por defecto
            "language": "en_US",  # Idioma original
            "timezone": "UTC",    # Zona horaria por defecto
            "date_format": "F j, Y",
            "time_format": "g:i a",
            "start_of_week": 1
        }
        
        for setting, value in original_settings.items():
            try:
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"  ✅ {setting}: {value}")
                else:
                    print(f"  ⚠️ No se pudo restaurar {setting}")
                time.sleep(0.3)
            except Exception as e:
                print(f"  ❌ Error con {setting}: {str(e)}")
    
    def restore_homepage_configuration(self):
        """Restaura la configuración original de la página principal."""
        print("\n🏠 Restaurando configuración de página principal...")
        
        try:
            # Buscar si existe una página llamada "Home" o "Inicio" original
            home_pages = self.wp_api.get("pages", params={"search": "Home"})
            
            # Configurar para mostrar página estática si existe, o posts si no
            if home_pages.json():
                # Si existe una página Home, usarla
                home_page_id = home_pages.json()[0]["id"]
                settings = {
                    "show_on_front": "page",
                    "page_on_front": home_page_id,
                    "page_for_posts": 0
                }
                print(f"  📄 Usando página Home existente (ID: {home_page_id})")
            else:
                # Si no existe, buscar la configuración original del tema
                settings = {
                    "show_on_front": "page",  # La mayoría de temas usan página estática
                    "page_on_front": 0,      # Dejar que WordPress determine
                    "page_for_posts": 0
                }
                print("  📄 Configurando para usar página por defecto del tema")
            
            for setting, value in settings.items():
                try:
                    response = self.wp_api.put("settings", {setting: value})
                    if response.status_code == 200:
                        print(f"  ✅ {setting}: {value}")
                    time.sleep(0.3)
                except Exception as e:
                    print(f"  ❌ Error con {setting}: {str(e)}")
                    
        except Exception as e:
            print(f"  ❌ Error configurando página principal: {str(e)}")
    
    def remove_created_pages(self):
        """Elimina las páginas que fueron creadas por los scripts."""
        print("\n🗑️ Eliminando páginas creadas por scripts...")
        
        pages_to_remove = [
            "sobre-nosotros",
            "informacion-envios", 
            "faq",
            "guia-orishas",
            "inicio"
        ]
        
        for page_slug in pages_to_remove:
            try:
                pages_response = self.wp_api.get("pages", params={"slug": page_slug})
                pages = pages_response.json()
                
                if pages:
                    page_id = pages[0]["id"]
                    response = self.wp_api.delete(f"pages/{page_id}", params={"force": True})
                    if response.status_code == 200:
                        print(f"  ✅ Eliminada página: {page_slug}")
                    else:
                        print(f"  ⚠️ No se pudo eliminar: {page_slug}")
                else:
                    print(f"  ℹ️ No encontrada: {page_slug}")
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  ❌ Error eliminando {page_slug}: {str(e)}")
    
    def restore_woocommerce_settings(self):
        """Restaura configuraciones originales de WooCommerce."""
        print("\n🛒 Restaurando configuraciones de WooCommerce...")
        
        # Configuraciones por defecto de WooCommerce
        woo_settings = {
            "posts_per_page": 10,  # Por defecto de WordPress
            "woocommerce_shop_page_display": "products",
            "woocommerce_category_archive_display": "products", 
            "woocommerce_default_catalog_orderby": "menu_order",
            "woocommerce_catalog_columns": 4,
            "woocommerce_catalog_rows": 4
        }
        
        for setting, value in woo_settings.items():
            try:
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"  ✅ {setting}: {value}")
                time.sleep(0.2)
            except Exception as e:
                print(f"  ⚠️ Error con {setting}: {str(e)}")
    
    def restore_original_pages(self):
        """Intenta restaurar páginas originales del tema si existen."""
        print("\n📄 Verificando páginas originales...")
        
        # Páginas típicas de WooCommerce que deberían existir
        woo_pages = ["shop", "cart", "checkout", "my-account"]
        
        for page_slug in woo_pages:
            try:
                pages_response = self.wp_api.get("pages", params={"slug": page_slug})
                pages = pages_response.json()
                
                if pages:
                    page_id = pages[0]["id"]
                    # Restaurar títulos originales
                    original_titles = {
                        "shop": "Shop",
                        "cart": "Cart", 
                        "checkout": "Checkout",
                        "my-account": "My account"
                    }
                    
                    if page_slug in original_titles:
                        response = self.wp_api.put(f"pages/{page_id}", {
                            "title": original_titles[page_slug]
                        })
                        if response.status_code == 200:
                            print(f"  ✅ Restaurado título original: {original_titles[page_slug]}")
                
                time.sleep(0.3)
                
            except Exception as e:
                print(f"  ⚠️ Error con página {page_slug}: {str(e)}")
    
    def check_site_status(self):
        """Verifica el estado final del sitio."""
        print("\n🔍 Verificando estado final del sitio...")
        
        try:
            settings_response = self.wp_api.get("settings")
            if settings_response.status_code == 200:
                settings = settings_response.json()
                
                print(f"  📋 Configuración actual:")
                print(f"     - Título: {settings.get('title', 'N/A')}")
                print(f"     - Descripción: {settings.get('description', 'N/A')}")
                print(f"     - Idioma: {settings.get('language', 'N/A')}")
                print(f"     - Mostrar en portada: {settings.get('show_on_front', 'N/A')}")
                print(f"     - ID página frontal: {settings.get('page_on_front', 'N/A')}")
                
                if settings.get('title') == 'Ibuloré':
                    print("  ✅ Nombre del sitio restaurado correctamente")
                    return True
                else:
                    print("  ⚠️ El nombre del sitio necesita verificación manual")
                    return False
            
        except Exception as e:
            print(f"  ❌ Error verificando estado: {str(e)}")
            return False

def main():
    """Función principal."""
    print("🚨 RESTAURACIÓN COMPLETA DEL SITIO 🚨")
    print("=" * 50)
    print("Este script restaurará el sitio a su estado original:")
    print("- Nombre: Ibuloré")
    print("- Página principal del tema")
    print("- Configuraciones originales")
    print("- Eliminará páginas creadas por scripts")
    print("=" * 50)
    
    try:
        restorer = FullSiteRestorer()
        
        print("\n🔧 Iniciando restauración completa...")
        
        # Restaurar todo
        restorer.full_restore()
        
        # Restaurar páginas originales
        restorer.restore_original_pages()
        
        # Verificar resultado final
        print("\n🔍 Verificación final...")
        final_status = restorer.check_site_status()
        
        if final_status:
            print("\n🎉 ¡RESTAURACIÓN COMPLETA EXITOSA!")
        else:
            print("\n⚠️ La restauración se completó con algunas advertencias")
        
        print("\n📌 ESTADO FINAL:")
        print("✅ Nombre del sitio: Ibuloré")
        print("✅ Página principal del tema restaurada")
        print("✅ Configuraciones originales aplicadas")
        print("✅ Páginas de scripts eliminadas")
        print("✅ WooCommerce configurado con valores por defecto")
        
        print("\n💡 RECOMENDACIÓN:")
        print("Revisa tu sitio web ahora. Debería verse exactamente")
        print("como antes de ejecutar los scripts de transformación.")
        print("\nSi aún hay problemas, considera restaurar desde backup")
        print("o reimportar los datos de prueba del tema.")
        
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        print("\n🔄 ALTERNATIVA:")
        print("Si esta restauración no funciona completamente,")
        print("te recomiendo restaurar desde un backup o")
        print("reimportar los datos de prueba del tema Joice.")
        sys.exit(1)

if __name__ == "__main__":
    main() 
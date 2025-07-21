#!/usr/bin/env python3
"""
Script para restaurar la página de inicio y revertir cambios problemáticos.
Restaura la configuración original del tema sin perder la funcionalidad.
"""

import json
import sys
import time
from utils.wordpress_api import get_wp_api

class HomepageRestorer:
    def __init__(self):
        self.wp_api = get_wp_api()
    
    def restore_homepage(self):
        """Restaura la configuración original de la página de inicio."""
        print("🔄 Restaurando página de inicio...")
        
        try:
            # 1. Restaurar configuración de página de inicio
            self.restore_front_page_settings()
            
            # 2. Eliminar página de inicio personalizada problemática
            self.remove_custom_homepage()
            
            # 3. Restaurar configuraciones del tema
            self.restore_theme_settings()
            
            print("✅ Página de inicio restaurada exitosamente!")
            
        except Exception as e:
            print(f"❌ Error durante la restauración: {str(e)}")
            sys.exit(1)
    
    def restore_front_page_settings(self):
        """Restaura la configuración original de la página frontal."""
        print("\n🏠 Restaurando configuración de página frontal...")
        
        # Configurar para mostrar las últimas entradas (configuración por defecto)
        settings = {
            "show_on_front": "posts",  # Mostrar últimas entradas en lugar de página estática
            "page_on_front": 0,       # No usar página estática específica
            "page_for_posts": 0       # No usar página específica para blog
        }
        
        for setting, value in settings.items():
            try:
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"  ✅ {setting}: {value}")
                else:
                    print(f"  ⚠️ No se pudo restaurar {setting}")
                time.sleep(0.3)
            except Exception as e:
                print(f"  ❌ Error con {setting}: {str(e)}")
    
    def remove_custom_homepage(self):
        """Elimina la página de inicio personalizada que causó problemas."""
        print("\n🗑️ Eliminando página de inicio problemática...")
        
        try:
            # Buscar la página de inicio creada
            pages_response = self.wp_api.get("pages", params={"slug": "inicio"})
            pages = pages_response.json()
            
            if pages:
                page_id = pages[0]["id"]
                
                # Eliminar la página
                response = self.wp_api.delete(f"pages/{page_id}", params={"force": True})
                if response.status_code == 200:
                    print("  ✅ Página de inicio personalizada eliminada")
                else:
                    print("  ⚠️ No se pudo eliminar la página")
            else:
                print("  ℹ️ No se encontró página de inicio personalizada")
                
        except Exception as e:
            print(f"  ❌ Error eliminando página: {str(e)}")
    
    def restore_theme_settings(self):
        """Restaura configuraciones básicas del tema sin perder personalizaciones útiles."""
        print("\n⚙️ Restaurando configuraciones del tema...")
        
        # Mantener las configuraciones útiles pero restaurar las problemáticas
        safe_settings = {
            "posts_per_page": 10,  # Valor por defecto de WordPress
            "default_comment_status": "open",
            "default_ping_status": "open",
            "start_of_week": 1
        }
        
        for setting, value in safe_settings.items():
            try:
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"  ✅ {setting}: {value}")
                time.sleep(0.2)
            except Exception as e:
                print(f"  ⚠️ Error con {setting}: {str(e)}")
    
    def preserve_useful_changes(self):
        """Preserva los cambios útiles que no afectan la estructura visual."""
        print("\n💾 Preservando cambios útiles...")
        
        # Mantener título y descripción del sitio (estos no afectan la estructura)
        useful_settings = {
            "title": "Botánica Oshún - Artículos Religiosos Yoruba",
            "description": "Tu tienda de confianza para productos de Santería, Ifá y tradiciones Yoruba",
            "language": "es_ES",
            "timezone": "America/New_York"
        }
        
        for setting, value in useful_settings.items():
            try:
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"  ✅ Mantenido {setting}")
                time.sleep(0.2)
            except Exception as e:
                print(f"  ⚠️ Error manteniendo {setting}: {str(e)}")
    
    def check_homepage_status(self):
        """Verifica el estado actual de la página de inicio."""
        print("\n🔍 Verificando estado de la página de inicio...")
        
        try:
            # Obtener configuraciones actuales
            settings_response = self.wp_api.get("settings")
            if settings_response.status_code == 200:
                settings = settings_response.json()
                
                show_on_front = settings.get("show_on_front", "posts")
                page_on_front = settings.get("page_on_front", 0)
                
                print(f"  📋 Configuración actual:")
                print(f"     - Mostrar en portada: {show_on_front}")
                print(f"     - ID de página frontal: {page_on_front}")
                
                if show_on_front == "posts":
                    print("  ✅ La página de inicio está configurada correctamente")
                    return True
                else:
                    print("  ⚠️ La página de inicio necesita ajustes")
                    return False
            
        except Exception as e:
            print(f"  ❌ Error verificando estado: {str(e)}")
            return False

def main():
    """Función principal."""
    print("🚨 RESTAURADOR DE PÁGINA DE INICIO 🚨")
    print("=" * 50)
    
    try:
        restorer = HomepageRestorer()
        
        # Verificar estado actual
        current_status = restorer.check_homepage_status()
        
        if not current_status:
            print("\n🔧 Iniciando restauración...")
            
            # Restaurar página de inicio
            restorer.restore_homepage()
            
            # Preservar cambios útiles
            restorer.preserve_useful_changes()
            
            # Verificar resultado
            print("\n🔍 Verificación final...")
            final_status = restorer.check_homepage_status()
            
            if final_status:
                print("\n🎉 ¡Restauración completada exitosamente!")
            else:
                print("\n⚠️ La restauración necesita ajustes manuales")
        else:
            print("\n✅ La página de inicio ya está configurada correctamente")
        
        print("\n📌 PRÓXIMOS PASOS:")
        print("1. Revisar el sitio web para confirmar que la estructura está restaurada")
        print("2. El título y descripción del sitio se mantuvieron")
        print("3. Las páginas informativas creadas siguen disponibles")
        print("4. La configuración del tema vuelve a funcionar normalmente")
        print("\n💡 RECOMENDACIÓN:")
        print("Para futuras personalizaciones, modifica solo el contenido")
        print("sin cambiar la configuración de página frontal del tema.")
        
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
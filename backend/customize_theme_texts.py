#!/usr/bin/env python3
"""
Script para personalizar textos del tema WordPress para Santería Yoruba.
Se enfoca en modificar opciones del theme customizer y configuraciones que pueden cambiarse via API.
"""

import json
import sys
import time
from utils.wordpress_api import get_wp_api

class ThemeTextCustomizer:
    def __init__(self):
        self.wp_api = get_wp_api()
        
        # Configuraciones de texto específicas para Santería
        self.santeria_texts = {
            # Opciones del customizer del tema
            "theme_options": {
                "site_logo_text": "Botánica Oshún",
                "header_tagline": "Artículos Religiosos Yoruba Auténticos",
                "footer_copyright": "© 2024 Botánica Oshún - Tradición Yoruba desde 1999",
                "shop_banner_title": "Productos Espirituales Yoruba",
                "shop_banner_subtitle": "Encuentra todo lo necesario para tu práctica religiosa",
                "featured_section_title": "Productos Destacados",
                "featured_section_subtitle": "Los más solicitados por nuestra comunidad espiritual",
                "about_section_title": "Sobre Nuestra Botánica",
                "about_section_text": "Más de 20 años sirviendo a la comunidad yoruba con productos auténticos y bendecidos siguiendo las tradiciones ancestrales.",
                "contact_section_title": "Contacto Espiritual",
                "contact_section_text": "Estamos aquí para guiarte en tu camino espiritual",
                "newsletter_title": "Bendiciones Semanales",
                "newsletter_subtitle": "Recibe consejos espirituales y ofertas especiales",
                "testimonials_title": "Testimonios de Nuestra Comunidad",
                "blog_section_title": "Sabiduría Ancestral",
                "blog_section_subtitle": "Aprende sobre las tradiciones yorubas"
            },
            
            # Textos de WooCommerce específicos
            "woocommerce_texts": {
                "shop_page_title": "Tienda Espiritual",
                "shop_page_description": "Productos auténticos para la práctica de Santería e Ifá",
                "cart_page_title": "Tu Carrito Sagrado",
                "checkout_page_title": "Finalizar Pedido",
                "my_account_title": "Mi Cuenta Espiritual",
                "product_categories_title": "Categorías Espirituales",
                "featured_products_title": "Productos Bendecidos",
                "recent_products_title": "Nuevos Productos",
                "sale_products_title": "Ofertas Especiales",
                "add_to_cart_text": "Agregar al Carrito",
                "view_cart_text": "Ver Carrito",
                "checkout_text": "Proceder al Pago",
                "continue_shopping_text": "Seguir Comprando"
            },
            
            # Configuraciones de widgets de texto
            "widget_texts": {
                "welcome_widget": {
                    "title": "¡Ashe! Bienvenidos",
                    "content": "Encuentra la energía espiritual que necesitas. Productos auténticos para honrar a los Orishas y fortalecer tu conexión ancestral."
                },
                "categories_widget": {
                    "title": "Productos por Orisha",
                    "content": "Explora nuestras categorías organizadas por cada Orisha para encontrar exactamente lo que necesitas."
                },
                "contact_widget": {
                    "title": "Consultas Espirituales",
                    "content": "📞 (555) 123-4567<br>📧 consultas@botanicaoshun.com<br>🕐 Lun-Vie 9AM-7PM"
                },
                "shipping_widget": {
                    "title": "Envíos Seguros",
                    "content": "Embalamos con cuidado cada producto sagrado. Envío gratis en pedidos +$75."
                }
            }
        }
    
    def run_customization(self):
        """Ejecuta la personalización completa de textos."""
        print("🎨 Iniciando personalización de textos del tema...")
        
        try:
            # 1. Actualizar opciones del tema
            self.update_theme_options()
            
            # 2. Personalizar textos de WooCommerce
            self.customize_woocommerce_texts()
            
            # 3. Crear/actualizar widgets con textos personalizados
            self.update_text_widgets()
            
            # 4. Actualizar menús con textos apropiados
            self.update_menu_texts()
            
            print("✅ Personalización de textos completada!")
            
        except Exception as e:
            print(f"❌ Error durante la personalización: {str(e)}")
            sys.exit(1)
    
    def update_theme_options(self):
        """Actualiza las opciones del tema via customizer."""
        print("\n🎨 Actualizando opciones del tema...")
        
        # Intentar actualizar opciones comunes del tema
        theme_options = self.santeria_texts["theme_options"]
        
        for option_name, option_value in theme_options.items():
            try:
                # Intentar como opción del tema
                response = self.wp_api.put("settings", {option_name: option_value})
                if response.status_code == 200:
                    print(f"✅ {option_name}: {option_value[:50]}...")
                else:
                    # Intentar como meta del customizer
                    self.update_customizer_option(option_name, option_value)
                
                time.sleep(0.3)
                
            except Exception as e:
                print(f"⚠️ No se pudo actualizar {option_name}: {str(e)}")
    
    def update_customizer_option(self, option_name, option_value):
        """Actualiza una opción específica del customizer."""
        try:
            # Las opciones del customizer a menudo se almacenan como theme_mods
            customizer_data = {
                f"theme_mods_{self.get_active_theme()}": {
                    option_name: option_value
                }
            }
            
            # Intentar actualizar via endpoint de opciones
            response = self.wp_api.post("options", customizer_data)
            if response.status_code in [200, 201]:
                print(f"✅ Customizer {option_name}: actualizado")
            
        except Exception as e:
            print(f"⚠️ Error actualizando customizer {option_name}: {str(e)}")
    
    def get_active_theme(self):
        """Obtiene el nombre del tema activo."""
        try:
            response = self.wp_api.get("themes")
            themes = response.json()
            
            for theme in themes:
                if theme.get("status") == "active":
                    return theme.get("stylesheet", "default")
            
            return "default"
            
        except Exception as e:
            print(f"⚠️ Error obteniendo tema activo: {str(e)}")
            return "default"
    
    def customize_woocommerce_texts(self):
        """Personaliza textos específicos de WooCommerce."""
        print("\n🛒 Personalizando textos de WooCommerce...")
        
        woo_texts = self.santeria_texts["woocommerce_texts"]
        
        # Actualizar páginas de WooCommerce
        woo_pages = {
            "shop": {"title": woo_texts["shop_page_title"], "content": woo_texts["shop_page_description"]},
            "cart": {"title": woo_texts["cart_page_title"]},
            "checkout": {"title": woo_texts["checkout_page_title"]},
            "my-account": {"title": woo_texts["my_account_title"]}
        }
        
        for page_slug, page_data in woo_pages.items():
            try:
                # Buscar la página por slug
                pages_response = self.wp_api.get("pages", params={"slug": page_slug})
                pages = pages_response.json()
                
                if pages:
                    page_id = pages[0]["id"]
                    update_data = {"title": page_data["title"]}
                    
                    if "content" in page_data:
                        update_data["content"] = f"<p>{page_data['content']}</p>"
                    
                    response = self.wp_api.put(f"pages/{page_id}", update_data)
                    if response.status_code == 200:
                        print(f"✅ Página {page_slug} actualizada")
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"⚠️ Error actualizando página {page_slug}: {str(e)}")
        
        # Actualizar opciones de WooCommerce
        woo_options = {
            "woocommerce_shop_page_display": "subcategories",
            "woocommerce_category_archive_display": "products",
            "woocommerce_default_catalog_orderby": "popularity",
            "woocommerce_catalog_columns": 3,
            "woocommerce_catalog_rows": 4
        }
        
        for option, value in woo_options.items():
            try:
                response = self.wp_api.put("settings", {option: value})
                if response.status_code == 200:
                    print(f"✅ {option}: {value}")
                time.sleep(0.2)
            except Exception as e:
                print(f"⚠️ Error actualizando {option}: {str(e)}")
    
    def update_text_widgets(self):
        """Actualiza widgets de texto con contenido de Santería."""
        print("\n📝 Actualizando widgets de texto...")
        
        widget_texts = self.santeria_texts["widget_texts"]
        
        try:
            # Obtener widgets existentes
            widgets_response = self.wp_api.get("widgets")
            if widgets_response.status_code != 200:
                print("⚠️ No se pudieron obtener widgets existentes")
                return
            
            existing_widgets = widgets_response.json()
            
            # Actualizar widgets de texto existentes
            for widget in existing_widgets:
                if widget.get("id_base") == "text":
                    widget_id = widget.get("id")
                    
                    # Buscar contenido apropiado para este widget
                    for widget_key, widget_data in widget_texts.items():
                        try:
                            update_data = {
                                "title": widget_data["title"],
                                "content": widget_data["content"]
                            }
                            
                            response = self.wp_api.put(f"widgets/{widget_id}", update_data)
                            if response.status_code == 200:
                                print(f"✅ Widget actualizado: {widget_data['title']}")
                            
                            break  # Solo actualizar uno por widget_key
                            
                        except Exception as e:
                            print(f"⚠️ Error actualizando widget {widget_id}: {str(e)}")
                        
                        time.sleep(0.5)
        
        except Exception as e:
            print(f"⚠️ Error general con widgets: {str(e)}")
    
    def update_menu_texts(self):
        """Actualiza los textos de los menús existentes."""
        print("\n🧭 Actualizando textos de menús...")
        
        # Menús con temática de Santería
        santeria_menu_items = [
            {"title": "Inicio", "url": "/"},
            {"title": "Tienda Espiritual", "url": "/tienda"},
            {"title": "Productos por Orisha", "url": "/productos-orisha"},
            {"title": "Herramientas Sagradas", "url": "/herramientas-santos"},
            {"title": "Collares y Accesorios", "url": "/collares"},
            {"title": "Veladoras Rituales", "url": "/veladoras"},
            {"title": "Consultas Espirituales", "url": "/consultas"},
            {"title": "Sabiduría Ancestral", "url": "/blog"},
            {"title": "Contacto", "url": "/contacto"}
        ]
        
        try:
            # Obtener menús existentes
            menus_response = self.wp_api.get("menus")
            if menus_response.status_code != 200:
                print("⚠️ No se pudieron obtener menús")
                return
            
            menus = menus_response.json()
            
            # Actualizar el primer menú encontrado
            if menus:
                menu_id = menus[0]["id"]
                print(f"✅ Actualizando menú: {menus[0].get('name', 'Sin nombre')}")
                
                # Obtener items del menú
                menu_items_response = self.wp_api.get(f"menu-items", params={"menus": menu_id})
                if menu_items_response.status_code == 200:
                    existing_items = menu_items_response.json()
                    
                    # Actualizar items existentes con nuevos títulos
                    for i, item in enumerate(existing_items[:len(santeria_menu_items)]):
                        new_title = santeria_menu_items[i]["title"]
                        
                        try:
                            response = self.wp_api.put(f"menu-items/{item['id']}", {"title": new_title})
                            if response.status_code == 200:
                                print(f"  ✅ Item actualizado: {new_title}")
                            time.sleep(0.3)
                        except Exception as e:
                            print(f"  ⚠️ Error actualizando item: {str(e)}")
        
        except Exception as e:
            print(f"⚠️ Error actualizando menús: {str(e)}")
    
    def create_homepage_content(self):
        """Crea contenido específico para la página de inicio."""
        print("\n🏠 Creando contenido de página de inicio...")
        
        homepage_content = """
        <div class="santeria-welcome">
            <h1>Bienvenidos a Botánica Oshún</h1>
            <p class="lead">Tu tienda de confianza para productos auténticos de Santería e Ifá</p>
        </div>
        
        <div class="orishas-intro">
            <h2>Honra a los Orishas con Productos Auténticos</h2>
            <p>Desde 1999, hemos servido a la comunidad espiritual yoruba con productos bendecidos y preparados siguiendo las tradiciones ancestrales.</p>
        </div>
        
        <div class="featured-categories">
            <h3>Nuestras Especialidades</h3>
            <div class="categories-grid">
                <div class="category-item">
                    <h4>Herramientas para Santos</h4>
                    <p>Implementos ceremoniales para cada Orisha</p>
                </div>
                <div class="category-item">
                    <h4>Collares Sagrados</h4>
                    <p>Collares tradicionales con cuentas auténticas</p>
                </div>
                <div class="category-item">
                    <h4>Veladoras Rituales</h4>
                    <p>Velas especiales para cada ceremonia</p>
                </div>
                <div class="category-item">
                    <h4>Consultas Espirituales</h4>
                    <p>Orientación con santeros experimentados</p>
                </div>
            </div>
        </div>
        """
        
        try:
            # Buscar página de inicio
            pages_response = self.wp_api.get("pages", params={"slug": "inicio"})
            pages = pages_response.json()
            
            if not pages:
                # Crear página de inicio
                page_data = {
                    "title": "Inicio",
                    "content": homepage_content,
                    "slug": "inicio",
                    "status": "publish"
                }
                response = self.wp_api.post("pages", page_data)
                if response.status_code == 201:
                    print("✅ Página de inicio creada")
                    
                    # Configurar como página de inicio
                    page_id = response.json()["id"]
                    self.wp_api.put("settings", {"page_on_front": page_id, "show_on_front": "page"})
            else:
                # Actualizar página existente
                page_id = pages[0]["id"]
                response = self.wp_api.put(f"pages/{page_id}", {"content": homepage_content})
                if response.status_code == 200:
                    print("✅ Página de inicio actualizada")
        
        except Exception as e:
            print(f"⚠️ Error con página de inicio: {str(e)}")

def main():
    """Función principal."""
    print("🎨 PERSONALIZADOR DE TEXTOS PARA SANTERÍA YORUBA 🎨")
    print("=" * 60)
    
    try:
        customizer = ThemeTextCustomizer()
        customizer.run_customization()
        customizer.create_homepage_content()
        
        print("\n" + "=" * 60)
        print("🎉 ¡Personalización de textos completada!")
        print("\n📌 Cambios realizados:")
        print("- Opciones del tema actualizadas")
        print("- Textos de WooCommerce personalizados")
        print("- Widgets de texto actualizados")
        print("- Menús con terminología de Santería")
        print("- Página de inicio con contenido apropiado")
        print("\n💡 Próximos pasos:")
        print("1. Revisar el sitio para verificar cambios")
        print("2. Personalizar colores desde el Customizer")
        print("3. Agregar imágenes relacionadas con Santería")
        print("4. Configurar productos específicos")
        
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
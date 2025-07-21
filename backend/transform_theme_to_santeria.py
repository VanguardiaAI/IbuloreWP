#!/usr/bin/env python3
"""
Script para transformar el tema WordPress de joyería a temática de Santería Yoruba.
Utiliza la API REST de WordPress para modificar elementos que pueden ser cambiados sin editar archivos de tema.
"""

import json
import sys
import time
from utils.wordpress_api import get_wp_api

class ThemeSanteriaTransformer:
    def __init__(self):
        self.wp_api = get_wp_api()
        
        # Configuraciones para transformar a Santería Yoruba
        self.santeria_config = {
            "site_title": "Botánica Oshún - Artículos Religiosos Yoruba",
            "site_tagline": "Tu tienda de confianza para productos de Santería, Ifá y tradiciones Yoruba",
            "site_description": "Especialistas en artículos religiosos yoruba: herramientas para santos, collares, veladoras, rituales, consultas y todo lo necesario para tu práctica espiritual.",
            
            # Páginas principales a crear/actualizar
            "pages": [
                {
                    "title": "Sobre Nosotros",
                    "slug": "sobre-nosotros",
                    "content": """
                    <h2>Bienvenidos a Botánica Oshún</h2>
                    <p>Somos una botánica especializada en artículos religiosos de la tradición Yoruba, con más de 20 años de experiencia sirviendo a la comunidad espiritual.</p>
                    
                    <h3>Nuestra Misión</h3>
                    <p>Proporcionar productos auténticos y de calidad para la práctica de la Santería, Ifá y otras tradiciones yorubas, manteniendo el respeto y la tradición de nuestros ancestros.</p>
                    
                    <h3>¿Qué Ofrecemos?</h3>
                    <ul>
                        <li>Herramientas ceremoniales para todos los Orishas</li>
                        <li>Collares y accesorios tradicionales</li>
                        <li>Veladoras y velas especializadas</li>
                        <li>Productos para rituales y limpias</li>
                        <li>Consultas espirituales</li>
                        <li>Asesoría personalizada</li>
                    </ul>
                    
                    <p>Todos nuestros productos son bendecidos y preparados siguiendo las tradiciones ancestrales yorubas.</p>
                    """
                },
                {
                    "title": "Información de Envíos",
                    "slug": "informacion-envios",
                    "content": """
                    <h2>Información de Envíos</h2>
                    
                    <h3>Tiempos de Entrega</h3>
                    <ul>
                        <li><strong>Envío Nacional:</strong> 3-5 días hábiles</li>
                        <li><strong>Envío Internacional:</strong> 7-15 días hábiles</li>
                        <li><strong>Envío Express:</strong> 1-2 días hábiles (costo adicional)</li>
                    </ul>
                    
                    <h3>Costos de Envío</h3>
                    <p>Los costos de envío se calculan automáticamente según el peso y destino de tu pedido.</p>
                    
                    <h3>Productos Especiales</h3>
                    <p>Algunos productos como veladoras y elementos frágiles requieren embalaje especial. Esto puede afectar el tiempo de preparación.</p>
                    
                    <h3>Envío Gratis</h3>
                    <p>¡Envío gratis en pedidos superiores a $75!</p>
                    """
                },
                {
                    "title": "Preguntas Frecuentes",
                    "slug": "faq",
                    "content": """
                    <h2>Preguntas Frecuentes</h2>
                    
                    <h3>¿Son auténticos sus productos?</h3>
                    <p>Sí, todos nuestros productos son auténticos y preparados siguiendo las tradiciones yorubas ancestrales.</p>
                    
                    <h3>¿Ofrecen consultas espirituales?</h3>
                    <p>Sí, ofrecemos consultas presenciales y virtuales con santeros experimentados.</p>
                    
                    <h3>¿Cómo sé qué productos necesito?</h3>
                    <p>Puedes contactarnos para asesoría personalizada o agendar una consulta espiritual.</p>
                    
                    <h3>¿Envían internacionalmente?</h3>
                    <p>Sí, enviamos a muchos países. Algunos productos pueden tener restricciones según las regulaciones locales.</p>
                    
                    <h3>¿Cómo debo cuidar mis productos?</h3>
                    <p>Cada producto incluye instrucciones de cuidado. También ofrecemos guías en nuestro blog.</p>
                    """
                }
            ]
        }
    
    def run_transformation(self):
        """Ejecuta la transformación completa del tema."""
        print("🔄 Iniciando transformación del tema a Santería Yoruba...")
        
        try:
            # 1. Actualizar configuraciones del sitio
            self.update_site_settings()
            
            # 2. Crear/actualizar páginas principales
            self.create_update_pages()
            
            # 3. Actualizar configuraciones adicionales
            self.update_additional_settings()
            
            print("✅ Transformación completada exitosamente!")
            print("\n📋 Resumen de cambios:")
            print("- Título y descripción del sitio actualizados")
            print("- Páginas informativas creadas")
            print("- Configuraciones adicionales aplicadas")
            
        except Exception as e:
            print(f"❌ Error durante la transformación: {str(e)}")
            sys.exit(1)
    
    def update_site_settings(self):
        """Actualiza las configuraciones básicas del sitio."""
        print("\n📝 Actualizando configuraciones del sitio...")
        
        settings = {
            "title": self.santeria_config["site_title"],
            "description": self.santeria_config["site_tagline"],
            "timezone": "America/New_York",
            "date_format": "j F, Y",
            "time_format": "g:i a",
            "start_of_week": 1,  # Lunes
            "language": "es_ES"
        }
        
        for setting, value in settings.items():
            try:
                response = self.wp_api.put(f"settings", {setting: value})
                if response.status_code == 200:
                    print(f"✅ {setting}: {value}")
                else:
                    print(f"⚠️ No se pudo actualizar {setting}")
            except Exception as e:
                print(f"⚠️ Error actualizando {setting}: {str(e)}")
        
        time.sleep(1)
    
    def create_update_pages(self):
        """Crea o actualiza las páginas principales."""
        print("\n📄 Creando/actualizando páginas...")
        
        for page_data in self.santeria_config["pages"]:
            try:
                # Verificar si la página ya existe
                existing_pages = self.wp_api.get("pages", params={"slug": page_data["slug"]})
                
                page_content = {
                    "title": page_data["title"],
                    "content": page_data["content"],
                    "slug": page_data["slug"],
                    "status": "publish",
                    "type": "page"
                }
                
                if existing_pages.json():
                    # Actualizar página existente
                    page_id = existing_pages.json()[0]["id"]
                    response = self.wp_api.put(f"pages/{page_id}", page_content)
                    print(f"✅ Página actualizada: {page_data['title']}")
                else:
                    # Crear nueva página
                    response = self.wp_api.post("pages", page_content)
                    print(f"✅ Página creada: {page_data['title']}")
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"⚠️ Error con página {page_data['title']}: {str(e)}")
    
    def update_additional_settings(self):
        """Actualiza configuraciones adicionales del tema."""
        print("\n⚙️ Aplicando configuraciones adicionales...")
        
        additional_settings = {
            "posts_per_page": 12,  # Productos por página
            "default_pingback_flag": 0,  # Desactivar pingbacks
            "default_ping_status": "closed",  # Cerrar pings por defecto
            "default_comment_status": "open",  # Permitir comentarios
            "moderation_notify": 1,  # Notificar moderación
            "comments_notify": 1,  # Notificar nuevos comentarios
        }
        
        for setting, value in additional_settings.items():
            try:
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"✅ {setting}: {value}")
                time.sleep(0.2)
            except Exception as e:
                print(f"⚠️ Error actualizando {setting}: {str(e)}")

def main():
    """Función principal."""
    print("🌟 TRANSFORMADOR DE TEMA A SANTERÍA YORUBA 🌟")
    print("=" * 50)
    
    try:
        transformer = ThemeSanteriaTransformer()
        transformer.run_transformation()
        
        print("\n" + "=" * 50)
        print("🎉 ¡Transformación completada!")
        print("\n📌 Próximos pasos recomendados:")
        print("1. Revisar el sitio web para verificar los cambios")
        print("2. Personalizar colores y estilos desde el Customizer")
        print("3. Agregar logo y favicon relacionados con Santería")
        print("4. Configurar productos en WooCommerce")
        print("5. Crear contenido de blog sobre tradiciones yorubas")
        
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
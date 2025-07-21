#!/usr/bin/env python3
"""
Guía completa para transformar el tema WordPress de joyería a Santería Yoruba.
Incluye tanto transformaciones automáticas via API como instrucciones manuales.
"""

import json
import sys
import time
from utils.wordpress_api import get_wp_api

class ThemeTransformationGuide:
    def __init__(self):
        self.wp_api = get_wp_api()
    
    def run_guided_transformation(self):
        """Ejecuta la transformación guiada completa."""
        print("🌟 GUÍA COMPLETA DE TRANSFORMACIÓN A SANTERÍA YORUBA 🌟")
        print("=" * 70)
        
        try:
            # Fase 1: Cambios automáticos
            print("\n📋 FASE 1: CAMBIOS AUTOMÁTICOS VIA API")
            print("-" * 50)
            self.apply_automatic_changes()
            
            # Fase 2: Instrucciones manuales
            print("\n📋 FASE 2: CAMBIOS MANUALES REQUERIDOS")
            print("-" * 50)
            self.display_manual_instructions()
            
            # Fase 3: Verificación y próximos pasos
            print("\n📋 FASE 3: VERIFICACIÓN Y PRÓXIMOS PASOS")
            print("-" * 50)
            self.display_verification_steps()
            
        except Exception as e:
            print(f"❌ Error durante la transformación: {str(e)}")
            sys.exit(1)
    
    def apply_automatic_changes(self):
        """Aplica todos los cambios que pueden hacerse automáticamente."""
        print("🔄 Aplicando cambios automáticos...")
        
        # 1. Configuraciones del sitio
        self.update_site_configuration()
        
        # 2. Crear páginas informativas
        self.create_informational_pages()
        
        print("✅ Cambios automáticos completados!")
    
    def update_site_configuration(self):
        """Actualiza la configuración básica del sitio."""
        print("\n⚙️ Actualizando configuración del sitio...")
        
        settings = {
            "title": "Botánica Oshún - Artículos Religiosos Yoruba",
            "description": "Tu tienda de confianza para productos de Santería, Ifá y tradiciones Yoruba",
            "language": "es_ES",
            "timezone": "America/New_York"
        }
        
        for setting, value in settings.items():
            try:
                response = self.wp_api.put("settings", {setting: value})
                if response.status_code == 200:
                    print(f"  ✅ {setting}: {value}")
                else:
                    print(f"  ⚠️ No se pudo actualizar {setting}")
                time.sleep(0.3)
            except Exception as e:
                print(f"  ❌ Error con {setting}: {str(e)}")
    
    def create_informational_pages(self):
        """Crea páginas informativas sobre Santería."""
        print("\n📄 Creando páginas informativas...")
        
        pages = [
            {
                "title": "Sobre Nuestra Botánica",
                "slug": "sobre-nosotros",
                "content": self.get_about_page_content()
            },
            {
                "title": "Guía de Orishas",
                "slug": "guia-orishas",
                "content": self.get_orishas_guide_content()
            }
        ]
        
        for page_data in pages:
            try:
                # Verificar si existe
                existing = self.wp_api.get("pages", params={"slug": page_data["slug"]})
                
                if existing.json():
                    # Actualizar existente
                    page_id = existing.json()[0]["id"]
                    response = self.wp_api.put(f"pages/{page_id}", {
                        "title": page_data["title"],
                        "content": page_data["content"]
                    })
                    print(f"  ✅ Página actualizada: {page_data['title']}")
                else:
                    # Crear nueva
                    response = self.wp_api.post("pages", {
                        "title": page_data["title"],
                        "content": page_data["content"],
                        "slug": page_data["slug"],
                        "status": "publish"
                    })
                    print(f"  ✅ Página creada: {page_data['title']}")
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  ❌ Error con página {page_data['title']}: {str(e)}")
    
    def display_manual_instructions(self):
        """Muestra las instrucciones para cambios manuales."""
        print("📝 Los siguientes cambios deben realizarse MANUALMENTE:")
        
        print("\n🎨 1. PERSONALIZACIÓN DEL TEMA (Apariencia > Personalizar)")
        customizer_instructions = [
            "Ir a Apariencia > Personalizar",
            "Cambiar colores a tonos tierra y dorados (representando Orishas)",
            "Subir logo relacionado con Santería (símbolos yorubas)",
            "Configurar favicon con símbolo espiritual",
            "Ajustar tipografías para que sean más místicas"
        ]
        
        for instruction in customizer_instructions:
            print(f"   • {instruction}")
        
        print("\n📁 2. ARCHIVOS DE TEMA A EDITAR")
        print("\n   📄 header.php:")
        print("      • Cambiar textos del header por terminología de Santería")
        print("      • Agregar bendiciones o frases espirituales")
        print("      • Modificar navegación principal")
        
        print("\n   📄 footer.php:")
        print("      • Cambiar copyright a nombre de botánica")
        print("      • Agregar información de contacto espiritual")
        print("      • Incluir horarios de consulta")
        
        print("\n   📄 front-page.php:")
        print("      • Modificar sección hero con imágenes de Orishas")
        print("      • Cambiar textos promocionales por espirituales")
        print("      • Adaptar call-to-actions")
        
        print("\n🎨 3. MODIFICACIONES DE CSS")
        css_instructions = [
            "Cambiar paleta de colores a tonos espirituales",
            "Agregar efectos místicos y sombras",
            "Personalizar botones con estilo ceremonial",
            "Modificar tipografías para mayor misticismo"
        ]
        
        for instruction in css_instructions:
            print(f"   • {instruction}")
        
        # Instrucciones específicas para el tema Joice
        self.display_joice_specific_instructions()
    
    def display_joice_specific_instructions(self):
        """Muestra instrucciones específicas para el tema Joice."""
        print("\n💎 4. INSTRUCCIONES ESPECÍFICAS PARA EL TEMA JOICE")
        
        joice_instructions = [
            "Ir a Apariencia > Editor de temas",
            "Editar style.css para cambiar colores principales:",
            "  - Cambiar #d4af37 (dorado joyería) por #8B4513 (marrón tierra)",
            "  - Cambiar #333 (negro) por #2F1B14 (marrón oscuro)",
            "  - Agregar colores de Orishas: #FFD700 (Oshún), #000080 (Yemayá)",
            "",
            "Editar header.php:",
            "  - Cambiar 'Jewelry Store' por 'Botánica Oshún'",
            "  - Modificar navegación principal con categorías de Santería",
            "",
            "Editar front-page.php:",
            "  - Cambiar banner principal con imágenes de Orishas",
            "  - Modificar sección de productos destacados",
            "  - Adaptar call-to-actions para consultas espirituales"
        ]
        
        for instruction in joice_instructions:
            if instruction == "":
                print()
            else:
                print(f"   • {instruction}")
    
    def display_verification_steps(self):
        """Muestra los pasos de verificación y próximas acciones."""
        print("✅ VERIFICACIÓN Y PRÓXIMOS PASOS:")
        
        verification_steps = [
            "Revisar el sitio web para verificar cambios aplicados",
            "Probar funcionalidad de WooCommerce",
            "Verificar que todas las páginas se muestren correctamente",
            "Comprobar responsividad en dispositivos móviles",
            "Testear proceso de compra completo",
            "",
            "PRÓXIMAS ACCIONES RECOMENDADAS:",
            "1. Subir productos reales de Santería con imágenes auténticas",
            "2. Crear contenido de blog sobre tradiciones yorubas",
            "3. Configurar métodos de pago apropiados",
            "4. Establecer políticas de envío para productos espirituales",
            "5. Crear formulario de consultas espirituales"
        ]
        
        for step in verification_steps:
            if step == "":
                print()
            elif step.startswith("PRÓXIMAS"):
                print(f"\n🎯 {step}")
            else:
                print(f"   • {step}")
    
    def get_about_page_content(self):
        """Retorna el contenido para la página 'Sobre Nosotros'."""
        return """
        <div class="about-botanica">
            <h2>Bienvenidos a Botánica Oshún</h2>
            <p class="lead">Desde 1999, hemos sido el hogar espiritual de la comunidad yoruba, ofreciendo productos auténticos y bendecidos para la práctica de la Santería e Ifá.</p>
            
            <h3>Nuestra Historia</h3>
            <p>Fundada por la Iyalosha Carmen Rodríguez, nuestra botánica nació del deseo de preservar y honrar las tradiciones ancestrales yorubas. Con más de 25 años de experiencia en la religión, Carmen ha dedicado su vida a servir a la comunidad espiritual.</p>
            
            <h3>¿Qué Ofrecemos?</h3>
            <ul>
                <li><strong>Herramientas Ceremoniales:</strong> Implementos auténticos para cada Orisha</li>
                <li><strong>Collares y Accesorios:</strong> Fabricados con cuentas tradicionales</li>
                <li><strong>Veladoras Rituales:</strong> Preparadas según tradiciones ancestrales</li>
                <li><strong>Productos para Limpias:</strong> Hierbas y elementos purificadores</li>
                <li><strong>Consultas Espirituales:</strong> Orientación con santeros experimentados</li>
            </ul>
            
            <h3>Nuestro Compromiso</h3>
            <p>Todos nuestros productos son bendecidos y preparados siguiendo estrictamente las tradiciones yorubas. Trabajamos directamente con artesanos en Cuba y Nigeria para garantizar la autenticidad de cada artículo.</p>
            
            <h3>Horarios de Atención</h3>
            <p><strong>Lunes a Viernes:</strong> 9:00 AM - 7:00 PM<br>
            <strong>Sábados:</strong> 9:00 AM - 6:00 PM<br>
            <strong>Domingos:</strong> 10:00 AM - 4:00 PM</p>
            
            <p><em>¡Ashe! Te esperamos en nuestra botánica.</em></p>
        </div>
        """
    
    def get_orishas_guide_content(self):
        """Retorna el contenido para la guía de Orishas."""
        return """
        <div class="orishas-guide">
            <h2>Guía de los Orishas</h2>
            <p class="lead">Conoce a las deidades yorubas y sus características principales.</p>
            
            <div class="orisha-section">
                <h3>Elegguá - El Guardián de los Caminos</h3>
                <p><strong>Colores:</strong> Rojo y negro<br>
                <strong>Día:</strong> Lunes<br>
                <strong>Ofrendas:</strong> Caramelos, aguardiente, cigarros<br>
                <strong>Función:</strong> Abre y cierra caminos, guardián de las encrucijadas</p>
            </div>
            
            <div class="orisha-section">
                <h3>Oshún - Diosa del Amor y la Abundancia</h3>
                <p><strong>Colores:</strong> Amarillo y dorado<br>
                <strong>Día:</strong> Sábado<br>
                <strong>Ofrendas:</strong> Miel, canela, girasoles<br>
                <strong>Función:</strong> Amor, fertilidad, abundancia económica</p>
            </div>
            
            <div class="orisha-section">
                <h3>Yemayá - Madre de las Aguas</h3>
                <p><strong>Colores:</strong> Azul y blanco<br>
                <strong>Día:</strong> Sábado<br>
                <strong>Ofrendas:</strong> Sandía, melaza, flores blancas<br>
                <strong>Función:</strong> Maternidad, protección, sabiduría</p>
            </div>
            
            <div class="orisha-section">
                <h3>Changó - Señor del Fuego y la Justicia</h3>
                <p><strong>Colores:</strong> Rojo y blanco<br>
                <strong>Día:</strong> Viernes<br>
                <strong>Ofrendas:</strong> Manzanas rojas, cerveza, tambores<br>
                <strong>Función:</strong> Justicia, poder, masculinidad</p>
            </div>
            
            <p><em>Para una consulta personalizada sobre qué Orisha te rige, agenda una cita con nuestros santeros.</em></p>
        </div>
        """

def main():
    """Función principal."""
    try:
        guide = ThemeTransformationGuide()
        guide.run_guided_transformation()
        
        print("\n" + "=" * 70)
        print("🎉 ¡GUÍA DE TRANSFORMACIÓN COMPLETADA!")
        print("\n💡 RECUERDA:")
        print("- Los cambios automáticos ya fueron aplicados")
        print("- Los cambios manuales requieren acceso al admin de WordPress")
        print("- Sigue las instrucciones paso a paso para mejores resultados")
        
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
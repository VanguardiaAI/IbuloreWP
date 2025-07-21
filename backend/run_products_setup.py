#!/usr/bin/env python3
"""
Script de confirmación para crear productos de prueba
Este script requiere confirmación antes de crear los productos
"""

import os
import sys
from create_test_products import main, logger

def confirm_operation():
    """Solicitar confirmación del usuario antes de proceder"""
    print("🛍️ CREACIÓN DE PRODUCTOS DE PRUEBA - SANTERÍA YORUBA 🛍️")
    print()
    print("Este script va a:")
    print("✅ CREAR productos auténticos de santería yoruba")
    print("✅ DISTRIBUIR entre 1-4 productos por categoría")
    print("✅ ASIGNAR precios realistas y descripciones detalladas")
    print("✅ CONFIGURAR stock e inventario automáticamente")
    print()
    
    # Mostrar algunos ejemplos de productos
    print("📦 Ejemplos de productos que se crearán:")
    examples = [
        "🕯️ Veladoras y velones rituales",
        "📿 Collares de orishas (Yemayá, Changó, Oshún)",
        "🧿 Herramientas ceremoniales",
        "🧴 Baños espirituales y esencias",
        "👗 Ropa religiosa para iyabos",
        "🥥 Productos para mesa de santo",
        "🔔 Instrumentos rituales (campanas, maracas)",
        "🏺 Tibores decorativos para orishas",
        "💍 Accesorios ceremoniales",
        "📚 Elementos para Ifá y consultas"
    ]
    
    for example in examples:
        print(f"   {example}")
    
    print()
    print("🔢 Resumen:")
    print("   • Total estimado: ~150+ productos")
    print("   • Todas las 84 categorías tendrán productos")
    print("   • Precios desde $3.50 hasta $450.00")
    print("   • Descripciones auténticas y detalladas")
    print()
    
    # Solicitar confirmación
    response = input("¿Quieres proceder con la creación de productos? (escribe 'SI'): ")
    
    if response.strip().upper() != "SI":
        print("❌ Operación cancelada.")
        return False
    
    return True

def check_environment():
    """Verificar que el entorno esté configurado correctamente"""
    print("🔍 Verificando configuración del entorno...")
    
    # Verificar que existe el archivo .env
    if not os.path.exists('.env'):
        print("❌ Error: No se encontró el archivo .env")
        return False
    
    # Verificar que existe el mapeo de categorías
    if not os.path.exists('category_mapping.json'):
        print("❌ Error: No se encontró category_mapping.json")
        print("   Ejecuta primero el script de categorías: python run_category_setup.py")
        return False
    
    # Verificar variables de entorno
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ['WC_STORE_URL', 'WC_CONSUMER_KEY', 'WC_CONSUMER_SECRET']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Error: Faltan variables en el archivo .env:")
        for var in missing_vars:
            print(f"   - {var}")
        return False
    
    print("✅ Configuración del entorno verificada correctamente")
    return True

def main_with_confirmation():
    """Función principal con confirmaciones de seguridad"""
    print("🏪 CREACIÓN DE PRODUCTOS DE PRUEBA - TIENDA IBULORE")
    print("=" * 60)
    
    # Verificar entorno
    if not check_environment():
        sys.exit(1)
    
    print()
    
    # Solicitar confirmación
    if not confirm_operation():
        sys.exit(0)
    
    print()
    print("🚀 Iniciando creación de productos...")
    print("=" * 60)
    
    # Ejecutar el proceso principal
    try:
        success = main()
        
        if success:
            print()
            print("=" * 60)
            print("🎉 ¡PRODUCTOS CREADOS EXITOSAMENTE!")
            print()
            print("✅ Se han creado productos auténticos de santería yoruba")
            print("✅ Todas las categorías ahora tienen productos")
            print("✅ Los productos están publicados y disponibles")
            print("✅ El inventario se configuró automáticamente")
            print("✅ El resultado se guardó en 'created_products.json'")
            print()
            print("🛍️ Tu tienda está lista para recibir clientes")
            print("=" * 60)
        else:
            print()
            print("=" * 60)
            print("❌ EL PROCESO FALLÓ")
            print("Revisa los logs anteriores para más detalles")
            print("=" * 60)
            sys.exit(1)
            
    except KeyboardInterrupt:
        print()
        print("⚠️  Proceso interrumpido por el usuario")
        sys.exit(1)
    except Exception as e:
        print()
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main_with_confirmation() 
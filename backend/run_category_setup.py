#!/usr/bin/env python3
"""
Script de confirmación para ejecutar la limpieza y configuración de categorías
Este script requiere confirmación explícita antes de ejecutar operaciones destructivas
"""

import os
import sys
from clean_and_setup_categories import main, logger

def confirm_operation():
    """Solicitar confirmación del usuario antes de proceder"""
    print("🚨 ADVERTENCIA: OPERACIÓN DESTRUCTIVA 🚨")
    print()
    print("Este script va a:")
    print("1. ❌ ELIMINAR TODOS LOS PRODUCTOS existentes")
    print("2. ❌ ELIMINAR TODAS LAS CATEGORÍAS existentes")
    print("3. ✅ CREAR la nueva estructura de categorías")
    print()
    print("Esta operación NO SE PUEDE DESHACER.")
    print()
    
    # Mostrar estructura que se va a crear
    print("📋 Nueva estructura de categorías a crear:")
    categories = [
        "1. Herramientas para santos",
        "2. Collares", 
        "3. Accesorios (11 subcategorías)",
        "4. Veladoras y velones (4 subcategorías)",
        "5. Rituales y baños espirituales (4 subcategorías)",
        "6. Ropa religiosa (3 subcategorías)",
        "7. Kit de iyabo (2 subcategorías)",
        "8. Inciensos",
        "9. Kit de guerreros y Orula (2 subcategorías)",
        "10. Mesa de santo (19 subcategorías)",
        "11. Esencias y extractos (2 subcategorías)",
        "12. Jabones espirituales (10 subcategorías)",
        "13. Caracoles (2 subcategorías)",
        "14. Rosarios",
        "15. Ifá y accesorios (4 subcategorías)",
        "16. Accesorios para Eleggua (2 subcategorías)",
        "17. Tibores",
        "18. Pedestales",
        "19. Coronas y Aketes"
    ]
    
    for category in categories:
        print(f"   {category}")
    
    print()
    print("Total: 19 categorías principales + 65 subcategorías = 84 categorías")
    print()
    
    # Solicitar confirmación
    response = input("¿Estás COMPLETAMENTE SEGURO de que quieres proceder? (escribe 'SI, ESTOY SEGURO'): ")
    
    if response.strip() != "SI, ESTOY SEGURO":
        print("❌ Operación cancelada.")
        return False
    
    # Segunda confirmación
    print()
    response2 = input("Última confirmación - ¿Proceder con la eliminación? (escribe 'PROCEDER'): ")
    
    if response2.strip() != "PROCEDER":
        print("❌ Operación cancelada.")
        return False
    
    return True

def check_environment():
    """Verificar que el entorno esté configurado correctamente"""
    print("🔍 Verificando configuración del entorno...")
    
    # Verificar que existe el archivo .env
    if not os.path.exists('.env'):
        print("❌ Error: No se encontró el archivo .env")
        print("   Asegúrate de que el archivo .env esté en el directorio backend/")
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
        print(f"❌ Error: Faltan las siguientes variables en el archivo .env:")
        for var in missing_vars:
            print(f"   - {var}")
        return False
    
    print("✅ Configuración del entorno verificada correctamente")
    return True

def main_with_confirmation():
    """Función principal con confirmaciones de seguridad"""
    print("🏪 LIMPIEZA Y CONFIGURACIÓN DE CATEGORÍAS - TIENDA IBULORE")
    print("=" * 60)
    
    # Verificar entorno
    if not check_environment():
        sys.exit(1)
    
    print()
    
    # Solicitar confirmación
    if not confirm_operation():
        sys.exit(0)
    
    print()
    print("🚀 Iniciando proceso...")
    print("=" * 60)
    
    # Ejecutar el proceso principal
    try:
        success = main()
        
        if success:
            print()
            print("=" * 60)
            print("🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!")
            print()
            print("✅ Todos los productos han sido eliminados")
            print("✅ Todas las categorías anteriores han sido eliminadas")
            print("✅ La nueva estructura de categorías ha sido creada")
            print("✅ El mapeo de categorías se guardó en 'category_mapping.json'")
            print()
            print("🏪 Tu tienda está lista para agregar productos en las nuevas categorías")
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
        print("La tienda puede estar en un estado inconsistente")
        sys.exit(1)
    except Exception as e:
        print()
        print(f"❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main_with_confirmation() 
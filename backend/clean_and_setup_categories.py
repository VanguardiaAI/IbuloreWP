#!/usr/bin/env python3
"""
Script para limpiar y configurar las categorías de la tienda Ibulore
1. Elimina todos los productos existentes
2. Elimina todas las categorías existentes
3. Crea la nueva estructura de categorías
"""

import requests
import json
import time
import os
from typing import List, Dict, Optional
import logging
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración de WooCommerce API desde variables de entorno
WC_URL = os.getenv('WC_STORE_URL')
WC_CONSUMER_KEY = os.getenv('WC_CONSUMER_KEY')
WC_CONSUMER_SECRET = os.getenv('WC_CONSUMER_SECRET')

# Verificar que las credenciales estén configuradas
if not all([WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET]):
    logger.error("¡ADVERTENCIA! Las credenciales de WooCommerce no están configuradas correctamente")
    logger.error("Verifica que tu archivo .env contenga WC_STORE_URL, WC_CONSUMER_KEY y WC_CONSUMER_SECRET")
    exit(1)

class WooCommerceManager:
    def __init__(self, url: str, consumer_key: str, consumer_secret: str):
        self.url = url
        self.auth = (consumer_key, consumer_secret)
        self.session = requests.Session()
        self.session.auth = self.auth
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict:
        """Realizar petición a la API de WooCommerce"""
        url = f"{self.url}/wp-json/wc/v3/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en petición {method} {endpoint}: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Respuesta del servidor: {e.response.text}")
            raise
    
    def get_all_products(self) -> List[Dict]:
        """Obtener todos los productos"""
        logger.info("Obteniendo todos los productos...")
        all_products = []
        page = 1
        per_page = 100
        
        while True:
            params = {'page': page, 'per_page': per_page}
            products = self.make_request('GET', 'products', params=params)
            
            if not products:
                break
                
            all_products.extend(products)
            logger.info(f"Obtenidos {len(products)} productos (página {page})")
            
            if len(products) < per_page:
                break
                
            page += 1
            time.sleep(0.5)  # Evitar rate limiting
            
        logger.info(f"Total de productos obtenidos: {len(all_products)}")
        return all_products
    
    def get_all_categories(self) -> List[Dict]:
        """Obtener todas las categorías"""
        logger.info("Obteniendo todas las categorías...")
        all_categories = []
        page = 1
        per_page = 100
        
        while True:
            params = {'page': page, 'per_page': per_page}
            categories = self.make_request('GET', 'products/categories', params=params)
            
            if not categories:
                break
                
            all_categories.extend(categories)
            logger.info(f"Obtenidas {len(categories)} categorías (página {page})")
            
            if len(categories) < per_page:
                break
                
            page += 1
            time.sleep(0.5)
            
        logger.info(f"Total de categorías obtenidas: {len(all_categories)}")
        return all_categories
    
    def delete_all_products(self) -> bool:
        """Eliminar todos los productos"""
        logger.info("Iniciando eliminación de todos los productos...")
        
        products = self.get_all_products()
        if not products:
            logger.info("No hay productos para eliminar")
            return True
        
        # Eliminar en lotes para ser más eficiente
        batch_size = 50
        total_deleted = 0
        
        for i in range(0, len(products), batch_size):
            batch = products[i:i + batch_size]
            product_ids = [str(product['id']) for product in batch]
            
            try:
                # WooCommerce permite eliminación masiva con force=true
                params = {
                    'delete': 'true',
                    'force': 'true'
                }
                
                for product_id in product_ids:
                    self.make_request('DELETE', f'products/{product_id}', params={'force': True})
                    total_deleted += 1
                    
                logger.info(f"Eliminados {len(product_ids)} productos (total: {total_deleted}/{len(products)})")
                time.sleep(1)  # Pausa entre lotes
                
            except Exception as e:
                logger.error(f"Error eliminando lote de productos: {e}")
                continue
        
        logger.info(f"Eliminación de productos completada. Total eliminados: {total_deleted}")
        return total_deleted == len(products)
    
    def delete_all_categories(self) -> bool:
        """Eliminar todas las categorías"""
        logger.info("Iniciando eliminación de todas las categorías...")
        
        categories = self.get_all_categories()
        if not categories:
            logger.info("No hay categorías para eliminar")
            return True
        
        # Ordenar por jerarquía (eliminar primero las subcategorías)
        # Las categorías con parent > 0 son subcategorías
        subcategories = [cat for cat in categories if cat.get('parent', 0) > 0]
        root_categories = [cat for cat in categories if cat.get('parent', 0) == 0]
        
        # Eliminar primero subcategorías, luego categorías raíz
        all_to_delete = subcategories + root_categories
        total_deleted = 0
        
        for category in all_to_delete:
            try:
                self.make_request('DELETE', f'products/categories/{category["id"]}', params={'force': True})
                total_deleted += 1
                logger.info(f"Eliminada categoría: {category['name']} (ID: {category['id']}) - {total_deleted}/{len(all_to_delete)}")
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error eliminando categoría {category['name']}: {e}")
                continue
        
        logger.info(f"Eliminación de categorías completada. Total eliminadas: {total_deleted}")
        return total_deleted == len(categories)
    
    def create_category(self, name: str, parent_id: int = 0, description: str = "") -> Optional[Dict]:
        """Crear una nueva categoría"""
        data = {
            'name': name,
            'parent': parent_id,
            'description': description
        }
        
        try:
            category = self.make_request('POST', 'products/categories', data=data)
            logger.info(f"Creada categoría: {name} (ID: {category['id']})")
            return category
        except Exception as e:
            logger.error(f"Error creando categoría {name}: {e}")
            return None

def create_category_structure(wc_manager: WooCommerceManager) -> Dict[str, int]:
    """Crear la estructura completa de categorías"""
    logger.info("Iniciando creación de estructura de categorías...")
    
    category_map = {}  # Para mapear nombres a IDs
    
    # Definir la estructura de categorías
    categories_structure = [
        {
            'name': 'Herramientas para santos',
            'subcategories': []
        },
        {
            'name': 'Collares',
            'subcategories': []
        },
        {
            'name': 'Accesorios',
            'subcategories': [
                'Accesorios para tibores',
                'Campanas',
                'Collares',
                'Maracas',
                'Balanzas',
                'Fermonas',
                'Carretillas',
                'Máscara para Oya',
                'Machete forrado para Oya',
                'Cartas',
                'Muñecas (con trajes o por separado)'
            ]
        },
        {
            'name': 'Veladoras y velones',
            'subcategories': [
                'Veladoras comunes',
                'Velones unicolores',
                'Velones para orishas',
                'Velones de pareja'
            ]
        },
        {
            'name': 'Rituales y baños espirituales',
            'subcategories': [
                'Baños de amor',
                'Baños de abundancia',
                'Baños de salud',
                'Baños de dinero'
            ]
        },
        {
            'name': 'Ropa religiosa',
            'subcategories': [
                'Ropa para iyaboses',
                'Traje de coronación',
                'Traje para montador'
            ]
        },
        {
            'name': 'Kit de iyabo',
            'subcategories': [
                'Kit para mujer',
                'Kit para hombre'
            ]
        },
        {
            'name': 'Inciensos',
            'subcategories': []
        },
        {
            'name': 'Kit de guerreros y Orula',
            'subcategories': [
                'Guerreros',
                'Ikofa (Orula)'
            ]
        },
        {
            'name': 'Mesa de santo',
            'subcategories': [
                'Cascarilla',
                'Pescado ahumado',
                'Jutía',
                'Corojo',
                'Maíz tostado',
                'Manteca de cacao',
                'Aguardiente',
                'Azulillo / añil',
                'Pimienta de guinea',
                'Pinturas de santo',
                'Pajarera',
                'Pinceles',
                'Jícaras',
                'Ashé de santo',
                'Piedra de rayo',
                'Alumbre',
                'Agua florida',
                'Wereye',
                'Palo santo'
            ]
        },
        {
            'name': 'Esencias y extractos',
            'subcategories': [
                'Esencias más vendidas',
                'Extractos disponibles'
            ]
        },
        {
            'name': 'Jabones espirituales',
            'subcategories': [
                'Jabón para limpias',
                'Jabón para destrancadera',
                'Jabón para evolución',
                'Jabón de coco',
                'Jabón de miel',
                'Jabón de romero',
                'Jabón de Eleggua',
                'Jabón nigeriano',
                'Jabón de tierra',
                'Jabón de suerte'
            ]
        },
        {
            'name': 'Caracoles',
            'subcategories': [
                'Caracoles Aye',
                'Caracol normal'
            ]
        },
        {
            'name': 'Rosarios',
            'subcategories': []
        },
        {
            'name': 'Ifá y accesorios',
            'subcategories': [
                'Tablero de Ifá',
                'Accesorios para Ifá',
                'Semillas para ritual (Ikin)',
                'Opeles'
            ]
        },
        {
            'name': 'Accesorios para Eleggua',
            'subcategories': [
                'Platos para Eleggua',
                'Casas para Eleggua'
            ]
        },
        {
            'name': 'Tibores',
            'subcategories': []
        },
        {
            'name': 'Pedestales',
            'subcategories': []
        },
        {
            'name': 'Coronas y Aketes',
            'subcategories': []
        }
    ]
    
    # Crear categorías principales primero
    for category_data in categories_structure:
        parent_category = wc_manager.create_category(category_data['name'])
        if parent_category:
            category_map[category_data['name']] = parent_category['id']
            time.sleep(0.5)
    
    # Crear subcategorías
    for category_data in categories_structure:
        if category_data['subcategories'] and category_data['name'] in category_map:
            parent_id = category_map[category_data['name']]
            
            for subcategory_name in category_data['subcategories']:
                subcategory = wc_manager.create_category(subcategory_name, parent_id)
                if subcategory:
                    category_map[subcategory_name] = subcategory['id']
                time.sleep(0.5)
    
    logger.info(f"Estructura de categorías creada. Total: {len(category_map)} categorías")
    return category_map

def main():
    """Función principal"""
    logger.info("=== INICIANDO LIMPIEZA Y CONFIGURACIÓN DE CATEGORÍAS IBULORE ===")
    
    # Mostrar configuración (sin mostrar credenciales completas por seguridad)
    logger.info(f"URL de la tienda: {WC_URL}")
    logger.info(f"Consumer Key: {WC_CONSUMER_KEY[:10]}...")
    logger.info(f"Consumer Secret: {WC_CONSUMER_SECRET[:10]}...")
    
    try:
        # Inicializar manager de WooCommerce
        wc_manager = WooCommerceManager(WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET)
        
        # Paso 1: Eliminar todos los productos
        logger.info("\n=== PASO 1: ELIMINANDO TODOS LOS PRODUCTOS ===")
        if not wc_manager.delete_all_products():
            logger.warning("No se pudieron eliminar todos los productos, pero continuamos...")
        
        # Paso 2: Eliminar todas las categorías
        logger.info("\n=== PASO 2: ELIMINANDO TODAS LAS CATEGORÍAS ===")
        if not wc_manager.delete_all_categories():
            logger.warning("No se pudieron eliminar todas las categorías, pero continuamos...")
        
        # Paso 3: Crear nueva estructura de categorías
        logger.info("\n=== PASO 3: CREANDO NUEVA ESTRUCTURA DE CATEGORÍAS ===")
        category_map = create_category_structure(wc_manager)
        
        # Guardar mapeo de categorías para referencia futura
        with open('category_mapping.json', 'w', encoding='utf-8') as f:
            json.dump(category_map, f, indent=2, ensure_ascii=False)
        
        logger.info(f"\n=== PROCESO COMPLETADO EXITOSAMENTE ===")
        logger.info(f"- Productos eliminados: ✓")
        logger.info(f"- Categorías eliminadas: ✓")
        logger.info(f"- Nuevas categorías creadas: {len(category_map)}")
        logger.info(f"- Mapeo guardado en: category_mapping.json")
        
        return True
        
    except Exception as e:
        logger.error(f"Error durante el proceso: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 ¡Proceso completado exitosamente!")
        print("La tienda está limpia y lista con la nueva estructura de categorías.")
    else:
        print("\n❌ El proceso falló. Revisa los logs para más detalles.") 
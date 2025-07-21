#!/usr/bin/env python3
"""
Script para crear productos de prueba para la tienda Ibulore
Crea productos auténticos relacionados con santería yoruba
Distribuye entre 1-4 productos por categoría según corresponda
"""

import requests
import json
import time
import os
import random
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

class ProductManager:
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
            else:
                raise ValueError(f"Método HTTP no soportado: {method}")
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en petición {method} {endpoint}: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Respuesta del servidor: {e.response.text}")
            raise
    
    def create_product(self, product_data: Dict) -> Optional[Dict]:
        """Crear un nuevo producto"""
        try:
            product = self.make_request('POST', 'products', data=product_data)
            logger.info(f"Creado producto: {product['name']} (ID: {product['id']})")
            return product
        except Exception as e:
            logger.error(f"Error creando producto {product_data.get('name', 'Sin nombre')}: {e}")
            return None

def load_category_mapping() -> Dict[str, int]:
    """Cargar el mapeo de categorías desde el archivo JSON"""
    try:
        with open('category_mapping.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error("No se encontró category_mapping.json. Ejecuta primero el script de categorías.")
        return {}
    except Exception as e:
        logger.error(f"Error cargando category_mapping.json: {e}")
        return {}

def get_product_templates() -> Dict[str, List[Dict]]:
    """Definir plantillas de productos para cada categoría"""
    return {
        "Herramientas para santos": [
            {
                "name": "Cuchillo ritual consagrado",
                "description": "Cuchillo tradicional para ceremonias de santería, consagrado y bendecido. Mango de madera sagrada.",
                "regular_price": "45.00",
                "short_description": "Cuchillo ritual consagrado para ceremonias"
            },
            {
                "name": "Caldero de hierro para Oggún",
                "description": "Caldero tradicional de hierro fundido para ceremonias dedicadas a Oggún. Tamaño mediano, perfecto para ofrendas.",
                "regular_price": "85.00",
                "short_description": "Caldero de hierro consagrado para Oggún"
            }
        ],
        
        "Collares": [
            {
                "name": "Collar de Yemayá (azul y blanco)",
                "description": "Collar tradicional de Yemayá con cuentas azules y blancas. Hecho a mano siguiendo tradiciones yorubas.",
                "regular_price": "25.00",
                "short_description": "Collar tradicional de Yemayá"
            },
            {
                "name": "Collar de Changó (rojo y blanco)",
                "description": "Collar de Changó con cuentas rojas y blancas alternadas. Consagrado según tradición yoruba.",
                "regular_price": "28.00",
                "short_description": "Collar tradicional de Changó"
            },
            {
                "name": "Collar de Oshún (amarillo y oro)",
                "description": "Collar de Oshún con cuentas amarillas y doradas. Representa la dulzura y el amor de la orisha.",
                "regular_price": "30.00",
                "short_description": "Collar tradicional de Oshún"
            }
        ],
        
        "Accesorios para tibores": [
            {
                "name": "Tapa decorativa para tibor de Yemayá",
                "description": "Tapa decorativa azul y blanca para tibor de Yemayá. Diseño tradicional con símbolos marinos.",
                "regular_price": "15.00",
                "short_description": "Tapa decorativa para tibor de Yemayá"
            }
        ],
        
        "Campanas": [
            {
                "name": "Campanilla de bronce para altar",
                "description": "Campanilla tradicional de bronce para llamar a los orishas durante las ceremonias.",
                "regular_price": "12.00",
                "short_description": "Campanilla ritual de bronce"
            },
            {
                "name": "Campana grande para ceremonias",
                "description": "Campana de bronce de tamaño grande para ceremonias importantes. Sonido claro y penetrante.",
                "regular_price": "35.00",
                "short_description": "Campana ceremonial grande"
            }
        ],
        
        "Maracas": [
            {
                "name": "Maracas de güiro natural",
                "description": "Par de maracas tradicionales hechas de güiro natural. Sonido auténtico para ceremonias.",
                "regular_price": "18.00",
                "short_description": "Maracas tradicionales de güiro"
            },
            {
                "name": "Maracas decoradas para Changó",
                "description": "Maracas especiales decoradas con los colores de Changó (rojo y blanco). Para ceremonias específicas.",
                "regular_price": "22.00",
                "short_description": "Maracas ceremoniales de Changó"
            }
        ],
        
        "Balanzas": [
            {
                "name": "Balanza ritual de bronce",
                "description": "Balanza tradicional de bronce para pesar ingredientes rituales. Símbolo de justicia y equilibrio.",
                "regular_price": "55.00",
                "short_description": "Balanza ritual de bronce"
            }
        ],
        
        "Fermonas": [
            {
                "name": "Fermona de hierro forjado",
                "description": "Fermona tradicional de hierro forjado para ceremonias. Herramienta esencial del babalawo.",
                "regular_price": "40.00",
                "short_description": "Fermona ritual de hierro"
            }
        ],
        
        "Carretillas": [
            {
                "name": "Carretilla miniatura para Eleggua",
                "description": "Carretilla miniatura decorativa para el altar de Eleggua. Símbolo de trabajo y caminos.",
                "regular_price": "25.00",
                "short_description": "Carretilla ritual para Eleggua"
            }
        ],
        
        "Máscara para Oya": [
            {
                "name": "Máscara ceremonial de Oya",
                "description": "Máscara tradicional de Oya, orisha de los vientos y tempestades. Hecha a mano con materiales sagrados.",
                "regular_price": "75.00",
                "short_description": "Máscara ceremonial de Oya"
            }
        ],
        
        "Machete forrado para Oya": [
            {
                "name": "Machete ceremonial de Oya",
                "description": "Machete ceremonial forrado para Oya. Símbolo de poder y protección de la orisha guerrera.",
                "regular_price": "95.00",
                "short_description": "Machete ceremonial de Oya"
            }
        ],
        
        "Cartas": [
            {
                "name": "Cartas del Diloggun",
                "description": "Juego completo de cartas para consultas del Diloggun. Incluye manual de interpretación.",
                "regular_price": "35.00",
                "short_description": "Cartas del Diloggun para consultas"
            },
            {
                "name": "Cartas de los Orishas",
                "description": "Baraja especial con imágenes y símbolos de los principales orishas yorubas.",
                "regular_price": "28.00",
                "short_description": "Cartas de los Orishas"
            }
        ],
        
        "Muñecas (con trajes o por separado)": [
            {
                "name": "Muñeca de Yemayá con traje",
                "description": "Muñeca artesanal de Yemayá vestida con traje tradicional azul y blanco. Hecha a mano.",
                "regular_price": "65.00",
                "short_description": "Muñeca artesanal de Yemayá"
            },
            {
                "name": "Traje para muñeca de Oshún",
                "description": "Traje tradicional amarillo y dorado para muñeca de Oshún. Incluye accesorios.",
                "regular_price": "25.00",
                "short_description": "Traje para muñeca de Oshún"
            }
        ],
        
        "Veladoras comunes": [
            {
                "name": "Veladora blanca 7 días",
                "description": "Veladora blanca de 7 días para rituales de purificación y protección.",
                "regular_price": "3.50",
                "short_description": "Veladora blanca ritual 7 días"
            },
            {
                "name": "Veladora roja 7 días",
                "description": "Veladora roja de 7 días para rituales de amor y pasión.",
                "regular_price": "3.50",
                "short_description": "Veladora roja ritual 7 días"
            }
        ],
        
        "Velones unicolores": [
            {
                "name": "Velón azul para Yemayá",
                "description": "Velón azul especial para ceremonias dedicadas a Yemayá. Cera de alta calidad.",
                "regular_price": "8.00",
                "short_description": "Velón azul para Yemayá"
            },
            {
                "name": "Velón amarillo para Oshún",
                "description": "Velón amarillo dorado para ceremonias de Oshún. Atrae prosperidad y amor.",
                "regular_price": "8.00",
                "short_description": "Velón amarillo para Oshún"
            },
            {
                "name": "Velón rojo para Changó",
                "description": "Velón rojo intenso para ceremonias de Changó. Representa fuerza y justicia.",
                "regular_price": "8.00",
                "short_description": "Velón rojo para Changó"
            }
        ],
        
        "Velones para orishas": [
            {
                "name": "Velón de Eleggua (rojo y negro)",
                "description": "Velón especial bicolor para Eleggua. Abre caminos y remueve obstáculos.",
                "regular_price": "12.00",
                "short_description": "Velón especial de Eleggua"
            },
            {
                "name": "Velón de Oggún (verde y negro)",
                "description": "Velón ceremonial para Oggún, orisha del hierro y el trabajo. Verde y negro.",
                "regular_price": "12.00",
                "short_description": "Velón ceremonial de Oggún"
            }
        ],
        
        "Velones de pareja": [
            {
                "name": "Velones de pareja unidos",
                "description": "Par de velones unidos para rituales de amor y unión. Fortalece las relaciones.",
                "regular_price": "15.00",
                "short_description": "Velones rituales de pareja"
            }
        ],
        
        "Baños de amor": [
            {
                "name": "Baño de Oshún para el amor",
                "description": "Baño ritual con hierbas de Oshún para atraer el amor verdadero. Incluye instrucciones.",
                "regular_price": "18.00",
                "short_description": "Baño ritual de amor con Oshún"
            },
            {
                "name": "Baño de miel y canela",
                "description": "Baño dulce con miel y canela para endulzar relaciones y atraer romance.",
                "regular_price": "15.00",
                "short_description": "Baño de miel y canela para amor"
            }
        ],
        
        "Baños de abundancia": [
            {
                "name": "Baño de abundancia con Oshún",
                "description": "Baño ritual para atraer prosperidad económica. Con hierbas doradas de Oshún.",
                "regular_price": "20.00",
                "short_description": "Baño de abundancia con Oshún"
            },
            {
                "name": "Baño de albahaca y canela",
                "description": "Baño tradicional con albahaca y canela para atraer dinero y oportunidades.",
                "regular_price": "16.00",
                "short_description": "Baño de albahaca para abundancia"
            }
        ],
        
        "Baños de salud": [
            {
                "name": "Baño de eucalipto y ruda",
                "description": "Baño purificador con eucalipto y ruda para limpiar energías negativas y fortalecer la salud.",
                "regular_price": "14.00",
                "short_description": "Baño purificador de salud"
            }
        ],
        
        "Baños de dinero": [
            {
                "name": "Baño de piña y canela",
                "description": "Baño especial con piña y canela para atraer dinero rápido y oportunidades económicas.",
                "regular_price": "17.00",
                "short_description": "Baño de piña para dinero"
            }
        ],
        
        "Ropa para iyaboses": [
            {
                "name": "Vestido blanco para iyabo",
                "description": "Vestido tradicional blanco para iyabo (iniciada). Algodón puro, corte tradicional.",
                "regular_price": "85.00",
                "short_description": "Vestido blanco para iyabo"
            },
            {
                "name": "Turbante blanco bordado",
                "description": "Turbante blanco con bordados tradicionales para iyabo. Algodón fino.",
                "regular_price": "25.00",
                "short_description": "Turbante bordado para iyabo"
            }
        ],
        
        "Traje de coronación": [
            {
                "name": "Traje completo de coronación",
                "description": "Traje ceremonial completo para coronación. Incluye vestido, turbante y accesorios.",
                "regular_price": "350.00",
                "short_description": "Traje completo de coronación"
            }
        ],
        
        "Traje para montador": [
            {
                "name": "Camisa blanca para montador",
                "description": "Camisa ceremonial blanca para montador (medium). Algodón puro, corte tradicional.",
                "regular_price": "45.00",
                "short_description": "Camisa ceremonial para montador"
            }
        ],
        
        "Kit para mujer": [
            {
                "name": "Kit completo iyabo mujer",
                "description": "Kit completo para iyabo mujer: vestido, turbante, collar, pulseras y jabón ritual.",
                "regular_price": "150.00",
                "short_description": "Kit completo iyabo mujer"
            }
        ],
        
        "Kit para hombre": [
            {
                "name": "Kit completo iyabo hombre",
                "description": "Kit completo para iyabo hombre: camisa, pantalón, collar, pulsera y jabón ritual.",
                "regular_price": "140.00",
                "short_description": "Kit completo iyabo hombre"
            }
        ],
        
        "Inciensos": [
            {
                "name": "Incienso de sándalo",
                "description": "Incienso natural de sándalo para purificación y meditación. Caja de 20 varillas.",
                "regular_price": "8.00",
                "short_description": "Incienso natural de sándalo"
            },
            {
                "name": "Incienso de mirra",
                "description": "Incienso de mirra para rituales de protección y consagración. Aroma tradicional.",
                "regular_price": "10.00",
                "short_description": "Incienso de mirra ritual"
            },
            {
                "name": "Incienso de copal",
                "description": "Incienso de copal blanco para limpiezas espirituales. Resina natural mexicana.",
                "regular_price": "12.00",
                "short_description": "Incienso de copal blanco"
            }
        ],
        
        "Guerreros": [
            {
                "name": "Set completo de Guerreros",
                "description": "Set completo de los 4 Guerreros: Eleggua, Oggún, Ochosi y Osun. Consagrados tradicionalmente.",
                "regular_price": "450.00",
                "short_description": "Set completo de Guerreros"
            }
        ],
        
        "Ikofa (Orula)": [
            {
                "name": "Mano de Orula (Ikofa)",
                "description": "Mano de Orula tradicional para mujeres. Incluye ikines consagrados y instrucciones.",
                "regular_price": "250.00",
                "short_description": "Mano de Orula (Ikofa)"
            }
        ],
        
        "Cascarilla": [
            {
                "name": "Cascarilla en polvo 100g",
                "description": "Cascarilla natural en polvo para protección y purificación. 100 gramos.",
                "regular_price": "8.00",
                "short_description": "Cascarilla en polvo natural"
            },
            {
                "name": "Tiza de cascarilla",
                "description": "Tiza de cascarilla para marcar símbolos rituales. Pack de 6 unidades.",
                "regular_price": "12.00",
                "short_description": "Tiza de cascarilla ritual"
            }
        ],
        
        "Pescado ahumado": [
            {
                "name": "Pescado ahumado ritual",
                "description": "Pescado ahumado especial para ofrendas a los orishas. Preparado tradicionalmente.",
                "regular_price": "15.00",
                "short_description": "Pescado ahumado para ofrendas"
            }
        ],
        
        "Jutía": [
            {
                "name": "Jutía ahumada",
                "description": "Jutía ahumada tradicional para ofrendas especiales. Preparación ceremonial.",
                "regular_price": "25.00",
                "short_description": "Jutía ahumada ceremonial"
            }
        ],
        
        "Corojo": [
            {
                "name": "Manteca de corojo 250ml",
                "description": "Manteca de corojo pura para ceremonias y ofrendas. Frasco de 250ml.",
                "regular_price": "18.00",
                "short_description": "Manteca de corojo pura"
            },
            {
                "name": "Semillas de corojo",
                "description": "Semillas de corojo naturales para rituales y decoración de altares.",
                "regular_price": "12.00",
                "short_description": "Semillas de corojo naturales"
            }
        ],
        
        "Maíz tostado": [
            {
                "name": "Maíz tostado ritual 500g",
                "description": "Maíz tostado especial para ofrendas a Eleggua y otros orishas. 500 gramos.",
                "regular_price": "8.00",
                "short_description": "Maíz tostado para ofrendas"
            }
        ],
        
        "Manteca de cacao": [
            {
                "name": "Manteca de cacao pura 200g",
                "description": "Manteca de cacao natural para rituales de belleza y protección. 200 gramos.",
                "regular_price": "15.00",
                "short_description": "Manteca de cacao ritual"
            }
        ],
        
        "Aguardiente": [
            {
                "name": "Aguardiente ceremonial 750ml",
                "description": "Aguardiente especial para ceremonias y ofrendas. Botella de 750ml.",
                "regular_price": "22.00",
                "short_description": "Aguardiente ceremonial"
            }
        ],
        
        "Azulillo / añil": [
            {
                "name": "Azulillo en piedra",
                "description": "Azulillo natural en piedra para rituales de protección y limpieza espiritual.",
                "regular_price": "6.00",
                "short_description": "Azulillo natural en piedra"
            }
        ],
        
        "Pimienta de guinea": [
            {
                "name": "Pimienta de guinea 50g",
                "description": "Pimienta de guinea auténtica para rituales de protección y fuerza. 50 gramos.",
                "regular_price": "15.00",
                "short_description": "Pimienta de guinea auténtica"
            }
        ],
        
        "Pinturas de santo": [
            {
                "name": "Set de pinturas rituales",
                "description": "Set completo de pinturas para decorar santos y altares. Colores tradicionales.",
                "regular_price": "35.00",
                "short_description": "Set de pinturas rituales"
            },
            {
                "name": "Pintura blanca ritual",
                "description": "Pintura blanca especial para ceremonias de purificación y consagración.",
                "regular_price": "8.00",
                "short_description": "Pintura blanca ritual"
            }
        ],
        
        "Pajarera": [
            {
                "name": "Pajarera tradicional pequeña",
                "description": "Pajarera tradicional de madera para altar. Tamaño pequeño, decoración artesanal.",
                "regular_price": "45.00",
                "short_description": "Pajarera tradicional de madera"
            }
        ],
        
        "Pinceles": [
            {
                "name": "Set de pinceles rituales",
                "description": "Set de pinceles especiales para pintar santos y decorar altares. Varios tamaños.",
                "regular_price": "18.00",
                "short_description": "Set de pinceles rituales"
            }
        ],
        
        "Jícaras": [
            {
                "name": "Jícara natural grande",
                "description": "Jícara natural grande para ofrendas y ceremonias. Tallada tradicionalmente.",
                "regular_price": "25.00",
                "short_description": "Jícara natural tallada"
            },
            {
                "name": "Jícara pequeña decorada",
                "description": "Jícara pequeña con decoraciones tradicionales. Perfecta para ofrendas menores.",
                "regular_price": "15.00",
                "short_description": "Jícara pequeña decorada"
            }
        ],
        
        "Ashé de santo": [
            {
                "name": "Ashé consagrado 25g",
                "description": "Ashé consagrado especial para ceremonias importantes. 25 gramos bendecidos.",
                "regular_price": "50.00",
                "short_description": "Ashé consagrado ceremonial"
            }
        ],
        
        "Piedra de rayo": [
            {
                "name": "Piedra de rayo de Changó",
                "description": "Piedra de rayo auténtica para altar de Changó. Símbolo de poder y justicia.",
                "regular_price": "75.00",
                "short_description": "Piedra de rayo de Changó"
            }
        ],
        
        "Alumbre": [
            {
                "name": "Piedra de alumbre natural",
                "description": "Piedra de alumbre natural para limpiezas y protección. Uso ritual tradicional.",
                "regular_price": "8.00",
                "short_description": "Piedra de alumbre natural"
            }
        ],
        
        "Agua florida": [
            {
                "name": "Agua florida Kananga 270ml",
                "description": "Agua florida Kananga original para limpiezas espirituales. Botella de 270ml.",
                "regular_price": "12.00",
                "short_description": "Agua florida Kananga original"
            },
            {
                "name": "Agua florida de rosas",
                "description": "Agua florida de rosas para rituales de amor y armonía. Fragancia delicada.",
                "regular_price": "10.00",
                "short_description": "Agua florida de rosas"
            }
        ],
        
        "Wereye": [
            {
                "name": "Wereye tradicional",
                "description": "Wereye auténtico para ceremonias especiales. Preparado según tradición yoruba.",
                "regular_price": "35.00",
                "short_description": "Wereye tradicional auténtico"
            }
        ],
        
        "Palo santo": [
            {
                "name": "Palo santo natural 100g",
                "description": "Palo santo natural del Perú para purificación y limpieza energética. 100 gramos.",
                "regular_price": "15.00",
                "short_description": "Palo santo natural del Perú"
            },
            {
                "name": "Sahumerio de palo santo",
                "description": "Sahumerio de palo santo molido para quemar en ceremonias. Aroma purificador.",
                "regular_price": "8.00",
                "short_description": "Sahumerio de palo santo"
            }
        ],
        
        "Esencias más vendidas": [
            {
                "name": "Esencia de Oshún",
                "description": "Esencia especial de Oshún para atraer amor y prosperidad. Frasco de 30ml.",
                "regular_price": "18.00",
                "short_description": "Esencia de Oshún para amor"
            },
            {
                "name": "Esencia de Yemayá",
                "description": "Esencia de Yemayá para protección maternal y purificación. Frasco de 30ml.",
                "regular_price": "18.00",
                "short_description": "Esencia de Yemayá protectora"
            }
        ],
        
        "Extractos disponibles": [
            {
                "name": "Extracto de ruda",
                "description": "Extracto concentrado de ruda para protección y limpieza espiritual.",
                "regular_price": "12.00",
                "short_description": "Extracto de ruda protector"
            },
            {
                "name": "Extracto de albahaca",
                "description": "Extracto de albahaca para atraer prosperidad y abundancia económica.",
                "regular_price": "12.00",
                "short_description": "Extracto de albahaca próspera"
            }
        ],
        
        "Jabón para limpias": [
            {
                "name": "Jabón de ruda y romero",
                "description": "Jabón especial con ruda y romero para limpiezas espirituales profundas.",
                "regular_price": "8.00",
                "short_description": "Jabón de ruda para limpias"
            }
        ],
        
        "Jabón para destrancadera": [
            {
                "name": "Jabón destrancadera",
                "description": "Jabón especial para abrir caminos y remover obstáculos. Fórmula tradicional.",
                "regular_price": "10.00",
                "short_description": "Jabón destrancadera tradicional"
            }
        ],
        
        "Jabón para evolución": [
            {
                "name": "Jabón de evolución espiritual",
                "description": "Jabón especial para crecimiento espiritual y desarrollo personal.",
                "regular_price": "12.00",
                "short_description": "Jabón de evolución espiritual"
            }
        ],
        
        "Jabón de coco": [
            {
                "name": "Jabón de coco natural",
                "description": "Jabón artesanal de coco para purificación y suavidad. 100% natural.",
                "regular_price": "6.00",
                "short_description": "Jabón de coco natural"
            }
        ],
        
        "Jabón de miel": [
            {
                "name": "Jabón de miel y propóleo",
                "description": "Jabón dulce con miel y propóleo para endulzar situaciones y atraer amor.",
                "regular_price": "8.00",
                "short_description": "Jabón de miel endulzante"
            }
        ],
        
        "Jabón de romero": [
            {
                "name": "Jabón de romero purificador",
                "description": "Jabón de romero para purificación mental y protección espiritual.",
                "regular_price": "7.00",
                "short_description": "Jabón de romero purificador"
            }
        ],
        
        "Jabón de Eleggua": [
            {
                "name": "Jabón especial de Eleggua",
                "description": "Jabón ceremonial dedicado a Eleggua para abrir caminos y protección.",
                "regular_price": "15.00",
                "short_description": "Jabón ceremonial de Eleggua"
            }
        ],
        
        "Jabón nigeriano": [
            {
                "name": "Jabón negro nigeriano",
                "description": "Jabón negro tradicional nigeriano para limpieza profunda y purificación.",
                "regular_price": "12.00",
                "short_description": "Jabón negro nigeriano"
            }
        ],
        
        "Jabón de tierra": [
            {
                "name": "Jabón de tierra sagrada",
                "description": "Jabón con tierra sagrada para conexión con ancestros y estabilidad.",
                "regular_price": "10.00",
                "short_description": "Jabón de tierra sagrada"
            }
        ],
        
        "Jabón de suerte": [
            {
                "name": "Jabón de la suerte dorada",
                "description": "Jabón especial para atraer buena suerte y oportunidades doradas.",
                "regular_price": "9.00",
                "short_description": "Jabón de la suerte dorada"
            }
        ],
        
        "Caracoles Aye": [
            {
                "name": "Set de caracoles Aye",
                "description": "Set completo de 16 caracoles Aye para consultas del Diloggun. Consagrados.",
                "regular_price": "85.00",
                "short_description": "Set de caracoles Aye consagrados"
            }
        ],
        
        "Caracol normal": [
            {
                "name": "Caracoles naturales grandes",
                "description": "Caracoles naturales grandes para decoración de altares y ofrendas marinas.",
                "regular_price": "15.00",
                "short_description": "Caracoles naturales grandes"
            }
        ],
        
        "Rosarios": [
            {
                "name": "Rosario de Yemayá",
                "description": "Rosario especial de Yemayá con cuentas azules y blancas. Para oraciones y protección.",
                "regular_price": "35.00",
                "short_description": "Rosario de Yemayá protector"
            },
            {
                "name": "Rosario de Oshún",
                "description": "Rosario dorado de Oshún para oraciones de amor y prosperidad.",
                "regular_price": "38.00",
                "short_description": "Rosario dorado de Oshún"
            }
        ],
        
        "Tablero de Ifá": [
            {
                "name": "Tablero de Ifá tradicional",
                "description": "Tablero de Ifá tallado en madera sagrada. Para consultas del babalawo.",
                "regular_price": "150.00",
                "short_description": "Tablero de Ifá tallado"
            }
        ],
        
        "Accesorios para Ifá": [
            {
                "name": "Iruke (rabo de caballo)",
                "description": "Iruke tradicional para ceremonias de Ifá. Símbolo de autoridad del babalawo.",
                "regular_price": "45.00",
                "short_description": "Iruke ceremonial tradicional"
            },
            {
                "name": "Ibo de Ifá",
                "description": "Set de ibo tradicionales para consultas de Ifá. Incluye piedras y caracoles.",
                "regular_price": "35.00",
                "short_description": "Set de ibo para Ifá"
            }
        ],
        
        "Semillas para ritual (Ikin)": [
            {
                "name": "Ikin sagrados de Ifá",
                "description": "Semillas ikin sagradas para mano de Orula. Seleccionadas tradicionalmente.",
                "regular_price": "120.00",
                "short_description": "Ikin sagrados de Ifá"
            }
        ],
        
        "Opeles": [
            {
                "name": "Opele tradicional",
                "description": "Opele tradicional para consultas rápidas de Ifá. Cadena con semillas consagradas.",
                "regular_price": "65.00",
                "short_description": "Opele tradicional consagrado"
            }
        ],
        
        "Platos para Eleggua": [
            {
                "name": "Plato de barro para Eleggua",
                "description": "Plato tradicional de barro para ofrendas a Eleggua. Hecho artesanalmente.",
                "regular_price": "18.00",
                "short_description": "Plato de barro para Eleggua"
            },
            {
                "name": "Plato decorado de Eleggua",
                "description": "Plato decorado con símbolos de Eleggua. Para ofrendas especiales.",
                "regular_price": "25.00",
                "short_description": "Plato decorado de Eleggua"
            }
        ],
        
        "Casas para Eleggua": [
            {
                "name": "Casa de cemento para Eleggua",
                "description": "Casa tradicional de cemento para Eleggua. Hecha según tradición yoruba.",
                "regular_price": "75.00",
                "short_description": "Casa de cemento para Eleggua"
            }
        ],
        
        "Tibores": [
            {
                "name": "Tibor azul para Yemayá",
                "description": "Tibor tradicional azul para Yemayá. Decorado con motivos marinos.",
                "regular_price": "95.00",
                "short_description": "Tibor azul de Yemayá"
            },
            {
                "name": "Tibor amarillo para Oshún",
                "description": "Tibor dorado para Oshún. Decorado con símbolos de prosperidad y amor.",
                "regular_price": "95.00",
                "short_description": "Tibor dorado de Oshún"
            },
            {
                "name": "Tibor blanco multiuso",
                "description": "Tibor blanco tradicional para diversos orishas. Diseño clásico y elegante.",
                "regular_price": "85.00",
                "short_description": "Tibor blanco multiuso"
            }
        ],
        
        "Pedestales": [
            {
                "name": "Pedestal de madera tallado",
                "description": "Pedestal de madera tallada para altares. Diseño tradicional yoruba.",
                "regular_price": "65.00",
                "short_description": "Pedestal de madera tallado"
            },
            {
                "name": "Pedestal de mármol blanco",
                "description": "Pedestal elegante de mármol blanco para santos principales.",
                "regular_price": "120.00",
                "short_description": "Pedestal de mármol blanco"
            }
        ],
        
        "Coronas y Aketes": [
            {
                "name": "Corona de Yemayá",
                "description": "Corona ceremonial de Yemayá con caracoles y cuentas azules. Hecha a mano.",
                "regular_price": "185.00",
                "short_description": "Corona ceremonial de Yemayá"
            },
            {
                "name": "Akete de Changó",
                "description": "Akete tradicional de Changó con decoraciones rojas y blancas.",
                "regular_price": "165.00",
                "short_description": "Akete tradicional de Changó"
            }
        ]
    }

def create_products_for_categories(product_manager: ProductManager, category_mapping: Dict[str, int], product_templates: Dict[str, List[Dict]]) -> Dict[str, List[int]]:
    """Crear productos para todas las categorías"""
    logger.info("Iniciando creación de productos de prueba...")
    
    created_products = {}
    total_created = 0
    
    for category_name, category_id in category_mapping.items():
        if category_name in product_templates:
            logger.info(f"\n--- Creando productos para: {category_name} ---")
            created_products[category_name] = []
            
            products_data = product_templates[category_name]
            
            for product_data in products_data:
                # Preparar datos del producto
                full_product_data = {
                    "name": product_data["name"],
                    "type": "simple",
                    "regular_price": product_data["regular_price"],
                    "description": product_data["description"],
                    "short_description": product_data["short_description"],
                    "categories": [{"id": category_id}],
                    "status": "publish",
                    "catalog_visibility": "visible",
                    "manage_stock": True,
                    "stock_quantity": random.randint(10, 50),
                    "in_stock": True,
                    "weight": str(random.uniform(0.1, 2.0)),
                    "dimensions": {
                        "length": str(random.randint(5, 30)),
                        "width": str(random.randint(5, 30)),
                        "height": str(random.randint(2, 15))
                    }
                }
                
                # Crear el producto
                created_product = product_manager.create_product(full_product_data)
                if created_product:
                    created_products[category_name].append(created_product['id'])
                    total_created += 1
                
                # Pausa entre creaciones
                time.sleep(0.5)
        else:
            logger.warning(f"No hay plantillas de productos para la categoría: {category_name}")
    
    logger.info(f"\n=== RESUMEN DE CREACIÓN ===")
    logger.info(f"Total de productos creados: {total_created}")
    
    for category_name, product_ids in created_products.items():
        logger.info(f"  {category_name}: {len(product_ids)} productos")
    
    return created_products

def main():
    """Función principal"""
    logger.info("=== INICIANDO CREACIÓN DE PRODUCTOS DE PRUEBA IBULORE ===")
    
    # Mostrar configuración
    logger.info(f"URL de la tienda: {WC_URL}")
    logger.info(f"Consumer Key: {WC_CONSUMER_KEY[:10]}...")
    logger.info(f"Consumer Secret: {WC_CONSUMER_SECRET[:10]}...")
    
    try:
        # Cargar mapeo de categorías
        category_mapping = load_category_mapping()
        if not category_mapping:
            logger.error("No se pudo cargar el mapeo de categorías. Abortando.")
            return False
        
        logger.info(f"Categorías cargadas: {len(category_mapping)}")
        
        # Inicializar manager de productos
        product_manager = ProductManager(WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET)
        
        # Obtener plantillas de productos
        product_templates = get_product_templates()
        logger.info(f"Plantillas de productos: {len(product_templates)}")
        
        # Crear productos
        created_products = create_products_for_categories(product_manager, category_mapping, product_templates)
        
        # Guardar resultado
        with open('created_products.json', 'w', encoding='utf-8') as f:
            json.dump(created_products, f, indent=2, ensure_ascii=False)
        
        total_products = sum(len(products) for products in created_products.values())
        
        logger.info(f"\n=== PROCESO COMPLETADO EXITOSAMENTE ===")
        logger.info(f"- Total de productos creados: {total_products}")
        logger.info(f"- Categorías con productos: {len(created_products)}")
        logger.info(f"- Resultado guardado en: created_products.json")
        
        return True
        
    except Exception as e:
        logger.error(f"Error durante el proceso: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 ¡Productos de prueba creados exitosamente!")
        print("Tu tienda ahora tiene productos auténticos de santería en todas las categorías.")
    else:
        print("\n❌ El proceso falló. Revisa los logs para más detalles.") 
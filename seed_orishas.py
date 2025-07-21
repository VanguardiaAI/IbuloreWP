import requests
import json

# URL del endpoint de la API para crear Orishas (marcas)
API_URL = "http://localhost:5001/api/orishas"

# Lista de Orishas con sus descripciones
ORISHAS = [
    {"name": "Eleguá", "description": "Orisha que abre y cierra los caminos. El mensajero de los dioses y guardián del destino."},
    {"name": "Ogún", "description": "Orisha del hierro, la guerra, el trabajo y la tecnología. Patrón de los herreros y soldados."},
    {"name": "Oshosi", "description": "Orisha de la caza, la justicia y los bosques. Patrón de los que tienen problemas con la ley."},
    {"name": "Obatalá", "description": "Orisha de la creación, la paz, la pureza y la sabiduría. Padre de muchos Orishas y de la humanidad."},
    {"name": "Yemayá", "description": "Orisha de la maternidad, el mar y la fertilidad. Considerada la madre de todos los seres vivos."},
    {"name": "Oshún", "description": "Orisha del amor, la belleza, la feminidad, los ríos y el dinero. Símbolo de la dulzura y la sensualidad."},
    {"name": "Shangó", "description": "Orisha del trueno, el fuego, la justicia, la virilidad y la danza. Rey guerrero del panteón Yoruba."},
    {"name": "Oyá", "description": "Orisha de las tormentas, los vientos, los relámpagos y el mercado. Guardiana del cementerio y compañera de Shangó."},
    {"name": "Agayú Solá", "description": "Orisha de los volcanes, el desierto y el sol abrasador. Representa la fuerza bruta de la naturaleza."},
    {"name": "Babalú Ayé", "description": "Orisha de las enfermedades, las plagas y la curación. Muy venerado por su capacidad de sanar."},
    {"name": "Orunmila", "description": "Orisha de la adivinación y la sabiduría. Profeta que conoce el destino de todo lo que existe a través del oráculo de Ifá."},
    {"name": "Ibeyi", "description": "Orishas gemelos de la alegría, la vitalidad y la buena fortuna. Protectores de los niños."},
    {"name": "Inle", "description": "Orisha de la medicina, la pesca y la economía. Representa la salud y la abundancia."},
    {"name": "Oduduwa", "description": "Considerado el ancestro del pueblo Yoruba y primer rey de Ife. Orisha de la creación del mundo y la tierra."},
    {"name": "Olokun", "description": "Orisha de las profundidades del océano, los secretos y la riqueza. De género ambiguo, representa lo desconocido."},
    {"name": "Osain", "description": "Orisha de la naturaleza, las plantas, las hierbas y la magia curativa. Dueño del monte y sus secretos."}
]

def seed_orishas():
    headers = {'Content-Type': 'application/json'}
    print("Iniciando la inserción de Orishas en WooCommerce...")
    
    for orisha in ORISHAS:
        payload = json.dumps(orisha)
        try:
            response = requests.post(API_URL, data=payload, headers=headers)
            
            if response.status_code == 201:
                print(f"✅ Orisha '{orisha['name']}' creado exitosamente.")
            else:
                error_message = 'N/A'
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', error_data.get('error', 'Respuesta inesperada.'))
                except requests.exceptions.JSONDecodeError:
                    # Si la respuesta no es JSON, mostrar el texto plano.
                    error_message = response.text
                
                # A veces WooCommerce devuelve un error de "El nombre del término ya existe."
                if "already exists" in str(error_message) or "ya existe" in str(error_message):
                    print(f"🟡 Orisha '{orisha['name']}' ya existe. Omitiendo.")
                else:
                    print(f"❌ Error al crear Orisha '{orisha['name']}'. Estado: {response.status_code}, Mensaje: {error_message}")
        
        except requests.exceptions.RequestException as e:
            print(f"❌ Error de conexión al intentar crear '{orisha['name']}'. Verifica que el backend esté corriendo en {API_URL}.")
            print(f"   Detalle: {e}")
            break

    print("\nProceso de inserción finalizado.")

if __name__ == "__main__":
    seed_orishas() 
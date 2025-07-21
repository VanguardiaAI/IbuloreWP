# Limpieza y Configuración de Categorías - Tienda Ibulore

## ⚠️ ADVERTENCIA IMPORTANTE

Este script realiza operaciones **DESTRUCTIVAS** que **NO SE PUEDEN DESHACER**:
- Elimina **TODOS** los productos existentes
- Elimina **TODAS** las categorías existentes
- Crea una nueva estructura de categorías

**¡Haz un backup completo de tu tienda antes de ejecutar este script!**

## 📋 Nueva Estructura de Categorías

El script creará la siguiente estructura (19 categorías principales + 65 subcategorías = **84 categorías totales**):

### Categorías Principales

1. **Herramientas para santos**
2. **Collares**
3. **Accesorios** *(11 subcategorías)*
   - Accesorios para tibores
   - Campanas
   - Collares
   - Maracas
   - Balanzas
   - Fermonas
   - Carretillas
   - Máscara para Oya
   - Machete forrado para Oya
   - Cartas
   - Muñecas (con trajes o por separado)

4. **Veladoras y velones** *(4 subcategorías)*
   - Veladoras comunes
   - Velones unicolores
   - Velones para orishas
   - Velones de pareja

5. **Rituales y baños espirituales** *(4 subcategorías)*
   - Baños de amor
   - Baños de abundancia
   - Baños de salud
   - Baños de dinero

6. **Ropa religiosa** *(3 subcategorías)*
   - Ropa para iyaboses
   - Traje de coronación
   - Traje para montador

7. **Kit de iyabo** *(2 subcategorías)*
   - Kit para mujer
   - Kit para hombre

8. **Inciensos**

9. **Kit de guerreros y Orula** *(2 subcategorías)*
   - Guerreros
   - Ikofa (Orula)

10. **Mesa de santo** *(19 subcategorías)*
    - Cascarilla
    - Pescado ahumado
    - Jutía
    - Corojo
    - Maíz tostado
    - Manteca de cacao
    - Aguardiente
    - Azulillo / añil
    - Pimienta de guinea
    - Pinturas de santo
    - Pajarera
    - Pinceles
    - Jícaras
    - Ashé de santo
    - Piedra de rayo
    - Alumbre
    - Agua florida
    - Wereye
    - Palo santo

11. **Esencias y extractos** *(2 subcategorías)*
    - Esencias más vendidas
    - Extractos disponibles

12. **Jabones espirituales** *(10 subcategorías)*
    - Jabón para limpias
    - Jabón para destrancadera
    - Jabón para evolución
    - Jabón de coco
    - Jabón de miel
    - Jabón de romero
    - Jabón de Eleggua
    - Jabón nigeriano
    - Jabón de tierra
    - Jabón de suerte

13. **Caracoles** *(2 subcategorías)*
    - Caracoles Aye
    - Caracol normal

14. **Rosarios**

15. **Ifá y accesorios** *(4 subcategorías)*
    - Tablero de Ifá
    - Accesorios para Ifá
    - Semillas para ritual (Ikin)
    - Opeles

16. **Accesorios para Eleggua** *(2 subcategorías)*
    - Platos para Eleggua
    - Casas para Eleggua

17. **Tibores**
18. **Pedestales**
19. **Coronas y Aketes**

## 🔧 Requisitos Previos

### 1. Configuración de Credenciales
Asegúrate de que tu archivo `.env` contenga las credenciales correctas de WooCommerce:

```env
WC_STORE_URL=https://ibulore.com
WC_CONSUMER_KEY=ck_tu_consumer_key_real
WC_CONSUMER_SECRET=cs_tu_consumer_secret_real
```

### 2. Dependencias Python
El script requiere las siguientes librerías:
```bash
pip install requests python-dotenv
```

### 3. Permisos de API
Las credenciales de WooCommerce deben tener permisos de **Lectura/Escritura**.

## 🚀 Instrucciones de Uso

### Opción 1: Script con Confirmaciones (Recomendado)
```bash
cd backend
python run_category_setup.py
```

Este script:
- ✅ Verifica la configuración del entorno
- ✅ Muestra exactamente qué va a hacer
- ✅ Requiere confirmación explícita del usuario
- ✅ Proporciona feedback detallado

### Opción 2: Script Directo (Solo para expertos)
```bash
cd backend
python clean_and_setup_categories.py
```

## 📝 Proceso Paso a Paso

El script ejecuta los siguientes pasos:

### Paso 1: Verificación del Entorno
- Verifica que existe el archivo `.env`
- Confirma que las credenciales están configuradas
- Valida la conexión con la API de WooCommerce

### Paso 2: Eliminación de Productos
- Obtiene todos los productos existentes (paginado)
- Los elimina en lotes de 50 para optimizar el rendimiento
- Usa `force=true` para eliminación permanente

### Paso 3: Eliminación de Categorías
- Obtiene todas las categorías existentes
- Las ordena jerárquicamente (subcategorías primero)
- Las elimina respetando las dependencias

### Paso 4: Creación de Nueva Estructura
- Crea primero todas las categorías principales
- Luego crea las subcategorías asociadas
- Aplica pausas entre creaciones para evitar rate limiting

### Paso 5: Finalización
- Genera un archivo `category_mapping.json` con el mapeo de IDs
- Proporciona un resumen completo del proceso

## 📊 Archivos Generados

### `category_mapping.json`
Contiene el mapeo de nombres de categorías a sus IDs en WooCommerce:
```json
{
  "Herramientas para santos": 123,
  "Collares": 124,
  "Accesorios": 125,
  "Accesorios para tibores": 126,
  ...
}
```

Este archivo es útil para:
- Referencia futura al crear productos
- Scripts de importación de productos
- Integración con otros sistemas

## 🔍 Verificación Post-Ejecución

Después de ejecutar el script:

1. **Verifica en WordPress Admin**:
   - Ve a Productos → Categorías
   - Confirma que se crearon todas las categorías
   - Verifica la estructura jerárquica

2. **Verifica en tu Dashboard**:
   - Accede a tu panel de administración
   - Ve a la sección de Categorías
   - Confirma que aparecen todas las categorías nuevas

3. **Revisa los logs**:
   - El script genera logs detallados
   - Busca mensajes de error o advertencias

## 🚨 Solución de Problemas

### Error: "No se encontró el archivo .env"
- Verifica que estés en el directorio `backend/`
- Confirma que el archivo `.env` existe y no está oculto

### Error: "Credenciales no configuradas"
- Verifica que las variables estén en el `.env`
- Confirma que las credenciales sean válidas
- Verifica los permisos de la API key

### Error de conexión a la API
- Verifica que la URL de la tienda sea correcta
- Confirma que WooCommerce esté activo
- Verifica que la API REST esté habilitada

### Proceso interrumpido
- Si el proceso se interrumpe, la tienda puede quedar en estado inconsistente
- Puedes volver a ejecutar el script (eliminará lo que quede y creará todo de nuevo)
- O restaurar desde backup si tienes uno

## ⏱️ Tiempo Estimado

- **Tienda pequeña** (< 100 productos, < 50 categorías): 2-5 minutos
- **Tienda mediana** (100-500 productos, 50-100 categorías): 5-15 minutos
- **Tienda grande** (> 500 productos, > 100 categorías): 15+ minutos

## 🔄 Después de la Limpieza

Una vez completado el proceso:

1. **Tu tienda estará limpia** con solo las nuevas categorías
2. **Podrás empezar a crear productos** en las categorías correctas
3. **El mapeo de categorías** te ayudará a referenciar los IDs
4. **La estructura jerárquica** estará lista para uso

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs detallados del script
2. Verifica la configuración de credenciales
3. Confirma que WooCommerce esté funcionando correctamente
4. Consulta la documentación de la API de WooCommerce 
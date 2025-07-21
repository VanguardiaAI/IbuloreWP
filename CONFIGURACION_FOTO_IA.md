# Configuración de Foto Producto IA

## Descripción
Esta funcionalidad permite generar fotografías profesionales de productos usando inteligencia artificial a través de la API de Replicate con el modelo Flux Kontext Pro.

## Configuración Requerida

### 1. Variable de Entorno
Agrega la siguiente variable a tu archivo `.env`:

```bash
REPLICATE_API_TOKEN=r8_tu_token_aqui
```

**Importante:** Reemplaza `r8_tu_token_aqui` con tu token real de Replicate.

### 2. Obtener el Token de Replicate
1. Ve a [replicate.com](https://replicate.com)
2. Crea una cuenta o inicia sesión
3. Ve a tu perfil > API tokens
4. Crea un nuevo token
5. Copia el token que comienza con `r8_`

### 3. Dependencias
La dependencia `replicate` ya está instalada en el proyecto. Si necesitas reinstalarla:

```bash
cd frontend
npm install replicate
```

## Funcionalidades Implementadas

### ✅ Interfaz de Usuario
- **Panel izquierdo tipo chat**: Para subir imagen y escribir prompts
- **Panel derecho**: Muestra la imagen generada como protagonista
- **Validación de archivos**: Solo imágenes hasta 10MB
- **Barra de progreso**: Indicador visual durante la generación
- **Ejemplos de prompts**: Específicos para productos religiosos yoruba

### ✅ Funcionalidades Técnicas
- **Subida de imágenes**: Drag & drop y selección de archivos
- **Generación con IA**: Integración con Flux Kontext Pro
- **Descarga de resultados**: Botón para descargar imágenes generadas
- **Historial**: Galería de generaciones recientes
- **Manejo de errores**: Notificaciones toast para errores y éxitos

### ✅ Prompts de Ejemplo Incluidos
1. "Pon este producto en un fondo de fotografía profesional de estudio con arena de playa caribeña"
2. "Coloca este objeto en un altar yoruba tradicional con velas y flores"
3. "Sitúa este producto en un ambiente místico con humo de incienso y luces doradas"
4. "Presenta este artículo en un fondo elegante de terciopelo negro con iluminación dramática"
5. "Ubica este producto en un jardín tropical con plantas exuberantes y luz natural"

## Estructura de Archivos Creados

```
frontend/src/
├── app/dashboard/products/ai-photo/
│   └── page.tsx                           # Página principal
├── app/api/ai/generate-product-photo/
│   └── route.ts                           # API endpoint
└── components/products/
    └── AIPhotoGenerator.tsx               # Componente reutilizable
```

## Navegación
La nueva sección "Foto producto IA" se encuentra en:
**Dashboard > Productos > Foto producto IA**

## Uso
1. Sube una imagen del producto
2. Escribe un prompt descriptivo o selecciona uno de los ejemplos
3. Haz clic en "Generar Foto"
4. Espera a que se complete la generación (puede tomar 30-60 segundos)
5. Descarga la imagen generada

## Parámetros del Modelo
- **Modelo**: black-forest-labs/flux-kontext-pro
- **Formato de salida**: JPG
- **Pasos de inferencia**: 28
- **Escala de guía**: 3.5
- **Seed**: Aleatorio para cada generación

## Notas Técnicas
- Las imágenes se envían en formato base64 a Replicate
- El tiempo de generación depende de la carga del servidor de Replicate
- Las imágenes generadas se almacenan temporalmente en Replicate
- Se recomienda descargar las imágenes inmediatamente después de la generación 
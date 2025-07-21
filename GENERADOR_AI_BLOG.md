# Generador de Artículos con IA para Blog de Santería Yoruba

## Descripción

Se ha implementado un sistema completo de generación de artículos con inteligencia artificial específicamente diseñado para tu blog de santería yoruba. El sistema permite generar contenido SEO optimizado, respetuoso y culturalmente apropiado.

## Características Implementadas

### 1. **Botón "Generar con IA"**
- Ubicado en la página de nueva entrada del blog (`/dashboard/blog/new`)
- Redirige al generador de IA completo

### 2. **Generador de Ideas de Artículos**
- Sugiere temas relevantes sobre santería yoruba
- Categoriza las ideas por dificultad (Principiante, Intermedio, Avanzado)
- Permite generar nuevas ideas con IA
- Incluye descripciones detalladas de cada tema

Ideas predefinidas incluyen:
- Los 7 Orishas Principales y sus Características
- Rituales de Purificación en la Santería Yoruba
- Historia y Origen de la Santería en Cuba
- Plantas Sagradas en los Rituales Yorubas
- Collares y Protecciones Espirituales
- Ifá: El Sistema de Adivinación Yoruba

### 3. **Generador de Contenido con IA**
- **Configuración personalizable:**
  - Contexto adicional opcional
  - Selección de audiencia (Principiante, Intermedio, Avanzado)
  - Longitud del artículo (Corto: 500-800, Mediano: 800-1500, Largo: 1500+ palabras)
  - Palabras clave SEO personalizables
  - **Subida de imágenes** - Sube imágenes reales que se incluirán en el artículo
  - Referencias de imágenes opcionales para menciones adicionales

- **Características del contenido generado:**
  - Respetuoso con las tradiciones yorubas
  - Información histórica y cultural precisa
  - Optimizado para SEO
  - Estructura HTML con subtítulos apropiados
  - Meta descripciones y títulos SEO

### 4. **Integración con Formulario de Blog**
- El contenido generado se traslada automáticamente al formulario de nueva entrada
- Pre-llena todos los campos: título, contenido, extracto, SEO
- Mapea automáticamente categorías y tags existentes
- Muestra alerta de confirmación cuando se carga contenido de IA

## Configuración Requerida

### 1. **Variable de Entorno de OpenAI - Backend**

Agrega la siguiente variable al archivo `.env` en la carpeta `backend/`:

```env
OPENAI_API_KEY=tu_api_key_de_openai_aqui
```

**Nota:** El backend de Python (Flask) maneja las llamadas a OpenAI API por razones de seguridad y mejor control.

### 2. **Obtener API Key de OpenAI**

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" en tu dashboard
4. Crea una nueva API key
5. Copia la key y agrégala al archivo `.env.local`

### 3. **Configuración del Modelo**

El sistema está configurado para usar `gpt-4-1106-preview` (GPT-4 Turbo) por defecto. Si tienes acceso a otros modelos como GPT-4.1, puedes cambiar el modelo en:

```python
# backend/routes/blog.py - en las funciones generate_ai_content y generate_ai_ideas
'gpt-4', 'gpt-4.1' o el modelo que prefieras
```

## Archivos Creados/Modificados

### Nuevos Archivos:
1. `frontend/src/app/dashboard/blog/ai-generator/page.tsx` - Página principal del generador
2. `frontend/src/components/blog/AIIdeaGenerator.tsx` - Componente generador de ideas
3. `frontend/src/components/blog/AIContentGenerator.tsx` - Componente generador de contenido
4. `backend/routes/blog.py` - Nuevos endpoints de IA agregados al final del archivo

### Archivos Modificados:
1. `frontend/src/app/dashboard/blog/new/page.tsx` - Agregado botón y procesamiento de contenido IA
2. `frontend/src/components/blog/BlogPostForm.tsx` - Soporte para contenido generado por IA
3. `backend/config.py` - Agregada configuración para OpenAI API key

## Uso del Sistema

### Paso 1: Generar Ideas
1. Ve a "Nueva Entrada del Blog"
2. Haz clic en "Generar con IA"
3. En la sección "Generar Ideas de Artículos", revisa las sugerencias
4. Selecciona una idea haciendo clic en ella
5. Opcionalmente, haz clic en "Nuevas Ideas" para más sugerencias

### Paso 2: Configurar Generación
1. En la sección "Generar Contenido":
   - Agrega contexto adicional (opcional)
   - Selecciona la audiencia objetivo
   - Elige la longitud del artículo
   - Personaliza las palabras clave SEO
   - **Sube imágenes**: Arrastra y suelta o selecciona imágenes (PNG, JPG, GIF hasta 5MB)
   - Agrega descripciones de imágenes adicionales (opcional)

### Paso 3: Generar y Usar
1. Haz clic en "Generar Artículo con IA"
2. Revisa el contenido generado
3. Haz clic en "Usar este Contenido"
4. Serás redirigido al formulario con todo pre-llenado
5. Revisa y edita si es necesario
6. Publica o guarda como borrador

## Características de Seguridad y Calidad

### Prompts Especializados
- El sistema usa prompts específicos para santería yoruba
- Enfatiza el respeto cultural y la precisión histórica
- Incluye directrices para SEO sin sonar artificial

### Validación de Contenido
- El sistema valida que el JSON generado sea correcto
- Maneja errores de manera elegante
- Incluye contenido de ejemplo para desarrollo/testing

### Mapeo Inteligente
- Mapea automáticamente categorías y tags del contenido IA con los existentes en WordPress
- Genera slugs automáticamente basados en el título
- Pre-configura todo para estado de borrador

## Personalización Avanzada

### Modificar Ideas Predefinidas
Edita el array `predefinedIdeas` en `AIIdeaGenerator.tsx` para cambiar las sugerencias iniciales.

### Personalizar Prompts de IA
Modifica los prompts en `route.ts` para ajustar el estilo y enfoque del contenido generado.

### Agregar Más Configuraciones
Puedes agregar más opciones de configuración como:
- Tono del artículo (formal, casual, educativo)
- Incluir call-to-actions
- Formato específico (guía, lista, artículo narrativo)

## Troubleshooting

### Error: "OpenAI API key no configurada"
- Verifica que el archivo `.env.local` existe
- Confirma que la variable se llama exactamente `OPENAI_API_KEY`
- Reinicia el servidor de desarrollo después de agregar la variable

### Error: "El contenido generado no tiene el formato correcto"
- Esto puede ocurrir si OpenAI no devuelve JSON válido
- El sistema incluye contenido de ejemplo como fallback
- Considera ajustar el prompt si ocurre frecuentemente

### Contenido No Se Carga en el Formulario
- Verifica que los parámetros URL se están procesando correctamente
- Revisa la consola del navegador para errores de JavaScript
- Confirma que el componente BlogPostForm recibe las props correctamente

## Nuevas Características - Subida de Imágenes

### **Funcionalidad de Imágenes Implementada:**
- **Subida múltiple**: Selecciona o arrastra múltiples imágenes a la vez
- **Validación automática**: Solo acepta imágenes (PNG, JPG, GIF) hasta 5MB
- **Vista previa**: Muestra miniaturas de las imágenes subidas
- **Integración con IA**: Las imágenes se incluyen automáticamente en el contenido HTML generado
- **Alt text inteligente**: Usa los nombres de archivo como alt text por defecto
- **Gestión de medios**: Utiliza la API de WordPress para gestionar las imágenes

### **Cómo Usar las Imágenes:**
1. En la sección "Generar Contenido", marca "Incluir imágenes en el artículo"
2. Haz clic en el área de subida o arrastra imágenes directamente
3. Las imágenes aparecerán en una vista previa con opción de eliminar
4. Al generar el artículo, las imágenes se incluirán automáticamente en el HTML
5. El contenido generado incluirá tags `<img>` con las URLs correctas y alt text apropiado

## Futuras Mejoras Sugeridas

1. **Generación de Imágenes con IA** - Integrar DALL-E para generar imágenes automáticamente
2. **Editor de Alt Text** - Permitir editar el alt text de las imágenes subidas
3. **Redimensionado automático** - Optimizar imágenes automáticamente para web
4. **Traductor Automático** - Soporte para múltiples idiomas
5. **Análisis de Competencia** - Analizar artículos existentes para mejorar SEO
6. **Programación de Publicación** - Scheduler automático de contenido
7. **Métricas de Engagement** - Tracking de performance de artículos generados con IA

## Consideraciones de Costos

- GPT-4 tiene costos por token (entrada y salida)
- Artículo promedio: ~$0.10 - $0.30 USD por generación
- Considera implementar límites de uso si es necesario
- El modelo GPT-3.5-turbo es una alternativa más económica

## Endpoints del Backend Implementados

### 1. **Generar Contenido con IA**
```
POST http://localhost:5001/api/blog/ai/generate-content
```
**Parámetros:**
- `selectedIdea`: Título/tema del artículo
- `additionalContext`: Contexto adicional (opcional)
- `keywords`: Array de palabras clave SEO
- `targetAudience`: 'principiante', 'intermedio', 'avanzado'
- `articleLength`: 'corto', 'mediano', 'largo'
- `imagePrompts`: Array de descripciones de imágenes
- `uploadedImages`: Array de objetos con información de imágenes subidas

### 2. **Generar Ideas de Artículos**
```
POST http://localhost:5001/api/blog/ai/generate-ideas
```
**Parámetros opcionales:**
- `focusArea`: Área de enfoque específica
- `audienceLevel`: Nivel de audiencia objetivo

## Instrucciones de Configuración Final

### Para el Backend:
1. Ve a la carpeta `backend/`
2. Agrega esta línea a tu archivo `.env`:
   ```
   OPENAI_API_KEY=tu_api_key_de_openai_aqui
   ```
3. Reinicia el servidor de Flask si está ejecutándose

### Para Testing:
1. Asegúrate de que el backend esté corriendo en `http://localhost:5001`
2. El frontend debe estar en `http://localhost:3000`
3. Ambos deben estar ejecutándose simultáneamente

¡El sistema está listo para usar! Solo necesitas configurar tu API key de OpenAI en el backend y comenzar a generar contenido de calidad para tu blog de santería yoruba. 
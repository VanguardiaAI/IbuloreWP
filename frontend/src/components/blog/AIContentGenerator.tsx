"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wand2, Plus, X, Image, FileText, Tag, Upload, Trash2, Sparkles } from "lucide-react";
import { blogApi } from "@/lib/api";

interface AIContentGeneratorProps {
  selectedIdea: string;
  onContentGenerated: (content: any) => void;
}

interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  categories: string[];
  tags: string[];
}

interface UploadedImage {
  id: string | number;
  url: string;
  alt_text: string;
  filename: string;
  mime_type: string;
}

export function AIContentGenerator({ selectedIdea, onContentGenerated }: AIContentGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["santería", "yoruba", "orishas"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [newImagePrompt, setNewImagePrompt] = useState("");
  const [targetAudience, setTargetAudience] = useState("principiante");
  const [articleLength, setArticleLength] = useState("mediano");
  const [includeImages, setIncludeImages] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState("");

  // Palabras clave sugeridas basadas en la idea seleccionada y el tema
  const getSuggestedKeywords = () => {
    const baseKeywords = ["santería", "yoruba", "orishas", "religión", "espiritualidad", "tradición"];
    
    // Usar el título personalizado o la idea seleccionada para generar sugerencias
    const topicToAnalyze = customTitle.trim() || selectedIdea;
    
    if (!topicToAnalyze) return baseKeywords.filter(keyword => !keywords.includes(keyword));
    
    const ideaLower = topicToAnalyze.toLowerCase();
    const suggestions = [...baseKeywords];
    
    // Agregar palabras clave específicas según el tema
    if (ideaLower.includes("orisha") || ideaLower.includes("principales")) {
      suggestions.push("orisha", "deidades", "santos", "patakí", "características", "principales");
    }
    if (ideaLower.includes("ritual") || ideaLower.includes("ceremonia") || ideaLower.includes("purificación")) {
      suggestions.push("rituales", "ceremonias", "ofrendas", "ebó", "purificación", "limpieza espiritual");
    }
    if (ideaLower.includes("historia") || ideaLower.includes("origen") || ideaLower.includes("cuba")) {
      suggestions.push("historia", "origen", "cuba", "áfrica", "tradición ancestral", "esclavitud", "sincretismo");
    }
    if (ideaLower.includes("planta") || ideaLower.includes("hierba") || ideaLower.includes("sagrada")) {
      suggestions.push("plantas sagradas", "hierbas", "botánica", "medicina tradicional", "remedios", "naturaleza");
    }
    if (ideaLower.includes("collar") || ideaLower.includes("protección") || ideaLower.includes("elekes")) {
      suggestions.push("collares", "elekes", "protección", "amuletos", "cuentas", "colores");
    }
    if (ideaLower.includes("ifá") || ideaLower.includes("adivinación") || ideaLower.includes("dilogún")) {
      suggestions.push("ifá", "adivinación", "oráculo", "caracolas", "dilogún", "babalawo", "consulta");
    }
    if (ideaLower.includes("música") || ideaLower.includes("danza") || ideaLower.includes("batá")) {
      suggestions.push("música", "danza", "tambores", "batá", "cantos", "ritmos", "toques");
    }
    if (ideaLower.includes("altar") || ideaLower.includes("doméstico") || ideaLower.includes("espacio")) {
      suggestions.push("altar", "espacio sagrado", "decoración", "velas", "ofrendas", "casa", "hogar");
    }
    if (ideaLower.includes("iniciación") || ideaLower.includes("santero")) {
      suggestions.push("iniciación", "santero", "padrino", "madrina", "ceremonia", "asiento");
    }
    if (ideaLower.includes("patakí") || ideaLower.includes("leyenda") || ideaLower.includes("mitología")) {
      suggestions.push("patakí", "leyendas", "mitología", "historias", "enseñanzas", "sabiduría");
    }
    
    // Filtrar palabras que ya están agregadas y eliminar duplicados
    return [...new Set(suggestions)].filter(keyword => !keywords.includes(keyword));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (!keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
      // Pequeño feedback visual (opcional: podrías agregar una notificación aquí)
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addImagePrompt = () => {
    if (newImagePrompt.trim() && !imagePrompts.includes(newImagePrompt.trim())) {
      setImagePrompts([...imagePrompts, newImagePrompt.trim()]);
      setNewImagePrompt("");
    }
  };

  const removeImagePrompt = (prompt: string) => {
    setImagePrompts(imagePrompts.filter(p => p !== prompt));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} no es un archivo de imagen válido`);
          continue;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} es demasiado grande. Máximo 5MB`);
          continue;
        }

        try {
          const response = await blogApi.uploadMedia(file, file.name);
          
          // Debug: ver qué está devolviendo WordPress
          console.log('WordPress response:', response);
          
          // Crear ID único usando timestamp + random para evitar duplicados
          const uniqueId = response.id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Obtener la URL con múltiples fallbacks
          const imageUrl = response.source_url || 
                          response.url || 
                          response.guid?.rendered ||
                          response.media_details?.sizes?.full?.source_url ||
                          response.media_details?.sizes?.large?.source_url ||
                          response.media_details?.sizes?.medium?.source_url ||
                          URL.createObjectURL(file); // Fallback temporal con el archivo local
          
          console.log('Image URL determined:', imageUrl);
          
          const uploadedImage: UploadedImage = {
            id: uniqueId,
            url: imageUrl,
            alt_text: response.alt_text || response.caption?.rendered || file.name,
            filename: response.media_details?.file || response.slug || file.name,
            mime_type: response.mime_type || file.type,
          };

          // Verificar que no existe ya una imagen con el mismo ID
          setUploadedImages(prev => {
            const existingIds = prev.map(img => img.id);
            if (existingIds.includes(uploadedImage.id)) {
              // Si el ID ya existe, generar uno nuevo
              uploadedImage.id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            return [...prev, uploadedImage];
          });
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          setError(`Error al subir ${file.name}. Continuando con otros archivos...`);
        }
      }
    } catch (error) {
      console.error('Error general uploading images:', error);
      setError('Error al subir las imágenes. Por favor intenta de nuevo.');
    } finally {
      setUploadingImage(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const removeUploadedImage = (imageId: string | number) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const generateContent = async () => {
    // Determinar el tema/título a usar
    const topicToUse = customTitle.trim() || selectedIdea;
    
    if (!topicToUse) {
      setError("Por favor escribe un título personalizado o selecciona una idea sugerida");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Construir el prompt para OpenAI
      const prompt = `
        Crea un artículo completo sobre "${topicToUse}" para un blog de santería yoruba.
        
        Contexto adicional: ${additionalContext || "Ninguno"}
        Audiencia objetivo: ${targetAudience}
        Longitud del artículo: ${articleLength}
        Palabras clave a incluir: ${keywords.join(", ")}
        
        El artículo debe:
        1. Ser respetuoso con la tradición yoruba
        2. Incluir información histórica y cultural relevante
        3. Estar optimizado para SEO
        4. Ser informativo y educativo
        5. Incluir subtítulos en HTML (h2, h3)
        6. Tener párrafos bien estructurados
        
        ${includeImages && imagePrompts.length > 0 ? 
          `Incluir referencias para estas imágenes: ${imagePrompts.join(", ")}` : 
          ""
        }
        
        Devuelve un JSON con la siguiente estructura:
        {
          "title": "${topicToUse}",
          "content": "Contenido completo en HTML",
          "excerpt": "Resumen de 150-160 caracteres",
          "seoTitle": "Título SEO optimizado (60 caracteres max)",
          "seoDescription": "Meta descripción SEO (160 caracteres max)",
          "keywords": ["palabra1", "palabra2", "palabra3"],
          "categories": ["categoría1", "categoría2"],
          "tags": ["tag1", "tag2", "tag3"]
        }
      `;

      // Llamada a la API del backend
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/blog/ai/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          selectedIdea: topicToUse,
          additionalContext,
          keywords,
          targetAudience,
          articleLength,
          imagePrompts: includeImages ? imagePrompts : [],
          uploadedImages: includeImages ? uploadedImages : []
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar contenido');
      }

      const data = await response.json();
      const content = JSON.parse(data.content);
      
      setGeneratedContent(content);
    } catch (error) {
      console.error("Error generando contenido:", error);
      setError("Error al generar el contenido. Por favor intenta de nuevo.");
      
      // Simulación para desarrollo (remover en producción)
      const mockContent: GeneratedContent = {
        title: topicToUse,
        content: `
          <h2>Introducción</h2>
          <p>Este artículo explora los aspectos fundamentales de <strong>${topicToUse}</strong> en la tradición de la santería yoruba.</p>
          
          ${uploadedImages.length > 0 ? uploadedImages.map(img => `
          <div style="text-align: center; margin: 20px 0;">
            <img src="${img.url}" alt="${img.alt_text}" style="max-width: 100%; height: auto; border-radius: 8px;" />
            <p style="font-style: italic; font-size: 14px; color: #666; margin-top: 8px;">${img.alt_text}</p>
          </div>
          `).join('') : ''}
          
          <h2>Historia y Origen</h2>
          <p>La santería yoruba tiene profundas raíces en las tradiciones africanas que llegaron a América durante el período colonial.</p>
          
          <h2>Características Principales</h2>
          <p>Los elementos distintivos de este tema incluyen:</p>
          <ul>
            <li>Tradiciones ancestrales</li>
            <li>Prácticas rituales</li>
            <li>Significado espiritual</li>
          </ul>
          
          <h2>Conclusión</h2>
          <p>La comprensión de estos conceptos es fundamental para apreciar la riqueza de la tradición yoruba.</p>
        `,
        excerpt: "Descubre los aspectos fundamentales de la santería yoruba y su importancia en la tradición religiosa afrocubana.",
        seoTitle: topicToUse.substring(0, 60),
        seoDescription: `Guía completa sobre ${topicToUse} en la santería yoruba. Aprende sobre tradiciones, rituales y significado espiritual.`,
        keywords: [...keywords, topicToUse.toLowerCase()],
        categories: ["Santería", "Yoruba"],
        tags: ["orishas", "rituales", "tradición", "espiritualidad"]
      };
      
      setGeneratedContent(mockContent);
    } finally {
      setLoading(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="customTitle">Título del Artículo</Label>
          <Input
            id="customTitle"
            placeholder={selectedIdea ? `Deja vacío para usar: "${selectedIdea}"` : "Escribe el tema o título de tu artículo..."}
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {selectedIdea 
              ? "Puedes usar la idea seleccionada o escribir tu propio título personalizado"
              : "Escribe el tema sobre el que quieres generar el artículo"
            }
          </p>
        </div>

        <div>
          <Label htmlFor="context">Contexto Adicional (Opcional)</Label>
          <Textarea
            id="context"
            placeholder="Agrega información específica que quieras incluir en el artículo..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="audience">Audiencia</Label>
            <select
              id="audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>
          <div>
            <Label htmlFor="length">Longitud</Label>
            <select
              id="length"
              value={articleLength}
              onChange={(e) => setArticleLength(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="corto">Corto (500-800 palabras)</option>
              <option value="mediano">Mediano (800-1500 palabras)</option>
              <option value="largo">Largo (1500+ palabras)</option>
            </select>
          </div>
        </div>

        {/* Palabras clave */}
        <div>
          <Label>Palabras Clave SEO</Label>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Agregar palabra clave..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button type="button" onClick={addKeyword} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Palabras clave agregadas */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Sugerencias de palabras clave */}
          {getSuggestedKeywords().length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
              <Label className="text-xs font-medium text-purple-700 mb-2 block flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Sugerencias (haz clic para agregar):
              </Label>
              <div className="flex flex-wrap gap-2">
                {getSuggestedKeywords().slice(0, 10).map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-white hover:border-purple-400 hover:text-purple-800 hover:shadow-sm transition-all duration-200 flex items-center gap-1 bg-white/70 border-purple-200 text-purple-700"
                    onClick={() => addSuggestedKeyword(suggestion)}
                  >
                    <Plus className="h-3 w-3" />
                    {suggestion}
                  </Badge>
                ))}
              </div>
              {getSuggestedKeywords().length > 10 && (
                <p className="text-xs text-purple-600 mt-2">
                  Y {getSuggestedKeywords().length - 10} sugerencias más...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Prompts de imágenes */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="includeImages"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
            />
            <Label htmlFor="includeImages">Incluir imágenes en el artículo</Label>
          </div>
          
          {includeImages && (
            <div className="space-y-4">
              {/* Subir imágenes */}
              <div>
                <Label className="text-sm font-medium">Subir Imágenes</Label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingImage ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400" />
                      )}
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Imágenes subidas */}
              {uploadedImages.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Imágenes Subidas</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {uploadedImages.map((image, index) => (
                      <div key={`${image.id}-${index}-${image.filename}`} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {image.url ? (
                            <img
                              src={image.url}
                              alt={image.alt_text}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Error loading image:', image.url);
                                console.error('Image object:', image);
                                // Mostrar un placeholder si la imagen no carga
                                e.currentTarget.style.display = 'none';
                                // Mostrar texto de error en el contenedor padre
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.error-placeholder')) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'error-placeholder text-xs text-red-500 text-center p-2';
                                  errorDiv.textContent = 'Error al cargar imagen';
                                  parent.appendChild(errorDiv);
                                }
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', image.url);
                              }}
                            />
                          ) : (
                            <div className="text-xs text-gray-500 text-center p-2">
                              URL no disponible
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeUploadedImage(image.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.filename}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Referencias de imágenes (descripciones) */}
              <div>
                <Label className="text-sm font-medium">Referencias Adicionales (Opcional)</Label>
                <p className="text-xs text-gray-500 mb-2">Agrega descripciones de imágenes que no tienes pero quieres que se mencionen en el artículo</p>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Descripción de imagen (ej: altar yoruba con velas)"
                    value={newImagePrompt}
                    onChange={(e) => setNewImagePrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addImagePrompt()}
                  />
                  <Button type="button" onClick={addImagePrompt} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {imagePrompts.map((prompt, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Image className="h-4 w-4 text-gray-500" />
                      <span className="flex-1 text-sm">{prompt}</span>
                      <button
                        onClick={() => removeImagePrompt(prompt)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Generar contenido */}
      <div className="space-y-4">
        <Button
          onClick={generateContent}
          disabled={loading || (!customTitle.trim() && !selectedIdea)}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Wand2 className="h-4 w-4 mr-2" />
          )}
          {loading ? "Generando Contenido..." : "Generar Artículo con IA"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!customTitle.trim() && !selectedIdea && (
          <Alert>
            <AlertDescription>
              Escribe un título personalizado o selecciona una idea sugerida para continuar.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Contenido generado */}
      {generatedContent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contenido Generado
            </CardTitle>
            <CardDescription>
              Revisa el contenido generado antes de usarlo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-semibold">Título:</Label>
              <p className="text-sm">{generatedContent.title}</p>
            </div>
            
            <div>
              <Label className="font-semibold">Extracto:</Label>
              <p className="text-sm text-gray-600">{generatedContent.excerpt}</p>
            </div>
            
            <div>
              <Label className="font-semibold">SEO:</Label>
              <div className="text-sm space-y-1">
                <p><strong>Título SEO:</strong> {generatedContent.seoTitle}</p>
                <p><strong>Descripción:</strong> {generatedContent.seoDescription}</p>
              </div>
            </div>
            
            <div>
              <Label className="font-semibold">Palabras Clave:</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {generatedContent.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="font-semibold">Vista Previa del Contenido:</Label>
              <div 
                className="text-sm border rounded p-3 max-h-40 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: generatedContent.content.substring(0, 500) + "..." }}
              />
            </div>
            
            <Button onClick={handleUseContent} className="w-full">
              Usar este Contenido
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
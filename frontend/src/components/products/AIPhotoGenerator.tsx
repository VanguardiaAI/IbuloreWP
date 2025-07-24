"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Wand2, Download, Loader2, Camera, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface AIPhotoGeneratorProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

const examplePrompts = [
  "Crea una fotografía de producto profesional con fondo blanco",
  "Pon este producto en un fondo de fotografía profesional de estudio con arena de playa caribeña",
  "Sitúa este producto en un ambiente místico con humo de incienso y luces doradas",
  "Presenta este artículo en un fondo elegante de terciopelo negro con iluminación dramática",
];

export function AIPhotoGenerator({ onImageGenerated }: AIPhotoGeneratorProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateProgress = () => {
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 1000);
    return interval;
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt.trim()) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen y escribe un prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage("");
    
    const progressInterval = simulateProgress();
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('prompt', prompt);

      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/ai/generate-product-photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar la imagen');
      }

      const result = await response.json();
      
      // Validar que la respuesta contenga una URL válida
      console.log('Respuesta de la API:', result);
      if (!result.imageUrl || typeof result.imageUrl !== 'string' || result.imageUrl.trim() === '') {
        throw new Error('La respuesta de la API no contiene una URL de imagen válida');
      }
      console.log('URL de imagen recibida:', result.imageUrl);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setTimeout(() => {
        setGeneratedImage(result.imageUrl);
        onImageGenerated?.(result.imageUrl, prompt);
        
        toast({
          title: "¡Éxito!",
          description: "Imagen generada correctamente",
        });
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error:', error);
      
      // Limpiar el estado de imagen generada en caso de error
      setGeneratedImage("");
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Hubo un problema al generar la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `producto-ia-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetGenerator = () => {
    setSelectedImage(null);
    setImagePreview("");
    setPrompt("");
    setGeneratedImage("");
    setGenerationProgress(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo - Input */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Imagen
            </CardTitle>
            <CardDescription>
              Selecciona la imagen del producto que quieres mejorar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative w-full h-48 mx-auto">
                    <Image
                      src={imagePreview}
                      alt="Vista previa"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    Cambiar imagen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Haz clic para subir una imagen</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG hasta 10MB</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    Seleccionar archivo
                  </Button>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Prompt de Generación
            </CardTitle>
            <CardDescription>
              Describe cómo quieres que se vea tu producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Descripción</Label>
              <Textarea
                id="prompt"
                placeholder="Ej: Pon este jarrón en un fondo de fotografía profesional de estudio con arena de playa caribeña"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Ejemplos de prompts</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {examplePrompts.map((example, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2 text-left justify-start text-xs"
                    onClick={() => setPrompt(example)}
                  >
                    "{example}"
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!selectedImage || !prompt.trim() || isGenerating}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando... {Math.round(generationProgress)}%
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generar Foto
                  </>
                )}
              </Button>
              
              {(imagePreview || generatedImage) && (
                <Button
                  variant="outline"
                  onClick={resetGenerator}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Generando imagen con IA...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel derecho - Resultado */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              Tu imagen generada aparecerá aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImage && generatedImage.trim() !== "" ? (
              <div className="space-y-4">
                <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={generatedImage}
                    alt="Imagen generada"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(generatedImage)}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p><strong>Prompt:</strong> {prompt}</p>
                  <p><strong>Generado:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4" />
                  <p>La imagen generada aparecerá aquí</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Calendar, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface GeneratedImage {
  id: string;
  fileName: string;
  localUrl: string;
  originalUrl?: string;
  prompt: string;
  timestamp: string;
}

interface ImageGalleryProps {
  refreshTrigger?: number; // Para refrescar cuando se genera una nueva imagen
}

export function ImageGallery({ refreshTrigger }: ImageGalleryProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchImages = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/ai/generated-images`);
      if (!response.ok) {
        throw new Error('Error al cargar las imágenes');
      }
      
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes guardadas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.localUrl;
    link.download = image.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Galería de Imágenes Generadas
          </CardTitle>
          <CardDescription>
            Cargando imágenes guardadas...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Galería de Imágenes Generadas
          </CardTitle>
          <CardDescription>
            Las imágenes que generes aparecerán aquí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aún no has generado ninguna imagen</p>
            <p className="text-sm">¡Comienza generando tu primera foto de producto!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Galería de Imágenes Generadas
          </CardTitle>
          <CardDescription>
            {images.length} imagen{images.length !== 1 ? 'es' : ''} guardada{images.length !== 1 ? 's' : ''} localmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-colors"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image.localUrl}
                  alt="Imagen generada"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge variant="secondary" className="text-xs truncate">
                    {formatDate(image.timestamp)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de imagen expandida */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Imagen Generada
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Imagen */}
                <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={selectedImage.localUrl}
                    alt="Imagen generada expandida"
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Información */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Prompt utilizado:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {selectedImage.prompt}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedImage.timestamp)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(selectedImage)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 
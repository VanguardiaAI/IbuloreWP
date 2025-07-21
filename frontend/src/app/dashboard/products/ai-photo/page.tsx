"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { AIPhotoGenerator } from "@/components/products/AIPhotoGenerator";
import { ImageGallery } from "@/components/products/ImageGallery";

export default function AIPhotoPage() {
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    // Validar que la URL no esté vacía antes de agregar al historial
    if (!imageUrl || imageUrl.trim() === '') {
      console.error('URL de imagen vacía, no se agregará al historial');
      return;
    }

    // Refrescar la galería para mostrar la nueva imagen
    setGalleryRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Foto Producto IA
          </h1>
          <p className="text-muted-foreground">
            Genera fotografías profesionales de tus productos usando inteligencia artificial
          </p>
        </div>
      </div>

      <AIPhotoGenerator onImageGenerated={handleImageGenerated} />

      {/* Galería de imágenes generadas */}
      <ImageGallery refreshTrigger={galleryRefreshTrigger} />
    </div>
  );
} 
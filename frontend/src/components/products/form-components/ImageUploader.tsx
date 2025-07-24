"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export interface UploadedImage {
  id: number;
  src: string;
  alt?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  mainImageId?: number | null;
  onMainImageChange: (id: number | null) => void;
}

export function ImageUploader({ images, onImagesChange, mainImageId, onMainImageChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    const uploadPromises = acceptedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Detectar si estamos en producción basándonos en la URL
        const isProduction = window.location.pathname.startsWith('/panel');
        const uploadUrl = isProduction 
          ? "/panel/api/media/upload"
          : "/api/media/upload";
        
        console.log("Upload URL:", uploadUrl, "isProduction:", isProduction);
          
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const responseText = await response.text();
        console.log("Respuesta cruda del backend:", responseText);
        
        if (!response.ok) {
          let errorMsg = `Error al subir ${file.name}`;
          try {
            const errorJson = JSON.parse(responseText);
            errorMsg = errorJson.error || errorMsg;
          } catch(e) { /* No es un JSON, usar el texto plano si es posible */ }
          throw new Error(errorMsg);
        }
        
        const uploadedImage = JSON.parse(responseText);
        console.log("JSON parseado de la respuesta:", uploadedImage);

        return {
          id: uploadedImage.id,
          src: uploadedImage.source_url,
          alt: uploadedImage.alt_text,
        } as UploadedImage;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Fallo al subir ${file.name}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const newImages = results.filter((img): img is UploadedImage => img !== null);
    
    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);

      if (!mainImageId && updatedImages.length > 0 && updatedImages[0]) {
        onMainImageChange(updatedImages[0].id);
      }

      toast.success(`${newImages.length} imagen(es) subida(s) con éxito.`);
    }

    setIsUploading(false);
  }, [images, mainImageId, onImagesChange, onMainImageChange]);

  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true
  });
  
  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true
  });

  const removeImage = (idToRemove: number) => {
    const updatedImages = images.filter((img) => img.id !== idToRemove);
    onImagesChange(updatedImages);

    if (mainImageId === idToRemove) {
      onMainImageChange(updatedImages.length > 0 && updatedImages[0] ? updatedImages[0].id : null);
    }
  };

  const mainImage = images.find(img => img.id === mainImageId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Imágenes del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <div {...getMainRootProps()} className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isMainDragActive ? 'bg-muted' : 'hover:bg-muted/50'}`}>
            <input {...getMainInputProps()} />
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                <p className="mt-2 text-sm text-muted-foreground">Subiendo...</p>
              </>
            ) : mainImage ? (
                <img src={mainImage.src} alt={mainImage.alt || 'Imagen principal'} className="h-full w-full object-contain rounded-lg" />
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Arrastra imágenes aquí o haz clic para subir</p>
                <p className="text-xs text-muted-foreground">La primera imagen será la principal</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {(images.length > 0 || isGalleryDragActive) && (
        <Card>
          <CardHeader>
            <CardTitle>Galería</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-md overflow-hidden border-2 cursor-pointer transition-all ${mainImageId === image.id ? 'border-primary shadow-md' : 'border-transparent hover:border-muted'}`}
                onClick={() => onMainImageChange(image.id)}
              >
                <img src={image.src} alt={image.alt || `Galería ${image.id}`} className="h-24 w-full object-cover transition-transform group-hover:scale-105" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(image.id); }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                  aria-label="Eliminar imagen"
                >
                  <X className="h-3 w-3" />
                </button>
                {mainImageId === image.id && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-xs text-center py-0.5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                    Principal
                  </div>
                )}
              </div>
            ))}
            
            <div {...getGalleryRootProps()} className={`h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors ${isGalleryDragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}>
              <input {...getGalleryInputProps()} />
              <div className="text-muted-foreground">
                <UploadCloud className="w-6 h-6 mx-auto" />
                <p className="text-xs mt-1">Añadir más</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
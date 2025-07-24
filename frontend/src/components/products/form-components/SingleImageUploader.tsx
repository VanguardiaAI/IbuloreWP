"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export interface UploadedImage {
  id: number;
  src: string;
}

interface SingleImageUploaderProps {
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
}

export function SingleImageUploader({ image, onImageChange }: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // En producción, usar directamente la ruta del backend
      const uploadUrl = process.env.NODE_ENV === 'production' 
        ? "/panel/api/media/upload"
        : "/api/media/upload";
        
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al subir ${file.name}`);
      }
      
      const uploadedImage = await response.json();
      onImageChange({ id: uploadedImage.id, src: uploadedImage.source_url });
      toast.success("Imagen subida con éxito.");

    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Fallo al subir ${file.name}`);
      onImageChange(null);
    } finally {
      setIsUploading(false);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false
  });

  const removeImage = () => {
    onImageChange(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagen del Orisha</CardTitle>
      </CardHeader>
      <CardContent>
        <div {...getRootProps()} className={`relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'bg-muted' : 'hover:bg-muted/50'}`}>
          <input {...getInputProps()} />
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">Subiendo...</p>
            </>
          ) : image ? (
              <div className="relative group w-full h-full">
                <img src={image.src} alt={'Imagen del Orisha'} className="h-full w-full object-contain rounded-lg" />
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                    aria-label="Eliminar imagen"
                >
                    <X className="h-3 w-3" />
                </button>
              </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Arrastra una imagen aquí o haz clic para subir</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
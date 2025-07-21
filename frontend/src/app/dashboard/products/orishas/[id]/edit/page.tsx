"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SingleImageUploader, UploadedImage } from "@/components/products/form-components/SingleImageUploader";

interface OrishaFormValues {
  name: string;
  slug: string;
  description: string;
}

export default function EditOrishaPage() {
  const params = useParams();
  const id = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<OrishaFormValues>();
  
  const fetchOrisha = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5001/api/orishas/${id}`);
      if (!response.ok) {
        throw new Error("No se pudo cargar la información del orisha.");
      }
      const data = await response.json();
      reset({ name: data.name, slug: data.slug, description: data.description });
      if (data.image) {
        setImage({ id: data.image.id, src: data.image.src });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchOrisha();
  }, [fetchOrisha]);

  const onSubmit = async (data: OrishaFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: any = { ...data };
      if (image) {
        payload.image = { id: image.id };
      } else {
        payload.image = null; // Send null to remove the image
      }

      const response = await fetch(`http://localhost:5001/api/orishas/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el orisha.");
      }
      
      alert("Orisha actualizado correctamente!");
      router.push("/dashboard/products/orishas");

    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
             <div className="space-y-8">
                <Skeleton className="h-56 w-full" />
                <div className="flex justify-end gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Editar Orisha</h1>
                <p className="text-muted-foreground">
                Actualiza los detalles del orisha.
                </p>
            </div>
            <div>
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" {...register("name", { required: "El nombre es obligatorio" })} />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...register("slug")} />
            </div>

            <div>
                <Label>Descripción</Label>
                <RichTextEditor control={control} name="description" />
            </div>
        </div>
      
        <div className="space-y-8">
            <SingleImageUploader image={image} onImageChange={setImage} />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/products/orishas">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-4 text-right">{error}</p>}
        </div>
    </form>
  );
} 
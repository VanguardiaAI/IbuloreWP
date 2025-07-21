"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SingleImageUploader, UploadedImage } from "@/components/products/form-components/SingleImageUploader";

interface OrishaFormValues {
  name: string;
  slug: string;
  description: string;
}

export default function NewOrishaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OrishaFormValues>();

  const onSubmit = async (data: OrishaFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: any = { ...data };
      if (image) {
        payload.image = { id: image.id };
      }

      const response = await fetch("http://localhost:5001/api/orishas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el orisha");
      }

      alert("Orisha creado correctamente!");
      router.push("/dashboard/products/orishas");

    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Añadir Nuevo Orisha</h1>
            <p className="text-muted-foreground">
            Rellena el formulario para añadir un nuevo orisha.
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
                Guardar
            </Button>
        </div>
        {error && <p className="text-red-500 text-sm mt-4 text-right">{error}</p>}
      </div>
    </form>
  );
} 
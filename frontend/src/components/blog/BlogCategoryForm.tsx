"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, ArrowLeft, FolderTree, Hash, FileText } from "lucide-react";
import Link from "next/link";
import { blogApi } from "@/lib/api";

interface BlogCategoryFormProps {
  categoryId?: string | number;
  initialData?: any;
}

interface BlogCategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

export function BlogCategoryForm({ categoryId, initialData }: BlogCategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Procesar datos iniciales
  const processInitialData = (data: any) => {
    if (!data) return {
      name: "",
      slug: "",
      description: "",
      parent: 0,
    };

    return {
      name: data.name || "",
      slug: data.slug || "",
      description: data.description || "",
      parent: data.parent || 0,
    };
  };

  const form = useForm<BlogCategoryFormData>({
    defaultValues: processInitialData(initialData),
  });

  // Cargar categorías para el selector de padre
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await blogApi.getCategories({ per_page: 100 });
        // Filtrar la categoría actual para evitar bucles
        const filteredCategories = response.categories.filter(
          (cat: Category) => cat.id !== Number(categoryId)
        );
        setCategories(filteredCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [categoryId]);

  // Actualizar formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (initialData) {
      const processedData = processInitialData(initialData);
      form.reset(processedData);
    }
  }, [initialData, form]);

  // Generar slug automáticamente desde el nombre
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9\s-]/g, "") // Remover caracteres especiales
      .replace(/\s+/g, "-") // Reemplazar espacios con guiones
      .replace(/-+/g, "-") // Remover guiones múltiples
      .trim();
  };

  // Actualizar slug cuando cambie el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    
    // Solo generar slug automáticamente si está vacío o si estamos creando una nueva categoría
    if (!categoryId || !form.getValues("slug")) {
      form.setValue("slug", generateSlug(name));
    }
  };

  const onSubmit = async (data: BlogCategoryFormData) => {
    try {
      setLoading(true);
      
      if (categoryId) {
        await blogApi.updateCategory(categoryId, data);
      } else {
        await blogApi.createCategory(data);
      }

      router.push("/dashboard/blog/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error al guardar la categoría. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/blog/categories">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {categoryId ? "Editar Categoría" : "Nueva Categoría"}
          </h1>
          <p className="text-muted-foreground">
            {categoryId 
              ? "Modifica los datos de la categoría existente"
              : "Crea una nueva categoría para organizar tus entradas"
            }
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...form.register("name", { 
                  required: "El nombre es obligatorio",
                  onChange: handleNameChange
                })}
                placeholder="Ej: Santería, Orishas, Rituales..."
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="slug"
                  {...form.register("slug", { 
                    required: "El slug es obligatorio",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Solo se permiten letras minúsculas, números y guiones"
                    }
                  })}
                  placeholder="santeria-yoruba"
                  className="pl-10"
                />
              </div>
              {form.formState.errors.slug && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.slug.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                URL amigable para la categoría. Se genera automáticamente desde el nombre.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe brevemente el contenido de esta categoría..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Descripción opcional que aparecerá en listados y SEO
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Jerarquía */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Jerarquía
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="parent">Categoría Padre</Label>
              <Select
                value={form.watch("parent")?.toString() || "0"}
                onValueChange={(value) => form.setValue("parent", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin categoría padre (nivel superior)</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Opcional. Permite crear subcategorías organizadas jerárquicamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end gap-4">
              <Link href="/dashboard/blog/categories">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : (categoryId ? "Actualizar" : "Crear")} Categoría
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 
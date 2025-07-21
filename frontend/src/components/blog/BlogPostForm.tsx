"use client";

import { useState, useEffect, useRef } from "react";
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
import { Save, Eye, FileText, Tag, Folder, Upload, X, Image } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { blogApi } from "@/lib/api";

// Carga dinámica del editor para evitar errores de SSR
const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false }
);

interface BlogPostFormProps {
  postId?: string | number;
  initialData?: any;
  aiGeneratedContent?: any;
}

interface BlogPostFormData {
  title: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'publish' | 'pending' | 'private';
  slug?: string;
  categories: number[];
  tags: number[];
  featured_media?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

export function BlogPostForm({ postId, initialData, aiGeneratedContent }: BlogPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [featuredImage, setFeaturedImage] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Procesar datos iniciales de WordPress o contenido generado por IA
  const processInitialData = (data: any, aiData?: any) => {
    // Si hay contenido generado por IA, usarlo como prioridad
    if (aiData) {
      return {
        title: aiData.title || "",
        content: aiData.content || "",
        excerpt: aiData.excerpt || "",
        status: "draft" as const,
        slug: aiData.title ? aiData.title.toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '-') : "",
        categories: [], // Se llenarán después cuando se carguen las categorías
        tags: [], // Se llenarán después cuando se carguen los tags
        featured_media: undefined,
      };
    }

    // Si no hay datos, devolver valores por defecto
    if (!data) return {
      title: "",
      content: "",
      excerpt: "",
      status: "draft" as const,
      slug: "",
      categories: [],
      tags: [],
      featured_media: undefined,
    };

    // Procesar datos de WordPress
    return {
      title: data.title?.rendered || data.title || "",
      content: data.content?.rendered || data.content || "",
      excerpt: data.excerpt?.rendered || data.excerpt || "",
      status: data.status || "draft",
      slug: data.slug || "",
      categories: data.categories || [],
      tags: data.tags || [],
      featured_media: data.featured_media || undefined,
    };
  };

  const form = useForm<BlogPostFormData>({
    defaultValues: processInitialData(initialData, aiGeneratedContent),
  });

  // Cargar categorías y tags
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          blogApi.getCategories({ per_page: 100 }),
          blogApi.getTags({ per_page: 100 }),
        ]);
        setCategories(categoriesResponse.categories || []);
        setTags(tagsResponse.tags || []);
      } catch (error) {
        console.error("Error fetching categories and tags:", error);
      }
    };

    fetchCategoriesAndTags();
  }, []);

  // Procesar categorías y tags del contenido de IA cuando se carguen los datos
  useEffect(() => {
    if (aiGeneratedContent && categories.length > 0 && tags.length > 0) {
      const matchedCategories: number[] = [];
      const matchedTags: number[] = [];

      // Buscar categorías que coincidan
      if (aiGeneratedContent.categories) {
        aiGeneratedContent.categories.forEach((catName: string) => {
          const foundCategory = categories.find(cat => 
            cat.name.toLowerCase() === catName.toLowerCase()
          );
          if (foundCategory) {
            matchedCategories.push(foundCategory.id);
          }
        });
      }

      // Buscar tags que coincidan
      if (aiGeneratedContent.tags) {
        aiGeneratedContent.tags.forEach((tagName: string) => {
          const foundTag = tags.find(tag => 
            tag.name.toLowerCase() === tagName.toLowerCase()
          );
          if (foundTag) {
            matchedTags.push(foundTag.id);
          }
        });
      }

      // Actualizar el formulario con las categorías y tags encontrados
      if (matchedCategories.length > 0) {
        form.setValue("categories", matchedCategories);
      }
      if (matchedTags.length > 0) {
        form.setValue("tags", matchedTags);
      }
    }
  }, [aiGeneratedContent, categories, tags, form]);

  // Actualizar formulario cuando cambien los datos iniciales o el contenido de IA
  useEffect(() => {
    if (initialData || aiGeneratedContent) {
      const processedData = processInitialData(initialData, aiGeneratedContent);
      form.reset(processedData);
    }
  }, [initialData, aiGeneratedContent, form]);

  // Cargar imagen destacada cuando se carguen los datos iniciales
  useEffect(() => {
    if (initialData) {
      // Si hay datos embedded de imagen destacada
      if (initialData._embedded?.["wp:featuredmedia"]?.[0]) {
        const featuredMedia = initialData._embedded["wp:featuredmedia"][0];
        setFeaturedImage({
          id: featuredMedia.id,
          source_url: featuredMedia.source_url,
          alt_text: featuredMedia.alt_text,
          title: featuredMedia.title?.rendered || featuredMedia.title,
        });
        form.setValue("featured_media", featuredMedia.id);
      }
      // Si solo hay el ID de la imagen destacada pero no los datos embedded
      else if (initialData.featured_media && initialData.featured_media > 0) {
        form.setValue("featured_media", initialData.featured_media);
        // Cargar los datos de la imagen
        loadFeaturedImageData(initialData.featured_media);
      }
    }
  }, [initialData, form]);

  const loadFeaturedImageData = async (mediaId: number) => {
    try {
      setLoadingImage(true);
      const mediaData = await blogApi.getMediaById(mediaId);
      setFeaturedImage({
        id: mediaData.id,
        source_url: mediaData.source_url,
        alt_text: mediaData.alt_text,
        title: mediaData.title?.rendered || mediaData.title,
      });
    } catch (error) {
      console.error("Error loading featured image data:", error);
    } finally {
      setLoadingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleImageUpload triggered");
    const file = event.target.files?.[0];
    console.log("Selected file:", file);
    
    if (!file) {
      console.log("No file selected");
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert("Por favor selecciona un archivo de imagen válido.");
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. El tamaño máximo es 5MB.");
      return;
    }

    try {
      console.log("Starting upload...");
      setUploadingImage(true);
      const response = await blogApi.uploadMedia(file, `Imagen destacada para: ${form.getValues("title") || "Nueva entrada"}`);
      console.log("Upload response:", response);
      
      setFeaturedImage({
        id: response.id,
        source_url: response.source_url,
        alt_text: response.alt_text,
        title: response.title?.rendered || response.title,
      });
      
      form.setValue("featured_media", response.id);
      console.log("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al subir la imagen: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    console.log("triggerFileInput called");
    console.log("fileInputRef.current:", fileInputRef.current);
    if (fileInputRef.current) {
      console.log("Clicking file input...");
      fileInputRef.current.click();
    } else {
      console.error("fileInputRef.current is null!");
    }
  };

  const handleRemoveImage = () => {
    setFeaturedImage(null);
    form.setValue("featured_media", undefined);
  };

  const onSubmit = async (data: BlogPostFormData) => {
    try {
      setLoading(true);
      
      if (postId) {
        await blogApi.updatePost(postId, data);
      } else {
        await blogApi.createPost(data);
      }

      router.push("/dashboard/blog");
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    form.setValue("status", "draft");
    form.handleSubmit(onSubmit)();
  };

  const handlePublish = () => {
    form.setValue("status", "publish");
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con acciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {postId ? "Editar Entrada" : "Nueva Entrada del Blog"}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Borrador
                </Button>
                <Button onClick={handlePublish} disabled={loading}>
                  <Eye className="mr-2 h-4 w-4" />
                  Publicar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contenido Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...form.register("title", { required: "El título es obligatorio" })}
                placeholder="Escribe el título de tu entrada..."
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="excerpt">Extracto</Label>
              <Textarea
                id="excerpt"
                {...form.register("excerpt")}
                placeholder="Breve descripción de la entrada..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Resumen que aparecerá en listados y redes sociales
              </p>
            </div>

            <div>
              <Label htmlFor="slug">URL (Slug)</Label>
              <Input
                id="slug"
                {...form.register("slug")}
                placeholder="url-del-articulo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL amigable para el artículo (se genera automáticamente si se deja vacío)
              </p>
            </div>

            <div>
              <Label>Contenido *</Label>
              <RichTextEditor control={form.control} name="content" />
            </div>
          </CardContent>
        </Card>

        {/* Imagen destacada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Imagen Destacada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {featuredImage ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={featuredImage.source_url}
                    alt={featuredImage.alt_text || "Imagen destacada"}
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    disabled={uploadingImage}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Título:</strong> {featuredImage.title || "Sin título"}</p>
                  <p><strong>Texto alternativo:</strong> {featuredImage.alt_text || "Sin texto alternativo"}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    disabled={uploadingImage}
                    onClick={triggerFileInput}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingImage ? "Subiendo..." : "Cambiar imagen"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-red-600 hover:text-red-700"
                    disabled={uploadingImage}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Eliminar imagen
                  </Button>
                </div>
              </div>
            ) : loadingImage ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <div className="animate-spin mx-auto h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-muted-foreground">
                  Cargando imagen destacada...
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Image className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hay imagen destacada seleccionada
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={uploadingImage}
                  onClick={triggerFileInput}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingImage ? "Subiendo..." : "Subir imagen destacada"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos admitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
                </p>
              </div>
            )}
            
            {/* Input file oculto - solo uno para toda la funcionalidad */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage}
            />
          </CardContent>
        </Card>

        {/* Metadatos y categorización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categorías */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Categorías
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => {
                      const isChecked = form.watch("categories")?.includes(category.id) || false;
                      return (
                        <label 
                          key={category.id} 
                          className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentCategories = form.getValues("categories") || [];
                              if (e.target.checked) {
                                form.setValue("categories", [...currentCategories, category.id]);
                              } else {
                                form.setValue("categories", currentCategories.filter(id => id !== category.id));
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{category.name}</span>
                            {category.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {category.count} posts
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      No hay categorías disponibles
                    </p>
                    <Link href="/dashboard/blog/categories/new">
                      <Button variant="outline" size="sm">
                        <Folder className="mr-2 h-4 w-4" />
                        Crear Primera Categoría
                      </Button>
                    </Link>
                  </div>
                )}
                
                {/* Mostrar categorías seleccionadas */}
                {form.watch("categories")?.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Categorías seleccionadas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {form.watch("categories").map((categoryId: number) => {
                        const category = categories.find(c => c.id === categoryId);
                        return category ? (
                          <span 
                            key={categoryId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            {category.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estado y configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="pending">Pendiente de revisión</SelectItem>
                    <SelectItem value="publish">Publicado</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags-input">Tags</Label>
                <div className="space-y-2">
                  <Input
                    id="tags-input"
                    placeholder="Escribir tags separados por comas..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const newTags = input.value.split(',').map(t => t.trim()).filter(t => t);
                        if (newTags.length > 0) {
                          const currentTags = form.getValues("tags") || [];
                          // Simular creación de tags (en una implementación real, crearías los tags en el backend)
                          const tagIds = newTags.map((_, index) => Date.now() + index);
                          form.setValue("tags", [...currentTags, ...tagIds]);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Presiona Enter para agregar tags. Ej: santería, orishas, rituales
                  </p>
                  
                  {/* Tags existentes */}
                  {tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Tags disponibles (clic para agregar):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 10).map((tag) => {
                          const isSelected = form.watch("tags")?.includes(tag.id) || false;
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                const currentTags = form.getValues("tags") || [];
                                if (isSelected) {
                                  form.setValue("tags", currentTags.filter(id => id !== tag.id));
                                } else {
                                  form.setValue("tags", [...currentTags, tag.id]);
                                }
                              }}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs border transition-colors ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-background border-border hover:bg-muted'
                              }`}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags seleccionados */}
                  {form.watch("tags")?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Tags seleccionados:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {form.watch("tags").map((tagId: number) => {
                          const tag = tags.find(t => t.id === tagId);
                          return (
                            <span 
                              key={tagId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                            >
                              {tag?.name || `Tag ${tagId}`}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentTags = form.getValues("tags") || [];
                                  form.setValue("tags", currentTags.filter(id => id !== tagId));
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
} 
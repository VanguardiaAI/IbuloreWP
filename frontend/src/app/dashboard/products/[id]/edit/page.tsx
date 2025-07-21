"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

// Import custom components
import { ImageUploader, UploadedImage } from "@/components/products/form-components/ImageUploader";
import { CategorySelector } from "@/components/products/form-components/CategorySelector";
import { ProductFormAccordion } from "@/components/products/form-components/ProductFormAccordion";
import { OrishaSelector } from "@/components/products/form-components/OrishaSelector";
import { productsApi } from "@/lib/api";

// Esquema de validación completo
const productSchema = z.object({
  name: z.string().min(1, "El nombre del producto es requerido."),
  description: z.string().optional(),
  
  // General
  regularPrice: z.coerce.number().min(0, "El precio debe ser positivo.").optional(),
  salePrice: z.coerce.number().optional(),

  // Inventory
  sku: z.string().optional(),
  manageStock: z.boolean(),
  stockQuantity: z.coerce.number().optional(),
  stockStatus: z.enum(["instock", "outofstock", "onbackorder"]),

  // Shipping
  weight: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),

  // Organization
  categories: z.array(z.string()),
  tags: z.string().optional(),
  orisha: z.string().optional(),

  // Publish
  status: z.enum(["published", "draft"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [mainImageId, setMainImageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      regularPrice: undefined,
      salePrice: undefined,
      sku: "",
      manageStock: false,
      stockQuantity: undefined,
      stockStatus: "instock",
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      categories: [],
      tags: "",
      orisha: undefined,
      status: "draft",
    },
  });

  // Cargar datos del producto
  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoadingProduct(true);
        const product = await productsApi.getProduct(productId);
        
        // Mapear los datos del producto al formato del formulario
        form.reset({
          name: product.name || "",
          description: product.description || "",
          regularPrice: product.regular_price ? parseFloat(product.regular_price) : undefined,
          salePrice: product.sale_price ? parseFloat(product.sale_price) : undefined,
          sku: product.sku || "",
          manageStock: product.manage_stock || false,
          stockQuantity: product.stock_quantity ?? undefined,
          stockStatus: product.stock_status || "instock",
          weight: product.weight ? parseFloat(product.weight) : undefined,
          length: product.dimensions?.length ? parseFloat(product.dimensions.length) : undefined,
          width: product.dimensions?.width ? parseFloat(product.dimensions.width) : undefined,
          height: product.dimensions?.height ? parseFloat(product.dimensions.height) : undefined,
          categories: product.categories?.map((cat: any) => cat.id.toString()) || [],
          tags: product.tags?.map((tag: any) => tag.name).join(", ") || "",
          status: product.status === "publish" ? "published" : "draft",
          orisha: product.brands?.[0]?.id.toString() || undefined,
        });

        // Establecer categorías seleccionadas
        setSelectedCategories(form.watch("categories"));

        // Establecer imágenes
        if (product.images && product.images.length > 0) {
          const loadedImages = product.images.map((img: any) => ({
            id: img.id,
            src: img.src,
            alt: img.alt || img.name,
          }));
          setImages(loadedImages);
          setMainImageId(loadedImages[0].id); // La primera imagen es la principal por defecto
        }
        
      } catch (error) {
        console.error("Error loading product:", error);
        setError("Error al cargar el producto");
      } finally {
        setIsLoadingProduct(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId, form]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsLoading(true);
    
    try {
      const productData: any = {
        name: data.name,
        status: data.status === "published" ? "publish" : "draft",
        description: data.description,
        regular_price: data.regularPrice?.toString() || "",
        sale_price: data.salePrice?.toString() || "",
        sku: data.sku,
        manage_stock: data.manageStock,
        stock_quantity: data.manageStock ? data.stockQuantity : undefined,
        stock_status: data.manageStock 
            ? (data.stockQuantity !== undefined && data.stockQuantity > 0 ? "instock" : "outofstock") 
            : data.stockStatus,
        weight: data.weight?.toString() || "",
        dimensions: {
          length: data.length?.toString() || "",
          width: data.width?.toString() || "",
          height: data.height?.toString() || "",
        },
        categories: data.categories.map(catId => ({ id: parseInt(catId) })),
        tags: data.tags ? data.tags.split(',').map(tag => ({ name: tag.trim() })) : [],
        brands: data.orisha && data.orisha !== "0" ? [{ id: parseInt(data.orisha, 10) }] : [],
      };
      
      // Añadir imágenes
      if (images.length > 0) {
        const mainImage = images.find(img => img.id === mainImageId);
        const galleryImages = images.filter(img => img.id !== mainImageId);
        
        const sortedImages = [
            ...(mainImage ? [{ id: mainImage.id }] : []),
            ...galleryImages.map(img => ({ id: img.id }))
        ];
        productData.images = sortedImages;
      } else {
        productData.images = []; // Enviar array vacío para borrar imágenes
      }

      console.log("Actualizando producto:", JSON.stringify(productData, null, 2));

      const updatedProduct = await productsApi.updateProduct(productId, productData);
      console.log("Producto actualizado exitosamente:", updatedProduct);
      
      alert("¡Producto actualizado exitosamente!");
      router.push("/dashboard/products");
      
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      alert(`Error al actualizar el producto: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error:</p>
          <p className="text-sm text-gray-600">{error}</p>
          <Button onClick={() => router.push("/dashboard/products")} className="mt-4">
            Volver a productos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/dashboard/products")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Producto</h1>
            <p className="text-muted-foreground">
              Modifica la información del producto usando el formulario organizado por secciones
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            type="button"
            disabled={isLoading}
            onClick={() => {
              form.setValue("status", "draft");
              form.handleSubmit(onSubmit)();
            }}
          >
            {isLoading ? "Guardando..." : "Guardar Borrador"}
          </Button>
          <Button 
            type="button" 
            disabled={isLoading}
            onClick={() => {
              form.setValue("status", "published");
              form.handleSubmit(onSubmit)();
            }}
          >
            {isLoading ? "Actualizando..." : "Actualizar Producto"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Formulario con Acordeón */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Producto</CardTitle>
              <CardDescription>
                Modifica la información del producto organizando los datos por secciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductFormAccordion 
                form={form}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          {/* Imágenes */}
          <ImageUploader 
            images={images}
            onImagesChange={setImages}
            mainImageId={mainImageId}
            onMainImageChange={setMainImageId}
          />

          {/* Organización */}
          <Card>
            <CardHeader>
              <CardTitle>Organización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Categorías</Label>
                <CategorySelector 
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                />
              </div>
              <div>
                <Label htmlFor="tags">Etiquetas</Label>
                <Input id="tags" {...form.register("tags")} placeholder="Añade etiquetas (separadas por comas)"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-orisha">Orisha (Marca)</Label>
                <Controller
                  name="orisha"
                  control={form.control}
                  render={({ field }) => (
                    <OrishaSelector
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
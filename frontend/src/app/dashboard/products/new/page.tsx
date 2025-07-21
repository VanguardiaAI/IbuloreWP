"use client";

import { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

export default function NewProductPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [mainImageId, setMainImageId] = useState<number | null>(null);

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



  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    console.log("=== INICIO DE ENVÍO DE FORMULARIO ===");
    console.log("Datos del formulario recibidos:", data);
    console.log("Categorías seleccionadas:", selectedCategories);
    
    // Test básico para verificar que el formulario se envía
    if (!data.name || data.name.trim() === "") {
      alert("Por favor, ingresa un nombre para el producto");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Transformar los datos del formulario al formato de WooCommerce
      const productData: any = {
        name: data.name,
        status: data.status === "published" ? "publish" : "draft"
      };

      console.log("Datos base del producto:", productData);

      // Solo añadir campos si tienen valores
      if (data.description) {
        productData.description = data.description;
        console.log("Añadida descripción:", data.description);
      }

      if (data.regularPrice) {
        productData.regular_price = data.regularPrice.toString();
        console.log("Añadido precio regular:", data.regularPrice);
      }

      if (data.salePrice) {
        productData.sale_price = data.salePrice.toString();
        console.log("Añadido precio de oferta:", data.salePrice);
      }

      if (data.sku) {
        productData.sku = data.sku;
        console.log("Añadido SKU:", data.sku);
      }

      // Gestión de stock
      productData.manage_stock = data.manageStock;
      console.log("Gestión de stock:", data.manageStock);
      
      if (data.manageStock && data.stockQuantity !== undefined) {
        productData.stock_quantity = data.stockQuantity;
        productData.stock_status = data.stockQuantity > 0 ? "instock" : "outofstock";
        console.log("Stock quantity:", data.stockQuantity);
      } else if (!data.manageStock) {
        productData.stock_status = data.stockStatus;
        console.log("Stock status:", data.stockStatus);
      }

      // Dimensiones y peso solo si tienen valores
      if (data.weight) {
        productData.weight = data.weight.toString();
        console.log("Añadido peso:", data.weight);
      }

      if (data.length || data.width || data.height) {
        productData.dimensions = {};
        if (data.length) productData.dimensions.length = data.length.toString();
        if (data.width) productData.dimensions.width = data.width.toString();
        if (data.height) productData.dimensions.height = data.height.toString();
        console.log("Añadidas dimensiones:", productData.dimensions);
      }

      // Categorías solo si hay seleccionadas
      if (selectedCategories.length > 0) {
        productData.categories = selectedCategories.map(categoryId => ({ id: parseInt(categoryId) }));
        console.log("Añadidas categorías:", productData.categories);
      }

      // Tags solo si hay texto
      if (data.tags && data.tags.trim()) {
        productData.tags = data.tags.split(',').map(tag => ({ name: tag.trim() })).filter(tag => tag.name);
        console.log("Añadidas etiquetas:", productData.tags);
      }

      // Añadir Orisha (marca) si se ha seleccionado uno
      if (data.orisha && data.orisha !== "0") {
        productData.brands = [{ id: parseInt(data.orisha, 10) }];
        console.log("Añadido Orisha (marca):", productData.brands);
      }

      // Añadir imágenes
      if (images.length > 0) {
        const mainImage = images.find(img => img.id === mainImageId);
        const galleryImages = images.filter(img => img.id !== mainImageId);
        
        // La imagen principal va primero en el array
        const sortedImages = [
            ...(mainImage ? [{ id: mainImage.id }] : []),
            ...galleryImages.map(img => ({ id: img.id }))
        ];

        productData.images = sortedImages;
      }

      console.log("=== DATOS FINALES A ENVIAR ===");
      console.log(JSON.stringify(productData, null, 2));

      const newProduct = await productsApi.createProduct(productData);
      console.log("=== PRODUCTO CREADO EXITOSAMENTE ===");
      console.log("Producto creado:", newProduct);
      
      // Redirigir a la lista de productos
      alert("¡Producto creado exitosamente!");
      window.location.href = "/dashboard/products";
      
    } catch (error) {
      console.error("=== ERROR EN LA CREACIÓN ===");
      console.error("Error completo:", error);
      alert(`Error al crear el producto: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      console.log("=== FIN DEL PROCESO ===");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Añadir Nuevo Producto</h1>
          <p className="text-muted-foreground">
            Crea un nuevo producto para tu tienda usando el formulario organizado por secciones
          </p>
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
            {isLoading ? "Publicando..." : "Publicar Producto"}
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
                Completa la información del producto organizando los datos por secciones
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
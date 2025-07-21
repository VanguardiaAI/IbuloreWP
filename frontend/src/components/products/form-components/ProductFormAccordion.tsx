"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import { 
  Package, 
  DollarSign, 
  Archive, 
  Truck
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";

// Carga dinámica del editor para evitar errores de SSR
const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false }
);

interface FormSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isComplete?: boolean;
}

interface ProductFormAccordionProps {
  form: UseFormReturn<any>;
}

export function ProductFormAccordion({ 
  form
}: ProductFormAccordionProps) {
  const sections: FormSection[] = [
    {
      id: "basic",
      icon: <Package className="size-4 stroke-2 text-muted-foreground" />,
      title: "Información Básica",
      children: (
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Nombre del producto</Label>
            <Input 
              id="name" 
              {...form.register("name")} 
              placeholder="Ej: Collar de Eleguá" 
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {String(form.formState.errors.name.message)}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <RichTextEditor control={form.control} name="description" />
          </div>
        </div>
      ),
    },
    {
      id: "pricing",
      icon: <DollarSign className="size-4 stroke-2 text-muted-foreground" />,
      title: "Precios",
      children: (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regularPrice">Precio normal ($)</Label>
              <Input
                id="regularPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("regularPrice")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio rebajado ($)</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("salePrice")}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "inventory",
      icon: <Archive className="size-4 stroke-2 text-muted-foreground" />,
      title: "Inventario",
      children: (
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input 
              id="sku" 
              {...form.register("sku")} 
              placeholder="Código único del producto"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="manageStock" 
              checked={form.watch("manageStock")} 
              onCheckedChange={(checked) => form.setValue("manageStock", checked)} 
            />
            <Label htmlFor="manageStock">¿Gestionar inventario a nivel de producto?</Label>
          </div>
          {form.watch("manageStock") ? (
            <div>
              <Label htmlFor="stockQuantity">Cantidad de inventario</Label>
              <Input 
                id="stockQuantity" 
                type="number" 
                {...form.register("stockQuantity")} 
                placeholder="0"
              />
            </div>
          ) : (
            <div>
              <Label>Estado del inventario</Label>
              <Select 
                onValueChange={(value) => form.setValue("stockStatus", value as "instock" | "outofstock" | "onbackorder")} 
                defaultValue={form.getValues("stockStatus")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instock">Hay existencias</SelectItem>
                  <SelectItem value="outofstock">Agotado</SelectItem>
                  <SelectItem value="onbackorder">En espera</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "shipping",
      icon: <Truck className="size-4 stroke-2 text-muted-foreground" />,
      title: "Envío",
      children: (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                step="0.01" 
                {...form.register("weight")} 
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="length">Longitud (cm)</Label>
              <Input 
                id="length" 
                type="number" 
                step="0.1" 
                {...form.register("length")} 
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="width">Anchura (cm)</Label>
              <Input 
                id="width" 
                type="number" 
                step="0.1" 
                {...form.register("width")} 
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                step="0.1" 
                {...form.register("height")} 
                placeholder="0.0"
              />
            </div>
          </div>
        </div>
      ),
    },

  ];

  return (
    <Accordion type="multiple" defaultValue={["basic"]} className="w-full">
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger className="group">
            <div className="flex items-center gap-3">
              {section.icon}
              <span>{section.title}</span>
              {section.isComplete && (
                <span className="ml-2 text-sm text-green-500">✓</span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-1">
            {section.children}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
} 
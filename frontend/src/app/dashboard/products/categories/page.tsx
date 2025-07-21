"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    MoreHorizontal, 
    RefreshCw, 
    Edit, 
    Trash2, 
    Plus, 
    Search,
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    Upload,
    Download,
    Filter,
    ArrowUpDown,
    Folder,
    FolderOpen,
    AlertTriangle
} from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";
import { CategoryStats } from "@/components/products/CategoryStats";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { categoriesApi } from "@/lib/api";

// Tipo para las categorías de WooCommerce
type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  display?: string;
  menu_order?: number;
  image?: {
    id: number;
    src: string;
    alt: string;
  };
  children?: Category[];
  level?: number;
};

// Esquema de validación para la categoría
const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent: z.number().optional(),
  display: z.string().optional(),
  menu_order: z.number().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Tipos para paginación y filtros
type SortField = 'name' | 'slug' | 'count' | 'id';
type SortOrder = 'asc' | 'desc';

interface CategoryFilters {
  search: string;
  parent: number | null;
  sortField: SortField;
  sortOrder: SortOrder;
  showEmpty: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Estados para funcionalidades avanzadas
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [editingSlug, setEditingSlug] = useState<number | null>(null);
  const [tempSlug, setTempSlug] = useState<string>('');
  
  // Estados para filtros
  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    parent: null,
    sortField: 'name',
    sortOrder: 'asc',
    showEmpty: true,
  });

  // Estado para controlar si las estadísticas están expandidas
  const [statsExpanded, setStatsExpanded] = useState(false);

  // Formulario para crear nueva categoría
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      parent: 0,
      display: 'default',
      menu_order: 0,
    }
  });

  // Formulario para editar categoría
  const { register: registerEdit, handleSubmit: handleSubmitEdit, formState: { errors: errorsEdit }, reset: resetEdit, setValue: setValueEdit } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  // Función para crear estructura jerárquica
  const buildCategoryTree = useCallback((categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // Crear mapa de categorías
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [], level: 0 });
    });

    // Construir árbol
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent === 0) {
        rootCategories.push(categoryWithChildren);
      } else {
        const parent = categoryMap.get(category.parent);
        if (parent) {
          categoryWithChildren.level = (parent.level || 0) + 1;
          parent.children!.push(categoryWithChildren);
        } else {
          // Si no encuentra el padre, lo trata como raíz
          rootCategories.push(categoryWithChildren);
        }
      }
    });

    // Ordenar categorías raíz y sus hijos recursivamente
    const sortCategories = (cats: Category[]) => {
      cats.sort((a, b) => {
        // Primero por menu_order, luego por nombre
        const orderA = a.menu_order || 0;
        const orderB = b.menu_order || 0;
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        return a.name.localeCompare(b.name);
      });
      
      // Ordenar hijos recursivamente
      cats.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          sortCategories(cat.children);
        }
      });
    };

    sortCategories(rootCategories);
    return rootCategories;
  }, []);

  // Función para aplanar el árbol de categorías
  const flattenCategories = useCallback((categories: Category[]): Category[] => {
    const flattened: Category[] = [];
    
    const flatten = (cats: Category[], level = 0) => {
      cats.forEach(cat => {
        flattened.push({ ...cat, level });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1);
        }
      });
    };
    
    flatten(categories);
    return flattened;
  }, []);

  // Función para cargar categorías
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.getCategories({ per_page: 100, format: 'simple' });
      
      const hierarchicalCategories = buildCategoryTree(data);
      const flatCats = flattenCategories(hierarchicalCategories);
      
      setCategories(hierarchicalCategories);
      setFlatCategories(flatCats);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setError(error instanceof Error ? error.message : "Error desconocido al cargar categorías");
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [buildCategoryTree, flattenCategories]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filtrar y ordenar categorías manteniendo jerarquía
  const filteredAndSortedCategories = useMemo(() => {
    // Detectar si hay filtros o ordenamiento personalizado activo
    const hasActiveFilters = filters.search || filters.parent !== null || !filters.showEmpty;
    const hasCustomSorting = filters.sortField !== 'name' || filters.sortOrder !== 'asc';
    
    // Si no hay filtros ni ordenamiento personalizado, mantener jerarquía
    if (!hasActiveFilters && !hasCustomSorting) {
      return flatCategories; // Ya está en orden jerárquico correcto
    }

    // Aplicar filtros y ordenamiento personalizado
    let filtered = [...flatCategories];

    // Aplicar filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchLower) ||
        cat.slug.toLowerCase().includes(searchLower) ||
        cat.description.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtro de categoría padre
    if (filters.parent !== null) {
      filtered = filtered.filter(cat => cat.parent === filters.parent);
    }

    // Aplicar filtro de mostrar vacías
    if (!filters.showEmpty) {
      filtered = filtered.filter(cat => cat.count > 0);
    }

    // Aplicar ordenamiento personalizado
    if (hasCustomSorting) {
      filtered.sort((a, b) => {
        let aValue: any = a[filters.sortField];
        let bValue: any = b[filters.sortField];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (filters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [flatCategories, filters]);

  // Paginación
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCategories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCategories, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedCategories.length / itemsPerPage);

  // Función para crear categoría
  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setCreating(true);
      
      const cleanData = { ...data };
      if (!cleanData.slug || cleanData.slug.trim() === '') {
        delete cleanData.slug;
      }
      
      const newCategory = await categoriesApi.createCategory(cleanData);
      toast({
        title: "Éxito",
        description: "Categoría creada exitosamente",
      });
      
      reset();
      fetchCategories(); // Recargar para actualizar la jerarquía
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la categoría",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Función para manejar la edición
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setValueEdit("name", category.name);
    setValueEdit("slug", category.slug);
    setValueEdit("description", category.description);
    setValueEdit("parent", category.parent);
    setValueEdit("display", category.display || 'default');
    setValueEdit("menu_order", category.menu_order || 0);
    setEditDialogOpen(true);
  };

  // Función para actualizar categoría
  const onEditSubmit = async (data: CategoryFormValues) => {
    if (!editingCategory) return;

    try {
      await categoriesApi.updateCategory(editingCategory.id, data);

      toast({
        title: "Éxito",
        description: "Categoría actualizada exitosamente",
      });
      
      setEditDialogOpen(false);
      setEditingCategory(null);
      resetEdit();
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la categoría",
        variant: "destructive",
      });
    }
  };

  // Función para manejar eliminación
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Función para confirmar eliminación
  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    // Validar si la categoría se puede eliminar
    const hasProducts = categoryToDelete.count > 0;
    const hasSubcategories = flatCategories.some(subcat => subcat.parent === categoryToDelete.id);

    if (hasProducts || hasSubcategories) {
      let message = `No se puede eliminar la categoría "${categoryToDelete.name}" porque:\n\n`;
      
      if (hasProducts) {
        message += `• Contiene ${categoryToDelete.count} productos\n`;
      }
      
      if (hasSubcategories) {
        const subcategoriesCount = flatCategories.filter(subcat => subcat.parent === categoryToDelete.id).length;
        message += `• Tiene ${subcategoriesCount} subcategorías\n`;
      }
      
      message += '\nPara eliminar esta categoría:\n';
      if (hasProducts) {
        message += '1. Reasigna o elimina los productos\n';
      }
      if (hasSubcategories) {
        message += '2. Elimina o reasigna las subcategorías\n';
      }
      
      toast({
        title: "No se puede eliminar",
        description: hasProducts 
          ? `La categoría contiene ${categoryToDelete.count} productos` 
          : "La categoría tiene subcategorías",
        variant: "destructive",
      });
      
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      return;
    }

    try {
      await categoriesApi.deleteCategory(categoryToDelete.id);

      toast({
        title: "Éxito",
        description: "Categoría eliminada exitosamente",
      });
      
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la categoría",
        variant: "destructive",
      });
    }
  };

  // Función para manejar selección de categorías
  const handleCategorySelect = (categoryId: number, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(categoryId);
    } else {
      newSelected.delete(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  // Función para seleccionar todas las categorías
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedCategories.map(cat => cat.id));
      setSelectedCategories(allIds);
    } else {
      setSelectedCategories(new Set());
    }
  };

    // Función para validar categorías antes de eliminar
  const validateCategoriesForDeletion = (categoryIds: number[]) => {
    const categoriesToDelete = flatCategories.filter(cat => categoryIds.includes(cat.id));
    const categoriesWithProducts = categoriesToDelete.filter(cat => cat.count > 0);
    const categoriesWithSubcategories = categoriesToDelete.filter(cat => 
      flatCategories.some(subcat => subcat.parent === cat.id)
    );
    
    return {
      canDelete: categoriesToDelete.filter(cat => cat.count === 0 && !flatCategories.some(subcat => subcat.parent === cat.id)),
      withProducts: categoriesWithProducts,
      withSubcategories: categoriesWithSubcategories,
      total: categoriesToDelete.length
    };
  };

  // Función para manejar acciones en conjunto
  const handleBulkAction = async () => {
    if (!bulkAction || selectedCategories.size === 0) return;

    try {
      const categoryIds = Array.from(selectedCategories);
      
      switch (bulkAction) {
        case 'delete':
          // Validar categorías antes de mostrar confirmación
          const validation = validateCategoriesForDeletion(categoryIds);
          
          if (validation.withProducts.length > 0 || validation.withSubcategories.length > 0) {
            // Mostrar dialog de información sobre categorías que no se pueden eliminar
            const problemCategories = [
              ...validation.withProducts.map(cat => `• ${cat.name} (${cat.count} productos)`),
              ...validation.withSubcategories.map(cat => `• ${cat.name} (tiene subcategorías)`)
            ].join('\n');
            
            const canDeleteCount = validation.canDelete.length;
            const cannotDeleteCount = validation.withProducts.length + validation.withSubcategories.length;
            
            let message = `No se pueden eliminar ${cannotDeleteCount} categorías:\n\n${problemCategories}`;
            
            if (canDeleteCount > 0) {
              message += `\n\n¿Quieres eliminar solo las ${canDeleteCount} categorías que sí se pueden eliminar?`;
              
              if (confirm(message)) {
                // Eliminar solo las categorías que se pueden eliminar
                const result = await categoriesApi.bulkDeleteCategories(validation.canDelete.map(cat => cat.id));
                
                toast({
                  title: "Eliminación parcial completada",
                  description: `${result.summary.deleted} categorías eliminadas. ${cannotDeleteCount} categorías no se pudieron eliminar.`,
                });
                
                fetchCategories();
              }
            } else {
              alert(message + '\n\nPara eliminar estas categorías:\n1. Reasigna o elimina los productos\n2. Elimina o reasigna las subcategorías');
            }
          } else {
            // Todas las categorías se pueden eliminar
            if (confirm(`¿Estás seguro de que quieres eliminar ${categoryIds.length} categorías?`)) {
              const result = await categoriesApi.bulkDeleteCategories(categoryIds);
              
              toast({
                title: "Éxito",
                description: `${result.summary.deleted} categorías eliminadas exitosamente`,
              });
              
              fetchCategories();
            }
          }
          break;
        case 'export':
          // Implementar exportación
          const categoriesToExport = flatCategories.filter(cat => categoryIds.includes(cat.id));
          const csvContent = generateCategoryCSV(categoriesToExport);
          downloadCSV(csvContent, 'categorias-exportadas.csv');
          
          toast({
            title: "Exportación completada",
            description: `${categoriesToExport.length} categorías exportadas a CSV`,
          });
          break;
      }
      
      setSelectedCategories(new Set());
      setBulkAction('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al ejecutar la acción en conjunto",
        variant: "destructive",
      });
    }
  };

  // Función para generar CSV de categorías
  const generateCategoryCSV = (categories: Category[]) => {
    const headers = ['ID', 'Nombre', 'Slug', 'Descripción', 'Padre', 'Productos', 'Nivel'];
    const rows = categories.map(cat => [
      cat.id,
      `"${cat.name}"`,
      cat.slug,
      `"${cat.description || ''}"`,
      cat.parent,
      cat.count,
      cat.level || 0
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  // Función para descargar CSV
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Función para editar slug inline
  const handleSlugEdit = (categoryId: number, currentSlug: string) => {
    setEditingSlug(categoryId);
    setTempSlug(currentSlug);
  };

  // Función para guardar slug editado
  const handleSlugSave = async (categoryId: number) => {
    try {
      await categoriesApi.updateCategory(categoryId, { slug: tempSlug });

      toast({
        title: "Éxito",
        description: "Slug actualizado exitosamente",
      });
      
      setEditingSlug(null);
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el slug",
        variant: "destructive",
      });
    }
  };

  // Función para expandir/contraer categorías
  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Cargando categorías...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error: {error}</p>
        <Button onClick={fetchCategories} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías de Productos</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías y subcategorías para tus productos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchCategories} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Estadísticas colapsables */}
      <Card className="border-dashed">
        <Collapsible open={statsExpanded} onOpenChange={setStatsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {statsExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <h3 className="text-sm font-medium">Estadísticas y Métricas</h3>
                  <p className="text-xs text-muted-foreground">
                    {flatCategories.length} categorías • {flatCategories.reduce((sum, cat) => sum + cat.count, 0)} productos
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {statsExpanded ? 'Ocultar' : 'Mostrar'}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <CategoryStats categories={flatCategories} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Formulario para crear categoría */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Añadir Nueva Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" {...register("slug")} />
                  <p className="text-sm text-muted-foreground mt-1">
                    Se genera automáticamente si se deja vacío
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="parent">Categoría Padre</Label>
                  <Select onValueChange={(value) => setValue("parent", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría padre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Ninguna (Categoría raíz)</SelectItem>
                      {flatCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {'—'.repeat(category.level || 0)} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" {...register("description")} />
                </div>
                
                <div>
                  <Label htmlFor="display">Tipo de Visualización</Label>
                  <Select onValueChange={(value) => setValue("display", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por defecto</SelectItem>
                      <SelectItem value="products">Productos</SelectItem>
                      <SelectItem value="subcategories">Subcategorías</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="menu_order">Orden del Menú</Label>
                  <Input 
                    id="menu_order" 
                    type="number" 
                    {...register("menu_order", { valueAsNumber: true })} 
                  />
                </div>
                
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Añadir Nueva Categoría"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Lista de categorías */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Todas las Categorías ({filteredAndSortedCategories.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar categorías..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <Select 
                  value={filters.parent?.toString() || 'all'} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    parent: value === 'all' ? null : parseInt(value) 
                  }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="0">Solo categorías raíz</SelectItem>
                    {flatCategories.filter(cat => cat.parent === 0).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, showEmpty: !prev.showEmpty }))}
                >
                  {filters.showEmpty ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                  {filters.showEmpty ? 'Ocultar vacías' : 'Mostrar vacías'}
                </Button>
              </div>
              
              {/* Acciones en conjunto */}
              {selectedCategories.size > 0 && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedCategories.size} categorías seleccionadas
                  </span>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Acciones en conjunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delete">Eliminar seleccionadas</SelectItem>
                      <SelectItem value="export">Exportar seleccionadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleBulkAction} disabled={!bulkAction} size="sm">
                    Aplicar
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCategories.size === paginatedCategories.length && paginatedCategories.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          sortField: 'name',
                          sortOrder: prev.sortField === 'name' && prev.sortOrder === 'asc' ? 'desc' : 'asc'
                        }))}
                      >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          sortField: 'count',
                          sortOrder: prev.sortField === 'count' && prev.sortOrder === 'asc' ? 'desc' : 'asc'
                        }))}
                      >
                        Productos
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No se encontraron categorías con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCategories.has(category.id)}
                            onCheckedChange={(checked) => handleCategorySelect(category.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div style={{ paddingLeft: `${(category.level || 0) * 20}px` }}>
                              {category.level === 0 ? (
                                <Folder className="mr-2 h-4 w-4 text-blue-600" />
                              ) : (
                                <div className="flex items-center">
                                  <div className="w-4 h-4 mr-2 border-l border-b border-muted-foreground/30"></div>
                                  <FolderOpen className="mr-2 h-4 w-4 text-orange-600" />
                                </div>
                              )}
                              {category.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingSlug === category.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={tempSlug}
                                onChange={(e) => setTempSlug(e.target.value)}
                                className="h-8"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSlugSave(category.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingSlug(null);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSlugSave(category.id)}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSlug(null)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => handleSlugEdit(category.id, category.slug)}
                            >
                              {category.slug}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || "Sin descripción"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{category.count}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/product-category/${category.slug}`, '_blank')}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver en tienda
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(category)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedCategories.length)} de {filteredAndSortedCategories.length} categorías
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para editar categoría */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la categoría seleccionada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input id="edit-name" {...registerEdit("name")} />
                {errorsEdit.name && <p className="text-sm text-red-600 mt-1">{errorsEdit.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug</Label>
                <Input id="edit-slug" {...registerEdit("slug")} />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-parent">Categoría Padre</Label>
              <Select onValueChange={(value) => setValueEdit("parent", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ninguna (Categoría raíz)</SelectItem>
                  {flatCategories.filter(cat => cat.id !== editingCategory?.id).map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {'—'.repeat(category.level || 0)} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea id="edit-description" {...registerEdit("description")} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-display">Tipo de Visualización</Label>
                <Select onValueChange={(value) => setValueEdit("display", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Por defecto</SelectItem>
                    <SelectItem value="products">Productos</SelectItem>
                    <SelectItem value="subcategories">Subcategorías</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-menu_order">Orden del Menú</Label>
                <Input 
                  id="edit-menu_order" 
                  type="number" 
                  {...registerEdit("menu_order", { valueAsNumber: true })} 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Actualizar Categoría
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría
              <strong> "{categoryToDelete?.name}"</strong> y todos sus datos asociados.
              
              {categoryToDelete && (
                <div className="mt-3 space-y-2">
                  {categoryToDelete.count > 0 && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Esta categoría contiene {categoryToDelete.count} productos</span>
                    </div>
                  )}
                  
                  {flatCategories.some(cat => cat.parent === categoryToDelete.id) && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Esta categoría tiene {flatCategories.filter(cat => cat.parent === categoryToDelete.id).length} subcategorías
                      </span>
                    </div>
                  )}
                  
                  {(categoryToDelete.count > 0 || flatCategories.some(cat => cat.parent === categoryToDelete.id)) && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Nota:</strong> Las categorías con productos o subcategorías no se pueden eliminar.
                      Primero debes reasignar o eliminar el contenido asociado.
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={categoryToDelete ? (categoryToDelete.count > 0 || flatCategories.some(cat => cat.parent === categoryToDelete.id)) : false}
            >
              {categoryToDelete && (categoryToDelete.count > 0 || flatCategories.some(cat => cat.parent === categoryToDelete.id)) 
                ? "No se puede eliminar" 
                : "Eliminar"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
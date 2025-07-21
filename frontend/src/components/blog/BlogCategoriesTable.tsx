"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  FolderTree,
  Folder,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blogApi } from "@/lib/api";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

interface CategoryWithLevel extends BlogCategory {
  level: number;
  parentName?: string;
}

export function BlogCategoriesTable() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Función para organizar categorías jerárquicamente
  const organizeCategories = (categories: BlogCategory[]): CategoryWithLevel[] => {
    const categoryMap = new Map<number, BlogCategory>();
    const result: CategoryWithLevel[] = [];

    // Crear mapa de categorías para búsqueda rápida
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    // Función recursiva para agregar categorías con su nivel
    const addCategoryWithChildren = (category: BlogCategory, level: number = 0, parentName?: string) => {
      const categoryWithLevel: CategoryWithLevel = {
        ...category,
        level,
        parentName
      };
      result.push(categoryWithLevel);

      // Buscar y agregar subcategorías
      const children = categories
        .filter(cat => cat.parent === category.id)
        .sort((a, b) => a.name.localeCompare(b.name));

      children.forEach(child => {
        addCategoryWithChildren(child, level + 1, category.name);
      });
    };

    // Primero agregar categorías padre (parent = 0)
    const parentCategories = categories
      .filter(cat => cat.parent === 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    parentCategories.forEach(cat => {
      addCategoryWithChildren(cat, 0);
    });

    return result;
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await blogApi.getCategories({
        per_page: 100,
        search: searchTerm || undefined,
      });
      
      setCategories(response.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = () => {
    fetchCategories();
  };

  const handleDelete = async (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name || `ID ${categoryId}`;
    
    // Verificar si tiene subcategorías
    const hasChildren = categories.some(c => c.parent === categoryId);
    if (hasChildren) {
      alert(`No se puede eliminar "${categoryName}" porque tiene subcategorías. Elimina primero las subcategorías.`);
      return;
    }
    
    // Verificar si tiene posts asignados
    if (category && category.count > 0) {
      const confirmMessage = `La categoría "${categoryName}" tiene ${category.count} entrada(s) asignada(s). ¿Estás seguro de que quieres eliminarla? Esta acción no se puede deshacer.`;
      if (!confirm(confirmMessage)) {
        return;
      }
    } else {
      if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"? Esta acción no se puede deshacer.`)) {
        return;
      }
    }
    
    try {
      // WordPress requiere force=true para eliminar categorías permanentemente
      await blogApi.deleteCategory(categoryId, true);
      fetchCategories();
      
      // Mostrar mensaje de éxito
      alert(`Categoría "${categoryName}" eliminada exitosamente.`);
    } catch (error: any) {
      console.error("Error deleting category:", error);
      
      // Manejar errores específicos
      const errorMessage = error.message || "Error desconocido";
      if (errorMessage.includes("posts asignados") || errorMessage.includes("categoría padre")) {
        alert(`No se puede eliminar "${categoryName}": ${errorMessage}`);
      } else if (errorMessage.includes("force=true")) {
        alert(`Error: ${errorMessage}`);
      } else {
        alert(`Error al eliminar la categoría "${categoryName}": ${errorMessage}`);
      }
    }
  };

  const handleRowClick = (categoryId: number, event: React.MouseEvent) => {
    // Evitar navegación si se hace clic en el dropdown de acciones
    if ((event.target as HTMLElement).closest('[data-radix-collection-item]') || 
        (event.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/dashboard/blog/categories/${categoryId}/edit`);
  };

  // Organizar categorías jerárquicamente
  const organizedCategories = organizeCategories(categories);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Cargando categorías...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de categorías */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Categorías del Blog ({categories.length} total)
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {categories.filter(c => c.parent === 0).length} categorías principales • {categories.filter(c => c.parent !== 0).length} subcategorías
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Jerarquía</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizedCategories.map((category) => (
                <TableRow 
                  key={category.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleRowClick(category.id, e)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${category.level * 20}px` }}>
                      {category.level > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {Array.from({ length: category.level }, (_, i) => (
                            <ArrowRight key={i} className="h-3 w-3" />
                          ))}
                        </div>
                      )}
                      {category.level === 0 ? (
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Folder className="h-4 w-4 text-orange-600" />
                      )}
                      <span className={`font-medium ${category.level > 0 ? 'text-sm' : ''}`}>
                        {category.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {category.level === 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Categoría Principal
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                            Subcategoría
                          </span>
                          {category.parentName && (
                            <span className="text-xs text-muted-foreground">
                              de "{category.parentName}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                      {category.description || "Sin descripción"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{category.count} entradas</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/blog/categories/${category.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron categorías
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
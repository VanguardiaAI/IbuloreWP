"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderOpen, Package, TrendingUp, BarChart3 } from "lucide-react";

interface Category {
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
}

interface CategoryStatsProps {
  categories: Category[];
}

export function CategoryStats({ categories }: CategoryStatsProps) {
  // Calcular estadísticas
  const totalCategories = categories.length;
  const rootCategories = categories.filter(cat => cat.parent === 0).length;
  const subcategories = categories.filter(cat => cat.parent !== 0).length;
  const totalProducts = categories.reduce((sum, cat) => sum + cat.count, 0);
  const categoriesWithProducts = categories.filter(cat => cat.count > 0).length;
  const emptyCategories = categories.filter(cat => cat.count === 0).length;
  
  // Encontrar la categoría con más productos
  const topCategory = categories.reduce((max, cat) => 
    cat.count > max.count ? cat : max, 
    categories[0] || { name: 'N/A', count: 0 }
  );

  // Calcular profundidad máxima del árbol
  const maxDepth = categories.reduce((max, cat) => 
    Math.max(max, cat.level || 0), 0
  ) + 1;

  const stats = [
    {
      title: "Total de Categorías",
      value: totalCategories,
      icon: Folder,
      description: "Categorías en total",
      color: "text-blue-600",
    },
    {
      title: "Categorías Raíz",
      value: rootCategories,
      icon: FolderOpen,
      description: "Categorías principales",
      color: "text-green-600",
    },
    {
      title: "Subcategorías",
      value: subcategories,
      icon: FolderOpen,
      description: "Categorías anidadas",
      color: "text-orange-600",
    },
    {
      title: "Total de Productos",
      value: totalProducts,
      icon: Package,
      description: "Productos categorizados",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-3 w-3 ${stat.color}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estadísticas adicionales en una fila */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              Categoría Más Popular
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm font-semibold truncate">{topCategory.name}</div>
            <Badge variant="secondary" className="text-xs mt-1">{topCategory.count} productos</Badge>
          </CardContent>
        </Card>

        <Card className="border-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Estado de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs">Con productos:</span>
                <Badge variant="default" className="text-xs">{categoriesWithProducts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Vacías:</span>
                <Badge variant="outline" className="text-xs">{emptyCategories}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Estructura Jerárquica
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs">Profundidad máxima:</span>
                <Badge variant="secondary" className="text-xs">{maxDepth} niveles</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Promedio productos:</span>
                <Badge variant="outline" className="text-xs">
                  {totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de categorías más populares - más compacta */}
      {categories.length > 0 && (
        <Card className="border-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center text-muted-foreground">
              <BarChart3 className="mr-1 h-3 w-3" />
              Top 5 Categorías por Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {categories
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <span className="text-xs truncate">{category.name}</span>
                      {category.level && category.level > 0 && (
                        <Badge variant="outline" className="text-xs h-4 px-1">
                          L{category.level + 1}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2">{category.count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { type InventoryStats } from "@/lib/api";

interface InventoryStatsProps {
  stats: InventoryStats | null;
  loading: boolean;
}

export function InventoryStats({ stats, loading }: InventoryStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">No se pudieron cargar las estadísticas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Función para formatear precios
  const formatPrice = (amount: number): string => {
    return formatCurrency(amount, DEFAULT_CURRENCY);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de productos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_products}</div>
          <p className="text-xs text-muted-foreground">
            Productos en el catálogo
          </p>
        </CardContent>
      </Card>

      {/* En stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Stock</CardTitle>
          <Badge variant="default" className="bg-green-600">
            <Package className="h-3 w-3" />
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.in_stock}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total_products > 0 
              ? `${Math.round((stats.in_stock / stats.total_products) * 100)}% del total`
              : '0% del total'
            }
          </p>
        </CardContent>
      </Card>

      {/* Stock bajo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.low_stock}</div>
          <p className="text-xs text-muted-foreground">
            Requieren reposición
          </p>
        </CardContent>
      </Card>

      {/* Agotados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agotados</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.out_of_stock}</div>
          <p className="text-xs text-muted-foreground">
            Sin stock disponible
          </p>
        </CardContent>
      </Card>

      {/* Valor total del inventario */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total del Inventario</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatPrice(stats.total_stock_value)}</div>
          <p className="text-xs text-muted-foreground">
            Valor estimado basado en precios regulares y cantidades en stock
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 
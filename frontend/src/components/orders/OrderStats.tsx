"use client";

import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  Loader2,
  RefreshCw
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

interface OrderStatsProps {
  className?: string;
}

export function OrderStats({ className }: OrderStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getOrderStats();
      setStats(response);
    } catch (error) {
      console.error("Error fetching order stats:", error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando estadísticas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Error al cargar las estadísticas</p>
            <Button onClick={fetchStats} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con botón de actualizar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Estadísticas de Pedidos</h2>
        <Button
          variant="outline"
          onClick={fetchStats}
          disabled={loading}
          size="sm"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_orders?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Último mes
            </p>
          </CardContent>
        </Card>

        {/* Pedidos pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_orders || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        {/* Pedidos procesando */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesando</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing_orders || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              En preparación
            </p>
          </CardContent>
        </Card>

        {/* Pedidos completados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_orders?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Finalizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos y valor promedio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Ingresos y Valor Promedio
            </CardTitle>
            <CardDescription>
              Métricas financieras del último mes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue || 0, DEFAULT_CURRENCY)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Promedio de Pedido</p>
              <p className="text-xl font-semibold">{formatCurrency(stats.average_order_value || 0, DEFAULT_CURRENCY)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Distribución por estados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Distribución por Estados
            </CardTitle>
            <CardDescription>
              Resumen de pedidos por estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.orders_by_status && Object.entries(stats.orders_by_status).map(([status, count]: [string, any]) => {
                const statusLabels: Record<string, { label: string; color: string }> = {
                  pending: { label: "Pendiente", color: "bg-yellow-500" },
                  processing: { label: "Procesando", color: "bg-blue-500" },
                  "on-hold": { label: "En espera", color: "bg-orange-500" },
                  completed: { label: "Completado", color: "bg-green-500" },
                  cancelled: { label: "Cancelado", color: "bg-red-500" },
                  refunded: { label: "Reembolsado", color: "bg-purple-500" },
                  failed: { label: "Fallido", color: "bg-gray-500" },
                };

                const statusInfo = statusLabels[status] || { label: status, color: "bg-gray-400" };
                const percentage = stats.total_orders > 0 ? ((count / stats.total_orders) * 100).toFixed(1) : 0;

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                      <span className="text-sm font-medium">{statusInfo.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top productos (si están disponibles) */}
      {stats.top_products && stats.top_products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription>
              Los productos con más ventas este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.top_products.slice(0, 5).map((product: any, index: number) => (
                <div key={product.id || index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{product.name || `Producto ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity || product.total_sales || 0} vendidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(product.total || product.sales || 0, DEFAULT_CURRENCY)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
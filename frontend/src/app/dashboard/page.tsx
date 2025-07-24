"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users,
  DollarSign,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

interface DashboardStats {
  sales: {
    total: number;
    change: number;
    currency: string;
  };
  orders: {
    total: number;
    change: number;
    completed: number;
  };
  products: {
    total: number;
    change: number;
  };
  customers: {
    total: number;
    new_this_month: number;
    change: number;
  };
  recent_activity: Array<{
    type: 'order' | 'product' | 'customer' | 'payment';
    title: string;
    time: string;
    status: string;
  }>;
  sales_chart: Array<{
    month: string;
    revenue: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Error al cargar las estadísticas del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'product':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'customer':
        return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      case 'payment':
        return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  if (loading) {
    return (
      <>
        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <>
      {/* Botón de actualizar */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.sales.total, stats.sales.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.sales.change > 0 ? '+' : ''}{stats.sales.change}% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.orders.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.orders.completed} completados este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.products.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.products.change > 0 ? '+' : ''}{stats.products.change}% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.customers.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.customers.new_this_month} nuevos este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tu tienda de manera eficiente
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              className="h-20 flex flex-col gap-2 text-sm"
              onClick={() => router.push('/dashboard/products/new')}
            >
              <Package className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Nuevo Producto</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-sm"
              onClick={() => router.push('/dashboard/orders')}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Ver Pedidos</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-sm"
              onClick={() => router.push('/dashboard/customers')}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Gestionar Clientes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-sm"
              onClick={() => router.push('/dashboard/reports')}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-xs sm:text-sm">Reportes</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas actividades en tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recent_activity.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay actividad reciente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Ventas</CardTitle>
          <CardDescription>
            Rendimiento de ventas en los últimos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/40 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Gráfico de ventas</p>
              <p className="text-sm text-muted-foreground/80">
                {stats.sales_chart.length > 0 
                  ? `${stats.sales_chart.length} meses de datos disponibles`
                  : 'Se implementará con datos reales'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
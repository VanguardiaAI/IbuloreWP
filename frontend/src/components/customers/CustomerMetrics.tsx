import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { Users, UserCheck, UserX, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

interface CustomerMetricsProps {
  stats: {
    total: number;
    registered: number;
    guest: number;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  };
  hasActiveFilters: boolean;
}

export function CustomerMetrics({ stats, hasActiveFilters }: CustomerMetricsProps) {
  const formatPrice = (amount: number): string => {
    return formatCurrency(amount, DEFAULT_CURRENCY);
  };

  const metrics = [
    {
      title: "Total Clientes",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: hasActiveFilters ? "Filtrados" : "Todos los clientes"
    },
    {
      title: "Registrados",
      value: stats.registered,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${stats.total > 0 ? Math.round((stats.registered / stats.total) * 100) : 0}% del total`
    },
    {
      title: "Invitados",
      value: stats.guest,
      icon: UserX,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: `${stats.total > 0 ? Math.round((stats.guest / stats.total) * 100) : 0}% del total`
    },
    {
      title: "Total Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: `${stats.total > 0 ? (stats.totalOrders / stats.total).toFixed(1) : 0} pedidos/cliente`
    },
    {
      title: "Ingresos Totales",
      value: formatPrice(stats.totalSpent),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: `${stats.registered > 0 ? formatPrice(stats.totalSpent / stats.registered) : formatPrice(0)} por cliente`
    },
    {
      title: "Valor Medio Pedido",
      value: formatPrice(stats.averageOrderValue),
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "VMP promedio"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 
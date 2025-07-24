"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingCart
} from "lucide-react";

export default function ReportsPage() {
  const reports = [
    {
      title: "Reporte de Ventas",
      description: "Análisis completo de ventas por período",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      actions: ["Ver", "Descargar PDF", "Exportar Excel"]
    },
    {
      title: "Reporte de Pedidos",
      description: "Detalle de pedidos procesados y pendientes",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      actions: ["Ver", "Descargar PDF", "Exportar CSV"]
    },
    {
      title: "Reporte de Inventario",
      description: "Estado actual del inventario y movimientos",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      actions: ["Ver", "Descargar PDF", "Exportar Excel"]
    },
    {
      title: "Reporte de Clientes",
      description: "Análisis de clientes y comportamiento de compra",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      actions: ["Ver", "Descargar PDF", "Exportar CSV"]
    },
    {
      title: "Reporte de Tendencias",
      description: "Productos más vendidos y tendencias del mercado",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      actions: ["Ver", "Descargar PDF", "Gráficos"]
    },
    {
      title: "Reporte Financiero",
      description: "Resumen financiero completo del período",
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      actions: ["Ver", "Descargar PDF", "Exportar Excel"]
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Reportes y Análisis</h1>
        <p className="text-muted-foreground">
          Genera y descarga reportes detallados de tu tienda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <Icon className={`w-6 h-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <select className="flex-1 px-3 py-2 text-sm border rounded-md">
                    <option>Últimos 30 días</option>
                    <option>Últimos 90 días</option>
                    <option>Este año</option>
                    <option>Año anterior</option>
                    <option>Personalizado</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {report.actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant={actionIndex === 0 ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                    >
                      {action.includes("Descargar") || action.includes("Exportar") ? (
                        <Download className="w-3 h-3 mr-1" />
                      ) : null}
                      {action}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Reportes Personalizados</CardTitle>
          <CardDescription>
            Crea reportes personalizados según tus necesidades específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="w-full md:w-auto">
            <FileText className="w-4 h-4 mr-2" />
            Crear Reporte Personalizado
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
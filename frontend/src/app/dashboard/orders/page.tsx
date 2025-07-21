import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderStats } from "@/components/orders/OrderStats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function AllOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">
            Administra pedidos, revisa estadísticas y crea nuevos pedidos para tu tienda.
          </p>
        </div>
        <Link href="/dashboard/orders/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Pedido
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Todos los Pedidos</TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-6">
          <OrdersTable />
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-6">
          <OrderStats />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
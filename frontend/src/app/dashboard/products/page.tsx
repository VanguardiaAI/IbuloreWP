import { ProductsTable } from "@/components/products/ProductsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function AllProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Todos los Productos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los productos de tu tienda aquí.
          </p>
        </div>
        <Link href="/dashboard/products/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Producto
          </Button>
        </Link>
      </div>
      
      <ProductsTable />
    </div>
  );
} 
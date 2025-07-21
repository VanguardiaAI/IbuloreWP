"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, RefreshCw } from "lucide-react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { BulkActions } from "@/components/inventory/BulkActions";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { 
  inventoryApi, 
  type InventoryProduct, 
  type InventoryStats as InventoryStatsType 
} from "@/lib/api";

export default function InventoryPage() {
  const [products, setProducts] = React.useState<InventoryProduct[]>([]);
  const [stats, setStats] = React.useState<InventoryStatsType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [selectedProducts, setSelectedProducts] = React.useState<number[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = React.useState("");
  const [stockStatusFilter, setStockStatusFilter] = React.useState<string>("all");
  const [lowStockFilter, setLowStockFilter] = React.useState(false);

  // Cargar productos del inventario
  const fetchInventory = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const params: {
        search?: string;
        stock_status?: string;
        low_stock?: boolean;
      } = {};
      
      if (searchTerm) params.search = searchTerm;
      if (stockStatusFilter && stockStatusFilter !== 'all') params.stock_status = stockStatusFilter;
      if (lowStockFilter) params.low_stock = true;
      
      const data = await inventoryApi.getInventory(params);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, stockStatusFilter, lowStockFilter]);

  // Cargar estadísticas
  const fetchStats = React.useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await inventoryApi.getInventoryStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Actualizar un producto individual
  const handleUpdateProduct = async (productId: number, updateData: Partial<InventoryProduct>) => {
    try {
      await inventoryApi.updateProduct(productId, updateData);
      
      // Recargar datos después de la actualización
      await Promise.all([fetchInventory(), fetchStats()]);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  // Actualización masiva
  const handleBulkUpdate = async (updates: Array<{ id: number; [key: string]: any }>, updateType: string) => {
    try {
      const result = await inventoryApi.bulkUpdateProducts({
        products: updates,
        update_type: updateType,
      });
      
      console.log('Bulk update result:', result);

      // Recargar datos después de la actualización
      await Promise.all([fetchInventory(), fetchStats()]);
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  };

  // Manejo de selección de productos
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedProducts(selected ? products.map(p => p.id) : []);
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
  };

  // Efectos
  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounce para la búsqueda
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Inventario</h1>
        <p className="text-muted-foreground">
          Gestiona el stock, precios y estado de tus productos de forma eficiente.
        </p>
      </div>

      {/* Estadísticas */}
      <InventoryStats stats={stats} loading={statsLoading} />

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado de stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="instock">En Stock</SelectItem>
              <SelectItem value="outofstock">Agotado</SelectItem>
              <SelectItem value="onbackorder">Bajo Pedido</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={lowStockFilter ? "bg-orange-50 border-orange-200" : ""}
          >
            Stock Bajo
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchInventory();
            fetchStats();
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Acciones masivas */}
      <BulkActions
        selectedCount={selectedProducts.length}
        selectedProducts={selectedProducts}
        onBulkUpdate={handleBulkUpdate}
        onClearSelection={handleClearSelection}
      />

      {/* Tabla de inventario */}
      <InventoryTable
        products={products}
        loading={loading}
        onUpdateProduct={handleUpdateProduct}
        onBulkUpdate={handleBulkUpdate}
        selectedProducts={selectedProducts}
        onSelectProduct={handleSelectProduct}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
} 
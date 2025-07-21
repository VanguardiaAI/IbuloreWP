"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, DollarSign, AlertTriangle } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onBulkUpdate: (products: Array<{ id: number; [key: string]: any }>, updateType: string) => Promise<void>;
  selectedProducts: number[];
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  onBulkUpdate,
  selectedProducts,
  onClearSelection,
}: BulkActionsProps) {
  const [stockDialogOpen, setStockDialogOpen] = React.useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = React.useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Estados para actualización de stock
  const [stockQuantity, setStockQuantity] = React.useState("");
  const [stockAction, setStockAction] = React.useState<"set" | "add" | "subtract">("set");

  // Estados para actualización de precios
  const [regularPrice, setRegularPrice] = React.useState("");
  const [salePrice, setSalePrice] = React.useState("");
  const [priceAction, setPriceAction] = React.useState<"set" | "increase" | "decrease">("set");
  const [pricePercentage, setPricePercentage] = React.useState("");

  // Estados para actualización de estado
  const [stockStatus, setStockStatus] = React.useState<"instock" | "outofstock" | "onbackorder">("instock");

  const handleBulkStockUpdate = async () => {
    if (!stockQuantity) return;

    setLoading(true);
    try {
      const updates = selectedProducts.map(id => {
        let finalQuantity = parseInt(stockQuantity);
        
        // Para acciones de suma/resta, necesitaríamos el stock actual
        // Por simplicidad, solo implementamos "set" por ahora
        return {
          id,
          stock_quantity: finalQuantity,
          manage_stock: true,
        };
      });

      await onBulkUpdate(updates, 'stock');
      setStockDialogOpen(false);
      setStockQuantity("");
      onClearSelection();
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!regularPrice && !salePrice) return;

    setLoading(true);
    try {
      const updates = selectedProducts.map(id => {
        const update: any = { id };
        
        if (regularPrice) {
          if (priceAction === "set") {
            update.regular_price = regularPrice;
          } else if (priceAction === "increase" && pricePercentage) {
            // Para aumentos/descuentos porcentuales necesitaríamos el precio actual
            // Por simplicidad, solo implementamos "set" por ahora
            update.regular_price = regularPrice;
          }
        }
        
        if (salePrice) {
          update.sale_price = salePrice;
        }
        
        return update;
      });

      await onBulkUpdate(updates, 'price');
      setPriceDialogOpen(false);
      setRegularPrice("");
      setSalePrice("");
      onClearSelection();
    } catch (error) {
      console.error('Error updating prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    setLoading(true);
    try {
      const updates = selectedProducts.map(id => ({
        id,
        stock_status: stockStatus,
      }));

      await onBulkUpdate(updates, 'stock');
      setStatusDialogOpen(false);
      onClearSelection();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">{selectedCount} productos seleccionados</span>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        {/* Actualización masiva de stock */}
        <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Package className="w-4 h-4 mr-2" />
              Actualizar Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Stock Masivamente</DialogTitle>
              <DialogDescription>
                Actualizar el stock de {selectedCount} productos seleccionados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock-action">Acción</Label>
                <Select value={stockAction} onValueChange={(value: "set" | "add" | "subtract") => setStockAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Establecer cantidad</SelectItem>
                    <SelectItem value="add">Agregar cantidad</SelectItem>
                    <SelectItem value="subtract">Restar cantidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-quantity">Cantidad</Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Ingresa la cantidad"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleBulkStockUpdate} disabled={loading || !stockQuantity}>
                {loading ? "Actualizando..." : "Actualizar Stock"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Actualización masiva de precios */}
        <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <DollarSign className="w-4 h-4 mr-2" />
              Actualizar Precios
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Precios Masivamente</DialogTitle>
              <DialogDescription>
                Actualizar los precios de {selectedCount} productos seleccionados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price-action">Acción</Label>
                <Select value={priceAction} onValueChange={(value: "set" | "increase" | "decrease") => setPriceAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Establecer precio</SelectItem>
                    <SelectItem value="increase">Aumentar %</SelectItem>
                    <SelectItem value="decrease">Disminuir %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {priceAction === "set" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="regular-price">Precio Regular</Label>
                    <Input
                      id="regular-price"
                      type="number"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(e.target.value)}
                      placeholder="Precio regular"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale-price">Precio de Oferta (opcional)</Label>
                    <Input
                      id="sale-price"
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Precio de oferta"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="price-percentage">Porcentaje</Label>
                  <Input
                    id="price-percentage"
                    type="number"
                    value={pricePercentage}
                    onChange={(e) => setPricePercentage(e.target.value)}
                    placeholder="Porcentaje (ej: 10 para 10%)"
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleBulkPriceUpdate} disabled={loading || (!regularPrice && !salePrice)}>
                {loading ? "Actualizando..." : "Actualizar Precios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Actualización masiva de estado */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Cambiar Estado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Estado de Stock</DialogTitle>
              <DialogDescription>
                Cambiar el estado de stock de {selectedCount} productos seleccionados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock-status">Nuevo Estado</Label>
                <Select value={stockStatus} onValueChange={(value: "instock" | "outofstock" | "onbackorder") => setStockStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instock">En Stock</SelectItem>
                    <SelectItem value="outofstock">Agotado</SelectItem>
                    <SelectItem value="onbackorder">Bajo Pedido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleBulkStatusUpdate} disabled={loading}>
                {loading ? "Actualizando..." : "Cambiar Estado"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" onClick={onClearSelection}>
          Limpiar Selección
        </Button>
      </div>
    </div>
  );
} 
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, Edit2, Save, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type InventoryProduct } from "@/lib/api";

interface InventoryTableProps {
  products: InventoryProduct[];
  loading: boolean;
  onUpdateProduct: (productId: number, data: Partial<InventoryProduct>) => Promise<void>;
  onBulkUpdate: (products: Array<{ id: number; [key: string]: any }>, updateType: string) => Promise<void>;
  selectedProducts: number[];
  onSelectProduct: (productId: number) => void;
  onSelectAll: (selected: boolean) => void;
}

interface EditingProduct {
  id: number;
  stock_quantity: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
}

export function InventoryTable({
  products,
  loading,
  onUpdateProduct,
  onBulkUpdate,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
}: InventoryTableProps) {
  const [editingProducts, setEditingProducts] = React.useState<Map<number, EditingProduct>>(new Map());
  const [savingProducts, setSavingProducts] = React.useState<Set<number>>(new Set());

  const startEditing = (product: InventoryProduct) => {
    setEditingProducts(prev => new Map(prev).set(product.id, {
      id: product.id,
      stock_quantity: product.stock_quantity?.toString() || '0',
      regular_price: product.regular_price || '0',
      sale_price: product.sale_price || '',
      stock_status: product.stock_status,
    }));
  };

  const cancelEditing = (productId: number) => {
    setEditingProducts(prev => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
  };

  const saveProduct = async (productId: number) => {
    const editingData = editingProducts.get(productId);
    if (!editingData) return;

    setSavingProducts(prev => new Set(prev).add(productId));

    try {
      const updateData: Partial<InventoryProduct> = {
        stock_quantity: parseInt(editingData.stock_quantity) || 0,
        regular_price: editingData.regular_price,
        sale_price: editingData.sale_price,
        stock_status: editingData.stock_status as 'instock' | 'outofstock' | 'onbackorder',
      };

      await onUpdateProduct(productId, updateData);
      cancelEditing(productId);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSavingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const updateEditingField = (productId: number, field: keyof EditingProduct, value: string) => {
    setEditingProducts(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(productId);
      if (current) {
        newMap.set(productId, { ...current, [field]: value });
      }
      return newMap;
    });
  };

  const getStockStatusBadge = (status: string, quantity: number | null) => {
    if (status === 'outofstock') {
      return <Badge variant="destructive">Agotado</Badge>;
    }
    if (status === 'onbackorder') {
      return <Badge variant="secondary">Bajo Pedido</Badge>;
    }
    if (quantity !== null && quantity <= 5) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Stock Bajo</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">En Stock</Badge>;
  };

  const isAllSelected = products.length > 0 && selectedProducts.length === products.length;
  const isIndeterminate = selectedProducts.length > 0 && selectedProducts.length < products.length;

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                ref={(el: HTMLButtonElement | null) => {
                  if (el) (el as any).indeterminate = isIndeterminate;
                }}
              />
            </TableHead>
            <TableHead className="w-[80px]">Imagen</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="w-[120px]">Stock</TableHead>
            <TableHead className="w-[120px]">Precio Regular</TableHead>
            <TableHead className="w-[120px]">Precio Oferta</TableHead>
            <TableHead className="w-[120px]">Estado</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isEditing = editingProducts.has(product.id);
            const isSaving = savingProducts.has(product.id);
            const editingData = editingProducts.get(product.id);
            const isSelected = selectedProducts.includes(product.id);

            return (
              <TableRow key={product.id} className={cn(isSelected && "bg-muted/50")}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectProduct(product.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0].src}
                        alt={product.images[0].alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.categories.map(cat => cat.name).join(', ')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{product.sku || 'N/A'}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editingData?.stock_quantity || '0'}
                      onChange={(e) => updateEditingField(product.id, 'stock_quantity', e.target.value)}
                      className="w-20"
                      min="0"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{product.stock_quantity ?? 'N/A'}</span>
                      {product.stock_quantity !== null && product.stock_quantity <= 5 && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editingData?.regular_price || '0'}
                      onChange={(e) => updateEditingField(product.id, 'regular_price', e.target.value)}
                      className="w-24"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <span>${product.regular_price || '0'}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editingData?.sale_price || ''}
                      onChange={(e) => updateEditingField(product.id, 'sale_price', e.target.value)}
                      className="w-24"
                      min="0"
                      step="0.01"
                      placeholder="Sin oferta"
                    />
                  ) : (
                    <span>{product.sale_price ? `$${product.sale_price}` : 'Sin oferta'}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={editingData?.stock_status || product.stock_status}
                      onValueChange={(value) => updateEditingField(product.id, 'stock_status', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instock">En Stock</SelectItem>
                        <SelectItem value="outofstock">Agotado</SelectItem>
                        <SelectItem value="onbackorder">Bajo Pedido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getStockStatusBadge(product.stock_status, product.stock_quantity)
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveProduct(product.id)}
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelEditing(product.id)}
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(product)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {products.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
} 
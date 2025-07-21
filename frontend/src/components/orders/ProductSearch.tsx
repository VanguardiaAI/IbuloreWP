"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Plus, Minus, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { productsApi } from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

// Tipos basados en WooCommerce
interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  manage_stock: boolean;
  in_stock: boolean;
  image?: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  categories: string[];
}

interface OrderLineItem {
  product_id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
}

interface ProductSearchProps {
  selectedProducts: OrderLineItem[];
  onProductsChange: (products: OrderLineItem[]) => void;
}

// Datos de ejemplo - productos de santería
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Collar de Yemayá - Azul y Blanco",
    sku: "COL-YEM-001",
    price: 45.00,
    stock_quantity: 12,
    manage_stock: true,
    in_stock: true,
    image: "/api/placeholder/80/80",
    type: 'simple',
    categories: ['Collares', 'Yemayá']
  },
  {
    id: 2,
    name: "Vela de Changó - Roja",
    sku: "VEL-CHG-002",
    price: 12.50,
    stock_quantity: 25,
    manage_stock: true,
    in_stock: true,
    image: "/api/placeholder/80/80",
    type: 'simple',
    categories: ['Velas', 'Changó']
  },
  {
    id: 3,
    name: "Caracolas Naturales - Set de 7",
    sku: "CAR-NAT-003",
    price: 28.00,
    stock_quantity: 8,
    manage_stock: true,
    in_stock: true,
    image: "/api/placeholder/80/80",
    type: 'simple',
    categories: ['Caracolas', 'Rituales']
  },
  {
    id: 4,
    name: "Sopera de Obatalá - Blanca",
    sku: "SOP-OBA-004",
    price: 120.00,
    stock_quantity: 3,
    manage_stock: true,
    in_stock: true,
    image: "/api/placeholder/80/80",
    type: 'simple',
    categories: ['Soperas', 'Obatalá']
  },
  {
    id: 5,
    name: "Pulsera de Oshún - Amarilla",
    sku: "PUL-OSH-005",
    price: 35.00,
    stock_quantity: 15,
    manage_stock: true,
    in_stock: true,
    image: "/api/placeholder/80/80",
    type: 'simple',
    categories: ['Pulseras', 'Oshún']
  },
  {
    id: 6,
    name: "Incienso de Mirra - Paquete 20 Varillas",
    sku: "INC-MIR-006",
    price: 8.50,
    stock_quantity: 0,
    manage_stock: true,
    in_stock: false,
    image: "/api/placeholder/80/80",
    type: 'simple',
    categories: ['Inciensos', 'Rituales']
  }
];

// Función para formatear precios
const formatPrice = (price: number | string, productData?: any): string => {
  return formatCurrency(price, DEFAULT_CURRENCY);
};

export function ProductSearch({ selectedProducts, onProductsChange }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Búsqueda real de productos
  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await productsApi.searchProducts(term, {
        limit: 10,
        in_stock: true
      });
      
      // Transform API response to match our Product interface
      const transformedProducts: Product[] = response.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock_quantity: product.stock_quantity,
        manage_stock: product.manage_stock,
        in_stock: product.in_stock,
        image: product.image,
        type: product.type as 'simple' | 'variable' | 'grouped' | 'external',
        categories: product.categories || []
      }));
      
      setSearchResults(transformedProducts);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Error al buscar productos");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    searchProducts(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchProducts]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addProduct = (product: Product) => {
    const existingIndex = selectedProducts.findIndex(p => p.product_id === product.id);
    
    if (existingIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].price * updated[existingIndex].quantity;
      onProductsChange(updated);
    } else {
      // Añadir nuevo producto
      const newProduct: OrderLineItem = {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        total: product.price,
        image: product.image
      };
      onProductsChange([...selectedProducts, newProduct]);
    }
    
    setSearchTerm("");
    setShowResults(false);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }
    
    const updated = selectedProducts.map(product => 
      product.product_id === productId 
        ? { ...product, quantity: newQuantity, total: product.price * newQuantity }
        : product
    );
    onProductsChange(updated);
  };

  const removeProduct = (productId: number) => {
    const updated = selectedProducts.filter(product => product.product_id !== productId);
    onProductsChange(updated);
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((sum, product) => sum + product.total, 0);
  };

  return (
    <div className="space-y-6">
      {/* Buscador de productos */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos por nombre, SKU o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowResults(searchResults.length > 0)}
            className="pl-10"
          />
        </div>

        {/* Resultados de búsqueda */}
        {showResults && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                Buscando productos...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => addProduct(product)}
                  >
                    <div className="flex items-center space-x-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {product.categories.map((category) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(product.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.in_stock ? `Stock: ${product.stock_quantity}` : 'Sin stock'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No se encontraron productos
              </div>
            )}
          </div>
        )}
      </div>

      {/* Productos seleccionados */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Productos Seleccionados</h3>
            <div className="space-y-4">
              {selectedProducts.map((product) => (
                <div key={product.product_id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-sm font-medium">
                      {formatPrice(product.price)} c/u
                    </p>
                  </div>
                  
                  {/* Controles de cantidad */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(product.product_id, product.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{product.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(product.product_id, product.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Total del producto */}
                  <div className="text-right min-w-[100px]">
                    <p className="font-semibold">
                      {formatPrice(product.total)}
                    </p>
                  </div>
                  
                  {/* Botón eliminar */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeProduct(product.product_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {/* Subtotal */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="text-lg font-bold">
                    {formatPrice(calculateSubtotal())}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
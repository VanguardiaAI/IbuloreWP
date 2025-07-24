"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ImageIcon, RefreshCw, Search, Trash2, AlertCircle } from "lucide-react";
import { productsApi } from "@/lib/api";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// El tipo Product ahora coincide con la estructura de la API de WooCommerce
export type Product = {
  id: number;
  images: { src: string }[];
  name: string;
  sku: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder";
  price: string;
  categories: { name: string }[];
  status: "publish" | "draft" | "pending";
};

export function ProductsTable() {
    const router = useRouter();
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [deletingProducts, setDeletingProducts] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Función para cargar productos
    const fetchProducts = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const products = await productsApi.getProducts({
                per_page: 50,
                orderby: 'date',
                order: 'desc'
            });
            setProducts(products);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            setError(error instanceof Error ? error.message : "Error desconocido al cargar productos");
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para manejar la edición de productos
    const handleEditProduct = (productId: number) => {
        router.push(`/dashboard/products/${productId}/edit`);
    };

    // Función para manejar la eliminación de productos
    const handleDeleteProduct = async (productId: number) => {
        if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
            try {
                await productsApi.deleteProduct(productId);
                // Actualizar la lista de productos eliminando el producto localmente
                setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
                toast({
                    title: "Producto eliminado",
                    description: "El producto se ha eliminado exitosamente.",
                });
            } catch (error) {
                console.error("Error:", error);
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                toast({
                    title: "Error al eliminar",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        }
    };

    // Función para manejar la eliminación en lote
    const handleBulkDelete = async () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const selectedIds = selectedRows.map(row => row.original.id);
        
        if (selectedIds.length === 0) {
            toast({
                title: "Sin selección",
                description: "Por favor selecciona al menos un producto",
                variant: "destructive",
            });
            return;
        }
        
        setShowDeleteDialog(true);
    };

    // Función para confirmar la eliminación en lote
    const confirmBulkDelete = async () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const selectedIds = selectedRows.map(row => row.original.id);
        
        setDeletingProducts(true);
        setShowDeleteDialog(false);
        
        try {
            // Usar el endpoint de eliminación en lote
            const result = await productsApi.bulkDeleteProducts(selectedIds);
            
            // Actualizar la lista de productos eliminando solo los que se eliminaron exitosamente
            if (result.deleted.length > 0) {
                setProducts(prevProducts => 
                    prevProducts.filter(product => !result.deleted.includes(product.id))
                );
            }
            
            // Limpiar selección
            setRowSelection({});
            
            // Mostrar resultado detallado
            if (result.total_failed > 0) {
                toast({
                    title: "Eliminación parcial",
                    description: `${result.total_deleted} producto(s) eliminado(s). ${result.total_failed} producto(s) no pudieron ser eliminados.`,
                    variant: "destructive",
                });
                console.error("Productos con errores:", result.failed);
            } else {
                toast({
                    title: "Productos eliminados",
                    description: `${result.total_deleted} producto(s) eliminado(s) exitosamente.`,
                });
            }
        } catch (error) {
            console.error("Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast({
                title: "Error al eliminar",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setDeletingProducts(false);
        }
    };

    // Crear las columnas con las funciones de manejo
    const columns: ColumnDef<Product>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Seleccionar todo"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Seleccionar fila"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: "image",
            header: "",
            cell: ({ row }) => (
              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                {row.original.images && row.original.images.length > 0 ? (
                  <img src={row.original.images[0].src} alt={row.original.name} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "Nombre",
            cell: ({ row }) => (
              <div>
                <div className="font-bold">{row.getValue("name")}</div>
                <div className="text-sm text-muted-foreground hidden sm:block">SKU: {row.original.sku}</div>
              </div>
            ),
        },
        {
            accessorKey: "stock_quantity",
            header: "Inventario",
            cell: ({ row }) => {
                const product = row.original;
                const manageStock = product.manage_stock;
                const stockStatus = product.stock_status;
                const stockQuantity = product.stock_quantity;

                // Si no se gestiona el stock, mostramos el estado basado en stock_status
                if (!manageStock) {
                    switch (stockStatus) {
                        case "instock":
                            return <Badge variant="secondary">En stock</Badge>;
                        case "outofstock":
                            return <Badge variant="destructive">Agotado</Badge>;
                        case "onbackorder":
                            return <Badge variant="outline">Bajo pedido</Badge>;
                        default:
                            return <Badge variant="secondary">En stock</Badge>;
                    }
                }

                // Si se gestiona el stock, mostramos la cantidad
                if (stockQuantity === null || stockQuantity === 0) {
                    return <Badge variant="destructive">Agotado (0)</Badge>;
                }

                // Mostrar cantidad con color según el nivel
                const variant = stockQuantity > 10 ? "secondary" : 
                               stockQuantity > 0 ? "outline" : "destructive";
                
                return (
                    <Badge variant={variant}>
                        {stockQuantity} en stock
                    </Badge>
                );
            }
        },
        {
            accessorKey: "price",
            header: () => <div className="text-right">Precio</div>,
            cell: ({ row }) => {
              const amount = parseFloat(row.getValue("price"));
              const formatted = formatPrice(amount);
              return <div className="text-right font-medium">{formatted}</div>;
            },
        },
        {
            accessorKey: "categories",
            header: "Categorías",
            cell: ({ row }) => (
                <div className="hidden md:flex flex-wrap gap-1">
                    {row.original.categories.map(cat => (
                        <Badge key={cat.name} variant="outline">{cat.name}</Badge>
                    ))}
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                const status = row.getValue("status");
                const statusText = {
                    publish: "Publicado",
                    draft: "Borrador",
                    pending: "Pendiente"
                }[status as string] || "Desconocido";
                return <div>{statusText}</div>;
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
              const product = row.original;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edición rápida</DropdownMenuItem>
                    <DropdownMenuItem>Ver producto</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        className="text-red-600" 
                        onClick={() => handleDeleteProduct(product.id)}
                    >
                        Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
        },
    ];
  
    // Cargar productos al montar el componente
    React.useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const table = useReactTable({
      data: products,
      columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onRowSelectionChange: setRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        sorting,
        columnFilters,
        rowSelection,
      },
    });

    if (loading) {
        return <div className="flex items-center justify-center p-8">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Cargando productos...</p>
            </div>
        </div>;
    }

    if (error) {
        return <div className="flex items-center justify-center p-8">
            <div className="text-center">
                <p className="text-red-600 mb-2">Error al cargar productos:</p>
                <p className="text-sm text-gray-600">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Reintentar
                </button>
            </div>
        </div>;
    }
  
    return (
        <div className="w-full">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="w-full sm:max-w-sm"
            />
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {table.getFilteredSelectedRowModel().rows.length}
                  </span>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {table.getFilteredSelectedRowModel().rows.length === 1 ? "producto seleccionado" : "productos seleccionados"}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deletingProducts}
                  className="gap-2"
                >
                  {deletingProducts ? (
                    <>
                      <Spinner size="sm" className="text-white" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
          <div className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">{table.getFilteredSelectedRowModel().rows.length} de{" "}</span>
            {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>

        {/* Dialog de confirmación */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                ¿Eliminar productos seleccionados?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de eliminar {table.getFilteredSelectedRowModel().rows.length} producto(s).
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar productos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Overlay de carga durante la eliminación */}
        {deletingProducts && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg border">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Eliminando productos...</p>
            </div>
          </div>
        )}
      </div>
    );
  } 

// Función para formatear precios
const formatPrice = (price: number | string): string => {
  return formatCurrency(price, DEFAULT_CURRENCY);
}; 
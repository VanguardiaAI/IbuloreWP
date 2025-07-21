"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ChevronDown, File, Eye, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { toast } from "sonner";
import { formatWooCommercePrice, DEFAULT_CURRENCY } from "@/lib/currency";
import { CurrencyIndicator } from "@/components/ui/CurrencyIndicator";

export type Order = {
  id: number;
  number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  customer_id: number;
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "secondary";
    case "processing":
      return "default";
    case "on-hold":
      return "outline";
    case "completed":
      return "default";
    case "cancelled":
      return "destructive";
    case "refunded":
      return "destructive";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    processing: "Procesando",
    "on-hold": "En espera",
    completed: "Completado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    failed: "Fallido",
  };
  return statusLabels[status] || status;
};

const formatPrice = (amount: number | string, orderData?: any) => {
  return formatWooCommercePrice(amount, orderData);
};

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "number",
    header: "Número",
    cell: ({ row }) => <div className="font-medium">#{row.getValue("number")}</div>,
  },
  {
    accessorKey: "customer_name",
    header: "Cliente",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("customer_name") || "Invitado"}</div>
        <div className="text-sm text-muted-foreground">{row.original.customer_email}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={getStatusBadgeVariant(row.getValue("status"))}>
        {getStatusLabel(row.getValue("status"))}
      </Badge>
    ),
  },
  {
    accessorKey: "date_created",
    header: "Fecha",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date_created"));
      return <div>{date.toLocaleDateString("es-ES")}</div>;
    },
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"));
      const formatted = formatPrice(amount, row.original);

      return (
        <div className="text-right">
          <div className="font-medium">{formatted}</div>
          <CurrencyIndicator 
            data={row.original} 
            variant="secondary" 
            size="sm" 
            className="mt-1 justify-end"
          />
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;
      const router = useRouter();
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/orders/${order.id}/edit`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Editar pedido
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/orders/${order.id}`)}
            >
              Ver detalles del pedido
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.number)}
            >
              Copiar número del pedido
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {order.customer_id > 0 && (
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/customers/${order.customer_id}`)}
              >
                Ver cliente
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function OrdersTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const router = useRouter();

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getOrders({
        page: pagination.page,
        per_page: pagination.per_page,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });

      // Transform orders data to match our table format (exclude checkout-draft)
      const transformedOrders: Order[] = response.orders
        .filter((order: any) => order.status !== 'checkout-draft') // Excluir carritos abandonados
        .map((order: any) => ({
          id: order.id,
          number: order.number,
          customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
          customer_email: order.billing?.email || '',
          status: order.status,
          date_created: order.date_created,
          total: order.total,
          currency: order.currency,
          customer_id: order.customer_id || 0,
        }));

      setOrders(transformedOrders);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        total_pages: response.pagination.total_pages,
      }));
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar los pedidos");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.per_page, searchTerm, statusFilter]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = React.useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchTerm(value);
          setPagination(prev => ({ ...prev, page: 1 }));
        }, 500);
      };
    },
    []
  );

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    pageCount: pagination.total_pages,
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Buscar pedidos..."
          onChange={(event) => handleSearch(event.target.value)}
          className="max-w-sm"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="processing">Procesando</option>
          <option value="on-hold">En espera</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
          <option value="refunded">Reembolsado</option>
          <option value="failed">Fallido</option>
          {/* checkout-draft excluido intencionalmente (carritos abandonados) */}
        </select>

        <Button
          variant="outline"
          onClick={fetchOrders}
          disabled={loading}
          size="sm"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline">
          <File className="mr-2 h-4 w-4" />
          Exportar
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando pedidos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/orders/${row.original.id}/edit`)}
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
                  No se encontraron pedidos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Mostrando {orders.length} de {pagination.total} pedido(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page <= 1 || loading}
          >
            Anterior
          </Button>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.total_pages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.total_pages, prev.page + 1) }))}
            disabled={pagination.page >= pagination.total_pages || loading}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
} 
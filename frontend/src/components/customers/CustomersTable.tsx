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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Loader2, Filter, ChevronDown, Search } from "lucide-react";
import { customersApi } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { getCountryName, formatCountryDisplay } from "@/lib/countries";
import { CustomerMetrics } from "./CustomerMetrics";

export type Customer = {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  avatar_url?: string;
  orders_count?: number;
  total_spent?: string | number;
  last_order_date?: string;
  date_created?: string;
  date_modified?: string;
  is_paying_customer?: boolean;
  role?: string;
  // WooCommerce fields
  billing?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
};

const getInitials = (customer: Customer) => {
    // Prioridad: first_name/last_name -> billing -> username -> email
    const firstName = customer.first_name || customer.billing?.first_name || '';
    const lastName = customer.last_name || customer.billing?.last_name || '';
    
    if (firstName || lastName) {
        let initials = firstName.substring(0, 1).toUpperCase();
        if (lastName) {
            initials += lastName.substring(0, 1).toUpperCase();
        }
        return initials;
    }
    
    // Si no hay nombres, usar username o email
    if (customer.username) {
        return customer.username.substring(0, 2).toUpperCase();
    }
    
    if (customer.email) {
        return customer.email.substring(0, 2).toUpperCase();
    }
    
    return '?';
};

const getCustomerName = (customer: Customer) => {
    // Prioridad: first_name/last_name -> billing -> username -> email
    const firstName = customer.first_name || customer.billing?.first_name || '';
    const lastName = customer.last_name || customer.billing?.last_name || '';
    
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
        return fullName;
    }
    
    // Si no hay nombres, usar username
    if (customer.username) {
        return customer.username;
    }
    
    // Como último recurso, usar la parte local del email
    if (customer.email) {
        return customer.email.split('@')[0];
    }
    
    return 'Cliente sin nombre';
};

const getCustomerUsername = (customer: Customer) => {
    if (customer.role === 'guest') {
        return '—'; // Guión para clientes invitados
    }
    return customer.username || customer.email?.split('@')[0] || '—';
};



const formatLastActivity = (dateString?: string) => {
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Hace 1 día';
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
    } else {
        return date.toLocaleDateString('es-ES');
    }
};

const calculateAverageOrderValue = (totalSpent: string | number, ordersCount: number) => {
    const total = typeof totalSpent === 'string' ? parseFloat(totalSpent) : totalSpent;
    if (!total || !ordersCount || ordersCount === 0) return 0;
    return total / ordersCount;
};

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const customer = row.original;
      const name = getCustomerName(customer);
      const isGuest = customer.role === 'guest';
      
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
              <AvatarImage src={customer.avatar_url} alt={name} />
              <AvatarFallback className="text-xs">{getInitials(customer)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
              <div className="font-medium text-sm truncate">{name}</div>
              {isGuest && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Cliente no registrado
                </Badge>
              )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: "Nombre de usuario",
    cell: ({ row }) => {
      const customer = row.original;
      const username = getCustomerUsername(customer);
      
      return (
        <div className="text-sm text-muted-foreground">
          {username}
        </div>
      );
    },
  },
  {
    accessorKey: "last_activity",
    header: "Última actividad",
    cell: ({ row }) => {
      const customer = row.original;
      // Usar date_modified o last_order_date como última actividad
      const lastActivity = customer.date_modified || customer.last_order_date;
      
      return (
        <div className="text-sm">
          {formatLastActivity(lastActivity)}
        </div>
      );
    },
  },
  {
    accessorKey: "date_created",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const date = row.getValue("date_created") as string;
      if (!date) return <div className="text-muted-foreground text-sm">—</div>;
      
      const formatted = new Date(date).toLocaleDateString('es-ES');
      return <div className="text-sm">{formatted}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Correo electrónico",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="text-sm text-blue-600 hover:text-blue-800">
          <a href={`mailto:${customer.email}`} className="hover:underline">
            {customer.email}
          </a>
        </div>
      );
    },
  },
  {
    accessorKey: "orders_count",
    header: "Pedidos",
    cell: ({ row }) => {
      const count = row.getValue("orders_count") as number || 0;
      return <div className="text-center text-sm font-medium">{count}</div>;
    },
  },
  {
    accessorKey: "total_spent",
    header: "Gasto total",
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total_spent") as string) || 0;
        const formatted = formatPrice(amount);
  
        return <div className="font-medium text-sm">{formatted}</div>;
    },
  },
  {
    accessorKey: "average_order_value",
    header: "VMP",
    cell: ({ row }) => {
      const customer = row.original;
      const totalSpent = parseFloat(customer.total_spent as string) || 0;
      const ordersCount = customer.orders_count || 0;
      const averageValue = calculateAverageOrderValue(totalSpent, ordersCount);
      const formatted = formatPrice(averageValue);

      return <div className="font-medium text-sm">{formatted}</div>;
    },
  },
  {
    accessorKey: "country",
    header: "País / Región",
    cell: ({ row }) => {
      const customer = row.original;
      const country = customer.billing?.country || customer.shipping?.country;
      const countryDisplay = formatCountryDisplay(country);
      
      return (
        <div className="text-sm">
          {countryDisplay}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
      const router = useRouter();
      const isGuest = customer.role === 'guest';
      
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
            {!isGuest && (
              <>
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                >
                  Ver detalles del cliente
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/customers/${customer.id}/orders`)}
                >
                  Ver pedidos del cliente
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/orders/new?customer=${customer.id}`)}
            >
              Crear nuevo pedido
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(customer.id.toString())}
            >
              Copiar ID del cliente
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(customer.email)}
            >
              Copiar email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Función para formatear precios
const formatPrice = (amount: number): string => {
  return formatCurrency(amount, DEFAULT_CURRENCY);
};

export function CustomersTable() {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [data, setData] = React.useState<Customer[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [customerTypeFilter, setCustomerTypeFilter] = React.useState<string>("all");
    const [countryFilter, setCountryFilter] = React.useState<string>("all");
    const [pagination, setPagination] = React.useState({
      page: 1,
      per_page: 10,
      total: 0,
      total_pages: 0,
    });
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Load customers
    const loadCustomers = React.useCallback(async (search?: string, page = 1) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await customersApi.getCustomers({
          page,
          per_page: pagination.per_page,
          search: search || undefined,
        });
        
        setData(response.customers);
        setPagination(response.pagination);
      } catch (err) {
        console.error('Error loading customers:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      } finally {
        setLoading(false);
      }
    }, [pagination.per_page]);

    // Initial load
    React.useEffect(() => {
      loadCustomers();
    }, []);

    // Search effect
    React.useEffect(() => {
      if (debouncedSearchTerm !== undefined) {
        loadCustomers(debouncedSearchTerm, 1);
      }
    }, [debouncedSearchTerm, loadCustomers]);

    // Filter data based on customer type and country
    const filteredData = React.useMemo(() => {
      let filtered = data;
      
      // Filtrar por tipo de cliente
      if (customerTypeFilter === "registered") {
        filtered = filtered.filter(customer => customer.role !== 'guest');
      } else if (customerTypeFilter === "guest") {
        filtered = filtered.filter(customer => customer.role === 'guest');
      }
      
      // Filtrar por país
      if (countryFilter !== "all") {
        filtered = filtered.filter(customer => {
          const country = customer.billing?.country || customer.shipping?.country;
          return country === countryFilter;
        });
      }
      
      return filtered;
    }, [data, customerTypeFilter, countryFilter]);

    // Get unique countries for filter
    const availableCountries = React.useMemo(() => {
      const countries = new Set<string>();
      data.forEach(customer => {
        const country = customer.billing?.country || customer.shipping?.country;
        if (country) {
          countries.add(country);
        }
      });
      return Array.from(countries).sort();
    }, [data]);

    const table = useReactTable({
      data: filteredData,
      columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      manualPagination: true, // Using server-side pagination
      state: {
        sorting,
        columnFilters,
      },
    });

    const handlePreviousPage = () => {
      if (pagination.page > 1) {
        loadCustomers(debouncedSearchTerm, pagination.page - 1);
      }
    };

    const handleNextPage = () => {
      if (pagination.page < pagination.total_pages) {
        loadCustomers(debouncedSearchTerm, pagination.page + 1);
      }
    };

    // Calcular estadísticas
    const stats = React.useMemo(() => {
      const totalCustomers = filteredData.length;
      const registeredCustomers = filteredData.filter(c => c.role !== 'guest').length;
      const guestCustomers = filteredData.filter(c => c.role === 'guest').length;
      const totalOrders = filteredData.reduce((sum, c) => sum + (c.orders_count || 0), 0);
      const totalSpent = filteredData.reduce((sum, c) => sum + parseFloat(c.total_spent as string || '0'), 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      return {
        total: totalCustomers,
        registered: registeredCustomers,
        guest: guestCustomers,
        totalOrders,
        totalSpent,
        averageOrderValue
      };
    }, [filteredData]);

    // Clear all filters
    const clearFilters = () => {
      setCustomerTypeFilter("all");
      setCountryFilter("all");
      setSearchTerm("");
    };

    // Check if any filters are active
    const hasActiveFilters = customerTypeFilter !== "all" || countryFilter !== "all" || searchTerm !== "";

    if (error) {
      return (
        <div className="w-full">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error al cargar clientes</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadCustomers()} variant="outline">
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </div>
      );
    }
  
    return (
      <div className="w-full space-y-4">
        {/* Estadísticas rápidas */}
        <CustomerMetrics stats={stats} hasActiveFilters={hasActiveFilters} />

        {/* Filtros y búsqueda */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
            
            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                <SelectItem value="registered">Solo registrados</SelectItem>
                <SelectItem value="guest">Solo invitados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los países</SelectItem>
                {availableCountries.map(country => (
                  <SelectItem key={country} value={country}>
                    {getCountryName(country)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="whitespace-nowrap"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
          
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          )}
        </div>

        {/* Indicador de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <span>Filtros activos:</span>
            {customerTypeFilter !== "all" && (
              <Badge variant="secondary">
                Tipo: {customerTypeFilter === "registered" ? "Registrados" : "Invitados"}
              </Badge>
            )}
            {countryFilter !== "all" && (
              <Badge variant="secondary">
                País: {getCountryName(countryFilter)}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary">
                Búsqueda: "{searchTerm}"
              </Badge>
            )}
          </div>
        )}

        {/* Tabla */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="font-semibold text-gray-900">
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cargando clientes...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
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
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No se encontraron clientes.</p>
                      {hasActiveFilters && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Prueba ajustando los filtros o{" "}
                          <button 
                            onClick={clearFilters}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            limpia todos los filtros
                          </button>
                          .
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación y resumen */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {!loading && (
              <>
                Mostrando {filteredData.length} de {pagination.total} cliente{pagination.total !== 1 ? 's' : ''} 
                {hasActiveFilters && (
                  <span className="ml-1">(filtrados)</span>
                )}
                <br />
                Página {pagination.page} de {pagination.total_pages}
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={loading || pagination.page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={loading || pagination.page >= pagination.total_pages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    );
  } 
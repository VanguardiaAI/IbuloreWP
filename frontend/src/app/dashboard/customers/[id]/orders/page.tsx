"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Search, Eye, Plus, User } from "lucide-react";
import { customersApi } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

interface Customer {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  avatar_url?: string;
  orders_count?: number;
  total_spent?: string | number;
}

interface Order {
  id: number;
  number: string;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  total: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const getCustomerName = (customer: Customer) => {
  const firstName = customer.first_name || '';
  const lastName = customer.last_name || '';
  
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }
  
  if (customer.username) {
    return customer.username;
  }
  
  if (customer.email) {
    return customer.email.split('@')[0];
  }
  
  return 'Cliente sin nombre';
};

const getInitials = (customer: Customer) => {
  const firstName = customer.first_name || '';
  const lastName = customer.last_name || '';
  
  if (firstName || lastName) {
    let initials = firstName.substring(0, 1).toUpperCase();
    if (lastName) {
      initials += lastName.substring(0, 1).toUpperCase();
    }
    return initials;
  }
  
  if (customer.username) {
    return customer.username.substring(0, 2).toUpperCase();
  }
  
  if (customer.email) {
    return customer.email.substring(0, 2).toUpperCase();
  }
  
  return '?';
};

const getStatusColor = (status: string) => {
  const colors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'processing': 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-orange-100 text-orange-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'refunded': 'bg-purple-100 text-purple-800',
    'failed': 'bg-red-100 text-red-800',
  };
  
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status: string) => {
  const texts = {
    'pending': 'Pendiente',
    'processing': 'Procesando',
    'on-hold': 'En Espera',
    'completed': 'Completado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'failed': 'Fallido',
  };
  
  return texts[status as keyof typeof texts] || status;
};

export default function CustomerOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cargar información del cliente
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        const customerData = await customersApi.getCustomer(customerId);
        setCustomer(customerData);
      } catch (err) {
        console.error('Error loading customer:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar cliente');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  // Cargar pedidos del cliente
  const loadOrders = async (search?: string, page = 1) => {
    try {
      setOrdersLoading(true);
      const response = await customersApi.getCustomerOrders(customerId, {
        page,
        per_page: pagination.per_page,
        status: search || undefined,
      });
      
      setOrders(response.orders);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Cargar pedidos inicialmente
  useEffect(() => {
    if (customerId && !loading) {
      loadOrders();
    }
  }, [customerId, loading]);

  // Efecto de búsqueda
  useEffect(() => {
    if (debouncedSearchTerm !== undefined && !loading) {
      loadOrders(debouncedSearchTerm, 1);
    }
  }, [debouncedSearchTerm, loading]);

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      loadOrders(debouncedSearchTerm, pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.total_pages) {
      loadOrders(debouncedSearchTerm, pagination.page + 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando información del cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Cliente no encontrado'}</p>
            <Button onClick={() => router.back()} variant="outline">
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pedidos del Cliente</h1>
            <p className="text-muted-foreground">
              {getCustomerName(customer)} • {customer.orders_count || 0} pedidos
            </p>
          </div>
        </div>
        <Button 
          onClick={() => router.push(`/dashboard/orders/new?customer=${customer.id}`)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Información del Cliente */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={customer.avatar_url} alt={getCustomerName(customer)} />
              <AvatarFallback>{getInitials(customer)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{getCustomerName(customer)}</h3>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Gastado</p>
              <p className="font-semibold">
                {new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                }).format(parseFloat(customer.total_spent as string) || 0)}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
            >
              <User className="h-4 w-4 mr-2" />
              Ver Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pedidos ({pagination.total})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                        Cargando pedidos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{order.number}</div>
                          <div className="text-sm text-muted-foreground">ID: {order.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.date_created).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {order.line_items.slice(0, 2).map((item, index) => (
                            <div key={item.id} className="text-sm">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                          {order.line_items.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{order.line_items.length - 2} más
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        }).format(parseFloat(order.total))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">
                          Este cliente no tiene pedidos aún
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/orders/new?customer=${customer.id}`)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Primer Pedido
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {orders.length > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.total_pages} ({pagination.total} pedidos)
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={ordersLoading || pagination.page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={ordersLoading || pagination.page >= pagination.total_pages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
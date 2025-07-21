"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, ShoppingBag, User, Edit } from "lucide-react";
import { customersApi } from "@/lib/api";

interface Customer {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  avatar_url?: string;
  orders_count?: number;
  total_spent?: string | number;
  date_created?: string;
  date_modified?: string;
  is_paying_customer?: boolean;
  role?: string;
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
}

const getCustomerName = (customer: Customer) => {
  const firstName = customer.first_name || customer.billing?.first_name || '';
  const lastName = customer.last_name || customer.billing?.last_name || '';
  
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
  const firstName = customer.first_name || customer.billing?.first_name || '';
  const lastName = customer.last_name || customer.billing?.last_name || '';
  
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

const formatAddress = (address: any) => {
  if (!address) return 'No especificada';
  
  const parts = [
    address.address_1,
    address.address_2,
    address.city,
    address.state,
    address.postcode,
    address.country
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'No especificada';
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Cargando detalles del cliente...</p>
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

  const roleColors = {
    'administrator': 'bg-red-100 text-red-800',
    'shop_manager': 'bg-blue-100 text-blue-800',
    'customer': 'bg-green-100 text-green-800',
    'subscriber': 'bg-gray-100 text-gray-800',
  };

  const roleColor = roleColors[customer.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';

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
            <h1 className="text-2xl font-bold">Detalles del Cliente</h1>
            <p className="text-muted-foreground">ID: {customer.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            onClick={() => router.push(`/dashboard/customers/${customer.id}/orders`)}
            size="sm"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Ver Pedidos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Perfil del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={customer.avatar_url} alt={getCustomerName(customer)} />
                  <AvatarFallback className="text-lg">{getInitials(customer)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold">{getCustomerName(customer)}</h3>
                    {customer.username && (
                      <p className="text-sm text-muted-foreground">@{customer.username}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                  {customer.billing?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.billing.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Registrado: {customer.date_created ? new Date(customer.date_created).toLocaleDateString('es-ES') : 'No disponible'}
                    </span>
                  </div>
                  <Badge className={roleColor}>
                    {customer.role || 'Sin rol'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direcciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Direcciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dirección de Facturación */}
                <div>
                  <h4 className="font-medium mb-3">Dirección de Facturación</h4>
                  <div className="space-y-2 text-sm">
                    {customer.billing?.company && (
                      <p className="font-medium">{customer.billing.company}</p>
                    )}
                    <p>{formatAddress(customer.billing)}</p>
                    {customer.billing?.email && customer.billing.email !== customer.email && (
                      <p className="text-muted-foreground">Email: {customer.billing.email}</p>
                    )}
                    {customer.billing?.phone && (
                      <p className="text-muted-foreground">Teléfono: {customer.billing.phone}</p>
                    )}
                  </div>
                </div>

                {/* Dirección de Envío */}
                <div>
                  <h4 className="font-medium mb-3">Dirección de Envío</h4>
                  <div className="space-y-2 text-sm">
                    {customer.shipping?.company && (
                      <p className="font-medium">{customer.shipping.company}</p>
                    )}
                    <p>{formatAddress(customer.shipping)}</p>
                    {customer.shipping?.phone && (
                      <p className="text-muted-foreground">Teléfono: {customer.shipping.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="space-y-6">
          {/* Resumen de Compras */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Compras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Pedidos</span>
                <span className="font-semibold">{customer.orders_count || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Gastado</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  }).format(parseFloat(customer.total_spent as string) || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cliente Activo</span>
                <Badge variant={customer.is_paying_customer ? "default" : "secondary"}>
                  {customer.is_paying_customer ? "Sí" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/customers/${customer.id}/orders`)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ver Todos los Pedidos
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/orders/new?customer=${customer.id}`)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Crear Nuevo Pedido
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigator.clipboard.writeText(customer.email)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Copiar Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
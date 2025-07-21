"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Package, CreditCard, Truck, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import { toast } from "sonner";
import { formatWooCommercePrice, detectCurrencyFromWooCommerce } from "@/lib/currency";

// Tipos basados en la estructura de WooCommerce
interface OrderItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

interface OrderData {
  id: string;
  status: "pending" | "processing" | "on-hold" | "completed" | "cancelled" | "refunded" | "failed";
  date_created: string;
  date_modified: string;
  date_paid?: string;
  customer_id: number;
  customer_note?: string;
  billing: Address;
  shipping: Address;
  payment_method: string;
  payment_method_title: string;
  transaction_id?: string;
  line_items: OrderItem[];
  shipping_total: number;
  total_tax: number;
  total: number;
  currency: string;
  needs_shipping: boolean;
  needs_payment: boolean;
}

// Datos de ejemplo basados en la estructura de WooCommerce
const mockOrderData: OrderData = {
  id: "ORD001",
  status: "processing",
  date_created: "2023-11-20T10:30:00",
  date_modified: "2023-11-20T14:15:00",
  date_paid: "2023-11-20T10:35:00",
  customer_id: 123,
  customer_note: "Por favor, entregar en horario de mañana",
  billing: {
    first_name: "María",
    last_name: "González",
    company: "",
    address_1: "Calle de la Santería 15",
    address_2: "Piso 3B",
    city: "Madrid",
    state: "Madrid",
    postcode: "28001",
    country: "ES",
    email: "maria.gonzalez@email.com",
    phone: "+34 600 123 456"
  },
  shipping: {
    first_name: "María",
    last_name: "González",
    company: "",
    address_1: "Calle de la Santería 15",
    address_2: "Piso 3B",
    city: "Madrid",
    state: "Madrid",
    postcode: "28001",
    country: "ES",
    phone: "+34 600 123 456"
  },
  payment_method: "bacs",
  payment_method_title: "Transferencia bancaria",
  transaction_id: "TXN123456789",
  line_items: [
    {
      id: 1,
      name: "Collar de Yemayá",
      sku: "COL-YEM-001",
      quantity: 1,
      price: 45.00,
      total: 45.00,
      image: "/api/placeholder/100/100"
    },
    {
      id: 2,
      name: "Vela de Changó",
      sku: "VEL-CHG-002",
      quantity: 2,
      price: 12.50,
      total: 25.00,
    }
  ],
  shipping_total: 5.95,
  total_tax: 7.60,
  total: 83.55,
  currency: "EUR",
  needs_shipping: true,
  needs_payment: false
};

const getStatusColor = (status: OrderData["status"]) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    "on-hold": "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-purple-100 text-purple-800",
    failed: "bg-red-100 text-red-800"
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getStatusLabel = (status: OrderData["status"]) => {
  const labels = {
    pending: "Pendiente",
    processing: "Procesando",
    "on-hold": "En espera",
    completed: "Completado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    failed: "Fallido"
  };
  return labels[status] || status;
};

// Función para formatear precios usando los datos del pedido
const formatPrice = (amount: number | string, orderData?: any): string => {
  return formatWooCommercePrice(amount, orderData);
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await ordersApi.getOrder(params.id as string);
      
      // Transform API response to match our OrderData interface
      const transformedOrder: OrderData = {
        id: response.id.toString(),
        status: response.status,
        date_created: response.date_created,
        date_modified: response.date_modified,
        date_paid: response.date_paid,
        customer_id: response.customer_id || 0,
        customer_note: response.customer_note || '',
        billing: response.billing || {},
        shipping: response.shipping || {},
        payment_method: response.payment_method || '',
        payment_method_title: response.payment_method_title || '',
        transaction_id: response.transaction_id || '',
        line_items: response.line_items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku || '',
          quantity: item.quantity,
          price: parseFloat(item.price || '0'),
          total: parseFloat(item.total || '0'),
          image: item.image?.src || undefined
        })) || [],
        shipping_total: parseFloat(response.shipping_total || '0'),
        total_tax: parseFloat(response.total_tax || '0'),
        total: parseFloat(response.total || '0'),
        currency: response.currency || 'EUR',
        needs_shipping: response.shipping_lines?.length > 0 || false,
        needs_payment: ['pending', 'on-hold'].includes(response.status)
      };
      
      setOrder(transformedOrder);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Error al cargar el pedido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando detalles del pedido...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Pedido no encontrado</h2>
          <p className="text-muted-foreground mt-2">El pedido que buscas no existe o ha sido eliminado.</p>
          <Link href="/dashboard/orders">
            <Button className="mt-4">Volver a Pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.id}</h1>
            <p className="text-muted-foreground">
              Creado el {new Date(order.date_created).toLocaleDateString('es-ES')} a las{' '}
              {new Date(order.date_created).toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Productos del pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Productos del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.line_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      <p className="text-sm">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(item.total, order)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price, order)} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de totales */}
              <Separator className="my-6" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {formatPrice(order.line_items.reduce((sum, item) => sum + item.total, 0), order)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>
                    {formatPrice(order.shipping_total, order)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos:</span>
                  <span>
                    {formatPrice(order.total_tax, order)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>
                    {formatPrice(order.total, order)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas del pedido */}
          {order.customer_note && (
            <Card>
              <CardHeader>
                <CardTitle>Notas del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.customer_note}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">
                  {order.billing.first_name} {order.billing.last_name}
                </h4>
                {order.billing.company && (
                  <p className="text-sm text-muted-foreground">{order.billing.company}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  {order.billing.email}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2" />
                  {order.billing.phone}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dirección de facturación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Dirección de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p>{order.billing.first_name} {order.billing.last_name}</p>
                {order.billing.company && <p>{order.billing.company}</p>}
                <p>{order.billing.address_1}</p>
                {order.billing.address_2 && <p>{order.billing.address_2}</p>}
                <p>{order.billing.postcode} {order.billing.city}, {order.billing.state}</p>
                <p>{order.billing.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dirección de envío */}
          {order.needs_shipping && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>{order.shipping.first_name} {order.shipping.last_name}</p>
                  {order.shipping.company && <p>{order.shipping.company}</p>}
                  <p>{order.shipping.address_1}</p>
                  {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
                  <p>{order.shipping.postcode} {order.shipping.city}, {order.shipping.state}</p>
                  <p>{order.shipping.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Método:</span>
                <span>{order.payment_method_title}</span>
              </div>
              {order.transaction_id && (
                <div className="flex justify-between text-sm">
                  <span>ID Transacción:</span>
                  <span className="font-mono text-xs">{order.transaction_id}</span>
                </div>
              )}
              {order.date_paid && (
                <div className="flex justify-between text-sm">
                  <span>Pagado:</span>
                  <span>{new Date(order.date_paid).toLocaleDateString('es-ES')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Estado:</span>
                <span>{order.needs_payment ? "Pendiente de pago" : "Pagado"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
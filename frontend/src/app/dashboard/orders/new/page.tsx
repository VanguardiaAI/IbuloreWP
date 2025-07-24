"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductSearch } from "@/components/orders/ProductSearch";
import { CustomerSearch } from "@/components/orders/CustomerSearch";
import { PlusCircle, ShoppingCart, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import { 
  currencies, 
  formatCurrency, 
  getCurrencySymbol, 
  getTaxRate, 
  getDefaultShipping 
} from "@/lib/currencies";

// Tipos basados en WooCommerce
interface OrderLineItem {
  product_id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  username: string;
  avatar_url?: string;
  date_created: string;
  date_modified: string;
  orders_count: number;
  total_spent: number;
  billing: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

// Esquema de validación más completo
const orderSchema = z.object({
  customer_note: z.string().optional(),
  payment_method: z.string().min(1, "Debes seleccionar un método de pago."),
  shipping_total: z.number().min(0, "El coste de envío debe ser positivo."),
  currency: z.string().min(1, "Debes seleccionar una moneda."),
  // Más campos se añadirán aquí
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<OrderLineItem[]>([]);
  const router = useRouter();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_note: "",
      payment_method: "",
      shipping_total: getDefaultShipping("MXN"), // Costo de envío en pesos mexicanos
      currency: "MXN", // Moneda por defecto: Pesos mexicanos
    },
  });

  // Función para manejar el cambio de moneda
  const handleCurrencyChange = (newCurrency: string) => {
    form.setValue("currency", newCurrency);
    // Actualizar automáticamente el costo de envío por defecto para la nueva moneda
    form.setValue("shipping_total", getDefaultShipping(newCurrency));
  };

  // Función para obtener el símbolo de la moneda seleccionada
  const getCurrentCurrencySymbol = () => {
    const selectedCurrency = form.watch("currency");
    return getCurrencySymbol(selectedCurrency);
  };

  // Función para formatear moneda
  const formatCurrentCurrency = (amount: number) => {
    const selectedCurrency = form.watch("currency");
    return formatCurrency(amount, selectedCurrency);
  };

  // Función para obtener la etiqueta del impuesto
  const getTaxLabel = () => {
    const selectedCurrency = form.watch("currency");
    const taxRate = getTaxRate(selectedCurrency);
    return `IVA (${Math.round(taxRate * 100)}%)`;
  };

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, product) => sum + product.total, 0);
    const shipping = form.watch("shipping_total") || 0;
    const selectedCurrency = form.watch("currency");
    const taxRate = getTaxRate(selectedCurrency);
    const tax = subtotal * taxRate;
    const total = subtotal + shipping + tax;
    
    return { subtotal, shipping, tax, total };
  };

  const onSubmit = async (data: OrderFormValues) => {
    if (!selectedCustomer) {
      toast.error("Debes seleccionar un cliente");
      return;
    }
    
    if (selectedProducts.length === 0) {
      toast.error("Debes añadir al menos un producto");
      return;
    }

    setIsLoading(true);
    
    try {
      const { subtotal, shipping, tax, total } = calculateTotals();
      
      // Validar y preparar datos de facturación con valores por defecto
      // Asegurar que siempre tengamos valores string, nunca undefined
      const billingData = {
        first_name: String(selectedCustomer.billing?.first_name || selectedCustomer.first_name || "").trim(),
        last_name: String(selectedCustomer.billing?.last_name || selectedCustomer.last_name || "").trim(),
        company: String(selectedCustomer.billing?.company || ""),
        address_1: String(selectedCustomer.billing?.address_1 || ""),
        address_2: String(selectedCustomer.billing?.address_2 || ""),
        city: String(selectedCustomer.billing?.city || ""),
        state: String(selectedCustomer.billing?.state || ""),
        postcode: String(selectedCustomer.billing?.postcode || ""),
        country: String(selectedCustomer.billing?.country || "MX"),
        email: String(selectedCustomer.billing?.email || selectedCustomer.email || "").trim(),
        phone: String(selectedCustomer.billing?.phone || selectedCustomer.phone || "")
      };

      // Validar y preparar datos de envío con valores por defecto
      const shippingData = {
        first_name: String(selectedCustomer.shipping?.first_name || selectedCustomer.first_name || billingData.first_name || "").trim(),
        last_name: String(selectedCustomer.shipping?.last_name || selectedCustomer.last_name || billingData.last_name || "").trim(),
        company: String(selectedCustomer.shipping?.company || ""),
        address_1: String(selectedCustomer.shipping?.address_1 || selectedCustomer.billing?.address_1 || ""),
        address_2: String(selectedCustomer.shipping?.address_2 || selectedCustomer.billing?.address_2 || ""),
        city: String(selectedCustomer.shipping?.city || selectedCustomer.billing?.city || ""),
        state: String(selectedCustomer.shipping?.state || selectedCustomer.billing?.state || ""),
        postcode: String(selectedCustomer.shipping?.postcode || selectedCustomer.billing?.postcode || ""),
        country: String(selectedCustomer.shipping?.country || selectedCustomer.billing?.country || "MX")
      };

      // Validar campos requeridos con mensajes específicos
      const missingFields = [];
      if (!billingData.first_name) missingFields.push("nombre");
      if (!billingData.last_name) missingFields.push("apellido");
      if (!billingData.email) missingFields.push("email");
      
      if (missingFields.length > 0) {
        toast.error(`El cliente debe tener ${missingFields.join(", ")} para crear un pedido`);
        console.error("Missing fields:", missingFields);
        console.error("Selected customer data:", selectedCustomer);
        console.error("Billing data:", billingData);
        return;
      }

      // Preparar datos del pedido según el formato esperado por WooCommerce
      const orderData = {
        customer_id: selectedCustomer.id,
        status: "pending",
        currency: data.currency,
        // Line items - productos del pedido
        line_items: selectedProducts.map(product => ({
          product_id: product.product_id,
          quantity: product.quantity,
          // No incluir price aquí, WooCommerce lo calculará automáticamente
        })),
        // Direcciones de facturación y envío
        billing: billingData,
        shipping: shippingData,
        // Líneas de envío
        shipping_lines: shipping > 0 ? [{
          method_id: "flat_rate",
          method_title: "Envío estándar",
          total: shipping.toFixed(2)
        }] : [],
        // Método de pago
        payment_method: data.payment_method,
        payment_method_title: getPaymentMethodTitle(data.payment_method),
        // Notas del cliente
        customer_note: data.customer_note || "",
        // Configurar como no pagado inicialmente
        set_paid: false
      };
      
      console.log("Enviando datos del pedido:", orderData);
      
      // Crear el pedido usando la API real
      const newOrder = await ordersApi.createOrder(orderData);
      
      console.log("Pedido creado:", newOrder);
      
      toast.success(`Pedido #${newOrder.number || newOrder.id} creado exitosamente`);
      
      // Redirigir al pedido creado
      router.push(`/dashboard/orders/${newOrder.id}/edit`);
      
    } catch (error) {
      console.error("Error creando pedido:", error);
      
      // Mostrar error más específico si está disponible
      let errorMessage = "Error al crear el pedido. Por favor, inténtalo de nuevo.";
      
      if (error instanceof Error) {
        try {
          // Intentar parsear el error como JSON para obtener más detalles
          const errorData = JSON.parse(error.message);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Si no se puede parsear, usar el mensaje original
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Función helper para obtener el título del método de pago
  const getPaymentMethodTitle = (method: string) => {
    const methods: Record<string, string> = {
      'bacs': 'Transferencia Bancaria',
      'cod': 'Pago Contra Reembolso',
      'stripe': 'Tarjeta de Crédito',
      'paypal': 'PayPal'
    };
    return methods[method] || method;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Pedido</h1>
          <p className="text-muted-foreground">
            Rellena los detalles para crear un nuevo pedido manualmente.
          </p>
        </div>
        <Link href="/dashboard/orders" passHref>
          <Button variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Sección de Productos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Productos del Pedido
                </CardTitle>
                <CardDescription>
                  Busca y añade los productos que formarán parte de este pedido.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductSearch 
                  selectedProducts={selectedProducts}
                  onProductsChange={setSelectedProducts}
                />
              </CardContent>
            </Card>

            {/* Detalles del Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Detalles y Pago
                </CardTitle>
                <CardDescription>
                  Configura los detalles finales y el método de pago.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Método de pago */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Método de Pago *</Label>
                    <Select 
                      value={form.watch("payment_method")} 
                      onValueChange={(value) => form.setValue("payment_method", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bacs">Transferencia Bancaria</SelectItem>
                        <SelectItem value="cod">Pago Contra Reembolso</SelectItem>
                        <SelectItem value="stripe">Tarjeta de Crédito</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Moneda */}
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda *</Label>
                    <Select 
                      value={form.watch("currency")} 
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Coste de envío */}
                  <div className="space-y-2">
                    <Label htmlFor="shipping_total">Coste de Envío ({getCurrentCurrencySymbol()})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("shipping_total", { valueAsNumber: true })}
                      placeholder="99.00"
                    />
                  </div>
                </div>

                {/* Notas del cliente */}
                <div className="space-y-2">
                  <Label htmlFor="customer_note">Notas del Cliente</Label>
                  <Textarea
                    {...form.register("customer_note")}
                    placeholder="Instrucciones especiales, horarios de entrega, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Sección de Cliente */}
            <CustomerSearch 
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
            />

            {/* Resumen del Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Resumen del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const { subtotal, shipping, tax, total } = calculateTotals();
                  return (
                    <>
                                              <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>
                            {formatCurrentCurrency(subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Envío</span>
                          <span>
                            {formatCurrentCurrency(shipping)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{getTaxLabel()}</span>
                          <span>
                            {formatCurrentCurrency(tax)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>
                            {formatCurrentCurrency(total)}
                          </span>
                        </div>
                      
                      {selectedProducts.length > 0 && (
                        <div className="pt-4 text-sm text-muted-foreground">
                          <p>{selectedProducts.length} producto(s) seleccionado(s)</p>
                          {selectedCustomer && (
                            <p>Cliente: {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando pedido..." : "Crear Pedido"}
            </Button>
        </div>
      </form>
    </div>
  );
} 
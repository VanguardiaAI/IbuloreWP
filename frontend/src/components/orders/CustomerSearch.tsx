"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, User, Mail, Phone, MapPin, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { customersApi } from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

// Tipos basados en WooCommerce
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

interface CustomerSearchProps {
  selectedCustomer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
}

// Datos de ejemplo - clientes
const mockCustomers: Customer[] = [
  {
    id: 1,
    first_name: "María",
    last_name: "González",
    email: "maria.gonzalez@email.com",
    phone: "+34 600 123 456",
    username: "mariagonzalez",
    avatar_url: "/api/placeholder/40/40",
    date_created: "2023-01-15T10:30:00",
    date_modified: "2023-11-20T14:15:00",
    orders_count: 12,
    total_spent: 450.75,
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
      country: "ES"
    }
  },
  {
    id: 2,
    first_name: "Carlos",
    last_name: "Rodríguez",
    email: "carlos.rodriguez@email.com",
    phone: "+34 610 987 654",
    username: "carlosrodriguez",
    date_created: "2023-03-22T16:45:00",
    date_modified: "2023-11-18T09:20:00",
    orders_count: 8,
    total_spent: 320.50,
    billing: {
      first_name: "Carlos",
      last_name: "Rodríguez",
      company: "Boutique Espiritual",
      address_1: "Avenida de los Orishas 42",
      address_2: "",
      city: "Barcelona",
      state: "Barcelona",
      postcode: "08001",
      country: "ES",
      email: "carlos.rodriguez@email.com",
      phone: "+34 610 987 654"
    },
    shipping: {
      first_name: "Carlos",
      last_name: "Rodríguez",
      company: "Boutique Espiritual",
      address_1: "Avenida de los Orishas 42",
      address_2: "",
      city: "Barcelona",
      state: "Barcelona",
      postcode: "08001",
      country: "ES"
    }
  },
  {
    id: 3,
    first_name: "Ana",
    last_name: "Martínez",
    email: "ana.martinez@email.com",
    phone: "+34 620 456 789",
    username: "anamartinez",
    avatar_url: "/api/placeholder/40/40",
    date_created: "2023-05-10T12:00:00",
    date_modified: "2023-11-15T18:30:00",
    orders_count: 25,
    total_spent: 890.25,
    billing: {
      first_name: "Ana",
      last_name: "Martínez",
      company: "",
      address_1: "Plaza de Yemayá 7",
      address_2: "Bajo A",
      city: "Sevilla",
      state: "Andalucía",
      postcode: "41001",
      country: "ES",
      email: "ana.martinez@email.com",
      phone: "+34 620 456 789"
    },
    shipping: {
      first_name: "Ana",
      last_name: "Martínez",
      company: "",
      address_1: "Plaza de Yemayá 7",
      address_2: "Bajo A",
      city: "Sevilla",
      state: "Andalucía",
      postcode: "41001",
      country: "ES"
    }
  }
];

// Función para formatear precios
const formatPrice = (amount: number): string => {
  return formatCurrency(amount, DEFAULT_CURRENCY);
};

export function CustomerSearch({ selectedCustomer, onCustomerChange }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Búsqueda real de clientes
  const searchCustomers = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await customersApi.searchCustomers(term, 10);
      
      // Transform API response to match our Customer interface
      const transformedCustomers: Customer[] = response.customers.map((customer: any) => ({
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone || customer.billing?.phone,
        username: customer.username,
        avatar_url: customer.avatar_url,
        date_created: customer.date_created,
        date_modified: customer.date_modified,
        orders_count: customer.orders_count || 0,
        total_spent: customer.total_spent || 0,
        billing: {
          first_name: customer.billing?.first_name || customer.first_name || "",
          last_name: customer.billing?.last_name || customer.last_name || "",
          company: customer.billing?.company || "",
          address_1: customer.billing?.address_1 || "",
          address_2: customer.billing?.address_2 || "",
          city: customer.billing?.city || "",
          state: customer.billing?.state || "",
          postcode: customer.billing?.postcode || "",
          country: customer.billing?.country || "MX",
          email: customer.billing?.email || customer.email || "",
          phone: customer.billing?.phone || customer.phone || ""
        },
        shipping: {
          first_name: customer.shipping?.first_name || customer.first_name || "",
          last_name: customer.shipping?.last_name || customer.last_name || "",
          company: customer.shipping?.company || "",
          address_1: customer.shipping?.address_1 || customer.billing?.address_1 || "",
          address_2: customer.shipping?.address_2 || customer.billing?.address_2 || "",
          city: customer.shipping?.city || customer.billing?.city || "",
          state: customer.shipping?.state || customer.billing?.state || "",
          postcode: customer.shipping?.postcode || customer.billing?.postcode || "",
          country: customer.shipping?.country || customer.billing?.country || "MX"
        }
      }));
    
      setSearchResults(transformedCustomers);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching customers:", error);
      toast.error("Error al buscar clientes");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    searchCustomers(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchCustomers]);

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

  const selectCustomer = (customer: Customer) => {
    onCustomerChange(customer);
    setSearchTerm("");
    setShowResults(false);
  };

  const clearCustomer = () => {
    onCustomerChange(null);
    setSearchTerm("");
  };

  const getCustomerType = (customer: Customer) => {
    if (customer.orders_count >= 20) return { label: "VIP", color: "bg-purple-100 text-purple-800" };
    if (customer.orders_count >= 10) return { label: "Frecuente", color: "bg-blue-100 text-blue-800" };
    if (customer.orders_count >= 5) return { label: "Regular", color: "bg-green-100 text-green-800" };
    return { label: "Nuevo", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="space-y-4">
      {/* Cliente seleccionado */}
      {selectedCustomer ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Cliente Seleccionado</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearCustomer}>
                Cambiar Cliente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedCustomer.avatar_url} />
                <AvatarFallback>
                  {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </h3>
                  <Badge className={getCustomerType(selectedCustomer).color}>
                    {getCustomerType(selectedCustomer).label}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {selectedCustomer.email}
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {selectedCustomer.billing.city}, {selectedCustomer.billing.country}
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-3 text-sm">
                  <span>
                    <strong>{selectedCustomer.orders_count}</strong> pedidos
                  </span>
                  <span>
                    <strong>
                      {formatPrice(selectedCustomer.total_spent)}
                    </strong> gastado
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Buscador de clientes */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Seleccionar Cliente
            </CardTitle>
            <CardDescription>
              Busca un cliente existente o crea uno nuevo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
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
                        Buscando clientes...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((customer) => (
                          <div
                            key={customer.id}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => selectCustomer(customer)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={customer.avatar_url} />
                              <AvatarFallback>
                                {customer.first_name[0]}{customer.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-sm">
                                  {customer.first_name} {customer.last_name}
                                </h4>
                                <Badge className={getCustomerType(customer).color} variant="secondary">
                                  {getCustomerType(customer).label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {customer.orders_count} pedidos • {' '}
                                {formatPrice(customer.total_spent)} gastado
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-muted-foreground mb-3">No se encontraron clientes</p>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setShowCreateForm(true);
                            setShowResults(false);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Cliente Nuevo
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón para crear cliente nuevo */}
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Cliente Nuevo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de creación de cliente (placeholder) */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Cliente</CardTitle>
            <CardDescription>
              Introduce los datos del nuevo cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <Input placeholder="Nombre" />
                </div>
                <div>
                  <label className="text-sm font-medium">Apellidos</label>
                  <Input placeholder="Apellidos" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="email@ejemplo.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input placeholder="+34 600 123 456" />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setShowCreateForm(false)}>
                  Crear Cliente
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
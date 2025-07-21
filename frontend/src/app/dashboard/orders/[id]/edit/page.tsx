'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EditIcon, TrashIcon, PlusIcon, UserIcon, PhoneIcon, MailIcon, SearchIcon, XIcon, CreditCardIcon, TruckIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ordersApi } from '@/lib/api'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { customersApi } from '@/lib/api'
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency"

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  total: number
  image?: string
}

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  billing_address: {
    first_name: string
    last_name: string
    company: string
    address_1: string
    address_2: string
    city: string
    state: string
    postcode: string
    country: string
  }
  shipping_address: {
    first_name: string
    last_name: string
    company: string
    address_1: string
    address_2: string
    city: string
    state: string
    postcode: string
    country: string
  }
}

interface OrderNote {
  id: number
  note: string
  date: string
  author: string
  customer_note: boolean
}

interface Order {
  id: number
  number: string
  status: string
  date_created: string
  date_modified: string
  customer: Customer
  line_items: OrderItem[]
  shipping_total: number
  tax_total: number
  total: number
  payment_method: string
  payment_method_title: string
  transaction_id: string
  notes: OrderNote[]
  customer_note: string
  currency: string
  currency_symbol: string
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
  { value: 'on-hold', label: 'En espera', color: 'bg-gray-100 text-gray-800' },
  { value: 'completed', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Reembolsado', color: 'bg-purple-100 text-purple-800' },
  { value: 'failed', label: 'Fallido', color: 'bg-red-100 text-red-800' }
]

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isCustomerNote, setIsCustomerNote] = useState(false)
  const [customerStats, setCustomerStats] = useState({
    total_orders: 0,
    total_spent: 0,
    average_order_value: 0
  })
  const [orderMetadata, setOrderMetadata] = useState({
    customer_ip: '',
    device_type: '',
    origin: '',
    user_agent: ''
  })
  const [editableDate, setEditableDate] = useState('')
  const [editableTime, setEditableTime] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [editingAddresses, setEditingAddresses] = useState(false)
  const [editableBilling, setEditableBilling] = useState({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    email: '',
    phone: ''
  })
  const [editableShipping, setEditableShipping] = useState({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: ''
  })

  // Helper function para obtener el nombre del cliente basado en customer_id
  const getCustomerName = async (customerId: number): Promise<{ name: string; email: string }> => {
    if (!customerId || customerId === 0) {
      return { name: 'Invitado', email: '' }
    }
    
    try {
      // Intentar obtener el cliente por ID
      const customerData = await customersApi.getCustomer(customerId)
      const name = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim()
      return {
        name: name || customerData.email || `Cliente #${customerId}`,
        email: customerData.email || ''
      }
    } catch (error) {
      console.warn(`Could not fetch customer ${customerId}:`, error)
      return { name: `Cliente #${customerId}`, email: '' }
    }
  }

  // Cargar pedido desde la API
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const orderData = await ordersApi.getOrder(orderId)
        
        // Obtener el nombre real del cliente basado en customer_id
        const customerInfo = await getCustomerName(orderData.customer_id)
        
        // Transformar datos de WooCommerce al formato de la interfaz
        const transformedOrder: Order = {
          id: orderData.id,
          number: orderData.number,
          status: orderData.status,
          date_created: orderData.date_created,
          date_modified: orderData.date_modified,
          customer: {
            id: orderData.customer_id || 0,
            name: customerInfo.name,
            email: customerInfo.email || orderData.billing?.email || '',
            phone: orderData.billing?.phone || '',
            billing_address: {
              first_name: orderData.billing?.first_name || '',
              last_name: orderData.billing?.last_name || '',
              company: orderData.billing?.company || '',
              address_1: orderData.billing?.address_1 || '',
              address_2: orderData.billing?.address_2 || '',
              city: orderData.billing?.city || '',
              state: orderData.billing?.state || '',
              postcode: orderData.billing?.postcode || '',
              country: orderData.billing?.country || ''
            },
            shipping_address: {
              first_name: orderData.shipping?.first_name || '',
              last_name: orderData.shipping?.last_name || '',
              company: orderData.shipping?.company || '',
              address_1: orderData.shipping?.address_1 || '',
              address_2: orderData.shipping?.address_2 || '',
              city: orderData.shipping?.city || '',
              state: orderData.shipping?.state || '',
              postcode: orderData.shipping?.postcode || '',
              country: orderData.shipping?.country || ''
            }
          },
          line_items: orderData.line_items?.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            total: parseFloat(item.total),
            image: item.image?.src || undefined
          })) || [],
          shipping_total: parseFloat(orderData.shipping_total || '0'),
          tax_total: parseFloat(orderData.tax_total || '0'),
          total: parseFloat(orderData.total || '0'),
          payment_method: orderData.payment_method || '',
          payment_method_title: orderData.payment_method_title || '',
          transaction_id: orderData.transaction_id || '',
          notes: [], // Se cargarán por separado
          customer_note: orderData.customer_note || '',
          currency: orderData.currency || 'USD',
          currency_symbol: orderData.currency_symbol || '$'
        }

        setOrder(transformedOrder)
        
        // Inicializar campos editables de fecha
        setEditableDate(format(new Date(orderData.date_created), 'yyyy-MM-dd'))
        setEditableTime(format(new Date(orderData.date_created), 'HH:mm'))
        
        // Inicializar campos editables de direcciones
        setEditableBilling({
          first_name: orderData.billing?.first_name || '',
          last_name: orderData.billing?.last_name || '',
          company: orderData.billing?.company || '',
          address_1: orderData.billing?.address_1 || '',
          address_2: orderData.billing?.address_2 || '',
          city: orderData.billing?.city || '',
          state: orderData.billing?.state || '',
          postcode: orderData.billing?.postcode || '',
          country: orderData.billing?.country || '',
          email: orderData.billing?.email || '',
          phone: orderData.billing?.phone || ''
        })
        
        setEditableShipping({
          first_name: orderData.shipping?.first_name || orderData.billing?.first_name || '',
          last_name: orderData.shipping?.last_name || orderData.billing?.last_name || '',
          company: orderData.shipping?.company || orderData.billing?.company || '',
          address_1: orderData.shipping?.address_1 || orderData.billing?.address_1 || '',
          address_2: orderData.shipping?.address_2 || orderData.billing?.address_2 || '',
          city: orderData.shipping?.city || orderData.billing?.city || '',
          state: orderData.shipping?.state || orderData.billing?.state || '',
          postcode: orderData.shipping?.postcode || orderData.billing?.postcode || '',
          country: orderData.shipping?.country || orderData.billing?.country || ''
        })
        
        // Cargar notas del pedido
        try {
          const notes = await ordersApi.getOrderNotes(orderId)
          const transformedNotes: OrderNote[] = notes.map((note: any) => ({
            id: note.id,
            note: note.note,
            date: note.date_created,
            author: note.author || 'Sistema',
            customer_note: note.customer_note || false
          }))
          
          setOrder(prev => prev ? { ...prev, notes: transformedNotes } : null)
        } catch (notesError) {
          console.error('Error loading notes:', notesError)
          // No es crítico si no se pueden cargar las notas
        }

        // Cargar estadísticas reales del cliente desde WooCommerce
        try {
          const customerHistory = await ordersApi.getCustomerHistory(orderId)
          setCustomerStats({
            total_orders: customerHistory.total_orders,
            total_spent: customerHistory.total_spent,
            average_order_value: customerHistory.average_order_value
          })
        } catch (statsError) {
          console.error('Error loading customer stats:', statsError)
          // No es crítico si no se pueden cargar las estadísticas
        }

        // Cargar metadatos reales del pedido desde WooCommerce
        try {
          const metadata = await ordersApi.getOrderMetadata(orderId)
          setOrderMetadata({
            customer_ip: metadata.customer_ip,
            device_type: metadata.device_type,
            origin: metadata.origin,
            user_agent: metadata.user_agent
          })
        } catch (metadataError) {
          console.error('Error loading order metadata:', metadataError)
          // No es crítico si no se pueden cargar los metadatos
        }
        
      } catch (error) {
        console.error('Error fetching order:', error)
        toast.error('Error al cargar el pedido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    
    try {
      setSaving(true)
      
      // Actualizar el estado del pedido
      await ordersApi.updateOrder(orderId, { status: newStatus })
      
      // Actualizar el estado local inmediatamente
      setOrder({ ...order, status: newStatus })
      
      // Intentar agregar nota automática del cambio de estado (opcional)
      try {
        const statusLabel = ORDER_STATUSES.find(s => s.value === newStatus)?.label || newStatus
        const noteText = `El estado del pedido cambió a ${statusLabel}.`
        
        const result = await ordersApi.addOrderNote(orderId, {
          note: noteText,
          customer_note: false
        })
        
        // Si la nota se agregó correctamente, actualizar las notas locales
        if (result.success && result.note) {
          const transformedNote: OrderNote = {
            id: result.note.id,
            note: result.note.note,
            date: result.note.date_created,
            author: result.note.author || 'Sistema',
            customer_note: result.note.customer_note || false
          }
          setOrder(prev => prev ? { ...prev, notes: [transformedNote, ...prev.notes] } : null)
        }
      } catch (noteError) {
        // Si falla agregar la nota, no es crítico - solo log el error
        console.warn('No se pudo agregar la nota automática:', noteError)
      }
      
      toast.success(`Estado del pedido actualizado a ${ORDER_STATUSES.find(s => s.value === newStatus)?.label || newStatus}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Error al actualizar el estado del pedido')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !order) return

    try {
      setSaving(true)
      const result = await ordersApi.addOrderNote(orderId, {
        note: newNote,
        customer_note: isCustomerNote
      })
      
      if (result.success && result.note) {
        const transformedNote: OrderNote = {
          id: result.note.id,
          note: result.note.note,
          date: result.note.date_created,
          author: result.note.author || 'Admin',
          customer_note: isCustomerNote
        }
        
        setOrder(prev => prev ? { ...prev, notes: [transformedNote, ...prev.notes] } : null)
        setNewNote('')
        setIsCustomerNote(false)
        toast.success('Nota agregada correctamente')
      } else {
        toast.error('Error al agregar la nota')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Error al agregar la nota')
    } finally {
      setSaving(false)
    }
  }

  const handleMoveToTrash = async () => {
    if (confirm('¿Estás seguro de que quieres mover este pedido a la papelera?')) {
      try {
        setSaving(true)
        await ordersApi.deleteOrder(orderId, false) // false = mover a papelera, no eliminar permanentemente
        toast.success('Pedido movido a la papelera')
        router.push('/dashboard/orders')
      } catch (error) {
        console.error('Error deleting order:', error)
        toast.error('Error al mover el pedido a la papelera')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleDateTimeUpdate = async () => {
    if (!order || !editableDate || !editableTime) return

    try {
      setSaving(true)
      
      // Combinar fecha y hora
      const newDateTime = `${editableDate}T${editableTime}:00`
      
      await ordersApi.updateOrder(orderId, { 
        date_created: newDateTime 
      })
      
      // Actualizar el estado local
      setOrder({ ...order, date_created: newDateTime })
      toast.success('Fecha del pedido actualizada')
    } catch (error) {
      console.error('Error updating order date:', error)
      toast.error('Error al actualizar la fecha del pedido')
    } finally {
      setSaving(false)
    }
  }

  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      const response = await customersApi.searchCustomers(query, 10)
      setSearchResults(response.customers || [])
    } catch (error) {
      console.error('Error searching customers:', error)
      toast.error('Error al buscar clientes')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCustomerSelect = async (customer: any) => {
    try {
      setSaving(true)
      
      // Actualizar el pedido en el backend con el nuevo cliente
      const result = await ordersApi.updateOrderCustomer(orderId, customer.id)
      
      if (result.success) {
        setSelectedCustomer(customer)
        setCustomerSearchOpen(false)
        setCustomerSearchQuery('')
        setSearchResults([])
        
        // Actualizar solo la información del cliente, manteniendo las direcciones del pedido
        if (order) {
          setOrder({
            ...order,
            customer: {
              ...order.customer,
              id: customer.id,
              name: `${customer.first_name} ${customer.last_name}`.trim() || customer.name,
              email: customer.email
              // Las direcciones se mantienen como están
            }
          })
        }
        
        toast.success(result.message)
      } else {
        toast.error('Error al asignar cliente al pedido')
      }
    } catch (error) {
      console.error('Error updating order customer:', error)
      toast.error('Error al asignar cliente al pedido')
    } finally {
      setSaving(false)
    }
  }

  const isGuestOrder = () => {
    return !order?.customer.id || order.customer.id === 0
  }

  // Helper function para formatear fechas de manera segura
  const formatDateSafely = (dateString: string | undefined | null, formatStr: string) => {
    if (!dateString) return 'Fecha no disponible'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Fecha inválida'
      }
      return format(date, formatStr, { locale: es })
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString)
      return 'Error en fecha'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const handleEditAddresses = () => {
    if (!order) return
    
    // Inicializar los campos editables con los datos actuales
    setEditableBilling({
      first_name: order.customer.billing_address.first_name,
      last_name: order.customer.billing_address.last_name,
      company: order.customer.billing_address.company,
      address_1: order.customer.billing_address.address_1,
      address_2: order.customer.billing_address.address_2,
      city: order.customer.billing_address.city,
      state: order.customer.billing_address.state,
      postcode: order.customer.billing_address.postcode,
      country: order.customer.billing_address.country,
      email: order.customer.email,
      phone: order.customer.phone
    })
    
    setEditableShipping({
      first_name: order.customer.shipping_address.first_name || order.customer.billing_address.first_name,
      last_name: order.customer.shipping_address.last_name || order.customer.billing_address.last_name,
      company: order.customer.shipping_address.company || order.customer.billing_address.company,
      address_1: order.customer.shipping_address.address_1 || order.customer.billing_address.address_1,
      address_2: order.customer.shipping_address.address_2 || order.customer.billing_address.address_2,
      city: order.customer.shipping_address.city || order.customer.billing_address.city,
      state: order.customer.shipping_address.state || order.customer.billing_address.state,
      postcode: order.customer.shipping_address.postcode || order.customer.billing_address.postcode,
      country: order.customer.shipping_address.country || order.customer.billing_address.country
    })
    
    setEditingAddresses(true)
  }

  const handleSaveAddresses = async () => {
    if (!order) return
    
    try {
      setSaving(true)
      
      // Actualizar las direcciones en el backend
      const result = await ordersApi.updateOrderAddresses(orderId, { 
        billing: editableBilling, 
        shipping: editableShipping 
      })
      
      if (result.success) {
        // Actualizar el estado local con los datos del servidor
        setOrder({
          ...order,
          customer: {
            ...order.customer,
            name: `${editableBilling.first_name} ${editableBilling.last_name}`.trim(),
            email: editableBilling.email,
            phone: editableBilling.phone,
            billing_address: {
              first_name: editableBilling.first_name,
              last_name: editableBilling.last_name,
              company: editableBilling.company,
              address_1: editableBilling.address_1,
              address_2: editableBilling.address_2,
              city: editableBilling.city,
              state: editableBilling.state,
              postcode: editableBilling.postcode,
              country: editableBilling.country
            },
            shipping_address: {
              first_name: editableShipping.first_name,
              last_name: editableShipping.last_name,
              company: editableShipping.company,
              address_1: editableShipping.address_1,
              address_2: editableShipping.address_2,
              city: editableShipping.city,
              state: editableShipping.state,
              postcode: editableShipping.postcode,
              country: editableShipping.country
            }
          }
        })
        
        setEditingAddresses(false)
        toast.success(result.message)
      } else {
        toast.error('Error al actualizar las direcciones')
      }
    } catch (error) {
      console.error('Error updating addresses:', error)
      toast.error('Error al actualizar las direcciones')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEditAddresses = () => {
    setEditingAddresses(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Pedido no encontrado</h2>
          <p className="mt-2 text-gray-600">El pedido que buscas no existe.</p>
          <Button onClick={() => router.push('/dashboard/orders')} className="mt-4">
            Volver a Pedidos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Detalles de Pedido {order.number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pago a través de {order.payment_method_title} ({order.transaction_id}). 
            Pagado el {formatDateSafely(order.date_created, 'dd \'de\' MMMM \'de\' yyyy \'a\' HH:mm')}. 
            {orderMetadata.customer_ip && `IP del cliente: ${orderMetadata.customer_ip}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleMoveToTrash}
            disabled={saving}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Mover a la papelera
          </Button>
          <Button
            onClick={() => router.push('/dashboard/orders')}
            variant="outline"
          >
            Volver a Pedidos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                General
                <EditIcon className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fecha de creación */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Fecha de creación:
                </Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="date"
                    type="date"
                    value={editableDate}
                    onChange={(e) => setEditableDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={editableTime}
                    onChange={(e) => setEditableTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDateTimeUpdate}
                    disabled={saving || !editableDate || !editableTime}
                    className="whitespace-nowrap"
                  >
                    Actualizar
                  </Button>
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Estado:
                </Label>
                <Select value={order.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Cliente:
                </Label>
                <div className="space-y-3">
                  {/* Cliente actual */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedCustomer 
                            ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`.trim() || selectedCustomer.name || selectedCustomer.email
                            : order.customer.name || "Invitado"
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {isGuestOrder() ? "Pedido de invitado" : `Cliente registrado • ${selectedCustomer?.orders_count || 0} pedidos`}
                        </p>
                      </div>
                    </div>
                    {isGuestOrder() && (
                      <Badge variant="secondary" className="text-xs">
                        Invitado
                      </Badge>
                    )}
                  </div>

                  {/* Selector de cliente */}
                  <Dialog open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <SearchIcon className="h-4 w-4 mr-2" />
                        {isGuestOrder() ? "Asignar cliente registrado" : "Cambiar cliente"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Buscar Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar por nombre o email..."
                            value={customerSearchQuery}
                            onChange={(e) => {
                              setCustomerSearchQuery(e.target.value)
                              searchCustomers(e.target.value)
                            }}
                            className="pl-10"
                          />
                        </div>
                        
                        {searchLoading && (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Buscando...</p>
                          </div>
                        )}

                        {searchResults.length > 0 && (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {searchResults.map((customer) => (
                              <div
                                key={customer.id}
                                onClick={() => handleCustomerSelect(customer)}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {`${customer.first_name} ${customer.last_name}`.trim() || customer.name || customer.email}
                                    </p>
                                    <p className="text-sm text-gray-500">{customer.email}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{customer.orders_count} pedidos</p>
                                  <p className="text-xs text-gray-500">{formatCurrency(customer.total_spent, DEFAULT_CURRENCY)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {customerSearchQuery && !searchLoading && searchResults.length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No se encontraron clientes</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facturación y Envío */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Direcciones de Facturación y Envío
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={editingAddresses ? handleCancelEditAddresses : handleEditAddresses}
                  disabled={saving}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {editingAddresses ? (
                    <>
                      <XIcon className="h-4 w-4 mr-1" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <EditIcon className="h-4 w-4 mr-1" />
                      Editar
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingAddresses ? (
                <div className="space-y-6">
                  {/* Formulario de edición */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Facturación */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                        Dirección de Facturación
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="billing-first-name" className="text-sm font-medium">
                            Nombre
                          </Label>
                          <Input
                            id="billing-first-name"
                            value={editableBilling.first_name}
                            onChange={(e) => setEditableBilling({...editableBilling, first_name: e.target.value})}
                            placeholder="Nombre"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billing-last-name" className="text-sm font-medium">
                            Apellidos
                          </Label>
                          <Input
                            id="billing-last-name"
                            value={editableBilling.last_name}
                            onChange={(e) => setEditableBilling({...editableBilling, last_name: e.target.value})}
                            placeholder="Apellidos"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="billing-company" className="text-sm font-medium">
                          Empresa (opcional)
                        </Label>
                        <Input
                          id="billing-company"
                          value={editableBilling.company}
                          onChange={(e) => setEditableBilling({...editableBilling, company: e.target.value})}
                          placeholder="Nombre de la empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing-address-1" className="text-sm font-medium">
                          Dirección línea 1
                        </Label>
                        <Input
                          id="billing-address-1"
                          value={editableBilling.address_1}
                          onChange={(e) => setEditableBilling({...editableBilling, address_1: e.target.value})}
                          placeholder="Calle y número"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing-address-2" className="text-sm font-medium">
                          Dirección línea 2 (opcional)
                        </Label>
                        <Input
                          id="billing-address-2"
                          value={editableBilling.address_2}
                          onChange={(e) => setEditableBilling({...editableBilling, address_2: e.target.value})}
                          placeholder="Apartamento, suite, etc."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="billing-city" className="text-sm font-medium">
                            Ciudad
                          </Label>
                          <Input
                            id="billing-city"
                            value={editableBilling.city}
                            onChange={(e) => setEditableBilling({...editableBilling, city: e.target.value})}
                            placeholder="Ciudad"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billing-state" className="text-sm font-medium">
                            Estado/Provincia
                          </Label>
                          <Input
                            id="billing-state"
                            value={editableBilling.state}
                            onChange={(e) => setEditableBilling({...editableBilling, state: e.target.value})}
                            placeholder="Estado"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="billing-postcode" className="text-sm font-medium">
                            Código Postal
                          </Label>
                          <Input
                            id="billing-postcode"
                            value={editableBilling.postcode}
                            onChange={(e) => setEditableBilling({...editableBilling, postcode: e.target.value})}
                            placeholder="CP"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billing-country" className="text-sm font-medium">
                            País
                          </Label>
                          <Input
                            id="billing-country"
                            value={editableBilling.country}
                            onChange={(e) => setEditableBilling({...editableBilling, country: e.target.value})}
                            placeholder="País"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="billing-email" className="text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="billing-email"
                          type="email"
                          value={editableBilling.email}
                          onChange={(e) => setEditableBilling({...editableBilling, email: e.target.value})}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing-phone" className="text-sm font-medium">
                          Teléfono
                        </Label>
                        <Input
                          id="billing-phone"
                          value={editableBilling.phone}
                          onChange={(e) => setEditableBilling({...editableBilling, phone: e.target.value})}
                          placeholder="Número de teléfono"
                        />
                      </div>
                    </div>

                    {/* Envío */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                        Dirección de Envío
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="shipping-first-name" className="text-sm font-medium">
                            Nombre
                          </Label>
                          <Input
                            id="shipping-first-name"
                            value={editableShipping.first_name}
                            onChange={(e) => setEditableShipping({...editableShipping, first_name: e.target.value})}
                            placeholder="Nombre"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-last-name" className="text-sm font-medium">
                            Apellidos
                          </Label>
                          <Input
                            id="shipping-last-name"
                            value={editableShipping.last_name}
                            onChange={(e) => setEditableShipping({...editableShipping, last_name: e.target.value})}
                            placeholder="Apellidos"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shipping-company" className="text-sm font-medium">
                          Empresa (opcional)
                        </Label>
                        <Input
                          id="shipping-company"
                          value={editableShipping.company}
                          onChange={(e) => setEditableShipping({...editableShipping, company: e.target.value})}
                          placeholder="Nombre de la empresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-address-1" className="text-sm font-medium">
                          Dirección línea 1
                        </Label>
                        <Input
                          id="shipping-address-1"
                          value={editableShipping.address_1}
                          onChange={(e) => setEditableShipping({...editableShipping, address_1: e.target.value})}
                          placeholder="Calle y número"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-address-2" className="text-sm font-medium">
                          Dirección línea 2 (opcional)
                        </Label>
                        <Input
                          id="shipping-address-2"
                          value={editableShipping.address_2}
                          onChange={(e) => setEditableShipping({...editableShipping, address_2: e.target.value})}
                          placeholder="Apartamento, suite, etc."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="shipping-city" className="text-sm font-medium">
                            Ciudad
                          </Label>
                          <Input
                            id="shipping-city"
                            value={editableShipping.city}
                            onChange={(e) => setEditableShipping({...editableShipping, city: e.target.value})}
                            placeholder="Ciudad"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-state" className="text-sm font-medium">
                            Estado/Provincia
                          </Label>
                          <Input
                            id="shipping-state"
                            value={editableShipping.state}
                            onChange={(e) => setEditableShipping({...editableShipping, state: e.target.value})}
                            placeholder="Estado"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="shipping-postcode" className="text-sm font-medium">
                            Código Postal
                          </Label>
                          <Input
                            id="shipping-postcode"
                            value={editableShipping.postcode}
                            onChange={(e) => setEditableShipping({...editableShipping, postcode: e.target.value})}
                            placeholder="CP"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shipping-country" className="text-sm font-medium">
                            País
                          </Label>
                          <Input
                            id="shipping-country"
                            value={editableShipping.country}
                            onChange={(e) => setEditableShipping({...editableShipping, country: e.target.value})}
                            placeholder="País"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancelEditAddresses}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveAddresses}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vista de solo lectura - Facturación */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 border-b pb-2 flex items-center">
                      <CreditCardIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Dirección de Facturación
                    </h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {`${order.customer.billing_address.first_name} ${order.customer.billing_address.last_name}`.trim() || order.customer.name}
                        </p>
                        {order.customer.billing_address.company && (
                          <p className="text-sm text-gray-600">{order.customer.billing_address.company}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>{order.customer.billing_address.address_1}</p>
                        {order.customer.billing_address.address_2 && (
                          <p>{order.customer.billing_address.address_2}</p>
                        )}
                        <p>
                          {order.customer.billing_address.city}, {order.customer.billing_address.state}
                        </p>
                        <p>{order.customer.billing_address.postcode}</p>
                        <p className="font-medium">{order.customer.billing_address.country}</p>
                      </div>
                      
                      <Separator />
                      
                      {order.customer.email && (
                        <div className="flex items-center space-x-2">
                          <MailIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Email:</p>
                            <p className="text-sm text-blue-600">{order.customer.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {order.customer.phone && (
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Teléfono:</p>
                            <p className="text-sm text-blue-600">{order.customer.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vista de solo lectura - Envío */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 border-b pb-2 flex items-center">
                      <TruckIcon className="h-5 w-5 mr-2 text-green-600" />
                      Dirección de Envío
                    </h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {`${order.customer.shipping_address.first_name || order.customer.billing_address.first_name} ${order.customer.shipping_address.last_name || order.customer.billing_address.last_name}`.trim() || order.customer.name}
                        </p>
                        {(order.customer.shipping_address.company || order.customer.billing_address.company) && (
                          <p className="text-sm text-gray-600">
                            {order.customer.shipping_address.company || order.customer.billing_address.company}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>{order.customer.shipping_address.address_1 || order.customer.billing_address.address_1}</p>
                        {(order.customer.shipping_address.address_2 || order.customer.billing_address.address_2) && (
                          <p>{order.customer.shipping_address.address_2 || order.customer.billing_address.address_2}</p>
                        )}
                        <p>
                          {order.customer.shipping_address.city || order.customer.billing_address.city}, {order.customer.shipping_address.state || order.customer.billing_address.state}
                        </p>
                        <p>{order.customer.shipping_address.postcode || order.customer.billing_address.postcode}</p>
                        <p className="font-medium">{order.customer.shipping_address.country || order.customer.billing_address.country}</p>
                      </div>
                      
                      {order.customer.phone && (
                        <>
                          <Separator />
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-xs font-medium text-gray-500">Teléfono:</p>
                              <p className="text-sm text-blue-600">{order.customer.phone}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Artículos del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.line_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                      ) : (
                        <span className="text-xs text-gray-500">IMG</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-600">{item.name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{order.currency_symbol || '$'}{item.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">x {item.quantity}</div>
                    </div>
                    <div className="text-right font-medium">
                      {order.currency_symbol || '$'}{item.total.toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Envío */}
                {order.shipping_total > 0 && (
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">📦</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Envío</h4>
                      <p className="text-sm text-gray-500">Artículos: {order.line_items.length} producto(s)</p>
                    </div>
                    <div className="text-right font-medium">
                      {order.currency_symbol}{order.shipping_total.toFixed(2)}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Totales */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal de artículos:</span>
                    <span>{order.currency_symbol}{order.line_items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span>{order.currency_symbol}{order.shipping_total.toFixed(2)}</span>
                  </div>
                  {order.tax_total > 0 && (
                    <div className="flex justify-between">
                      <span>Impuestos:</span>
                      <span>{order.currency_symbol}{order.tax_total.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total del pedido:</span>
                    <span>{order.currency_symbol}{order.total.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Pagado:</span>
                    <span className="font-bold text-green-600">{order.currency_symbol}{order.total.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDateSafely(order.date_created, 'dd \'de\' MMMM \'de\' yyyy')} a través de {order.payment_method_title}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Atribución de Pedido */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Atribución de Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Origen</span>
                  <span className="text-sm text-gray-900 font-medium">{orderMetadata.origin || 'Directo'}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Dispositivo</span>
                  <span className="text-sm text-gray-900 font-medium">{orderMetadata.device_type || 'Desconocido'}</span>
                </div>
              </div>
              
              {orderMetadata.user_agent && (
                <div className="pt-2">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600">Navegador</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed break-all bg-gray-50 p-2 rounded border">
                    {orderMetadata.user_agent}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial del cliente */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Historial del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Total de Pedidos</span>
                  <span className="text-lg font-semibold text-gray-900">{customerStats.total_orders}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Total Gastado</span>
                  <span className="text-lg font-semibold text-gray-900">{order.currency_symbol}{customerStats.total_spent.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-600">Promedio por Pedido</span>
                  <span className="text-lg font-semibold text-gray-900">{order.currency_symbol}{customerStats.average_order_value.toFixed(2)}</span>
                </div>
              </div>
              
              {customerStats.total_orders > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Cliente recurrente</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Notas del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agregar nueva nota */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Agregar nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="customer-note"
                    checked={isCustomerNote}
                    onChange={(e) => setIsCustomerNote(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="customer-note" className="text-sm">
                    Nota del cliente
                  </Label>
                </div>
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || saving}
                  size="sm"
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              <Separator />

              {/* Lista de notas */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {order.notes.length > 0 ? (
                  order.notes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          {note.author}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateSafely(note.date, 'dd \'de\' MMM \'de\' yyyy \'a las\' HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                      {note.customer_note && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Nota del cliente
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay notas para este pedido
                  </p>
                )}
              </div>

              {order.customer_note && (
                <>
                  <Separator />
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Label className="text-sm font-medium text-blue-800">
                      Nota del cliente:
                    </Label>
                    <p className="text-sm text-blue-700 mt-1">{order.customer_note}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
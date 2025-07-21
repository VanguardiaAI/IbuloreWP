# API Endpoints Documentation - IbuloreWP Backend

Este documento describe todos los endpoints disponibles en el backend de IbuloreWP para gestionar pedidos, clientes y productos a través de la API de WooCommerce.

## Base URL
```
http://localhost:5001/api
```

## Endpoints de Pedidos

### 1. Obtener Lista de Pedidos
**GET** `/orders`

**Parámetros de consulta:**
- `page` (int): Página a obtener (por defecto: 1)
- `per_page` (int): Elementos por página (máximo: 100, por defecto: 20)
- `status` (string): Estado del pedido (pending, processing, completed, etc.)
- `customer` (int): ID del cliente
- `search` (string): Búsqueda por texto
- `after` (datetime): Pedidos después de esta fecha
- `before` (datetime): Pedidos antes de esta fecha
- `orderby` (string): Ordenar por (date, id, title, etc.)
- `order` (string): Orden (asc, desc)

**Ejemplo:**
```
GET /orders?status=processing&per_page=10&page=1
```

### 2. Obtener Pedido Específico
**GET** `/orders/{order_id}`

**Respuesta:** Objeto completo del pedido con todos los detalles.

> **Nota importante:** Todos los endpoints de pedidos excluyen automáticamente los pedidos con estado `checkout-draft` (carritos abandonados). Para acceder a los carritos abandonados, utiliza el endpoint específico `/orders/abandoned-carts`.

### 3. Crear Nuevo Pedido
**POST** `/orders`

**Body (JSON):**
```json
{
  "payment_method": "cod",
  "payment_method_title": "Contra reembolso",
  "billing": {
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@email.com",
    "phone": "666123456",
    "address_1": "Calle Mayor 123",
    "city": "Madrid",
    "postcode": "28001",
    "country": "ES"
  },
  "shipping": {
    "first_name": "Juan",
    "last_name": "Pérez",
    "address_1": "Calle Mayor 123",
    "city": "Madrid",
    "postcode": "28001",
    "country": "ES"
  },
  "line_items": [
    {
      "product_id": 123,
      "quantity": 2
    }
  ],
  "shipping_lines": [
    {
      "method_id": "flat_rate",
      "method_title": "Envío estándar",
      "total": "5.00"
    }
  ]
}
```

### 4. Actualizar Pedido
**PUT** `/orders/{order_id}`

### 5. Eliminar Pedido
**DELETE** `/orders/{order_id}?force=true`

### 6. Obtener Estadísticas de Pedidos
**GET** `/orders/stats`

**Respuesta:**
```json
{
  "total_orders": 1247,
  "pending_orders": 23,
  "processing_orders": 45,
  "completed_orders": 1156,
  "cancelled_orders": 23,
  "total_revenue": 45678.90,
  "average_order_value": 89.45,
  "orders_by_status": {
    "pending": 23,
    "processing": 45,
    "completed": 1156
  },
  "top_products": []
}
```

### 7. Buscar Pedidos
**GET** `/orders/search?q={query}&limit={limit}`

### 8. Obtener Carritos Abandonados
**GET** `/orders/abandoned-carts`

**Parámetros de consulta:**
- `page` (int): Página a obtener (por defecto: 1)
- `per_page` (int): Elementos por página (máximo: 100, por defecto: 20)

**Descripción:** Obtiene los carritos abandonados (pedidos con estado `checkout-draft`). Estos pedidos están separados de la lista principal porque representan carritos que los usuarios iniciaron pero no completaron.

**Respuesta:**
```json
{
  "abandoned_carts": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

## Endpoints de Clientes

### 1. Obtener Lista de Clientes
**GET** `/customers`

**Parámetros de consulta:**
- `page`, `per_page`, `search`, `email`, `role`, `orderby`, `order`

### 2. Obtener Cliente Específico
**GET** `/customers/{customer_id}`

### 3. Crear Nuevo Cliente
**POST** `/customers`

**Body (JSON):**
```json
{
  "email": "cliente@email.com",
  "first_name": "María",
  "last_name": "García",
  "username": "maria_garcia",
  "billing": {
    "first_name": "María",
    "last_name": "García",
    "company": "",
    "address_1": "Calle Nueva 456",
    "city": "Barcelona",
    "postcode": "08001",
    "country": "ES",
    "phone": "677654321"
  },
  "shipping": {
    "first_name": "María",
    "last_name": "García",
    "address_1": "Calle Nueva 456",
    "city": "Barcelona",
    "postcode": "08001",
    "country": "ES"
  }
}
```

### 4. Actualizar Cliente
**PUT** `/customers/{customer_id}`

### 5. Eliminar Cliente
**DELETE** `/customers/{customer_id}?force=true&reassign={user_id}`

### 6. Buscar Clientes
**GET** `/customers/search?q={query}&limit={limit}`

### 7. Obtener Pedidos de un Cliente
**GET** `/customers/{customer_id}/orders`



## Endpoints de Productos

### 1. Buscar Productos
**GET** `/products/search`

**Parámetros de consulta:**
- `q` (string): Término de búsqueda
- `limit` (int): Límite de resultados
- `category` (int): ID de categoría
- `in_stock` (boolean): Solo productos en stock

**Respuesta:**
```json
{
  "products": [
    {
      "id": 123,
      "name": "Collar de Yemayá",
      "sku": "COL-YEM-001",
      "price": 45.00,
      "regular_price": 45.00,
      "sale_price": 0,
      "stock_quantity": 15,
      "manage_stock": true,
      "in_stock": true,
      "stock_status": "instock",
      "image": "https://...",
      "categories": ["Collares", "Yemayá"],
      "short_description": "Collar tradicional de Yemayá..."
    }
  ]
}
```

### 2. Productos por Categoría
**GET** `/products/by-category/{category_id}`

### 3. Productos con Stock Bajo
**GET** `/products/low-stock?threshold=5`

### 4. Productos Recientes
**GET** `/products/recent?limit=10`

### 5. Información de Stock de Producto
**GET** `/products/{product_id}/stock`

## Estados de Respuesta HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Datos inválidos
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

## Manejo de Errores

Todas las respuestas de error siguen este formato:
```json
{
  "error": "Mensaje de error",
  "details": "Información adicional (opcional)"
}
```

## Configuración Requerida

Para usar estos endpoints, necesitas configurar las siguientes variables de entorno:

```env
WC_STORE_URL=https://tu-tienda.com
WC_CONSUMER_KEY=ck_xxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxx
```

## Ejemplos de Uso

### Crear un pedido completo:
```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "cod",
    "payment_method_title": "Contra reembolso",
    "billing": {
      "first_name": "Ana",
      "last_name": "López",
      "email": "ana@email.com",
      "phone": "666789123",
      "address_1": "Plaza España 5",
      "city": "Sevilla",
      "postcode": "41001",
      "country": "ES"
    },
    "line_items": [
      {
        "product_id": 123,
        "quantity": 1
      }
    ]
  }'
```

### Buscar productos:
```bash
curl "http://localhost:5001/api/products/search?q=collar&limit=5"
```

### Obtener estadísticas de pedidos:
```bash
curl "http://localhost:5001/api/orders/stats"
``` 
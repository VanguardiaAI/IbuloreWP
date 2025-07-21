# Sistema de Manejo de Monedas Mejorado

## Resumen

Se ha implementado un sistema robusto de manejo de monedas que permite al panel de administración trabajar con múltiples monedas de WooCommerce sin problemas para el usuario.

## Características Principales

### 1. Detección Automática de Monedas
- **Función**: `detectCurrencyFromWooCommerce()`
- **Propósito**: Detecta automáticamente la moneda de pedidos y productos desde los datos de WooCommerce
- **Campos detectados**:
  - `currency`
  - `currency_code`
  - `order_currency`
  - `meta_data._order_currency`

### 2. Monedas Soportadas
El sistema soporta 7 monedas principales con configuración completa:

| Moneda | Símbolo | Decimales | Locale | Separadores |
|--------|---------|-----------|--------|-------------|
| MXN | $ | 2 | es-MX | , . |
| USD | $ | 2 | en-US | , . |
| EUR | € | 2 | es-ES | . , |
| GBP | £ | 2 | en-GB | , . |
| CAD | C$ | 2 | en-CA | , . |
| COP | $ | 0 | es-CO | . , |
| ARS | $ | 2 | es-AR | . , |

### 3. Funciones Principales

#### `formatCurrency(amount, currency, options)`
- Formatea montos con la moneda especificada
- Manejo de errores robusto
- Fallback automático a MXN si la moneda no es soportada
- Opciones para mostrar/ocultar símbolo

#### `formatWooCommercePrice(amount, orderOrProductData, options)`
- Formatea precios detectando automáticamente la moneda desde datos de WooCommerce
- Ideal para mostrar precios de pedidos y productos

#### `getCurrencyInfo(currency)`
- Obtiene información completa de una moneda
- Incluye símbolo, nombre, locale, decimales, etc.

### 4. Componentes UI

#### `CurrencyIndicator`
- Muestra badges con la moneda actual
- Variantes: default, secondary, outline, destructive
- Tamaños: sm, default, lg
- Detección automática de moneda desde datos

#### `MultiCurrencyIndicator`
- Muestra múltiples monedas en una lista compacta
- Útil para resúmenes que incluyen varias monedas

#### `CurrencySettings`
- Panel completo de configuración de monedas
- Vista previa en tiempo real
- Lista de monedas soportadas
- Configuración avanzada

### 5. Mejoras en Componentes Existentes

#### Tabla de Pedidos (`OrdersTable`)
- Detección automática de moneda por pedido
- Indicador visual de moneda en cada fila
- Formato correcto según la moneda del pedido

#### Búsqueda de Productos (`ProductSearch`)
- Formato consistente de precios
- Manejo de múltiples monedas en productos

#### Detalles de Pedidos (`OrderDetailsPage`)
- Formato automático según la moneda del pedido
- Totales, subtotales e impuestos en la moneda correcta

#### Estadísticas y Reportes
- Uso de pesos mexicanos como moneda por defecto
- Formato consistente en todas las métricas

## Beneficios para el Usuario

### 1. **Sin Confusión de Monedas**
- Cada pedido muestra su moneda original de WooCommerce
- Indicadores visuales claros de qué moneda se está usando
- No hay mezcla de símbolos de moneda incorrectos

### 2. **Manejo Automático**
- El sistema detecta automáticamente la moneda de cada elemento
- No requiere configuración manual por parte del usuario
- Fallbacks inteligentes para monedas no soportadas

### 3. **Formato Regional Correcto**
- Cada moneda usa su formato regional apropiado
- Separadores de miles y decimales correctos
- Posición del símbolo según la convención de cada moneda

### 4. **Escalabilidad**
- Fácil agregar nuevas monedas al sistema
- Configuración centralizada en un solo archivo
- Preparado para futuras funcionalidades como conversión de monedas

## Configuración por Defecto

- **Moneda principal**: Peso Mexicano (MXN)
- **Locale por defecto**: es-MX
- **Comportamiento con monedas no soportadas**: Fallback a MXN con warning en consola

## Archivos Modificados

### Nuevos Archivos
- `frontend/src/lib/currency.ts` - Sistema completo de manejo de monedas
- `frontend/src/components/ui/CurrencyIndicator.tsx` - Componentes de indicadores
- `frontend/src/components/settings/CurrencySettings.tsx` - Panel de configuración

### Archivos Actualizados
- `frontend/src/components/orders/OrdersTable.tsx`
- `frontend/src/components/orders/ProductSearch.tsx`
- `frontend/src/components/orders/CustomerSearch.tsx`
- `frontend/src/components/products/ProductsTable.tsx`
- `frontend/src/components/products/form-components/ProductFormAccordion.tsx`
- `frontend/src/components/customers/CustomersTable.tsx`
- `frontend/src/components/inventory/InventoryStats.tsx`
- `frontend/src/components/reports/StatsCards.tsx`
- `frontend/src/app/dashboard/orders/[id]/page.tsx`
- `frontend/src/app/dashboard/reports/page.tsx`

## Casos de Uso Soportados

### 1. **Tienda Multi-Moneda**
- Pedidos en USD, EUR, MXN, etc.
- Cada pedido mantiene su moneda original
- Visualización correcta en el panel

### 2. **Migración de Monedas**
- Cambio de EUR a MXN como moneda principal
- Pedidos históricos mantienen su moneda original
- Nuevos elementos usan MXN por defecto

### 3. **Clientes Internacionales**
- Clientes que pagan en diferentes monedas
- Totales gastados en la moneda original
- Estadísticas agregadas en moneda por defecto

## Próximas Mejoras Posibles

1. **Conversión de Monedas**: Integración con APIs de tipos de cambio
2. **Configuración Persistente**: Guardar preferencias de moneda del usuario
3. **Reportes Multi-Moneda**: Reportes que muestren datos en múltiples monedas
4. **Alertas de Moneda**: Notificaciones cuando se detecten monedas no soportadas

## Conclusión

El sistema ahora maneja robustamente las múltiples monedas de WooCommerce, proporcionando una experiencia de usuario clara y sin confusiones, mientras mantiene la flexibilidad para trabajar con cualquier moneda que use la tienda. 
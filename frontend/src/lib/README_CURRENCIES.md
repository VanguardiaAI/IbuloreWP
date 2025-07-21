# Sistema de Monedas - IbuloreWP

## Descripción
El sistema de monedas permite manejar múltiples divisas en el panel de administración, con configuraciones específicas para cada país/región incluyendo tasas de impuestos y costos de envío por defecto.

## Monedas Disponibles

### Configuradas por defecto:
- **MXN** - Peso Mexicano (por defecto)
  - IVA: 16%
  - Envío: $99.00 MXN
  - Formato: es-MX

- **USD** - Dólar Estadounidense
  - Sales Tax: 8% (promedio)+*
  - Envío: $9.99 USD
  - Formato: en-US

- **EUR** - Euro
  - IVA: 21%
  - Envío: €5.95 EUR
  - Formato: es-ES

- **CAD** - Dólar Canadiense
  - HST: 13% (promedio)
  - Envío: C$12.99 CAD
  - Formato: en-CA

- **GBP** - Libra Esterlina
  - VAT: 20%
  - Envío: £4.99 GBP
  - Formato: en-GB

- **COP** - Peso Colombiano
  - IVA: 19%
  - Envío: $15,000 COP
  - Formato: es-CO

- **ARS** - Peso Argentino
  - IVA: 21%
  - Envío: $2,500 ARS
  - Formato: es-AR

## Cómo Agregar una Nueva Moneda

1. **Editar el archivo `currencies.ts`**:
```typescript
{
  value: "BRL", // Código ISO de la moneda
  label: "Real Brasileño (BRL)", // Nombre para mostrar
  symbol: "R$", // Símbolo de la moneda
  locale: "pt-BR", // Configuración regional
  taxRate: 0.17, // Tasa de impuesto (17% para Brasil)
  defaultShipping: 25.00 // Costo de envío por defecto
}
```

2. **La nueva moneda aparecerá automáticamente** en el selector del formulario de pedidos.

## Funciones Disponibles

### `getCurrency(currencyCode: string)`
Obtiene la configuración completa de una moneda.

### `formatCurrency(amount: number, currencyCode: string)`
Formatea un monto según la moneda y configuración regional.

### `getCurrencySymbol(currencyCode: string)`
Obtiene el símbolo de una moneda específica.

### `getTaxRate(currencyCode: string)`
Obtiene la tasa de impuesto para una moneda.

### `getDefaultShipping(currencyCode: string)`
Obtiene el costo de envío por defecto para una moneda.

## Comportamiento Automático

- **Cambio de moneda**: Al seleccionar una nueva moneda, se actualiza automáticamente:
  - El costo de envío por defecto
  - La tasa de impuesto en los cálculos
  - El formato de visualización de precios
  - La etiqueta del impuesto (ej: "IVA (16%)")

- **Cálculos**: Los totales se recalculan automáticamente usando la tasa de impuesto correspondiente a la moneda seleccionada.

## Configuración Regional

Cada moneda incluye su configuración regional (`locale`) que determina:
- Formato de números
- Posición del símbolo de moneda
- Separadores decimales y de miles
- Idioma de los números

## Notas Importantes

- Las tasas de impuesto son aproximadas y pueden variar según la región específica
- Los costos de envío son valores por defecto que pueden ser modificados manualmente
- El sistema usa `Intl.NumberFormat` para el formateo automático de monedas
- La moneda por defecto es MXN (Peso Mexicano) 
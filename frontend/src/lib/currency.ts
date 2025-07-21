// Configuración de moneda por defecto para toda la aplicación
export const DEFAULT_CURRENCY = 'MXN';
export const DEFAULT_LOCALE = 'es-MX';

// Configuración completa de monedas soportadas por WooCommerce
export const SUPPORTED_CURRENCIES = {
  'MXN': {
    symbol: '$',
    name: 'Peso Mexicano',
    locale: 'es-MX',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before' // before, after
  },
  'USD': {
    symbol: '$',
    name: 'Dólar Estadounidense',
    locale: 'en-US',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before'
  },
  'EUR': {
    symbol: '€',
    name: 'Euro',
    locale: 'es-ES',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'after'
  },
  'GBP': {
    symbol: '£',
    name: 'Libra Esterlina',
    locale: 'en-GB',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before'
  },
  'CAD': {
    symbol: 'C$',
    name: 'Dólar Canadiense',
    locale: 'en-CA',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before'
  },
  'COP': {
    symbol: '$',
    name: 'Peso Colombiano',
    locale: 'es-CO',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'before'
  },
  'ARS': {
    symbol: '$',
    name: 'Peso Argentino',
    locale: 'es-AR',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    symbolPosition: 'before'
  }
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

// Función principal para formatear moneda de manera consistente
export function formatCurrency(
  amount: number | string | null | undefined,
  currency?: string,
  options?: {
    showSymbol?: boolean;
    locale?: string;
    fallbackCurrency?: string;
  }
): string {
  // Validar y limpiar el monto
  if (amount == null || amount === '') return formatCurrency(0, currency, options);
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return formatCurrency(0, currency, options);

  // Determinar la moneda a usar
  const finalCurrency = currency || options?.fallbackCurrency || DEFAULT_CURRENCY;
  const currencyConfig = SUPPORTED_CURRENCIES[finalCurrency as SupportedCurrency];
  
  // Si la moneda no está soportada, usar la configuración por defecto
  if (!currencyConfig) {
    console.warn(`Moneda no soportada: ${finalCurrency}. Usando ${DEFAULT_CURRENCY} como fallback.`);
    return formatCurrency(amount, DEFAULT_CURRENCY, options);
  }

  // Configurar opciones de formato
  const showSymbol = options?.showSymbol !== false; // Por defecto true
  const locale = options?.locale || currencyConfig.locale;

  try {
    // Usar Intl.NumberFormat para formato consistente
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: finalCurrency,
      minimumFractionDigits: currencyConfig.decimals,
      maximumFractionDigits: currencyConfig.decimals,
    });

    return formatter.format(numericAmount);
  } catch (error) {
    console.error(`Error formateando moneda ${finalCurrency}:`, error);
    
    // Fallback manual si Intl.NumberFormat falla
    const formattedNumber = numericAmount.toFixed(currencyConfig.decimals);
    return showSymbol ? `${currencyConfig.symbol}${formattedNumber}` : formattedNumber;
  }
}

// Función para obtener el símbolo de moneda
export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  const currencyConfig = SUPPORTED_CURRENCIES[currency as SupportedCurrency];
  return currencyConfig?.symbol || '$';
}

// Función para obtener información completa de una moneda
export function getCurrencyInfo(currency: string = DEFAULT_CURRENCY) {
  return SUPPORTED_CURRENCIES[currency as SupportedCurrency] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
}

// Función para formatear solo el número sin símbolo
export function formatAmount(
  amount: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  decimals?: number
): string {
  const currencyConfig = SUPPORTED_CURRENCIES[currency as SupportedCurrency];
  const finalDecimals = decimals ?? currencyConfig?.decimals ?? 2;
  
  return formatCurrency(amount, currency, { 
    showSymbol: false,
    fallbackCurrency: DEFAULT_CURRENCY 
  });
}

// Función para validar si una moneda es válida
export function isValidCurrency(currency: string): boolean {
  return currency in SUPPORTED_CURRENCIES;
}

// Función para obtener todas las monedas soportadas
export function getSupportedCurrencies() {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => ({
    code,
    ...config
  }));
}

// Función para detectar la moneda desde datos de WooCommerce
export function detectCurrencyFromWooCommerce(orderData: any): string {
  // Intentar obtener la moneda de diferentes campos posibles
  const possibleCurrencyFields = [
    orderData?.currency,
    orderData?.currency_code,
    orderData?.order_currency,
    orderData?.meta_data?.find((meta: any) => meta.key === '_order_currency')?.value
  ];

  for (const currency of possibleCurrencyFields) {
    if (currency && typeof currency === 'string' && isValidCurrency(currency.toUpperCase())) {
      return currency.toUpperCase();
    }
  }

  // Si no se encuentra una moneda válida, usar la por defecto
  console.warn('No se pudo detectar una moneda válida en los datos de WooCommerce. Usando moneda por defecto.');
  return DEFAULT_CURRENCY;
}

// Función para formatear precios de WooCommerce de forma segura
export function formatWooCommercePrice(
  amount: number | string | null | undefined,
  orderOrProductData?: any,
  options?: {
    showSymbol?: boolean;
    fallbackCurrency?: string;
  }
): string {
  const currency = orderOrProductData ? detectCurrencyFromWooCommerce(orderOrProductData) : DEFAULT_CURRENCY;
  
  return formatCurrency(amount, currency, {
    showSymbol: options?.showSymbol,
    fallbackCurrency: options?.fallbackCurrency || DEFAULT_CURRENCY
  });
}

// Función para convertir entre monedas (placeholder para futuras implementaciones)
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates?: Record<string, number>
): number {
  // Por ahora, solo retorna el monto original
  // En el futuro, aquí se podría implementar conversión real usando APIs de tipos de cambio
  console.warn('Conversión de moneda no implementada. Retornando monto original.');
  return amount;
}

// Función para formatear rangos de precios
export function formatPriceRange(
  minPrice: number | string | null | undefined,
  maxPrice: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  const min = formatCurrency(minPrice, currency);
  const max = formatCurrency(maxPrice, currency);
  
  if (minPrice === maxPrice || !maxPrice) {
    return min;
  }
  
  return `${min} - ${max}`;
} 
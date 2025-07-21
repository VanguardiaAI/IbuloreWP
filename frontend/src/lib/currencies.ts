export interface Currency {
  value: string;
  label: string;
  symbol: string;
  locale: string;
  taxRate: number; // Tasa de impuesto por defecto para cada país/moneda
  defaultShipping: number; // Costo de envío por defecto
}

export const currencies: Currency[] = [
  {
    value: "MXN",
    label: "Peso Mexicano (MXN)",
    symbol: "$",
    locale: "es-MX",
    taxRate: 0.16, // IVA del 16% en México
    defaultShipping: 99.00
  },
  {
    value: "USD",
    label: "Dólar Estadounidense (USD)",
    symbol: "$",
    locale: "en-US",
    taxRate: 0.08, // Promedio de sales tax en EE.UU.
    defaultShipping: 9.99
  },
  {
    value: "EUR",
    label: "Euro (EUR)",
    symbol: "€",
    locale: "es-ES",
    taxRate: 0.21, // IVA del 21% en España
    defaultShipping: 5.95
  },
  {
    value: "CAD",
    label: "Dólar Canadiense (CAD)",
    symbol: "C$",
    locale: "en-CA",
    taxRate: 0.13, // HST promedio en Canadá
    defaultShipping: 12.99
  },
  {
    value: "GBP",
    label: "Libra Esterlina (GBP)",
    symbol: "£",
    locale: "en-GB",
    taxRate: 0.20, // VAT del 20% en Reino Unido
    defaultShipping: 4.99
  },
  {
    value: "COP",
    label: "Peso Colombiano (COP)",
    symbol: "$",
    locale: "es-CO",
    taxRate: 0.19, // IVA del 19% en Colombia
    defaultShipping: 15000
  },
  {
    value: "ARS",
    label: "Peso Argentino (ARS)",
    symbol: "$",
    locale: "es-AR",
    taxRate: 0.21, // IVA del 21% en Argentina
    defaultShipping: 2500
  }
];

export const getCurrency = (currencyCode: string): Currency | undefined => {
  return currencies.find(currency => currency.value === currencyCode);
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    return `${amount.toFixed(2)}`;
  }

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = getCurrency(currencyCode);
  return currency?.symbol || "$";
};

export const getTaxRate = (currencyCode: string): number => {
  const currency = getCurrency(currencyCode);
  return currency?.taxRate || 0.16; // Por defecto 16% (México)
};

export const getDefaultShipping = (currencyCode: string): number => {
  const currency = getCurrency(currencyCode);
  return currency?.defaultShipping || 99.00; // Por defecto para México
}; 
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getCurrencyInfo, detectCurrencyFromWooCommerce, DEFAULT_CURRENCY } from '@/lib/currency';

interface CurrencyIndicatorProps {
  currency?: string;
  data?: any; // Datos de WooCommerce para detectar moneda automáticamente
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  showName?: boolean; // Mostrar nombre completo de la moneda
  className?: string;
}

export function CurrencyIndicator({
  currency,
  data,
  variant = 'outline',
  size = 'sm',
  showName = false,
  className
}: CurrencyIndicatorProps) {
  // Detectar la moneda a usar
  const finalCurrency = currency || (data ? detectCurrencyFromWooCommerce(data) : DEFAULT_CURRENCY);
  const currencyInfo = getCurrencyInfo(finalCurrency);

  const displayText = showName 
    ? `${currencyInfo.symbol} ${currencyInfo.name}` 
    : `${currencyInfo.symbol} ${finalCurrency}`;

  return (
    <Badge 
      variant={variant} 
      className={`${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'} ${className}`}
    >
      {displayText}
    </Badge>
  );
}

// Componente para mostrar múltiples monedas
interface MultiCurrencyIndicatorProps {
  currencies: string[];
  maxVisible?: number;
  className?: string;
}

export function MultiCurrencyIndicator({
  currencies,
  maxVisible = 3,
  className
}: MultiCurrencyIndicatorProps) {
  const uniqueCurrencies = [...new Set(currencies)];
  const visibleCurrencies = uniqueCurrencies.slice(0, maxVisible);
  const hiddenCount = uniqueCurrencies.length - maxVisible;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {visibleCurrencies.map((currency) => (
        <CurrencyIndicator 
          key={currency} 
          currency={currency} 
          variant="secondary" 
          size="sm" 
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}

// Hook para obtener información de moneda en componentes
export function useCurrency(currency?: string, data?: any) {
  const finalCurrency = currency || (data ? detectCurrencyFromWooCommerce(data) : DEFAULT_CURRENCY);
  const currencyInfo = getCurrencyInfo(finalCurrency);

  return {
    currency: finalCurrency,
    info: currencyInfo,
    symbol: currencyInfo.symbol,
    name: currencyInfo.name,
    isDefault: finalCurrency === DEFAULT_CURRENCY
  };
} 
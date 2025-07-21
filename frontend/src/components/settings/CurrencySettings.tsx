import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Settings, Globe, DollarSign } from 'lucide-react';
import { 
  getSupportedCurrencies, 
  DEFAULT_CURRENCY, 
  getCurrencyInfo,
  SupportedCurrency 
} from '@/lib/currency';

interface CurrencySettingsProps {
  currentCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  showAdvanced?: boolean;
}

export function CurrencySettings({
  currentCurrency = DEFAULT_CURRENCY,
  onCurrencyChange,
  showAdvanced = false
}: CurrencySettingsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const supportedCurrencies = getSupportedCurrencies();
  const currentCurrencyInfo = getCurrencyInfo(selectedCurrency);

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    onCurrencyChange?.(newCurrency);
  };

  return (
    <div className="space-y-6">
      {/* Configuración Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configuración de Moneda
          </CardTitle>
          <CardDescription>
            Configura la moneda por defecto para el panel de administración. 
            Los pedidos mantendrán su moneda original de WooCommerce.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Moneda por Defecto</label>
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{currency.symbol}</span>
                        <span>{currency.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {currency.code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vista Previa</label>
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground">Ejemplo:</div>
                <div className="text-lg font-semibold">
                  {currentCurrencyInfo.symbol}1,234.56
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentCurrencyInfo.name} ({selectedCurrency})
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Esta configuración solo afecta la visualización en el panel de administración. 
              Los pedidos de WooCommerce mantendrán su moneda original.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Monedas Soportadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Monedas Soportadas
          </CardTitle>
          <CardDescription>
            Lista de todas las monedas que el panel puede manejar automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedCurrencies.map((currency) => (
              <div 
                key={currency.code}
                className={`p-3 border rounded-lg transition-colors ${
                  currency.code === selectedCurrency 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono">{currency.symbol}</span>
                    <Badge variant={currency.code === selectedCurrency ? 'default' : 'outline'}>
                      {currency.code}
                    </Badge>
                  </div>
                  {currency.code === selectedCurrency && (
                    <Badge variant="default" className="text-xs">
                      Activa
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium">{currency.name}</div>
                <div className="text-xs text-muted-foreground">
                  Decimales: {currency.decimals} • Locale: {currency.locale}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuración Avanzada */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración Avanzada
            </CardTitle>
            <CardDescription>
              Opciones avanzadas para el manejo de monedas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Detección Automática:</strong> El sistema detecta automáticamente la moneda 
                de cada pedido desde los datos de WooCommerce y la formatea correctamente.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Comportamiento con Monedas No Soportadas</label>
                <div className="text-sm text-muted-foreground">
                  Si se encuentra una moneda no soportada, el sistema usará {DEFAULT_CURRENCY} como fallback 
                  y mostrará una advertencia en la consola.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Formato Regional</label>
                <div className="text-sm text-muted-foreground">
                  Cada moneda usa su formato regional apropiado (separadores de miles y decimales).
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente compacto para mostrar en configuraciones
export function CurrencySettingsCompact({
  currentCurrency = DEFAULT_CURRENCY,
  onCurrencyChange
}: Pick<CurrencySettingsProps, 'currentCurrency' | 'onCurrencyChange'>) {
  const supportedCurrencies = getSupportedCurrencies();
  const currentInfo = getCurrencyInfo(currentCurrency);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Moneda:</span>
      </div>
      
      <Select value={currentCurrency} onValueChange={onCurrencyChange}>
        <SelectTrigger className="w-48">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="font-mono">{currentInfo.symbol}</span>
              <span>{currentInfo.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span className="font-mono">{currency.symbol}</span>
                <span>{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 
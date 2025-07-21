export const COUNTRIES = {
  'ES': 'España',
  'MX': 'México',
  'US': 'Estados Unidos',
  'AR': 'Argentina',
  'CO': 'Colombia',
  'PE': 'Perú',
  'CL': 'Chile',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'UY': 'Uruguay',
  'PY': 'Paraguay',
  'CR': 'Costa Rica',
  'PA': 'Panamá',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'SV': 'El Salvador',
  'NI': 'Nicaragua',
  'CU': 'Cuba',
  'DO': 'República Dominicana',
  'PR': 'Puerto Rico',
  'BR': 'Brasil',
  'FR': 'Francia',
  'IT': 'Italia',
  'DE': 'Alemania',
  'GB': 'Reino Unido',
  'PT': 'Portugal',
  'CA': 'Canadá',
  'AU': 'Australia',
  'JP': 'Japón',
  'CN': 'China',
  'IN': 'India',
  'RU': 'Rusia',
} as const;

export const getCountryName = (countryCode?: string): string => {
  if (!countryCode) return '—';
  return COUNTRIES[countryCode as keyof typeof COUNTRIES] || countryCode;
};

export const getCountryFlag = (countryCode?: string): string => {
  if (!countryCode) return '';
  
  // Convertir código de país a emoji de bandera
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

export const formatCountryDisplay = (countryCode?: string): string => {
  if (!countryCode) return '—';
  
  const flag = getCountryFlag(countryCode);
  const name = getCountryName(countryCode);
  
  return `${flag} ${name}`;
}; 
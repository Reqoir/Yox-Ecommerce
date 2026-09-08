export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
];

/**
 * Parses an existing phone string into country code and local number.
 * Defaults to +91 if no country code prefix is detected.
 */
export function parsePhoneNumber(rawPhone?: string): { countryCode: string; number: string } {
  if (!rawPhone) {
    return { countryCode: '+91', number: '' };
  }

  const trimmed = rawPhone.trim();

  // Match against known country codes, longest prefix first
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const item of sorted) {
    if (trimmed.startsWith(item.code)) {
      const remaining = trimmed.slice(item.code.length).replace(/^[\s\-]+/, '');
      return { countryCode: item.code, number: remaining };
    }
  }

  // If starts with generic '+<digits>'
  const genericMatch = trimmed.match(/^(\+\d{1,4})\s*([\d\s\-()]+)$/);
  if (genericMatch) {
    return {
      countryCode: genericMatch[1],
      number: genericMatch[2].replace(/^[\s\-]+/, ''),
    };
  }

  return { countryCode: '+91', number: trimmed };
}

/**
 * Formats a country code and local phone number into a combined string.
 */
export function formatPhoneNumber(countryCode: string, number: string): string {
  const cleanNumber = number.trim();
  if (!cleanNumber) return '';
  const cleanCode = countryCode.trim();
  return `${cleanCode} ${cleanNumber}`;
}

/**
 * Retrieves country name associated with a calling code.
 */
export function getCountryByCode(code: string): string {
  const match = COUNTRY_CODES.find((c) => c.code === code);
  return match ? match.country : '';
}

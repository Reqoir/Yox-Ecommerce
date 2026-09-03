import { Product, LetterSize, WaistSize } from '@/types/product';

export const MOCK_PRODUCTS: Product[] = [];

export const ALL_CATEGORIES = [
  'Shirts',
  'T-Shirts',
  'Pants',
  'Hoodies',
  'Jackets',
  'Shorts',
  'Accessories'
];

export const SUBCATEGORIES_MAP: Record<string, string[]> = {
  Shirts: ['Casual Shirts', 'Formal Shirts', 'Linen Shirts', 'Overshirts'],
  'T-Shirts': ['Polo T-Shirts', 'Oversized Tees', 'Graphic Tees', 'Basic Tees'],
  Pants: ['Chinos', 'Cargo Pants', 'Jeans', 'Formal Trousers'],
  Hoodies: ['Zip-Up Hoodies', 'Pullover Hoodies', 'Sweatshirts'],
  Jackets: ['Denim Jackets', 'Bomber Jackets', 'Windbreakers'],
  Shorts: ['Cargo Shorts', 'Denim Shorts', 'Sweat Shorts'],
  Accessories: ['Belts', 'Caps', 'Socks', 'Sunglasses']
};

export const LETTER_SIZES: LetterSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const WAIST_SIZES: WaistSize[] = ['28', '30', '32', '34', '36', '38', '40'];
export const ALL_SIZES = [...LETTER_SIZES, ...WAIST_SIZES];

export const ALL_FITS = ['Slim Fit', 'Regular Fit', 'Oversized', 'Relaxed Fit'] as const;

export const ALL_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Crimson', hex: '#DC2626' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Navy', hex: '#1E293B' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Sky Blue', hex: '#38BDF8' },
  { name: 'Olive', hex: '#4D5D43' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Beige', hex: '#E5D3B3' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Charcoal', hex: '#374151' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'Tan', hex: '#D97706' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Mustard', hex: '#CA8A04' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Rust', hex: '#B45309' },
  { name: 'Gold', hex: '#EAB308' },
  { name: 'Silver', hex: '#E5E7EB' }
];

export function getColorHex(colorName: string): string {
  if (!colorName) return '#9CA3AF';
  const cleanName = colorName.trim().toLowerCase();
  const match = ALL_COLORS.find(c => c.name.toLowerCase() === cleanName);
  if (match) return match.hex;
  
  const basicColors: Record<string, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#22C55E',
    yellow: '#EAB308',
    black: '#000000',
    white: '#FFFFFF',
    pink: '#EC4899',
    purple: '#A855F7',
    orange: '#F97316',
    gray: '#6B7280',
    grey: '#6B7280',
    brown: '#78350F',
    maroon: '#800000',
    navy: '#1E293B',
    olive: '#4D5D43',
    beige: '#E5D3B3',
  };
  
  for (const [key, hex] of Object.entries(basicColors)) {
    if (cleanName.includes(key)) return hex;
  }
  
  return '#9CA3AF';
}

export const SORT_OPTIONS_LIST = [
  'Relevance',
  'Price: Low to High',
  'Price: High to Low',
  'Newest Arrivals',
  'Discount'
] as const;

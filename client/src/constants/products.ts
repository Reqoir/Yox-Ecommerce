import { Product, LetterSize, WaistSize } from '@/types/product';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Men Textured Regular Fit Polo T-shirt',
    category: 'T-Shirts',
    subCategory: 'Polo T-Shirts',
    image: '/images/new-popular/shirts/1.webp',
    images: [
      '/images/new-popular/shirts/1.webp',
      '/images/new-popular/shirts/2.webp',
      '/images/new-popular/shirts/3.webp',
      '/images/new-popular/shirts/4.webp',
      '/images/new-popular/shirts/5.webp',
      '/images/new-popular/shirts/6.webp'
    ],
    price: 799,
    originalPrice: 999,
    bestPrice: 699,
    tag: 'NEW',
    sizes: ['M', 'L', 'XL'],
    colors: ['Olive', 'Navy'],
    fit: 'Regular Fit',
    rating: 4.5,
    description: 'Classic textured polo t-shirt crafted from breathable cotton blend fabric.',
    inStock: true
  },
  {
    id: 2,
    name: 'URB_N Men Oversized Graphic Printed T-shirt',
    category: 'T-Shirts',
    subCategory: 'Oversized Tees',
    image: '/images/new-popular/shirts/2.webp',
    images: [
      '/images/new-popular/shirts/2.webp',
      '/images/new-popular/shirts/3.webp',
      '/images/new-popular/shirts/4.webp',
      '/images/new-popular/shirts/5.webp',
      '/images/new-popular/shirts/7.webp',
      '/images/new-popular/shirts/8.webp'
    ],
    price: 559,
    originalPrice: 699,
    bestPrice: 489,
    tag: 'ON OFFER',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White'],
    fit: 'Oversized',
    rating: 4.8,
    description: 'Trendy streetwear oversized graphic tee with premium soft finish.',
    inStock: true
  },
  {
    id: 3,
    name: 'Men Slim Fit Solid Polo T-shirt',
    category: 'T-Shirts',
    subCategory: 'Polo T-Shirts',
    image: '/images/new-popular/shirts/3.webp',
    price: 349,
    originalPrice: 399,
    bestPrice: 305,
    tag: 'ON OFFER',
    sizes: ['M', 'L'],
    colors: ['Navy', 'Grey'],
    fit: 'Slim Fit',
    rating: 4.2,
    description: 'Sleek slim fit solid polo shirt ideal for casual and smart casual wear.',
    inStock: true
  },
  {
    id: 4,
    name: 'Men Premium Casual Striped Shirt',
    category: 'Shirts',
    subCategory: 'Casual Shirts',
    image: '/images/new-popular/shirts/4.webp',
    price: 899,
    originalPrice: 1299,
    bestPrice: 799,
    tag: 'BESTSELLER',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue', 'White'],
    fit: 'Regular Fit',
    rating: 4.7,
    description: 'Breathable cotton striped shirt perfect for modern everyday styling.',
    inStock: true
  },
  {
    id: 5,
    name: 'Men Casual Linen Blend Shirt',
    category: 'Shirts',
    subCategory: 'Linen Shirts',
    image: '/images/new-popular/shirts/5.webp',
    price: 1199,
    originalPrice: 1599,
    bestPrice: 999,
    tag: 'NEW',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Beige', 'White'],
    fit: 'Relaxed Fit',
    rating: 4.6,
    description: 'Lightweight linen blend casual shirt for lightweight summer comfort.',
    inStock: true
  },
  {
    id: 6,
    name: 'Men Heavyweight Fleece Hoodie',
    category: 'Hoodies',
    subCategory: 'Sweatshirts',
    image: '/images/new-popular/shirts/6.webp',
    price: 1499,
    originalPrice: 1999,
    bestPrice: 1299,
    tag: 'ON OFFER',
    sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    colors: ['Black', 'Olive'],
    fit: 'Oversized',
    rating: 4.9,
    description: 'Warm heavyweight fleece hoodie with front kangaroo pocket.',
    inStock: true
  },
  {
    id: 7,
    name: 'Men Slim Fit Stretch Chino Pants',
    category: 'Pants',
    subCategory: 'Chinos',
    image: '/images/new-popular/shirts/7.webp',
    price: 1299,
    originalPrice: 1699,
    bestPrice: 1099,
    tag: 'BESTSELLER',
    sizes: ['30', '32', '34', '36'],
    colors: ['Khaki', 'Navy'],
    fit: 'Slim Fit',
    rating: 4.4,
    description: 'Versatile stretch chinos tailored for all-day comfort and sharp looks.',
    inStock: true
  },
  {
    id: 8,
    name: 'Men Relaxed Fit Multi-Pocket Cargo Pants',
    category: 'Pants',
    subCategory: 'Cargo Pants',
    image: '/images/new-popular/shirts/8.webp',
    price: 1599,
    originalPrice: 1999,
    bestPrice: 1399,
    tag: 'LIMITED',
    sizes: ['28', '30', '32', '34', '36', '38'],
    colors: ['Olive', 'Black'],
    fit: 'Relaxed Fit',
    rating: 4.7,
    description: 'Utility inspired cargo trousers featuring multiple deep flap pockets.',
    inStock: true
  },
  {
    id: 9,
    name: 'Men Tapered Fit Heavy Denim Jeans',
    category: 'Pants',
    subCategory: 'Jeans',
    image: '/images/new-popular/shirts/9.webp',
    price: 1899,
    originalPrice: 2499,
    bestPrice: 1699,
    tag: 'NEW',
    sizes: ['30', '32', '34', '36', '38', '40'],
    colors: ['Blue', 'Black'],
    fit: 'Slim Fit',
    rating: 4.8,
    description: 'Durable cotton denim jeans with tapered leg cut and vintage wash.',
    inStock: true
  }
];

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

export type ProductCategory = 
  | 'Shirts' 
  | 'T-Shirts' 
  | 'Pants' 
  | 'Hoodies' 
  | 'Jackets' 
  | 'Shorts' 
  | 'Accessories';

export type ProductFit = 'Slim Fit' | 'Regular Fit' | 'Oversized' | 'Relaxed Fit';

export type LetterSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
export type WaistSize = '28' | '30' | '32' | '34' | '36' | '38' | '40';
export type ProductSize = LetterSize | WaistSize;

export type ProductTag = 'NEW' | 'ON OFFER' | 'BESTSELLER' | 'LIMITED';

export interface Product {
  id: number | string;
  colorCardId?: string;
  productId?: string;
  currentColor?: string;
  href?: string;
  name: string;
  category: ProductCategory;
  subCategory?: string;
  image: string;
  images?: string[];
  price: number;
  originalPrice?: number | null;
  bestPrice: number;
  tag?: ProductTag;
  sizes: ProductSize[];
  colors: string[];
  fit?: ProductFit;
  rating?: number;
  description?: string;
  inStock?: boolean;
}

export type SortOption = 
  | 'Relevance'
  | 'Price: Low to High'
  | 'Price: High to Low'
  | 'Newest Arrivals'
  | 'Discount';

export interface ProductFilterState {
  searchQuery: string;
  category: string | null;
  subCategory: string | null;
  minPrice: number;
  maxPrice: number;
  sizes: ProductSize[];
  fits: ProductFit[];
  colors: string[];
  tags: ProductTag[];
  sortBy: SortOption;
}

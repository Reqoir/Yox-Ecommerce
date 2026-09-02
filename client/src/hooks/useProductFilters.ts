"use client";

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/constants/products';
import { useProducts } from '@/hooks/admin/useProducts';
import { useCategories } from '@/hooks/admin/useCategories';
import { Product, ProductFit, ProductSize, ProductTag, SortOption } from '@/types/product';

export function useProductFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { products: dbProducts } = useProducts();
  const { categories: apiCategories } = useCategories();

  // Map category ID to Category Name for display
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    apiCategories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [apiCategories]);

  // Combine database products with fallback mock products (split by color variant)
  const allProducts = useMemo<Product[]>(() => {
    if (dbProducts && dbProducts.length > 0) {
      const expanded: Product[] = [];

      dbProducts.forEach((p, idx) => {
        const variants = p.variants || [];
        const catName = p.categoryId ? categoryMap.get(p.categoryId) || p.categoryId : 'Apparel';
        const subCatName = p.subCategoryId ? categoryMap.get(p.subCategoryId) || p.subCategoryId : undefined;

        // Group variants by color
        const colorMap = new Map<string, typeof variants>();

        variants.forEach(v => {
          const colorKey = (v.color || 'Default').trim();
          if (!colorMap.has(colorKey)) {
            colorMap.set(colorKey, []);
          }
          colorMap.get(colorKey)!.push(v);
        });

        // If no variants exist or no colors defined
        if (colorMap.size === 0) {
          expanded.push({
            id: (p.id as any) || idx + 100,
            productId: p.id,
            colorCardId: `${p.id}-default`,
            name: p.name,
            category: catName as any,
            subCategory: subCatName,
            image: p.thumbnail || '/images/product-1.jpeg',
            price: 999,
            bestPrice: 899,
            tag: (p.tag as ProductTag) || undefined,
            sizes: [],
            colors: [],
            fit: (p.fit as ProductFit) || undefined,
            description: p.description || p.shortDescription || undefined,
            inStock: p.isActive,
            href: `/product/${p.id}`,
          });
          return;
        }

        // For each color group, create an individual product card
        colorMap.forEach((colorVariants, colorName) => {
          const sizes = Array.from(new Set(colorVariants.map(v => v.size).filter(Boolean))) as ProductSize[];
          
          let minPrice = 999;
          let originalPrice: number | undefined = undefined;

          const validPrices = colorVariants.map(v => v.price).filter(price => typeof price === 'number' && price > 0);
          if (validPrices.length > 0) {
            minPrice = Math.min(...validPrices);
          }

          const validComparePrices = colorVariants
            .map(v => v.comparePrice)
            .filter((cp): cp is number => typeof cp === 'number' && cp > 0);
          if (validComparePrices.length > 0) {
            originalPrice = Math.max(...validComparePrices);
          }

          // First image of this color variant group, falling back to p.thumbnail
          const variantImages = colorVariants.flatMap(v => v.images || []).filter(Boolean);
          const firstImage = variantImages[0] || p.thumbnail || '/images/product-1.jpeg';

          const isDefaultColor = colorName.toLowerCase() === 'default';
          const href = isDefaultColor 
            ? `/product/${p.id}` 
            : `/product/${p.id}?color=${encodeURIComponent(colorName)}`;

          expanded.push({
            id: isDefaultColor ? p.id : `${p.id}-${colorName}`,
            productId: p.id,
            colorCardId: `${p.id}-${colorName}`,
            currentColor: isDefaultColor ? undefined : colorName,
            name: p.name,
            category: catName as any,
            subCategory: subCatName,
            image: firstImage,
            images: variantImages.length > 0 ? variantImages : [firstImage],
            price: minPrice,
            originalPrice: originalPrice,
            bestPrice: Math.round(minPrice * 0.9),
            tag: (p.tag as ProductTag) || undefined,
            sizes: sizes,
            colors: [colorName],
            fit: (p.fit as ProductFit) || undefined,
            description: p.description || p.shortDescription || undefined,
            inStock: p.isActive && colorVariants.some(v => (v.stock || 0) > 0),
            href: href,
          });
        });
      });

      return expanded;
    }
    return MOCK_PRODUCTS;
  }, [dbProducts, categoryMap]);

  // Read current filter state from URL search params
  const searchQuery = searchParams.get('search') || '';
  const category = searchParams.get('category') || null;
  const subCategory = searchParams.get('subcategory') || null;
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || 10000;
  const sortBy = (searchParams.get('sort') as SortOption) || 'Relevance';

  const selectedSizes = useMemo(() => {
    const raw = searchParams.get('sizes');
    return raw ? (raw.split(',') as ProductSize[]) : [];
  }, [searchParams]);

  const selectedFits = useMemo(() => {
    const raw = searchParams.get('fits');
    return raw ? (raw.split(',') as ProductFit[]) : [];
  }, [searchParams]);

  const selectedTags = useMemo(() => {
    const raw = searchParams.get('tags');
    return raw ? (raw.split(',') as ProductTag[]) : [];
  }, [searchParams]);

  const selectedColors = useMemo(() => {
    const raw = searchParams.get('colors');
    return raw ? raw.split(',') : [];
  }, [searchParams]);

  // Dynamically extract available Sizes, Fits, Colors, and Tags directly from current database products catalog
  const availableSizes = useMemo(() => {
    const sizes = new Set<ProductSize>();
    allProducts.forEach((p) => {
      p.sizes?.forEach((s) => { if (s) sizes.add(s); });
    });
    return Array.from(sizes);
  }, [allProducts]);

  const availableFits = useMemo(() => {
    const fits = new Set<ProductFit>();
    allProducts.forEach((p) => {
      if (p.fit) fits.add(p.fit);
    });
    return Array.from(fits);
  }, [allProducts]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    allProducts.forEach((p) => {
      p.colors?.forEach((c) => { if (c) colors.add(c); });
    });
    return Array.from(colors);
  }, [allProducts]);

  const availableTags = useMemo(() => {
    const tags = new Set<ProductTag>();
    allProducts.forEach((p) => {
      if (p.tag) tags.add(p.tag);
    });
    return Array.from(tags);
  }, [allProducts]);

  // Helper to update search parameters in URL
  const updateQueryParams = useCallback(
    (newParams: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (
          value === null || 
          value === undefined || 
          value === '' || 
          (value === 0 && key === 'minPrice') || 
          (value === 10000 && key === 'maxPrice')
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const queryString = params.toString();
      const targetUrl = queryString ? `/shop?${queryString}` : '/shop';

      if (pathname === '/shop') {
        router.replace(targetUrl, { scroll: false });
      } else {
        router.push(targetUrl);
      }
    },
    [pathname, router, searchParams]
  );

  // Setters
  const setSearchQuery = useCallback(
    (query: string) => {
      updateQueryParams({ search: query.trim() ? query : null });
    },
    [updateQueryParams]
  );

  const setCategory = useCallback(
    (cat: string | null) => {
      updateQueryParams({ category: cat ? cat.toLowerCase() : null, subcategory: null });
    },
    [updateQueryParams]
  );

  const setSubCategory = useCallback(
    (subCat: string | null) => {
      updateQueryParams({ subcategory: subCat ? subCat.toLowerCase() : null });
    },
    [updateQueryParams]
  );

  const setPriceRange = useCallback(
    (range: [number, number]) => {
      updateQueryParams({
        minPrice: range[0] > 0 ? range[0] : null,
        maxPrice: range[1] < 10000 ? range[1] : null,
      });
    },
    [updateQueryParams]
  );

  const toggleSize = useCallback(
    (size: ProductSize) => {
      const nextSizes = selectedSizes.includes(size)
        ? selectedSizes.filter((s) => s !== size)
        : [...selectedSizes, size];
      updateQueryParams({ sizes: nextSizes.length ? nextSizes.join(',') : null });
    },
    [selectedSizes, updateQueryParams]
  );

  const toggleFit = useCallback(
    (fit: ProductFit) => {
      const nextFits = selectedFits.includes(fit)
        ? selectedFits.filter((f) => f !== fit)
        : [...selectedFits, fit];
      updateQueryParams({ fits: nextFits.length ? nextFits.join(',') : null });
    },
    [selectedFits, updateQueryParams]
  );

  const toggleColor = useCallback(
    (color: string) => {
      const nextColors = selectedColors.includes(color)
        ? selectedColors.filter((c) => c !== color)
        : [...selectedColors, color];
      updateQueryParams({ colors: nextColors.length ? nextColors.join(',') : null });
    },
    [selectedColors, updateQueryParams]
  );

  const toggleTag = useCallback(
    (tag: ProductTag) => {
      const nextTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      updateQueryParams({ tags: nextTags.length ? nextTags.join(',') : null });
    },
    [selectedTags, updateQueryParams]
  );

  const setSortBy = useCallback(
    (sort: SortOption) => {
      updateQueryParams({ sort: sort === 'Relevance' ? null : sort });
    },
    [updateQueryParams]
  );

  const clearAllFilters = useCallback(() => {
    if (pathname === '/shop') {
      router.replace('/shop', { scroll: false });
    } else {
      router.push('/shop');
    }
  }, [pathname, router]);

  // Compute filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.tag && p.tag.toLowerCase().includes(q)) ||
          (p.currentColor && p.currentColor.toLowerCase().includes(q))
      );
    }

    // Category match
    if (category) {
      const catLower = category.toLowerCase();
      result = result.filter((p) => p.category.toLowerCase() === catLower);
    }

    // SubCategory match
    if (subCategory) {
      const subLower = subCategory.toLowerCase();
      result = result.filter((p) => p.subCategory && p.subCategory.toLowerCase() === subLower);
    }

    // Price range match
    result = result.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Sizes match
    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes && p.sizes.some((s) => selectedSizes.includes(s)));
    }

    // Fits match
    if (selectedFits.length > 0) {
      result = result.filter((p) => p.fit && selectedFits.includes(p.fit));
    }

    // Colors match
    if (selectedColors.length > 0) {
      result = result.filter((p) => p.colors && p.colors.some((c) => selectedColors.includes(c)));
    }

    // Tags match
    if (selectedTags.length > 0) {
      result = result.filter((p) => p.tag && selectedTags.includes(p.tag));
    }

    // Sorting
    switch (sortBy) {
      case 'Price: Low to High':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Newest Arrivals':
        result.sort((a, b) => (b.tag === 'NEW' ? 1 : 0) - (a.tag === 'NEW' ? 1 : 0));
        break;
      case 'Discount':
        result.sort((a, b) => {
          const discountA = a.originalPrice ? a.originalPrice - a.price : 0;
          const discountB = b.originalPrice ? b.originalPrice - b.price : 0;
          return discountB - discountA;
        });
        break;
      default:
        break;
    }

    return result;
  }, [
    allProducts,
    searchQuery,
    category,
    subCategory,
    minPrice,
    maxPrice,
    selectedSizes,
    selectedFits,
    selectedColors,
    selectedTags,
    sortBy,
  ]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (category) count++;
    if (subCategory) count++;
    if (minPrice > 0 || maxPrice < 10000) count++;
    count += selectedSizes.length;
    count += selectedFits.length;
    count += selectedColors.length;
    count += selectedTags.length;
    return count;
  }, [
    searchQuery,
    category,
    subCategory,
    minPrice,
    maxPrice,
    selectedSizes,
    selectedFits,
    selectedColors,
    selectedTags,
  ]);

  return {
    searchQuery,
    category,
    subCategory,
    minPrice,
    maxPrice,
    selectedSizes,
    selectedFits,
    selectedColors,
    selectedTags,
    sortBy,
    filteredProducts,
    activeFilterCount,
    availableSizes,
    availableFits,
    availableColors,
    availableTags,
    setSearchQuery,
    setCategory,
    setSubCategory,
    setPriceRange,
    toggleSize,
    toggleFit,
    toggleColor,
    toggleTag,
    setSortBy,
    clearAllFilters,
  };
}

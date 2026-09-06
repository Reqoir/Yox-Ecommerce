"use client";

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useProducts } from '@/hooks/admin/useProducts';
import { useCategories } from '@/hooks/admin/useCategories';
import { useBrands } from '@/hooks/admin/useBrands';
import { useQuery } from '@tanstack/react-query';
import { offersApi } from '@/api/admin/offers';
import { productApi } from '@/api/admin/products';
import { calculateBestOffer } from '@/lib/offers';
import { matchesProductSearch } from '@/lib/search';
import { Product, ProductFit, ProductSize, ProductTag, SortOption } from '@/types/product';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export function useProductFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const {
    products: dbProducts,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProducts();
  const { categories: apiCategories } = useCategories();
  const { brands: apiBrands } = useBrands();

  const { data: activeOffers = [] } = useQuery({
    queryKey: ['active-offers'],
    queryFn: offersApi.getActive,
  });

  const { data: filterFacets, isLoading: isFacetsLoading } = useQuery({
    queryKey: ['product-filter-facets'],
    queryFn: () => productApi.getFilters(),
    staleTime: 60 * 1000,
  });

  // Map category ID to Category Name for display
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    apiCategories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [apiCategories]);

  // Map brand ID to Brand Name for display and search
  const brandMap = useMemo(() => {
    const map = new Map<string, string>();
    apiBrands.forEach(b => map.set(b.id, b.name));
    return map;
  }, [apiBrands]);

  // Combine database products with fallback mock products (split by color variant)
  const allProducts = useMemo<Product[]>(() => {
    if (dbProducts && dbProducts.length > 0) {
      const expanded: Product[] = [];

      dbProducts.forEach((p, idx) => {
        const variants = p.variants || [];
        const catName = p.categoryId ? categoryMap.get(p.categoryId) || p.categoryId : 'Apparel';
        const subCatName = p.subCategoryId ? categoryMap.get(p.subCategoryId) || p.subCategoryId : undefined;
        const brandName = p.brandId ? brandMap.get(p.brandId) || (p as any).brand || (p as any).brandName : (p as any).brand || undefined;
        const allProductColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));

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
          const allVariantImages = variants.flatMap(v => v.images || []).filter(Boolean);
          const allImgs = Array.from(new Set([
            ...(p.thumbnail ? [p.thumbnail] : []),
            ...allVariantImages,
          ]));
          const primaryImg = allImgs[0] || p.thumbnail || '/images/product-1.jpeg';
          const secondImg = allImgs.length > 1 ? allImgs[1] : null;

          expanded.push({
            id: (p.id as any) || idx + 100,
            productId: p.id,
            colorCardId: `${p.id}-default`,
            name: p.name,
            brand: brandName,
            categoryId: p.categoryId,
            subCategoryId: p.subCategoryId,
            category: catName as any,
            subCategory: subCatName,
            image: optimizeCloudinaryUrl(primaryImg),
            secondImage: secondImg ? optimizeCloudinaryUrl(secondImg) : null,
            images: allImgs.length > 0 ? allImgs.map(img => optimizeCloudinaryUrl(img)) : [optimizeCloudinaryUrl(primaryImg)],
            price: 999,
            bestPrice: 899,
            tag: (p.tag as ProductTag) || undefined,
            sizes: [],
            colors: allProductColors,
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
          const allVariantImages = variants.flatMap(v => v.images || []).filter(Boolean);
          const firstImage = variantImages[0] || p.thumbnail || allVariantImages[0] || '/images/product-1.jpeg';

          // Second image: use second image of this color variant; fallback to other variants or thumbnail
          const secondImage = 
            variantImages.find((img) => img !== firstImage) ||
            allVariantImages.find((img) => img !== firstImage) ||
            (p.thumbnail && p.thumbnail !== firstImage ? p.thumbnail : null) ||
            null;

          const combinedImages = Array.from(
            new Set([firstImage, ...(secondImage ? [secondImage] : []), ...variantImages])
          );

          const isDefaultColor = colorName.toLowerCase() === 'default';
          const href = isDefaultColor
            ? `/product/${p.id}`
            : `/product/${p.id}?color=${encodeURIComponent(colorName)}`;

          // Evaluate active best offer for this product
          const offerResult = calculateBestOffer(p, minPrice, activeOffers, originalPrice);
          const finalCardPrice = offerResult.hasOffer ? offerResult.discountedPrice : minPrice;
          const finalStrikePrice = offerResult.hasOffer
            ? offerResult.originalPrice
            : (originalPrice && originalPrice > minPrice ? originalPrice : undefined);

          expanded.push({
            id: isDefaultColor ? p.id : `${p.id}-${colorName}`,
            productId: p.id,
            colorCardId: `${p.id}-${colorName}`,
            currentColor: isDefaultColor ? undefined : colorName,
            name: p.name,
            brand: brandName,
            categoryId: p.categoryId,
            subCategoryId: p.subCategoryId,
            category: catName as any,
            subCategory: subCatName,
            image: optimizeCloudinaryUrl(firstImage),
            secondImage: secondImage ? optimizeCloudinaryUrl(secondImage) : null,
            images: combinedImages.map(img => optimizeCloudinaryUrl(img)),
            price: finalCardPrice,
            originalPrice: finalStrikePrice,
            bestPrice: Math.round(finalCardPrice * 0.9),
            tag: (p.tag as ProductTag) || undefined,
            offerTitle: offerResult.bestOffer?.title,
            offerBadge: offerResult.badgeText || undefined,
            offerSavings: offerResult.savings || undefined,
            offerDiscountPct: offerResult.discountPercentage || undefined,
            sizes: sizes,
            colors: allProductColors.length > 0 ? allProductColors : [colorName],
            fit: (p.fit as ProductFit) || undefined,
            description: p.description || p.shortDescription || undefined,
            inStock: p.isActive && colorVariants.some(v => (v.stock || 0) > 0),
            href: href,
          });
        });
      });

      return expanded;
    }
    return [];
  }, [dbProducts, categoryMap, brandMap, activeOffers]);

  // Read current filter state from URL search params
  const searchQuery = searchParams.get('search') || '';
  const category = searchParams.get('category') || null;
  const subCategory = searchParams.get('subcategory') || null;
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || 10000;
  const sortBy = (searchParams.get('sort') as SortOption) || 'Relevance';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const onSaleOnly = searchParams.get('onSale') === 'true';

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
        const lowerKey = key.toLowerCase();
        // Delete all matching existing keys case-insensitively
        for (const existingKey of Array.from(params.keys())) {
          if (existingKey.toLowerCase() === lowerKey) {
            params.delete(existingKey);
          }
        }

        if (
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !(value === 0 && lowerKey === 'minprice') &&
          !(value === 10000 && lowerKey === 'maxprice')
        ) {
          params.set(lowerKey, String(value));
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
      updateQueryParams({
        category: cat ? cat.toLowerCase() : null,
        subcategory: null,
        subCategory: null,
      });
    },
    [updateQueryParams]
  );

  const setSubCategory = useCallback(
    (subCat: string | null) => {
      updateQueryParams({ subcategory: subCat ? subCat.toLowerCase() : null, subCategory: null });
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

  const toggleInStock = useCallback(() => {
    updateQueryParams({ inStock: inStockOnly ? null : 'true' });
  }, [inStockOnly, updateQueryParams]);

  const toggleOnSale = useCallback(() => {
    updateQueryParams({ onSale: onSaleOnly ? null : 'true' });
  }, [onSaleOnly, updateQueryParams]);

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

    // Search query match (multi-token matching for name, brand, color, category, subCategory, description)
    if (searchQuery.trim()) {
      result = result.filter((p) => matchesProductSearch(p, searchQuery));
    }

    // Category match (supports parent category or subcategory by slug, name, or ID)
    if (category) {
      const catLower = category.toLowerCase().trim();
      const matchedCat = apiCategories.find(
        (c) =>
          c.slug?.toLowerCase() === catLower ||
          c.name.toLowerCase() === catLower ||
          c.id === category
      );

      if (matchedCat) {
        if (matchedCat.parentCategoryId) {
          // If the query category is a subcategory, match against subCategory or subCategoryId
          result = result.filter(
            (p) =>
              p.subCategory?.toLowerCase() === matchedCat.name.toLowerCase() ||
              p.subCategory?.toLowerCase() === matchedCat.slug.toLowerCase() ||
              p.subCategoryId === matchedCat.id ||
              p.category?.toLowerCase() === matchedCat.name.toLowerCase()
          );
        } else {
          // If the query category is a parent category, match against category or categoryId or any child subcategories
          const childSubCategoryIds = new Set(
            apiCategories.filter((c) => c.parentCategoryId === matchedCat.id).map((c) => c.id)
          );
          const childSubCategoryNames = new Set(
            apiCategories
              .filter((c) => c.parentCategoryId === matchedCat.id)
              .map((c) => c.name.toLowerCase())
          );

          result = result.filter(
            (p) =>
              p.category?.toLowerCase() === matchedCat.name.toLowerCase() ||
              p.category?.toLowerCase() === matchedCat.slug.toLowerCase() ||
              p.categoryId === matchedCat.id ||
              (p.subCategoryId && childSubCategoryIds.has(p.subCategoryId)) ||
              (p.subCategory && childSubCategoryNames.has(p.subCategory.toLowerCase()))
          );
        }
      } else {
        // Fallback: match either category or subCategory loosely (name or slug format)
        const normalizedParam = catLower.replace(/[-\s]/g, '');
        result = result.filter((p) => {
          const pCatNorm = p.category?.toLowerCase().replace(/[-\s]/g, '') || '';
          const pSubNorm = p.subCategory?.toLowerCase().replace(/[-\s]/g, '') || '';
          return (
            p.category?.toLowerCase() === catLower ||
            p.subCategory?.toLowerCase() === catLower ||
            pCatNorm === normalizedParam ||
            pSubNorm === normalizedParam
          );
        });
      }
    }

    // SubCategory match
    if (subCategory) {
      const subLower = subCategory.toLowerCase().trim();
      const matchedSub = apiCategories.find(
        (c) =>
          c.slug?.toLowerCase() === subLower ||
          c.name.toLowerCase() === subLower ||
          c.id === subCategory
      );

      if (matchedSub) {
        result = result.filter(
          (p) =>
            p.subCategory?.toLowerCase() === matchedSub.name.toLowerCase() ||
            p.subCategory?.toLowerCase() === matchedSub.slug.toLowerCase() ||
            p.subCategoryId === matchedSub.id
        );
      } else {
        const normalizedSub = subLower.replace(/[-\s]/g, '');
        result = result.filter((p) => {
          const pSubNorm = p.subCategory?.toLowerCase().replace(/[-\s]/g, '') || '';
          return p.subCategory?.toLowerCase() === subLower || pSubNorm === normalizedSub;
        });
      }
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

    // In Stock Only
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    // On Sale / Offers Only
    if (onSaleOnly) {
      result = result.filter((p) => p.offerSavings || (p.originalPrice && p.originalPrice > p.price) || (p.tag as string) === 'SALE' || p.tag === 'ON OFFER');
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
    inStockOnly,
    onSaleOnly,
    sortBy,
    apiCategories,
  ]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (category) count++;
    if (subCategory) count++;
    if (minPrice > 0 || maxPrice < 10000) count++;
    if (inStockOnly) count++;
    if (onSaleOnly) count++;
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
    inStockOnly,
    onSaleOnly,
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
    inStockOnly,
    onSaleOnly,
    sortBy,
    allProducts,
    filteredProducts,
    filterFacets,
    isFacetsLoading,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
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
    toggleInStock,
    toggleOnSale,
    setSortBy,
    clearAllFilters,
  };
}

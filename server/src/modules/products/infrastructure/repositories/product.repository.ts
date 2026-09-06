/**
 * @file product.repository.ts
 * @layer Infrastructure › Repositories
 * 
 * Implements the ProductRepository using Mongoose with comprehensive
 * e-commerce filtering, faceted search, and sorting.
 */

import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductModel, IProductDocument } from '../models/product.model';
import { ProductVariantModel } from '../models/product-variant.model';
import { CategoryModel } from '../../../categories/infrastructure/models/category.model';
import { BrandModel } from '../../../brands/infrastructure/models/brand.model';
import { Types } from 'mongoose';

export class ProductRepository implements IProductRepository {

  private mapToDomain(doc: IProductDocument): Product {
    const data = doc.toObject();
    return Product.reconstitute({
      id: data.id,
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      brandId: data.brandId,
      shortDescription: data.shortDescription,
      description: data.description,
      thumbnail: data.thumbnail,
      fit: data.fit,
      tag: data.tag,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      salesCount: data.salesCount,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(product: Product): Promise<Product> {
    const data = product.toJSON();
    const { id, ...rest } = data;

    if (id) {
      const updated = await ProductModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('Product not found');
      return this.mapToDomain(updated);
    } else {
      const created = new ProductModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async findById(id: string): Promise<Product | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ProductModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;
    const trimmed = slug.trim();
    let doc = await ProductModel.findOne({ slug: trimmed }).exec();
    if (!doc) {
      doc = await ProductModel.findOne({ slug: new RegExp(`^${trimmed}$`, 'i') }).exec();
    }
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(query: any): Promise<{ data: Product[]; total: number }> {
    const filter: any = {};

    // 1. Active status (default: only active products for public requests, unless specified)
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === true || query.isActive === 'true';
    } else {
      filter.isActive = true;
    }

    // 2. Featured filter
    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured === true || query.isFeatured === 'true';
    }

    // 3. Category filtering (supports categoryId, categoryIds, or category slug/name)
    const categoryIds: string[] = [];
    if (query.categoryId) {
      categoryIds.push(query.categoryId);
    }
    if (query.categoryIds) {
      const ids = Array.isArray(query.categoryIds)
        ? query.categoryIds
        : String(query.categoryIds).split(',').map(s => s.trim()).filter(Boolean);
      categoryIds.push(...ids);
    }
    if (query.category || query.categorySlug) {
      const catParam = (query.category || query.categorySlug).trim();
      const matchedCat = await CategoryModel.findOne({
        $or: [
          { slug: new RegExp(`^${catParam}$`, 'i') },
          { name: new RegExp(`^${catParam}$`, 'i') },
        ],
      }).select('_id parentCategoryId').lean() as any;
      if (matchedCat) {
        if (matchedCat.parentCategoryId) {
          // If the queried category is a subcategory, match either subCategoryId or categoryId
          const subId = matchedCat._id.toString();
          filter.$or = [
            { subCategoryId: subId },
            { categoryId: subId },
          ];
        } else {
          // If the queried category is a parent category, include its ID and any child subcategories
          categoryIds.push(matchedCat._id.toString());
          const childSubCats = await CategoryModel.find({
            parentCategoryId: matchedCat._id.toString(),
          }).select('_id').lean();
          const childIds = childSubCats.map((c: any) => c._id.toString());
          categoryIds.push(...childIds);
        }
      } else {
        // If specified category slug doesn't exist, return empty result
        return { data: [], total: 0 };
      }
    }

    if (categoryIds.length > 0 && !filter.$or) {
      const uniqueCatIds = Array.from(new Set(categoryIds));
      filter.$or = [
        { categoryId: uniqueCatIds.length === 1 ? uniqueCatIds[0] : { $in: uniqueCatIds } },
        { subCategoryId: uniqueCatIds.length === 1 ? uniqueCatIds[0] : { $in: uniqueCatIds } },
      ];
    }

    // 4. SubCategory filtering
    const subCategoryIds: string[] = [];
    if (query.subCategoryId) subCategoryIds.push(query.subCategoryId);
    if (query.subCategoryIds) {
      const ids = Array.isArray(query.subCategoryIds)
        ? query.subCategoryIds
        : String(query.subCategoryIds).split(',').map(s => s.trim()).filter(Boolean);
      subCategoryIds.push(...ids);
    }
    if (query.subCategory || query.subCategorySlug) {
      const subCatParam = (query.subCategory || query.subCategorySlug).trim();
      const matchedSubCat = await CategoryModel.findOne({
        $or: [
          { slug: new RegExp(`^${subCatParam}$`, 'i') },
          { name: new RegExp(`^${subCatParam}$`, 'i') },
        ],
      }).select('_id').lean();
      if (matchedSubCat) {
        subCategoryIds.push(matchedSubCat._id.toString());
      } else {
        return { data: [], total: 0 };
      }
    }
    if (subCategoryIds.length > 0) {
      const uniqueSubCatIds = Array.from(new Set(subCategoryIds));
      filter.subCategoryId = uniqueSubCatIds.length === 1 ? uniqueSubCatIds[0] : { $in: uniqueSubCatIds };
    }

    // 5. Brand filtering (supports brandId, brandIds, or brand slug/name)
    const brandIds: string[] = [];
    if (query.brandId) brandIds.push(query.brandId);
    if (query.brandIds) {
      const ids = Array.isArray(query.brandIds)
        ? query.brandIds
        : String(query.brandIds).split(',').map(s => s.trim()).filter(Boolean);
      brandIds.push(...ids);
    }
    if (query.brand || query.brandSlug) {
      const brandParam = (query.brand || query.brandSlug).trim();
      const matchedBrand = await BrandModel.findOne({
        $or: [
          { slug: new RegExp(`^${brandParam}$`, 'i') },
          { name: new RegExp(`^${brandParam}$`, 'i') },
        ],
      }).select('_id').lean();
      if (matchedBrand) {
        brandIds.push(matchedBrand._id.toString());
      } else {
        return { data: [], total: 0 };
      }
    }
    if (brandIds.length > 0) {
      const uniqueBrandIds = Array.from(new Set(brandIds));
      filter.brandId = uniqueBrandIds.length === 1 ? uniqueBrandIds[0] : { $in: uniqueBrandIds };
    }

    // 6. Fit filtering (supports multiple fits e.g. "Slim Fit,Regular Fit")
    const fits: string[] = [];
    if (query.fit) fits.push(query.fit);
    if (query.fits) {
      const fList = Array.isArray(query.fits)
        ? query.fits
        : String(query.fits).split(',').map(s => s.trim()).filter(Boolean);
      fits.push(...fList);
    }
    if (fits.length > 0) {
      const uniqueFits = Array.from(new Set(fits));
      filter.fit = { $in: uniqueFits.map(f => new RegExp(`^${f}$`, 'i')) };
    }

    // 7. Tag filtering (supports multiple tags e.g. "NEW,SALE,TRENDING")
    const tags: string[] = [];
    if (query.tag) tags.push(query.tag);
    if (query.tags) {
      const tList = Array.isArray(query.tags)
        ? query.tags
        : String(query.tags).split(',').map(s => s.trim()).filter(Boolean);
      tags.push(...tList);
    }
    if (tags.length > 0) {
      const uniqueTags = Array.from(new Set(tags));
      filter.tag = { $in: uniqueTags.map(t => new RegExp(`^${t}$`, 'i')) };
    }

    // 8. Rating filtering (minimum average rating)
    if (query.minRating !== undefined && !isNaN(Number(query.minRating))) {
      filter.averageRating = { $gte: Number(query.minRating) };
    }

    // 9. Variant-level filters (Price range, Colors, Sizes, Stock, Discount/Sale)
    const variantFilter: any = { isActive: true };
    let hasVariantFilter = false;

    // Price filtering
    const minPrice = query.minPrice !== undefined && query.minPrice !== '' ? Number(query.minPrice) : null;
    const maxPrice = query.maxPrice !== undefined && query.maxPrice !== '' ? Number(query.maxPrice) : null;
    if (minPrice !== null || maxPrice !== null) {
      hasVariantFilter = true;
      variantFilter.price = {};
      if (minPrice !== null && !isNaN(minPrice)) variantFilter.price.$gte = minPrice;
      if (maxPrice !== null && !isNaN(maxPrice)) variantFilter.price.$lte = maxPrice;
    }

    // Colors filtering (supports array or comma-separated)
    const colors: string[] = [];
    if (query.color) colors.push(query.color);
    if (query.colors) {
      const cList = Array.isArray(query.colors)
        ? query.colors
        : String(query.colors).split(',').map(s => s.trim()).filter(Boolean);
      colors.push(...cList);
    }
    if (colors.length > 0) {
      hasVariantFilter = true;
      const uniqueColors = Array.from(new Set(colors));
      variantFilter.color = { $in: uniqueColors.map(c => new RegExp(`^${c}$`, 'i')) };
    }

    // Sizes filtering (supports array or comma-separated)
    const sizes: string[] = [];
    if (query.size) sizes.push(query.size);
    if (query.sizes) {
      const sList = Array.isArray(query.sizes)
        ? query.sizes
        : String(query.sizes).split(',').map(s => s.trim()).filter(Boolean);
      sizes.push(...sList);
    }
    if (sizes.length > 0) {
      hasVariantFilter = true;
      const uniqueSizes = Array.from(new Set(sizes));
      variantFilter.size = { $in: uniqueSizes.map(s => new RegExp(`^${s}$`, 'i')) };
    }

    // Stock availability filtering
    if (query.inStock !== undefined) {
      hasVariantFilter = true;
      const inStock = query.inStock === true || query.inStock === 'true';
      if (inStock) {
        variantFilter.stock = { $gt: 0 };
      } else {
        variantFilter.stock = { $lte: 0 };
      }
    }

    // Discount / Sale filtering
    if (query.onSale === true || query.onSale === 'true' || query.hasDiscount === true || query.hasDiscount === 'true') {
      hasVariantFilter = true;
      variantFilter.comparePrice = { $gt: 0 };
      variantFilter.$expr = { $gt: ['$comparePrice', '$price'] };
    }

    // Execute variant filter and narrow down matching product IDs
    if (hasVariantFilter) {
      const matchingProductIds = await ProductVariantModel.distinct('productId', variantFilter);
      if (!matchingProductIds || matchingProductIds.length === 0) {
        return { data: [], total: 0 };
      }

      // Intersect with any existing _id conditions
      const validObjectIds = matchingProductIds.filter(id => Types.ObjectId.isValid(id)).map(id => new Types.ObjectId(id));
      if (filter._id) {
        filter._id = { $in: validObjectIds, ...filter._id };
      } else {
        filter._id = { $in: validObjectIds };
      }
    }

    // 10. Smart Search (Search across name, description, shortDescription, fit, tag, or matching variant SKU/color)
    if (query.search && query.search.trim()) {
      const searchKeyword = query.search.trim();
      const searchRegex = new RegExp(searchKeyword, 'i');

      // Check if any variants match SKU or color
      const variantMatches = await ProductVariantModel.distinct('productId', {
        isActive: true,
        $or: [
          { sku: searchRegex },
          { color: searchRegex },
          { title: searchRegex },
        ],
      });

      const variantProductObjectIds = variantMatches
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));

      const searchConditions: any[] = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { fit: searchRegex },
        { tag: searchRegex },
      ];

      if (variantProductObjectIds.length > 0) {
        searchConditions.push({ _id: { $in: variantProductObjectIds } });
      }

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // 11. Pagination & Limits
    const limit = Math.min(Math.max(parseInt(query.limit) || 12, 1), 100);
    const page = Math.max(parseInt(query.page) || 1, 1);
    const skip = (page - 1) * limit;

    // 12. Sorting
    const sortOption = (query.sort || query.sortBy || 'relevance').toLowerCase();
    const sortObj: any = {};

    switch (sortOption) {
      case 'price_asc':
      case 'price-low-to-high':
      case 'price_desc':
      case 'price-high-to-low': {
        const isDesc = sortOption.includes('desc') || sortOption.includes('high');
        const priceSortedVariants = await ProductVariantModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$productId', minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
          { $sort: isDesc ? { maxPrice: -1, minPrice: -1 } : { minPrice: 1, maxPrice: 1 } },
        ]);

        const sortedVariantIds = priceSortedVariants.map(v => v._id).filter(id => Types.ObjectId.isValid(id));
        const matchingDocs = await ProductModel.find(filter).select('_id').lean();
        const allowedSet = new Set(matchingDocs.map(d => d._id.toString()));

        // Filter sorted IDs by active product filters
        const filteredSortedIds = sortedVariantIds.filter(id => allowedSet.has(id.toString()));
        const total = filteredSortedIds.length;
        const pageIds = filteredSortedIds.slice(skip, skip + limit).map(id => new Types.ObjectId(id));

        const docs = await ProductModel.find({ _id: { $in: pageIds } }).exec();
        const idOrder = new Map(pageIds.map((id, idx) => [id.toString(), idx]));
        docs.sort((a, b) => (idOrder.get(a._id.toString()) ?? 0) - (idOrder.get(b._id.toString()) ?? 0));

        return {
          data: docs.map(doc => this.mapToDomain(doc)),
          total,
        };
      }

      case 'newest':
      case 'created_desc':
        sortObj.createdAt = -1;
        break;

      case 'oldest':
      case 'created_asc':
        sortObj.createdAt = 1;
        break;

      case 'best_selling':
      case 'popularity':
      case 'popular':
        sortObj.salesCount = -1;
        sortObj.createdAt = -1;
        break;

      case 'rating':
        sortObj.averageRating = -1;
        sortObj.reviewCount = -1;
        break;

      case 'name_asc':
        sortObj.name = 1;
        break;

      case 'name_desc':
        sortObj.name = -1;
        break;

      case 'relevance':
      default:
        sortObj.isFeatured = -1;
        sortObj.salesCount = -1;
        sortObj.createdAt = -1;
        break;
    }

    const [docs, total] = await Promise.all([
      ProductModel.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
      ProductModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      total,
    };
  }

  async getFilterFacets(query: any = {}): Promise<any> {
    const baseFilter: any = { isActive: true };

    if (query.categoryId) baseFilter.categoryId = query.categoryId;
    if (query.brandId) baseFilter.brandId = query.brandId;

    // 1. Total active products
    const totalProducts = await ProductModel.countDocuments(baseFilter).exec();

    // 2. Aggregate Categories with counts
    const categoryCounts = await ProductModel.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
    ]);

    const catIds = categoryCounts.map(c => c._id).filter(Boolean);
    const categoriesInfo = await CategoryModel.find({ _id: { $in: catIds }, isActive: true })
      .select('name slug')
      .lean();

    const categoryMap = new Map<string, { name: string; slug: string }>();
    categoriesInfo.forEach(c => categoryMap.set(c._id.toString(), { name: c.name, slug: c.slug }));

    const categoriesFacet = categoryCounts
      .map(c => {
        const info = categoryMap.get(c._id?.toString());
        return {
          id: c._id,
          name: info?.name || 'Uncategorized',
          slug: info?.slug || '',
          count: c.count,
        };
      })
      .filter(c => c.name !== 'Uncategorized');

    // 3. Aggregate Brands with counts
    const brandCounts = await ProductModel.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$brandId', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
    ]);

    const bIds = brandCounts.map(b => b._id).filter(Boolean);
    const brandsInfo = await BrandModel.find({ _id: { $in: bIds }, isActive: true })
      .select('name slug')
      .lean();

    const brandMap = new Map<string, { name: string; slug: string }>();
    brandsInfo.forEach(b => brandMap.set(b._id.toString(), { name: b.name, slug: b.slug }));

    const brandsFacet = brandCounts.map(b => {
      const info = brandMap.get(b._id?.toString());
      return {
        id: b._id,
        name: info?.name || 'Exclusive Brand',
        slug: info?.slug || '',
        count: b.count,
      };
    });

    // 4. Aggregate Fits
    const fitCounts = await ProductModel.aggregate([
      { $match: { ...baseFilter, fit: { $ne: null, $nin: ['', 'null'] } } },
      { $group: { _id: '$fit', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const fitsFacet = fitCounts.map(f => ({ value: f._id, count: f.count }));

    // 5. Aggregate Tags
    const tagCounts = await ProductModel.aggregate([
      { $match: { ...baseFilter, tag: { $ne: null, $nin: ['', 'null'] } } },
      { $group: { _id: '$tag', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const tagsFacet = tagCounts.map(t => ({ value: t._id, count: t.count }));

    // 6. Aggregate Variant-level facets (Price range, Colors, Sizes) across active products
    const activeProductIds = await ProductModel.find(baseFilter).select('_id').lean();
    const stringProductIds = activeProductIds.map(p => p._id.toString());

    let priceRange = { min: 499, max: 4999 };
    let colorsFacet: { value: string; count: number }[] = [];
    let sizesFacet: { value: string; count: number }[] = [];

    if (stringProductIds.length > 0) {
      const [priceAgg, colorAgg, sizeAgg] = await Promise.all([
        ProductVariantModel.aggregate([
          { $match: { productId: { $in: stringProductIds }, isActive: true, price: { $gt: 0 } } },
          { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
        ]),
        ProductVariantModel.aggregate([
          { $match: { productId: { $in: stringProductIds }, isActive: true, color: { $ne: null, $nin: ['', 'null'] } } },
          { $group: { _id: { $toLower: '$color' }, originalColor: { $first: '$color' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        ProductVariantModel.aggregate([
          { $match: { productId: { $in: stringProductIds }, isActive: true, size: { $ne: null, $nin: ['', 'null'] } } },
          { $group: { _id: { $toUpper: '$size' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      if (priceAgg.length > 0 && priceAgg[0]) {
        priceRange = {
          min: Math.floor(priceAgg[0].min || 0),
          max: Math.ceil(priceAgg[0].max || 5000),
        };
      }

      colorsFacet = colorAgg.map(c => ({
        value: c.originalColor || c._id,
        count: c.count,
      }));

      // Sort sizes standardly: XS, S, M, L, XL, XXL, 3XL or by count
      const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'FREE SIZE'];
      sizesFacet = sizeAgg
        .map(s => ({ value: s._id, count: s.count }))
        .sort((a, b) => {
          const idxA = sizeOrder.indexOf(a.value);
          const idxB = sizeOrder.indexOf(b.value);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return b.count - a.count;
        });
    }

    return {
      totalProducts,
      priceRange,
      categories: categoriesFacet,
      brands: brandsFacet,
      sizes: sizesFacet,
      colors: colorsFacet,
      fits: fitsFacet,
      tags: tagsFacet,
    };
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await ProductModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async findFeatured(limit: number): Promise<Product[]> {
    const docs = await ProductModel.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findLatest(limit: number): Promise<Product[]> {
    const docs = await ProductModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findBestSelling(limit: number): Promise<Product[]> {
    const docs = await ProductModel.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(limit)
      .exec();
    return docs.map(doc => this.mapToDomain(doc));
  }
}

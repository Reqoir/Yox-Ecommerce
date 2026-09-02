/**
 * @file product.use-cases.ts
 * @layer Application › Use Cases
 * 
 * Contains all use cases for the Products module.
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { IProductVariantRepository } from '../../domain/repositories/product-variant.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { CreateProductRequestDTO, UpdateProductRequestDTO, ProductResponseDTO } from '../dtos/product.dto';

// --- Mappers ---
function mapToResponseDTO(product: Product, variants: ProductVariant[] = []): ProductResponseDTO {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId,
    brandId: product.brandId,
    shortDescription: product.shortDescription,
    description: product.description,
    thumbnail: product.thumbnail,
    fit: product.fit,
    tag: product.tag,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    salesCount: product.salesCount,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    variants: variants.map(v => v.toJSON()),
  };
}

// --- Commands ---

export class CreateProductUseCase implements IUseCase<CreateProductRequestDTO, ProductResponseDTO> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly variantRepo: IProductVariantRepository
  ) {}

  async execute(input: CreateProductRequestDTO): Promise<ProductResponseDTO> {
    const existing = await this.productRepo.findBySlug(input.slug);
    if (existing) {
      throw new Error(`Product with slug ${input.slug} already exists`);
    }

    const product = Product.create({
      name: input.name,
      slug: input.slug,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      brandId: input.brandId,
      shortDescription: input.shortDescription,
      description: input.description,
      thumbnail: input.thumbnail,
      fit: input.fit,
      tag: input.tag,
      isFeatured: input.isFeatured || false,
      isActive: input.isActive !== undefined ? input.isActive : true,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    });

    const savedProduct = await this.productRepo.save(product);
    let savedVariants: ProductVariant[] = [];

    if (input.variants && input.variants.length > 0) {
      const variantEntities = input.variants.map(v => ProductVariant.create({
        productId: savedProduct.id,
        sku: v.sku,
        title: v.title,
        color: v.color,
        price: v.price,
        comparePrice: v.comparePrice,
        costPrice: v.costPrice,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold || 10,
        barcode: v.barcode,
        images: v.images || [],
        isDefault: v.isDefault || false,
        isActive: v.isActive !== undefined ? v.isActive : true,
        size: v.size ? v.size.trim().toUpperCase() : null,
      }));
      savedVariants = await this.variantRepo.saveMany(variantEntities);
    }

    return mapToResponseDTO(savedProduct, savedVariants);
  }
}

export class UpdateProductUseCase implements IUseCase<{ id: string; data: UpdateProductRequestDTO }, ProductResponseDTO> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly variantRepo: IProductVariantRepository
  ) {}

  async execute(input: { id: string; data: UpdateProductRequestDTO }): Promise<ProductResponseDTO> {
    const product = await this.productRepo.findById(input.id);
    if (!product) throw new Error('Product not found');

    if (input.data.slug && input.data.slug !== product.slug) {
      const existing = await this.productRepo.findBySlug(input.data.slug);
      if (existing) throw new Error(`Product with slug ${input.data.slug} already exists`);
    }

    const { variants: _variants, ...updateData } = input.data;
    const updatedProps = { ...product.toJSON(), ...updateData, id: product.id, createdAt: product.createdAt, updatedAt: new Date() };
    const updatedProduct = Product.reconstitute(updatedProps);
    const savedProduct = await this.productRepo.save(updatedProduct);

    if (input.data.variants) {
      await this.variantRepo.deleteByProductId(savedProduct.id);
      
      const variantEntities = input.data.variants.map(v => ProductVariant.create({
        productId: savedProduct.id,
        sku: v.sku,
        title: v.title,
        color: v.color,
        price: v.price,
        comparePrice: v.comparePrice,
        costPrice: v.costPrice,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold || 10,
        weight: v.weight,
        barcode: v.barcode,
        images: v.images || [],
        isDefault: v.isDefault || false,
        isActive: v.isActive !== undefined ? v.isActive : true,
        size: v.size ? v.size.trim().toUpperCase() : null,
      }));
      await this.variantRepo.saveMany(variantEntities);
    }

    const variants = await this.variantRepo.findByProductId(savedProduct.id);

    return mapToResponseDTO(savedProduct, variants);
  }
}

export class DeleteProductUseCase implements IUseCase<string, void> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly variantRepo: IProductVariantRepository
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.productRepo.delete(id);
    if (!deleted) throw new Error('Product not found');
    await this.variantRepo.deleteByProductId(id);
  }
}

// --- Queries ---

export class GetProductByIdUseCase implements IUseCase<string, ProductResponseDTO> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly variantRepo: IProductVariantRepository
  ) {}

  async execute(id: string): Promise<ProductResponseDTO> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new Error('Product not found');
    const variants = await this.variantRepo.findByProductId(id);
    return mapToResponseDTO(product, variants);
  }
}

export class GetProductByBarcodeUseCase implements IUseCase<string, ProductResponseDTO | null> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly variantRepo: IProductVariantRepository
  ) {}

  async execute(barcode: string): Promise<ProductResponseDTO | null> {
    const variant = await this.variantRepo.findByBarcode(barcode);
    if (!variant) return null;
    const product = await this.productRepo.findById(variant.productId);
    if (!product) return null;
    const variants = await this.variantRepo.findByProductId(product.id);
    return mapToResponseDTO(product, variants);
  }
}

export class GetAllProductsUseCase implements IUseCase<any, { data: ProductResponseDTO[]; total: number }> {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly variantRepo?: IProductVariantRepository
  ) {}

  async execute(query: any): Promise<{ data: ProductResponseDTO[]; total: number }> {
    const result = await this.productRepo.findAll(query);
    const dataWithVariants = await Promise.all(
      result.data.map(async (p) => {
        const variants = this.variantRepo ? await this.variantRepo.findByProductId(p.id) : [];
        return mapToResponseDTO(p, variants);
      })
    );
    return {
      data: dataWithVariants,
      total: result.total,
    };
  }
}

export class GetFeaturedProductsUseCase implements IUseCase<number, ProductResponseDTO[]> {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(limit: number): Promise<ProductResponseDTO[]> {
    const result = await this.productRepo.findFeatured(limit);
    return result.map(p => mapToResponseDTO(p));
  }
}

export class GetLatestProductsUseCase implements IUseCase<number, ProductResponseDTO[]> {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(limit: number): Promise<ProductResponseDTO[]> {
    const result = await this.productRepo.findLatest(limit);
    return result.map(p => mapToResponseDTO(p));
  }
}

export class GetBestSellingProductsUseCase implements IUseCase<number, ProductResponseDTO[]> {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(limit: number): Promise<ProductResponseDTO[]> {
    const result = await this.productRepo.findBestSelling(limit);
    return result.map(p => mapToResponseDTO(p));
  }
}

/**
 * @file product-variant.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IProductVariantRepository } from '../../domain/repositories/product-variant.repository.interface';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { CreateProductVariantRequestDTO, UpdateProductVariantRequestDTO, ProductVariantResponseDTO } from '../dtos/product-variant.dto';

function mapToResponseDTO(variant: ProductVariant): ProductVariantResponseDTO {
  return variant.toJSON();
}

export class CreateProductVariantUseCase implements IUseCase<CreateProductVariantRequestDTO, ProductVariantResponseDTO> {
  constructor(
    private readonly variantRepo: IProductVariantRepository,
    private readonly productRepo: IProductRepository
  ) {}

  async execute(input: CreateProductVariantRequestDTO): Promise<ProductVariantResponseDTO> {
    const product = await this.productRepo.findById(input.productId);
    if (!product) {
      throw new Error(`Product with ID ${input.productId} not found`);
    }

    const variant = ProductVariant.create({
      productId: input.productId,
      sku: input.sku,
      title: input.title,
      color: input.color,
      price: input.price,
      comparePrice: input.comparePrice,
      costPrice: input.costPrice,
      stock: input.stock,
      lowStockThreshold: input.lowStockThreshold || 10,
      weight: input.weight,
      barcode: input.barcode,
      images: input.images || [],
      isDefault: input.isDefault || false,
      isActive: input.isActive !== undefined ? input.isActive : true,
      size: input.size,
    });

    const savedVariant = await this.variantRepo.save(variant);
    return mapToResponseDTO(savedVariant);
  }
}

export class UpdateProductVariantUseCase implements IUseCase<{ id: string; data: UpdateProductVariantRequestDTO }, ProductVariantResponseDTO> {
  constructor(private readonly variantRepo: IProductVariantRepository) {}

  async execute(input: { id: string; data: UpdateProductVariantRequestDTO }): Promise<ProductVariantResponseDTO> {
    const variant = await this.variantRepo.findById(input.id);
    if (!variant) throw new Error('ProductVariant not found');

    const updatedProps = { 
      ...variant.toJSON(), 
      ...input.data, 
      id: variant.id, 
      productId: variant.productId, 
      createdAt: variant.createdAt, 
      updatedAt: new Date() 
    };
    
    const updatedVariant = ProductVariant.reconstitute(updatedProps);
    const savedVariant = await this.variantRepo.save(updatedVariant);

    return mapToResponseDTO(savedVariant);
  }
}

export class DeleteProductVariantUseCase implements IUseCase<string, void> {
  constructor(private readonly variantRepo: IProductVariantRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.variantRepo.delete(id);
    if (!deleted) throw new Error('ProductVariant not found');
  }
}

export class GetProductVariantByIdUseCase implements IUseCase<string, ProductVariantResponseDTO> {
  constructor(private readonly variantRepo: IProductVariantRepository) {}

  async execute(id: string): Promise<ProductVariantResponseDTO> {
    const variant = await this.variantRepo.findById(id);
    if (!variant) throw new Error('ProductVariant not found');
    return mapToResponseDTO(variant);
  }
}

export class GetAllProductVariantsUseCase implements IUseCase<any, { data: ProductVariantResponseDTO[]; total: number }> {
  constructor(private readonly variantRepo: IProductVariantRepository) {}

  async execute(query: any): Promise<{ data: ProductVariantResponseDTO[]; total: number }> {
    const result = await this.variantRepo.findAll(query);
    return {
      data: result.data.map(v => mapToResponseDTO(v)),
      total: result.total,
    };
  }
}

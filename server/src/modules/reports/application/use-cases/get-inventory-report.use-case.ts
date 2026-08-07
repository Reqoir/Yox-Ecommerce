import { ProductVariantModel } from '../../../products/infrastructure/models/product-variant.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { InventoryReportDTO } from '../dtos/report-query.dto';

export class GetInventoryReportUseCase {
  async execute(): Promise<InventoryReportDTO> {
    const variants = await ProductVariantModel.find({ isActive: true }).lean();

    const productIds = [...new Set(variants.map((v: any) => v.productId))];
    const products = await ProductModel.find({ _id: { $in: productIds } }).select('_id name').lean();

    const productMap = new Map<string, string>();
    products.forEach((p: any) => {
      const pIdStr = p._id ? p._id.toString() : p.id;
      productMap.set(pIdStr, p.name);
    });

    let totalStockQuantity = 0;
    let totalInventoryValuation = 0;
    const lowStockItems: any[] = [];
    const outOfStockItems: any[] = [];

    variants.forEach((v: any) => {
      const stock = v.stock || 0;
      const price = v.price || 0;
      const threshold = v.lowStockThreshold || 10;
      const productName = productMap.get(v.productId.toString()) || 'Unknown Product';
      const variantIdStr = v._id ? v._id.toString() : v.id;

      totalStockQuantity += stock;
      totalInventoryValuation += stock * price;

      if (stock <= 0) {
        outOfStockItems.push({
          variantId: variantIdStr,
          productId: v.productId,
          productName,
          sku: v.sku,
          title: v.title,
          price,
        });
      } else if (stock <= threshold) {
        lowStockItems.push({
          variantId: variantIdStr,
          productId: v.productId,
          productName,
          sku: v.sku,
          title: v.title,
          color: v.color,
          size: v.size,
          currentStock: stock,
          lowStockThreshold: threshold,
          price,
        });
      }
    });

    return {
      summary: {
        totalVariants: variants.length,
        totalStockQuantity,
        totalInventoryValuation: Number(totalInventoryValuation.toFixed(2)),
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      },
      lowStockItems,
      outOfStockItems,
    };
  }
}

import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { ProductVariantModel } from '../../../products/infrastructure/models/product-variant.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { CategoryModel } from '../../../categories/infrastructure/models/category.model';
import { ReportQueryParams, ProductPerformanceReportDTO } from '../dtos/report-query.dto';

export class GetProductPerformanceReportUseCase {
  async execute(params: ReportQueryParams): Promise<ProductPerformanceReportDTO> {
    const startDate = params.startDate ? new Date(params.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const limit = params.limit || 10;

    const dateMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: 'CANCELLED' },
    };

    // 1. Unwind items in completed orders and group by productId
    const productSalesAgg = await OrderModel.aggregate([
      { $match: dateMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          sku: { $first: '$items.sku' },
          unitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
    ]);

    // Top products by revenue
    const topByRevenue = [...productSalesAgg]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
      .map((item) => ({
        productId: item._id,
        productName: item.productName,
        sku: item.sku,
        unitsSold: item.unitsSold,
        totalRevenue: item.totalRevenue,
      }));

    // Top products by quantity
    const topByQuantity = [...productSalesAgg]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit)
      .map((item) => ({
        productId: item._id,
        productName: item.productName,
        sku: item.sku,
        unitsSold: item.unitsSold,
        totalRevenue: item.totalRevenue,
      }));

    // 2. Category Performance
    // Map product IDs to category IDs
    const productIds = productSalesAgg.map((p) => p._id);
    const products = await ProductModel.find({ _id: { $in: productIds } }).select('_id categoryId').lean();
    const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];
    const categories = await CategoryModel.find({ _id: { $in: categoryIds } }).select('_id name').lean();

    const categoryMap = new Map<string, string>();
    categories.forEach((cat: any) => {
      const catIdStr = cat._id ? cat._id.toString() : cat.id;
      categoryMap.set(catIdStr, cat.name);
    });

    const productCategoryMap = new Map<string, string>();
    products.forEach((prod: any) => {
      const prodIdStr = prod._id ? prod._id.toString() : prod.id;
      if (prod.categoryId) {
        productCategoryMap.set(prodIdStr, prod.categoryId.toString());
      }
    });

    const categoryStats = new Map<string, { categoryName: string; totalProducts: Set<string>; totalUnitsSold: number; totalRevenue: number }>();

    productSalesAgg.forEach((item) => {
      const catId = productCategoryMap.get(item._id.toString()) || 'Uncategorized';
      const catName = categoryMap.get(catId) || (catId === 'Uncategorized' ? 'Uncategorized' : 'Unknown Category');

      if (!categoryStats.has(catId)) {
        categoryStats.set(catId, {
          categoryName: catName,
          totalProducts: new Set<string>(),
          totalUnitsSold: 0,
          totalRevenue: 0,
        });
      }

      const stat = categoryStats.get(catId)!;
      stat.totalProducts.add(item._id.toString());
      stat.totalUnitsSold += item.unitsSold;
      stat.totalRevenue += item.totalRevenue;
    });

    const categoryBreakdown = Array.from(categoryStats.entries()).map(([catId, stat]) => ({
      categoryId: catId,
      categoryName: stat.categoryName,
      totalProducts: stat.totalProducts.size,
      totalUnitsSold: stat.totalUnitsSold,
      totalRevenue: stat.totalRevenue,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 3. Inventory Health
    const allVariants = await ProductVariantModel.find({ isActive: true }).select('stock lowStockThreshold').lean();
    const totalVariants = allVariants.length;
    let lowStockVariants = 0;
    let outOfStockVariants = 0;

    allVariants.forEach((v: any) => {
      if (v.stock <= 0) {
        outOfStockVariants++;
      } else if (v.stock <= (v.lowStockThreshold || 10)) {
        lowStockVariants++;
      }
    });

    return {
      topProductsByRevenue: topByRevenue,
      topProductsByQuantity: topByQuantity,
      categoryBreakdown,
      inventoryHealth: {
        totalVariants,
        lowStockVariants,
        outOfStockVariants,
      },
    };
  }
}

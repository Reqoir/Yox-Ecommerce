/**
 * @file inventory.entity.ts
 * @layer Domain
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface InventoryProps extends EntityProps {
  variantId: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  warehouseLocation?: string | null;
  /** Threshold below which a low-stock alert is triggered */
  lowStockThreshold: number;
}

export class Inventory extends BaseEntity<InventoryProps> {
  private constructor(props: InventoryProps) {
    super(props);
  }

  get variantId(): string { return this._props.variantId; }
  get availableStock(): number { return this._props.availableStock; }
  get reservedStock(): number { return this._props.reservedStock; }
  get damagedStock(): number { return this._props.damagedStock; }
  get warehouseLocation(): string | null | undefined { return this._props.warehouseLocation; }
  get lowStockThreshold(): number { return this._props.lowStockThreshold; }

  /**
   * Domain rule: stock is considered low when availableStock falls at or below threshold.
   * This encapsulates business logic inside the entity — no service needed for the check.
   */
  public isLowStock(): boolean {
    return this._props.availableStock <= this._props.lowStockThreshold;
  }

  public static create(props: Omit<InventoryProps, 'id' | 'createdAt' | 'updatedAt'>): Inventory {
    return new Inventory({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props
    });
  }

  public static reconstitute(props: InventoryProps): Inventory {
    return new Inventory(props);
  }

  public adjustStock(amount: number): void {
    this._props.availableStock += amount;
  }
}

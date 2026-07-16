/**
 * @file stock-log.entity.ts
 * @layer Domain
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface StockLogProps extends EntityProps {
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  amount: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  reference?: string | null; // e.g. Order ID
}

export class StockLog extends BaseEntity<StockLogProps> {
  private constructor(props: StockLogProps) {
    super(props);
  }

  get inventoryId(): string { return this._props.inventoryId; }
  get type(): 'IN' | 'OUT' | 'ADJUSTMENT' { return this._props.type; }
  get amount(): number { return this._props.amount; }
  get previousStock(): number { return this._props.previousStock; }
  get newStock(): number { return this._props.newStock; }
  get reason(): string | null | undefined { return this._props.reason; }
  get reference(): string | null | undefined { return this._props.reference; }

  public static create(props: Omit<StockLogProps, 'id' | 'createdAt' | 'updatedAt'>): StockLog {
    return new StockLog({
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props
    });
  }

  public static reconstitute(props: StockLogProps): StockLog {
    return new StockLog(props);
  }
}

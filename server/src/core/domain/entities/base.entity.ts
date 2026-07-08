/**
 * @file base.entity.ts
 * @layer Domain
 *
 * Abstract base class for all domain entities.
 * Domain entities are the core business objects. They have identity (ID),
 * carry domain state, and may contain domain logic in the future.
 *
 * Rules:
 * - NO imports from Application, Infrastructure, or Presentation layers.
 * - NO framework dependencies (no Mongoose, no Express, etc.)
 * - Entities are identified by their ID, not by their attributes.
 */

export interface EntityProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class BaseEntity<TProps extends EntityProps> {
  protected readonly _props: TProps;

  protected constructor(props: TProps) {
    this._props = props;
  }

  get id(): string {
    return this._props.id;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  /**
   * Entity equality is based on identity (ID), not on attribute values.
   */
  equals(other: BaseEntity<TProps>): boolean {
    if (!(other instanceof BaseEntity)) return false;
    return this._props.id === other._props.id;
  }

  /**
   * Returns a plain object representation (for serialisation in infrastructure layer).
   */
  toJSON(): TProps {
    return { ...this._props };
  }
}

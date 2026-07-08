/**
 * @file base.value-object.ts
 * @layer Domain
 *
 * Abstract base class for Value Objects.
 * Value Objects are immutable and identified by their attributes, not by identity.
 * Two Value Objects with the same attributes are considered equal.
 *
 * Rules:
 * - NO imports from Application, Infrastructure, or Presentation layers.
 * - Value Objects MUST be immutable (all props readonly).
 */

export abstract class BaseValueObject<TProps extends Record<string, unknown>> {
  protected readonly _props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this._props = Object.freeze({ ...props });
    this.validate();
  }

  /**
   * Subclasses must implement validation logic.
   * Throw a DomainError if the value is invalid.
   */
  protected abstract validate(): void;

  /**
   * Value Object equality is based on attribute values.
   */
  equals(other: BaseValueObject<TProps>): boolean {
    if (!(other instanceof BaseValueObject)) return false;
    return JSON.stringify(this._props) === JSON.stringify(other._props);
  }

  toJSON(): TProps {
    return { ...this._props };
  }
}

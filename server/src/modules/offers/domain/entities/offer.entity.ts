/**
 * @file offer.entity.ts
 * @layer Domain › Entities
 * 
 * Defines the Offer domain entity.
 */

export type OfferType = 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'CELEBRATION' | 'LIMITED_TIME';
export type DiscountType = 'PERCENTAGE' | 'FLAT';
export type BannerPosition = 'HERO' | 'BANNER_STRIP' | 'EXCLUSIVE' | 'POPUP';

export interface OfferBanner {
  imageUrl: string;
  mobileImageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  showOnHome: boolean;
  position: BannerPosition;
}

export interface OfferProps {
  id?: string;
  title: string;
  description?: string | null;
  code?: string | null;
  offerType: OfferType;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscountAmount?: number | null;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  applicableBrandIds: string[];
  isLimitedTime: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  banner?: OfferBanner | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  priority: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Offer {
  private constructor(private readonly props: OfferProps) {}

  public static create(props: Omit<OfferProps, 'id' | 'createdAt' | 'updatedAt'>): Offer {
    return new Offer({
      ...props,
      applicableProductIds: props.applicableProductIds || [],
      applicableCategoryIds: props.applicableCategoryIds || [],
      applicableBrandIds: props.applicableBrandIds || [],
      priority: props.priority ?? 0,
      isActive: props.isActive !== undefined ? props.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: OfferProps): Offer {
    return new Offer(props);
  }

  get id(): string { return this.props.id || ''; }
  get title(): string { return this.props.title; }
  get description(): string | null | undefined { return this.props.description; }
  get code(): string | null | undefined { return this.props.code; }
  get offerType(): OfferType { return this.props.offerType; }
  get discountType(): DiscountType { return this.props.discountType; }
  get discountValue(): number { return this.props.discountValue; }
  get minOrderValue(): number | null | undefined { return this.props.minOrderValue; }
  get maxDiscountAmount(): number | null | undefined { return this.props.maxDiscountAmount; }
  get applicableProductIds(): string[] { return this.props.applicableProductIds; }
  get applicableCategoryIds(): string[] { return this.props.applicableCategoryIds; }
  get applicableBrandIds(): string[] { return this.props.applicableBrandIds; }
  get isLimitedTime(): boolean { return this.props.isLimitedTime; }
  get startDate(): Date | null | undefined { return this.props.startDate; }
  get endDate(): Date | null | undefined { return this.props.endDate; }
  get banner(): OfferBanner | null | undefined { return this.props.banner; }
  get badgeText(): string | null | undefined { return this.props.badgeText; }
  get badgeColor(): string | null | undefined { return this.props.badgeColor; }
  get priority(): number { return this.props.priority; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
  get updatedAt(): Date { return this.props.updatedAt || new Date(); }

  public isCurrentlyValid(now: Date = new Date()): boolean {
    if (!this.props.isActive) return false;
    if (this.props.startDate && new Date(this.props.startDate) > now) return false;
    if (this.props.endDate && new Date(this.props.endDate) < now) return false;
    return true;
  }

  public toJSON(): OfferProps {
    return { ...this.props };
  }
}

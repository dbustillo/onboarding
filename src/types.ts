export interface Warehousing {
  ambientStorage: {
    enabled: boolean;
    averageVolume: number; // Default should be 0, not 1
  };
  tempControlledStorage: {
    enabled: boolean;
    averageVolume: number; // Default should be 0, not 1
  };
  expectedMonths: number;
}

export interface Fulfillment {
  monthlyOrders: number;
  averageItemsPerOrder: number;
  parcelSizeDistribution: {
    small: number;
    medium: number;
    large: number;
    bulky: number;
  };
}

export interface QuoteData {
  warehousing: Warehousing;
  fulfillment: Fulfillment;
  shipping?: Shipping;
}

export interface Shipping {
  enabled: boolean;
  monthlyOrders: number;
  weightDistribution: {
    upTo1kg: number;
    upTo2kg: number;
    upTo3kg: number;
    upTo5kg: number;
    upTo7kg: number;
  };
  locationDistribution: {
    metroManila: number;
    outsideMetroManila: number;
  };
}

export interface CostBreakdown {
  ambientStorage: number;
  tempControlledStorage: number;
  fulfillment: number;
  additionalItems: number;
  shipping: number;
  subtotal: number;
  vat: number;
  total: number;
}

export interface PricingTier {
  min: number;
  max: number | null;
  rate: number;
}

export interface FulfillmentTier {
  orderRange: string;
  small: number;
  medium: number;
  large: number;
  bulky: number;
}

export interface ShippingTier {
  weight: string;
  metroManila: number;
  outsideMetroManila: number;
}
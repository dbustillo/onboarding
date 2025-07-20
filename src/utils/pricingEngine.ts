import { QuoteData, CostBreakdown, PricingTier, FulfillmentTier } from '../types';

// J&T Express shipping rates
export const JT_SHIPPING_RATES = [
  { weight: '≤1kg', metroManila: 70, outsideMetroManila: 135 },
  { weight: '≤2kg', metroManila: 135, outsideMetroManila: 150 },
  { weight: '≤3kg', metroManila: 150, outsideMetroManila: 195 },
  { weight: '≤5kg', metroManila: 270, outsideMetroManila: 360 },
  { weight: '≤7kg', metroManila: 500, outsideMetroManila: 600 }
];

// Tier-based pricing constants
export const AMBIENT_STORAGE_TIERS: PricingTier[] = [
  { min: 1, max: 25, rate: 650 },
  { min: 26, max: 50, rate: 625 },
  { min: 51, max: 100, rate: 600 },
  { min: 101, max: 200, rate: 575 },
  { min: 201, max: null, rate: 550 }
];

export const TEMP_CONTROLLED_STORAGE_TIERS: PricingTier[] = [
  { min: 1, max: 25, rate: 750 },
  { min: 26, max: 50, rate: 725 },
  { min: 51, max: 100, rate: 700 },
  { min: 101, max: 200, rate: 675 },
  { min: 201, max: null, rate: 650 }
];

export const FULFILLMENT_TIERS: FulfillmentTier[] = [
  { orderRange: '1,000 and below', small: 30, medium: 35, large: 40, bulky: 50 },
  { orderRange: '1,001 to 5,000', small: 25, medium: 30, large: 35, bulky: 45 },
  { orderRange: '5,001 to 10,000', small: 20, medium: 25, large: 30, bulky: 40 },
  { orderRange: '10,001 to 20,000', small: 17.5, medium: 22.5, large: 27.5, bulky: 37.5 },
  { orderRange: '20,001 and above', small: 15, medium: 20, large: 25, bulky: 35 }
];

// Fixed pricing constants
export const PRICING_CONSTANTS = {
  ADDITIONAL_ITEM_FEE: 5.00,
  VAT_RATE: 0.12
};

function getStorageRate(volume: number, storageType: 'ambient' | 'temp-controlled'): number {
  const tiers = storageType === 'ambient' ? AMBIENT_STORAGE_TIERS : TEMP_CONTROLLED_STORAGE_TIERS;
  
  for (const tier of tiers) {
    if (volume >= tier.min && (tier.max === null || volume <= tier.max)) {
      return tier.rate;
    }
  }
  
  return tiers[tiers.length - 1].rate; // Default to highest tier
}

function getFulfillmentRate(monthlyOrders: number, parcelSizeDistribution: { small: number; medium: number; large: number; bulky: number }): number {
  let tierIndex = 0;
  
  if (monthlyOrders <= 1000) tierIndex = 0;
  else if (monthlyOrders <= 5000) tierIndex = 1;
  else if (monthlyOrders <= 10000) tierIndex = 2;
  else if (monthlyOrders <= 20000) tierIndex = 3;
  else tierIndex = 4;
  
  const tier = FULFILLMENT_TIERS[tierIndex];
  
  // Calculate weighted average based on parcel size distribution
  const weightedRate = (
    (tier.small * parcelSizeDistribution.small / 100) +
    (tier.medium * parcelSizeDistribution.medium / 100) +
    (tier.large * parcelSizeDistribution.large / 100) +
    (tier.bulky * parcelSizeDistribution.bulky / 100)
  );
  
  return weightedRate;
}

function calculateShippingCosts(data: QuoteData): number {
  if (!data.shipping || !data.shipping.enabled || data.shipping.monthlyOrders === 0) {
    return 0;
  }

  const { monthlyOrders, weightDistribution, locationDistribution } = data.shipping;
  
  // Calculate weighted average shipping cost per order
  let totalShippingCost = 0;
  
  // For each weight category
  const weightCategories = [
    { key: 'upTo1kg', rate: JT_SHIPPING_RATES[0] },
    { key: 'upTo2kg', rate: JT_SHIPPING_RATES[1] },
    { key: 'upTo3kg', rate: JT_SHIPPING_RATES[2] },
    { key: 'upTo5kg', rate: JT_SHIPPING_RATES[3] },
    { key: 'upTo7kg', rate: JT_SHIPPING_RATES[4] }
  ];
  
  weightCategories.forEach(({ key, rate }) => {
    const weightPercentage = weightDistribution[key as keyof typeof weightDistribution] / 100;
    const metroManilaPercentage = locationDistribution.metroManila / 100;
    const outsideMetroManilaPercentage = locationDistribution.outsideMetroManila / 100;
    
    // Calculate cost for this weight category
    const metroManilaCost = rate.metroManila * metroManilaPercentage;
    const outsideMetroManilaCost = rate.outsideMetroManila * outsideMetroManilaPercentage;
    const totalCostForWeight = (metroManilaCost + outsideMetroManilaCost) * weightPercentage;
    
    totalShippingCost += totalCostForWeight;
  });
  
  // Multiply by monthly orders to get total monthly shipping cost
  return totalShippingCost * monthlyOrders;
}

export function calculateQuote(data: QuoteData, includeVat: boolean = false): CostBreakdown {
  // Use 1 month as default if expectedMonths is 0 or not set
  const months = data.warehousing.expectedMonths || 1;
  
  const costs: CostBreakdown = {
    ambientStorage: 0,
    tempControlledStorage: 0,
    fulfillment: 0,
    additionalItems: 0,
    shipping: 0,
    subtotal: 0,
    vat: 0,
    total: 0
  };

  // Ambient Storage costs
  if (data.warehousing.ambientStorage.enabled && data.warehousing.ambientStorage.averageVolume > 0) {
    const ambientRate = getStorageRate(data.warehousing.ambientStorage.averageVolume, 'ambient');
    costs.ambientStorage = data.warehousing.ambientStorage.averageVolume * ambientRate * months;
  }

  // Temperature-Controlled Storage costs
  if (data.warehousing.tempControlledStorage.enabled && data.warehousing.tempControlledStorage.averageVolume > 0) {
    const tempControlledRate = getStorageRate(data.warehousing.tempControlledStorage.averageVolume, 'temp-controlled');
    costs.tempControlledStorage = data.warehousing.tempControlledStorage.averageVolume * tempControlledRate * months;
  }

  // Fulfillment costs
  const fulfillmentRate = getFulfillmentRate(data.fulfillment.monthlyOrders, data.fulfillment.parcelSizeDistribution);
  costs.fulfillment = fulfillmentRate * data.fulfillment.monthlyOrders;

  // Additional items cost (for items beyond the first in each order)
  if (data.fulfillment.averageItemsPerOrder > 1) {
    // Only charge ₱5.00 for items beyond the first item
    // First item already covered by fulfillment rate
    const additionalItemsPerOrder = Math.max(0, data.fulfillment.averageItemsPerOrder - 1);
    costs.additionalItems = additionalItemsPerOrder * data.fulfillment.monthlyOrders * PRICING_CONSTANTS.ADDITIONAL_ITEM_FEE;
  }

  // Shipping costs (monthly)
  costs.shipping = calculateShippingCosts(data);

  // Calculate subtotal
  costs.subtotal = costs.ambientStorage + costs.tempControlledStorage + costs.fulfillment + costs.additionalItems + costs.shipping;

  // Calculate VAT and total
  if (includeVat) {
    costs.vat = costs.subtotal * PRICING_CONSTANTS.VAT_RATE;
  }
  costs.total = costs.subtotal + costs.vat;

  // Round all values to 2 decimal places
  Object.keys(costs).forEach(key => {
    costs[key as keyof CostBreakdown] = Math.round(costs[key as keyof CostBreakdown] * 100) / 100;
  });

  return costs;
}
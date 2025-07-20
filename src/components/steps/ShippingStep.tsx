import React from 'react';
import { Truck, MapPin, Scale, AlertCircle } from 'lucide-react';
import { Shipping } from '../../types';
import { Tooltip } from '../Tooltip';
import { ServiceExplanation } from '../ServiceExplanation';

interface ShippingStepProps {
  data: Shipping;
  onChange: (data: Shipping) => void;
}

export const ShippingStep: React.FC<ShippingStepProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof Shipping, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleWeightDistributionChange = (weight: keyof Shipping['weightDistribution'], value: number) => {
    onChange({
      ...data,
      weightDistribution: {
        ...data.weightDistribution,
        [weight]: value
      }
    });
  };

  const handleLocationDistributionChange = (location: keyof Shipping['locationDistribution'], value: number) => {
    onChange({
      ...data,
      locationDistribution: {
        ...data.locationDistribution,
        [location]: value
      }
    });
  };

  const totalWeightPercentage = data.weightDistribution.upTo1kg + 
    data.weightDistribution.upTo2kg + 
    data.weightDistribution.upTo3kg + 
    data.weightDistribution.upTo5kg + 
    data.weightDistribution.upTo7kg;

  const totalLocationPercentage = data.locationDistribution.metroManila + 
    data.locationDistribution.outsideMetroManila;

  if (!data.enabled) {
    return (
      <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-2xl border border-orange-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl animate-slide-up">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
            <Truck className="text-white" size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Direct-to-Consumer Shipping</h2>
        </div>

        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="text-blue-600 mr-3" size={20} />
              <h3 className="text-lg sm:text-xl font-semibold text-blue-800">Do you sell directly to consumers?</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
              If you sell through <strong>Shopify, Facebook, Wix, or other direct-to-consumer platforms</strong>, 
              we can calculate your shipping costs using J&T Express rates.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-6">
              <p className="text-xs sm:text-sm text-yellow-800">
                <strong>Note:</strong> This does NOT include orders from Lazada, Shopee, or TikTok - 
                those platforms handle their own shipping rates.
              </p>
            </div>
            <button
              onClick={() => handleChange('enabled', true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg font-bold hover:from-orange-400 hover:to-red-400 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Yes, Calculate Shipping Costs
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-600 mb-4">Only selling on marketplaces? You can skip this step.</p>
            <p className="text-xs sm:text-sm text-gray-500">Marketplace platforms (Lazada, Shopee, TikTok) handle shipping separately</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-2xl border border-orange-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl animate-slide-up">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
          <Truck className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Direct-to-Consumer Shipping</h2>
          <div className="flex items-center mt-2">
            <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-full shadow-lg mr-2">
              J&T Express
            </span>
            <span className="text-xs sm:text-sm text-gray-600">Standard Delivery Rates</span>
          </div>
        </div>
        <button
          onClick={() => handleChange('enabled', false)}
          className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs sm:text-sm"
        >
          Skip This Step
        </button>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4 mb-8">
        <div className="flex items-start">
          <AlertCircle className="text-orange-600 mr-2 sm:mr-3 mt-1 flex-shrink-0" size={16} />
          <div>
            <h4 className="font-semibold text-orange-800 mb-2 text-sm sm:text-base">Important: Direct-to-Consumer Only</h4>
            <p className="text-xs sm:text-sm text-orange-700">
              These shipping costs apply ONLY to orders from Shopify, Facebook, Wix, and similar platforms. 
              Do NOT include orders from Lazada, Shopee, or TikTok as those platforms handle shipping separately.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3">
              <Truck className="text-white" size={14} />
            </div>
            Monthly Direct-to-Consumer Orders *
            <Tooltip 
              content={
                <div>
                  <p className="font-semibold mb-2">J&T Express Shipping Rates:</p>
                  <p className="mb-1"><strong>≤1kg:</strong> MM ₱70, Outside ₱135</p>
                  <p className="mb-1"><strong>≤2kg:</strong> MM ₱135, Outside ₱150</p>
                  <p className="mb-1"><strong>≤3kg:</strong> MM ₱150, Outside ₱195</p>
                  <p className="mb-1"><strong>≤5kg:</strong> MM ₱270, Outside ₱360</p>
                  <p><strong>≤7kg:</strong> MM ₱500, Outside ₱600</p>
                </div>
              }
              className="ml-2"
            />
          </label>
          <input
            type="number"
            min="0"
            value={data.monthlyOrders === 0 ? '' : data.monthlyOrders}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleChange('monthlyOrders', 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 1) {
                  handleChange('monthlyOrders', numValue);
                }
              }
            }}
            placeholder="Enter number of direct-to-consumer orders"
            className="w-full p-3 sm:p-4 border-2 border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all duration-300 bg-white shadow-inner"
            required
          />
          <p className="text-xs sm:text-sm text-gray-600 mt-2 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            Only count orders from Shopify, Facebook, Wix, and similar platforms
          </p>
        </div>

        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3">
              <Scale className="text-white" size={14} />
            </div>
            Package Weight Distribution (%) *
            <Tooltip 
              content={
                <div>
                  <p className="font-semibold mb-2">J&T Express Weight-Based Pricing:</p>
                  <p className="text-xs mb-1">Rates vary by weight and destination</p>
                  <p className="text-xs mb-1">Metro Manila generally cheaper than outside</p>
                  <p className="text-xs">Excess weight charged ₱20/kg additional</p>
                </div>
              }
              className="ml-2"
            />
          </label>
          <p className="text-sm sm:text-base text-gray-600 mb-6 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            Enter the percentage breakdown of your packages by weight. Total must equal 100%.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-2"></div>
                  ≤1kg (%)
                </label>
                <ServiceExplanation
                  title="Up to 1kg Packages"
                  description="Lightest weight category"
                  details={[
                    "Metro Manila: ₱70.00",
                    "Outside Metro Manila: ₱135.00",
                    "Most cost-effective option",
                    "Ideal for small items"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.weightDistribution.upTo1kg || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleWeightDistributionChange('upTo1kg', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleWeightDistributionChange('upTo1kg', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-2"></div>
                  ≤2kg (%)
                </label>
                <ServiceExplanation
                  title="Up to 2kg Packages"
                  description="Light to medium weight"
                  details={[
                    "Metro Manila: ₱135.00",
                    "Outside Metro Manila: ₱150.00",
                    "Good for multiple small items",
                    "Popular weight range"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.weightDistribution.upTo2kg || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleWeightDistributionChange('upTo2kg', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleWeightDistributionChange('upTo2kg', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-2"></div>
                  ≤3kg (%)
                </label>
                <ServiceExplanation
                  title="Up to 3kg Packages"
                  description="Medium weight category"
                  details={[
                    "Metro Manila: ₱150.00",
                    "Outside Metro Manila: ₱195.00",
                    "Standard medium packages",
                    "Common for bundled items"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.weightDistribution.upTo3kg || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleWeightDistributionChange('upTo3kg', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleWeightDistributionChange('upTo3kg', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-2"></div>
                  ≤5kg (%)
                </label>
                <ServiceExplanation
                  title="Up to 5kg Packages"
                  description="Heavy packages"
                  details={[
                    "Metro Manila: ₱270.00",
                    "Outside Metro Manila: ₱360.00",
                    "For larger items",
                    "Higher shipping costs"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.weightDistribution.upTo5kg || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleWeightDistributionChange('upTo5kg', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleWeightDistributionChange('upTo5kg', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-2"></div>
                  ≤7kg (%)
                </label>
                <ServiceExplanation
                  title="Up to 7kg Packages"
                  description="Heaviest standard category"
                  details={[
                    "Metro Manila: ₱500.00",
                    "Outside Metro Manila: ₱600.00",
                    "For very large items",
                    "Premium shipping rates"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.weightDistribution.upTo7kg || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleWeightDistributionChange('upTo7kg', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleWeightDistributionChange('upTo7kg', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg border border-gray-200">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              Total Weight Distribution: {totalWeightPercentage}%
            </span>
            {totalWeightPercentage !== 100 && (
              <span className="text-xs sm:text-sm text-red-600 font-semibold animate-pulse">
                Must equal 100%
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3">
              <MapPin className="text-white" size={14} />
            </div>
            Delivery Location Distribution (%) *
            <Tooltip 
              content={
                <div>
                  <p className="font-semibold mb-2">Location-Based Pricing:</p>
                  <p className="mb-1"><strong>Metro Manila:</strong> Lower shipping rates</p>
                  <p className="mb-1"><strong>Outside Metro Manila:</strong> Higher shipping rates</p>
                  <p className="text-xs">Rates vary significantly by destination</p>
                </div>
              }
              className="ml-2"
            />
          </label>
          <p className="text-sm sm:text-base text-gray-600 mb-6 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            Enter the percentage of orders delivered to each location. Total must equal 100%.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-2"></div>
                  Metro Manila (%)
                </label>
                <ServiceExplanation
                  title="Metro Manila Delivery"
                  description="Lower shipping rates within Metro Manila"
                  details={[
                    "Covers NCR area",
                    "Faster delivery times",
                    "Lower shipping costs",
                    "Higher delivery success rates"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.locationDistribution.metroManila || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleLocationDistributionChange('metroManila', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleLocationDistributionChange('metroManila', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-2"></div>
                  Outside Metro Manila (%)
                </label>
                <ServiceExplanation
                  title="Outside Metro Manila Delivery"
                  description="Higher shipping rates for provincial areas"
                  details={[
                    "Covers all provinces",
                    "Longer delivery times",
                    "Higher shipping costs",
                    "May require additional handling"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.locationDistribution.outsideMetroManila || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleLocationDistributionChange('outsideMetroManila', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleLocationDistributionChange('outsideMetroManila', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg border border-gray-200">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              Total Location Distribution: {totalLocationPercentage}%
            </span>
            {totalLocationPercentage !== 100 && (
              <span className="text-xs sm:text-sm text-red-600 font-semibold animate-pulse">
                Must equal 100%
              </span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
          <h4 className="font-semibold text-orange-800 mb-4 flex items-center text-base sm:text-lg">
            <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-3"></div>
            J&T Express Standard Delivery
          </h4>
          <ul className="text-orange-700 space-y-2 text-sm sm:text-base">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
              Standard delivery timeframe (2-5 business days)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
              Nationwide coverage across the Philippines
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
              Reliable tracking and delivery confirmation
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-orange-600 rounded-full mr-3"></span>
              Additional charges: COD (2%), Valuation (1%), Return (50% of shipping)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
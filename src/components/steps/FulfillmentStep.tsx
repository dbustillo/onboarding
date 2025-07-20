import React from 'react';
import { Package, Scale, ShoppingCart } from 'lucide-react';
import { Fulfillment } from '../../types';
import { Tooltip } from '../Tooltip';
import { ServiceExplanation } from '../ServiceExplanation';

interface FulfillmentStepProps {
  data: Fulfillment;
  onChange: (data: Fulfillment) => void;
}

export const FulfillmentStep: React.FC<FulfillmentStepProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof Fulfillment, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleDistributionChange = (size: 'small' | 'medium' | 'large' | 'bulky', value: number) => {
    onChange({
      ...data,
      parcelSizeDistribution: {
        ...data.parcelSizeDistribution,
        [size]: value
      }
    });
  };

  const totalPercentage = data.parcelSizeDistribution.small + 
    data.parcelSizeDistribution.medium + 
    data.parcelSizeDistribution.large + 
    data.parcelSizeDistribution.bulky;

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl border border-blue-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl animate-slide-up">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-900 to-teal-600 rounded-xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
          <Package className="text-white" size={24} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-900 to-teal-600 bg-clip-text text-transparent">Fulfillment Services</h2>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-teal-600 rounded-lg mr-3">
              <Package className="text-white" size={14} />
            </div>
            Monthly Outbound Orders *
            <Tooltip 
              content={
                <div>
                  <p className="font-semibold mb-2">Fulfillment Pricing (per order):</p>
                  <p className="mb-1"><strong>1-1,000 orders:</strong> Small ₱30, Medium ₱35, Large ₱40, Bulky ₱50</p>
                  <p className="mb-1"><strong>1,001-5,000 orders:</strong> Small ₱25, Medium ₱30, Large ₱35, Bulky ₱45</p>
                  <p className="mb-1"><strong>5,001-10,000 orders:</strong> Small ₱20, Medium ₱25, Large ₱30, Bulky ₱40</p>
                  <p className="mb-1"><strong>10,001-20,000 orders:</strong> Small ₱17.50, Medium ₱22.50, Large ₱27.50, Bulky ₱37.50</p>
                  <p><strong>20,001+ orders:</strong> Small ₱15, Medium ₱20, Large ₱25, Bulky ₱35</p>
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
            placeholder="Enter number of orders"
            className="w-full p-3 sm:p-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 bg-white shadow-inner"
            required
          />
        </div>

        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-teal-600 rounded-lg mr-3">
              <ShoppingCart className="text-white" size={14} />
            </div>
            Average Items per Order *
            <Tooltip 
              content={
                <div>
                  <p className="font-semibold mb-2">Additional Item Pricing:</p>
                  <p className="mb-1"><strong>First item:</strong> Standard fulfillment rate applies</p>
                  <p className="mb-1"><strong>Additional items:</strong> ₱5.00 per item (beyond the first)</p>
                  <p className="mb-2"><strong>Logic:</strong> Largest item determines parcel size category</p>
                  <p className="text-xs">Example: 3 items = 1st item (₱30 fulfillment rate) + 2 additional items (2 × ₱5.00)</p>
                </div>
              }
              className="ml-2"
            />
          </label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={data.averageItemsPerOrder === 0 ? '' : data.averageItemsPerOrder}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleChange('averageItemsPerOrder', 0);
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0.1) {
                  handleChange('averageItemsPerOrder', numValue);
                }
              }
            }}
            placeholder="Enter average items per order"
            className="w-full p-3 sm:p-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 bg-white shadow-inner"
            required
          />
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200">
            <strong>Additional Item Logic:</strong> The largest item determines the parcel size category and gets the standard fulfillment rate. Each additional item beyond the first is charged ₱5.00.
          </p>
        </div>

        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-teal-600 rounded-lg mr-3">
              <Scale className="text-white" size={14} />
            </div>
            Parcel Size Distribution (%) *
            <Tooltip 
              content={
                <div>
                <p className="font-semibold mb-2">Fulfillment Rates by Volume:</p>
                <p className="mb-1"><strong>1-1,000 orders/month:</strong></p>
                <p className="text-xs mb-2">Small ₱30 | Medium ₱35 | Large ₱40 | Bulky ₱50</p>
                <p className="mb-1"><strong>1,001-5,000 orders/month:</strong></p>
                <p className="text-xs mb-2">Small ₱25 | Medium ₱30 | Large ₱35 | Bulky ₱45</p>
                <p className="mb-1"><strong>5,001+ orders/month:</strong></p>
                <p className="text-xs">Small ₱20-15 | Medium ₱25-20 | Large ₱30-25 | Bulky ₱40-35</p>
                </div>
              }
              className="ml-2"
            />
          </label>
          <p className="text-sm sm:text-base text-gray-600 mb-6 p-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200">
            Enter the percentage breakdown of your orders by parcel size. Total must equal 100%.
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full mr-2"></div>
                  Small (%)
                </label>
                <ServiceExplanation
                  title="Small Parcels"
                  description="₱30-15 per order (volume-based pricing)"
                  details={[
                    "Weight: Up to 1kg",
                    "1-1,000 orders: ₱30.00",
                    "1,001-5,000 orders: ₱25.00", 
                    "5,001-10,000 orders: ₱20.00",
                    "10,001-20,000 orders: ₱17.50",
                    "20,001+ orders: ₱15.00"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.parcelSizeDistribution.small || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleDistributionChange('small', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleDistributionChange('small', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-cyan-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-900 rounded-full mr-2"></div>
                  Medium (%)
                </label>
                <ServiceExplanation
                  title="Medium Parcels"
                  description="₱35-20 per order (volume-based pricing)"
                  details={[
                    "Weight: 1-3kg",
                    "1-1,000 orders: ₱35.00",
                    "1,001-5,000 orders: ₱30.00",
                    "5,001-10,000 orders: ₱25.00", 
                    "10,001-20,000 orders: ₱22.50",
                    "20,001+ orders: ₱20.00"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.parcelSizeDistribution.medium || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleDistributionChange('medium', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleDistributionChange('medium', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full mr-2"></div>
                  Large (%)
                </label>
                <ServiceExplanation
                  title="Large Parcels"
                  description="₱40-25 per order (volume-based pricing)"
                  details={[
                    "Weight: 3-7kg",
                    "1-1,000 orders: ₱40.00",
                    "1,001-5,000 orders: ₱35.00",
                    "5,001-10,000 orders: ₱30.00",
                    "10,001-20,000 orders: ₱27.50", 
                    "20,001+ orders: ₱25.00"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.parcelSizeDistribution.large || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleDistributionChange('large', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleDistributionChange('large', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-cyan-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-900 rounded-full mr-2"></div>
                  Bulky (%)
                </label>
                <ServiceExplanation
                  title="Bulky Parcels"
                  description="₱50-35 per order (volume-based pricing)"
                  details={[
                    "Weight: Over 7kg or oversized dimensions",
                    "1-1,000 orders: ₱50.00",
                    "1,001-5,000 orders: ₱45.00",
                    "5,001-10,000 orders: ₱40.00",
                    "10,001-20,000 orders: ₱37.50",
                    "20,001+ orders: ₱35.00"
                  ]}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={data.parcelSizeDistribution.bulky || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleDistributionChange('bulky', 0);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                      handleDistributionChange('bulky', numValue);
                    }
                  }
                }}
                className="w-full p-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 bg-white shadow-inner"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-cyan-50 rounded-lg border border-gray-200">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              Total: {totalPercentage}%
            </span>
            {totalPercentage !== 100 && (
              <span className="text-xs sm:text-sm text-red-600 font-semibold animate-pulse">
                Must equal 100%
              </span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
          <h4 className="font-semibold text-blue-800 mb-4 flex items-center text-base sm:text-lg">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full mr-3"></div>
            Included Services
          </h4>
          <ul className="text-blue-700 space-y-2 text-sm sm:text-base">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Free packaging materials (bubble wrap, tape, pouches)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Pick, pack, and ship services
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Quality control and inspection
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
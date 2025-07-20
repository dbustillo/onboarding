import React from 'react';
import { Calculator, Package, Warehouse, Truck, BarChart3, Gift, Star, Zap, Shield, Award } from 'lucide-react';
import { AMBIENT_STORAGE_TIERS, TEMP_CONTROLLED_STORAGE_TIERS, FULFILLMENT_TIERS, PRICING_CONSTANTS } from '../../utils/pricingEngine';

interface PricingOverviewStepProps {
  onStartQuote: () => void;
}

export const PricingOverviewStep: React.FC<PricingOverviewStepProps> = ({ onStartQuote }) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-cyan-400/10 rounded-3xl"></div>
        <div className="relative z-10 p-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 animate-slide-up">
            Enterprise Fulfillment Solutions & Pricing
          </h1>
          <p className="text-lg sm:text-xl text-white font-bold mb-8 animate-slide-up animation-delay-200">
            Scalable warehousing and fulfillment solutions designed for growing businesses
          </p>
        <button
          onClick={onStartQuote}
          className="bg-gradient-to-r from-cyan-400 to-cyan-300 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-bold hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl animate-pulse-slow shadow-xl"
        >
          Get Custom Quote
        </button>
        </div>
      </div>

      {/* Storage Pricing - Modern Card Layout */}
      <div className="bg-gradient-to-br from-white to-cyan-50 rounded-3xl shadow-2xl border border-cyan-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl lg:hover:scale-102 animate-slide-up overflow-hidden relative">
        {/* Background decoration */}
        <div className="hidden lg:block absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="hidden lg:block absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-100/20 to-blue-100/20 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-2xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
              <Warehouse className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent">Storage Pricing</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Tier-based pricing that scales with your volume</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Ambient Storage - Modern Card Design */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105">
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold flex items-center">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                      Ambient Storage
                    </h3>
                    <p className="text-sm text-blue-100 mt-1">per CBM/month</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Package className="text-white" size={20} />
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {AMBIENT_STORAGE_TIERS.map((tier, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 hover:shadow-lg transition-all duration-300 transform lg:hover:scale-102">
                        <div className="flex items-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-3 sm:mr-4">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 text-sm sm:text-lg">
                              {tier.min} to {tier.max || '∞'} CBM
                            </span>
                            <p className="text-xs sm:text-sm text-gray-600">Volume tier {index + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg sm:text-2xl font-bold text-blue-900 group-hover:text-cyan-400 transition-colors">
                            {formatCurrency(tier.rate)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">per CBM</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Temperature-Controlled Storage - Modern Card Design */}
            <div className="bg-white rounded-2xl shadow-xl border border-cyan-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105">
              <div className="bg-gradient-to-r from-cyan-400 to-blue-900 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold flex items-center">
                      <div className="w-3 h-3 bg-blue-100 rounded-full mr-3 animate-pulse"></div>
                      Temperature-Controlled
                    </h3>
                    <p className="text-sm text-cyan-100 mt-1">per CBM/month</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Zap className="text-white" size={20} />
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {TEMP_CONTROLLED_STORAGE_TIERS.map((tier, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 hover:shadow-lg transition-all duration-300 transform lg:hover:scale-102">
                        <div className="flex items-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-cyan-400 to-blue-900 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-3 sm:mr-4">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 text-sm sm:text-lg">
                              {tier.min} to {tier.max || '∞'} CBM
                            </span>
                            <p className="text-xs sm:text-sm text-gray-600">Premium tier {index + 1}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg sm:text-2xl font-bold text-blue-900 group-hover:text-cyan-400 transition-colors">
                            {formatCurrency(tier.rate)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">per CBM</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fulfillment Pricing - Interactive Grid */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border border-blue-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl lg:hover:scale-102 animate-slide-up animation-delay-200 overflow-hidden relative">
        {/* Background decoration */}
        <div className="hidden lg:block absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-cyan-100/20 to-blue-100/20 rounded-full -translate-y-36 -translate-x-36"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-2xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent">Fulfillment Pricing</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Volume-based rates per order</p>
            </div>
          </div>
          
          {/* Modern Grid Layout */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 sm:p-6">
              <div className="hidden sm:grid grid-cols-5 gap-4 text-white">
                <div className="font-bold text-sm lg:text-lg">Monthly Orders</div>
                <div className="text-center font-bold text-sm lg:text-lg">Small</div>
                <div className="text-center font-bold text-sm lg:text-lg">Medium</div>
                <div className="text-center font-bold text-sm lg:text-lg">Large</div>
                <div className="text-center font-bold text-sm lg:text-lg">Bulky</div>
              </div>
              <div className="sm:hidden text-white text-center">
                <div className="font-bold text-lg">Fulfillment Rates</div>
                <div className="text-sm text-blue-100">per order by volume</div>
              </div>
            </div>
            
            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {FULFILLMENT_TIERS.map((tier, index) => (
                <div key={index} className="p-4 sm:p-6 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all duration-300 group">
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{tier.orderRange}</div>
                        <div className="text-xs text-gray-500">orders/month</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Small</div>
                        <div className="text-lg font-bold text-blue-900">{formatCurrency(tier.small)}</div>
                      </div>
                      <div className="text-center p-3 bg-cyan-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Medium</div>
                        <div className="text-lg font-bold text-blue-900">{formatCurrency(tier.medium)}</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Large</div>
                        <div className="text-lg font-bold text-blue-900">{formatCurrency(tier.large)}</div>
                      </div>
                      <div className="text-center p-3 bg-cyan-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Bulky</div>
                        <div className="text-lg font-bold text-blue-900">{formatCurrency(tier.bulky)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden sm:grid grid-cols-5 gap-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 lg:mr-4 group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 text-sm lg:text-base">{tier.orderRange}</div>
                        <div className="text-xs lg:text-sm text-gray-500">orders/month</div>
                    </div>
                  </div>
                    <div className="text-center">
                      <div className="text-lg lg:text-xl font-bold text-blue-900 group-hover:text-cyan-400 transition-colors">
                      {formatCurrency(tier.small)}
                    </div>
                      <div className="text-xs text-gray-500">per order</div>
                  </div>
                    <div className="text-center">
                      <div className="text-lg lg:text-xl font-bold text-blue-900 group-hover:text-cyan-400 transition-colors">
                      {formatCurrency(tier.medium)}
                    </div>
                      <div className="text-xs text-gray-500">per order</div>
                  </div>
                    <div className="text-center">
                      <div className="text-lg lg:text-xl font-bold text-blue-900 group-hover:text-cyan-400 transition-colors">
                      {formatCurrency(tier.large)}
                    </div>
                      <div className="text-xs text-gray-500">per order</div>
                  </div>
                    <div className="text-center">
                      <div className="text-lg lg:text-xl font-bold text-blue-900 group-hover:text-cyan-400 transition-colors">
                      {formatCurrency(tier.bulky)}
                    </div>
                      <div className="text-xs text-gray-500">per order</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
            <p className="text-xs sm:text-sm text-gray-700 flex items-center">
              <Star className="text-cyan-400 mr-2" size={16} />
              <strong>Note:</strong> Fulfillment includes pick, pack, dispatch with bubble wrapping and pouch
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Services - Modern Card Grid */}
      <div className="bg-gradient-to-br from-white to-cyan-50 rounded-3xl shadow-2xl border border-cyan-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl lg:hover:scale-102 animate-slide-up animation-delay-400">
        <div className="flex items-center mb-6 sm:mb-8">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-2xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
            <BarChart3 className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent">Complete Service Fees</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Comprehensive billing breakdown</p>
          </div>
        </div>
        
        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Storage Services */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105 hover:shadow-xl">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 text-white">
              <div className="flex items-center">
                <Warehouse className="mr-2 sm:mr-3" size={16} />
                <h3 className="font-bold text-sm sm:text-base">Storage Services</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Ambient Storage</div>
                  <div className="text-xs text-gray-600">Minimum 1 CBM</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱650.00</div>
                  <div className="text-xs text-gray-500">per CBM/month</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Temperature-Controlled</div>
                  <div className="text-xs text-gray-600">24/7 controlled environment</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱750.00</div>
                  <div className="text-xs text-gray-500">per CBM/month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment Services */}
          <div className="bg-white rounded-2xl shadow-lg border border-cyan-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105 hover:shadow-xl">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-900 p-4 text-white">
              <div className="flex items-center">
                <Package className="mr-2 sm:mr-3" size={16} />
                <h3 className="font-bold text-sm sm:text-base">Fulfillment Services</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Pick & Pack</div>
                  <div className="text-xs text-gray-600">Volume-based pricing</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱30.00</div>
                  <div className="text-xs text-gray-500">per order</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Additional Items</div>
                  <div className="text-xs text-gray-600">Beyond first item</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱5.00</div>
                  <div className="text-xs text-gray-500">per item</div>
                </div>
              </div>
            </div>
          </div>

          {/* Free Services */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105 hover:shadow-xl sm:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 text-white">
              <div className="flex items-center">
                <Gift className="mr-2 sm:mr-3" size={16} />
                <h3 className="font-bold text-sm sm:text-base">Free Services</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Quality Checking</div>
                  <div className="text-xs text-gray-600">Receiving & putaway</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 animate-pulse text-sm sm:text-base">Free</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Kitting & Bundling</div>
                  <div className="text-xs text-gray-600">Preparation work</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 animate-pulse text-sm sm:text-base">Free</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Fusion Platform</div>
                  <div className="text-xs text-gray-600">₱50,000+ value</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 animate-pulse text-sm sm:text-base">Free</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Services */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105 hover:shadow-xl">
            <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-4 text-white">
              <div className="flex items-center">
                <Calculator className="mr-2 sm:mr-3" size={16} />
                <h3 className="font-bold text-sm sm:text-base">Additional Services</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Barcoding</div>
                  <div className="text-xs text-gray-600">Print & mount</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱2.50</div>
                  <div className="text-xs text-gray-500">per item</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Inventory Count</div>
                  <div className="text-xs text-gray-600">Manual counting</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱1.00</div>
                  <div className="text-xs text-gray-500">per piece</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Returns Handling</div>
                  <div className="text-xs text-gray-600">Quality check</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱7.50</div>
                  <div className="text-xs text-gray-500">per order</div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Box Materials */}
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105 hover:shadow-xl">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 text-white">
              <div className="flex items-center">
                <Package className="mr-2 sm:mr-3" size={16} />
                <h3 className="font-bold text-sm sm:text-base">Premium Boxes</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Small Box</div>
                  <div className="text-xs text-gray-600">29.97 × 24.38 × 16 cm</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱15.50</div>
                  <div className="text-xs text-gray-500">per box</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Medium Box</div>
                  <div className="text-xs text-gray-600">36.07 × 26.92 × 17.78 cm</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱19.00</div>
                  <div className="text-xs text-gray-500">per box</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Large Box</div>
                  <div className="text-xs text-gray-600">45.97 × 36.07 × 32 cm</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">₱25.00</div>
                  <div className="text-xs text-gray-500">per box</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fusion Platform Highlight */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden transform transition-all duration-300 lg:hover:scale-105 hover:shadow-xl sm:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-r from-green-600 to-cyan-400 p-4 text-white">
              <div className="flex items-center">
                <Award className="mr-2 sm:mr-3" size={16} />
                <h3 className="font-bold text-sm sm:text-base">Fusion Platform</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-center mb-4">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 animate-pulse">FREE</div>
                <div className="text-xs sm:text-sm text-gray-600">₱50,000+ Annual Value</div>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center text-gray-700">
                  <Shield className="text-green-500 mr-2" size={12} />
                  Order Management System
                </div>
                <div className="flex items-center text-gray-700">
                  <Shield className="text-green-500 mr-2" size={12} />
                  Warehouse Management
                </div>
                <div className="flex items-center text-gray-700">
                  <Shield className="text-green-500 mr-2" size={12} />
                  Enterprise Resource Planning
                </div>
                <div className="flex items-center text-gray-700">
                  <Shield className="text-green-500 mr-2" size={12} />
                  Real-time Analytics
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Services - Modern Layout */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-4 sm:p-8 overflow-hidden relative">
        <div className="hidden lg:block absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100/30 to-red-100/30 rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mr-3 sm:mr-4 shadow-lg">
              <Truck className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Delivery Services</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Direct-to-consumer shipping rates</p>
            </div>
          </div>
          
          <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
              <Star className="text-blue-600 mr-2" size={16} />
              Important Note
            </h4>
            <p className="text-blue-700 text-sm sm:text-base">
              These rates apply when selling direct-to-consumer (Facebook, Shopify, Wix, etc.). 
              For marketplace platforms (Lazada, Shopee, TikTok), shipping rates are handled by the platform.
            </p>
          </div>

          {/* J&T Express Rates */}
          <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">J&T Express Standard</h3>
                  <p className="text-sm text-orange-100 mt-1">Non-Marketplace Rates</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Truck className="text-white" size={20} />
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center text-sm sm:text-base">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                    Metro Manila
                  </h4>
                  <div className="space-y-3">
                    {[
                      { weight: '≤ 1kg', price: '₱70' },
                      { weight: '≤ 2kg', price: '₱135' },
                      { weight: '≤ 3kg', price: '₱150' },
                      { weight: '≤ 5kg', price: '₱270' },
                      { weight: '≤ 7kg', price: '₱500' }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">{item.weight}</span>
                        <span className="font-bold text-orange-600 text-sm sm:text-base">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center text-sm sm:text-base">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    Outside Metro Manila
                  </h4>
                  <div className="space-y-3">
                    {[
                      { weight: '≤ 1kg', price: '₱135' },
                      { weight: '≤ 2kg', price: '₱150' },
                      { weight: '≤ 3kg', price: '₱195' },
                      { weight: '≤ 5kg', price: '₱360' },
                      { weight: '≤ 7kg', price: '₱600' }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-gray-700 text-sm sm:text-base">{item.weight}</span>
                        <span className="font-bold text-red-600 text-sm sm:text-base">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs sm:text-sm text-yellow-800 font-medium">
                  <strong>Excess Weight:</strong> ₱20 per kg for packages over 7kg
                </p>
              </div>
            </div>
          </div>

          {/* Additional Surcharges */}
          <div className="bg-white rounded-2xl shadow-xl border border-yellow-100 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 sm:p-6 text-white">
              <div className="flex items-center">
                <Calculator className="mr-2 sm:mr-3" size={20} />
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">Additional Surcharges</h3>
                  <p className="text-sm text-yellow-100 mt-1">J&T Express Only</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600 mb-2">2%</div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">COD Fee</div>
                  <div className="text-xs sm:text-sm text-gray-600">Cash on delivery</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-2">1%</div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Valuation</div>
                  <div className="text-xs sm:text-sm text-gray-600">Package value</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="text-xl sm:text-2xl font-bold text-red-600 mb-2">50%</div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">Return Fee</div>
                  <div className="text-xs sm:text-sm text-gray-600">Of shipping cost</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-blue-900 to-cyan-400 rounded-3xl p-6 sm:p-12 text-white shadow-2xl">
        <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100">Generate a personalized estimate based on your specific requirements</p>
        <button
          onClick={onStartQuote}
          className="bg-gradient-to-r from-cyan-400 to-cyan-300 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-bold hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 transform hover:scale-105 shadow-xl animate-pulse-slow"
        >
          Start Your Custom Quote
        </button>
      </div>
    </div>
  );
};
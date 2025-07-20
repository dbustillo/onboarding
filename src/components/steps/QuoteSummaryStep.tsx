import React, { useState } from 'react';
import { FileText, Download, ChevronDown, ChevronUp, Calendar, Calculator, Shield } from 'lucide-react';
import { CostBreakdown } from '../../types';

interface QuoteSummaryStepProps {
  costs: CostBreakdown;
  includeVat: boolean;
  onToggleVat: (include: boolean) => void;
  onDownloadPDF: () => void;
  onRestartQuote: () => void;
  onViewSLA?: () => void;
  data: any; // We'll need this to get the months
}

export const QuoteSummaryStep: React.FC<QuoteSummaryStepProps> = ({ 
  costs, 
  includeVat, 
  onToggleVat, 
  onDownloadPDF,
  onRestartQuote,
  onViewSLA,
  data
}) => {
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);
  
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const months = data?.warehousing?.expectedMonths || 1;

  // Calculate monthly costs
  // Storage costs are calculated for total duration, so divide by months for monthly rate
  // Fulfillment costs are monthly recurring, so use as-is for monthly view
  const monthlyCosts = {
    ambientStorage: costs.ambientStorage / months,
    tempControlledStorage: costs.tempControlledStorage / months,
    fulfillment: costs.fulfillment,
    additionalItems: costs.additionalItems,
    shipping: costs.shipping,
    subtotal: 0,
    vat: 0,
    total: 0
  };
  
  monthlyCosts.subtotal = monthlyCosts.ambientStorage + monthlyCosts.tempControlledStorage + monthlyCosts.fulfillment + monthlyCosts.additionalItems + monthlyCosts.shipping;
  monthlyCosts.vat = monthlyCosts.subtotal * (includeVat ? 0.12 : 0);
  monthlyCosts.total = monthlyCosts.subtotal + monthlyCosts.vat;

  // Calculate total costs for the entire duration
  const totalCosts = {
    ambientStorage: costs.ambientStorage,
    tempControlledStorage: costs.tempControlledStorage,
    fulfillment: costs.fulfillment * months,
    additionalItems: costs.additionalItems * months,
    shipping: costs.shipping * months,
    subtotal: 0,
    vat: 0,
    total: 0
  };
  
  totalCosts.subtotal = totalCosts.ambientStorage + totalCosts.tempControlledStorage + totalCosts.fulfillment + totalCosts.additionalItems + totalCosts.shipping;
  totalCosts.vat = totalCosts.subtotal * (includeVat ? 0.12 : 0);
  totalCosts.total = totalCosts.subtotal + totalCosts.vat;

  const costItems = [
    { label: 'Ambient Storage', amount: totalCosts.ambientStorage, monthlyAmount: monthlyCosts.ambientStorage, description: `Storage fees for ${months} months total` },
    { label: 'Temp-Controlled Storage', amount: totalCosts.tempControlledStorage, monthlyAmount: monthlyCosts.tempControlledStorage, description: `Storage fees for ${months} months total` },
    { label: 'Fulfillment Services', amount: totalCosts.fulfillment, monthlyAmount: monthlyCosts.fulfillment, description: 'Pick, pack, and ship (monthly recurring)' },
    { label: 'Additional Items', amount: totalCosts.additionalItems, monthlyAmount: monthlyCosts.additionalItems, description: '₱5.00 per extra item in orders (monthly recurring)' },
    { label: 'Shipping (J&T Express)', amount: totalCosts.shipping, monthlyAmount: monthlyCosts.shipping, description: 'Direct-to-consumer shipping (monthly recurring)' },
  ].filter(item => item.amount > 0);

  return (
    <div className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl shadow-2xl border border-cyan-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl animate-slide-up">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
          <FileText className="text-white" size={24} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent">Quote Summary</h2>
      </div>

      <div className="space-y-8">
        {/* Main Cost Summary */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 sm:p-8 rounded-2xl border border-cyan-200 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full mr-3"></div>
              Cost Summary
            </h3>
            <div className="text-xs sm:text-sm text-gray-600 bg-white px-2 sm:px-3 py-1 rounded-full border border-gray-200">
              <span className="block text-center">{months} month{months > 1 ? 's' : ''} duration</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {costItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 px-3 sm:px-4 bg-white rounded-xl border border-cyan-100 shadow-sm hover:shadow-md transition-all duration-300 transform lg:hover:scale-102">
                <div>
                  <span className="font-semibold text-gray-800 text-sm sm:text-base">{item.label}</span>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
                <span className="font-bold text-blue-900 text-sm sm:text-lg">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-cyan-200 pt-6 mt-6 space-y-4">
            <div className="flex justify-between text-base sm:text-lg font-semibold p-3 bg-white rounded-xl border border-cyan-100">
              <span className="text-gray-800">Subtotal ({months} month{months > 1 ? 's' : ''})</span>
              <span className="text-blue-900">{formatCurrency(totalCosts.subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-cyan-100">
              <span className="text-gray-700 font-medium text-sm sm:text-base">VAT (12%)</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleVat(!includeVat)}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    includeVat 
                      ? 'bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg font-bold' 
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                  }`}
                >
                  {includeVat ? 'Included' : 'Excluded'}
                </button>
                <span className="font-semibold text-blue-900 text-sm sm:text-base">{formatCurrency(totalCosts.vat)}</span>
              </div>
            </div>

            <div className="border-t-2 border-cyan-200 pt-4">
              <div className="bg-gradient-to-r from-blue-900 to-cyan-400 text-white rounded-xl shadow-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-base sm:text-lg font-bold">Total Cost</span>
                    <span className="text-xs sm:text-sm text-blue-100">
                      Duration: {months} month{months > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-bold animate-pulse">
                      {formatCurrency(totalCosts.total)}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-100">
                      {months > 1 ? `≈ ${formatCurrency(totalCosts.total / months)}/month` : 'Monthly rate'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Accordion */}
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
            className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-blue-100 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3">
                <Calendar className="text-white" size={16} />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-blue-800 text-base sm:text-lg">Monthly Cost Breakdown</h4>
                <p className="text-xs sm:text-sm text-blue-600">View detailed monthly costs vs total costs</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right">
                <div className="text-base sm:text-lg font-bold text-blue-900">{formatCurrency(monthlyCosts.total)}</div>
                <div className="text-xs sm:text-sm text-blue-600">per month</div>
              </div>
              {showMonthlyBreakdown ? (
                <ChevronUp className="text-blue-600" size={20} />
              ) : (
                <ChevronDown className="text-blue-600" size={20} />
              )}
            </div>
          </button>

          {showMonthlyBreakdown && (
            <div className="border-t border-blue-200 p-4 sm:p-6 bg-white animate-slide-down">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Monthly Costs */}
                <div className="bg-gradient-to-r from-green-50 to-cyan-50 p-4 sm:p-6 rounded-xl border border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gradient-to-r from-green-600 to-cyan-400 rounded-lg mr-3">
                      <Calendar className="text-white" size={14} />
                    </div>
                    <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Monthly Costs</h5>
                  </div>
                  <div className="space-y-3">
                    {costItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="font-semibold text-green-700">{formatCurrency(item.monthlyAmount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-green-200 pt-3 mt-3">
                      <div className="flex justify-between text-xs sm:text-sm font-medium">
                        <span className="text-gray-700">Monthly Subtotal</span>
                        <span className="text-green-700">{formatCurrency(monthlyCosts.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-700">Monthly VAT (12%)</span>
                        <span className="text-green-700">{formatCurrency(monthlyCosts.vat)}</span>
                      </div>
                      <div className="flex justify-between text-base sm:text-lg font-bold mt-2 pt-2 border-t border-green-200">
                        <span className="text-gray-800">Monthly Total</span>
                        <span className="text-green-800">{formatCurrency(monthlyCosts.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Costs */}
                <div className="bg-gradient-to-r from-cyan-50 to-purple-50 p-4 sm:p-6 rounded-xl border border-cyan-200">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg mr-3">
                      <Calculator className="text-white" size={14} />
                    </div>
                    <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Total Costs ({months} months)</h5>
                  </div>
                  <div className="space-y-3">
                    {costItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="font-semibold text-blue-700">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-blue-200 pt-3 mt-3">
                      <div className="flex justify-between text-xs sm:text-sm font-medium">
                        <span className="text-gray-700">Total Subtotal</span>
                        <span className="text-cyan-400">{formatCurrency(totalCosts.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-700">Total VAT (12%)</span>
                        <span className="text-cyan-400">{formatCurrency(totalCosts.vat)}</span>
                      </div>
                      <div className="flex justify-between text-base sm:text-lg font-bold mt-2 pt-2 border-t border-cyan-200">
                        <span className="text-gray-800">Grand Total</span>
                        <span className="text-cyan-600">{formatCurrency(totalCosts.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                <h6 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Cost Calculation Logic</h6>
                <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Storage costs:</strong> One-time setup for {months} month{months > 1 ? 's' : ''} duration</li>
                  <li>• <strong>Fulfillment costs:</strong> Monthly recurring charges × {months} months</li>
                  <li>• <strong>Monthly view:</strong> Shows what you pay each month</li>
                  <li>• <strong>Total view:</strong> Shows complete cost for entire {months}-month period</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-4 sm:p-6 shadow-lg">
          <h4 className="font-semibold text-cyan-600 mb-4 flex items-center text-base sm:text-lg">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-full mr-3"></div>
            Important Notes
          </h4>
          <ul className="text-cyan-600 space-y-2 text-xs sm:text-sm">
            <li>• Pricing is comprehensive but may include additional services not covered in this quote</li>
            <li>• All amounts are in Philippine Pesos (₱)</li>
            <li>• VAT is excluded unless specifically toggled on</li>
            <li>• Storage costs: One-time for {months} month{months > 1 ? 's' : ''} duration</li>
            <li>• Fulfillment costs: Monthly recurring × {months} months total</li>
            <li>• Additional services like barcoding, returns handling, and COD fees may apply</li>
            <li>• Final pricing subject to service level agreement terms</li>
            <li>• Quote valid for 30 days from generation date</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <button
            onClick={onRestartQuote}
            className="flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-400 to-cyan-300 text-white rounded-xl hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold text-sm sm:text-base"
          >
            <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V9H4.58152M4.58152 9C5.24618 7.35817 6.43236 5.9735 7.96033 5.08493C9.4883 4.19635 11.2680 3.8577 13.033 4.12104C14.798 4.38439 16.4222 5.23107 17.6466 6.52493C18.8710 7.81879 19.6242 9.47939 19.7934 11.2525M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.7538 16.6418 17.5676 18.0265 16.0397 18.9151C14.5117 19.8036 12.732 20.1423 10.967 19.879C9.20197 19.6156 7.57778 18.7689 6.35338 17.4751C5.12897 16.1812 4.37584 14.5206 4.20657 12.7475M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Restart Quote
          </button>
          {onViewSLA && (
            <button
              onClick={onViewSLA}
              className="flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold text-sm sm:text-base"
            >
              <Shield className="mr-2" size={16} />
              <span className="hidden sm:inline">View Service Level Agreement</span>
              <span className="sm:hidden">View SLA</span>
            </button>
          )}
          <button
            onClick={onDownloadPDF}
            className="flex items-center justify-center px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl hover:from-blue-800 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl animate-pulse-slow font-bold text-sm sm:text-base"
          >
            <Download className="mr-2" size={16} />
            Download PDF Quote
          </button>
        </div>
      </div>
    </div>
  );
};
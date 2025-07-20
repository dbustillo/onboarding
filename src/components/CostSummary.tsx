import React from 'react';
import { Calculator, ToggleLeft, ToggleRight } from 'lucide-react';
import { CostBreakdown } from '../types';

interface CostSummaryProps {
  costs: CostBreakdown;
  includeVat: boolean;
  onToggleVat: (include: boolean) => void;
  className?: string;
}

export const CostSummary: React.FC<CostSummaryProps> = ({ 
  costs, 
  includeVat, 
  onToggleVat, 
  className = '' 
}) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const costItems = [
    { label: 'Ambient Storage', amount: costs.ambientStorage },
    { label: 'Temp-Controlled Storage', amount: costs.tempControlledStorage },
    { label: 'Fulfillment', amount: costs.fulfillment },
    { label: 'Additional Items', amount: costs.additionalItems },
    { label: 'Shipping (J&T Express)', amount: costs.shipping },
  ].filter(item => item.amount > 0);

  return (
    <div className={`bg-gradient-to-br from-white to-cyan-50 rounded-2xl shadow-2xl border border-cyan-100 p-4 sm:p-6 backdrop-blur-sm ${className} transform transition-all duration-300 hover:shadow-3xl lg:hover:scale-105`}>
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3 shadow-lg">
          <Calculator className="text-white" size={16} />
        </div>
        <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent">Cost Summary</h3>
      </div>
      
      <div className="space-y-3 mb-4">
        {costItems.map((item, index) => (
          <div key={index} className="flex justify-between text-xs sm:text-sm p-2 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 transition-all duration-200 hover:shadow-md">
            <span className="text-gray-700 font-medium">{item.label}</span>
            <span className="font-semibold text-blue-900">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-cyan-200 pt-4 space-y-3">
        <div className="flex justify-between text-xs sm:text-sm font-medium">
          <span className="text-gray-700">Subtotal</span>
          <span className="text-blue-900">{formatCurrency(costs.subtotal)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-700">VAT (12%)</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleVat(!includeVat)}
              className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-blue-900 to-blue-700 text-white hover:from-blue-800 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold"
            >
              {includeVat ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              <span>{includeVat ? 'Exclude' : 'Include'}</span>
            </button>
            <span className="text-xs sm:text-sm font-medium text-blue-900">{formatCurrency(costs.vat)}</span>
          </div>
        </div>

        <div className="border-t border-cyan-200 pt-3">
          <div className="flex justify-between text-base sm:text-lg font-bold text-blue-900 p-3 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
            <span>Total</span>
            <span>{formatCurrency(costs.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-cyan-50 p-3 rounded-lg border border-gray-200">
        <p>* Prices are estimates only and exclude 12% VAT unless toggled.</p>
        <p>* All amounts are in Philippine Pesos (₱).</p>
      </div>
    </div>
  );
};
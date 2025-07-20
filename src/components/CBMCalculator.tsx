import React, { useState } from 'react';
import { Calculator, X, Package, Plus, Trash2 } from 'lucide-react';

interface SKU {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
}

interface CBMCalculatorProps {
  onCalculate?: (cbm: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CBMCalculator: React.FC<CBMCalculatorProps> = ({ onCalculate, isOpen, onClose }) => {
  const [skus, setSKUs] = useState<SKU[]>([
    {
      id: '1',
      name: 'Product 1',
      length: 0,
      width: 0,
      height: 0,
      quantity: 1
    }
  ]);

  const addSKU = () => {
    if (skus.length < 20) {
      const newSKU: SKU = {
        id: Date.now().toString(),
        name: `Product ${skus.length + 1}`,
        length: 0,
        width: 0,
        height: 0,
        quantity: 1
      };
      setSKUs([...skus, newSKU]);
    }
  };

  const removeSKU = (id: string) => {
    if (skus.length > 1) {
      setSKUs(skus.filter(sku => sku.id !== id));
    }
  };

  const updateSKU = (id: string, field: keyof SKU, value: string | number) => {
    setSKUs(skus.map(sku => 
      sku.id === id ? { ...sku, [field]: value } : sku
    ));
  };

  const calculateTotalCBM = () => {
    return skus.reduce((total, sku) => {
      const cbm = (sku.length * sku.width * sku.height * sku.quantity) / 1000000;
      return total + cbm;
    }, 0);
  };

  const handleUseResult = () => {
    const result = calculateTotalCBM();
    if (onCalculate) {
      onCalculate(result);
    }
    onClose();
  };

  const handleClose = () => {
    // Reset to single SKU when closing
    setSKUs([{
      id: '1',
      name: 'Product 1',
      length: 0,
      width: 0,
      height: 0,
      quantity: 1
    }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3">
              <Calculator className="text-white" size={16} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">CBM Calculator</h3>
              <p className="text-xs sm:text-sm text-gray-600">Calculate storage volume for multiple products</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 240px)' }}>
          <div className="space-y-6">
            {skus.map((sku, index) => (
              <div key={sku.id} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3">
                      <Package className="text-white" size={14} />
                    </div>
                    <input
                      type="text"
                      value={sku.name}
                      onChange={(e) => updateSKU(sku.id, 'name', e.target.value)}
                      className="font-semibold text-gray-800 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-2 py-1 text-sm sm:text-base"
                      placeholder="Product name"
                    />
                  </div>
                  {skus.length > 1 && (
                    <button
                      onClick={() => removeSKU(sku.id)}
                      className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove this product"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      value={sku.length || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateSKU(sku.id, 'length', value === '' ? 0 : parseFloat(value) || 0);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      value={sku.width || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateSKU(sku.id, 'width', value === '' ? 0 : parseFloat(value) || 0);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={sku.height || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateSKU(sku.id, 'height', value === '' ? 0 : parseFloat(value) || 0);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={sku.quantity || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateSKU(sku.id, 'quantity', value === '' ? 1 : parseInt(value) || 1);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>

                {/* Individual SKU CBM */}
                <div className="mt-3 text-right">
                  <span className="text-xs sm:text-sm text-gray-600">
                    CBM: <span className="font-semibold text-blue-900">
                      {((sku.length * sku.width * sku.height * sku.quantity) / 1000000).toFixed(3)} m³
                    </span>
                  </span>
                </div>
              </div>
            ))}

            {/* Add SKU Button */}
            {skus.length < 20 && (
              <button
                onClick={addSKU}
                className="w-full flex items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-300 group"
              >
                <Plus className="text-gray-400 group-hover:text-cyan-400 mr-2" size={16} />
                <span className="text-gray-600 group-hover:text-cyan-400 font-medium text-sm sm:text-base">
                  Add Another Product ({skus.length}/20)
                </span>
              </button>
            )}

            {/* Total CBM Summary */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 sm:p-6 rounded-xl border-2 border-cyan-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800 flex items-center text-sm sm:text-base">
                  <Calculator className="text-cyan-400 mr-2" size={16} />
                  Total Storage Calculation
                </h4>
                <span className="text-xs sm:text-sm text-gray-600">
                  {skus.length} product{skus.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                {skus.map((sku) => {
                  const skuCBM = (sku.length * sku.width * sku.height * sku.quantity) / 1000000;
                  return skuCBM > 0 ? (
                    <div key={sku.id} className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-700">{sku.name}:</span>
                      <span className="font-medium text-cyan-400">{skuCBM.toFixed(3)} m³</span>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="border-t border-cyan-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-semibold text-gray-800">Total CBM Required:</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-900">
                    {calculateTotalCBM().toFixed(3)} m³
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Formula: (L × W × H × Qty) ÷ 1,000,000 for each product
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 border-t border-gray-200 bg-gray-50 gap-3 sm:gap-0 flex-shrink-0">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            <p><strong>Tip:</strong> Add all products you plan to store to get accurate total CBM</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={handleClose}
              className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleUseResult}
              disabled={calculateTotalCBM() === 0}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg hover:from-blue-800 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-sm"
            >
              <span className="hidden sm:inline">Use Total CBM ({calculateTotalCBM().toFixed(3)} m³)</span>
              <span className="sm:hidden">Use CBM ({calculateTotalCBM().toFixed(3)} m³)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
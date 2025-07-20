import React from 'react';
import { Warehouse, Thermometer, Box, Calendar, Calculator } from 'lucide-react';
import { Warehousing } from '../../types';
import { Tooltip } from '../Tooltip';
import { CBMCalculator } from '../CBMCalculator';
import { ServiceExplanation } from '../ServiceExplanation';

interface WarehousingStepProps {
  data: Warehousing;
  onChange: (data: Warehousing) => void;
}

const WarehousingStep: React.FC<WarehousingStepProps> = ({ data, onChange }) => {
  const [showCBMCalculator, setShowCBMCalculator] = React.useState(false);
  const [calculatorTarget, setCalculatorTarget] = React.useState<'ambient' | 'temp-controlled' | null>(null);

  const handleChange = (field: keyof Warehousing, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleStorageChange = (storageType: 'ambientStorage' | 'tempControlledStorage', field: 'enabled' | 'averageVolume', value: boolean | number) => {
    onChange({
      ...data,
      [storageType]: {
        ...data[storageType],
        [field]: value
      }
    });
  };

  const openCBMCalculator = (target: 'ambient' | 'temp-controlled') => {
    setCalculatorTarget(target);
    setShowCBMCalculator(true);
  };

  const handleCBMCalculation = (cbm: number) => {
    if (calculatorTarget === 'ambient') {
      handleStorageChange('ambientStorage', 'averageVolume', cbm);
    } else if (calculatorTarget === 'temp-controlled') {
      handleStorageChange('tempControlledStorage', 'averageVolume', cbm);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl shadow-2xl border border-cyan-100 p-4 sm:p-8 transform transition-all duration-500 hover:shadow-3xl animate-slide-up">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-xl mr-3 sm:mr-4 shadow-lg transform transition-transform hover:rotate-12">
          <Warehouse className="text-white" size={24} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-900 to-cyan-400 bg-clip-text text-transparent">Warehousing</h2>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3">
              <Thermometer className="text-white" size={14} />
            </div>
            Storage Types *
            <Tooltip 
              content={
                <div>
                  <p className="font-semibold mb-2">Storage Pricing (per CBM/month):</p>
                  <p className="mb-1"><strong>Ambient Storage:</strong></p>
                  <p className="text-xs mb-2">1-25 CBM: ₱650 | 26-50 CBM: ₱625 | 51-100 CBM: ₱600 | 101-200 CBM: ₱575 | 201+ CBM: ₱550</p>
                  <p className="mb-1"><strong>Temperature-Controlled:</strong></p>
                  <p className="text-xs">1-25 CBM: ₱750 | 26-50 CBM: ₱725 | 51-100 CBM: ₱700 | 101-200 CBM: ₱675 | 201+ CBM: ₱650</p>
                </div>
              }
              className="ml-2"
            />
          </label>
          <p className="text-sm sm:text-base text-gray-600 mb-6 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
            Select one or both storage types based on your product requirements.
          </p>
          
          <div className="space-y-6">
            {/* Ambient Storage */}
            <div className="border-2 border-cyan-200 rounded-xl p-4 sm:p-6 bg-gradient-to-r from-white to-cyan-50 hover:border-cyan-300 transition-all duration-300 transform lg:hover:scale-102 shadow-lg">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={data.ambientStorage.enabled}
                  onChange={(e) => handleStorageChange('ambientStorage', 'enabled', e.target.checked)}
                  className="mr-4 w-5 h-5 text-cyan-400 rounded focus:ring-cyan-400"
                />
                <div>
                  <span className="text-gray-800 font-semibold text-base sm:text-lg">Ambient Storage</span>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Tier-based pricing starting at ₱650 per CBM per month</p>
                  <ServiceExplanation
                    title="Ambient Storage Details"
                    description="₱650-550 per CBM/month (tier-based pricing)"
                    details={[
                      "1-25 CBM: ₱650.00 per CBM",
                      "26-50 CBM: ₱625.00 per CBM", 
                      "51-100 CBM: ₱600.00 per CBM",
                      "101-200 CBM: ₱575.00 per CBM",
                      "201+ CBM: ₱550.00 per CBM"
                    ]}
                  />
                </div>
              </div>
              
              {data.ambientStorage.enabled && (
                <div className="mt-4 animate-slide-down">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <div className="p-1 bg-gradient-to-r from-blue-900 to-cyan-400 rounded mr-2">
                      <Box className="text-white" size={12} />
                    </div>
                      Average Occupied Volume (CBM) *
                      <Tooltip 
                        content={
                          <div>
                            <p className="font-semibold mb-2">Ambient Storage Rates:</p>
                            <p className="mb-1">1-25 CBM: ₱650/month each</p>
                            <p className="mb-1">26-50 CBM: ₱625/month each</p>
                            <p className="mb-1">51-100 CBM: ₱600/month each</p>
                            <p className="mb-1">101-200 CBM: ₱575/month each</p>
                            <p>201+ CBM: ₱550/month each</p>
                          </div>
                        }
                        className="ml-2"
                      />
                    </label>
                    <button
                      onClick={() => openCBMCalculator('ambient')}
                      className="flex items-center px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white text-xs rounded-lg hover:from-blue-800 hover:to-blue-600 transition-all duration-300 font-bold"
                    >
                      <Calculator size={12} className="mr-1" />
                      <span className="hidden sm:inline">Calculate CBM</span>
                      <span className="sm:hidden">CBM</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={data.ambientStorage.averageVolume === 0 ? '' : data.ambientStorage.averageVolume}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleStorageChange('ambientStorage', 'averageVolume', 0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          handleStorageChange('ambientStorage', 'averageVolume', numValue);
                        }
                      }
                    }}
                    placeholder="Enter volume in cubic meters"
                    className="w-full p-3 sm:p-4 border-2 border-cyan-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300 bg-white shadow-inner"
                    required
                  />
                </div>
              )}
            </div>

            {/* Temperature-Controlled Storage */}
            <div className="border-2 border-blue-200 rounded-xl p-4 sm:p-6 bg-gradient-to-r from-white to-blue-50 hover:border-blue-300 transition-all duration-300 transform lg:hover:scale-102 shadow-lg">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={data.tempControlledStorage.enabled}
                  onChange={(e) => handleStorageChange('tempControlledStorage', 'enabled', e.target.checked)}
                  className="mr-4 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-gray-800 font-semibold text-base sm:text-lg">Temperature-Controlled Storage</span>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Tier-based pricing starting at ₱750 per CBM per month</p>
                  <ServiceExplanation
                    title="Temperature-Controlled Storage Details"
                    description="₱750-650 per CBM/month (tier-based pricing)"
                    details={[
                      "1-25 CBM: ₱750.00 per CBM",
                      "26-50 CBM: ₱725.00 per CBM",
                      "51-100 CBM: ₱700.00 per CBM", 
                      "101-200 CBM: ₱675.00 per CBM",
                      "201+ CBM: ₱650.00 per CBM"
                    ]}
                  />
                </div>
              </div>
              
              {data.tempControlledStorage.enabled && (
                <div className="mt-4 animate-slide-down">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <div className="p-1 bg-gradient-to-r from-blue-900 to-cyan-400 rounded mr-2">
                      <Box className="text-white" size={12} />
                    </div>
                      Average Occupied Volume (CBM) *
                      <Tooltip 
                        content={
                          <div>
                            <p className="font-semibold mb-2">Temperature-Controlled Rates:</p>
                            <p className="mb-1">1-25 CBM: ₱750/month each</p>
                            <p className="mb-1">26-50 CBM: ₱725/month each</p>
                            <p className="mb-1">51-100 CBM: ₱700/month each</p>
                            <p className="mb-1">101-200 CBM: ₱675/month each</p>
                            <p>201+ CBM: ₱650/month each</p>
                          </div>
                        }
                        className="ml-2"
                      />
                    </label>
                    <button
                      onClick={() => openCBMCalculator('temp-controlled')}
                      className="flex items-center px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white text-xs rounded-lg hover:from-blue-800 hover:to-blue-600 transition-all duration-300 font-bold"
                    >
                      <Calculator size={12} className="mr-1" />
                      <span className="hidden sm:inline">Calculate CBM</span>
                      <span className="sm:hidden">CBM</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={data.tempControlledStorage.averageVolume === 0 ? '' : data.tempControlledStorage.averageVolume}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleStorageChange('tempControlledStorage', 'averageVolume', 0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          handleStorageChange('tempControlledStorage', 'averageVolume', numValue);
                        }
                      }
                    }}
                    placeholder="Enter volume in cubic meters"
                    className="w-full p-3 sm:p-4 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 bg-white shadow-inner"
                    required
                  />
                </div>
              )}
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 mt-4 p-3 bg-gradient-to-r from-gray-50 to-cyan-50 rounded-lg border border-gray-200">
            1 CBM = 1 cubic meter of storage space
          </p>
        </div>

        <div>
          <label className="block text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-400 rounded-lg mr-3">
              <Calendar className="text-white" size={14} />
            </div>
            Expected Months in Storage (Optional)
            <Tooltip 
              content={
                <div>
                  <p className="font-semibold mb-2">Storage Duration (Optional):</p>
                  <p className="mb-1">Leave blank for monthly pricing only</p>
                  <p className="mb-1">Enter duration for total cost calculation</p>
                  <p className="mb-1"><strong>Example:</strong> 3 months = total cost × 3</p>
                  <p>Default: 1 month if left empty</p>
                </div>
              }
              className="ml-2"
            />
          </label>
          <input
            type="number"
            min="0"
            value={data.expectedMonths === 0 ? '' : data.expectedMonths}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleChange('expectedMonths', 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  handleChange('expectedMonths', numValue);
                }
              }
            }}
            placeholder="Enter number of months (optional)"
            className="w-full p-3 sm:p-4 border-2 border-cyan-200 rounded-xl focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 transition-all duration-300 bg-white shadow-inner"
          />
          <p className="text-xs sm:text-sm text-gray-600 mt-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <strong>Optional:</strong> Leave blank for monthly pricing. Enter duration for total cost calculation. Defaults to 1 month if empty.
          </p>
        </div>
      </div>

      <CBMCalculator
        isOpen={showCBMCalculator}
        onClose={() => setShowCBMCalculator(false)}
        onCalculate={handleCBMCalculation}
      />
    </div>
  );
};

export { WarehousingStep };
import React from 'react';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  maxReachedStep: number;
  onStepClick?: (step: number) => void;
}

const stepNames = [
  'Warehousing',
  'Fulfillment',
  'Shipping',
  'Quote Summary'
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps, maxReachedStep, onStepClick }) => {
  // Adjust currentStep to account for pricing overview being step 0
  const adjustedCurrentStep = currentStep - 1;
  const adjustedMaxReachedStep = maxReachedStep - 1;
  
  return (
    <div className="w-full bg-gradient-to-r from-white via-cyan-50 to-blue-50 border-b border-cyan-100 p-3 sm:p-6 mb-6 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < adjustedCurrentStep + 1;
            const isCurrent = stepNumber === adjustedCurrentStep + 1;
            // Allow clicking on any step that has been reached (completed, current, or previously visited)
            const isClickable = stepNumber <= adjustedMaxReachedStep + 1;
            const isLast = index === totalSteps - 1;

            return (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                  <button
                    onClick={() => onStepClick && isClickable && onStepClick(stepNumber)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-500 transform
                      ${isClickable 
                        ? 'hover:scale-110 cursor-pointer' 
                        : 'cursor-not-allowed opacity-50'
                      }
                      ${isCompleted 
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-900 text-white shadow-lg hover:shadow-xl' 
                        : isCurrent 
                          ? 'bg-gradient-to-r from-blue-900 to-cyan-400 text-white shadow-lg ring-4 ring-cyan-200' 
                          : isClickable
                            ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 hover:from-gray-400 hover:to-gray-500'
                            : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500'
                      }`}
                    disabled={!isClickable}
                  >
                    {isCompleted ? <Check size={12} className="sm:w-4 sm:h-4" /> : stepNumber}
                  </button>
                  <button
                    onClick={() => onStepClick && isClickable && onStepClick(stepNumber)}
                    className={`mt-1 sm:mt-2 text-xs text-center max-w-16 sm:max-w-20 transition-colors
                      ${isClickable 
                        ? 'cursor-pointer hover:text-blue-900' 
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    disabled={!isClickable}
                  >
                    <span className={
                      isCurrent 
                        ? 'font-semibold text-blue-900' 
                        : isClickable 
                          ? 'text-gray-600' 
                          : 'text-gray-400'
                    }>
                      <span className="hidden sm:inline">{stepNames[index]}</span>
                      <span className="sm:hidden">{stepNames[index].split(' ')[0]}</span>
                    </span>
                  </button>
                </div>
                {!isLast && (
                  <div className="flex-1 h-1 mx-2 sm:mx-4 bg-gray-200 relative rounded-full overflow-hidden min-w-4 sm:min-w-8">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out
                        ${stepNumber <= adjustedMaxReachedStep 
                          ? 'w-full bg-gradient-to-r from-cyan-400 to-blue-900' 
                          : 'w-0 bg-gray-200'
                        }
                      `}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
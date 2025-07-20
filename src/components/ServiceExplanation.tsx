import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface ServiceExplanationProps {
  title: string;
  description: string;
  details: string[];
  className?: string;
}

export const ServiceExplanation: React.FC<ServiceExplanationProps> = ({ 
  title, 
  description, 
  details, 
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center cursor-help">
        <Info size={16} className="text-blue-600 hover:text-blue-800 transition-colors ml-2" />
      </div>
      
      {isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 max-w-sm">
            <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <ul className="text-xs text-gray-500 space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
        </div>
      )}
    </div>
  );
};
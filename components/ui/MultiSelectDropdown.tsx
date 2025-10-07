import React, { useState, useEffect, useRef } from 'react';

interface MultiSelectDropdownProps {
  label: string;
  options: readonly string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selectedOptions, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleOptionClick = (option: string) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter(o => o !== option)
      : [...selectedOptions, option];
    onChange(newSelectedOptions);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getButtonText = () => {
    if (selectedOptions.length === 0) return `All ${label}s`;
    if (selectedOptions.length === 1) return selectedOptions[0];
    return `${selectedOptions.length} ${label}s Selected`;
  };

  return (
    <div className={`relative inline-block w-full ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 inline-flex justify-between items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getButtonText()}</span>
        <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1 max-h-60 overflow-y-auto" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {options.map(option => (
              <div key={option} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" onClick={() => handleOptionClick(option)}>
                <input
                  type="checkbox"
                  id={`checkbox-${label}-${option}`}
                  checked={selectedOptions.includes(option)}
                  readOnly
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor={`checkbox-${label}-${option}`} className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
          {selectedOptions.length > 0 && (
             <div className="border-t border-gray-200 px-4 py-2">
                 <button onClick={() => onChange([])} className="w-full text-left text-sm text-primary-600 hover:underline">Clear selection</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;

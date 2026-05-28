import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  categories: string[];
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export interface FilterState {
  categories: string[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  type?: 'all' | 'income' | 'expense';
}

const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  onFilterChange,
  onReset,
  isOpen = false,
  onToggle,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    type: 'all',
  });
  const [showFilters, setShowFilters] = useState(isOpen);

  const toggleShowFilters = () => {
    const newState = !showFilters;
    setShowFilters(newState);
    onToggle?.();
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateFromChange = (date: string) => {
    const newFilters = { ...filters, dateFrom: date };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateToChange = (date: string) => {
    const newFilters = { ...filters, dateTo: date };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAmountMinChange = (amount: string) => {
    const newFilters = {
      ...filters,
      amountMin: amount ? parseFloat(amount) : undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAmountMaxChange = (amount: string) => {
    const newFilters = {
      ...filters,
      amountMax: amount ? parseFloat(amount) : undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      categories: [],
      type: 'all',
    };
    setFilters(defaultFilters);
    onReset();
  };

  const activeFilterCount =
    filters.categories.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.amountMin ? 1 : 0) +
    (filters.amountMax ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0);

  return (
    <div className="mb-6">
      {/* Filter toggle button */}
      <button
        onClick={toggleShowFilters}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 ml-auto transition-transform ${
            showFilters ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="mt-4 p-4 rounded-lg border border-slate-700 bg-slate-800/30 backdrop-blur-sm space-y-4">
          {/* Type filter */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Transaction Type
            </label>
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filters.type === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    filters.categories.includes(category)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount range filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.amountMin || ''}
                onChange={(e) => handleAmountMinChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.amountMax || ''}
                onChange={(e) => handleAmountMaxChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Reset button */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

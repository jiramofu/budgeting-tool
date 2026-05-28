import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortField = 'date' | 'amount' | 'description' | 'category';
export type SortDirection = 'asc' | 'desc';

interface SortControlsProps {
  currentSort: SortField;
  currentDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const SortControls: React.FC<SortControlsProps> = ({
  currentSort,
  currentDirection,
  onSortChange,
}) => {
  const sortOptions: { label: string; field: SortField }[] = [
    { label: 'Date', field: 'date' },
    { label: 'Amount', field: 'amount' },
    { label: 'Description', field: 'description' },
    { label: 'Category', field: 'category' },
  ];

  const handleSortChange = (field: SortField) => {
    if (currentSort === field) {
      // Toggle direction if same field
      onSortChange(field, currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field (except date which defaults to asc)
      onSortChange(field, field === 'date' ? 'desc' : 'desc');
    }
  };

  const toggleDirection = () => {
    onSortChange(currentSort, currentDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-slate-400">Sort by:</span>

      {/* Sort field buttons */}
      <div className="flex gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.field}
            onClick={() => handleSortChange(option.field)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentSort === option.field
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <div className="flex items-center gap-1">
              {option.label}
              {currentSort === option.field && (
                <>
                  {currentDirection === 'asc' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Direction toggle */}
      <button
        onClick={toggleDirection}
        title={`Sort ${currentDirection === 'asc' ? 'descending' : 'ascending'}`}
        className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-slate-300 hover:bg-slate-600 transition-colors"
      >
        {currentDirection === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default SortControls;

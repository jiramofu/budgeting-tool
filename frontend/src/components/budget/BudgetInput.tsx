import React, { useState, useEffect } from 'react';
import { DollarSign, Check, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

interface BudgetInputProps {
  categoryName: string;
  currentBudget: number;
  onSave: (amount: number) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  currency?: string;
}

const BudgetInput: React.FC<BudgetInputProps> = ({
  categoryName,
  currentBudget,
  onSave,
  onCancel,
  isLoading = false,
  error,
  currency = 'USD',
}) => {
  const [value, setValue] = useState(currentBudget.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setValue(currentBudget.toString());
    setLocalError('');
  }, [currentBudget]);

  const handleSave = async () => {
    setLocalError('');

    // Validation
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setLocalError('Please enter a valid amount');
      return;
    }

    if (numValue === 0) {
      setLocalError('Budget amount must be greater than 0');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(numValue);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to update budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  const displayError = error || localError;

  return (
    <div className="rounded-lg border border-blue-700/50 bg-blue-900/20 p-4 backdrop-blur-sm">
      {/* Header */}
      <h4 className="text-sm font-semibold text-slate-50 mb-3">
        Set Budget for {categoryName}
      </h4>

      {/* Input field */}
      <div className="mb-4">
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving || isLoading}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            step="0.01"
            min="0"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Current: {formatCurrency(currentBudget, currency)}
        </p>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 px-3 py-2 rounded text-xs mb-4">
          {displayError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Check className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving || isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-slate-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BudgetInput;

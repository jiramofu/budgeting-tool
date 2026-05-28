import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface TimeSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}) => {
  const [showCustomDates, setShowCustomDates] = useState(selectedPeriod === 'custom');

  const periods: { id: TimePeriod; label: string }[] = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const handlePeriodChange = (period: TimePeriod) => {
    onPeriodChange(period);
    setShowCustomDates(period === 'custom');
  };

  const getDateRange = (period: TimePeriod): { start: string; end: string } => {
    const today = new Date();
    const end = new Date(today);

    let start = new Date(today);

    switch (period) {
      case 'week':
        start.setDate(today.getDate() - today.getDay());
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      case 'custom':
        return { start: customStartDate || '', end: customEndDate || '' };
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange(selectedPeriod);

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="mb-6 p-4 rounded-lg border border-slate-700 bg-slate-800/30 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-300">Time Period</h3>
      </div>

      {/* Period buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => handlePeriodChange(period.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedPeriod === period.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Date range display */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <span>{formatDateForDisplay(dateRange.start)}</span>
        <span>→</span>
        <span>{formatDateForDisplay(dateRange.end)}</span>
      </div>

      {/* Custom date inputs */}
      {showCustomDates && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">
              Start Date
            </label>
            <input
              type="date"
              value={customStartDate || ''}
              onChange={(e) =>
                onCustomDateChange?.(e.target.value, customEndDate || '')
              }
              className="w-full px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">
              End Date
            </label>
            <input
              type="date"
              value={customEndDate || ''}
              onChange={(e) =>
                onCustomDateChange?.(customStartDate || '', e.target.value)
              }
              className="w-full px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSelector;

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  isDark: boolean;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  month,
  year,
  onMonthChange,
  isDark,
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePreviousMonth = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  const handleToday = () => {
    const today = new Date();
    onMonthChange(today.getMonth() + 1, today.getFullYear());
  };

  return (
    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
      <button
        onClick={handlePreviousMonth}
        className={`p-2 rounded-lg border transition-colors ${
          isDark
            ? 'hover:bg-slate-800 border-slate-700'
            : 'hover:bg-slate-100 border-slate-300'
        }`}
        title="Previous month"
      >
        <ChevronLeft size={20} />
      </button>

      <div className={`min-w-48 text-center ${isDark ? 'bg-slate-800/30' : 'bg-slate-100/30'} rounded-lg px-4 py-2`}>
        <div className="text-sm font-medium">
          {monthNames[month - 1]} {year}
        </div>
      </div>

      <button
        onClick={handleNextMonth}
        className={`p-2 rounded-lg border transition-colors ${
          isDark
            ? 'hover:bg-slate-800 border-slate-700'
            : 'hover:bg-slate-100 border-slate-300'
        }`}
        title="Next month"
      >
        <ChevronRight size={20} />
      </button>

      <button
        onClick={handleToday}
        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
          isDark
            ? 'hover:bg-slate-800 border-slate-700 text-slate-300'
            : 'hover:bg-slate-100 border-slate-300 text-slate-700'
        }`}
        title="Jump to today"
      >
        Today
      </button>
    </div>
  );
};

export default MonthSelector;

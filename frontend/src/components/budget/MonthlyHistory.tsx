import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthData {
  month: string;
  budget: number;
  actual: number;
  variance: number; // positive = under budget, negative = over budget
}

interface MonthlyHistoryProps {
  categoryName: string;
  data?: MonthData[];
  months?: number; // Number of months to display
}

const MonthlyHistory: React.FC<MonthlyHistoryProps> = ({
  categoryName,
  data,
  months = 6,
}) => {
  const [displayData, setDisplayData] = useState<MonthData[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (data) {
      setDisplayData(data.slice(0, months));
    } else {
      // Generate sample data for the last N months
      const sampleData: MonthData[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });

        const budget = 500 + Math.random() * 200;
        const actual = budget * (0.7 + Math.random() * 0.5);
        const variance = budget - actual;

        sampleData.push({
          month: monthName,
          budget: Math.round(budget * 100) / 100,
          actual: Math.round(actual * 100) / 100,
          variance: Math.round(variance * 100) / 100,
        });
      }

      setDisplayData(sampleData);
    }
  }, [data, months]);

  const handlePrevious = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1);
    }
  };

  const handleNext = () => {
    if (displayData && startIndex < displayData.length - 1) {
      setStartIndex(startIndex + 1);
    }
  };

  const visibleData = displayData.slice(startIndex, startIndex + 6);

  const avgBudget =
    displayData.length > 0
      ? displayData.reduce((sum, d) => sum + d.budget, 0) / displayData.length
      : 0;

  const avgActual =
    displayData.length > 0
      ? displayData.reduce((sum, d) => sum + d.actual, 0) / displayData.length
      : 0;

  const avgVariance = avgBudget - avgActual;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-50 mb-2">
          Monthly History - {categoryName}
        </h3>
        <p className="text-sm text-slate-400">
          Budget vs. Actual spending over time
        </p>
      </div>

      {/* Stats */}
      {displayData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
            <p className="text-xs text-slate-400 mb-1">Avg Budget</p>
            <p className="text-lg font-semibold text-slate-50">
              ${avgBudget.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
            <p className="text-xs text-slate-400 mb-1">Avg Actual</p>
            <p className="text-lg font-semibold text-slate-50">
              ${avgActual.toFixed(2)}
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${
            avgVariance >= 0
              ? 'bg-emerald-900/20 border-emerald-700/50'
              : 'bg-red-900/20 border-red-700/50'
          }`}>
            <p className="text-xs text-slate-400 mb-1">Avg Variance</p>
            <p className={`text-lg font-semibold ${
              avgVariance >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              ${Math.abs(avgVariance).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {visibleData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={visibleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Legend />
              <Bar dataKey="budget" fill="#2563eb" name="Budget" />
              <Bar dataKey="actual" fill="#16a766" name="Actual" />
            </BarChart>
          </ResponsiveContainer>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrevious}
              disabled={startIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:opacity-50 text-slate-50 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-slate-400">
              Showing months {startIndex + 1} - {Math.min(startIndex + 6, displayData.length)} of{' '}
              {displayData.length}
            </span>

            <button
              onClick={handleNext}
              disabled={startIndex >= displayData.length - 6}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:opacity-50 text-slate-50 text-sm font-medium transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-400">No historical data available</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
        <p className="text-xs font-semibold text-slate-300 mb-2">Legend</p>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            <span className="text-slate-400">Budget - Planned spending amount</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
            <span className="text-slate-400">Actual - Real spending amount</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyHistory;

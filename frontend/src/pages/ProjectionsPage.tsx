import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface ProjectedDay {
  date: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  events: any[];
}

interface ProjectionSummary {
  currentBalance: number;
  projectedBalance: number;
  lowestBalance: number;
  highestBalance: number;
  averageBalance: number;
  criticalDays: number;
  warningDays: number;
  safeDays: number;
  projection: ProjectedDay[];
}

export default function ProjectionsPage() {
  const [summary, setSummary] = useState<ProjectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);

  useEffect(() => {
    fetchProjections();
  }, []);

  const fetchProjections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/phase4/projections`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projections');
      }

      const data = await response.json();
      setSummary(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">No projection data available</p>
      </div>
    );
  }

  const chartData = summary.projection.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    balance: day.closingBalance,
    inflow: day.inflow,
    outflow: day.outflow,
  }));

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cash Flow Projections</h1>
        <button
          onClick={fetchProjections}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Current Balance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(summary.currentBalance)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Projected Balance (90d)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {formatCurrency(summary.projectedBalance)}
            {summary.projectedBalance > summary.currentBalance ? (
              <TrendingUp size={20} className="text-green-600" />
            ) : (
              <TrendingDown size={20} className="text-red-600" />
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Lowest Balance</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.lowestBalance)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Average Balance</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(summary.averageBalance)}
          </p>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Summary (90 Days)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${getRiskColor('safe')}`}>
            <p className="font-semibold">{summary.safeDays} Safe Days</p>
            <p className="text-sm opacity-75">Balance above $2,000</p>
          </div>
          <div className={`p-4 rounded-lg ${getRiskColor('warning')}`}>
            <p className="font-semibold">{summary.warningDays} Warning Days</p>
            <p className="text-sm opacity-75">Balance $500-$2,000</p>
          </div>
          <div className={`p-4 rounded-lg ${getRiskColor('critical')}`}>
            <p className="font-semibold">{summary.criticalDays} Critical Days</p>
            <p className="text-sm opacity-75">Balance below $500</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Projected Balance Trend</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Projected Balance"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recurring Items Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recurring Items</h2>
          <button
            onClick={() => setShowRecurringForm(!showRecurringForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            {showRecurringForm ? 'Hide' : 'Add Item'}
          </button>
        </div>

        {showRecurringForm && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Recurring items help forecast your future cash position by projecting regular income and expenses.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Manage recurring items through the API endpoint: POST /api/phase4/projections/recurring
            </p>
          </div>
        )}

        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          Recurring items help shape your cash flow projections
        </p>
      </div>
    </div>
  );
}

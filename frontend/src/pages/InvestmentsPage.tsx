import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Investment {
  id: number;
  name: string;
  type: string;
  ticker?: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  gainPercentage: number;
  byType: { type: string; value: number; percentage: number }[];
  investments: Investment[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const InvestmentsPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'stocks',
    ticker: '',
    shares: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiClient.get('/investments/portfolio');
      setPortfolio(response.data);
    } catch (err: any) {
      console.error('Failed to load portfolio:', err);
      setError('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/investments', {
        name: formData.name,
        type: formData.type,
        ticker: formData.ticker || undefined,
        shares: parseFloat(formData.shares),
        purchasePrice: parseFloat(formData.purchasePrice),
        currentPrice: parseFloat(formData.currentPrice),
        purchaseDate: formData.purchaseDate,
      });

      setFormData({
        name: '',
        type: 'stocks',
        ticker: '',
        shares: '',
        purchasePrice: '',
        currentPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
      await loadPortfolio();
    } catch (err: any) {
      console.error('Failed to add investment:', err);
      setError('Failed to add investment');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">Loading portfolio...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Investment Portfolio</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Investment'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">{error}</div>}

      {/* Add Investment Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Investment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Investment Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select name="type" value={formData.type} onChange={handleInputChange} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="stocks">Stocks</option>
                <option value="bonds">Bonds</option>
                <option value="mutual_funds">Mutual Funds</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
                <option value="real_estate">Real Estate</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                name="ticker"
                placeholder="Ticker (optional)"
                value={formData.ticker}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                name="shares"
                placeholder="Shares/Units"
                value={formData.shares}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                name="purchasePrice"
                placeholder="Purchase Price"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                name="currentPrice"
                placeholder="Current Price"
                value={formData.currentPrice}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Add Investment
            </button>
          </form>
        </div>
      )}

      {/* Portfolio Overview */}
      {portfolio && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Portfolio Value</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">${Number(portfolio.totalValue).toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Cost Basis</div>
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">${Number(portfolio.totalCost).toFixed(2)}</div>
            </div>
            <div className={`${portfolio.totalGain >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'} p-6 rounded-lg`}>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Gain/Loss</div>
              <div className={`text-3xl font-bold ${portfolio.totalGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${Number(portfolio.totalGain).toFixed(2)}
              </div>
            </div>
            <div className={`${portfolio.gainPercentage >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'} p-6 rounded-lg`}>
              <div className="text-sm text-gray-600 dark:text-gray-400">Return %</div>
              <div className={`text-3xl font-bold ${portfolio.gainPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {portfolio.gainPercentage >= 0 ? '+' : ''}
                {Number(portfolio.gainPercentage).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          {portfolio.byType.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Asset Allocation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={portfolio.byType} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {portfolio.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {portfolio.byType.map((type, index) => (
                    <div key={type.type} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="capitalize font-medium text-gray-900 dark:text-white">{type.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">${Number(type.value).toFixed(2)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{type.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Individual Investments */}
          {portfolio.investments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Holdings</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                      <th className="text-left py-2 text-gray-900 dark:text-white">Name</th>
                      <th className="text-right py-2 text-gray-900 dark:text-white">Type</th>
                      <th className="text-right py-2 text-gray-900 dark:text-white">Shares</th>
                      <th className="text-right py-2 text-gray-900 dark:text-white">Purchase Price</th>
                      <th className="text-right py-2 text-gray-900 dark:text-white">Current Price</th>
                      <th className="text-right py-2 text-gray-900 dark:text-white">Value</th>
                      <th className="text-right py-2 text-gray-900 dark:text-white">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.investments.map((inv) => {
                      const cost = inv.shares * inv.purchasePrice;
                      const value = inv.shares * inv.currentPrice;
                      const gain = value - cost;
                      const gainPercent = (gain / cost) * 100;
                      return (
                        <tr key={inv.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 font-bold text-gray-900 dark:text-white">{inv.name}</td>
                          <td className="text-right capitalize text-gray-600 dark:text-gray-400">{inv.type}</td>
                          <td className="text-right text-gray-900 dark:text-white">{Number(inv.shares).toFixed(2)}</td>
                          <td className="text-right text-gray-900 dark:text-white">${Number(inv.purchasePrice).toFixed(2)}</td>
                          <td className="text-right text-gray-900 dark:text-white">${Number(inv.currentPrice).toFixed(2)}</td>
                          <td className="text-right font-bold text-gray-900 dark:text-white">${Number(value).toFixed(2)}</td>
                          <td className={`text-right font-bold ${gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {gain >= 0 ? '+' : ''}${Number(gain).toFixed(2)} ({gainPercent > 0 ? '+' : ''}
                            {gainPercent.toFixed(1)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!portfolio || portfolio.investments.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">No investments yet. Add your first investment to get started.</div>
      )}
    </div>
  );
};

export default InvestmentsPage;

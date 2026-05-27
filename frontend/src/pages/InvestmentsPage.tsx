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
    return <div className="text-center py-8">Loading portfolio...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Investment Portfolio</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Investment'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {/* Add Investment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Add New Investment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Investment Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border border-gray-300 rounded"
              />
              <select name="type" value={formData.type} onChange={handleInputChange} className="px-4 py-2 border border-gray-300 rounded">
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
                className="px-4 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                name="shares"
                placeholder="Shares/Units"
                value={formData.shares}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                name="purchasePrice"
                placeholder="Purchase Price"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                name="currentPrice"
                placeholder="Current Price"
                value={formData.currentPrice}
                onChange={handleInputChange}
                step="0.01"
                required
                className="px-4 py-2 border border-gray-300 rounded"
              />
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded"
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
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-sm text-gray-600">Total Portfolio Value</div>
              <div className="text-3xl font-bold text-blue-600">${Number(portfolio.totalValue).toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-sm text-gray-600">Total Cost Basis</div>
              <div className="text-3xl font-bold text-gray-600">${Number(portfolio.totalCost).toFixed(2)}</div>
            </div>
            <div className={`${portfolio.totalGain >= 0 ? 'bg-green-50' : 'bg-red-50'} p-6 rounded-lg`}>
              <div className="text-sm text-gray-600">Total Gain/Loss</div>
              <div className={`text-3xl font-bold ${portfolio.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Number(portfolio.totalGain).toFixed(2)}
              </div>
            </div>
            <div className={`${portfolio.gainPercentage >= 0 ? 'bg-green-50' : 'bg-red-50'} p-6 rounded-lg`}>
              <div className="text-sm text-gray-600">Return %</div>
              <div className={`text-3xl font-bold ${portfolio.gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio.gainPercentage >= 0 ? '+' : ''}
                {Number(portfolio.gainPercentage).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          {portfolio.byType.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Asset Allocation</h2>
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
                        <span className="capitalize font-medium">{type.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${Number(type.value).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">{type.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Individual Investments */}
          {portfolio.investments.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Holdings</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Name</th>
                      <th className="text-right py-2">Type</th>
                      <th className="text-right py-2">Shares</th>
                      <th className="text-right py-2">Purchase Price</th>
                      <th className="text-right py-2">Current Price</th>
                      <th className="text-right py-2">Value</th>
                      <th className="text-right py-2">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.investments.map((inv) => {
                      const cost = inv.shares * inv.purchasePrice;
                      const value = inv.shares * inv.currentPrice;
                      const gain = value - cost;
                      const gainPercent = (gain / cost) * 100;
                      return (
                        <tr key={inv.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 font-bold">{inv.name}</td>
                          <td className="text-right capitalize text-gray-600">{inv.type}</td>
                          <td className="text-right">{Number(inv.shares).toFixed(2)}</td>
                          <td className="text-right">${Number(inv.purchasePrice).toFixed(2)}</td>
                          <td className="text-right">${Number(inv.currentPrice).toFixed(2)}</td>
                          <td className="text-right font-bold">${Number(value).toFixed(2)}</td>
                          <td className={`text-right font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
        <div className="text-center py-8 text-gray-600">No investments yet. Add your first investment to get started.</div>
      )}
    </div>
  );
};

export default InvestmentsPage;

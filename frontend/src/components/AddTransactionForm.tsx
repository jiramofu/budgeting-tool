import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface AddTransactionFormProps {
  budgetId?: number;
  onSuccess: () => void;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ budgetId, onSuccess }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await apiClient.getCategories();
      setCategories(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: res.data[0].id }));
      }
    } catch (err) {
      setError('Failed to load categories');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.createTransaction(
        parseInt(formData.categoryId),
        parseFloat(formData.amount),
        formData.transactionDate,
        budgetId,
        formData.description
      );

      setFormData({
        categoryId: categories[0]?.id.toString() || '',
        amount: '',
        description: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            name="transactionDate"
            value={formData.transactionDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            placeholder="Optional"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {isLoading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default AddTransactionForm;

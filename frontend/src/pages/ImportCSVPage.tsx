import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import Layout from '../components/Layout';

interface ImportResult {
  success: boolean;
  imported: number;
  duplicates: number;
  total: number;
}

export default function ImportCSVPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [budgetId, setBudgetId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [dateColumn, setDateColumn] = useState<string>('date');
  const [descriptionColumn, setDescriptionColumn] = useState<string>('description');
  const [amountColumn, setAmountColumn] = useState<string>('amount');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');

      // Read first few lines for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(0, 3); // Preview first 3 lines
        setPreview(lines);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    if (!dateColumn || !descriptionColumn || !amountColumn) {
      setError('Please specify all column names');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.importCSV(
        file,
        budgetId ? parseInt(budgetId) : undefined,
        categoryId ? parseInt(categoryId) : undefined,
        dateColumn || undefined,
        descriptionColumn || undefined,
        amountColumn || undefined
      );

      setResult(response.data);
      setTimeout(() => navigate('/'), 2000); // Redirect after 2 seconds
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Layout>
        <div className="p-8 max-w-2xl mx-auto">
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">Import Complete!</h2>
            <p className="text-green-700 dark:text-green-300 mb-2">
              Successfully imported <strong>{result.imported}</strong> transactions
            </p>
            {result.duplicates > 0 && (
              <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                Skipped <strong>{result.duplicates}</strong> duplicate transactions
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Import Transactions from CSV</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Upload a CSV file with headers in the first row
            </p>
          </div>

          {preview.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview (first 3 lines)
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-xs font-mono space-y-1 max-h-24 overflow-auto">
                {preview.map((line, i) => (
                  <div key={i} className="text-gray-700 dark:text-gray-300">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Column Name
              </label>
              <input
                type="text"
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., date, Date, transaction_date"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount Column Name
              </label>
              <input
                type="text"
                value={amountColumn}
                onChange={(e) => setAmountColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., amount, Amount, value"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description Column Name
            </label>
            <input
              type="text"
              value={descriptionColumn}
              onChange={(e) => setDescriptionColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., description, Description, memo"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget (Optional)
              </label>
              <input
                type="text"
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Budget ID"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category (Optional)
              </label>
              <input
                type="text"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Category ID"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Importing...' : 'Import Transactions'}
          </button>
        </form>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">CSV Format</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
            Your CSV file should have headers in the first row and include at least these columns:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-4">
            <li>• A date column (e.g., Date, date, Transaction Date)</li>
            <li>• An amount column (e.g., Amount, amount, Value)</li>
            <li>• A description column (e.g., Description, Memo, Payee)</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

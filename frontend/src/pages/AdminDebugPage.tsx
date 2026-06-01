import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react';

const AdminDebugPage: React.FC = () => {
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleResetDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resetToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset database');
        return;
      }

      setResult(data);
      setResetToken(''); // Clear token after successful reset
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 text-5xl">⚙️</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Debug</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Database management for beta testing</p>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Database Reset Successful</h3>
                <div className="bg-green-100 dark:bg-green-800 rounded p-3 text-sm font-mono text-green-900 dark:text-green-100 mb-3">
                  <div className="font-bold mb-2">Deleted Records:</div>
                  {Object.entries(result.deletedRecords).map(([table, count]: [string, any]) => (
                    <div key={table}>
                      {table}: <span className="font-bold text-lg">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-green-100 dark:bg-green-800 rounded p-3 text-sm font-mono text-green-900 dark:text-green-100">
                  <div className="font-bold mb-2">Final Verification:</div>
                  <div>Users: {result.verification.users}</div>
                  <div>Budgets: {result.verification.budgets}</div>
                  <div>Transactions: {result.verification.transactions}</div>
                  <div>Organizations: {result.verification.organizations}</div>
                </div>
                <p className="text-green-700 dark:text-green-200 mt-3 text-sm">
                  All user accounts have been deleted. You can now create new test accounts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">❌ Error</h3>
                <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form or Toggle Button */}
        {!result ? (
          <>
            {!showForm ? (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Dangerous Operation</h3>
                    <p className="text-yellow-700 dark:text-yellow-200 text-sm mb-4">
                      This will permanently delete all user accounts and data in the database. This cannot be undone.
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded transition"
                    >
                      Continue to Reset Form
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetDatabase} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reset Token
                  </label>
                  <input
                    type="password"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter your RESET_TOKEN from Railway"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    This token is set in Railway environment variables as RESET_TOKEN
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || !resetToken}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  >
                    {isLoading && <Loader size={18} className="animate-spin" />}
                    {isLoading ? 'Resetting...' : '🗑️ Reset Database'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                    }}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-md font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <button
            onClick={() => {
              setResult(null);
              setShowForm(false);
              setResetToken('');
              setError('');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition"
          >
            Reset Again
          </button>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">ℹ️ How to Set Up Reset Token</h3>
          <ol className="text-blue-700 dark:text-blue-200 text-sm space-y-2 list-decimal list-inside">
            <li>Go to <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="underline font-medium">railway.app</a></li>
            <li>Open your budgeting-tool project</li>
            <li>Click on the main Service (not database)</li>
            <li>Go to Variables tab</li>
            <li>Add: <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">RESET_TOKEN=your-secret-key</code></li>
            <li>Wait for redeploy, then use the token above</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs">
            Access this page at: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/admin/debug</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDebugPage;

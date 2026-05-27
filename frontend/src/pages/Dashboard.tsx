import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import BudgetOverview from '../components/BudgetOverview';
import AddTransactionForm from '../components/AddTransactionForm';
import TransactionList from '../components/TransactionList';
import BankConnections from '../components/BankConnections';

interface Budget {
  id: number;
  month: number;
  year: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_date: string;
  category_id: number;
}

const Dashboard: React.FC = () => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const budgetRes = await apiClient.getCurrentBudget();
      setBudget(budgetRes.data);

      const txnRes = await apiClient.getTransactions();
      setTransactions(txnRes.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Budget doesn't exist yet, create one
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        try {
          const createRes = await apiClient.createBudget(month, year);
          setBudget(createRes.data);
        } catch (createErr) {
          setError('Failed to create budget');
        }
      } else {
        setError('Failed to load data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    loadData();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {budget && (
          <div className="text-gray-600">
            {new Date(budget.year, budget.month - 1).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {budget && <BudgetOverview budgetId={budget.id} />}
        </div>
        <div className="space-y-6">
          <AddTransactionForm budgetId={budget?.id} onSuccess={handleTransactionAdded} />
          <BankConnections onTransactionsImported={loadData} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
};

export default Dashboard;

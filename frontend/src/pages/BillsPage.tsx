import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { formatCurrency } from '../utils/currencyFormatter';
import { useUserSettings } from '../hooks/useUserSettings';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { Tooltip, HelpIcon } from '../components/ui/tooltip';

interface Bill {
  id: number;
  name: string;
  amount: number;
  categoryName?: string;
  due_date_day: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  is_paid: boolean;
  last_paid_date: string | null;
  next_due_date: string;
  notes: string | null;
}

interface BillSummary {
  totalUpcoming: number;
  billsDueThisMonth: number;
  overdueBills: number;
  bills: Bill[];
}

const BillsPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const { currency } = useUserSettings();
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDateDay: '1',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'one-time',
    categoryId: '',
    notes: '',
  });

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setIsLoading(true);
      setError('');

      const summaryRes = await apiClient.getBillSummary();
      setSummary(summaryRes.data);
      setBills(summaryRes.data.bills);
    } catch (err: any) {
      console.error('Failed to load bills:', err);
      const errorMsg = 'Failed to load bills';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await apiClient.updateBill(editingId, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          due_date_day: parseInt(formData.dueDateDay),
          frequency: formData.frequency,
          category_id: formData.categoryId ? parseInt(formData.categoryId) : null,
          notes: formData.notes,
        });
        success('Bill updated successfully');
      } else {
        await apiClient.createBill(
          formData.name,
          parseFloat(formData.amount),
          parseInt(formData.dueDateDay),
          formData.frequency,
          formData.categoryId ? parseInt(formData.categoryId) : undefined,
          formData.notes
        );
        success('Bill created successfully');
      }

      setFormData({
        name: '',
        amount: '',
        dueDateDay: '1',
        frequency: 'monthly',
        categoryId: '',
        notes: '',
      });
      setEditingId(null);
      setShowForm(false);
      await loadBills();
    } catch (err: any) {
      console.error('Failed to save bill:', err);
      const errorMsg = 'Failed to save bill';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleEdit = (bill: Bill) => {
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      dueDateDay: bill.due_date_day.toString(),
      frequency: bill.frequency,
      categoryId: '',
      notes: bill.notes || '',
    });
    setEditingId(bill.id);
    setShowForm(true);
  };

  const handleDelete = async (billId: number) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await apiClient.deleteBill(billId);
        success('Bill deleted successfully');
        await loadBills();
      } catch (err: any) {
        console.error('Failed to delete bill:', err);
        const errorMsg = 'Failed to delete bill';
        setError(errorMsg);
        showError(errorMsg);
      }
    }
  };

  const handleMarkPaid = async (billId: number) => {
    try {
      await apiClient.markBillAsPaid(billId);
      success('Bill marked as paid');
      await loadBills();
    } catch (err: any) {
      console.error('Failed to mark bill as paid:', err);
      const errorMsg = 'Failed to mark bill as paid';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      amount: '',
      dueDateDay: '1',
      frequency: 'monthly',
      categoryId: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bills & Recurring Expenses</h1>
          <HelpIcon text="Track upcoming bills and recurring payments" position="right" />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Bill'}
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tooltip content="All bills due within the next 30 days from today">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow cursor-help">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Upcoming (30 days)</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{formatCurrency(Number(summary.totalUpcoming), currency)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{bills.length} bills tracked</div>
            </div>
          </Tooltip>

          <Tooltip content="Bills that are scheduled to be due during the current month">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow cursor-help">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">Due This Month</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">{formatCurrency(Number(summary.billsDueThisMonth), currency)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Bills to pay soon</div>
            </div>
          </Tooltip>

          <Tooltip content="Bills that have already passed their due date and require immediate payment">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow cursor-help">
              <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">Overdue</div>
              <div className={`text-2xl font-bold mt-2 ${summary.overdueBills > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {summary.overdueBills} bill{summary.overdueBills !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Action needed</div>
            </div>
          </Tooltip>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editingId ? 'Edit Bill' : 'Add New Bill'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bill Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Electricity Bill"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Day of Month *</label>
                <input
                  type="number"
                  name="dueDateDay"
                  value={formData.dueDateDay}
                  onChange={handleInputChange}
                  min="1"
                  max="31"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency *</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes..."
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update Bill' : 'Create Bill'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bills Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">All Bills</h2>
        {bills.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">No bills tracked yet. Add one to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Name</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-900 dark:text-white">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Frequency</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Due Date</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Next Due</th>
                  <th className="text-center px-6 py-3 font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="text-center px-6 py-3 font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, index) => (
                  <tr key={bill.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{bill.name}</div>
                      {bill.categoryName && <div className="text-sm text-gray-500 dark:text-gray-400">{bill.categoryName}</div>}
                    </td>
                    <td className="text-right px-6 py-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(bill.amount), currency)}</td>
                    <td className="px-6 py-4 capitalize text-gray-900 dark:text-white">{bill.frequency}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">Day {bill.due_date_day}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {new Date(bill.next_due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="text-center px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          bill.is_paid ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                        }`}
                      >
                        {bill.is_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 space-x-2">
                      {!bill.is_paid && (
                        <button
                          onClick={() => handleMarkPaid(bill.id)}
                          className="text-sm px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(bill)}
                        className="text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="text-sm px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsPage;

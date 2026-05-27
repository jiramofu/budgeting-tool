import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Goal {
  id: number;
  name: string;
  description: string | null;
  goal_type: 'savings' | 'debt-payoff' | 'expense-reduction' | 'investment';
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  categoryName?: string;
  is_active: boolean;
  progress_percentage: number;
}

interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
  totalTargeted: number;
  totalProgress: number;
  goals: Goal[];
}

const GoalTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'savings':
      return <span className="text-lg">🏦</span>;
    case 'debt-payoff':
      return <span className="text-lg">💳</span>;
    case 'expense-reduction':
      return <span className="text-lg">📉</span>;
    case 'investment':
      return <span className="text-lg">📈</span>;
    default:
      return <span className="text-lg">🎯</span>;
  }
};

const GoalsPage: React.FC = () => {
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showProgressForm, setShowProgressForm] = useState<number | null>(null);
  const [progressAmount, setProgressAmount] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goalType: 'savings' as 'savings' | 'debt-payoff' | 'expense-reduction' | 'investment',
    targetAmount: '',
    targetDate: '',
    categoryId: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError('');

      const summaryRes = await apiClient.getGoalSummary();
      setSummary(summaryRes.data);
      setGoals(summaryRes.data.goals);
    } catch (err: any) {
      console.error('Failed to load goals:', err);
      setError('Failed to load goals');
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
        await apiClient.updateGoal(editingId, {
          name: formData.name,
          description: formData.description,
          goal_type: formData.goalType,
          target_amount: parseFloat(formData.targetAmount),
          target_date: formData.targetDate,
        });
      } else {
        await apiClient.createGoal(
          formData.name,
          formData.goalType,
          parseFloat(formData.targetAmount),
          formData.targetDate,
          formData.categoryId ? parseInt(formData.categoryId) : undefined,
          formData.description
        );
      }

      setFormData({
        name: '',
        description: '',
        goalType: 'savings',
        targetAmount: '',
        targetDate: '',
        categoryId: '',
      });
      setEditingId(null);
      setShowForm(false);
      await loadGoals();
    } catch (err: any) {
      console.error('Failed to save goal:', err);
      setError('Failed to save goal');
    }
  };

  const handleEdit = (goal: Goal) => {
    setFormData({
      name: goal.name,
      description: goal.description || '',
      goalType: goal.goal_type,
      targetAmount: goal.target_amount.toString(),
      targetDate: goal.target_date || '',
      categoryId: '',
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleAddProgress = async (goalId: number) => {
    try {
      if (!progressAmount) {
        setError('Please enter an amount');
        return;
      }

      await apiClient.addGoalProgress(goalId, parseFloat(progressAmount));
      setProgressAmount('');
      setShowProgressForm(null);
      await loadGoals();
    } catch (err: any) {
      console.error('Failed to add progress:', err);
      setError('Failed to add progress');
    }
  };

  const handleDelete = async (goalId: number) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await apiClient.deleteGoal(goalId);
        await loadGoals();
      } catch (err: any) {
        console.error('Failed to delete goal:', err);
        setError('Failed to delete goal');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      goalType: 'savings',
      targetAmount: '',
      targetDate: '',
      categoryId: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading goals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Goals</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-medium">Active Goals</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{summary.activeGoals}</div>
            <div className="text-xs text-gray-500 mt-2">of {summary.totalGoals} goals</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-green-600 mt-2">{summary.completedGoals}</div>
            <div className="text-xs text-gray-500 mt-2">goals achieved</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-medium">Progress</div>
            <div className="text-2xl font-bold text-purple-600 mt-2">{Number(summary.overallProgress).toFixed(0)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min(summary.overallProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-medium">Total Saved</div>
            <div className="text-2xl font-bold text-green-600 mt-2">${Number(summary.totalProgress).toFixed(0)}</div>
            <div className="text-xs text-gray-500 mt-2">of ${Number(summary.totalTargeted).toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Goal' : 'Create New Goal'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Emergency Fund"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Goal Type *</label>
                <select
                  name="goalType"
                  value={formData.goalType}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="savings">Savings Goal</option>
                  <option value="debt-payoff">Debt Payoff</option>
                  <option value="expense-reduction">Expense Reduction</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Amount *</label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Date</label>
                <input
                  type="date"
                  name="targetDate"
                  value={formData.targetDate}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any notes about your goal..."
                rows={3}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingId ? 'Update Goal' : 'Create Goal'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <GoalTypeIcon type={goal.goal_type} />
                <div>
                  <h3 className="font-bold text-lg">{goal.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{goal.goal_type.replace('-', ' ')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {goal.target_date && new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </div>
              </div>
            </div>

            {goal.description && <p className="text-sm text-gray-600 mb-4">{goal.description}</p>}

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-bold">{Number(goal.progress_percentage).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    goal.progress_percentage >= 100 ? 'bg-green-500' : goal.progress_percentage >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="font-bold">${Number(goal.current_amount).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Target</p>
                <p className="font-bold">${Number(goal.target_amount).toFixed(2)}</p>
              </div>
            </div>

            {showProgressForm === goal.id ? (
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  value={progressAmount}
                  onChange={(e) => setProgressAmount(e.target.value)}
                  placeholder="Amount"
                  step="0.01"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => handleAddProgress(goal.id)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowProgressForm(null)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProgressForm(goal.id)}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Add Progress
                </button>
                <button
                  onClick={() => handleEdit(goal)}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            )}

            {goal.progress_percentage >= 100 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800 font-medium">🎉 Goal completed!</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {goals.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No financial goals yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;

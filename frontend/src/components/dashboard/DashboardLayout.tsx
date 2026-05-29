/**
 * Dashboard Layout - Main dashboard page structure
 * Shows overview of budgets, spending, and financial status
 */

import React from 'react';
import { BudgetProgressChart } from '../Charts/BudgetProgressChart';
import { SpendingTrendChart } from '../Charts/SpendingTrendChart';
import { CategoryBreakdownChart } from '../Charts/CategoryBreakdownChart';
import { FoodIcon, TransportationIcon, UtilitiesIcon, EntertainmentIcon } from '../../assets/icons/categories';

/**
 * Dashboard Widget - Reusable card component
 */
interface DashboardWidgetProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
    {children}
  </div>
);

/**
 * Quick Stats Card
 */
interface QuickStatProps {
  label: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
}

const QuickStat: React.FC<QuickStatProps> = ({ label, value, change, icon }) => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700/50">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-2 font-semibold ${
            change >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
          </p>
        )}
      </div>
      {icon && (
        <div className="text-blue-500 opacity-50">
          {icon}
        </div>
      )}
    </div>
  </div>
);

/**
 * Main Dashboard Component
 */
export const Dashboard: React.FC = () => {
  // Sample data
  const monthlySpending = 2840.50;
  const monthlyBudget = 3500.00;
  const previousMonthSpending = 2650.00;

  const trendData = [
    { month: 'Jan', spent: 2100, budget: 3500 },
    { month: 'Feb', spent: 2350, budget: 3500 },
    { month: 'Mar', spent: 2650, budget: 3500 },
    { month: 'Apr', spent: 2840.50, budget: 3500 },
  ];

  const categoryData = [
    { name: 'Food & Dining', amount: 850, color: '#ff6b6b' },
    { name: 'Transportation', amount: 450, color: '#4ecdc4' },
    { name: 'Utilities', amount: 320, color: '#45b7d1' },
    { name: 'Entertainment', amount: 280, color: '#f9ca24' },
    { name: 'Shopping', amount: 540, color: '#6c5ce7' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <QuickStat
            label="Total Spending"
            value={`$${monthlySpending.toFixed(2)}`}
            change={Math.round(((monthlySpending - previousMonthSpending) / previousMonthSpending) * 100)}
          />
          <QuickStat
            label="Remaining Budget"
            value={`$${(monthlyBudget - monthlySpending).toFixed(2)}`}
            change={-5}
          />
          <QuickStat
            label="Budget Remaining"
            value={`${Math.round(((monthlyBudget - monthlySpending) / monthlyBudget) * 100)}%`}
          />
          <QuickStat
            label="Categories on Track"
            value="4/5"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Budget Progress */}
          <DashboardWidget
            title="Overall Budget"
            subtitle="April 2024"
            className="lg:col-span-1"
          >
            <div className="flex justify-center">
              <BudgetProgressChart
                spent={monthlySpending}
                budget={monthlyBudget}
                label="Monthly Budget"
                color="#2563eb"
              />
            </div>
          </DashboardWidget>

          {/* Category Breakdown */}
          <DashboardWidget
            title="Spending by Category"
            subtitle="Top categories this month"
            className="lg:col-span-2"
          >
            <CategoryBreakdownChart
              data={categoryData}
              donutMode={true}
              showLegend={true}
              showPercentage={true}
            />
          </DashboardWidget>
        </div>

        {/* Spending Trend */}
        <DashboardWidget
          title="Spending Trend"
          subtitle="Last 4 months"
          className="mb-8"
        >
          <SpendingTrendChart data={trendData} height={250} />
        </DashboardWidget>

        {/* Category Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Food & Dining', spent: 850, budget: 1000, icon: FoodIcon, color: '#ff6b6b' },
            { name: 'Transportation', spent: 450, budget: 600, icon: TransportationIcon, color: '#4ecdc4' },
            { name: 'Utilities', spent: 320, budget: 400, icon: UtilitiesIcon, color: '#45b7d1' },
            { name: 'Entertainment', spent: 280, budget: 500, icon: EntertainmentIcon, color: '#f9ca24' },
          ].map((cat) => {
            const Icon = cat.icon;
            const percentage = (cat.spent / cat.budget) * 100;
            return (
              <div
                key={cat.name}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {cat.name}
                  </h4>
                  <Icon size={20} color={cat.color} />
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>${cat.spent}</span>
                    <span>${cat.budget}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: percentage > 100 ? '#ef4444' : percentage > 80 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>
                <p className={`text-xs font-semibold ${
                  percentage > 100 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {Math.round(percentage)}% of budget
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

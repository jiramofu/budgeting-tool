import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/ui/loaders';
import { HelpIcon } from '../components/ui/tooltip';

interface Recommendation {
  categoryId: number;
  categoryName: string;
  currentTarget: number;
  recommendedTarget: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

interface SpendingAlert {
  categoryId: number;
  categoryName: string;
  currentSpending: number;
  target: number;
  percentageOfTarget: number;
  message: string;
  severity: 'warning' | 'critical';
}

const SmartRulesPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'alerts'>('recommendations');
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadSmartInsights();
  }, []);

  const loadSmartInsights = async () => {
    try {
      setIsLoading(true);
      const [recsRes, alertsRes] = await Promise.all([
        (apiClient as any).getRecommendations(),
        (apiClient as any).getAllAnomalies(),
      ]);

      setRecommendations(recsRes.data.recommendations || []);
      setAlerts(alertsRes.data.alerts || []);
      success('Smart insights refreshed successfully');
    } catch (error: any) {
      console.error('Failed to load smart insights:', error);
      const errorMsg = 'Failed to load smart insights';
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? '🔴' : '⚠️';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Budget Insights</h1>
          <HelpIcon text="AI-powered recommendations and alerts based on your spending patterns and budget targets" position="right" />
        </div>
        <button
          onClick={loadSmartInsights}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'recommendations'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          💡 Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'alerts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          ⚠️ Spending Alerts ({alerts.length})
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard count={3} />
        </div>
      ) : activeTab === 'recommendations' ? (
        <RecommendationsView recommendations={recommendations} getPriorityColor={getPriorityColor} />
      ) : (
        <AlertsView alerts={alerts} getSeverityIcon={getSeverityIcon} />
      )}
    </div>
  );
};

const RecommendationsView: React.FC<{ recommendations: Recommendation[]; getPriorityColor: (p: string) => string }> = ({
  recommendations,
  getPriorityColor,
}) => {
  if (recommendations.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
        <p className="text-blue-800 dark:text-blue-200 text-lg">✓ No budget adjustments recommended at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map(rec => (
        <div key={rec.categoryId} className={`border-l-4 rounded-lg p-4 bg-white dark:bg-gray-800 ${getPriorityColor(rec.priority)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{rec.categoryName}</h3>
              <p className="text-sm mb-3 opacity-90 text-gray-700 dark:text-gray-300">{rec.reasoning}</p>
              <div className="flex gap-4 text-sm text-gray-900 dark:text-gray-100">
                <div>
                  <span className="opacity-75">Current Target:</span>
                  <span className="ml-2 font-semibold">${rec.currentTarget.toFixed(2)}</span>
                </div>
                <div>
                  <span className="opacity-75">Recommended:</span>
                  <span className="ml-2 font-semibold">${rec.recommendedTarget.toFixed(2)}</span>
                </div>
                <div>
                  <span className="opacity-75">Difference:</span>
                  <span className={`ml-2 font-semibold ${rec.recommendedTarget > rec.currentTarget ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {rec.recommendedTarget > rec.currentTarget ? '+' : ''}${(rec.recommendedTarget - rec.currentTarget).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${getPriorityColor(rec.priority)}`}>
              {rec.priority.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const AlertsView: React.FC<{ alerts: SpendingAlert[]; getSeverityIcon: (s: string) => string }> = ({ alerts, getSeverityIcon }) => {
  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
        <p className="text-green-800 dark:text-green-200 text-lg">✓ You're on track in all categories!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map(alert => (
        <div
          key={alert.categoryId}
          className={`border-l-4 rounded-lg p-4 ${
            alert.severity === 'critical'
              ? 'bg-red-50 dark:bg-red-900 border-red-300 dark:border-red-700'
              : 'bg-yellow-50 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <span>{getSeverityIcon(alert.severity)}</span>
                {alert.categoryName}
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Spent: <span className="font-semibold">${alert.currentSpending.toFixed(2)}</span> of{' '}
                  <span className="font-semibold">${alert.target.toFixed(2)}</span>
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      alert.percentageOfTarget > 100 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(alert.percentageOfTarget, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{alert.percentageOfTarget}% of budget used</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                alert.severity === 'critical'
                  ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                  : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
              }`}
            >
              {alert.severity.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SmartRulesPage;

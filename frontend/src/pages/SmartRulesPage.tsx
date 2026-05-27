import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useToast } from '../components/Toast';
import { Skeleton, TableSkeleton } from '../components/SkeletonLoader';

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
  const { addToast } = useToast();

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
    } catch (error: any) {
      addToast('Failed to load smart insights', 'error');
      console.error(error);
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
        <h1 className="text-3xl font-bold text-gray-900">Smart Budget Insights</h1>
        <button
          onClick={loadSmartInsights}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'recommendations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          💡 Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'alerts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ⚠️ Spending Alerts ({alerts.length})
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton />
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <p className="text-blue-800 text-lg">✓ No budget adjustments recommended at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map(rec => (
        <div key={rec.categoryId} className={`border-l-4 rounded-lg p-4 bg-white ${getPriorityColor(rec.priority)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{rec.categoryName}</h3>
              <p className="text-sm mb-3 opacity-90">{rec.reasoning}</p>
              <div className="flex gap-4 text-sm">
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
                  <span className={`ml-2 font-semibold ${rec.recommendedTarget > rec.currentTarget ? 'text-green-600' : 'text-red-600'}`}>
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <p className="text-green-800 text-lg">✓ You're on track in all categories!</p>
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
              ? 'bg-red-50 border-red-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span>{getSeverityIcon(alert.severity)}</span>
                {alert.categoryName}
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  Spent: <span className="font-semibold">${alert.currentSpending.toFixed(2)}</span> of{' '}
                  <span className="font-semibold">${alert.target.toFixed(2)}</span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      alert.percentageOfTarget > 100 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(alert.percentageOfTarget, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">{alert.percentageOfTarget}% of budget used</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                alert.severity === 'critical'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-yellow-200 text-yellow-800'
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

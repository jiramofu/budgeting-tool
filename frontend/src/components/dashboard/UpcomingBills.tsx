import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface Bill {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  category?: {
    name: string;
  };
  status?: 'pending' | 'paid' | 'overdue';
}

interface UpcomingBillsProps {
  maxItems?: number;
}

const UpcomingBills: React.FC<UpcomingBillsProps> = ({ maxItems = 4 }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, this would fetch from the API
    // For now, we'll show a placeholder
    setIsLoading(false);
  }, []);

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'text-red-400 bg-red-900/20';
    if (daysUntilDue <= 3) return 'text-amber-400 bg-amber-900/20';
    return 'text-emerald-400 bg-emerald-900/20';
  };

  const getStatusLabel = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)}d overdue`;
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue}d`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-primary bg-secondary p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-primary mb-4">Upcoming Bills</h3>
        <p className="text-secondary text-center py-8">Loading...</p>
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="rounded-lg border border-primary bg-secondary p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-primary">Upcoming Bills</h3>
        </div>
        <p className="text-secondary text-center py-8">No upcoming bills tracked</p>
        <p className="text-tertiary text-sm text-center mt-2">
          Add recurring bills to track your upcoming payments
        </p>
      </div>
    );
  }

  const displayBills = bills.slice(0, maxItems);

  return (
    <div className="rounded-lg border border-primary bg-secondary p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-primary">Upcoming Bills</h3>
      </div>

      {/* Bills list */}
      <div className="space-y-3">
        {displayBills.map((bill) => {
          const daysUntilDue = getDaysUntilDue(bill.due_date);
          const statusColor = getStatusColor(daysUntilDue);
          const statusLabel = getStatusLabel(daysUntilDue);

          return (
            <div
              key={bill.id}
              className="flex items-center justify-between p-3 rounded-lg bg-tertiary hover:bg-accent transition-colors border border-primary/30"
            >
              {/* Left side */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div className={daysUntilDue < 0 ? 'p-2 rounded-lg bg-red-500/20' : 'p-2 rounded-lg bg-tertiary'}>
                  {daysUntilDue < 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Calendar className="w-5 h-5 text-secondary" />
                  )}
                </div>

                {/* Description and date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{bill.description}</p>
                  <p className="text-xs text-secondary mt-1">{formatDate(bill.due_date)}</p>
                </div>
              </div>

              {/* Right side */}
              <div className="text-right ml-2 flex-shrink-0">
                <p className="text-sm font-semibold text-primary">${bill.amount.toFixed(2)}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for when no bills are present */}
      {bills.length === 0 && (
        <div className="text-center py-8">
          <p className="text-secondary mb-2">No upcoming bills to display</p>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            Add a bill
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingBills;

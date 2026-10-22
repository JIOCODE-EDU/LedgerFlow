import React from 'react';
import { AlertTriangle, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { BudgetWarning } from '../types.ts';
import { formatCurrency } from '../utils/finance.ts';

interface BudgetAlertsProps {
  warnings: BudgetWarning[];
  onManageBudgets: () => void;
}

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ warnings, onManageBudgets }) => {
  if (warnings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">All Budgets Within Limit</h4>
            <p className="text-xs text-slate-500">
              All categories are currently operating safely under their designated monthly spending limits.
            </p>
          </div>
        </div>
        <button
          onClick={onManageBudgets}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 shrink-0"
        >
          <span>View planner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const exceededCount = warnings.filter((w) => w.status === 'exceeded').length;
  const warningCount = warnings.filter((w) => w.status === 'warning').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Spending Limit Notifications ({warnings.length})
            </h4>
            <p className="text-xs text-slate-500">
              {exceededCount > 0 && `${exceededCount} category exceeded limit`}
              {exceededCount > 0 && warningCount > 0 && ' · '}
              {warningCount > 0 && `${warningCount} approaching warning threshold`}
            </p>
          </div>
        </div>

        <button
          onClick={onManageBudgets}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 shrink-0"
        >
          <span>Adjust Budgets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {warnings.map((w) => {
          const isExceeded = w.status === 'exceeded';
          return (
            <div
              key={w.category_id}
              className={`p-3 rounded-lg border text-xs flex flex-col justify-between gap-2 ${
                isExceeded
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: w.category_color }}
                  />
                  <span className="font-semibold text-slate-900">{w.category_name}</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold">
                  {isExceeded ? (
                    <span className="text-rose-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{w.percentage}% (Over)</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{w.percentage}% (Near)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>
                  Spent: <strong className="font-mono tabular-nums text-slate-900">{formatCurrency(w.spent)}</strong>
                </span>
                <span>
                  Limit: <span className="font-mono tabular-nums">{formatCurrency(w.limit)}</span>
                </span>
              </div>

              {/* Visual meter */}
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isExceeded ? 'bg-rose-600' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, w.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

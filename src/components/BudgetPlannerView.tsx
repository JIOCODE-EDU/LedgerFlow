import React, { useState } from 'react';
import { Budget, Category } from '../types.ts';
import { formatCurrency } from '../utils/finance.ts';
import { Target, AlertTriangle, AlertCircle, CheckCircle2, Sliders, DollarSign, Edit3, X, Check } from 'lucide-react';

interface BudgetPlannerViewProps {
  budgets: Budget[];
  categories: Category[];
  selectedMonth: string;
  onUpdateBudget: (categoryId: number, limit: number, threshold?: number) => Promise<void>;
  loading: boolean;
}

export const BudgetPlannerView: React.FC<BudgetPlannerViewProps> = ({
  budgets,
  categories,
  selectedMonth,
  onUpdateBudget,
  loading,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editLimit, setEditLimit] = useState<string>('');
  const [editThreshold, setEditThreshold] = useState<number>(80);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const totalBudgeted = budgets.reduce((acc, b) => acc + (b.amount_limit || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const handleStartEdit = (b: Budget) => {
    setEditingCategoryId(b.category_id);
    setEditLimit(String(b.amount_limit || 0));
    setEditThreshold(b.notify_threshold_pct || 80);
  };

  const handleSaveEdit = async (categoryId: number) => {
    const parsedLimit = parseFloat(editLimit);
    if (isNaN(parsedLimit) || parsedLimit < 0) return;

    try {
      setIsSaving(true);
      await onUpdateBudget(categoryId, parsedLimit, editThreshold);
      setEditingCategoryId(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Monthly Spending Budgets &amp; Safety Thresholds
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Set planned limits per category for {selectedMonth}. Receive warning notices when spending reaches 80% or exceeds 100%.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Total Budget</span>
              <strong className="text-slate-900 font-bold">{formatCurrency(totalBudgeted)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Total Spent</span>
              <strong className="text-slate-900 font-bold">{formatCurrency(totalSpent)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Cap Utilization</span>
              <span className={`font-bold ${overallPercentage >= 100 ? 'text-rose-600' : overallPercentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {overallPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Overall Monthly Budget Progress</span>
            <span className="font-mono tabular-nums">{formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                overallPercentage >= 100
                  ? 'bg-rose-500'
                  : overallPercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const isEditing = editingCategoryId === b.category_id;
          const limit = b.amount_limit || 0;
          const spent = b.spent || 0;
          const percentage = b.percentage || 0;
          const remaining = b.remaining || (limit - spent);
          const isOver = percentage >= 100;
          const isWarning = percentage >= (b.notify_threshold_pct || 80) && !isOver;

          return (
            <div
              key={b.category_id}
              className={`bg-white rounded-xl border p-5 transition-all flex flex-col justify-between ${
                isOver
                  ? 'border-rose-300 shadow-xs'
                  : isWarning
                  ? 'border-amber-300 shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Category Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.category_color || '#3b82f6' }}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                        {b.category_name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {b.notify_threshold_pct}% Warning Alert
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isOver ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        Over Limit
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        Near Limit
                      </span>
                    ) : limit > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        On Track
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">No Limit Set</span>
                    )}
                  </div>
                </div>

                {/* Amount Figures */}
                <div className="flex items-baseline justify-between pt-1 font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Spent</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(spent)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Monthly Limit</span>
                    <span className="text-lg font-semibold text-slate-600">{formatCurrency(limit)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                    <span>{percentage}% utilized</span>
                    <span className={remaining < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {remaining < 0
                        ? `${formatCurrency(Math.abs(remaining))} over`
                        : `${formatCurrency(remaining)} remaining`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Budget Controls */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                {isEditing ? (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        New Monthly Limit ($ USD)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                          placeholder="e.g. 500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span className="font-semibold">Warning Threshold:</span>
                        <span className="font-mono">{editThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={editThreshold}
                        onChange={(e) => setEditThreshold(Number(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveEdit(b.category_id)}
                        className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{isSaving ? 'Saving...' : 'Apply'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit(b)}
                    className="w-full py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Adjust Budget Limit</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

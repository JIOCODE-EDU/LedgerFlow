import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet2, PiggyBank, ArrowDownLeft, Target } from 'lucide-react';
import { FinancialSummary } from '../types.ts';
import { formatCurrency } from '../utils/finance.ts';

interface KPICardsProps {
  summary: FinancialSummary | null;
  loading: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const { total_income, total_expenses, net_balance, savings_rate, budget_total_limit, budget_total_spent } = summary;
  const budgetUtilization = budget_total_limit > 0
    ? Math.round((budget_total_spent / budget_total_limit) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Income */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Income
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(total_income)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 font-medium flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Active period
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Deposits &amp; revenue</span>
          </div>
        </div>
      </div>

      {/* 2. Total Expenses */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Expenses
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(total_expenses)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-rose-600 font-medium flex items-center">
              <ArrowDownRight className="w-3.5 h-3.5" /> Outflow
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Recorded expenditures</span>
          </div>
        </div>
      </div>

      {/* 3. Available Net Balance */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Available Balance
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            net_balance >= 0 ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <Wallet2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold font-mono tabular-nums ${
            net_balance >= 0 ? 'text-slate-900' : 'text-rose-600'
          }`}>
            {formatCurrency(net_balance)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className={net_balance >= 0 ? 'text-sky-700 font-medium' : 'text-rose-600 font-medium'}>
              {net_balance >= 0 ? 'Surplus retained' : 'Deficit alert'}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Net cash balance</span>
          </div>
        </div>
      </div>

      {/* 4. Savings Rate & Budget Usage */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Savings &amp; Budgets
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {savings_rate}%
            </span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Budget: {budgetUtilization}%</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetUtilization > 100
                  ? 'bg-rose-500'
                  : budgetUtilization >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { KPICards } from './components/KPICards.tsx';
import { BudgetAlerts } from './components/BudgetAlerts.tsx';
import { AnalyticsCharts } from './components/AnalyticsCharts.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { BudgetPlannerView } from './components/BudgetPlannerView.tsx';
import { DatabaseConsoleModal } from './components/DatabaseConsoleModal.tsx';
import { TransactionFormModal } from './components/TransactionFormModal.tsx';
import {
  fetchSummary,
  fetchCategories,
  fetchTransactions,
  fetchBudgets,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  setBudget,
} from './api.ts';
import {
  FinancialSummary,
  Category,
  Transaction,
  Budget,
  TransactionFilters,
} from './types.ts';
import { filterTransactions } from './utils/finance.ts';
import { ArrowRight, ReceiptText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'database'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Application Data States
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // UI & Form States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State for Transaction History
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: 'all',
    categoryId: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'date-desc',
  });

  // Load Categories once on mount
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Load Summary, Transactions, and Budgets when selectedMonth changes
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumData, txData, bData] = await Promise.all([
        fetchSummary(selectedMonth),
        fetchTransactions({ month: selectedMonth }),
        fetchBudgets(selectedMonth),
      ]);
      setSummary(sumData);
      setTransactions(txData);
      setBudgets(bData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Transaction Handlers
  const handleSaveTransaction = async (data: {
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category_id: number;
    description: string;
    payment_method: string;
    notes?: string;
  }) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
    } else {
      await createTransaction(data);
    }
    setEditingTransaction(null);
    await loadData();
  };

  const handleDeleteTransaction = async (id: number) => {
    await deleteTransaction(id);
    await loadData();
  };

  const handleEditClick = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  // Budget Limit Update Handler
  const handleUpdateBudget = async (categoryId: number, limit: number, threshold?: number) => {
    await setBudget({
      category_id: categoryId,
      month_year: selectedMonth,
      amount_limit: limit,
      notify_threshold_pct: threshold || 80,
    });
    await loadData();
  };

  // Filter transactions in memory using client criteria
  const filteredTransactions = filterTransactions(transactions, filters);

  // Filter by category shortcut from Analytics Chart click
  const handleFilterByCategory = (catId: number) => {
    setFilters((prev) => ({
      ...prev,
      categoryId: String(catId),
    }));
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 3-zone Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards Strip */}
            <KPICards summary={summary} loading={loading} />

            {/* Budget Limit Warnings Bar */}
            {summary && (
              <BudgetAlerts
                warnings={summary.warnings}
                onManageBudgets={() => setActiveTab('budgets')}
              />
            )}

            {/* Graphical Spending Summaries */}
            {summary && (
              <AnalyticsCharts
                summary={summary}
                onFilterByCategory={handleFilterByCategory}
              />
            )}

            {/* Recent Transactions Snapshot */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-slate-600" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Recent Activity
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    ({transactions.slice(0, 6).length} of {transactions.length})
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open full ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Transactions Table for Recent items */}
              <TransactionList
                transactions={transactions.slice(0, 6)}
                categories={categories}
                filters={filters}
                setFilters={setFilters}
                onEdit={handleEditClick}
                onDelete={handleDeleteTransaction}
                onOpenNew={handleOpenNewTransaction}
                loading={loading}
                onRefresh={loadData}
              />
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS HISTORY & FILTERING VIEW */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={filteredTransactions}
            categories={categories}
            filters={filters}
            setFilters={setFilters}
            onEdit={handleEditClick}
            onDelete={handleDeleteTransaction}
            onOpenNew={handleOpenNewTransaction}
            loading={loading}
            onRefresh={loadData}
          />
        )}

        {/* TAB 3: MONTHLY BUDGET PLANNER */}
        {activeTab === 'budgets' && (
          <BudgetPlannerView
            budgets={budgets}
            categories={categories}
            selectedMonth={selectedMonth}
            onUpdateBudget={handleUpdateBudget}
            loading={loading}
          />
        )}

        {/* TAB 4: VISUAL ANALYTICS & REPORTS */}
        {activeTab === 'analytics' && summary && (
          <div className="space-y-6">
            <AnalyticsCharts
              summary={summary}
              onFilterByCategory={handleFilterByCategory}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Cash Flow Summary</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Gross Monthly Inflow:</span>
                    <span className="font-mono font-bold text-emerald-600">${summary.total_income.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Total Monthly Outflow:</span>
                    <span className="font-mono font-bold text-rose-600">${summary.total_expenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Net Surplus / Savings:</span>
                    <span className="font-mono font-bold text-slate-900">${summary.net_balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Monthly Savings Rate:</span>
                    <span className="font-mono font-bold text-emerald-600">{summary.savings_rate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Budget Compliance Summary</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Total Predefined Budget Cap:</span>
                    <span className="font-mono font-bold text-slate-900">${summary.budget_total_limit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Total Budgeted Spend:</span>
                    <span className="font-mono font-bold text-slate-900">${summary.budget_total_spent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Remaining Budget Room:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ${Math.max(0, summary.budget_total_limit - summary.budget_total_spent).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Categories Alerting:</span>
                    <span className="font-mono font-bold text-amber-600">{summary.warnings.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RELATIONAL DATABASE & SQL CONSOLE */}
        {activeTab === 'database' && (
          <DatabaseConsoleModal onRefreshData={loadData} />
        )}
      </main>

      {/* Transaction Modal (Add/Edit) */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        categories={categories}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
      />

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personal Expense Tracker &amp; Budget Planner</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Node.js / Express</span>
            <span aria-hidden="true">·</span>
            <span>Relational SQL Database</span>
            <span aria-hidden="true">·</span>
            <span>REST API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

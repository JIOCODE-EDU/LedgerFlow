import React from 'react';
import { PlusCircle, Wallet, Database, PieChart, ReceiptText, Target } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'database';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'database') => void;
  onOpenNewTransaction: () => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  selectedMonth,
  setSelectedMonth,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                LedgerFlow
              </span>
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap -mt-1">
                Personal Finance &amp; Budget Planner
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (single-line, clean typography) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PieChart className="w-4 h-4 text-slate-500" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'transactions'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ReceiptText className="w-4 h-4 text-slate-500" />
              <span>Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'budgets'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4 text-slate-500" />
              <span>Budget Planner</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'database'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4 text-slate-500" />
              <span>SQL Database</span>
            </button>
          </nav>

          {/* Zone 3: Period Selector & Primary Action */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200">
              <label htmlFor="month-select" className="font-medium text-slate-500 text-xs hidden md:inline">
                Period:
              </label>
              <select
                id="month-select"
                aria-label="Select financial period"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer max-w-[95px] sm:max-w-none"
              >
                <option value="2026-10">Oct '26</option>
                <option value="2026-09">Sep '26</option>
                <option value="2026-08">Aug '26</option>
                <option value="2026-07">Jul '26</option>
              </select>
            </div>

            <button
              onClick={onOpenNewTransaction}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2 py-1 rounded font-medium whitespace-nowrap ${activeTab === 'dashboard' ? 'text-slate-900 font-semibold bg-slate-100' : 'text-slate-500'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-2 py-1 rounded font-medium whitespace-nowrap ${activeTab === 'transactions' ? 'text-slate-900 font-semibold bg-slate-100' : 'text-slate-500'}`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-2 py-1 rounded font-medium whitespace-nowrap ${activeTab === 'budgets' ? 'text-slate-900 font-semibold bg-slate-100' : 'text-slate-500'}`}
          >
            Budgets
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-2 py-1 rounded font-medium whitespace-nowrap ${activeTab === 'database' ? 'text-slate-900 font-semibold bg-slate-100' : 'text-slate-500'}`}
          >
            SQL Data
          </button>
        </div>
      </div>
    </header>
  );
};

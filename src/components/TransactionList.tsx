import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Trash2, Edit2, Download, FileSpreadsheet, Database, Plus, RefreshCw } from 'lucide-react';
import { Transaction, Category, TransactionFilters } from '../types.ts';
import { formatCurrency, formatDate } from '../utils/finance.ts';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => Promise<void>;
  onOpenNew: () => void;
  loading: boolean;
  onRefresh: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  filters,
  setFilters,
  onEdit,
  onDelete,
  onOpenNew,
  loading,
  onRefresh,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, categoryId: e.target.value }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextStartDate = e.target.value;
    setFilters((prev) => {
      const nextEndDate = prev.endDate;
      if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
        return { ...prev, startDate: nextEndDate, endDate: nextStartDate };
      }
      return { ...prev, startDate: nextStartDate };
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextEndDate = e.target.value;
    setFilters((prev) => {
      const nextStartDate = prev.startDate;
      if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
        return { ...prev, startDate: nextEndDate, endDate: nextStartDate };
      }
      return { ...prev, endDate: nextEndDate };
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      categoryId: 'all',
      startDate: '',
      endDate: '',
      sortBy: 'date-desc',
    });
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltered =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.categoryId !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-0">
      {/* Table Header & Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                Transaction History Ledger
              </h3>
              <span className="text-xs font-mono font-medium text-slate-400">
                ({transactions.length} records)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Filter, search, audit, or export detailed income and expense entries.
            </p>
          </div>

          {/* Action buttons: Export CSV, Export SQL, Add */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              aria-label="Refresh transaction ledger"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <a
              href="/api/export/csv"
              download="transactions_export.csv"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </a>
            <a
              href="/api/export/sql"
              download="finance_database_dump.sql"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export SQL</span>
            </a>
            <button
              onClick={onOpenNew}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search description, payee, notes..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
            />
          </div>

          {/* Type Segmented Buttons */}
          <div className="lg:col-span-3 flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleTypeChange('all')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filters.type === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filters.type === 'expense'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filters.type === 'income'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={filters.categoryId}
              onChange={handleCategoryChange}
              aria-label="Filter by category"
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              aria-label="Sort transactions"
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white cursor-pointer"
            >
              <option value="date-desc">Date (Newest first)</option>
              <option value="date-asc">Date (Oldest first)</option>
              <option value="amount-desc">Amount (Highest)</option>
              <option value="amount-asc">Amount (Lowest)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Range & Reset Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Date Range:</span>
            <input
              type="date"
              aria-label="Start date filter"
              value={filters.startDate}
              onChange={handleStartDateChange}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              aria-label="End date filter"
              value={filters.endDate}
              onChange={handleEndDateChange}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
            />
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* High-density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Description / Payee</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Payment Method</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Loading transaction ledger records...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-semibold text-slate-700">No matching transactions found</p>
                    <p className="text-xs text-slate-400">
                      Try relaxing your search terms or filters, or record a new transaction.
                    </p>
                    {isFiltered ? (
                      <button
                        onClick={handleResetFilters}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        Reset Filters
                      </button>
                    ) : (
                      <button
                        onClick={onOpenNew}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                      >
                        Log First Entry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 transition-colors group h-11"
                  >
                    {/* Date */}
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                      <div className="truncate font-semibold">{tx.description}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 truncate -mt-0.5 font-normal">
                          {tx.notes}
                        </div>
                      )}
                    </td>

                    {/* Category (Clean unboxed text with color indicator dot, Anti-slop) */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tx.category_color || '#94a3b8' }}
                        />
                        <span className="font-medium text-slate-800">
                          {tx.category_name || 'Uncategorized'}
                        </span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap font-medium">
                      {tx.payment_method}
                    </td>

                    {/* Amount (Tabular figures, right-aligned) */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-mono font-bold tabular-nums text-sm ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(tx)}
                          aria-label={`Edit transaction ${tx.description}`}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          aria-label={`Delete transaction ${tx.description}`}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Confirm Deletion</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this transaction record? This action will adjust your balance and budget tracking.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

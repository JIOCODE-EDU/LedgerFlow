import { Transaction, Budget, BudgetWarning, BudgetStatus } from '../types.ts';

/**
 * Calculates total income from a list of transactions
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

/**
 * Calculates total expenses from a list of transactions
 */
export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

/**
 * Calculates net balance (income - expenses)
 */
export function calculateNetBalance(totalIncome: number, totalExpenses: number): number {
  return Math.round((totalIncome - totalExpenses) * 100) / 100;
}

/**
 * Calculates savings rate percentage = ((Income - Expenses) / Income) * 100
 * Clamped between 0 and 100 if income > 0; 0 if income <= 0
 */
export function calculateSavingsRate(totalIncome: number, totalExpenses: number): number {
  if (totalIncome <= 0) return 0;
  const savings = totalIncome - totalExpenses;
  if (savings <= 0) return 0;
  const rate = (savings / totalIncome) * 100;
  return Math.min(100, Math.round(rate * 10) / 10);
}

/**
 * Evaluates budget status based on spent amount vs budget limit and threshold
 */
export function evaluateBudgetStatus(
  spent: number,
  limit: number,
  thresholdPct = 80
): { status: BudgetStatus; percentage: number; remaining: number } {
  if (limit <= 0) {
    return {
      status: spent > 0 ? 'exceeded' : 'ok',
      percentage: spent > 0 ? 100 : 0,
      remaining: 0,
    };
  }

  const percentage = Math.round((spent / limit) * 1000) / 10;
  const remaining = Math.round((limit - spent) * 100) / 100;

  let status: BudgetStatus = 'ok';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= thresholdPct) {
    status = 'warning';
  }

  return { status, percentage, remaining };
}

/**
 * Generates warning list for categories that approach or exceed budget limits
 */
export function generateBudgetWarnings(budgets: Budget[], transactions: Transaction[]): BudgetWarning[] {
  const warnings: BudgetWarning[] = [];

  // Group current expenses by category
  const expenseByCategory: Record<number, number> = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      expenseByCategory[t.category_id] = (expenseByCategory[t.category_id] || 0) + Number(t.amount);
    }
  }

  for (const b of budgets) {
    const spent = expenseByCategory[b.category_id] || 0;
    const { status, percentage } = evaluateBudgetStatus(spent, b.amount_limit, b.notify_threshold_pct || 80);

    if (status === 'exceeded') {
      warnings.push({
        category_id: b.category_id,
        category_name: b.category_name || 'Category',
        category_color: b.category_color || '#ef4444',
        spent,
        limit: b.amount_limit,
        percentage,
        status: 'exceeded',
        message: `Budget exceeded! You have spent $${spent.toFixed(2)} of your $${b.amount_limit.toFixed(2)} limit (${percentage}%).`,
      });
    } else if (status === 'warning') {
      warnings.push({
        category_id: b.category_id,
        category_name: b.category_name || 'Category',
        category_color: b.category_color || '#f59e0b',
        spent,
        limit: b.amount_limit,
        percentage,
        status: 'warning',
        message: `Approaching limit! You have reached ${percentage}% of your $${b.amount_limit.toFixed(2)} limit ($${(b.amount_limit - spent).toFixed(2)} remaining).`,
      });
    }
  }

  return warnings.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Filter transactions by criteria
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: {
    search?: string;
    type?: 'all' | 'income' | 'expense';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
  }
): Transaction[] {
  let result = [...transactions];

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter((t) => {
      const description = (t.description ?? '').toLowerCase();
      const categoryName = (t.category_name ?? '').toLowerCase();
      const notes = (t.notes ?? '').toLowerCase();
      const paymentMethod = (t.payment_method ?? '').toLowerCase();

      return (
        description.includes(q) ||
        categoryName.includes(q) ||
        notes.includes(q) ||
        paymentMethod.includes(q)
      );
    });
  }

  if (filters.type && filters.type !== 'all') {
    result = result.filter((t) => t.type === filters.type);
  }

  if (filters.categoryId && filters.categoryId !== 'all') {
    const catId = Number(filters.categoryId);
    if (!Number.isNaN(catId)) {
      result = result.filter((t) => Number(t.category_id) === catId);
    }
  }

  let startDate = filters.startDate ?? '';
  let endDate = filters.endDate ?? '';

  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  if (startDate) {
    result = result.filter((t) => t.date >= startDate);
  }

  if (endDate) {
    result = result.filter((t) => t.date <= endDate);
  }

  const sort = filters.sortBy || 'date-desc';
  result.sort((a, b) => {
    if (sort === 'date-desc') return b.date.localeCompare(a.date) || b.id - a.id;
    if (sort === 'date-asc') return a.date.localeCompare(b.date) || a.id - b.id;
    if (sort === 'amount-desc') return b.amount - a.amount || b.date.localeCompare(a.date) || b.id - a.id;
    if (sort === 'amount-asc') return a.amount - b.amount || a.date.localeCompare(b.date) || a.id - b.id;
    return 0;
  });

  return result;
}

/**
 * Formats a number as USD currency with commas and 2 decimals
 */
export function formatCurrency(amount: number): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Formats a date string (YYYY-MM-DD) into readable format (e.g., Oct 15, 2026)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

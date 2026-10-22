export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_default: number;
}

export interface Transaction {
  id: number;
  date: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  description: string;
  payment_method: string; // 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Digital Wallet'
  notes?: string;
  created_at?: string;
}

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface Budget {
  id?: number;
  category_id: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  month_year: string; // YYYY-MM
  amount_limit: number;
  notify_threshold_pct: number; // default 80
  spent?: number;
  remaining?: number;
  percentage?: number;
  status?: BudgetStatus;
}

export interface BudgetWarning {
  category_id: number;
  category_name: string;
  category_color: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'warning' | 'exceeded';
  message: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  savings_rate: number;
  budget_total_limit: number;
  budget_total_spent: number;
  transaction_count: number;
  warnings: BudgetWarning[];
  category_breakdown: {
    category_id: number;
    category_name: string;
    category_color: string;
    category_icon: string;
    total_amount: number;
    percentage: number;
  }[];
  daily_trend: {
    date: string;
    day: string;
    income: number;
    expense: number;
  }[];
  monthly_trend: {
    month: string;
    month_label: string;
    income: number;
    expense: number;
    balance: number;
  }[];
}

export interface TransactionFilters {
  search: string;
  type: 'all' | 'income' | 'expense';
  categoryId: string; // 'all' or numeric string
  startDate: string;
  endDate: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

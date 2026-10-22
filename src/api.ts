import { Category, Transaction, Budget, FinancialSummary } from './types.ts';

export async function fetchSummary(month: string): Promise<FinancialSummary> {
  const res = await fetch(`/api/summary?month=${encodeURIComponent(month)}`);
  if (!res.ok) throw new Error('Failed to fetch financial summary');
  return res.json();
}

export async function fetchCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const url = type ? `/api/categories?type=${type}` : '/api/categories';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(cat: { name: string; type: 'income' | 'expense'; icon: string; color: string }): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cat),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create category');
  }
  return res.json();
}

export async function fetchTransactions(params: {
  month?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
}): Promise<Transaction[]> {
  const searchParams = new URLSearchParams();
  if (params.month) searchParams.set('month', params.month);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.type && params.type !== 'all') searchParams.set('type', params.type);
  if (params.categoryId && params.categoryId !== 'all') searchParams.set('categoryId', params.categoryId);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(`/api/transactions?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function createTransaction(data: {
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  description: string;
  payment_method: string;
  notes?: string;
}): Promise<Transaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to record transaction');
  }
  return res.json();
}

export async function updateTransaction(id: number, data: {
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  description: string;
  payment_method: string;
  notes?: string;
}): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update transaction');
  }
  return res.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
}

export async function fetchBudgets(month: string): Promise<Budget[]> {
  const res = await fetch(`/api/budgets?month=${encodeURIComponent(month)}`);
  if (!res.ok) throw new Error('Failed to fetch budgets');
  return res.json();
}

export async function setBudget(data: {
  category_id: number;
  month_year: string;
  amount_limit: number;
  notify_threshold_pct?: number;
}): Promise<void> {
  const res = await fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save budget limit');
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch('/api/seed', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset data');
}

export async function executeSql(sql: string): Promise<{ rows: any[]; rowCount: number }> {
  const res = await fetch('/api/sql/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Query failed');
  }
  return res.json();
}

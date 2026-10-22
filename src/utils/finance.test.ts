import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateNetBalance,
  calculateSavingsRate,
  evaluateBudgetStatus,
  generateBudgetWarnings,
  filterTransactions,
} from './finance.ts';
import { Transaction, Budget } from '../types.ts';

const mockTransactions: Transaction[] = [
  {
    id: 1,
    date: '2026-10-01',
    amount: 5000,
    type: 'income',
    category_id: 1,
    category_name: 'Salary',
    description: 'Monthly Salary Paycheck',
    payment_method: 'Bank Transfer',
  },
  {
    id: 2,
    date: '2026-10-02',
    amount: 1200,
    type: 'expense',
    category_id: 2,
    category_name: 'Housing & Rent',
    description: 'Apartment Rent',
    payment_method: 'Bank Transfer',
  },
  {
    id: 3,
    date: '2026-10-05',
    amount: 450,
    type: 'expense',
    category_id: 3,
    category_name: 'Groceries & Food',
    description: 'Whole Foods Market',
    payment_method: 'Credit Card',
  },
  {
    id: 4,
    date: '2026-10-08',
    amount: 150,
    type: 'expense',
    category_id: 4,
    category_name: 'Dining & Entertainment',
    description: 'Bistro Dinner with friends',
    payment_method: 'Credit Card',
  },
  {
    id: 5,
    date: '2026-10-10',
    amount: 350,
    type: 'income',
    category_id: 5,
    category_name: 'Freelance & Consulting',
    description: 'Web design advisory work',
    payment_method: 'Digital Wallet',
  },
];

test('calculateTotalIncome correctly aggregates income transactions', () => {
  const total = calculateTotalIncome(mockTransactions);
  assert.equal(total, 5350);
});

test('calculateTotalExpenses correctly aggregates expense transactions', () => {
  const total = calculateTotalExpenses(mockTransactions);
  assert.equal(total, 1800);
});

test('calculateNetBalance correctly subtracts expenses from income', () => {
  const balance = calculateNetBalance(5350, 1800);
  assert.equal(balance, 3550);
});

test('calculateSavingsRate computes correct percentage', () => {
  // Income 5000, expenses 2000 -> Savings 3000 -> 3000/5000 = 60%
  const rate = calculateSavingsRate(5000, 2000);
  assert.equal(rate, 60);

  // Zero income case
  assert.equal(calculateSavingsRate(0, 500), 0);

  // Expenses exceed income
  assert.equal(calculateSavingsRate(1000, 1500), 0);
});

test('evaluateBudgetStatus flags ok, warning, and exceeded states accurately', () => {
  // Under threshold (400 / 500 = 80% with threshold 85)
  const okResult = evaluateBudgetStatus(350, 500, 80);
  assert.equal(okResult.status, 'ok');
  assert.equal(okResult.percentage, 70);
  assert.equal(okResult.remaining, 150);

  // Approaching limit (420 / 500 = 84% >= 80%)
  const warnResult = evaluateBudgetStatus(420, 500, 80);
  assert.equal(warnResult.status, 'warning');
  assert.equal(warnResult.percentage, 84);
  assert.equal(warnResult.remaining, 80);

  // Exceeded limit (520 / 500 = 104% >= 100%)
  const exceededResult = evaluateBudgetStatus(520, 500, 80);
  assert.equal(exceededResult.status, 'exceeded');
  assert.equal(exceededResult.percentage, 104);
  assert.equal(exceededResult.remaining, -20);
});

test('generateBudgetWarnings filters and sorts categories with warnings', () => {
  const budgets: Budget[] = [
    {
      category_id: 2,
      category_name: 'Housing & Rent',
      amount_limit: 1500,
      notify_threshold_pct: 80,
      month_year: '2026-10',
    },
    {
      category_id: 3,
      category_name: 'Groceries & Food',
      amount_limit: 500, // spent 450 -> 90% -> warning!
      notify_threshold_pct: 80,
      month_year: '2026-10',
    },
    {
      category_id: 4,
      category_name: 'Dining & Entertainment',
      amount_limit: 100, // spent 150 -> 150% -> exceeded!
      notify_threshold_pct: 80,
      month_year: '2026-10',
    },
  ];

  const warnings = generateBudgetWarnings(budgets, mockTransactions);
  assert.equal(warnings.length, 3);

  // Highest percentage should come first (Dining at 150%, then Groceries at 90%, then Housing at 80%)
  assert.equal(warnings[0].category_id, 4);
  assert.equal(warnings[0].status, 'exceeded');
  assert.equal(warnings[1].category_id, 3);
  assert.equal(warnings[1].status, 'warning');
  assert.equal(warnings[2].category_id, 2);
  assert.equal(warnings[2].status, 'warning');
});

test('filterTransactions filters by search query and type correctly', () => {
  const searchMatches = filterTransactions(mockTransactions, { search: 'Whole Foods' });
  assert.equal(searchMatches.length, 1);
  assert.equal(searchMatches[0].id, 3);

  const expensesOnly = filterTransactions(mockTransactions, { type: 'expense' });
  assert.equal(expensesOnly.length, 3);

  const dateFiltered = filterTransactions(mockTransactions, {
    startDate: '2026-10-05',
    endDate: '2026-10-09',
  });
  assert.equal(dateFiltered.length, 2);
});

test('filterTransactions handles category IDs and reversed date ranges consistently', () => {
  const byCategory = filterTransactions(mockTransactions, { categoryId: '3' });
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].id, 3);

  const reversedRange = filterTransactions(mockTransactions, {
    startDate: '2026-10-09',
    endDate: '2026-10-05',
  });

  assert.equal(reversedRange.length, 2);
  assert.deepEqual(
    reversedRange.map((tx) => tx.id),
    [4, 3]
  );
});

import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'finance.db');
const db = new DatabaseSync(dbPath);

// Initialize relational schema
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    amount_limit REAL NOT NULL,
    notify_threshold_pct INTEGER DEFAULT 80,
    UNIQUE(category_id, month_year)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    description TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month_year);
`);

// Seed initial data if tables are empty
function seedDatabase() {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count > 0) return;

  const categories = [
    // Income
    { name: 'Salary & Wages', type: 'income', icon: 'Briefcase', color: '#10b981', is_default: 1 },
    { name: 'Freelance & Consulting', type: 'income', icon: 'Laptop', color: '#06b6d4', is_default: 1 },
    { name: 'Investment & Dividends', type: 'income', icon: 'TrendingUp', color: '#8b5cf6', is_default: 1 },
    { name: 'Other Income', type: 'income', icon: 'DollarSign', color: '#64748b', is_default: 1 },
    // Expense
    { name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#3b82f6', is_default: 1 },
    { name: 'Groceries & Market', type: 'expense', icon: 'ShoppingCart', color: '#10b981', is_default: 1 },
    { name: 'Dining & Restaurants', type: 'expense', icon: 'Utensils', color: '#f59e0b', is_default: 1 },
    { name: 'Transportation & Fuel', type: 'expense', icon: 'Car', color: '#6366f1', is_default: 1 },
    { name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#eab308', is_default: 1 },
    { name: 'Healthcare & Wellness', type: 'expense', icon: 'HeartPulse', color: '#ec4899', is_default: 1 },
    { name: 'Shopping & Apparel', type: 'expense', icon: 'ShoppingBag', color: '#d946ef', is_default: 1 },
    { name: 'Entertainment & Leisure', type: 'expense', icon: 'Film', color: '#f43f5e', is_default: 1 },
    { name: 'Subscriptions & SaaS', type: 'expense', icon: 'CreditCard', color: '#8b5cf6', is_default: 1 },
    { name: 'Education & Learning', type: 'expense', icon: 'GraduationCap', color: '#0ea5e9', is_default: 1 },
  ];

  const insertCat = db.prepare(`
    INSERT INTO categories (name, type, icon, color, is_default)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of categories) {
    insertCat.run(c.name, c.type, c.icon, c.color, c.is_default);
  }

  // Pre-set budgets for October 2026
  const month = '2026-10';
  const budgets = [
    { category_id: 5, limit: 1400, threshold: 85 }, // Housing
    { category_id: 6, limit: 550, threshold: 80 },  // Groceries
    { category_id: 7, limit: 280, threshold: 80 },  // Dining
    { category_id: 8, limit: 250, threshold: 80 },  // Transportation
    { category_id: 9, limit: 200, threshold: 80 },  // Utilities
    { category_id: 10, limit: 150, threshold: 80 }, // Healthcare
    { category_id: 11, limit: 200, threshold: 80 }, // Shopping
    { category_id: 12, limit: 180, threshold: 80 }, // Entertainment
    { category_id: 13, limit: 90, threshold: 80 },  // Subscriptions
  ];

  const insertBudget = db.prepare(`
    INSERT INTO budgets (category_id, month_year, amount_limit, notify_threshold_pct)
    VALUES (?, ?, ?, ?)
  `);

  for (const b of budgets) {
    insertBudget.run(b.category_id, month, b.limit, b.threshold);
  }

  // Seed sample transactions for September & October 2026
  const seedTransactions = [
    // Income Oct 2026
    { date: '2026-10-01', amount: 4850.0, type: 'income', category_id: 1, desc: 'Bi-weekly Salary Deposit', method: 'Bank Transfer', notes: 'Direct deposit from employer' },
    { date: '2026-10-15', amount: 4850.0, type: 'income', category_id: 1, desc: 'Bi-weekly Salary Deposit', method: 'Bank Transfer', notes: 'Direct deposit from employer' },
    { date: '2026-10-11', amount: 920.0, type: 'income', category_id: 2, desc: 'Client Web Application Consulting', method: 'Digital Wallet', notes: 'Sprint milestone deliverable' },
    { date: '2026-10-18', amount: 285.5, type: 'income', category_id: 3, desc: 'Quarterly S&P ETF Dividend', method: 'Bank Transfer', notes: 'Reinvested payout portion' },

    // Expenses Oct 2026
    { date: '2026-10-01', amount: 1350.0, type: 'expense', category_id: 5, desc: 'Apartment Monthly Rent', method: 'Bank Transfer', notes: 'Building lease payment' },
    { date: '2026-10-02', amount: 142.3, type: 'expense', category_id: 6, desc: 'Trader Joe\'s Grocery Haul', method: 'Debit Card', notes: 'Fresh produce & pantry essentials' },
    { date: '2026-10-03', amount: 54.0, type: 'expense', category_id: 8, desc: 'Shell Gas Station Fill-up', method: 'Credit Card', notes: 'Full tank unleaded' },
    { date: '2026-10-04', amount: 48.5, type: 'expense', category_id: 7, desc: 'Lunch at Soba Noodle Bar', method: 'Credit Card', notes: 'Lunch with engineering lead' },
    { date: '2026-10-05', amount: 78.2, type: 'expense', category_id: 9, desc: 'Electric & Power Utility', method: 'Bank Transfer', notes: 'September electricity bill' },
    { date: '2026-10-07', amount: 165.0, type: 'expense', category_id: 6, desc: 'Costco Wholesale Bulk Staples', method: 'Credit Card', notes: 'Paper goods & household bulk' },
    { date: '2026-10-08', amount: 89.9, type: 'expense', category_id: 11, desc: 'Autumn Merino Wool Sweater', method: 'Credit Card', notes: 'Seasonal wardrobe' },
    { date: '2026-10-10', amount: 35.0, type: 'expense', category_id: 10, desc: 'Pharmacy Prescription Copay', method: 'Debit Card', notes: 'Allergy medication refill' },
    { date: '2026-10-12', amount: 112.4, type: 'expense', category_id: 7, desc: 'Weekend Bistro Dinner', method: 'Credit Card', notes: 'Dinner with partner' },
    { date: '2026-10-13', amount: 45.0, type: 'expense', category_id: 13, desc: 'Github & Cloud Tools Subscription', method: 'Credit Card', notes: 'Monthly developer seats' },
    { date: '2026-10-14', amount: 138.6, type: 'expense', category_id: 6, desc: 'Whole Foods Market Organic', method: 'Debit Card', notes: 'Weekly groceries' },
    { date: '2026-10-16', amount: 65.0, type: 'expense', category_id: 8, desc: 'Public Transit Monthly Metro Card', method: 'Credit Card', notes: 'Subway & bus commute' },
    { date: '2026-10-17', amount: 95.0, type: 'expense', category_id: 12, desc: 'Symphony Concert Tickets', method: 'Credit Card', notes: 'Weekend performance' },
    { date: '2026-10-18', amount: 62.8, type: 'expense', category_id: 7, desc: 'Brunch & Artisanal Coffee', method: 'Digital Wallet', notes: 'Sunday neighborhood cafe' },
    { date: '2026-10-19', amount: 84.5, type: 'expense', category_id: 11, desc: 'Running Shoes & Sports Socks', method: 'Credit Card', notes: 'Fleet Feet athletic shoes' },
    { date: '2026-10-20', amount: 45.0, type: 'expense', category_id: 9, desc: 'High-Speed Fiber Internet Bill', method: 'Bank Transfer', notes: 'Monthly recurring bill' },
    { date: '2026-10-21', amount: 34.2, type: 'expense', category_id: 7, desc: 'Quick Japanese Ramen Lunch', method: 'Credit Card', notes: 'Workday lunch' },
    { date: '2026-10-21', amount: 55.0, type: 'expense', category_id: 11, desc: 'Ergonomic Desk Accessories', method: 'Credit Card', notes: 'Monitor riser stand' },

    // Previous Month (Sept 2026) for trend comparison
    { date: '2026-09-01', amount: 4850.0, type: 'income', category_id: 1, desc: 'Bi-weekly Salary Deposit', method: 'Bank Transfer', notes: '' },
    { date: '2026-09-15', amount: 4850.0, type: 'income', category_id: 1, desc: 'Bi-weekly Salary Deposit', method: 'Bank Transfer', notes: '' },
    { date: '2026-09-01', amount: 1350.0, type: 'expense', category_id: 5, desc: 'Apartment Monthly Rent', method: 'Bank Transfer', notes: '' },
    { date: '2026-09-05', amount: 480.0, type: 'expense', category_id: 6, desc: 'Groceries (Monthly aggregate)', method: 'Debit Card', notes: '' },
    { date: '2026-09-12', amount: 240.0, type: 'expense', category_id: 7, desc: 'Restaurants & Dining', method: 'Credit Card', notes: '' },
    { date: '2026-09-18', amount: 210.0, type: 'expense', category_id: 8, desc: 'Fuel and Rideshare', method: 'Credit Card', notes: '' },
    { date: '2026-09-22', amount: 125.0, type: 'expense', category_id: 9, desc: 'Water and Electricity', method: 'Bank Transfer', notes: '' },
  ];

  const insertTx = db.prepare(`
    INSERT INTO transactions (date, amount, type, category_id, description, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of seedTransactions) {
    insertTx.run(t.date, t.amount, t.type, t.category_id, t.desc, t.method, t.notes);
  }
}

seedDatabase();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // --- API Routes ---

  // 1. Get Categories
  app.get('/api/categories', (req, res) => {
    try {
      const type = req.query.type as string;
      let query = 'SELECT * FROM categories ORDER BY type ASC, name ASC';
      const params: any[] = [];
      if (type && (type === 'income' || type === 'expense')) {
        query = 'SELECT * FROM categories WHERE type = ? ORDER BY name ASC';
        params.push(type);
      }
      const rows = db.prepare(query).all(...params);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create Category
  app.post('/api/categories', (req, res) => {
    try {
      const { name, type, icon, color } = req.body;
      if (!name || !type || !icon || !color) {
        return res.status(400).json({ error: 'All category fields are required' });
      }
      const insert = db.prepare(`
        INSERT INTO categories (name, type, icon, color, is_default)
        VALUES (?, ?, ?, ?, 0)
      `);
      const result = insert.run(name.trim(), type, icon, color);
      res.status(201).json({ id: result.lastInsertRowid, name, type, icon, color, is_default: 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Get Transactions with filtering & pagination
  app.get('/api/transactions', (req, res) => {
    try {
      const { search, type, categoryId, startDate, endDate, month, limit, offset } = req.query;

      let sql = `
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (month) {
        sql += ` AND t.date LIKE ?`;
        params.push(`${month}%`);
      }
      if (startDate) {
        sql += ` AND t.date >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        sql += ` AND t.date <= ?`;
        params.push(endDate);
      }
      if (type && type !== 'all') {
        sql += ` AND t.type = ?`;
        params.push(type);
      }
      if (categoryId && categoryId !== 'all') {
        sql += ` AND t.category_id = ?`;
        params.push(Number(categoryId));
      }
      if (search) {
        sql += ` AND (t.description LIKE ? OR t.notes LIKE ? OR c.name LIKE ? OR t.payment_method LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
      }

      sql += ` ORDER BY t.date DESC, t.id DESC`;

      if (limit) {
        sql += ` LIMIT ?`;
        params.push(Number(limit));
        if (offset) {
          sql += ` OFFSET ?`;
          params.push(Number(offset));
        }
      }

      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create Transaction
  app.post('/api/transactions', (req, res) => {
    try {
      const { date, amount, type, category_id, description, payment_method, notes } = req.body;

      if (!date || !amount || !type || !category_id || !description) {
        return res.status(400).json({ error: 'Required transaction fields are missing' });
      }

      const parsedAmount = Math.abs(parseFloat(amount));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }

      const insert = db.prepare(`
        INSERT INTO transactions (date, amount, type, category_id, description, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insert.run(
        date,
        parsedAmount,
        type,
        Number(category_id),
        description.trim(),
        payment_method || 'Debit Card',
        (notes || '').trim()
      );

      const created = db.prepare(`
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Transaction
  app.put('/api/transactions/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const { date, amount, type, category_id, description, payment_method, notes } = req.body;

      if (!date || !amount || !type || !category_id || !description) {
        return res.status(400).json({ error: 'Required fields missing' });
      }

      const parsedAmount = Math.abs(parseFloat(amount));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      const update = db.prepare(`
        UPDATE transactions
        SET date = ?, amount = ?, type = ?, category_id = ?, description = ?, payment_method = ?, notes = ?
        WHERE id = ?
      `);

      update.run(
        date,
        parsedAmount,
        type,
        Number(category_id),
        description.trim(),
        payment_method || 'Debit Card',
        (notes || '').trim(),
        id
      );

      const updated = db.prepare(`
        SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).get(id);

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete Transaction
  app.delete('/api/transactions/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Budgets for a specific month
  app.get('/api/budgets', (req, res) => {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

      const rows = db.prepare(`
        SELECT 
          c.id as category_id,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon,
          COALESCE(b.id, 0) as id,
          COALESCE(b.month_year, ?) as month_year,
          COALESCE(b.amount_limit, 0) as amount_limit,
          COALESCE(b.notify_threshold_pct, 80) as notify_threshold_pct,
          COALESCE((
            SELECT SUM(t.amount)
            FROM transactions t
            WHERE t.category_id = c.id
              AND t.type = 'expense'
              AND t.date LIKE ?
          ), 0) as spent
        FROM categories c
        LEFT JOIN budgets b ON b.category_id = c.id AND b.month_year = ?
        WHERE c.type = 'expense'
        ORDER BY b.amount_limit DESC, c.name ASC
      `).all(month, `${month}%`, month) as any[];

      const budgetsWithStatus = rows.map((b) => {
        const spent = Number(b.spent) || 0;
        const limit = Number(b.amount_limit) || 0;
        const percentage = limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;
        const remaining = Math.round((limit - spent) * 100) / 100;
        let status = 'ok';
        if (limit > 0) {
          if (percentage >= 100) status = 'exceeded';
          else if (percentage >= (b.notify_threshold_pct || 80)) status = 'warning';
        }
        return {
          ...b,
          spent,
          amount_limit: limit,
          percentage,
          remaining,
          status,
        };
      });

      res.json(budgetsWithStatus);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Set / Upsert Budget
  app.post('/api/budgets', (req, res) => {
    try {
      const { category_id, month_year, amount_limit, notify_threshold_pct } = req.body;
      if (!category_id || !month_year || amount_limit === undefined) {
        return res.status(400).json({ error: 'category_id, month_year, and amount_limit are required' });
      }

      const limit = Math.max(0, parseFloat(amount_limit));
      const threshold = notify_threshold_pct ? Number(notify_threshold_pct) : 80;

      const upsert = db.prepare(`
        INSERT INTO budgets (category_id, month_year, amount_limit, notify_threshold_pct)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(category_id, month_year) DO UPDATE SET
          amount_limit = excluded.amount_limit,
          notify_threshold_pct = excluded.notify_threshold_pct
      `);

      upsert.run(Number(category_id), month_year, limit, threshold);
      res.json({ success: true, category_id, month_year, amount_limit: limit, notify_threshold_pct: threshold });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Financial Summary for Dashboard
  app.get('/api/summary', (req, res) => {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

      // Income & Expense totals for current selected month
      const totals = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE date LIKE ?
      `).get(`${month}%`) as any;

      const totalIncome = Math.round(Number(totals.total_income) * 100) / 100;
      const totalExpenses = Math.round(Number(totals.total_expenses) * 100) / 100;
      const netBalance = Math.round((totalIncome - totalExpenses) * 100) / 100;
      const savingsRate = totalIncome > 0 && netBalance > 0
        ? Math.min(100, Math.round(((netBalance / totalIncome) * 100) * 10) / 10)
        : 0;

      // Budget stats and warnings
      const budgetRows = db.prepare(`
        SELECT 
          c.id as category_id,
          c.name as category_name,
          c.color as category_color,
          b.amount_limit,
          b.notify_threshold_pct,
          COALESCE((
            SELECT SUM(t.amount)
            FROM transactions t
            WHERE t.category_id = c.id
              AND t.type = 'expense'
              AND t.date LIKE ?
          ), 0) as spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.month_year = ? AND b.amount_limit > 0
      `).all(`${month}%`, month) as any[];

      let budgetTotalLimit = 0;
      let budgetTotalSpent = 0;
      const warnings: any[] = [];

      for (const b of budgetRows) {
        const spent = Number(b.spent) || 0;
        const limit = Number(b.amount_limit) || 0;
        budgetTotalLimit += limit;
        budgetTotalSpent += spent;
        const percentage = Math.round((spent / limit) * 1000) / 10;
        const threshold = b.notify_threshold_pct || 80;

        if (percentage >= 100) {
          warnings.push({
            category_id: b.category_id,
            category_name: b.category_name,
            category_color: b.category_color,
            spent,
            limit,
            percentage,
            status: 'exceeded',
            message: `Budget Exceeded: ${b.category_name} is at ${percentage}% ($${spent.toFixed(2)} spent of $${limit.toFixed(2)} limit).`,
          });
        } else if (percentage >= threshold) {
          warnings.push({
            category_id: b.category_id,
            category_name: b.category_name,
            category_color: b.category_color,
            spent,
            limit,
            percentage,
            status: 'warning',
            message: `Approaching Limit: ${b.category_name} has reached ${percentage}% of its $${limit.toFixed(2)} budget limit.`,
          });
        }
      }

      warnings.sort((a, b) => b.percentage - a.percentage);

      // Category breakdown (expenses for this month)
      const breakdownRows = db.prepare(`
        SELECT 
          c.id as category_id,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon,
          SUM(t.amount) as total_amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.type = 'expense' AND t.date LIKE ?
        GROUP BY c.id
        ORDER BY total_amount DESC
      `).all(`${month}%`) as any[];

      const categoryBreakdown = breakdownRows.map((r) => {
        const amt = Number(r.total_amount) || 0;
        const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 1000) / 10 : 0;
        return {
          category_id: r.category_id,
          category_name: r.category_name,
          category_color: r.category_color,
          category_icon: r.category_icon,
          total_amount: Math.round(amt * 100) / 100,
          percentage: pct,
        };
      });

      // Daily trend for current month
      const dailyRows = db.prepare(`
        SELECT 
          date,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions
        WHERE date LIKE ?
        GROUP BY date
        ORDER BY date ASC
      `).all(`${month}%`) as any[];

      const dailyTrend = dailyRows.map((r) => ({
        date: r.date,
        day: r.date.slice(8, 10),
        income: Number(r.income) || 0,
        expense: Number(r.expense) || 0,
      }));

      // Monthly trend (last 6 months)
      const monthlyRows = db.prepare(`
        SELECT 
          substr(date, 1, 7) as month_val,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions
        GROUP BY month_val
        ORDER BY month_val DESC
        LIMIT 6
      `).all() as any[];

      const monthlyTrend = monthlyRows.reverse().map((r) => {
        const inc = Number(r.income) || 0;
        const exp = Number(r.expense) || 0;
        const [year, m] = r.month_val.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const label = `${monthNames[parseInt(m, 10) - 1]} '${year.slice(2)}`;
        return {
          month: r.month_val,
          month_label: label,
          income: inc,
          expense: exp,
          balance: Math.round((inc - exp) * 100) / 100,
        };
      });

      res.json({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_balance: netBalance,
        savings_rate: savingsRate,
        budget_total_limit: Math.round(budgetTotalLimit * 100) / 100,
        budget_total_spent: Math.round(budgetTotalSpent * 100) / 100,
        transaction_count: totals.transaction_count,
        warnings,
        category_breakdown: categoryBreakdown,
        daily_trend: dailyTrend,
        monthly_trend: monthlyTrend,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. CSV Export
  app.get('/api/export/csv', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT 
          t.id,
          t.date,
          t.type,
          c.name as category,
          t.amount,
          t.description,
          t.payment_method,
          t.notes,
          t.created_at
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC, t.id DESC
      `).all() as any[];

      let csv = 'ID,Date,Type,Category,Amount,Description,Payment Method,Notes,Created At\n';
      for (const r of rows) {
        const cleanDesc = `"${(r.description || '').replace(/"/g, '""')}"`;
        const cleanNotes = `"${(r.notes || '').replace(/"/g, '""')}"`;
        const cleanCat = `"${(r.category || '').replace(/"/g, '""')}"`;
        csv += `${r.id},${r.date},${r.type},${cleanCat},${r.amount},${cleanDesc},${r.payment_method},${cleanNotes},${r.created_at}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. SQL Dump Export
  app.get('/api/export/sql', (req, res) => {
    try {
      const catRows = db.prepare('SELECT * FROM categories').all() as any[];
      const budgetRows = db.prepare('SELECT * FROM budgets').all() as any[];
      const txRows = db.prepare('SELECT * FROM transactions').all() as any[];

      let sqlDump = `-- Personal Expense Tracker & Budget Planner SQL Dump\n`;
      sqlDump += `-- Export Date: ${new Date().toISOString()}\n\n`;

      sqlDump += `DROP TABLE IF EXISTS transactions;\n`;
      sqlDump += `DROP TABLE IF EXISTS budgets;\n`;
      sqlDump += `DROP TABLE IF EXISTS categories;\n\n`;

      sqlDump += `CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  is_default TINYINT(1) DEFAULT 1
);\n\n`;

      sqlDump += `CREATE TABLE budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  amount_limit DECIMAL(12,2) NOT NULL,
  notify_threshold_pct INT DEFAULT 80,
  UNIQUE KEY uk_cat_month (category_id, month_year),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);\n\n`;

      sqlDump += `CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);\n\n`;

      // Inserts
      for (const c of catRows) {
        sqlDump += `INSERT INTO categories (id, name, type, icon, color, is_default) VALUES (${c.id}, '${c.name.replace(/'/g, "''")}', '${c.type}', '${c.icon}', '${c.color}', ${c.is_default});\n`;
      }
      sqlDump += `\n`;

      for (const b of budgetRows) {
        sqlDump += `INSERT INTO budgets (id, category_id, month_year, amount_limit, notify_threshold_pct) VALUES (${b.id}, ${b.category_id}, '${b.month_year}', ${b.amount_limit}, ${b.notify_threshold_pct});\n`;
      }
      sqlDump += `\n`;

      for (const t of txRows) {
        sqlDump += `INSERT INTO transactions (id, date, amount, type, category_id, description, payment_method, notes, created_at) VALUES (${t.id}, '${t.date}', ${t.amount}, '${t.type}', ${t.category_id}, '${t.description.replace(/'/g, "''")}', '${t.payment_method}', '${(t.notes || '').replace(/'/g, "''")}', '${t.created_at}');\n`;
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="finance_database_dump.sql"');
      res.send(sqlDump);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Reset / Re-seed Database
  app.post('/api/seed', (req, res) => {
    try {
      db.exec(`
        DELETE FROM transactions;
        DELETE FROM budgets;
        DELETE FROM categories;
      `);
      seedDatabase();
      res.json({ success: true, message: 'Database reset to demo state' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Relational SQL Console inspector (read-only queries)
  app.post('/api/sql/query', (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: 'SQL query string required' });
      }

      const trimmed = sql.trim();
      const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
      if (!['SELECT', 'PRAGMA', 'EXPLAIN'].includes(firstWord)) {
        return res.status(403).json({ error: 'Only SELECT, PRAGMA, and EXPLAIN queries are allowed in query inspector' });
      }

      const rows = db.prepare(trimmed).all();
      res.json({ rows, rowCount: rows.length });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Expense Tracker & Budget Planner Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

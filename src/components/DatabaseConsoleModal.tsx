import React, { useState, useEffect } from 'react';
import { Database, Play, Download, RefreshCw, Table, Terminal, FileCode, CheckCircle, AlertCircle } from 'lucide-react';
import { executeSql, resetDemoData } from '../api.ts';

interface DatabaseConsoleModalProps {
  onRefreshData: () => void;
}

export const DatabaseConsoleModal: React.FC<DatabaseConsoleModalProps> = ({ onRefreshData }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('summary');
  const [queryInput, setQueryInput] = useState<string>(
    'SELECT c.name AS category, c.type, COUNT(t.id) AS tx_count, ROUND(SUM(t.amount), 2) AS total_amount\nFROM categories c\nLEFT JOIN transactions t ON t.category_id = c.id\nGROUP BY c.id\nORDER BY total_amount DESC;'
  );
  const [queryResult, setQueryResult] = useState<{ rows: any[]; rowCount: number } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const presets = [
    {
      id: 'summary',
      name: 'Category Spending Aggregation',
      sql: 'SELECT c.name AS category, c.type, COUNT(t.id) AS tx_count, ROUND(SUM(t.amount), 2) AS total_amount\nFROM categories c\nLEFT JOIN transactions t ON t.category_id = c.id\nGROUP BY c.id\nORDER BY total_amount DESC;',
    },
    {
      id: 'budget_vs_actual',
      name: 'Budget vs Actual Expenditure',
      sql: 'SELECT c.name AS category, b.month_year, b.amount_limit, ROUND(COALESCE(SUM(t.amount), 0), 2) AS spent, ROUND(b.amount_limit - COALESCE(SUM(t.amount), 0), 2) AS remaining\nFROM budgets b\nJOIN categories c ON b.category_id = c.id\nLEFT JOIN transactions t ON t.category_id = c.id AND t.date LIKE (b.month_year || "%")\nGROUP BY b.id\nORDER BY spent DESC;',
    },
    {
      id: 'recent_tx',
      name: 'Recent Transactions with Categories',
      sql: 'SELECT t.id, t.date, t.type, c.name AS category, t.amount, t.description, t.payment_method\nFROM transactions t\nJOIN categories c ON t.category_id = c.id\nORDER BY t.date DESC\nLIMIT 15;',
    },
    {
      id: 'table_schema',
      name: 'Transactions Table Schema (PRAGMA)',
      sql: 'PRAGMA table_info(transactions);',
    },
  ];

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setQueryInput(found.sql);
      runQuery(found.sql);
    }
  };

  const runQuery = async (sqlToRun?: string) => {
    const sql = sqlToRun || queryInput;
    setIsExecuting(true);
    setQueryError(null);
    try {
      const res = await executeSql(sql);
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'Execution error');
      setQueryResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database to realistic default demo dataset?')) return;
    setIsResetting(true);
    try {
      await resetDemoData();
      setResetSuccess(true);
      onRefreshData();
      runQuery();
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to reset: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    runQuery();
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro & Architecture Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Relational SQL Database Engine &amp; Schema Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Persistent relational data storage for transactions, categories, and monthly budgets with foreign keys and indexes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/api/export/sql"
              download="finance_database_dump.sql"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download SQL Dump</span>
            </a>
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Re-seed Demo Data'}</span>
            </button>
          </div>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Database has been successfully re-seeded with realistic financial transactions and budgets!</span>
          </div>
        )}

        {/* Database Schema Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-500" /> categories
              </span>
              <span className="font-mono text-slate-500 text-[11px]">14 rows</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              id (PK), name, type, icon, color, is_default
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-500" /> budgets
              </span>
              <span className="font-mono text-slate-500 text-[11px]">FK -&gt; categories</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              id (PK), category_id (FK), month_year, amount_limit, notify_threshold_pct
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-500" /> transactions
              </span>
              <span className="font-mono text-slate-500 text-[11px]">Indexed by date</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              id (PK), date, amount, type, category_id (FK), description, payment_method, notes
            </p>
          </div>
        </div>
      </div>

      {/* Interactive SQL Console */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-900">Interactive SQL Console</h4>
          </div>

          {/* Preset Queries */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 whitespace-nowrap">Sample Queries:</span>
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  selectedPreset === p.id
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* SQL Textarea */}
        <div className="p-4 bg-slate-900 font-mono text-xs text-slate-100">
          <textarea
            rows={4}
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="w-full bg-transparent resize-none text-emerald-400 focus:outline-none"
            placeholder="SELECT * FROM transactions LIMIT 10;"
          />
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Supports standard SQL SELECT and PRAGMA statements.</span>
            <button
              onClick={() => runQuery()}
              disabled={isExecuting}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isExecuting ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        {/* Query Results / Errors */}
        <div className="p-4">
          {queryError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{queryError}</span>
            </div>
          )}

          {queryResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Returned {queryResult.rowCount} rows</span>
              </div>

              {queryResult.rows.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Query completed successfully. Zero rows returned.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-600 uppercase">
                      <tr>
                        {Object.keys(queryResult.rows[0]).map((col) => (
                          <th key={col} className="py-2 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          {Object.values(row).map((val: any, colIdx) => (
                            <td key={colIdx} className="py-2 px-3 whitespace-nowrap text-slate-800">
                              {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

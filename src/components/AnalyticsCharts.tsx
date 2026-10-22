import {useState} from 'react';
import { FinancialSummary } from '../types.ts';
import { formatCurrency } from '../utils/finance.ts';

interface AnalyticsChartsProps {
  summary: FinancialSummary;
  onFilterByCategory?: (catId: number) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ summary, onFilterByCategory }) => {
  const [activeChart, setActiveChart] = useState<'categories' | 'monthly' | 'daily'>('categories');
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  const { category_breakdown, monthly_trend, daily_trend, total_expenses } = summary;

  // Compute SVG Donut angles
  let accumulatedAngle = 0;
  const donutSlices = category_breakdown.map((cat) => {
    const fraction = total_expenses > 0 ? cat.total_amount / total_expenses : 0;
    const angle = fraction * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      ...cat,
      fraction,
      startAngle,
      endAngle: accumulatedAngle,
    };
  });

  // Helper to describe SVG arc
  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
    // Clamp to prevent full 360 glitch in SVG path
    const effectiveEnd = Math.min(endAngle, startAngle + 359.999);
    const start = polarToCartesian(x, y, outerRadius, effectiveEnd);
    const end = polarToCartesian(x, y, outerRadius, startAngle);
    const innerStart = polarToCartesian(x, y, innerRadius, startAngle);
    const innerEnd = polarToCartesian(x, y, innerRadius, effectiveEnd);
    const largeArcFlag = effectiveEnd - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      'L', innerStart.x, innerStart.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerEnd.x, innerEnd.y,
      'Z',
    ].join(' ');
  }

  // Max value for monthly chart scaling
  const maxMonthly = Math.max(
    ...monthly_trend.map((m) => Math.max(m.income, m.expense)),
    1000
  );

  // Max value for daily chart scaling
  const maxDaily = Math.max(
    ...daily_trend.map((d) => Math.max(d.income, d.expense)),
    200
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      {/* Chart Header & Segmented Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Graphical Spending Summaries
          </h3>
          <p className="text-xs text-slate-500">
            Visual analytics across categories, monthly cash flow, and daily spending velocity.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveChart('categories')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeChart === 'categories'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-slate-500" />
            <span>Category Share</span>
          </button>
          <button
            onClick={() => setActiveChart('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeChart === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Monthly Flow</span>
          </button>
          <button
            onClick={() => setActiveChart('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeChart === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Daily Rhythm</span>
          </button>
        </div>
      </div>

      {/* 1. Category Share Chart View */}
      {activeChart === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut graphic */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[240px]">
            {category_breakdown.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No expense transactions logged for this period.
              </div>
            ) : (
              <div className="relative w-56 h-56">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {donutSlices.map((slice) => {
                    const isHovered = hoveredCategory === slice.category_id;
                    const pathD = describeArc(
                      100,
                      100,
                      isHovered ? 52 : 55,
                      isHovered ? 88 : 84,
                      slice.startAngle,
                      slice.endAngle
                    );
                    return (
                      <path
                        key={slice.category_id}
                        d={pathD}
                        fill={slice.category_color}
                        className="transition-all duration-150 cursor-pointer opacity-90 hover:opacity-100"
                        onMouseEnter={() => setHoveredCategory(slice.category_id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Total Spent
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {formatCurrency(total_expenses)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {category_breakdown.length} Categories
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category List Breakdown */}
          <div className="lg:col-span-7 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {category_breakdown.map((cat) => {
                const isHovered = hoveredCategory === cat.category_id;
                return (
                  <button
                    key={cat.category_id}
                    onClick={() => onFilterByCategory && onFilterByCategory(cat.category_id)}
                    onMouseEnter={() => setHoveredCategory(cat.category_id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isHovered
                        ? 'border-slate-900 bg-slate-50 shadow-xs'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.category_color }}
                      />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {cat.category_name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(cat.total_amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                        {cat.percentage}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400 pt-2 flex items-center gap-1">
              <span>Tip: Click any category to view and filter its individual transactions in the ledger.</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Monthly Trend Chart View */}
      {activeChart === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-medium">Income (Green) vs. Expenses (Rose) over recent months</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Expense
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4">
            {monthly_trend.map((m) => {
              const incomeHeight = Math.round((m.income / maxMonthly) * 140);
              const expenseHeight = Math.round((m.expense / maxMonthly) * 140);

              return (
                <div key={m.month} className="flex flex-col items-center bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="h-36 w-full flex items-end justify-center gap-1.5 pb-2">
                    {/* Income bar */}
                    <div
                      className="w-5 bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-600 relative group cursor-pointer"
                      style={{ height: `${Math.max(6, incomeHeight)}px` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-mono">
                        +{formatCurrency(m.income)}
                      </div>
                    </div>

                    {/* Expense bar */}
                    <div
                      className="w-5 bg-rose-500 rounded-t-sm transition-all hover:bg-rose-600 relative group cursor-pointer"
                      style={{ height: `${Math.max(6, expenseHeight)}px` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-mono">
                        -{formatCurrency(m.expense)}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-800">{m.month_label}</span>
                  <span className={`text-[10px] font-mono tabular-nums font-semibold mt-0.5 ${
                    m.balance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {m.balance >= 0 ? `+${formatCurrency(m.balance)}` : formatCurrency(m.balance)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Daily Rhythm Timeline */}
      {activeChart === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-medium">Daily Outflow and Inflow Velocity across current calendar month</span>
            <span className="font-mono text-slate-400">{daily_trend.length} active transaction days</span>
          </div>

          {daily_trend.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No recorded transactions for days in this month yet.
            </div>
          ) : (
            <div className="h-44 flex items-end gap-1.5 overflow-x-auto pt-6 pb-2 px-1">
              {daily_trend.map((d) => {
                const expHeight = Math.round((d.expense / maxDaily) * 110);
                const incHeight = Math.round((d.income / maxDaily) * 110);

                return (
                  <div key={d.date} className="flex-1 min-w-[28px] flex flex-col items-center group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-mono shadow-md">
                      {d.date}: -{formatCurrency(d.expense)} {d.income > 0 ? `(+${formatCurrency(d.income)})` : ''}
                    </div>

                    <div className="h-28 flex items-end gap-0.5 w-full justify-center">
                      {d.income > 0 && (
                        <div
                          className="w-2.5 bg-emerald-400 rounded-t-xs"
                          style={{ height: `${Math.max(4, incHeight)}px` }}
                        />
                      )}
                      <div
                        className="w-2.5 bg-rose-500 rounded-t-xs group-hover:bg-rose-600 transition-colors"
                        style={{ height: `${Math.max(4, expHeight)}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 group-hover:text-slate-900">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

export type ChartPoint = {
  label: string;
  billed: number;
  collected: number;
};

export type ChartPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type ChartDataset = {
  daily: ChartPoint[];
  weekly: ChartPoint[];
  monthly: ChartPoint[];
  yearly: ChartPoint[];
};

type Props = {
  chartData?: ChartDataset;
  data?: ChartPoint[];
};

const PERIOD_LABELS: Array<{ key: ChartPeriod; label: string; hint: string }> = [
  { key: "daily", label: "Daily", hint: "Past 14 days" },
  { key: "weekly", label: "Weekly", hint: "Past 8 weeks" },
  { key: "monthly", label: "Monthly", hint: "Past 12 months" },
  { key: "yearly", label: "Yearly", hint: "Past 4 financial years" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-100 text-xs min-w-[140px]">
      <p className="font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const isCollected = entry.dataKey === "collected";
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isCollected ? "#4318ff" : "#94a3b8" }}
                />
                {entry.name}
              </span>
              <span className="font-bold text-slate-900 tabular-nums">
                ₹{Number(entry.value || 0).toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RevenueChart({ chartData, data }: Props) {
  const [period, setPeriod] = useState<ChartPeriod>("monthly");

  const currentData: ChartPoint[] = useMemo(() => {
    if (chartData && chartData[period] && chartData[period].length > 0) {
      return chartData[period];
    }
    return data || [];
  }, [chartData, data, period]);

  const activePeriodMeta = PERIOD_LABELS.find((p) => p.key === period) || PERIOD_LABELS[2];

  const totalPeriodBilled = useMemo(
    () => currentData.reduce((acc, item) => acc + (item.billed || 0), 0),
    [currentData]
  );

  const totalPeriodCollected = useMemo(
    () => currentData.reduce((acc, item) => acc + (item.collected || 0), 0),
    [currentData]
  );

  function formatK(n: number) {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
    return `₹${Math.round(n)}`;
  }

  return (
    <div className="w-full">
      {/* Header with Title and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">Revenue Overview</h3>
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
              ({activePeriodMeta.hint})
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 sm:hidden mt-0.5">
            {activePeriodMeta.hint}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/70 self-start sm:self-auto">
          {PERIOD_LABELS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPeriod(item.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === item.key
                  ? "bg-white text-[#4318ff] shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[250px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4318ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4318ff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              dy={10}
              minTickGap={8}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={formatK}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="billed" 
              stroke="#94a3b8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBilled)" 
              name="Billed"
            />
            <Area 
              type="monotone" 
              dataKey="collected" 
              stroke="#4318ff" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorCollected)" 
              name="Collected"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />
            Billed:
            <span className="text-slate-900 ml-0.5">
              ₹{totalPeriodBilled.toLocaleString("en-IN")}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#4318ff]" />
            Collected:
            <span className="text-[#4318ff] ml-0.5">
              ₹{totalPeriodCollected.toLocaleString("en-IN")}
            </span>
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          Viewing {activePeriodMeta.label.toLowerCase()} breakdown
        </span>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ExternalLinkIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  ActivityIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts';
import { mockContractHealth } from '../mockData';

export function ContractHealth() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('last24h');

  const totalMissingRate =
    mockContractHealth.reduce((sum, e) => sum + e.missingnessRate, 0) /
    mockContractHealth.length;

  // Build trend data for the area chart
  const trendLabels = ['6h ago', '5h', '4h', '3h', '2h', '1h', 'Now'];
  const aggregateTrend = trendLabels.map((label, i) => ({
    time: label,
    rate: parseFloat(
      (
        mockContractHealth.reduce((sum, e) => sum + (e.trend[i] || 0), 0) /
        mockContractHealth.length
      ).toFixed(2)
    ),
  }));

  // Bar chart data
  const barData = mockContractHealth.map((e) => ({
    name: e.systemName.length > 18 ? e.systemName.slice(0, 18) + '...' : e.systemName,
    fullName: e.systemName,
    rate: e.missingnessRate,
    ids: e.missingCorrelationIds,
    downstream: e.missingDownstreamEvents,
  }));

  const COLORS = ['#ef4444', '#f59e0b', '#f97316', '#eab308', '#84cc16', '#22c55e'];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Contract Health
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Data coverage and missingness across systems
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="last1h">Last 1 hour</option>
            <option value="last6h">Last 6 hours</option>
            <option value="last24h">Last 24 hours</option>
            <option value="last7d">Last 7 days</option>
          </select>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <BellIcon className="w-3.5 h-3.5" />
            Create Alert
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Overall Missing Rate
            </span>
            <ActivityIcon className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {totalMissingRate.toFixed(1)}%
          </p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDownIcon className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] text-emerald-600">
              -0.3% vs yesterday
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Missing Correlation IDs
            </span>
            <AlertTriangleIcon className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {mockContractHealth.reduce(
              (sum, e) => sum + e.missingCorrelationIds,
              0
            )}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUpIcon className="w-3 h-3 text-red-500" />
            <span className="text-[11px] text-red-600">+12 vs yesterday</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Missing Downstream Events
            </span>
            <AlertTriangleIcon className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {mockContractHealth.reduce(
              (sum, e) => sum + e.missingDownstreamEvents,
              0
            )}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDownIcon className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] text-emerald-600">
              -5 vs yesterday
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Systems Monitored
            </span>
            <ActivityIcon className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {mockContractHealth.length}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] text-slate-400">All healthy</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="px-6 pb-4 grid grid-cols-2 gap-4">
        {/* Trend chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Missing Rate Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={aggregateTrend}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
                formatter={(value: number) => [`${value}%`, 'Missing Rate']}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorRate)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Missingness by System
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                width={130}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
                formatter={(value: number) => [`${value}%`, 'Missing Rate']}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {barData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranked offenders table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">
              Ranked Offenders (by missingness)
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Rank
                </th>
                <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  System / Intent
                </th>
                <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Missing Rate
                </th>
                <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Missing IDs
                </th>
                <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Missing Downstream
                </th>
                <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Trend (7-point)
                </th>
                <th className="text-left text-[11px] font-medium text-slate-400 uppercase tracking-wider px-4 py-2.5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockContractHealth.map((entry, index) => (
                <tr
                  key={entry.systemName}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-slate-500">
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-700">
                      {entry.systemName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            entry.missingnessRate > 3
                              ? 'bg-red-400'
                              : entry.missingnessRate > 1.5
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{
                            width: `${Math.min(
                              entry.missingnessRate * 20,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          entry.missingnessRate > 3
                            ? 'text-red-600'
                            : entry.missingnessRate > 1.5
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {entry.missingnessRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">
                      {entry.missingCorrelationIds}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">
                      {entry.missingDownstreamEvents}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {/* Sparkline */}
                    <div className="flex items-end gap-0.5 h-4">
                      {entry.trend.map((val, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-t ${
                            val > 3
                              ? 'bg-red-300'
                              : val > 1.5
                              ? 'bg-amber-300'
                              : 'bg-emerald-300'
                          }`}
                          style={{
                            height: `${Math.max(val * 4, 2)}px`,
                          }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate('/explore')}
                      className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                    >
                      <ExternalLinkIcon className="w-3 h-3" />
                      View journeys
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

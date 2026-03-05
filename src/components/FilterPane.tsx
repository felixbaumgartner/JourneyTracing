import { useState } from 'react';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { Filters } from '../types';

interface FilterPaneProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function getQuickRange(label: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  const offsets: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const from = new Date(now.getTime() - (offsets[label] || 0))
    .toISOString()
    .slice(0, 16);
  return { from, to };
}

const quickRanges = ['1h', '6h', '24h', '7d', '30d'] as const;

export function FilterPane({ filters, onChange }: FilterPaneProps) {
  const [activeQuickRange, setActiveQuickRange] = useState<string>('24h');

  const handleQuickRange = (label: string) => {
    const range = getQuickRange(label);
    setActiveQuickRange(label);
    onChange({ ...filters, fromDate: range.from, toDate: range.to });
  };

  return (
    <div className="w-64 border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">Filters</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Time Range */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Time Range
          </label>

          {/* Quick range buttons */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {quickRanges.map((label) => (
              <button
                key={label}
                onClick={() => handleQuickRange(label)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                  activeQuickRange === label
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* From date + time */}
          <div className="mt-3 space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                From
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <div className="flex-1 relative">
                  <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={filters.fromDate?.slice(0, 10) || ''}
                    onChange={(e) => {
                      const time = filters.fromDate?.slice(11) || '00:00';
                      setActiveQuickRange('');
                      onChange({
                        ...filters,
                        fromDate: `${e.target.value}T${time}`,
                      });
                    }}
                    className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                  />
                </div>
                <div className="w-[80px] relative">
                  <ClockIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    value={filters.fromDate?.slice(11, 16) || '00:00'}
                    onChange={(e) => {
                      const date = filters.fromDate?.slice(0, 10) || '';
                      setActiveQuickRange('');
                      onChange({
                        ...filters,
                        fromDate: `${date}T${e.target.value}`,
                      });
                    }}
                    className="w-full pl-7 pr-1 py-1.5 text-[11px] bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                To
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <div className="flex-1 relative">
                  <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={filters.toDate?.slice(0, 10) || ''}
                    onChange={(e) => {
                      const time = filters.toDate?.slice(11) || '23:59';
                      setActiveQuickRange('');
                      onChange({
                        ...filters,
                        toDate: `${e.target.value}T${time}`,
                      });
                    }}
                    className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                  />
                </div>
                <div className="w-[80px] relative">
                  <ClockIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    value={filters.toDate?.slice(11, 16) || '23:59'}
                    onChange={(e) => {
                      const date = filters.toDate?.slice(0, 10) || '';
                      setActiveQuickRange('');
                      onChange({
                        ...filters,
                        toDate: `${date}T${e.target.value}`,
                      });
                    }}
                    className="w-full pl-7 pr-1 py-1.5 text-[11px] bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

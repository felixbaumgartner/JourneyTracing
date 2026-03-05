import { useState } from 'react';
import {
  XCircleIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { Journey } from '../types';

interface ErrorCodeEntry {
  errorCode: string;
  errorMessage: string;
  count: number;
  journeyIds: string[];
}

interface SystemErrorGroup {
  system: string;
  totalErrors: number;
  journeyIds: string[];
  errorCodes: ErrorCodeEntry[];
}

interface ErrorSummaryBarProps {
  journeys: Journey[];
  activeSystem: string | null;
  onSelectSystem: (system: string | null) => void;
  activeErrorCode: string | null;
  onSelectErrorCode: (errorCode: string | null) => void;
}

const SYSTEM_COLORS: Record<string, string> = {
  'Campaign Matching (Janeway)': '#6366f1',
  'Content Matching (Content Builder)': '#8b5cf6',
  'Message Delivery Layer (BMessage)': '#f59e0b',
  'Engagement Events (MM-Events)': '#22c55e',
};

const SYSTEM_SHORT_NAMES: Record<string, string> = {
  'Campaign Matching (Janeway)': 'Janeway',
  'Content Matching (Content Builder)': 'Content Builder',
  'Message Delivery Layer (BMessage)': 'BMessage',
  'Engagement Events (MM-Events)': 'MM-Events',
};

/** Engagement Events are observational — errors there never affect journey status */
const NON_ERROR_CONTRIBUTING_SYSTEMS = new Set([
  'Engagement Events (MM-Events)',
]);

function groupErrorsBySystem(journeys: Journey[]): SystemErrorGroup[] {
  const errorJourneys = journeys.filter((j) => j.status === 'error');
  const systemMap = new Map<string, SystemErrorGroup>();

  for (const journey of errorJourneys) {
    for (const event of journey.events) {
      if (event.status === 'error') {
        const system = event.sourceSystem;
        // Skip non-error-contributing systems (e.g. MM-Events)
        if (NON_ERROR_CONTRIBUTING_SYSTEMS.has(system)) continue;
        const errorCode = event.attributes.errorCode || 'UNKNOWN';
        const errorMessage = event.attributes.errorMessage || 'Unknown error';

        const existing = systemMap.get(system) || {
          system,
          totalErrors: 0,
          journeyIds: [],
          errorCodes: [],
        };

        existing.totalErrors++;

        if (!existing.journeyIds.includes(journey.correlationId)) {
          existing.journeyIds.push(journey.correlationId);
        }

        // Find or create the error code entry
        let codeEntry = existing.errorCodes.find(
          (c) => c.errorCode === errorCode
        );
        if (!codeEntry) {
          codeEntry = {
            errorCode,
            errorMessage,
            count: 0,
            journeyIds: [],
          };
          existing.errorCodes.push(codeEntry);
        }
        codeEntry.count++;
        if (!codeEntry.journeyIds.includes(journey.correlationId)) {
          codeEntry.journeyIds.push(journey.correlationId);
        }

        systemMap.set(system, existing);
      }
    }
  }

  // Sort systems by total errors descending; sort error codes within each system by count descending
  const groups = Array.from(systemMap.values()).sort(
    (a, b) => b.totalErrors - a.totalErrors
  );
  for (const group of groups) {
    group.errorCodes.sort((a, b) => b.count - a.count);
  }
  return groups;
}

export function ErrorSummaryBar({
  journeys,
  activeSystem,
  onSelectSystem,
  activeErrorCode,
  onSelectErrorCode,
}: ErrorSummaryBarProps) {
  const groups = groupErrorsBySystem(journeys);
  const totalErrorJourneys = journeys.filter(
    (j) => j.status === 'error'
  ).length;
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  if (totalErrorJourneys === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-slate-50/80">
      {/* Header row */}
      <div className="px-4 py-2 flex items-center gap-2">
        <XCircleIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
        <span className="text-xs font-medium text-slate-600">
          {totalErrorJourneys} error journey
          {totalErrorJourneys !== 1 ? 's' : ''} across{' '}
          {groups.length} system{groups.length !== 1 ? 's' : ''}
        </span>
        {(activeSystem || activeErrorCode) && (
          <button
            onClick={() => {
              onSelectSystem(null);
              onSelectErrorCode(null);
            }}
            className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium ml-1"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* System cards */}
      <div className="px-4 pb-2.5 flex gap-2 flex-wrap">
        {groups.map((group) => {
          const color = SYSTEM_COLORS[group.system] || '#6366f1';
          const shortName =
            SYSTEM_SHORT_NAMES[group.system] || group.system;
          const isActive = activeSystem === group.system;
          const isExpanded = expandedSystem === group.system;

          return (
            <div key={group.system} className="flex flex-col">
              {/* System card */}
              <div
                className={`rounded-lg border transition-all ${
                  isActive
                    ? 'bg-white shadow-sm ring-2 ring-offset-1'
                    : 'bg-white hover:shadow-sm hover:border-slate-300'
                }`}
                style={
                  isActive
                    ? ({
                        borderColor: color,
                        '--tw-ring-color': color,
                      } as React.CSSProperties)
                    : { borderColor: '#e2e8f0' }
                }
              >
                {/* Top: system name + count + expand toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onSelectSystem(isActive ? null : group.system)
                    }
                    className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 text-xs font-medium"
                    title={`Filter to journeys failing in ${group.system}`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-700">{shortName}</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold">
                      <XCircleIcon className="w-2.5 h-2.5" />
                      {group.totalErrors}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {group.journeyIds.length} journey
                      {group.journeyIds.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      setExpandedSystem(isExpanded ? null : group.system)
                    }
                    className="p-1 mr-1 rounded hover:bg-slate-100 transition-colors"
                    title={
                      isExpanded ? 'Hide error details' : 'Show error details'
                    }
                  >
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Expanded: error code breakdown (top 3) */}
                {isExpanded && (() => {
                  const top3 = group.errorCodes.slice(0, 3);
                  const remaining = group.errorCodes.slice(3);
                  const remainingCount = remaining.reduce((sum, e) => sum + e.count, 0);

                  return (
                    <div className="border-t border-slate-100 px-3 py-2 space-y-1">
                      {top3.map((entry) => {
                        const isCodeActive = activeErrorCode === entry.errorCode;
                        return (
                          <button
                            key={entry.errorCode}
                            onClick={() => {
                              // Also activate the system filter if not already
                              if (!isActive) onSelectSystem(group.system);
                              onSelectErrorCode(isCodeActive ? null : entry.errorCode);
                            }}
                            className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors ${
                              isCodeActive
                                ? 'bg-red-50 ring-1 ring-red-200'
                                : 'hover:bg-slate-50'
                            }`}
                            title={`Filter to journeys with ${entry.errorCode}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-mono font-semibold ${isCodeActive ? 'text-red-800' : 'text-red-700'}`}>
                                  {entry.errorCode}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  &times; {entry.count}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                {entry.errorMessage}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                              {entry.journeyIds.length} journey
                              {entry.journeyIds.length !== 1 ? 's' : ''}
                            </span>
                          </button>
                        );
                      })}
                      {remaining.length > 0 && (
                        <div className="pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400">
                            + {remaining.length} more error type{remaining.length !== 1 ? 's' : ''} ({remainingCount} occurrence{remainingCount !== 1 ? 's' : ''})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

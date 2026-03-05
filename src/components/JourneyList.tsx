import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
} from 'lucide-react';
import { Journey } from '../types';

interface JourneyListProps {
  journeys: Journey[];
  selectedId: string | null;
  onSelect: (journey: Journey) => void;
  /** When set, error journeys are grouped by their error code in this system */
  groupBySystem?: string | null;
}

function StatusBadge({ status }: { status: Journey['status'] }) {
  switch (status) {
    case 'complete':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2Icon className="w-3 h-3" />
          Complete
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
          <XCircleIcon className="w-3 h-3" />
          Error
        </span>
      );
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Extract the primary error code for a journey from a given system */
function getErrorCodeForSystem(
  journey: Journey,
  system: string
): { errorCode: string; errorMessage: string } | null {
  for (const event of journey.events) {
    if (
      event.sourceSystem === system &&
      event.status === 'error' &&
      event.attributes.errorCode
    ) {
      return {
        errorCode: event.attributes.errorCode,
        errorMessage: event.attributes.errorMessage || '',
      };
    }
  }
  return null;
}

interface ErrorCodeGroup {
  errorCode: string;
  errorMessage: string;
  journeys: Journey[];
}

function groupJourneysByErrorCode(
  journeys: Journey[],
  system: string
): { grouped: ErrorCodeGroup[]; ungrouped: Journey[] } {
  const codeMap = new Map<string, ErrorCodeGroup>();
  const ungrouped: Journey[] = [];

  for (const journey of journeys) {
    const errorInfo = getErrorCodeForSystem(journey, system);
    if (errorInfo) {
      const existing = codeMap.get(errorInfo.errorCode);
      if (existing) {
        existing.journeys.push(journey);
      } else {
        codeMap.set(errorInfo.errorCode, {
          errorCode: errorInfo.errorCode,
          errorMessage: errorInfo.errorMessage,
          journeys: [journey],
        });
      }
    } else {
      ungrouped.push(journey);
    }
  }

  // Sort groups by count descending
  const grouped = Array.from(codeMap.values()).sort(
    (a, b) => b.journeys.length - a.journeys.length
  );

  return { grouped, ungrouped };
}

function JourneyRow({
  journey,
  selectedId,
  onSelect,
}: {
  journey: Journey;
  selectedId: string | null;
  onSelect: (journey: Journey) => void;
}) {
  return (
    <button
      key={journey.correlationId}
      onClick={() => onSelect(journey)}
      className={`w-full text-left px-4 py-3 border-b transition-colors ${
        selectedId === journey.correlationId
          ? 'bg-indigo-50 border-l-2 border-l-indigo-500 border-b-indigo-100'
          : journey.status === 'error'
          ? 'bg-red-50/30 border-b-slate-100 hover:bg-red-50/60'
          : 'bg-white border-b-slate-100 hover:bg-slate-50'
      }`}
      aria-label={`Journey ${journey.correlationId}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-800 font-medium truncate">
              {journey.correlationId}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-500 truncate">
              {journey.userId}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <ClockIcon className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500">
              {formatTime(journey.startTime)}
            </span>
          </div>
        </div>
        <StatusBadge status={journey.status} />
      </div>
    </button>
  );
}

export function JourneyList({
  journeys,
  selectedId,
  onSelect,
  groupBySystem,
}: JourneyListProps) {
  const hasGrouping = groupBySystem && groupBySystem.length > 0;
  const { grouped, ungrouped } = hasGrouping
    ? groupJourneysByErrorCode(journeys, groupBySystem)
    : { grouped: [], ungrouped: journeys };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-[380px] border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Journeys</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {hasGrouping ? 'Grouped by error code' : 'Sorted: newest first'}{' '}
            &middot; {journeys.length} results
          </p>
        </div>
        {!hasGrouping && (
          <select className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-500">
            <option>Newest first</option>
            <option>Oldest first</option>
            <option>Duration (high)</option>
            <option>Missing count</option>
          </select>
        )}
      </div>

      {/* Journey rows — grouped or flat */}
      <div className="flex-1 overflow-y-auto">
        {hasGrouping ? (
          (() => {
            const top3 = grouped.slice(0, 3);
            const remaining = grouped.slice(3);
            const remainingJourneyCount = remaining.reduce(
              (sum, g) => sum + g.journeys.length,
              0
            );

            return (
              <>
                {top3.map((group) => (
                  <div key={group.errorCode}>
                    {/* Error code section header */}
                    <div className="sticky top-0 z-10 px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
                      <XCircleIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-red-700">
                            {group.errorCode}
                          </span>
                          <span className="text-[10px] text-red-500 font-medium">
                            {group.journeys.length} journey
                            {group.journeys.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-red-500/80 truncate mt-0.5">
                          {group.errorMessage}
                        </p>
                      </div>
                    </div>
                    {/* Journeys in this group */}
                    {group.journeys.map((journey) => (
                      <JourneyRow
                        key={journey.correlationId}
                        journey={journey}
                        selectedId={selectedId}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                ))}
                {/* Overflow: remaining error groups beyond top 3 */}
                {remaining.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                      <XCircleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[11px] font-medium text-amber-700">
                        + {remaining.length} more error type{remaining.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-amber-500">
                        {remainingJourneyCount} journey{remainingJourneyCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {remaining.flatMap((g) => g.journeys).map((journey) => (
                      <JourneyRow
                        key={journey.correlationId}
                        journey={journey}
                        selectedId={selectedId}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
                {/* Non-error journeys (complete ones) at the bottom */}
                {ungrouped.length > 0 && (
                  <div>
                    <div className="sticky top-0 z-10 px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                      <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-600">
                        No errors in this system
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ungrouped.length} journey
                        {ungrouped.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {ungrouped.map((journey) => (
                      <JourneyRow
                        key={journey.correlationId}
                        journey={journey}
                        selectedId={selectedId}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()
        ) : (
          journeys.map((journey) => (
            <JourneyRow
              key={journey.correlationId}
              journey={journey}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

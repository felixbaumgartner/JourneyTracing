import {
  AlertTriangleIcon,
  XCircleIcon,
  CheckCircle2Icon,
  MinusCircleIcon,
} from 'lucide-react';
import { Journey, JourneyEvent } from '../types';

interface WaterfallTimelineProps {
  journey: Journey;
  selectedEventId: string | null;
  onSelectEvent: (event: JourneyEvent) => void;
  searchQuery: string;
}

const SYSTEM_COLORS: Record<string, string> = {
  'Campaign Matching (Janeway)': '#6366f1',
  'Content Matching (Content Builder)': '#8b5cf6',
  'Message Delivery Layer (BMessage)': '#f59e0b',
  'Engagement Events (MM-Events)': '#22c55e',
};

export function WaterfallTimeline({
  journey,
}: WaterfallTimelineProps) {
  // Group events by source system
  const systemGroups = new Map<string, JourneyEvent[]>();
  for (const event of journey.events) {
    const existing = systemGroups.get(event.sourceSystem) || [];
    existing.push(event);
    systemGroups.set(event.sourceSystem, existing);
  }

  return (
    <div className="flex flex-col h-full">
      {/* System status grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {Array.from(systemGroups.entries()).map(([system, events]) => {
            const systemColor = SYSTEM_COLORS[system] || '#6366f1';
            const errorEvents = events.filter((e) => e.status === 'error');
            const missingEvents = events.filter((e) => e.status === 'missing');
            const skippedEvents = events.filter((e) => e.status === 'skipped');
            const hasError = errorEvents.length > 0;
            const hasMissing = missingEvents.length > 0;
            const isSkipped = skippedEvents.length === events.length;
            const isHealthy = !hasError && !hasMissing && !isSkipped;

            return (
              <div key={system}>
                {/* System row */}
                <div className="w-full text-left px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded shrink-0 ${isSkipped ? 'opacity-30' : ''}`}
                      style={{ backgroundColor: systemColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {system}
                        </span>
                      </div>

                      {/* Status message */}
                      <div className="mt-1">
                        {isSkipped && (
                          <div className="flex items-center gap-1.5">
                            <MinusCircleIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              Not reached &mdash; upstream failure in{' '}
                              {skippedEvents[0]?.attributes.blockedBy
                                ? `${skippedEvents[0].attributes.reason?.replace('Upstream failure in ', '')}`
                                : 'earlier system'}
                            </span>
                          </div>
                        )}

                        {isHealthy && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600">
                              Processing successful
                            </span>
                          </div>
                        )}

                        {hasError &&
                          errorEvents.map((evt) => (
                            <div
                              key={evt.id}
                              className="flex items-start gap-1.5 mt-0.5 first:mt-0"
                            >
                              <XCircleIcon className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-xs text-red-700 font-medium">
                                  Failed at {evt.eventName}
                                </span>
                                {(evt.attributes.errorCode ||
                                  evt.attributes.errorMessage) && (
                                  <p className="text-[11px] text-red-500 mt-0.5">
                                    {evt.attributes.errorCode &&
                                      `${evt.attributes.errorCode}: `}
                                    {evt.attributes.errorMessage}
                                  </p>
                                )}
                                {evt.attributes.retryCount && (
                                  <p className="text-[11px] text-red-400 mt-0.5">
                                    Retried {evt.attributes.retryCount} time
                                    {evt.attributes.retryCount !== '1'
                                      ? 's'
                                      : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}

                        {hasMissing &&
                          missingEvents.map((evt) => (
                            <div
                              key={evt.id}
                              className="flex items-start gap-1.5 mt-0.5 first:mt-0"
                            >
                              <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <span className="text-xs text-amber-700 font-medium">
                                  Missing: {evt.eventName}
                                </span>
                                <p className="text-[11px] text-amber-500 mt-0.5">
                                  {evt.attributes.reason ||
                                    'Expected event was not received'}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Status indicator on the right */}
                    <div className="shrink-0">
                      {isSkipped && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Skipped
                        </span>
                      )}
                      {isHealthy && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          OK
                        </span>
                      )}
                      {hasError && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                          Error
                        </span>
                      )}
                      {hasMissing && !hasError && !isSkipped && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Missing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

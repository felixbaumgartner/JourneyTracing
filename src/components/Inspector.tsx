import { useState } from 'react';
import {
  ChevronDownIcon,
  CopyIcon,
  TicketIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  LinkIcon,
} from 'lucide-react';
import { JourneyEvent } from '../types';

interface InspectorProps {
  event: JourneyEvent | null;
}

function DisclosureSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-medium text-slate-600">{title}</span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export function Inspector({ event }: InspectorProps) {
  if (!event) {
    return (
      <div className="w-80 border-l border-slate-200 bg-white flex items-center justify-center shrink-0">
        <div className="text-center px-6">
          <p className="text-sm text-slate-400">Select an event</p>
          <p className="text-xs text-slate-300 mt-1">
            Click any event in the timeline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Inspector</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Event identity */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            {event.status === 'ok' && (
              <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
            )}
            {event.status === 'missing' && (
              <AlertTriangleIcon className="w-4 h-4 text-amber-500" />
            )}
            {event.status === 'error' && (
              <XCircleIcon className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-medium text-slate-800">
              {event.eventName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Type
              </span>
              <p className="text-xs text-slate-600 mt-0.5 capitalize">
                {event.eventType}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Source
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {event.sourceSystem}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Timestamp
              </span>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                {new Date(event.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Duration
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {event.durationMs}ms
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Severity
              </span>
              <p
                className={`text-xs mt-0.5 capitalize ${
                  event.severity === 'error'
                    ? 'text-red-600'
                    : event.severity === 'warn'
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
              >
                {event.severity}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Status
              </span>
              <p
                className={`text-xs mt-0.5 capitalize ${
                  event.status === 'error'
                    ? 'text-red-600'
                    : event.status === 'missing'
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
              >
                {event.status}
              </p>
            </div>
          </div>
        </div>

        {/* Attributes */}
        <DisclosureSection title="Attributes" defaultOpen>
          <div className="space-y-1.5">
            {Object.entries(event.attributes).map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-2 py-1 border-b border-slate-50 last:border-0"
              >
                <span className="text-[11px] text-slate-500 font-mono">
                  {key}
                </span>
                <span className="text-[11px] text-slate-700 font-mono text-right break-all">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </DisclosureSection>

        {/* Contract checks */}
        <DisclosureSection
          title="Contract Checks"
          defaultOpen={event.status !== 'ok'}
        >
          {event.status === 'missing' ? (
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-700">
                    Missing Expected Event
                  </p>
                  <p className="text-[11px] text-amber-600 mt-1">
                    This event was expected based on the journey contract but was
                    not received from {event.sourceSystem}.
                  </p>
                  <p className="text-[11px] text-amber-600 mt-1">
                    Suggested checks:
                  </p>
                  <ul className="text-[11px] text-amber-600 mt-0.5 list-disc list-inside">
                    <li>Verify {event.sourceSystem} is emitting events</li>
                    <li>Check correlation ID propagation</li>
                    <li>Review Kafka topic connectivity</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : event.status === 'error' ? (
            <div className="p-2.5 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <XCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-700">
                    Error Detected
                  </p>
                  <p className="text-[11px] text-red-600 mt-1">
                    {event.attributes.errorMessage ||
                      'An error occurred during this step.'}
                  </p>
                  {event.attributes.retryCount && (
                    <p className="text-[11px] text-red-600 mt-1">
                      Retried {event.attributes.retryCount} times
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />
                <p className="text-xs text-emerald-700">
                  Event matches expected contract
                </p>
              </div>
            </div>
          )}
        </DisclosureSection>

        {/* Related events */}
        <DisclosureSection title="Related Events">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <LinkIcon className="w-3 h-3" />
              <span>Previous: journey.initiated</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <LinkIcon className="w-3 h-3" />
              <span>Next: audience.resolved</span>
            </div>
          </div>
        </DisclosureSection>

        {/* Raw payload */}
        <DisclosureSection title="Raw Payload (JSON)">
          <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto max-h-40">
            {JSON.stringify(
              {
                id: event.id,
                name: event.eventName,
                type: event.eventType,
                source: event.sourceSystem,
                ts: event.timestamp,
                duration_ms: event.durationMs,
                severity: event.severity,
                status: event.status,
                attributes: event.attributes,
              },
              null,
              2
            )}
          </pre>
        </DisclosureSection>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <CopyIcon className="w-3 h-3" />
          Copy Evidence
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <TicketIcon className="w-3 h-3" />
          Create Ticket
        </button>
      </div>
    </div>
  );
}

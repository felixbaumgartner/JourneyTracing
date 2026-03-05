import { useNavigate } from 'react-router-dom';
import {
  ExternalLinkIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from 'lucide-react';
import { Journey } from '../types';

interface JourneyPreviewProps {
  journey: Journey | null;
}

export function JourneyPreview({ journey }: JourneyPreviewProps) {
  const navigate = useNavigate();

  if (!journey) {
    return (
      <div className="w-80 border-l border-slate-200 bg-white flex items-center justify-center shrink-0">
        <div className="text-center px-6">
          <p className="text-sm text-slate-400">Select a journey to preview</p>
          <p className="text-xs text-slate-300 mt-1">
            Click any row in the results list
          </p>
        </div>
      </div>
    );
  }

  const missingEvents = journey.events.filter((e) => e.status === 'missing');
  const errorEvents = journey.events.filter((e) => e.status === 'error');

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">Preview</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Identity */}
        <div className="space-y-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Correlation ID
            </span>
            <p className="text-xs font-mono text-slate-700 mt-0.5">
              {journey.correlationId}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                User
              </span>
              <p className="text-xs font-mono text-slate-700 mt-0.5">
                {journey.userId}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Campaign
              </span>
              <p className="text-xs text-slate-700 mt-0.5">
                {journey.intentType.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div
          className={`p-3 rounded-lg border ${
            journey.status === 'complete'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {journey.status === 'complete' && (
              <CheckCircle2Icon className="w-4 h-4 text-emerald-600" />
            )}
            {journey.status === 'error' && (
              <XCircleIcon className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-xs font-medium capitalize ${
                journey.status === 'complete'
                  ? 'text-emerald-700'
                  : 'text-red-700'
              }`}
            >
              {journey.status === 'complete' ? 'Complete' : 'Error'}
            </span>
          </div>
        </div>

        {/* Missing items */}
        {missingEvents.length > 0 && (
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Missing Events
            </span>
            <div className="mt-1 space-y-1">
              {missingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 rounded border border-amber-100"
                >
                  <AlertTriangleIcon className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-[11px] text-amber-700 truncate">
                    {evt.eventName}
                  </span>
                  <span className="text-[10px] text-amber-500 ml-auto shrink-0">
                    {evt.sourceSystem}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error items */}
        {errorEvents.length > 0 && (
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Errors
            </span>
            <div className="mt-1 space-y-1">
              {errorEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-red-50 rounded border border-red-100"
                >
                  <XCircleIcon className="w-3 h-3 text-red-500 shrink-0" />
                  <span className="text-[11px] text-red-700 truncate">
                    {evt.eventName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-100">
        <button
          onClick={() => navigate(`/journey/${journey.correlationId}`)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <ExternalLinkIcon className="w-3.5 h-3.5" />
          Open Detail
        </button>
      </div>
    </div>
  );
}

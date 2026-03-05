import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from 'lucide-react';
import { WaterfallTimeline } from '../components/WaterfallTimeline';
import { mockJourneys } from '../mockData';

export function JourneyDetail() {
  const { correlationId } = useParams<{ correlationId: string }>();
  const navigate = useNavigate();

  const journey = mockJourneys.find((j) => j.correlationId === correlationId);

  if (!journey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-slate-500">Journey not found</p>
          <button
            onClick={() => navigate('/explore')}
            className="mt-3 text-sm text-indigo-500 hover:text-indigo-600"
          >
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  const missingCount = journey.events.filter(
    (e) => e.status === 'missing'
  ).length;
  const errorCount = journey.events.filter(
    (e) => e.status === 'error'
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/explore')}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Explorer"
          >
            <ArrowLeftIcon className="w-4 h-4 text-slate-500" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-semibold text-slate-800">
                {journey.correlationId}
              </span>

              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  journey.status === 'complete'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {journey.status === 'complete' && (
                  <CheckCircle2Icon className="w-3.5 h-3.5" />
                )}
                {journey.status === 'error' && (
                  <XCircleIcon className="w-3.5 h-3.5" />
                )}
                {journey.status === 'complete'
                  ? 'Complete'
                  : `Error (${errorCount} failures)`}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>
                {new Date(journey.startTime).toLocaleString()} &ndash;{' '}
                {new Date(journey.endTime).toLocaleTimeString()}
              </span>
              <span>&middot;</span>
              <span>{journey.intentType.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2" />
        </div>
      </div>

      {/* Main content: timeline */}
      <div className="flex-1 overflow-hidden bg-white">
        <WaterfallTimeline
          journey={journey}
          selectedEventId={null}
          onSelectEvent={() => {}}
          searchQuery=""
        />
      </div>
    </div>
  );
}

import {
  BookOpenIcon,
  KeyboardIcon,
  PlayCircleIcon,
  MessageCircleQuestionIcon,
  ArrowRightIcon,
} from 'lucide-react';

export function HelpPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-800">
          Help & Onboarding
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Learn the journey model, keyboard shortcuts, and common workflows
        </p>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Journey Model Explainer */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpenIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Understanding the Journey Model
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-xs font-semibold text-blue-700 mb-2">
                Identity (WHO)
              </h3>
              <p className="text-[11px] text-blue-600 leading-relaxed">
                A <strong>User ID</strong> identifies who is experiencing the
                journey. One user can have many journeys.
              </p>
              <div className="mt-3 p-2 bg-white/80 rounded border border-blue-200">
                <code className="text-[10px] text-blue-800 font-mono">
                  user_id: "user-10042"
                </code>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="text-xs font-semibold text-purple-700 mb-2">
                Correlation (WHICH)
              </h3>
              <p className="text-[11px] text-purple-600 leading-relaxed">
                A <strong>Correlation ID</strong> groups all events belonging to
                a single execution/journey, like a trace ID in distributed
                tracing.
              </p>
              <div className="mt-3 p-2 bg-white/80 rounded border border-purple-200">
                <code className="text-[10px] text-purple-800 font-mono">
                  correlation_id: "corr-a1b2c3d4"
                </code>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <h3 className="text-xs font-semibold text-emerald-700 mb-2">
                Observations (WHAT)
              </h3>
              <p className="text-[11px] text-emerald-600 leading-relaxed">
                <strong>Events</strong> are the individual steps/spans: each has
                a timestamp, source system, type, and attributes.
              </p>
              <div className="mt-3 p-2 bg-white/80 rounded border border-emerald-200">
                <code className="text-[10px] text-emerald-800 font-mono">
                  event: "message.dispatched"
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Getting started workflows */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlayCircleIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Getting Started
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="text-left p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors group">
              <h3 className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700">
                Find a journey by Correlation ID
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Paste a correlation ID into the search bar and hit Run to jump
                directly to the journey detail view.
              </p>
              <div className="flex items-center gap-1 mt-3 text-[11px] text-indigo-500 font-medium">
                Try it
                <ArrowRightIcon className="w-3 h-3" />
              </div>
            </button>
            <button className="text-left p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors group">
              <h3 className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700">
                Find journeys by user / intent / date
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Use the filter pane in Basic mode to select an intent type, date
                range, and status to narrow down results.
              </p>
              <div className="flex items-center gap-1 mt-3 text-[11px] text-indigo-500 font-medium">
                Try it
                <ArrowRightIcon className="w-3 h-3" />
              </div>
            </button>
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyboardIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Keyboard Shortcuts
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-2">
            {[
              { keys: 'Ctrl + K', action: 'Open Command Palette' },
              { keys: '/', action: 'Focus search bar' },
              { keys: 'G then E', action: 'Go to Explore' },
              { keys: 'G then C', action: 'Go to Contract Health' },
              { keys: 'G then S', action: 'Go to Saved Views' },
              { keys: 'Esc', action: 'Close panel / clear selection' },
              { keys: 'J / K', action: 'Navigate up/down in list' },
              { keys: 'Enter', action: 'Open selected journey' },
              { keys: '+ / -', action: 'Zoom in/out timeline' },
              { keys: 'F', action: 'Fit timeline to window' },
              { keys: 'E', action: 'Toggle errors highlight' },
              { keys: 'M', action: 'Toggle missing highlight' },
            ].map(({ keys, action }) => (
              <div key={keys} className="flex items-center justify-between py-1.5">
                <span className="text-[11px] text-slate-600">{action}</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded border border-slate-200">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* Glossary */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircleQuestionIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Glossary</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                term: 'Correlation ID',
                def: 'A unique identifier that groups all events in a single journey execution, similar to a Trace ID in distributed tracing.',
              },
              {
                term: 'Intent',
                def: 'The purpose or type of the journey (e.g., booking_confirmation, price_drop_alert). Scopes what events are expected.',
              },
              {
                term: 'Contract',
                def: 'The expected set of events and their relationships for a given intent type. Used to detect missing or extra events.',
              },
              {
                term: 'Missingness',
                def: 'When expected events in the journey contract are not found. Shown as amber/yellow warnings in the UI.',
              },
              {
                term: 'Source System',
                def: 'The service or platform that emits an event (e.g., Janeway, MsgScheduler, CM-Content).',
              },
            ].map(({ term, def }) => (
              <div key={term} className="flex gap-3">
                <dt className="text-xs font-semibold text-slate-700 w-32 shrink-0">
                  {term}
                </dt>
                <dd className="text-[11px] text-slate-500 leading-relaxed">
                  {def}
                </dd>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

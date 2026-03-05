import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkIcon,
  PinIcon,
  TrashIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  ClockIcon,
} from 'lucide-react';
import { mockSavedViews } from '../mockData';

export function SavedViews() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [views, setViews] = useState(mockSavedViews);

  const filteredViews = views.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.query.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedViews = filteredViews.filter((v) => v.pinned);
  const unpinnedViews = filteredViews.filter((v) => !v.pinned);

  const togglePin = (id: string) => {
    setViews((prev) =>
      prev.map((v) => (v.id === id ? { ...v, pinned: !v.pinned } : v))
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Saved Views</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Saved queries, pinned journeys, and investigation workspaces
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors">
          <PlusIcon className="w-3.5 h-3.5" />
          New Saved View
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg max-w-md">
          <SearchIcon className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search saved views..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 px-6 py-4 space-y-6">
        {/* Pinned section */}
        {pinnedViews.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PinIcon className="w-3 h-3" />
              Pinned ({pinnedViews.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {pinnedViews.map((view) => (
                <div
                  key={view.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-700 truncate">
                        {view.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                        {view.query}
                      </p>
                    </div>
                    <button
                      onClick={() => togglePin(view.id)}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                      title="Unpin"
                    >
                      <PinIcon className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {view.createdBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {new Date(view.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/explore')}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                    >
                      <PlayIcon className="w-3 h-3" />
                      Run
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All views */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookmarkIcon className="w-3 h-3" />
            All Views ({unpinnedViews.length})
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {unpinnedViews.map((view, idx) => (
              <div
                key={view.id}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors ${
                  idx < unpinnedViews.length - 1
                    ? 'border-b border-slate-100'
                    : ''
                }`}
              >
                <BookmarkIcon className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-slate-700 truncate">
                    {view.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    {view.query}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
                  <span>{view.createdBy}</span>
                  <span>{new Date(view.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePin(view.id)}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                    title="Pin"
                  >
                    <PinIcon className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => navigate('/explore')}
                    className="p-1.5 hover:bg-indigo-50 rounded transition-colors"
                    title="Run query"
                  >
                    <PlayIcon className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Starter templates */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Starter Templates
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                name: 'Missing IDs (last 24h)',
                desc: 'Find journeys with missing correlation IDs',
              },
              {
                name: 'Missing downstream steps',
                desc: 'Find journeys missing expected downstream events',
              },
              {
                name: 'Delivery errors (all channels)',
                desc: 'Find journeys with delivery failures',
              },
            ].map((template) => (
              <button
                key={template.name}
                onClick={() => navigate('/explore')}
                className="text-left p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <p className="text-xs font-medium text-indigo-700">
                  {template.name}
                </p>
                <p className="text-[11px] text-indigo-500 mt-1">
                  {template.desc}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

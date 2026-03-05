import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  SearchIcon,
  PlayIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  SmartphoneIcon,
  XIcon,
  ChevronDownIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { FilterPane } from '../components/FilterPane';
import { JourneyList } from '../components/JourneyList';
import { JourneyPreview } from '../components/JourneyPreview';
import { ErrorSummaryBar } from '../components/ErrorSummaryBar';
import { UserDeliverySummary } from '../components/UserDeliverySummary';
import { mockJourneys, ALL_SYSTEMS, ALL_INTENTS, ALL_CAMPAIGNS } from '../mockData';
import { Filters, Journey } from '../types';

interface SearchSuggestion {
  type: 'user_id' | 'soylent_email_id' | 'soylent_phone_id' | 'device_id';
  value: string;
  label: string;
  journeyCount: number;
}

function buildSuggestions(): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const seenValues = new Set<string>();

  for (const j of mockJourneys) {
    // User IDs
    if (!seenValues.has(j.userId)) {
      seenValues.add(j.userId);
      const count = mockJourneys.filter((x) => x.userId === j.userId).length;
      suggestions.push({
        type: 'user_id',
        value: j.userId,
        label: j.userId,
        journeyCount: count,
      });
    }

    // Soylent Email IDs
    const emailKey = `email:${j.soylentEmailId}`;
    if (!seenValues.has(emailKey)) {
      seenValues.add(emailKey);
      const count = mockJourneys.filter((x) => x.soylentEmailId === j.soylentEmailId).length;
      suggestions.push({
        type: 'soylent_email_id',
        value: j.soylentEmailId,
        label: j.soylentEmailId,
        journeyCount: count,
      });
    }

    // Soylent Phone IDs
    const phoneKey = `phone:${j.soylentPhoneId}`;
    if (!seenValues.has(phoneKey)) {
      seenValues.add(phoneKey);
      const count = mockJourneys.filter((x) => x.soylentPhoneId === j.soylentPhoneId).length;
      suggestions.push({
        type: 'soylent_phone_id',
        value: j.soylentPhoneId,
        label: j.soylentPhoneId,
        journeyCount: count,
      });
    }

    // Device IDs
    const deviceKey = `device:${j.deviceId}`;
    if (!seenValues.has(deviceKey)) {
      seenValues.add(deviceKey);
      const count = mockJourneys.filter((x) => x.deviceId === j.deviceId).length;
      suggestions.push({
        type: 'device_id',
        value: j.deviceId,
        label: j.deviceId,
        journeyCount: count,
      });
    }
  }

  return suggestions;
}

const allSuggestions = buildSuggestions();

const typeIcons: Record<SearchSuggestion['type'], typeof UserIcon> = {
  user_id: UserIcon,
  soylent_email_id: MailIcon,
  soylent_phone_id: PhoneIcon,
  device_id: SmartphoneIcon,
};

const typeLabels: Record<SearchSuggestion['type'], string> = {
  user_id: 'User ID',
  soylent_email_id: 'Soylent Email ID',
  soylent_phone_id: 'Soylent Phone ID',
  device_id: 'Device ID',
};

const typeBgColors: Record<SearchSuggestion['type'], string> = {
  user_id: 'bg-blue-100 text-blue-700',
  soylent_email_id: 'bg-purple-100 text-purple-700',
  soylent_phone_id: 'bg-teal-100 text-teal-700',
  device_id: 'bg-orange-100 text-orange-700',
};

export function JourneyExplorer() {
  const [filters, setFilters] = useState<Filters>(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const to = now.toISOString().slice(0, 16);
    return {
      fromDate: from,
      toDate: to,
      statuses: ['complete', 'error'],
      systems: [...ALL_SYSTEMS],
      campaigns: [...ALL_CAMPAIGNS],
      intents: [...ALL_INTENTS],
      searchQuery: '',
    };
  });

  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [errorSystemFilter, setErrorSystemFilter] = useState<string | null>(null);
  const [errorCodeFilter, setErrorCodeFilter] = useState<string | null>(null);

  const handleSelectSystem = useCallback((system: string | null) => {
    setErrorSystemFilter(system);
    // Clear error code filter when switching systems
    if (system !== errorSystemFilter) {
      setErrorCodeFilter(null);
    }
  }, [errorSystemFilter]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const campaignRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on search input
  const filteredSuggestions = useMemo(() => {
    if (!searchInput.trim()) {
      // Show all suggestions grouped when empty but focused
      return allSuggestions.slice(0, 20);
    }
    const q = searchInput.toLowerCase().trim();
    return allSuggestions
      .filter(
        (s) =>
          s.value.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q) ||
          s.type.replace(/_/g, ' ').includes(q)
      )
      .slice(0, 15);
  }, [searchInput]);

  // Filter journeys based on search input
  const filteredJourneys = useMemo(() => {
    return mockJourneys.filter((j) => {
      if (!filters.statuses.includes(j.status)) return false;
      if (!filters.campaigns.includes(j.intentType)) return false;
      if (errorsOnly && j.status !== 'error') return false;
      if (errorSystemFilter) {
        // Only show journeys that have error/missing events in the selected system
        const hasErrorInSystem = j.events.some(
          (e) =>
            e.sourceSystem === errorSystemFilter &&
            (e.status === 'error' || e.status === 'missing')
        );
        if (!hasErrorInSystem) return false;
      }
      if (errorCodeFilter) {
        // Only show journeys that have an event with this specific error code
        const hasErrorCode = j.events.some(
          (e) =>
            e.status === 'error' &&
            e.attributes.errorCode === errorCodeFilter
        );
        if (!hasErrorCode) return false;
      }
      if (searchInput) {
        const q = searchInput.toLowerCase();
        const matchesSearch =
          j.correlationId.toLowerCase().includes(q) ||
          j.userId.toLowerCase().includes(q) ||
          j.soylentEmailId.toLowerCase().includes(q) ||
          j.soylentPhoneId.toLowerCase().includes(q) ||
          j.deviceId.toLowerCase().includes(q) ||
          j.intentType.toLowerCase().includes(q) ||
          j.intentId.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q)) ||
          j.events.some((e) => e.sourceSystem.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [filters.statuses, filters.campaigns, errorsOnly, errorSystemFilter, errorCodeFilter, searchInput]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (campaignRef.current && !campaignRef.current.contains(e.target as Node)) {
        setShowCampaignDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setSearchInput(suggestion.value);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || filteredSuggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    },
    [showDropdown, filteredSuggestions, highlightedIndex, handleSelectSuggestion]
  );

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setShowDropdown(false);
    inputRef.current?.focus();
  }, []);

  const toggleCampaign = useCallback((campaign: string) => {
    setFilters((prev) => {
      const newCampaigns = prev.campaigns.includes(campaign)
        ? prev.campaigns.filter((c) => c !== campaign)
        : [...prev.campaigns, campaign];
      return { ...prev, campaigns: newCampaigns };
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar with search */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex-1 relative" ref={searchRef}>
          <div
            className={`flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-lg transition-colors ${
              showDropdown
                ? 'border-indigo-300 ring-2 ring-indigo-100'
                : 'border-slate-200'
            }`}
          >
            <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search: soylent_email_id / user_id / device_id / soylent_phone_id"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowDropdown(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              aria-autocomplete="list"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                title="Clear search"
              >
                <XIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown && filteredSuggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[420px] overflow-y-auto"
              role="listbox"
            >
              {/* Quick hint */}
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] text-slate-400">
                  {searchInput
                    ? `${filteredSuggestions.length} result${filteredSuggestions.length !== 1 ? 's' : ''} matching "${searchInput}"`
                    : 'Type to search, or browse available IDs below'}
                </p>
              </div>

              {/* Group suggestions by type */}
              {(() => {
                const groups = new Map<string, SearchSuggestion[]>();
                for (const s of filteredSuggestions) {
                  const existing = groups.get(s.type) || [];
                  existing.push(s);
                  groups.set(s.type, existing);
                }

                let globalIndex = -1;

                return Array.from(groups.entries()).map(([type, items]) => (
                  <div key={type}>
                    <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 sticky top-0">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {typeLabels[type as SearchSuggestion['type']]}
                      </span>
                    </div>
                    {items.map((suggestion) => {
                      globalIndex++;
                      const idx = globalIndex;
                      const Icon =
                        typeIcons[suggestion.type] || UserIcon;
                      const isHighlighted = idx === highlightedIndex;

                      return (
                        <button
                          key={`${suggestion.type}-${suggestion.value}`}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            isHighlighted
                              ? 'bg-indigo-50'
                              : 'hover:bg-slate-50'
                          }`}
                          role="option"
                          aria-selected={isHighlighted}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isHighlighted
                                ? 'text-indigo-500'
                                : 'text-slate-400'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs font-mono ${
                                isHighlighted
                                  ? 'text-indigo-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {highlightMatch(suggestion.label, searchInput)}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              typeBgColors[suggestion.type]
                            }`}
                          >
                            {suggestion.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {suggestion.journeyCount} journey
                            {suggestion.journeyCount !== 1 ? 's' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}

          {/* No results message */}
          {showDropdown &&
            searchInput.trim() &&
            filteredSuggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-4 text-center">
                <p className="text-xs text-slate-500">
                  No matches for &ldquo;{searchInput}&rdquo;
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try a correlation ID, user ID, intent, or tag
                </p>
              </div>
            )}
        </div>

        {/* Campaign dropdown */}
        <div className="relative" ref={campaignRef}>
          <button
            onClick={() => setShowCampaignDropdown((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showCampaignDropdown
                ? 'border-indigo-300 ring-2 ring-indigo-100 bg-white'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-slate-600 whitespace-nowrap">
              Campaign
              {filters.campaigns.length < ALL_CAMPAIGNS.length && (
                <span className="ml-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                  {filters.campaigns.length}
                </span>
              )}
            </span>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                showCampaignDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showCampaignDropdown && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Filter by campaign
                </p>
              </div>
              {ALL_CAMPAIGNS.map((campaign) => (
                <label
                  key={campaign}
                  className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.campaigns.includes(campaign)}
                    onChange={() => toggleCampaign(campaign)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-300"
                  />
                  <span className="text-xs text-slate-600">
                    {campaign.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Errors only toggle */}
        <button
          onClick={() => setErrorsOnly((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
            errorsOnly
              ? 'bg-red-50 text-red-700 border-red-200 ring-2 ring-red-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Show only error journeys"
        >
          <AlertCircleIcon className={`w-3.5 h-3.5 ${errorsOnly ? 'text-red-500' : 'text-slate-400'}`} />
          <span className="whitespace-nowrap">Errors Only</span>
        </button>

        <button
          onClick={() => setShowDropdown(false)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <PlayIcon className="w-3.5 h-3.5" />
          Run
        </button>
      </div>

      {/* Error summary grouped by system */}
      <ErrorSummaryBar
        journeys={filteredJourneys}
        activeSystem={errorSystemFilter}
        onSelectSystem={handleSelectSystem}
        activeErrorCode={errorCodeFilter}
        onSelectErrorCode={setErrorCodeFilter}
      />

      {/* User delivery summary — shown when all journeys belong to one user */}
      <UserDeliverySummary journeys={filteredJourneys} searchInput={searchInput} />

      {/* Three-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        <FilterPane filters={filters} onChange={setFilters} />
        <JourneyList
          journeys={filteredJourneys}
          selectedId={selectedJourney?.correlationId ?? null}
          onSelect={setSelectedJourney}
          groupBySystem={errorSystemFilter}
        />
        <JourneyPreview journey={selectedJourney} />
      </div>
    </div>
  );
}

/** Highlights the matching substring in bold */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-indigo-600">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

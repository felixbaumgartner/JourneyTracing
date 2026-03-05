export interface User {
  userId: string;
}

export interface Intent {
  intentId: string;
  intentType: string;
}

export type JourneyStatus = 'complete' | 'error';

export interface Journey {
  correlationId: string;
  userId: string;
  soylentEmailId: string;
  soylentPhoneId: string;
  deviceId: string;
  intentType: string;
  intentId: string;
  journeyDate: string;
  status: JourneyStatus;
  startTime: string;
  endTime: string;
  durationMs: number;
  totalEvents: number;
  missingCount: number;
  anomalies: string[];
  tags: string[];
  events: JourneyEvent[];
}

export interface JourneyEvent {
  id: string;
  eventName: string;
  eventType: 'action' | 'decision' | 'delivery' | 'system' | 'error';
  sourceSystem: string;
  timestamp: string;
  durationMs: number;
  offsetMs: number;
  severity: 'info' | 'warn' | 'error';
  status: 'ok' | 'missing' | 'error' | 'retry' | 'skipped';
  attributes: Record<string, string>;
  parentId?: string;
  children?: string[];
}

export interface ContractHealthEntry {
  systemName: string;
  missingnessRate: number;
  missingCorrelationIds: number;
  missingDownstreamEvents: number;
  trend: number[];
}

export interface SavedView {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  createdBy: string;
  pinned: boolean;
}

export type ViewMode = 'waterfall' | 'flame' | 'map';

export interface Filters {
  fromDate: string;
  toDate: string;
  statuses: JourneyStatus[];
  systems: string[];
  campaigns: string[];
  intents: string[];
  searchQuery: string;
}

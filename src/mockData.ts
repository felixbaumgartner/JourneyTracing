import { Journey, JourneyEvent, ContractHealthEntry, SavedView } from './types';

/**
 * failureLayer controls WHERE in the pipeline the error occurs.
 * Multiple failure types per system allow varied error codes:
 *
 * Janeway (system 0):
 *   'janeway_eligibility'  → eligibility.check fails  (template index 1)
 *   'janeway_audience'     → audience.resolved fails   (template index 2)
 *
 * Content (system 1):
 *   'content_personalize'  → content.personalized fails (template index 3)
 *   'content_compose'      → message.composed fails     (template index 5)
 *
 * BMessage (system 2):
 *   'bmessage_schedule'    → send.scheduled fails       (template index 6)
 *   'bmessage_dispatch'    → message.dispatched fails   (template index 7)
 */
type FailureLayer =
  | 'janeway_eligibility'
  | 'janeway_audience'
  | 'content_personalize'
  | 'content_compose'
  | 'bmessage_schedule'
  | 'bmessage_dispatch';

interface FailureConfig {
  templateIndex: number;
  systemIndex: number;
  errorCode: string;
  errorMessage: string;
  retryCount: string;
}

const FAILURE_CONFIGS: Record<FailureLayer, FailureConfig> = {
  janeway_eligibility: {
    templateIndex: 1,  // eligibility.check
    systemIndex: 0,
    errorCode: 'ELIGIBILITY_FAILED',
    errorMessage: 'User not eligible — audience segment mismatch',
    retryCount: '0',
  },
  janeway_audience: {
    templateIndex: 2,  // audience.resolved
    systemIndex: 0,
    errorCode: 'AUDIENCE_RESOLUTION_ERROR',
    errorMessage: 'Audience service returned 503 — circuit breaker open',
    retryCount: '3',
  },
  content_personalize: {
    templateIndex: 3,  // content.personalized
    systemIndex: 1,
    errorCode: 'TEMPLATE_NOT_FOUND',
    errorMessage: 'Content template v3.2 not found for locale en_GB',
    retryCount: '1',
  },
  content_compose: {
    templateIndex: 5,  // message.composed
    systemIndex: 1,
    errorCode: 'RENDERING_ERROR',
    errorMessage: 'Failed to render dynamic block — missing variable {{booking.checkin_date}}',
    retryCount: '0',
  },
  bmessage_schedule: {
    templateIndex: 6,  // send.scheduled
    systemIndex: 2,
    errorCode: 'SCHEDULING_ERROR',
    errorMessage: 'Send-time optimization service unavailable',
    retryCount: '1',
  },
  bmessage_dispatch: {
    templateIndex: 7,  // message.dispatched
    systemIndex: 2,
    errorCode: 'DELIVERY_TIMEOUT',
    errorMessage: 'Gateway timeout after 30s',
    retryCount: '2',
  },
};

function makeEvents(
  journeyStart: string,
  systems: string[],
  status: string,
  failureLayer?: FailureLayer
): JourneyEvent[] {
  const base = new Date(journeyStart).getTime();
  const events: JourneyEvent[] = [];
  let offset = 0;

  // Pipeline order: Janeway(0) → Content(1) → BMessage(2) → MM-Events(3)
  // If a system fails, all downstream systems are skipped.
  const PIPELINE_ORDER = [0, 1, 2, 3]; // system indices in sequential order

  const eventTemplates: Array<{
    name: string;
    system: number;
    type: 'action' | 'decision' | 'delivery' | 'system' | 'error';
    dur: number;
  }> = [
    { name: 'journey.initiated', system: 0, type: 'action', dur: 12 },
    { name: 'eligibility.check', system: 0, type: 'decision', dur: 85 },
    { name: 'audience.resolved', system: 0, type: 'system', dur: 240 },
    { name: 'content.personalized', system: 1, type: 'action', dur: 180 },
    { name: 'channel.selected', system: 0, type: 'decision', dur: 30 },
    { name: 'message.composed', system: 1, type: 'action', dur: 320 },
    { name: 'send.scheduled', system: 2, type: 'system', dur: 15 },
    { name: 'message.dispatched', system: 2, type: 'delivery', dur: 450 },
    { name: 'delivery.confirmed', system: 2, type: 'delivery', dur: 120 },
    { name: 'open.tracked', system: 3, type: 'action', dur: 0 },
    { name: 'click.tracked', system: 3, type: 'action', dur: 0 },
    { name: 'conversion.attributed', system: 3, type: 'system', dur: 60 },
    { name: 'journey.completed', system: 0, type: 'system', dur: 5 },
  ];

  // Determine failure point based on failureLayer
  let failedSystemIndex = -1;
  let failedEventName = '';
  let failedSystemName = '';
  let failureTemplateIndex = -1;
  let failureConfig: FailureConfig | null = null;

  if (status === 'error' && failureLayer) {
    failureConfig = FAILURE_CONFIGS[failureLayer];
    failedSystemIndex = PIPELINE_ORDER.indexOf(failureConfig.systemIndex);
    failureTemplateIndex = failureConfig.templateIndex;
    failedEventName = eventTemplates[failureTemplateIndex].name;
    failedSystemName = systems[failureConfig.systemIndex];
  } else if (status === 'error') {
    // Default: BMessage error (backwards compatibility)
    failureConfig = FAILURE_CONFIGS.bmessage_dispatch;
    failedSystemIndex = PIPELINE_ORDER.indexOf(2);
    failureTemplateIndex = 7;
    failedEventName = 'message.dispatched';
    failedSystemName = systems[2];
  } else if (status === 'incomplete') {
    // Missing at delivery.confirmed (BMessage = system 2)
    failedSystemIndex = PIPELINE_ORDER.indexOf(2);
    failedEventName = 'delivery.confirmed';
    failedSystemName = systems[2];
  }

  for (let i = 0; i < eventTemplates.length; i++) {
    const t = eventTemplates[i];
    const templateSystemName = systems[t.system] || systems[0];
    const systemPipelinePos = PIPELINE_ORDER.indexOf(t.system);

    // Check if this event's system is downstream of the failed system
    const isDownstreamOfFailure =
      failedSystemIndex >= 0 && systemPipelinePos > failedSystemIndex;

    // For Janeway failures: events in Janeway AFTER the failure point should also be skipped
    const isSameSystemAfterFailure =
      failedSystemIndex >= 0 &&
      systemPipelinePos === failedSystemIndex &&
      i > failureTemplateIndex &&
      t.name !== 'journey.completed'; // journey.completed handled separately

    // Special case: journey.completed (last Janeway event) should also be skipped on failure
    const isJourneyCompleted = t.name === 'journey.completed';
    const shouldSkip =
      isDownstreamOfFailure ||
      isSameSystemAfterFailure ||
      (isJourneyCompleted && failedSystemIndex >= 0);

    // Check if this specific event is the error point
    const isError = status === 'error' && i === failureTemplateIndex;
    const isMissing = status === 'incomplete' && (i === 8 || i === 9);

    if (shouldSkip) {
      events.push({
        id: `evt-${i}`,
        eventName: t.name,
        eventType: t.type,
        sourceSystem: templateSystemName,
        timestamp: new Date(base + offset).toISOString(),
        durationMs: 0,
        offsetMs: offset,
        severity: 'warn' as const,
        status: 'skipped' as const,
        attributes: {
          reason: `Upstream failure in ${failedSystemName}`,
          blockedBy: failedEventName,
        },
      });
    } else if (isMissing) {
      events.push({
        id: `evt-${i}`,
        eventName: t.name,
        eventType: t.type,
        sourceSystem: templateSystemName,
        timestamp: new Date(base + offset).toISOString(),
        durationMs: t.dur,
        offsetMs: offset,
        severity: 'warn' as const,
        status: 'missing' as const,
        attributes: { expected: 'true', reason: 'Message not sent because of failure in soylent service' },
      });
    } else if (isError && failureConfig) {
      events.push({
        id: `evt-${i}`,
        eventName: t.name,
        eventType: 'error' as const,
        sourceSystem: templateSystemName,
        timestamp: new Date(base + offset).toISOString(),
        durationMs: t.dur,
        offsetMs: offset,
        severity: 'error' as const,
        status: 'error' as const,
        attributes: {
          errorCode: failureConfig.errorCode,
          errorMessage: failureConfig.errorMessage,
          retryCount: failureConfig.retryCount,
        },
      });
    } else {
      events.push({
        id: `evt-${i}`,
        eventName: t.name,
        eventType: t.type,
        sourceSystem: templateSystemName,
        timestamp: new Date(base + offset).toISOString(),
        durationMs: t.dur,
        offsetMs: offset,
        severity: 'info' as const,
        status: 'ok' as const,
        attributes: {
          traceId: `tr-${Math.random().toString(36).slice(2, 10)}`,
          ...(t.type === 'delivery'
            ? { channel: 'email', provider: 'sendgrid' }
            : {}),
          ...(t.type === 'decision'
            ? { outcome: 'pass', ruleSet: 'v2.4' }
            : {}),
        },
      });
    }
    offset += t.dur + Math.floor(Math.random() * 200) + 50;
  }

  return events;
}

// All journeys use the same 4-system pipeline
const SYSTEMS = ['Campaign Matching (Janeway)', 'Content Matching (Content Builder)', 'Message Delivery Layer (BMessage)', 'Engagement Events (MM-Events)'];

/** Per-user stable identifiers (16-digit hex) */
const USER_IDS: Record<string, { soylentEmailId: string; soylentPhoneId: string; deviceId: string }> = {
  'user-10042': { soylentEmailId: '3a7f1b9e2c4d8a06', soylentPhoneId: '9c2e4f7a1b3d5068', deviceId: 'f1a3b5c7d9e2f408' },
  'user-20187': { soylentEmailId: '8b4e2d6f1a3c7509', soylentPhoneId: 'd5f8a2c4e6b91037', deviceId: '2c6e8a0f4d1b7359' },
  'user-30455': { soylentEmailId: '5d9a3f7e1c8b4602', soylentPhoneId: 'a1c3e5f7d9b24068', deviceId: '7b3d5f9a1e8c2604' },
  'user-40821': { soylentEmailId: 'e2f4a6c8d0b17539', soylentPhoneId: '4a6c8e0f2d1b3759', deviceId: 'c8a0e2f4d6b19537' },
  'user-50193': { soylentEmailId: '1f3a5c7e9d2b4860', soylentPhoneId: '6e8a0c2f4d1b5739', deviceId: 'a4c6e8f0d2b13759' },
  'user-60517': { soylentEmailId: '7c9e1a3f5d8b2604', soylentPhoneId: 'b3d5f7a9c1e24068', deviceId: '5a7c9e1f3d8b0264' },
  'user-70342': { soylentEmailId: 'd0b2e4f6a8c13759', soylentPhoneId: '2f4a6c8e0d1b3579', deviceId: '8e0a2c4f6d1b5937' },
  'user-80199': { soylentEmailId: '4b6d8f0a2e1c3759', soylentPhoneId: 'f0a2c4e6d8b13579', deviceId: '3e5a7c9f1d8b0246' },
};

export const mockJourneys: Journey[] = [
  // ─── user-10042: 4 journeys ───
  {
    correlationId: 'corr-a1b2c3d4',
    userId: 'user-10042',
    ...USER_IDS['user-10042'],
    intentType: 'booking_confirmation',
    intentId: 'intent-bc-001',
    journeyDate: '2026-03-04',
    status: 'complete',
    startTime: '2026-03-04T09:12:03Z',
    endTime: '2026-03-04T09:12:08Z',
    durationMs: 4820,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['email', 'transactional', 'high-priority'],
    events: makeEvents('2026-03-04T09:12:03Z', SYSTEMS, 'complete'),
  },
  {
    correlationId: 'corr-a1b2-pd01',
    userId: 'user-10042',
    ...USER_IDS['user-10042'],
    intentType: 'price_drop_alert',
    intentId: 'intent-pd-050',
    journeyDate: '2026-03-03',
    status: 'complete',
    startTime: '2026-03-03T14:22:10Z',
    endTime: '2026-03-03T14:22:15Z',
    durationMs: 5100,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['email', 'marketing', 'price-alert'],
    events: makeEvents('2026-03-03T14:22:10Z', SYSTEMS, 'complete'),
  },
  {
    // ⚠ CONTENT — TEMPLATE_NOT_FOUND
    correlationId: 'corr-a1b2-rv01',
    userId: 'user-10042',
    ...USER_IDS['user-10042'],
    intentType: 'review_request',
    intentId: 'intent-rr-025',
    journeyDate: '2026-03-02',
    status: 'error',
    startTime: '2026-03-02T18:05:44Z',
    endTime: '2026-03-02T18:05:49Z',
    durationMs: 4600,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['content_error'],
    tags: ['push', 'post-stay'],
    events: makeEvents('2026-03-02T18:05:44Z', SYSTEMS, 'error', 'content_personalize'),
  },
  {
    correlationId: 'corr-a1b2-lr01',
    userId: 'user-10042',
    ...USER_IDS['user-10042'],
    intentType: 'loyalty_reward',
    intentId: 'intent-lr-012',
    journeyDate: '2026-03-01',
    status: 'complete',
    startTime: '2026-03-01T10:30:00Z',
    endTime: '2026-03-01T10:30:05Z',
    durationMs: 4900,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['email', 'rewards', 'genius'],
    events: makeEvents('2026-03-01T10:30:00Z', SYSTEMS, 'complete'),
  },

  // ─── user-20187: 3 journeys ───
  {
    // ⚠ JANEWAY — ELIGIBILITY_FAILED
    correlationId: 'corr-e5f6g7h8',
    userId: 'user-20187',
    ...USER_IDS['user-20187'],
    intentType: 'price_drop_alert',
    intentId: 'intent-pd-042',
    journeyDate: '2026-03-04',
    status: 'error',
    startTime: '2026-03-04T09:10:15Z',
    endTime: '2026-03-04T09:10:19Z',
    durationMs: 3950,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['eligibility_error'],
    tags: ['email', 'marketing', 'price-alert'],
    events: makeEvents('2026-03-04T09:10:15Z', SYSTEMS, 'error', 'janeway_eligibility'),
  },
  {
    // ⚠ BMESSAGE — DELIVERY_TIMEOUT
    correlationId: 'corr-e5f6-ca01',
    userId: 'user-20187',
    ...USER_IDS['user-20187'],
    intentType: 'cart_abandonment',
    intentId: 'intent-ca-040',
    journeyDate: '2026-03-03',
    status: 'error',
    startTime: '2026-03-03T20:45:30Z',
    endTime: '2026-03-03T20:45:36Z',
    durationMs: 5800,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['delivery_error', 'retry_detected'],
    tags: ['email', 'retargeting', 'retry'],
    events: makeEvents('2026-03-03T20:45:30Z', SYSTEMS, 'error', 'bmessage_dispatch'),
  },
  {
    correlationId: 'corr-e5f6-ws01',
    userId: 'user-20187',
    ...USER_IDS['user-20187'],
    intentType: 'welcome_series',
    intentId: 'intent-ws-010',
    journeyDate: '2026-03-01',
    status: 'complete',
    startTime: '2026-03-01T08:15:22Z',
    endTime: '2026-03-01T08:15:27Z',
    durationMs: 4500,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['email', 'onboarding'],
    events: makeEvents('2026-03-01T08:15:22Z', SYSTEMS, 'complete'),
  },

  // ─── user-30455: 3 journeys ───
  {
    // ⚠ BMESSAGE — SCHEDULING_ERROR (different error code, same system)
    correlationId: 'corr-i9j0k1l2',
    userId: 'user-30455',
    ...USER_IDS['user-30455'],
    intentType: 'review_request',
    intentId: 'intent-rr-017',
    journeyDate: '2026-03-04',
    status: 'error',
    startTime: '2026-03-04T09:05:22Z',
    endTime: '2026-03-04T09:05:28Z',
    durationMs: 5870,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['scheduling_error'],
    tags: ['push', 'post-stay', 'retry'],
    events: makeEvents('2026-03-04T09:05:22Z', SYSTEMS, 'error', 'bmessage_schedule'),
  },
  {
    correlationId: 'corr-i9j0-bc01',
    userId: 'user-30455',
    ...USER_IDS['user-30455'],
    intentType: 'booking_confirmation',
    intentId: 'intent-bc-009',
    journeyDate: '2026-03-03',
    status: 'complete',
    startTime: '2026-03-03T11:32:18Z',
    endTime: '2026-03-03T11:32:23Z',
    durationMs: 4750,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['email', 'transactional'],
    events: makeEvents('2026-03-03T11:32:18Z', SYSTEMS, 'complete'),
  },
  {
    correlationId: 'corr-i9j0-pd01',
    userId: 'user-30455',
    ...USER_IDS['user-30455'],
    intentType: 'price_drop_alert',
    intentId: 'intent-pd-055',
    journeyDate: '2026-03-02',
    status: 'complete',
    startTime: '2026-03-02T07:48:05Z',
    endTime: '2026-03-02T07:48:10Z',
    durationMs: 5020,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['sms', 'marketing'],
    events: makeEvents('2026-03-02T07:48:05Z', SYSTEMS, 'complete'),
  },

  // ─── user-40821: 1 journey ───
  {
    correlationId: 'corr-m3n4o5p6',
    userId: 'user-40821',
    ...USER_IDS['user-40821'],
    intentType: 'loyalty_reward',
    intentId: 'intent-lr-008',
    journeyDate: '2026-03-04',
    status: 'complete',
    startTime: '2026-03-04T08:55:11Z',
    endTime: '2026-03-04T08:55:16Z',
    durationMs: 5120,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['email', 'rewards', 'genius'],
    events: makeEvents('2026-03-04T08:55:11Z', SYSTEMS, 'complete'),
  },

  // ─── user-50193: 1 journey ───
  {
    // ⚠ CONTENT — RENDERING_ERROR (different Content error code)
    correlationId: 'corr-q7r8s9t0',
    userId: 'user-50193',
    ...USER_IDS['user-50193'],
    intentType: 'cart_abandonment',
    intentId: 'intent-ca-033',
    journeyDate: '2026-03-04',
    status: 'error',
    startTime: '2026-03-04T08:48:44Z',
    endTime: '2026-03-04T08:48:48Z',
    durationMs: 4200,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['content_error'],
    tags: ['email', 'retargeting'],
    events: makeEvents('2026-03-04T08:48:44Z', SYSTEMS, 'error', 'content_compose'),
  },

  // ─── user-60517: 1 journey ───
  {
    correlationId: 'corr-u1v2w3x4',
    userId: 'user-60517',
    ...USER_IDS['user-60517'],
    intentType: 'booking_confirmation',
    intentId: 'intent-bc-002',
    journeyDate: '2026-03-04',
    status: 'complete',
    startTime: '2026-03-04T08:42:30Z',
    endTime: '2026-03-04T08:42:35Z',
    durationMs: 4650,
    totalEvents: 13,
    missingCount: 0,
    anomalies: [],
    tags: ['email', 'transactional'],
    events: makeEvents('2026-03-04T08:42:30Z', SYSTEMS, 'complete'),
  },

  // ─── user-70342: 1 journey ───
  {
    // ⚠ JANEWAY — AUDIENCE_RESOLUTION_ERROR (different Janeway error code)
    correlationId: 'corr-y5z6a7b8',
    userId: 'user-70342',
    ...USER_IDS['user-70342'],
    intentType: 'welcome_series',
    intentId: 'intent-ws-005',
    journeyDate: '2026-03-04',
    status: 'error',
    startTime: '2026-03-04T08:35:18Z',
    endTime: '2026-03-04T08:35:24Z',
    durationMs: 6100,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['audience_error'],
    tags: ['push', 'onboarding'],
    events: makeEvents('2026-03-04T08:35:18Z', SYSTEMS, 'error', 'janeway_audience'),
  },

  // ─── user-80199: 2 journeys (additional variety) ───
  {
    // ⚠ BMESSAGE — DELIVERY_TIMEOUT (another BMessage delivery timeout)
    correlationId: 'corr-c1d2e3f4',
    userId: 'user-80199',
    ...USER_IDS['user-80199'],
    intentType: 'booking_confirmation',
    intentId: 'intent-bc-015',
    journeyDate: '2026-03-04',
    status: 'error',
    startTime: '2026-03-04T07:22:05Z',
    endTime: '2026-03-04T07:22:11Z',
    durationMs: 5500,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['delivery_error', 'retry_detected'],
    tags: ['email', 'transactional'],
    events: makeEvents('2026-03-04T07:22:05Z', SYSTEMS, 'error', 'bmessage_dispatch'),
  },
  {
    // ⚠ JANEWAY — ELIGIBILITY_FAILED (another eligibility failure)
    correlationId: 'corr-c1d2-lr01',
    userId: 'user-80199',
    ...USER_IDS['user-80199'],
    intentType: 'loyalty_reward',
    intentId: 'intent-lr-020',
    journeyDate: '2026-03-03',
    status: 'error',
    startTime: '2026-03-03T16:10:33Z',
    endTime: '2026-03-03T16:10:37Z',
    durationMs: 3800,
    totalEvents: 13,
    missingCount: 0,
    anomalies: ['eligibility_error'],
    tags: ['email', 'rewards'],
    events: makeEvents('2026-03-03T16:10:33Z', SYSTEMS, 'error', 'janeway_eligibility'),
  },
];

export const mockContractHealth: ContractHealthEntry[] = [
  {
    systemName: 'BMessage',
    missingnessRate: 4.8,
    missingCorrelationIds: 142,
    missingDownstreamEvents: 87,
    trend: [3.2, 3.5, 4.1, 3.8, 4.2, 4.5, 4.8],
  },
  {
    systemName: 'MM-Events',
    missingnessRate: 3.2,
    missingCorrelationIds: 95,
    missingDownstreamEvents: 63,
    trend: [2.8, 3.0, 2.9, 3.1, 3.0, 3.3, 3.2],
  },
  {
    systemName: 'Janeway',
    missingnessRate: 1.9,
    missingCorrelationIds: 56,
    missingDownstreamEvents: 34,
    trend: [2.1, 2.0, 1.8, 2.2, 1.9, 1.8, 1.9],
  },
  {
    systemName: 'Content',
    missingnessRate: 1.2,
    missingCorrelationIds: 35,
    missingDownstreamEvents: 21,
    trend: [1.5, 1.4, 1.3, 1.2, 1.3, 1.2, 1.2],
  },
];

export const mockSavedViews: SavedView[] = [
  {
    id: 'sv-1',
    name: 'Missing correlation IDs (last 24h)',
    query: 'status:incomplete missing_count:>0 date:last24h',
    createdAt: '2026-03-03T14:30:00Z',
    createdBy: 'system',
    pinned: true,
  },
  {
    id: 'sv-2',
    name: 'Delivery errors - push channel',
    query: 'status:error tags:push anomaly:delivery_error',
    createdAt: '2026-03-02T10:15:00Z',
    createdBy: 'alice@booking.com',
    pinned: true,
  },
  {
    id: 'sv-3',
    name: 'Price drop journeys with missing downstream',
    query: 'intent:price_drop_alert anomaly:missing_downstream',
    createdAt: '2026-03-01T16:45:00Z',
    createdBy: 'bob@booking.com',
    pinned: false,
  },
  {
    id: 'sv-4',
    name: 'High-priority transactional (today)',
    query: 'tags:transactional tags:high-priority date:today',
    createdAt: '2026-03-04T08:00:00Z',
    createdBy: 'system',
    pinned: false,
  },
  {
    id: 'sv-5',
    name: 'Retry storms investigation',
    query: 'anomaly:retry_detected date:last7d sort:retry_count:desc',
    createdAt: '2026-02-28T11:20:00Z',
    createdBy: 'charlie@booking.com',
    pinned: false,
  },
];

export const ALL_SYSTEMS = [
  'Campaign Matching (Janeway)',
  'Content Matching (Content Builder)',
  'Message Delivery Layer (BMessage)',
  'Engagement Events (MM-Events)',
];

export const ALL_CAMPAIGNS = [
  'booking_confirmation',
  'price_drop_alert',
  'review_request',
  'loyalty_reward',
  'cart_abandonment',
  'welcome_series',
];

export const ALL_INTENTS = [
  'booking_confirmation',
  'price_drop_alert',
  'review_request',
  'loyalty_reward',
  'cart_abandonment',
  'welcome_series',
];

import {
  SendIcon,
  MailOpenIcon,
  MousePointerClickIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  SmartphoneIcon,
  InboxIcon,
} from 'lucide-react';
import { Journey } from '../types';

type IdentifierType = 'user_id' | 'soylent_email_id' | 'soylent_phone_id' | 'device_id';

interface UserDeliverySummaryProps {
  journeys: Journey[];
  searchInput: string;
}

interface DeliveryStats {
  identifierLabel: string;
  identifierType: IdentifierType;
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
}

function detectIdentifier(journeys: Journey[], searchInput: string): { label: string; type: IdentifierType } {
  if (!searchInput) return { label: journeys[0].userId, type: 'user_id' };

  const q = searchInput.toLowerCase();
  const first = journeys[0];

  if (first.soylentEmailId.toLowerCase() === q) return { label: first.soylentEmailId, type: 'soylent_email_id' };
  if (first.soylentPhoneId.toLowerCase() === q) return { label: first.soylentPhoneId, type: 'soylent_phone_id' };
  if (first.deviceId.toLowerCase() === q) return { label: first.deviceId, type: 'device_id' };
  if (first.userId.toLowerCase() === q) return { label: first.userId, type: 'user_id' };

  // Partial match fallback
  if (first.soylentEmailId.toLowerCase().includes(q)) return { label: first.soylentEmailId, type: 'soylent_email_id' };
  if (first.soylentPhoneId.toLowerCase().includes(q)) return { label: first.soylentPhoneId, type: 'soylent_phone_id' };
  if (first.deviceId.toLowerCase().includes(q)) return { label: first.deviceId, type: 'device_id' };

  return { label: first.userId, type: 'user_id' };
}

function computeStats(journeys: Journey[], searchInput: string): DeliveryStats | null {
  if (journeys.length === 0) return null;

  // Check all journeys belong to the same user
  const userId = journeys[0].userId;
  const allSameUser = journeys.every((j) => j.userId === userId);
  if (!allSameUser) return null;

  const identifier = detectIdentifier(journeys, searchInput);

  let delivered = 0;
  let opened = 0;
  let clicked = 0;

  for (const journey of journeys) {
    const hasDelivery = journey.events.some(
      (e) => e.eventName === 'delivery.confirmed' && e.status === 'ok'
    );
    const hasOpen = journey.events.some(
      (e) => e.eventName === 'open.tracked' && e.status === 'ok'
    );
    const hasClick = journey.events.some(
      (e) => e.eventName === 'click.tracked' && e.status === 'ok'
    );

    if (hasDelivery || hasOpen || hasClick) delivered++;
    if (hasOpen) opened++;
    if (hasClick) clicked++;
  }

  return { identifierLabel: identifier.label, identifierType: identifier.type, total: journeys.length, delivered, opened, clicked };
}

const IDENTIFIER_CONFIG: Record<IdentifierType, { icon: typeof UserIcon; bg: string; iconColor: string; label: string }> = {
  user_id: { icon: UserIcon, bg: 'bg-blue-100', iconColor: 'text-blue-600', label: 'User ID' },
  soylent_email_id: { icon: MailIcon, bg: 'bg-purple-100', iconColor: 'text-purple-600', label: 'Soylent Email ID' },
  soylent_phone_id: { icon: PhoneIcon, bg: 'bg-teal-100', iconColor: 'text-teal-600', label: 'Soylent Phone ID' },
  device_id: { icon: SmartphoneIcon, bg: 'bg-orange-100', iconColor: 'text-orange-600', label: 'Device ID' },
};

export function UserDeliverySummary({ journeys, searchInput }: UserDeliverySummaryProps) {
  const stats = computeStats(journeys, searchInput);
  if (!stats) return null;

  const deliveryRate =
    stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

  const config = IDENTIFIER_CONFIG[stats.identifierType];
  const Icon = config.icon;

  return (
    <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200">
      <div className="flex items-center gap-6">
        {/* Identifier */}
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold text-slate-700">
              {stats.identifierLabel}
            </span>
            <span className="text-[10px] text-slate-400 ml-2">
              {stats.total} journey{stats.total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200" />

        {/* Delivery stats */}
        <div className="flex items-center gap-5">
          <StatPill
            icon={<SendIcon className="w-3.5 h-3.5" />}
            label="Delivered"
            count={stats.delivered}
            total={stats.total}
            color="emerald"
          />
          <StatPill
            icon={<MailOpenIcon className="w-3.5 h-3.5" />}
            label="Opened"
            count={stats.opened}
            total={stats.total}
            color="blue"
          />
          <StatPill
            icon={<MousePointerClickIcon className="w-3.5 h-3.5" />}
            label="Clicked"
            count={stats.clicked}
            total={stats.total}
            color="violet"
          />
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200" />

        {/* Overall delivery rate */}
        <div className="flex items-center gap-2">
          <InboxIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Delivery rate</span>
          <span
            className={`text-sm font-bold ${
              deliveryRate >= 80
                ? 'text-emerald-600'
                : deliveryRate >= 50
                  ? 'text-amber-600'
                  : 'text-red-600'
            }`}
          >
            {deliveryRate}%
          </span>
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; text: string; bar: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    bar: 'bg-emerald-400',
  },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-400' },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    bar: 'bg-violet-400',
  },
};

function StatPill({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = COLOR_MAP[color] || COLOR_MAP.emerald;

  return (
    <div className="flex items-center gap-2">
      <div className={`${colors.text}`}>{icon}</div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-sm font-bold ${colors.text}`}>{count}</span>
          <span className="text-[10px] text-slate-400">/ {total}</span>
          <span className="text-[10px] text-slate-400">{label}</span>
        </div>
        {/* Mini progress bar */}
        <div className="w-16 h-1 bg-slate-100 rounded-full mt-0.5">
          <div
            className={`h-1 rounded-full ${colors.bar} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

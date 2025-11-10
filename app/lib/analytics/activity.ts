import type { ActivityEvent, ActivitySeverity } from '../../types/analytics';

export interface GroupedActivity {
  date: string;
  events: ActivityEvent[];
}

export const groupActivityByDay = (events: ActivityEvent[]): GroupedActivity[] => {
  const map = new Map<string, ActivityEvent[]>();
  events.forEach(event => {
    const day = event.occurredAt.slice(0, 10);
    if (!map.has(day)) {
      map.set(day, []);
    }
    map.get(day)?.push(event);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, grouped]) => ({
      date,
      events: grouped.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    }));
};

const severityOrder: ActivitySeverity[] = ['info', 'success', 'warning', 'critical'];

export const sortBySeverity = (events: ActivityEvent[]) => {
  return [...events].sort(
    (a, b) => severityOrder.indexOf(b.severity) - severityOrder.indexOf(a.severity)
  );
};

export const formatSeverityLabel = (severity: ActivitySeverity) => {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'warning':
      return 'Attention';
    case 'success':
      return 'Success';
    default:
      return 'Update';
  }
};

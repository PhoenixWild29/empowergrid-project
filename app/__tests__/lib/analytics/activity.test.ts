import { groupActivityByDay, sortBySeverity, formatSeverityLabel } from '../../../lib/analytics/activity';
import type { ActivityEvent } from '../../../types/analytics';

describe('activity analytics utilities', () => {
  const baseEvent = (overrides: Partial<ActivityEvent>): ActivityEvent => ({
    id: 'id',
    title: 'title',
    description: 'description',
    severity: 'info',
    category: 'impact',
    occurredAt: '2025-06-01T12:00:00.000Z',
    ...overrides,
  });

  it('groups events by day in descending order', () => {
    const groups = groupActivityByDay([
      baseEvent({ id: 'a', occurredAt: '2025-06-02T10:00:00.000Z' }),
      baseEvent({ id: 'b', occurredAt: '2025-06-01T09:00:00.000Z' }),
      baseEvent({ id: 'c', occurredAt: '2025-06-02T11:00:00.000Z' }),
    ]);

    expect(groups[0].date).toBe('2025-06-02');
    expect(groups[0].events).toHaveLength(2);
    expect(groups[0].events[0].id).toBe('c');
    expect(groups[1].date).toBe('2025-06-01');
  });

  it('sorts events by severity weight', () => {
    const sorted = sortBySeverity([
      baseEvent({ severity: 'info', id: 'info' }),
      baseEvent({ severity: 'critical', id: 'critical' }),
      baseEvent({ severity: 'warning', id: 'warning' }),
    ]);

    expect(sorted.map(event => event.id)).toEqual(['critical', 'warning', 'info']);
  });

  it('formats severity labels', () => {
    expect(formatSeverityLabel('critical')).toBe('Critical');
    expect(formatSeverityLabel('warning')).toBe('Attention');
    expect(formatSeverityLabel('success')).toBe('Success');
    expect(formatSeverityLabel('info')).toBe('Update');
  });
});

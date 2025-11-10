import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { prisma } from '../../../lib/prisma';
import type { ActivityEvent, ActivitySeverity, ActivityCategory } from '../../../types/analytics';

const fallbackActivity: ActivityEvent[] = [
  {
    id: nanoid(),
    title: 'Escrow release completed',
    description: 'Milestone 3 for Bronx Community Solar released 42 SOL to developer treasury.',
    severity: 'success',
    category: 'milestone',
    occurredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    metadata: {
      transaction: '8ye3...FqP',
      projectId: 'proj-101',
    },
  },
  {
    id: nanoid(),
    title: 'Validator SLA breach',
    description: 'SolarGuard Africa exceeded 48h SLA on Lagos Microgrid Expansion milestone.',
    severity: 'warning',
    category: 'milestone',
    occurredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    metadata: {
      validator: 'SolarGuard Africa',
      milestoneId: 'milestone-002',
    },
  },
  {
    id: nanoid(),
    title: 'Governance vote required',
    description: 'Treasury reallocation proposal closes in 18 hours. 12% quorum remaining.',
    severity: 'critical',
    category: 'governance',
    occurredAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    metadata: {
      proposalId: 'prop-204',
    },
  },
  {
    id: nanoid(),
    title: 'Impact metrics updated',
    description: 'Yucatán Solar Schools reported +5.4% energy production this week.',
    severity: 'info',
    category: 'impact',
    occurredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const mapSeverity = (value: string | undefined): ActivitySeverity => {
  switch ((value ?? 'info').toLowerCase()) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'warning';
    case 'success':
      return 'success';
    default:
      return 'info';
  }
};

const mapCategory = (value: string | undefined): ActivityCategory => {
  switch ((value ?? 'impact').toLowerCase()) {
    case 'funding':
      return 'funding';
    case 'milestone':
      return 'milestone';
    case 'governance':
      return 'governance';
    default:
      return 'impact';
  }
};

const toPrismaSeverity = (value: string) => mapSeverity(value).toUpperCase();
const toPrismaCategory = (value: string) => mapCategory(value).toUpperCase();

const mapEventResponse = (event: any): ActivityEvent => ({
  id: event.id,
  title: event.title,
  description: event.description,
  severity: mapSeverity(event.severity),
  category: mapCategory(event.category),
  occurredAt: event.occurredAt instanceof Date ? event.occurredAt.toISOString() : event.occurredAt,
  metadata: event.metadata ?? undefined,
  acknowledgedAt: event.acknowledgedAt ? event.acknowledgedAt.toISOString?.() ?? event.acknowledgedAt : undefined,
});

async function ensureSeedActivity() {
  if (!prisma) return;
  const existing = await prisma.activityEvent.count();
  if (existing === 0) {
    await prisma.activityEvent.createMany({
      data: fallbackActivity.map(event => ({
        title: event.title,
        description: event.description,
        severity: toPrismaSeverity(event.severity) as any,
        category: toPrismaCategory(event.category) as any,
        occurredAt: new Date(event.occurredAt),
        metadata: event.metadata ?? undefined,
      })),
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const cursor = req.query.cursor as string | undefined;
    const category = req.query.category as string | undefined;

    if (!prisma) {
      const events = category
        ? fallbackActivity.filter(event => event.category === mapCategory(category))
        : fallbackActivity;
      return res.status(200).json({ success: true, events, nextCursor: null });
    }

    await ensureSeedActivity();

    const where = category ? { category: toPrismaCategory(category) as any } : undefined;

    const records = await prisma.activityEvent.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { occurredAt: 'desc' },
    });

    const hasMore = records.length > limit;
    const trimmed = hasMore ? records.slice(0, limit) : records;
    const nextCursor = hasMore ? records[limit].id : null;

    return res.status(200).json({
      success: true,
      events: trimmed.map(mapEventResponse),
      nextCursor,
    });
  }

  if (req.method === 'POST') {
    const { title, description, severity, category, metadata, occurredAt } = req.body ?? {};
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'title and description required' });
    }

    const event: ActivityEvent = {
      id: nanoid(),
      title,
      description,
      severity: mapSeverity(severity),
      category: mapCategory(category),
      occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
      metadata,
    };

    if (!prisma) {
      fallbackActivity.unshift(event);
      return res.status(201).json({ success: true, event });
    }

    const created = await prisma.activityEvent.create({
      data: {
        title: event.title,
        description: event.description,
        severity: toPrismaSeverity(event.severity) as any,
        category: toPrismaCategory(event.category) as any,
        occurredAt: new Date(event.occurredAt),
        metadata: event.metadata ?? undefined,
      },
    });

    return res.status(201).json({ success: true, event: mapEventResponse(created) });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

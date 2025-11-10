import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import type { NotificationPreferences } from '../../../types/analytics';

const defaultChannels = {
  inApp: true,
  email: false,
  webhook: false,
};

const fallbackStore: Record<string, NotificationPreferences> = {};

const normalizeCategory = (value: string) => {
  switch ((value ?? '').toLowerCase()) {
    case 'funding':
      return 'funding';
    case 'milestone':
      return 'milestone';
    case 'governance':
      return 'governance';
    case 'impact':
    default:
      return 'impact';
  }
};

const toUpperCategory = (value: string) => normalizeCategory(value).toUpperCase();

const mapPreferenceResponse = (record: any): NotificationPreferences => ({
  channels: { ...defaultChannels, ...(record?.channels ?? {}) },
  categories: Array.isArray(record?.categories)
    ? record.categories.map(normalizeCategory)
    : ['funding', 'milestone', 'governance', 'impact'],
  updatedAt: record?.updatedAt instanceof Date ? record.updatedAt.toISOString() : new Date().toISOString(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body ?? {};
  const userId = (req as any)?.user?.id ?? body.userId ?? 'anonymous';
  const mergedChannels = { ...defaultChannels, ...(body.channels ?? {}) };
  const categories = Array.isArray(body.categories) && body.categories.length > 0
    ? body.categories.map(normalizeCategory)
    : ['funding', 'milestone', 'governance', 'impact'];

  if (!prisma) {
    const preferences: NotificationPreferences = {
      channels: mergedChannels,
      categories,
      updatedAt: new Date().toISOString(),
    };
    fallbackStore[userId] = preferences;
    return res.status(200).json({ success: true, preferences });
  }

  const record = await prisma.notificationPreference.upsert({
    where: { userId },
    update: {
      channels: mergedChannels,
      categories: categories.map(toUpperCategory),
    },
    create: {
      userId,
      channels: mergedChannels,
      categories: categories.map(toUpperCategory),
    },
  });

  return res.status(200).json({ success: true, preferences: mapPreferenceResponse(record) });
}

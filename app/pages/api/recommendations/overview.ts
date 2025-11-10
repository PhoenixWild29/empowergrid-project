import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { prisma } from '../../../lib/prisma';
import type { RecommendationCard } from '../../../types/analytics';

const fallbackRecommendations: RecommendationCard[] = [
  {
    id: nanoid(),
    title: 'Boost validator capacity',
    summary: 'Assign GridPulse Engineering to Lagos Microgrid to clear SLA backlog.',
    actionLabel: 'Assign now',
    href: '/developers/verification',
    score: 0.82,
    category: 'developer',
  },
  {
    id: nanoid(),
    title: 'Reinvest mature escrow',
    summary: 'Your SOL balance can be redeployed into Hydro Valley Expansion with projected 7.3% yield.',
    actionLabel: 'Review project',
    href: '/projects/proj-hydro-valley',
    score: 0.77,
    category: 'investor',
  },
  {
    id: nanoid(),
    title: 'Strengthen proposal quorum',
    summary: 'Invite validators from West Africa cluster to vote on emergency upgrade proposal.',
    actionLabel: 'Send reminder',
    href: '/governance/proposals/prop-204',
    score: 0.74,
    category: 'validator',
  },
];

const toPrismaCategory = (audience?: string) => {
  switch ((audience ?? '').toLowerCase()) {
    case 'developer':
      return 'DEVELOPER';
    case 'validator':
      return 'VALIDATOR';
    case 'investor':
      return 'INVESTOR';
    default:
      return undefined;
  }
};

const mapRecommendation = (record: any): RecommendationCard => ({
  id: record.id,
  title: record.title,
  summary: record.summary,
  actionLabel: record.actionLabel,
  href: record.href,
  score: record.score ?? 0,
  category: (record.category || 'INVESTOR').toLowerCase(),
  metadata: record.metadata ?? undefined,
});

async function ensureSeedRecommendations() {
  if (!prisma) return;
  const count = await prisma.recommendationSnapshot.count();
  if (count === 0) {
    await prisma.recommendationSnapshot.createMany({
      data: fallbackRecommendations.map(card => ({
        title: card.title,
        summary: card.summary,
        actionLabel: card.actionLabel,
        href: card.href,
        score: card.score,
        category: toPrismaCategory(card.category) ?? 'INVESTOR',
        metadata: card.metadata ?? undefined,
      })),
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const audience = req.query.audience as 'investor' | 'developer' | 'validator' | undefined;

    if (!prisma) {
      const cards = audience
        ? fallbackRecommendations.filter(card => card.category === audience)
        : fallbackRecommendations;
      return res.status(200).json({ success: true, recommendations: cards });
    }

    await ensureSeedRecommendations();

    const where = audience ? { category: toPrismaCategory(audience) } : undefined;

    const records = await prisma.recommendationSnapshot.findMany({
      where,
      orderBy: { score: 'desc' },
      take: 9,
    });

    return res.status(200).json({
      success: true,
      recommendations: records.map(mapRecommendation),
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

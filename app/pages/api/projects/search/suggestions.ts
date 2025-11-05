/**
 * Project Search Suggestions API
 * 
 * GET /api/projects/search/suggestions?q=query
 * 
 * Returns autocomplete suggestions including:
 * - Recent searches
 * - Popular searches
 * - Project name matches
 * - Related terms
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
      });
    }

    // In production, implement full-text search with Elasticsearch or PostgreSQL full-text
    // For now, return mock suggestions

    const suggestions = [
      { type: 'recent', text: `${q} solar farm` },
      { type: 'popular', text: `${q} wind turbine` },
      { type: 'project', text: `Community ${q} Project`, projectId: '123' },
      { type: 'term', text: `${q} renewable energy` },
    ];

    return res.status(200).json({
      success: true,
      suggestions,
      query: q,
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch search suggestions',
    });
  }
}







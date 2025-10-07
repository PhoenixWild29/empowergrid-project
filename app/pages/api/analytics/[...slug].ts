import { NextApiRequest, NextApiResponse } from 'next';
import { analyticsService } from '../../../lib/services/analyticsService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  const [type, action] = slug as string[];

  try {
    switch (type) {
      case 'projects':
        if (action === 'export') {
          const format = (req.query.format as 'json' | 'csv') || 'json';
          const data = await analyticsService.exportAnalytics(
            'projects',
            format
          );

          if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="projects-analytics.csv"'
            );
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="projects-analytics.json"'
            );
          }

          return res.status(200).send(data);
        } else {
          const data = await analyticsService.getProjectAnalytics();
          return res.status(200).json(data);
        }

      case 'users':
        if (action === 'export') {
          const format = (req.query.format as 'json' | 'csv') || 'json';
          const data = await analyticsService.exportAnalytics('users', format);

          if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="users-analytics.csv"'
            );
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="users-analytics.json"'
            );
          }

          return res.status(200).send(data);
        } else {
          const data = await analyticsService.getUserAnalytics();
          return res.status(200).json(data);
        }

      case 'platform':
        if (action === 'export') {
          const format = (req.query.format as 'json' | 'csv') || 'json';
          const data = await analyticsService.exportAnalytics(
            'platform',
            format
          );

          if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="platform-analytics.csv"'
            );
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="platform-analytics.json"'
            );
          }

          return res.status(200).send(data);
        } else {
          const data = await analyticsService.getPlatformAnalytics();
          return res.status(200).json(data);
        }

      case 'system':
        if (action === 'export') {
          const format = (req.query.format as 'json' | 'csv') || 'json';
          const data = await analyticsService.exportAnalytics('system', format);

          if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="system-analytics.csv"'
            );
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="system-analytics.json"'
            );
          }

          return res.status(200).send(data);
        } else {
          const data = await analyticsService.getSystemAnalytics();
          return res.status(200).json(data);
        }

      case 'dashboard':
        // Return all analytics data for the dashboard
        const [projectData, userData, platformData, systemData] =
          await Promise.all([
            analyticsService.getProjectAnalytics(),
            analyticsService.getUserAnalytics(),
            analyticsService.getPlatformAnalytics(),
            analyticsService.getSystemAnalytics(),
          ]);

        return res.status(200).json({
          projects: projectData,
          users: userData,
          platform: platformData,
          system: systemData,
        });

      default:
        return res.status(404).json({ error: 'Analytics type not found' });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

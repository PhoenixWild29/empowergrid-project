/**
 * Due Diligence Page
 * 
 * WO-91: Due Diligence Center
 * Comprehensive project evaluation and analysis
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { DueDiligenceCenter } from '../../../components/due-diligence';

export default function DueDiligencePage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();
        if (data.success) {
          setProject(data.project);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse bg-gray-200 h-96 rounded"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Due Diligence Center</h1>
        <p className="text-gray-600 mb-8">{project.title}</p>
        
        <DueDiligenceCenter project={project} />
      </div>
    </Layout>
  );
}


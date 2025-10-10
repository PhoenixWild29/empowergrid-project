/**
 * Project Documents Page
 * 
 * WO-106: Document Management Interface
 */

import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { DocumentManagement } from '../../../components/documents';

export default function ProjectDocumentsPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <DocumentManagement projectId={id as string} />
      </div>
    </Layout>
  );
}


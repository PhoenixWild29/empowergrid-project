/**
 * Enhanced Project Creation Page
 * 
 * Uses the new Multi-Step Project Form architecture from WO#56
 * with React Hook Form integration and auto-save functionality
 */

import React from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { MultiStepProjectForm, ProjectFormData } from '../../components/MultiStepForm';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateEnhancedProjectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Handle form submission
  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.projectName,
          description: data.description,
          location: data.location,
          category: data.projectType,
          tags: [],
          energyCapacity: data.energyCapacity,
          targetAmount: data.fundingTarget,
          milestoneCount: data.milestones.length,
          duration: data.fundingTimeline,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }

      const result = await response.json();
      
      // Redirect to project details
      router.push(`/projects/${result.project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/projects');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div>
      <MultiStepProjectForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        draftKey={`project_creation_${user.id}`}
      />
    </div>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  // In a real implementation, you would check authentication here
  // For now, we'll let the client-side handle it
  return {
    props: {},
  };
};







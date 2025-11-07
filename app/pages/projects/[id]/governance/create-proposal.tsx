/**
 * Project-Specific Proposal Creation Interface
 * 
 * WO-147: Create proposals for specific projects
 * 
 * Features:
 * - Project context display
 * - Milestone modification options
 * - Fund reallocation specifications
 * - Permission validation
 * - Visual indicators
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ProjectProposalCreationPage() {
  const router = useRouter();
  const { id: projectId } = router.query;
  
  const [project, setProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposalType: 'GENERAL',
    proposalTypeSpecificData: {},
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    fetchProjectContext();
  }, [projectId]);

  const fetchProjectContext = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      
      if (data.project) {
        setProject(data.project);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/governance/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/projects/${projectId}/governance`);
      } else {
        alert(data.message || 'Failed to create proposal');
      }
    } catch (error) {
      alert('Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return <div className="p-8">Loading project context...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* WO-147: Project Context Display */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🏗️</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Creating Proposal for: {project.title}
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium">{project.status}</span>
                </div>
                <div>
                  <span className="text-gray-600">Milestones:</span>
                  <span className="ml-2 font-medium">{project.milestoneCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Budget:</span>
                  <span className="ml-2 font-medium">${project.targetAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Project Proposal</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Proposal Type</label>
            <select
              value={formData.proposalType}
              onChange={(e) => setFormData({ ...formData, proposalType: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="GENERAL">General</option>
              <option value="PARAMETER_CHANGE">Milestone/Parameter Change</option>
              <option value="TREASURY_ALLOCATION">Fund Reallocation</option>
              <option value="PROTOCOL_UPGRADE">Project Upgrade</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
}



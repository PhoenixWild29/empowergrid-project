import { Project, Milestone } from '../../types/program';

interface ProjectStatusCardProps {
  project: Project;
  milestones: Milestone[];
  onViewDetails: (projectId: number) => void;
}

export default function ProjectStatusCard({
  project,
  milestones,
  onViewDetails
}: ProjectStatusCardProps) {
  const completedMilestones = milestones.filter(m => m.released).length;
  const totalMilestones = milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // Determine project status based on milestones and funding
  const getProjectStatus = () => {
    if (completedMilestones === totalMilestones && totalMilestones > 0) return 'completed';
    if (project.fundedAmount > 0) return 'funded';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'funded': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const status = getProjectStatus();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completedMilestones}/{totalMilestones} milestones</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Funding Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Raised</span>
            <div className="font-semibold text-gray-900">
              {(project.fundedAmount / 1_000_000_000).toLocaleString()} SOL
            </div>
          </div>
          <div>
            <span className="text-gray-600">Target</span>
            <div className="font-semibold text-gray-900">
              {milestones.reduce((total, m) => total + (m.amountLamports / 1_000_000_000), 0).toLocaleString()} SOL
            </div>
          </div>
        </div>

        {/* Next Milestone */}
        {milestones.length > 0 && (
          <div>
            <span className="text-sm text-gray-600">Next Milestone</span>
            <div className="text-sm font-medium text-gray-900">
              Milestone {milestones.find(m => !m.released)?.index || 'All milestones completed'}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onViewDetails(project.id)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
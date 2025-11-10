import { render, screen } from '@testing-library/react';
import EnhancedProjectCard, {
  EnhancedProjectSummary,
} from '../../../components/projects/EnhancedProjectCard';

describe('EnhancedProjectCard', () => {
  const baseProject: EnhancedProjectSummary = {
    id: 'proj-1',
    title: 'Solar Microgrid Alpha',
    description: 'Community-owned solar installation powering rural health clinics.',
    category: 'Solar',
    status: 'ACTIVE',
    location: 'Bronx, NY',
    targetAmount: 5000000,
    currentAmount: 3250000,
    fundingProgress: 65,
    milestoneCount: 5,
    energyCapacity: 1.5,
    annualYield: 7.2,
    co2Offset: 420.5,
    householdsPowered: 480,
    creator: {
      username: 'Sunrise Cooperative',
      reputation: 92,
    },
    funderCount: 128,
    createdAt: new Date('2025-01-04').toISOString(),
  };

  it('renders core fields and computed metrics', () => {
    render(<EnhancedProjectCard project={baseProject} />);

    expect(screen.getByRole('heading', { name: /Solar Microgrid Alpha/i })).toBeInTheDocument();
    expect(screen.getByText(/Community-owned solar installation/i)).toBeInTheDocument();

    // Impact metrics
    expect(screen.getByText(/7.2%/i)).toBeInTheDocument();
    expect(screen.getByText(/420.5 tCO₂/i)).toBeInTheDocument();
    expect(screen.getByText(/480/i)).toBeInTheDocument();

    // Funding progress
    expect(screen.getByText(/65.0%/i)).toBeInTheDocument();
    expect(screen.getByText(/5 milestones/i)).toBeInTheDocument();
  });

  it('displays bookmark toggle when enabled', () => {
    const handleToggle = jest.fn();

    render(
      <EnhancedProjectCard
        project={baseProject}
        showBookmark
        isBookmarked={false}
        onBookmarkToggle={handleToggle}
      />
    );

    expect(screen.getByRole('button', { name: /save this project/i })).toBeInTheDocument();
  });
});

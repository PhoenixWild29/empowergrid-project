import { render, screen } from '@testing-library/react';
import { ProjectAnalyticsChart } from '../../../components/analytics/ProjectAnalyticsChart';

describe('ProjectAnalyticsChart', () => {
  const mockData = {
    totalProjects: 150,
    activeProjects: 120,
    fundedProjects: 95,
    completedProjects: 45,
    totalFunding: 2500000,
    averageFunding: 26315.79,
    fundingByCategory: {
      'Technology': 800000,
      'Environment': 600000,
      'Education': 500000,
      'Healthcare': 400000,
      'Arts': 200000,
    },
    projectsByStatus: {
      'draft': 30,
      'active': 75,
      'funded': 35,
      'completed': 10,
    },
    fundingTrends: [
      { date: '2024-01-01', amount: 50000, projectCount: 5 },
      { date: '2024-01-02', amount: 75000, projectCount: 8 },
      { date: '2024-01-03', amount: 60000, projectCount: 6 },
    ],
    topCategories: [
      { category: 'Technology', projectCount: 45, totalFunding: 800000 },
      { category: 'Environment', projectCount: 30, totalFunding: 600000 },
      { category: 'Education', projectCount: 25, totalFunding: 500000 },
    ],
  };

  test('should render project overview cards with correct data', () => {
    render(<ProjectAnalyticsChart data={mockData} />);

    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();

    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    expect(screen.getByText('Funded Projects')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();

    // Check for total funding card (not table header)
    const totalFundingCard = screen.getByText('$2,500,000');
    expect(totalFundingCard).toBeInTheDocument();
  });

  test('should render funding trends chart', () => {
    render(<ProjectAnalyticsChart data={mockData} />);

    expect(screen.getByText('Funding Trends (Last 30 Days)')).toBeInTheDocument();
    expect(screen.getByText('Daily funding amounts')).toBeInTheDocument();
    expect(screen.getByText('Average: $26,316')).toBeInTheDocument();
  });

  test('should render category distribution', () => {
    render(<ProjectAnalyticsChart data={mockData} />);

    expect(screen.getByText('Funding by Category')).toBeInTheDocument();
    // Just check that categories are present (they appear in both chart and table)
    expect(screen.getAllByText(/Technology|Environment|Education/)).toBeTruthy();
  });

  test('should render project status distribution', () => {
    render(<ProjectAnalyticsChart data={mockData} />);

    expect(screen.getByText('Project Status Distribution')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('funded')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  test('should render top categories table', () => {
    render(<ProjectAnalyticsChart data={mockData} />);

    expect(screen.getByText('Top Categories')).toBeInTheDocument();

    // Check table headers exist
    expect(screen.getByRole('columnheader', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /projects/i })).toBeInTheDocument();

    // Check that table has data rows
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  test('should handle empty data gracefully', () => {
    const emptyData = {
      totalProjects: 0,
      activeProjects: 0,
      fundedProjects: 0,
      completedProjects: 0,
      totalFunding: 0,
      averageFunding: 0,
      fundingByCategory: {},
      projectsByStatus: {},
      fundingTrends: [],
      topCategories: [],
    };

    render(<ProjectAnalyticsChart data={emptyData} />);

    // Should still render the sections even with empty data
    expect(screen.getByText('Funding Trends (Last 30 Days)')).toBeInTheDocument();
    expect(screen.getByText('Funding by Category')).toBeInTheDocument();
    expect(screen.getByText('Top Categories')).toBeInTheDocument();
  });
});
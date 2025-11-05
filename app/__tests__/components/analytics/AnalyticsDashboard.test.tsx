import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { AnalyticsDashboard } from '../../../components/analytics/AnalyticsDashboard';

// Mock the analytics service
const mockGetProjectAnalytics = jest.fn();
const mockGetUserAnalytics = jest.fn();
const mockGetPlatformAnalytics = jest.fn();
const mockGetSystemAnalytics = jest.fn();
const mockExportAnalytics = jest.fn();

jest.mock('../../../lib/services/analyticsService', () => ({
  analyticsService: {
    getProjectAnalytics: () => mockGetProjectAnalytics(),
    getUserAnalytics: () => mockGetUserAnalytics(),
    getPlatformAnalytics: () => mockGetPlatformAnalytics(),
    getSystemAnalytics: () => mockGetSystemAnalytics(),
    exportAnalytics: (...args: any[]) => mockExportAnalytics(...args),
  },
}));

// Import the mocked service to access the mocks
import { analyticsService } from '../../../lib/services/analyticsService';

// Mock chart components
jest.mock('../../../components/analytics/ProjectAnalyticsChart', () => ({
  ProjectAnalyticsChart: ({ data }: { data: any }) => (
    <div data-testid="project-analytics-chart">Project Chart: {data.totalProjects} projects</div>
  ),
}));

jest.mock('../../../components/analytics/UserAnalyticsChart', () => ({
  UserAnalyticsChart: ({ data }: { data: any }) => (
    <div data-testid="user-analytics-chart">User Chart: {data.totalUsers} users</div>
  ),
}));

jest.mock('../../../components/analytics/PlatformAnalyticsChart', () => ({
  PlatformAnalyticsChart: ({ data }: { data: any }) => (
    <div data-testid="platform-analytics-chart">Platform Chart: ${data.totalVolume} volume</div>
  ),
}));

jest.mock('../../../components/analytics/SystemAnalyticsChart', () => ({
  SystemAnalyticsChart: ({ data }: { data: any }) => (
    <div data-testid="system-analytics-chart">System Chart: {data.uptime}% uptime</div>
  ),
}));

// Mock OracleHealthDashboard
jest.mock('../../../components/oracles/OracleHealthDashboard', () => ({
  OracleHealthDashboard: () => (
    <div data-testid="oracle-health-dashboard">Oracle Health Dashboard</div>
  ),
}));

// Mock MetricCard
jest.mock('../../../components/analytics/MetricCard', () => ({
  MetricCard: ({ title, value, icon, trend, color }: any) => (
    <div data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div>{icon}</div>
      <div>{title}</div>
      <div>{value}</div>
      <div>{trend}</div>
    </div>
  ),
}));

// Mock UI components
jest.mock('../../../components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('../../../components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: { children: React.ReactNode; defaultValue?: string }) => (
    <div data-testid="tabs" data-default-value={defaultValue} role="tablist">{children}</div>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`tab-content-${value}`} role="tabpanel">{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list" role="tablist">{children}</div>
  ),
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button data-testid={`tab-trigger-${value}`} data-value={value} role="tab">{children}</button>
  ),
}));

jest.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Download: () => <span data-testid="download-icon">Download</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">TrendingUp</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  DollarSign: () => <span data-testid="dollar-sign-icon">DollarSign</span>,
  Activity: () => <span data-testid="activity-icon">Activity</span>,
  Server: () => <span data-testid="server-icon">Server</span>,
  AlertTriangle: () => <span data-testid="alert-triangle-icon">AlertTriangle</span>,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock document.createElement for anchor tags in export functionality
// This is set up per test to avoid interfering with React's DOM creation
const setupExportMocks = () => {
  const originalCreateElement = document.createElement.bind(document);
  const originalAppendChild = document.body.appendChild.bind(document.body);
  const originalRemoveChild = document.body.removeChild.bind(document.body);
  
  const mockAnchor = {
    href: '',
    download: '',
    click: jest.fn(),
    style: {},
  };

  const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'a') {
      return mockAnchor as any;
    }
    return originalCreateElement(tagName);
  });

  // Mock appendChild and removeChild to accept the mock anchor
  const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
    return node; // Just return the node
  });
  const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node: any) => {
    return node; // Just return the node
  });

  return { mockAnchor, createElementSpy, appendChildSpy, removeChildSpy };
};

describe('AnalyticsDashboard', () => {
  const mockProjectAnalytics = {
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
    ],
    topCategories: [
      { category: 'Technology', projectCount: 45, totalFunding: 800000 },
      { category: 'Environment', projectCount: 30, totalFunding: 600000 },
    ],
  };

  const mockUserAnalytics = {
    totalUsers: 1250,
    activeUsers: 980,
    verifiedUsers: 890,
    newUsersToday: 12,
    newUsersThisWeek: 67,
    newUsersThisMonth: 234,
    userGrowth: [
      { date: '2024-01-01', count: 50, cumulative: 1000 },
      { date: '2024-01-02', count: 45, cumulative: 1045 },
    ],
    topFunders: [
      { userId: '1', username: 'alice', totalFunded: 150000, projectsFunded: 12 },
      { userId: '2', username: 'bob', totalFunded: 120000, projectsFunded: 10 },
    ],
    topCreators: [
      { userId: '3', username: 'charlie', projectsCreated: 8, totalRaised: 200000, successRate: 0.75 },
    ],
    reputationDistribution: [
      { range: '0-100', count: 200 },
      { range: '101-500', count: 450 },
      { range: '501-1000', count: 300 },
      { range: '1000+', count: 150 },
    ],
  };

  const mockPlatformAnalytics = {
    totalVolume: 8500000,
    monthlyVolume: [
      { month: '2024-01', volume: 2500000, transactions: 1800 },
      { month: '2024-02', volume: 2800000, transactions: 1950 },
    ],
    averageProjectDuration: 45,
    fundingSuccessRate: 0.72,
    averageTimeToFund: 12,
    geographicDistribution: [
      { region: 'North America', projectCount: 45, totalFunding: 3200000 },
      { region: 'Europe', projectCount: 32, totalFunding: 2800000 },
    ],
    hourlyActivity: [
      { hour: 9, activity: 120 },
      { hour: 10, activity: 145 },
      { hour: 11, activity: 160 },
    ],
  };

  const mockSystemAnalytics = {
    uptime: 99.7,
    responseTime: {
      average: 245,
      p95: 450,
      p99: 800,
    },
    errorRate: 0.3,
    memoryUsage: {
      heapUsed: 45000000,
      heapTotal: 65000000,
      external: 1200000,
    },
    databaseConnections: 15,
    apiRequests: {
      total: 125000,
      byEndpoint: {
        '/api/projects': 45000,
        '/api/users': 32000,
        '/api/funding': 28000,
      },
      byMethod: {
        GET: 85000,
        POST: 35000,
        PUT: 4000,
        DELETE: 1000,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Don't restore all mocks here - it would restore document.createElement spy
    // jest.restoreAllMocks();

    // Setup default successful mocks
    mockGetProjectAnalytics.mockResolvedValue(mockProjectAnalytics);
    mockGetUserAnalytics.mockResolvedValue(mockUserAnalytics);
    mockGetPlatformAnalytics.mockResolvedValue(mockPlatformAnalytics);
    mockGetSystemAnalytics.mockResolvedValue(mockSystemAnalytics);
    mockExportAnalytics.mockResolvedValue('{"test": "data"}');
  });

  afterEach(() => {
    // Cleanup React Testing Library's rendered components
    cleanup();
    // Clear all mocks and restore spies
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    test('should display loading spinner initially', async () => {
      // Make promises never resolve to keep loading state
      mockGetProjectAnalytics.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      mockGetUserAnalytics.mockImplementation(
        () => new Promise(() => {})
      );
      mockGetPlatformAnalytics.mockImplementation(
        () => new Promise(() => {})
      );
      mockGetSystemAnalytics.mockImplementation(
        () => new Promise(() => {})
      );

      await act(async () => {
        render(<AnalyticsDashboard />);
        // Wait a tick for useEffect to run
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should show loading spinner immediately
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Analytics Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('should display error message when analytics loading fails', async () => {
      mockGetProjectAnalytics.mockRejectedValue(new Error('API Error'));
      mockGetUserAnalytics.mockResolvedValue(mockUserAnalytics);
      mockGetPlatformAnalytics.mockResolvedValue(mockPlatformAnalytics);
      mockGetSystemAnalytics.mockResolvedValue(mockSystemAnalytics);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('should retry loading when try again button is clicked', async () => {
      const user = userEvent.setup();

      mockGetProjectAnalytics
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockProjectAnalytics);
      mockGetUserAnalytics.mockResolvedValue(mockUserAnalytics);
      mockGetPlatformAnalytics.mockResolvedValue(mockPlatformAnalytics);
      mockGetSystemAnalytics.mockResolvedValue(mockSystemAnalytics);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
      }, { timeout: 3000 });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Successful Data Loading', () => {
    test('should display dashboard title and description', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('Comprehensive insights into platform performance and user engagement')).toBeInTheDocument();
    });

    test('should display metric cards with correct data', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check metric cards
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument(); // totalProjects
      expect(screen.getByText('63.3% funded')).toBeInTheDocument(); // funded percentage

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1250')).toBeInTheDocument(); // totalUsers (not formatted)
      expect(screen.getByText('234 new this month')).toBeInTheDocument();

      expect(screen.getByText('Total Funding')).toBeInTheDocument();
      expect(screen.getByText('$2,500,000')).toBeInTheDocument(); // totalFunding
      // Average funding may be formatted differently, check for the approximate value
      expect(screen.getByText(/26,3\d{2}\.\d{2} avg per project/)).toBeInTheDocument();

      expect(screen.getByText('System Uptime')).toBeInTheDocument();
      expect(screen.getByText('99.7h')).toBeInTheDocument(); // uptime
      expect(screen.getByText('0.30% error rate')).toBeInTheDocument();
    });

    test('should display export buttons', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByRole('button', { name: /export projects/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export users/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export platform/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export system/i })).toBeInTheDocument();
    });

    test('should display tabs for different analytics sections', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByRole('tab', { name: /projects/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /platform/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /system/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /oracles/i })).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    test('should export project analytics when export button is clicked', async () => {
      const user = userEvent.setup();

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      const exportButton = screen.getByRole('button', { name: /export projects/i });
      await user.click(exportButton);

      expect(mockExportAnalytics).toHaveBeenCalledWith('projects', 'json');
    });

    test('should create and trigger download link for export', async () => {
      const user = userEvent.setup();

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Set up export mocks AFTER the component has rendered
      const { mockAnchor } = setupExportMocks();

      const exportButton = screen.getByRole('button', { name: /export users/i });
      await user.click(exportButton);

      // Wait for the async export to complete
      await waitFor(() => {
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchor.click).toHaveBeenCalled();
      }, { timeout: 3000 });

      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    test('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockExportAnalytics.mockRejectedValue(new Error('Export failed'));

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      const exportButton = screen.getByRole('button', { name: /export platform/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error exporting data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Tab Navigation', () => {
    test('should display projects tab content by default', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('Project Analytics')).toBeInTheDocument();
      expect(screen.getByText('Detailed insights into project performance, funding trends, and category distribution')).toBeInTheDocument();
    });

    test('should switch to users tab when clicked', async () => {
      const user = userEvent.setup();

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      const usersTab = screen.getByRole('tab', { name: /users/i });
      await user.click(usersTab);

      await waitFor(() => {
        expect(screen.getByText('User Analytics')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('should switch to platform tab when clicked', async () => {
      const user = userEvent.setup();

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      const platformTab = screen.getByRole('tab', { name: /platform/i });
      await user.click(platformTab);

      await waitFor(() => {
        expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('should switch to system tab when clicked', async () => {
      const user = userEvent.setup();

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      const systemTab = screen.getByRole('tab', { name: /system/i });
      await user.click(systemTab);

      await waitFor(() => {
        expect(screen.getByText('System Analytics')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('should switch to oracles tab when clicked', async () => {
      const user = userEvent.setup();

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });

      const oraclesTab = screen.getByRole('tab', { name: /oracles/i });
      await user.click(oraclesTab);

      // Should render OracleHealthDashboard component
      await waitFor(() => {
        expect(screen.getByText('Oracle Health Dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Data Integration', () => {
    test('should call all analytics services on mount', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(mockGetProjectAnalytics).toHaveBeenCalled();
        expect(mockGetUserAnalytics).toHaveBeenCalled();
        expect(mockGetPlatformAnalytics).toHaveBeenCalled();
        expect(mockGetSystemAnalytics).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    test('should handle partial data loading failures', async () => {
      mockGetProjectAnalytics.mockRejectedValue(new Error('Project API failed'));
      mockGetUserAnalytics.mockResolvedValue(mockUserAnalytics);
      mockGetPlatformAnalytics.mockResolvedValue(mockPlatformAnalytics);
      mockGetSystemAnalytics.mockResolvedValue(mockSystemAnalytics);

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Basic Rendering', () => {
    test('should render loading state initially', async () => {
      // Reset mocks to never resolve for this test
      mockGetProjectAnalytics.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      mockGetUserAnalytics.mockImplementation(
        () => new Promise(() => {})
      );
      mockGetPlatformAnalytics.mockImplementation(
        () => new Promise(() => {})
      );
      mockGetSystemAnalytics.mockImplementation(
        () => new Promise(() => {})
      );

      await act(async () => {
        render(<AnalyticsDashboard />);
        // Wait a tick for useEffect to run
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should show loading spinner immediately
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});
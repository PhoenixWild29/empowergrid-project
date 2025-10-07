import { render, screen } from '@testing-library/react';
import { MetricCard } from '../../../components/analytics/MetricCard';

// Mock UI components
jest.mock('../../../components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: '1,234',
    icon: <span data-testid="test-icon">Icon</span>,
    color: 'blue' as const,
  };

  test('should render title, value, and icon', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  test('should render trend when provided', () => {
    const trend = '+12% from last month';
    render(<MetricCard {...defaultProps} trend={trend} />);

    expect(screen.getByText(trend)).toBeInTheDocument();
  });

  test('should not render trend when not provided', () => {
    render(<MetricCard {...defaultProps} />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  test('should apply correct color classes for blue', () => {
    render(<MetricCard {...defaultProps} color="blue" />);

    const iconContainer = screen.getByTestId('test-icon').parentElement;
    expect(iconContainer).toHaveClass('text-blue-600', 'bg-blue-50');
  });

  test('should apply correct color classes for green', () => {
    render(<MetricCard {...defaultProps} color="green" />);

    const iconContainer = screen.getByTestId('test-icon').parentElement;
    expect(iconContainer).toHaveClass('text-green-600', 'bg-green-50');
  });

  test('should apply correct color classes for yellow', () => {
    render(<MetricCard {...defaultProps} color="yellow" />);

    const iconContainer = screen.getByTestId('test-icon').parentElement;
    expect(iconContainer).toHaveClass('text-yellow-600', 'bg-yellow-50');
  });

  test('should apply correct color classes for purple', () => {
    render(<MetricCard {...defaultProps} color="purple" />);

    const iconContainer = screen.getByTestId('test-icon').parentElement;
    expect(iconContainer).toHaveClass('text-purple-600', 'bg-purple-50');
  });

  test('should apply correct color classes for red', () => {
    render(<MetricCard {...defaultProps} color="red" />);

    const iconContainer = screen.getByTestId('test-icon').parentElement;
    expect(iconContainer).toHaveClass('text-red-600', 'bg-red-50');
  });

  test('should render numeric value correctly', () => {
    render(<MetricCard {...defaultProps} value={1234} />);

    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  test('should render string value correctly', () => {
    render(<MetricCard {...defaultProps} value="$5,678" />);

    expect(screen.getByText('$5,678')).toBeInTheDocument();
  });

  test('should have proper accessibility structure', () => {
    render(<MetricCard {...defaultProps} />);

    // Check that the component has proper semantic structure
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });
});
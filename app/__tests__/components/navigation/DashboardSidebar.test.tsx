import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';

import { DashboardSidebar } from '../../../components/navigation/DashboardSidebar';
import { UserRole } from '../../../types/auth';

const mockUseAuth = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const baseRouter = { pathname: '/dashboard' };

describe('DashboardSidebar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useRouter as jest.Mock).mockReturnValue(baseRouter);
  });

  it('renders base navigation for investors', () => {
    mockUseAuth.mockReturnValue({ user: { role: UserRole.INVESTOR } });

    render(<DashboardSidebar />);

    expect(screen.getByText('Home Overview')).toBeInTheDocument();
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Milestone Updates')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Impact Report')).toBeInTheDocument();
    expect(screen.getByText('Settings & Security')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('shows developer links when user has developer role', () => {
    mockUseAuth.mockReturnValue({ user: { role: UserRole.DEVELOPER } });

    render(<DashboardSidebar />);

    expect(screen.getByText('My Projects')).toBeInTheDocument();
    expect(screen.getByText('Create Project Wizard')).toBeInTheDocument();
    expect(screen.getByText('Verification Hub')).toBeInTheDocument();
    expect(screen.getByText('Governance Actions')).toBeInTheDocument();
  });

  it('toggles mobile menu state', () => {
    mockUseAuth.mockReturnValue({ user: { role: UserRole.INVESTOR } });

    render(<DashboardSidebar />);

    const toggleButton = screen.getByRole('button', { name: /dashboard menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';

import { TopNav } from '../../../components/navigation/TopNav';

jest.mock('../../../components/WalletConnect', () => () => <div data-testid='wallet-connect'>Wallet</div>);

const mockUseAuth = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('TopNav', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders primary navigation and call-to-action for guests', () => {
    (useRouter as jest.Mock).mockReturnValue({ pathname: '/' });
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    render(<TopNav />);

    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Impact Dashboard')).toBeInTheDocument();
    expect(screen.getByText('For Developers')).toBeInTheDocument();
    expect(screen.getByText('Governance')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/select language/i)).toBeInTheDocument();
    expect(screen.getByText('Join EmpowerGrid')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-connect')).toBeInTheDocument();
  });

  it('shows profile link when user is authenticated', () => {
    (useRouter as jest.Mock).mockReturnValue({ pathname: '/impact' });
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    render(<TopNav />);

    expect(screen.getByText('My Profile')).toBeInTheDocument();
    const impactLink = screen.getByText('Impact Dashboard');
    expect(impactLink).toHaveAttribute('aria-current', 'page');
  });

  it('toggles mobile menu', () => {
    (useRouter as jest.Mock).mockReturnValue({ pathname: '/' });
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    render(<TopNav />);

    const toggle = screen.getByRole('button', { name: /toggle navigation/i });
    fireEvent.click(toggle);
    expect(screen.getByRole('navigation', { name: /mobile primary/i })).toBeInTheDocument();
  });
});

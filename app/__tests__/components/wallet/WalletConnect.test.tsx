import { render, screen } from '@testing-library/react';
import WalletConnect from '../../../components/WalletConnect';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleError: jest.fn() }),
}));

describe('WalletConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).solana = undefined;
  });

  it('shows install guidance when Phantom is missing', async () => {
    render(<WalletConnect />);

    expect(screen.getByText(/Wallet readiness/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Install Phantom/i })).toBeInTheDocument();
    expect(await screen.findByText(/Install Phantom for your browser/i)).toBeInTheDocument();
  });

  it('renders connect button when Phantom is detected', () => {
    (window as any).solana = {
      isPhantom: true,
      on: jest.fn(),
      off: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    render(<WalletConnect />);

    expect(screen.getByRole('button', { name: /Connect wallet/i })).toBeInTheDocument();
  });
});

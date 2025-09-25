import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProposalModal } from '@/components/governance/CreateProposalModal';
import { ProposalType } from '@/types/governance';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', walletAddress: 'test-wallet' },
    walletAddress: 'test-wallet',
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('CreateProposalModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create proposal form', () => {
    render(
      <CreateProposalModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Create New Proposal')).toBeInTheDocument();
    expect(screen.getByText('Proposal Type')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('submits proposal successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'prop-123' } }),
    });

    render(
      <CreateProposalModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out the form - start with required fields
    fireEvent.change(screen.getByPlaceholderText('Proposal title'), {
      target: { value: 'Test Proposal' },
    });
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the proposal'), {
      target: { value: 'This is a test proposal description' },
    });
    
    // Fill project funding specific fields
    fireEvent.change(screen.getByPlaceholderText('Enter project ID'), {
      target: { value: 'project-123' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create Proposal'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/governance/proposals/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': 'test-wallet',
      },
      body: expect.any(String),
    });
  });

  it('shows error on failed submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to create proposal' }),
    });

    render(
      <CreateProposalModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out minimal form with required fields
    fireEvent.change(screen.getByPlaceholderText('Proposal title'), {
      target: { value: 'Test Proposal' },
    });
    fireEvent.change(screen.getByPlaceholderText('Detailed description of the proposal'), {
      target: { value: 'Description' },
    });
    
    // Fill required project funding fields
    fireEvent.change(screen.getByPlaceholderText('Enter project ID'), {
      target: { value: 'project-123' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Create Proposal'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create proposal')).toBeInTheDocument();
    });
  });
});
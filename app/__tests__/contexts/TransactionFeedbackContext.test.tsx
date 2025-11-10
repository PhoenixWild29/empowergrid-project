import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionFeedbackProvider, useTransactionFeedback } from '../../contexts/TransactionFeedbackContext';

const TestHarness = () => {
  const { trackTransaction, transactions } = useTransactionFeedback();

  const startSimulation = () => {
    trackTransaction({
      title: 'Test transaction',
      description: 'Simulated flow',
      simulate: true,
      successDelayMs: 50,
    });
  };

  return (
    <div>
      <button onClick={startSimulation}>start</button>
      <div data-testid='status'>{transactions[0]?.status ?? 'idle'}</div>
    </div>
  );
};

describe('TransactionFeedbackProvider', () => {
  it('moves transaction from pending to success in simulation mode', async () => {
    render(
      <TransactionFeedbackProvider>
        <TestHarness />
      </TransactionFeedbackProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText('start'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('pending');
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('success');
    });
  });
});

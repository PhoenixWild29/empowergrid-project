import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ErrorReporting from '../../components/ErrorReporting';

// Mock the error tracker
jest.mock('../../lib/monitoring/errorTracker', () => ({
  errorTracker: {
    trackError: jest.fn(),
  },
  ErrorSeverity: {
    MEDIUM: 'MEDIUM',
  },
  ErrorCategory: {
    UNKNOWN: 'UNKNOWN',
  },
}));

// Mock logger
jest.mock('../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ErrorReporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock window.navigator and window.location
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Test User Agent',
        onLine: true,
      },
      writable: true,
    });
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/test',
      },
      writable: true,
    });
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render error reporting form', () => {
    render(<ErrorReporting />);

    expect(screen.getByText('Help Us Improve')).toBeInTheDocument();
    expect(screen.getByText('Describe what happened and we\'ll work to fix it.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /what happened/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /include system information/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
  });

  it('should validate form submission - empty description', async () => {
    render(<ErrorReporting />);

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    // Form should not submit with empty description due to HTML5 validation
    expect(submitButton).toBeDisabled();
  });

  it('should submit error report successfully', async () => {
    const mockTrackError = jest.fn().mockResolvedValue(undefined);
    const mockErrorTracker = require('../../lib/monitoring/errorTracker').errorTracker;
    mockErrorTracker.trackError = mockTrackError;

    render(<ErrorReporting />);

    // Fill in the description
    const descriptionInput = screen.getByRole('textbox', { name: /what happened/i });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test error description' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });

    expect(mockTrackError).toHaveBeenCalledWith(
      expect.any(Error),
      'MEDIUM',
      'UNKNOWN',
      expect.objectContaining({
        metadata: expect.objectContaining({
          errorId: expect.stringContaining('manual_report_'),
          description: 'Test error description',
          systemInfo: expect.objectContaining({
            userAgent: 'Test User Agent',
            url: 'http://localhost:3000/test',
            timestamp: expect.any(String),
            viewport: { width: 1920, height: 1080 },
            online: true,
          }),
        }),
        type: 'user_error_report',
      })
    );
  });

  it('should include error context when provided', async () => {
    const mockTrackError = jest.fn().mockResolvedValue(undefined);
    const mockErrorTracker = require('../../lib/monitoring/errorTracker').errorTracker;
    mockErrorTracker.trackError = mockTrackError;

    const errorContext = {
      component: 'TestComponent',
      action: 'testAction',
    };

    render(<ErrorReporting context={errorContext} />);

    // Fill in the description
    const descriptionInput = screen.getByRole('textbox', { name: /what happened/i });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test error description' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });

    expect(mockTrackError).toHaveBeenCalledWith(
      expect.any(Error),
      'MEDIUM',
      'UNKNOWN',
      expect.objectContaining({
        metadata: expect.objectContaining({
          systemInfo: expect.objectContaining({
            component: 'TestComponent',
            action: 'testAction',
          }),
        }),
      })
    );
  });

  it('should include error information when provided', async () => {
    const mockTrackError = jest.fn().mockResolvedValue(undefined);
    const mockErrorTracker = require('../../lib/monitoring/errorTracker').errorTracker;
    mockErrorTracker.trackError = mockTrackError;

    const testError = new Error('Test error');
    testError.name = 'TestError';

    render(<ErrorReporting error={testError} errorId="test-error-123" />);

    // Fill in the description
    const descriptionInput = screen.getByRole('textbox', { name: /what happened/i });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test error description' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });

    expect(mockTrackError).toHaveBeenCalledWith(
      expect.any(Error),
      'MEDIUM',
      'UNKNOWN',
      expect.objectContaining({
        metadata: expect.objectContaining({
          errorId: 'test-error-123',
          error: {
            message: 'Test error',
            stack: testError.stack,
            name: 'TestError',
          },
        }),
      })
    );
  });

  it('should call onReportSubmitted callback when provided', async () => {
    const mockOnReportSubmitted = jest.fn();
    const mockTrackError = jest.fn().mockResolvedValue(undefined);
    const mockErrorTracker = require('../../lib/monitoring/errorTracker').errorTracker;
    mockErrorTracker.trackError = mockTrackError;

    render(<ErrorReporting onReportSubmitted={mockOnReportSubmitted} />);

    // Fill in the description
    const descriptionInput = screen.getByRole('textbox', { name: /what happened/i });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test error description' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });

    expect(mockOnReportSubmitted).toHaveBeenCalledWith(expect.stringContaining('manual_report_'));
  });

  it('should show report ID when errorId is provided', async () => {
    const mockTrackError = jest.fn().mockResolvedValue(undefined);
    const mockErrorTracker = require('../../lib/monitoring/errorTracker').errorTracker;
    mockErrorTracker.trackError = mockTrackError;

    render(<ErrorReporting errorId="test-report-456" />);

    // Fill in the description
    const descriptionInput = screen.getByRole('textbox', { name: /what happened/i });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test error description' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report ID:')).toBeInTheDocument();
      expect(screen.getByText('test-report-456')).toBeInTheDocument();
    });
  });

  it('should exclude system info when checkbox is unchecked', async () => {
    const mockTrackError = jest.fn().mockResolvedValue(undefined);
    const mockErrorTracker = require('../../lib/monitoring/errorTracker').errorTracker;
    mockErrorTracker.trackError = mockTrackError;

    render(<ErrorReporting />);

    // Uncheck the system info checkbox
    const systemInfoCheckbox = screen.getByRole('checkbox', { name: /include system information/i });
    fireEvent.click(systemInfoCheckbox);
    expect(systemInfoCheckbox).not.toBeChecked();

    // Fill in the description
    const descriptionInput = screen.getByRole('textbox', { name: /what happened/i });
    fireEvent.change(descriptionInput, {
      target: { value: 'Test error description' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });

    expect(mockTrackError).toHaveBeenCalledWith(
      expect.any(Error),
      'MEDIUM',
      'UNKNOWN',
      expect.objectContaining({
        metadata: expect.objectContaining({
          systemInfo: {}, // Should be empty object when system info is excluded
        }),
      })
    );
  });
});
/**
 * Software Factory Validator Feedback Integration
 * Project: EmpowerGRID
 * 
 * This service enables collection of user feedback, bug reports, and feature requests
 * directly from the application, sending them to the Validator dashboard.
 */

export type FeedbackType = 'bug' | 'feature_request' | 'performance' | 'other';
export type FeedbackPriority = 'low' | 'medium' | 'high';

export interface FeedbackSubmission {
  description: string;
  type?: FeedbackType;
  priority?: FeedbackPriority;
  email?: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback_id?: string;
  message: string;
}

export interface FeedbackContext {
  page?: string;
  userAgent?: string;
  timestamp?: string;
  route?: string;
}

class ValidatorFeedbackService {
  private readonly appKey = 'sf-int-KDwuxfvZF2eDGE89H7NmSa7Xl0kATsss';
  private readonly endpoint = 'https://api.factory.8090.dev/v1/integration/validator/feedback';
  private rateLimitReset: number | null = null;

  /**
   * Get current page context (route only, no full URLs for privacy)
   */
  private getContext(): FeedbackContext {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      page: window.location.pathname, // Only pathname, not full URL
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(): boolean {
    if (!this.rateLimitReset) return false;
    return Date.now() < this.rateLimitReset;
  }

  /**
   * Validate feedback data before submission
   */
  private validateFeedback(feedback: FeedbackSubmission): void {
    if (!feedback.description || feedback.description.trim().length === 0) {
      throw new Error('Feedback description is required');
    }

    if (feedback.description.length > 5000) {
      throw new Error('Feedback description is too long (max 5000 characters)');
    }

    if (feedback.email && !this.isValidEmail(feedback.email)) {
      throw new Error('Invalid email address');
    }

    const validTypes: FeedbackType[] = ['bug', 'feature_request', 'performance', 'other'];
    if (feedback.type && !validTypes.includes(feedback.type)) {
      throw new Error('Invalid feedback type');
    }

    const validPriorities: FeedbackPriority[] = ['low', 'medium', 'high'];
    if (feedback.priority && !validPriorities.includes(feedback.priority)) {
      throw new Error('Invalid priority level');
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Submit feedback to Validator
   */
  async submit(feedback: FeedbackSubmission): Promise<FeedbackResponse> {
    // Check rate limiting
    if (this.isRateLimited()) {
      const resetTime = new Date(this.rateLimitReset!).toLocaleTimeString();
      throw new Error(`Rate limit exceeded. Please try again after ${resetTime}`);
    }

    // Validate feedback
    this.validateFeedback(feedback);

    // Get context
    const context = this.getContext();

    // Prepare payload
    const payload = {
      description: `${feedback.description}\n\n---\nContext: ${context.page || 'Unknown'}\nTimestamp: ${context.timestamp}`,
      feedback_type: feedback.type || 'bug',
      priority: feedback.priority || 'medium',
      user_email: feedback.email || null,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Key': this.appKey,
        },
        body: JSON.stringify(payload),
      });

      // Handle rate limiting
      if (response.status === 429) {
        this.rateLimitReset = Date.now() + 60000; // 1 minute
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to submit feedback: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log successful submission (without sensitive data)
      console.log('✓ Feedback submitted successfully:', {
        feedback_id: result.feedback_id,
        type: feedback.type,
      });

      return result;
    } catch (error) {
      // Log error for debugging
      console.error('Validator Feedback Error:', error);

      // Network error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw error;
    }
  }

  /**
   * Submit error report automatically
   */
  async reportError(error: Error, context?: Record<string, any>): Promise<void> {
    try {
      const description = `
Automatic Error Report

Error: ${error.message}
Stack: ${error.stack || 'No stack trace available'}

${context ? `Additional Context:\n${JSON.stringify(context, null, 2)}` : ''}
      `.trim();

      await this.submit({
        description,
        type: 'bug',
        priority: 'high',
      });
    } catch (submitError) {
      // Silently fail - don't interrupt user experience
      console.error('Failed to submit error report:', submitError);
    }
  }

  /**
   * Submit performance issue
   */
  async reportPerformance(metric: string, value: number, threshold: number): Promise<void> {
    try {
      const description = `
Performance Issue Detected

Metric: ${metric}
Value: ${value}ms
Threshold: ${threshold}ms
Exceeded by: ${value - threshold}ms
      `.trim();

      await this.submit({
        description,
        type: 'performance',
        priority: value > threshold * 2 ? 'high' : 'medium',
      });
    } catch (error) {
      console.error('Failed to submit performance report:', error);
    }
  }
}

// Export singleton instance
export const validatorFeedback = new ValidatorFeedbackService();

// Export class for testing
export default ValidatorFeedbackService;


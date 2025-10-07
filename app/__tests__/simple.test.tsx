import { render, screen } from '@testing-library/react';

describe('Simple Test', () => {
  test('should render a simple div', () => {
    render(<div data-testid="simple">Hello World</div>);
    expect(screen.getByTestId('simple')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
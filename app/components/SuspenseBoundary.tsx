import React, { Suspense, ComponentType } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType | React.ReactElement;
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void; errorId: string; canReset: boolean }>;
}

const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

export const SuspenseBoundary: React.FC<SuspenseBoundaryProps> = ({
  children,
  fallback: FallbackComponent = DefaultFallback,
  errorFallback,
}) => {
  const fallbackElement = React.isValidElement(FallbackComponent)
    ? FallbackComponent
    : React.createElement(FallbackComponent as ComponentType);

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallbackElement}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default SuspenseBoundary;
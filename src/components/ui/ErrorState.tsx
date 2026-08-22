import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while trying to fetch the data. Please try again.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-border rounded-md my-4">
      <div className="p-3 bg-red-50 text-status-error rounded-full mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium text-sm rounded shadow-sm transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

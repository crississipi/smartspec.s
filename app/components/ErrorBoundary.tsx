'use client';

import React, { ReactNode, ReactElement } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { FaRotateRight } from "react-icons/fa6";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Could send to error logging service here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 px-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md w-full">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                  <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-3xl" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 max-h-32 overflow-auto">
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <FaRotateRight size={16} />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

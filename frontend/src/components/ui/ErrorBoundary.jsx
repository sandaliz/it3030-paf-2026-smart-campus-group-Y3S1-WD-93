import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="text-6xl mb-4">😵</div>
              <h2 className="card-title text-2xl mb-2">Oops! Something went wrong</h2>
              <p className="text-base-content/70 mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              
              <div className="card-actions justify-center gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={this.handleReset}
                >
                  Try Again
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-error">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-base-200 rounded text-xs overflow-auto max-h-32">
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    <pre className="mt-2">{this.state.errorInfo.componentStack}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to catch event handler errors
export const withErrorBoundary = (Component) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;

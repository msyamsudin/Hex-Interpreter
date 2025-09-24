import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

// FIX: Property 'props' does not exist on type 'ErrorBoundary'. Changed from extending the named import 'Component' to 'React.Component' to ensure correct type inheritance.
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  private handleReload = () => {
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-4 bg-black">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                <p className="text-slate-400 mb-8">An unexpected error occurred. Please try reloading the application.</p>
                <button 
                    onClick={this.handleReload}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500"
                >
                    Reload
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

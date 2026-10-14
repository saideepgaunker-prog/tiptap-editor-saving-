import React from 'react';
import TipTapEditor from './components/Editor/TipTapEditor';
import AuthPage from './components/Auth/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Editor Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
          <div className="max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-4">{this.state.error?.message || 'Unexpected editor error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reload Editor
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const { booting, isAuthenticated, user, logout } = useAuth();

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sm text-slate-500">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="w-full min-h-screen">
      <TipTapEditor
        key={user.id}
        userId={user.id}
        userEmail={user.email}
        onLogout={logout}
      />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

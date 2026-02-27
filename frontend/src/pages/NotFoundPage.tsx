import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Shield, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-primary-500/15 border border-primary-500/20 rounded-2xl mb-6">
          <Shield className="h-8 w-8 text-primary-400" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">Page not found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button icon={<ArrowLeft className="h-4 w-4" />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

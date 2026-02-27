import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Shield, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-primary-100 rounded-2xl mb-6">
          <Shield className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Page not found</h2>
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

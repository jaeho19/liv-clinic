import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <p className="font-serif text-display text-primary mb-4">404</p>
        <h1 className="text-h2 text-secondary mb-4">Page Not Found</h1>
        <p className="text-body text-mono mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="primary" size="lg">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

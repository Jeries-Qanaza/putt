import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Seo from '@/components/shared/Seo';

export default function PageNotFound() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center overflow-hidden px-6 py-10">
      <Seo title="Page Not Found" description="The page you requested could not be found." robots="noindex,follow" />
      <div className="w-full max-w-lg rounded-[2rem] border border-border/60 bg-card/95 p-8 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="text-2xl font-semibold">404</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

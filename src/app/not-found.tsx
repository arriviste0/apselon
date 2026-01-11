'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p className="text-sm text-muted-foreground">
        Sorry, the page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}

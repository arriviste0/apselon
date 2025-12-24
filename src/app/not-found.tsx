import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold mt-4">Page Not Found</h2>
      <p className="text-muted-foreground mt-2">
        Sorry, the page you are looking for does not exist.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  )
}

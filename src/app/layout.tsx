import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/components/user/user-provider';

export const metadata: Metadata = {
  title: 'Apselon',
  description: 'A job-tracking system for manufacturing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <UserProvider>
          <SidebarProvider>
            <div className="min-h-screen w-full flex-1">
              <Header />
              <TopNav />
              <div className="min-h-[calc(100svh-8rem)]">
                <SidebarInset className="flex-1">
                  <main className="py-4 pl-4 pr-0 sm:py-6 sm:pl-6 sm:pr-0 lg:py-8 lg:pl-8 lg:pr-0">
                    <div className="w-full">{children}</div>
                  </main>
                </SidebarInset>
              </div>
            </div>
          </SidebarProvider>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}


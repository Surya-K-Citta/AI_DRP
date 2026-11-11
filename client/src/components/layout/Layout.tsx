// @ts-nocheck
import React from 'react';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { Navbar } from './Navbar';
import { SkipLink } from './SkipLink';
import { useAuthStore } from '@/store/authStore';

interface LayoutProps {
  children: React.ReactNode;
  fullBleed?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, fullBleed = false }) => {
  const tf = useClusterFormText();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const railClear = isAuthenticated ? 'md:max-[1528px]:pl-[4.75rem]' : '';

  if (fullBleed) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <SkipLink />
        <Navbar />
        <main id="main-content" tabIndex={-1} className={`outline-none motion-page flex min-h-0 flex-1 flex-col overflow-hidden ${isAuthenticated ? 'md:pl-16' : ''}`}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SkipLink />
      <Navbar />
      <main id="main-content" tabIndex={-1} className={`outline-none container mx-auto px-4 py-8 max-w-7xl motion-page flex-1 ${railClear}`}>
        {children}
      </main>
      <footer className={`border-t py-4 text-center text-xs text-muted-foreground ${railClear}`}>
        <a href="/privacy" className="inline-block py-1 hover:underline">
          {tf('Privacy notice')}
        </a>
        {' · '}
        <a href="/accessibility" className="inline-block py-1 hover:underline">
          {tf('Accessibility statement')}
        </a>
        {' · '}
        {tf('AP MSME Development Corporation')}
      </footer>
    </div>
  );
};

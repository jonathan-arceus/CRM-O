import { ReactNode } from 'react';
import { CRMSidebar } from './CRMSidebar';

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <CRMSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

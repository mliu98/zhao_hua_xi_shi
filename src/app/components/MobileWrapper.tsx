import { ReactNode } from 'react';

interface MobileWrapperProps {
  children: ReactNode;
}

export function MobileWrapper({ children }: MobileWrapperProps) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#e5e5e5' }}>
      <div
        className="w-full h-full max-w-[390px] min-h-screen overflow-auto"
        style={{
          background: 'var(--paper-background)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

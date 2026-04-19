'use client';

import { ImageIcon } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <ImageIcon className="h-24 w-24 animate-pulse text-primary/50" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Yoursonal
      </h1>
      <p className="mt-2 text-muted-foreground">Loading your collection...</p>
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from 'lib/cn';
import { ScenePoster } from 'features/scene/ScenePoster';
import { AuthPanel } from './AuthPanel';
import { Chrome } from './Chrome';

export type ShellMode = 'login' | 'register' | 'home';

interface AppShellProps {
  mode: ShellMode;
  children: ReactNode;
  /** Scene layer; defaults to the static poster. */
  scene?: ReactNode;
  brand?: ReactNode;
  controls?: ReactNode;
}

export function AppShell({ mode, children, scene, brand, controls }: AppShellProps) {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div className="fixed inset-0 -z-10">{scene ?? <ScenePoster />}</div>
      {/* Ground fade keeps the bottom annotations legible over the skyline. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-night via-night/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className={cn(
          'blueprint-grid pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700',
          mode === 'register' ? 'opacity-100' : 'opacity-0',
        )}
      />

      <Chrome brand={brand} controls={controls} />

      <main className="pointer-events-none relative z-10 flex min-h-dvh flex-col sm:items-center sm:justify-center sm:px-6 lg:items-end lg:pr-[6vw]">
        <div aria-hidden="true" className="h-[40svh] shrink-0 sm:hidden" />
        <AuthPanel>{children}</AuthPanel>
      </main>
    </div>
  );
}

import { render } from '@testing-library/react';
import { configureAxe } from 'jest-axe';
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from 'app/routes';
import { AuthProvider } from 'features/auth/AuthProvider';

/** Renders the real route tree (layout, guards, pages) at `path`, like the app does. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="always">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </MotionConfig>
    </LazyMotion>,
  );
  return { router, ...view };
}

/** jsdom has no layout engine, so colour contrast is checked in the browser (axe + Lighthouse). */
export const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

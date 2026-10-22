import { LazyMotion, MotionConfig } from 'framer-motion';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from 'features/auth/AuthProvider';
import { loadMotionFeatures } from 'lib/motion';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

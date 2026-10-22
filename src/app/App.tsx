import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from 'features/auth/AuthProvider';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </MotionConfig>
    </LazyMotion>
  );
}

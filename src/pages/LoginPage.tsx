import { usePageTitle } from 'hooks/usePageTitle';
import { AuthHeader } from 'features/auth/components/AuthHeader';
import { AuthSwitch } from 'features/auth/components/AuthSwitch';

export function LoginPage() {
  usePageTitle('Sign in');

  return (
    <>
      <AuthHeader
        eyebrow="Resident access"
        lead="Welcome"
        accent="home."
        description="Sign in to switch your lights on."
      />
      <AuthSwitch prompt="New to Lumen?" to="/register" cta="Create an account" />
    </>
  );
}

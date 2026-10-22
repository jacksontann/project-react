import { usePageTitle } from 'hooks/usePageTitle';
import { AuthHeader } from 'features/auth/components/AuthHeader';
import { AuthSwitch } from 'features/auth/components/AuthSwitch';
import { RegisterForm } from 'features/auth/components/RegisterForm';

export function RegisterPage() {
  usePageTitle('Create account');

  return (
    <>
      <AuthHeader
        eyebrow="New resident"
        lead="Find your"
        accent="window."
        description="Create your resident account. Your unit lights up when you're in."
      />
      <RegisterForm />
      <AuthSwitch prompt="Already a resident?" to="/login" cta="Sign in" />
    </>
  );
}

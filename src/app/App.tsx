import { LazyMotion, MotionConfig } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AppShell } from 'components/layout/AppShell';
import { Button } from 'components/ui/Button';
import { Checkbox } from 'components/ui/Checkbox';
import { Eyebrow } from 'components/ui/Eyebrow';
import { PasswordField } from 'components/ui/PasswordField';
import { TextField } from 'components/ui/TextField';
import { loadMotionFeatures } from 'lib/motion';

export function App() {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <AppShell mode="login">
          <Eyebrow>Resident access</Eyebrow>
          <h1 className="mt-4 font-display text-[52px] leading-[0.95] tracking-[-0.01em]">
            Welcome <em className="text-lamp">home.</em>
          </h1>
          <p className="mt-3 text-ink-muted">Sign in to switch your lights on.</p>

          <form className="mt-8 space-y-5" noValidate onSubmit={(event) => event.preventDefault()}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <PasswordField label="Password" autoComplete="current-password" />
            <Checkbox label="Remember me on this device" />
            <Button type="submit" className="w-full">
              Sign in <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </AppShell>
      </MotionConfig>
    </LazyMotion>
  );
}

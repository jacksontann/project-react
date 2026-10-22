import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button, type ButtonState } from 'components/ui/Button';
import { Checkbox } from 'components/ui/Checkbox';
import { FormAlert } from 'components/ui/FormAlert';
import { PasswordField } from 'components/ui/PasswordField';
import { TextField } from 'components/ui/TextField';
import { signalSceneError, useSceneStore } from 'features/scene/sceneStore';
import { useCountdown } from 'hooks/useCountdown';
import { ApiError } from 'lib/http';
import { wait } from 'lib/wait';
import { authApi } from '../api';
import { useAuth } from '../AuthProvider';
import { DEMO_ACCOUNT } from '../demo';
import { applyServerFieldErrors } from '../formErrors';
import { loginFormSchema, type LoginFormInput, type LoginFormOutput } from '../schemas';
import { parseUnit } from '../unit';

/** How long the ✓ state holds before the session is committed and the page changes. */
const SUCCESS_HOLD_MS = 650;

export function LoginForm() {
  const { signIn } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [alert, setAlert] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<ButtonState>('idle');
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const secondsLeft = useCountdown(lockedUntil);
  const locked = secondsLeft > 0;

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<LoginFormInput, unknown, LoginFormOutput>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', remember: false },
  });

  // Lockout over: clear the notice so the form is usable again.
  useEffect(() => {
    if (lockedUntil && !locked) {
      setLockedUntil(null);
      setAlert(null);
    }
  }, [locked, lockedUntil]);

  const onSubmit = handleSubmit(async (values) => {
    if (submitState !== 'idle' || locked) return;
    const scene = useSceneStore.getState();
    setAlert(null);
    setSubmitState('loading');
    scene.emit('submitting');

    try {
      const session = await authApi.login(values);
      setSubmitState('success');
      // Your window lights up and the light ripples through the tower before the page changes.
      scene.emit('success', parseUnit(session.user.unit));
      await wait(prefersReducedMotion ? 0 : SUCCESS_HOLD_MS);
      signIn(session, values.remember);
    } catch (error) {
      setSubmitState('idle');
      scene.emit('error');
      if (!(error instanceof ApiError)) {
        setAlert('Something went wrong. Please try again.');
        return;
      }
      switch (error.code) {
        case 'TOO_MANY_ATTEMPTS': {
          const seconds = error.retryAfter ?? 30;
          setLockedUntil(Date.now() + seconds * 1000);
          setAlert(
            `Too many sign-in attempts. For your security, wait ${seconds} seconds before trying again.`,
          );
          break;
        }
        case 'INVALID_CREDENTIALS':
          setAlert(error.message);
          resetField('password');
          setFocus('password');
          break;
        case 'VALIDATION':
          if (!applyServerFieldErrors(error.fieldErrors, ['email', 'password'], setError)) {
            setAlert(error.message);
          }
          break;
        default:
          setAlert(error.message);
      }
    }
  }, signalSceneError);

  const fillDemoAccount = () => {
    setValue('email', DEMO_ACCOUNT.email, { shouldValidate: true, shouldDirty: true });
    setValue('password', DEMO_ACCOUNT.password, { shouldValidate: true, shouldDirty: true });
    setFocus('password');
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8">
      <FormAlert message={alert} />

      <div className="space-y-5">
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Checkbox label="Remember me on this device" {...register('remember')} />
      </div>

      <Button
        type="submit"
        className="mt-7 w-full"
        state={submitState}
        loadingText="Unlocking…"
        disabled={locked}
        magnetic
      >
        {locked ? (
          <span className="tabular-nums">Try again in {secondsLeft}s</span>
        ) : (
          <>
            Sign in <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="mt-4 text-center text-[13px] text-ink-faint">
        Just looking around?{' '}
        <button
          type="button"
          onClick={fillDemoAccount}
          className="rounded-sm text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-lamp"
        >
          Use the demo resident
        </button>
      </p>
    </form>
  );
}

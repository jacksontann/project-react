import { useEffect, useId, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button, type ButtonState } from 'components/ui/Button';
import { Checkbox } from 'components/ui/Checkbox';
import { FormAlert } from 'components/ui/FormAlert';
import { PasswordField } from 'components/ui/PasswordField';
import { TextField } from 'components/ui/TextField';
import { useSceneStore } from 'features/scene/sceneStore';
import { ApiError } from 'lib/http';
import { wait } from 'lib/wait';
import { authApi } from '../api';
import { useAuth } from '../AuthProvider';
import { applyServerFieldErrors } from '../formErrors';
import { useBreachCheck } from '../hooks/useBreachCheck';
import { usePasswordStrength } from '../hooks/usePasswordStrength';
import { loadStrengthEngine, strengthUserInputs, validateNewPassword } from '../passwordPolicy';
import { registrationProgress } from '../registrationProgress';
import {
  PASSWORD_MIN_LENGTH,
  registerFormSchema,
  type RegisterFormInput,
  type RegisterFormOutput,
} from '../schemas';
import { formatUnit, parseUnit } from '../unit';
import { HouseRulesDialog } from './HouseRulesDialog';
import { PasswordInsights } from './PasswordInsights';
import { UnitField } from './UnitField';

/** Hold on the ✓ state while the building "completes", then enter. */
const SUCCESS_HOLD_MS = 900;

const SERVER_FIELDS = ['name', 'email', 'unit', 'password'] as const;

export function RegisterForm() {
  const { signIn } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const insightsId = useId();
  const [alert, setAlert] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<ButtonState>('idle');
  const [rulesOpen, setRulesOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    trigger,
    getFieldState,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      unit: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const [name, email, unit, password, confirmPassword, terms] = useWatch({
    control,
    name: ['name', 'email', 'unit', 'password', 'confirmPassword', 'terms'],
  });

  const userInputs = useMemo(() => strengthUserInputs(name, email), [name, email]);
  const strength = usePasswordStrength(password, userInputs);
  const breach = useBreachCheck(password, password.length >= PASSWORD_MIN_LENGTH);
  const strengthScore = password ? (strength?.score ?? null) : null;

  // Keep "passwords don't match" honest when the first password changes after confirming.
  useEffect(() => {
    if (getFieldState('confirmPassword').isTouched) void trigger('confirmPassword');
  }, [password, getFieldState, trigger]);

  // The tower is built floor by floor as the form becomes valid; your typed unit lights up.
  const progress = registrationProgress({
    name,
    email,
    unit,
    password,
    confirmPassword,
    terms,
    strengthScore,
    breached: breach.state === 'breached',
  });
  useEffect(() => {
    useSceneStore
      .getState()
      .setRegistration({ progress, strength: strengthScore, unit: parseUnit(unit) });
  }, [progress, strengthScore, unit]);

  // Clicking a window on the tower fills in the unit.
  useEffect(() => {
    const scene = useSceneStore.getState();
    scene.setPickUnit((picked) =>
      setValue('unit', formatUnit(picked), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      }),
    );
    return () => scene.setPickUnit(null);
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    if (submitState !== 'idle') return;
    const scene = useSceneStore.getState();
    setAlert(null);
    setSubmitState('loading');
    scene.emit('submitting');

    try {
      const passwordProblem = await validateNewPassword(
        values.password,
        strengthUserInputs(values.name, values.email),
      );
      if (passwordProblem) {
        setSubmitState('idle');
        scene.emit('error');
        setError('password', { type: 'policy', message: passwordProblem }, { shouldFocus: true });
        return;
      }

      const session = await authApi.register({
        name: values.name,
        email: values.email,
        unit: values.unit,
        password: values.password,
      });
      setSubmitState('success');
      scene.emit('success', parseUnit(session.user.unit));
      await wait(prefersReducedMotion ? 0 : SUCCESS_HOLD_MS);
      signIn(session, true);
    } catch (error) {
      setSubmitState('idle');
      scene.emit('error');
      if (error instanceof ApiError) {
        const handled = applyServerFieldErrors(error.fieldErrors, SERVER_FIELDS, setError);
        if (!handled) setAlert(error.message);
      } else {
        setAlert('Something went wrong. Please try again.');
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8">
      <FormAlert message={alert} />

      <div className="space-y-5">
        <TextField
          label="Full name"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Aisyah binti Rahman"
          error={errors.name?.message}
          {...register('name')}
        />
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
        <UnitField registration={register('unit')} value={unit} error={errors.unit?.message} />

        <div>
          <PasswordField
            label="Password"
            autoComplete="new-password"
            hint={password ? undefined : 'Use 8+ characters. A few unrelated words work well.'}
            error={errors.password?.message}
            aria-describedby={password ? insightsId : undefined}
            onFocus={() => void loadStrengthEngine().catch(() => undefined)}
            {...register('password')}
          />
          {password ? (
            <PasswordInsights id={insightsId} strength={strength} breach={breach} />
          ) : null}
        </div>

        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Checkbox
          label={
            <>
              I've read the{' '}
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="rounded-sm text-ink underline decoration-lamp/50 underline-offset-4 hover:decoration-lamp"
              >
                house rules
              </button>{' '}
              and understand this is a demo.
            </>
          }
          error={errors.terms?.message}
          {...register('terms')}
        />
      </div>

      <Button
        type="submit"
        className="mt-7 w-full"
        state={submitState}
        loadingText="Building…"
        data-cursor="magnetic"
      >
        Create account <ArrowRight className="size-4" aria-hidden="true" />
      </Button>

      <HouseRulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </form>
  );
}

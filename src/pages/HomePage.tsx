import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Button } from 'components/ui/Button';
import { Eyebrow } from 'components/ui/Eyebrow';
import { Headline } from 'components/ui/Headline';
import { usePageTitle } from 'hooks/usePageTitle';
import { useAuth } from 'features/auth/AuthProvider';
import { displayName } from 'features/auth/displayName';
import type { User } from 'features/auth/schemas';
import { describeUnit, parseUnit } from 'features/auth/unit';
import { useSceneStore } from 'features/scene/sceneStore';

const memberSince = new Intl.DateTimeFormat('en-MY', { month: 'long', year: 'numeric' });

/** Long enough for the lights to go out floor by floor before the page changes. */
const SIGN_OUT_SWEEP_MS = 1100;

export function HomePage() {
  usePageTitle('Home');
  const { user, signOut } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [signingOut, setSigningOut] = useState(false);

  // Keep showing the resident while the page animates out after sign-out.
  const lastUser = useRef<User | null>(user);
  if (user) lastUser.current = user;
  const resident = lastUser.current;
  const unitValue = resident?.unit ?? '';

  // The resident's own window stays lit in the scene (also after a page reload).
  useEffect(() => {
    if (user) useSceneStore.getState().setUnit(parseUnit(unitValue));
  }, [user, unitValue]);

  if (!resident) return null;

  const unit = parseUnit(resident.unit);

  const handleSignOut = async () => {
    setSigningOut(true);
    useSceneStore.getState().emit('signout');
    await signOut({ minDuration: prefersReducedMotion ? 0 : SIGN_OUT_SWEEP_MS });
  };

  return (
    <>
      <header>
        <Eyebrow>{unit ? describeUnit(unit) : 'Resident'}</Eyebrow>
        <Headline lead="Lights on," accent={`${displayName(resident.name)}.`} />
        <p className="mt-3 text-ink-muted">You're signed in to Lumen Residences.</p>
      </header>

      <dl className="mt-8 divide-y divide-line overflow-hidden rounded-field bg-night-deep/50 ring-1 ring-inset ring-line">
        <DetailRow term="Resident" value={resident.name} />
        <DetailRow term="Email" value={resident.email} />
        <DetailRow
          term="Residence"
          value={unit ? `Unit ${resident.unit} · Floor ${unit.floor}` : resident.unit}
        />
        <DetailRow term="Member since" value={memberSince.format(new Date(resident.createdAt))} />
      </dl>

      <Button
        variant="secondary"
        className="mt-8 w-full"
        state={signingOut ? 'loading' : 'idle'}
        loadingText="Switching off…"
        onClick={handleSignOut}
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </>
  );
}

function DetailRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-4 py-3">
      <dt className="shrink-0 font-mono text-eyebrow uppercase text-ink-faint">{term}</dt>
      <dd className="min-w-0 truncate text-right text-[14px] text-ink">{value}</dd>
    </div>
  );
}

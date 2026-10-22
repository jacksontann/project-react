import { Link } from 'react-router';

interface AuthSwitchProps {
  prompt: string;
  to: string;
  cta: string;
}

/** "New to Lumen? Create an account" — the link between the two auth screens. */
export function AuthSwitch({ prompt, to, cta }: AuthSwitchProps) {
  return (
    <p className="mt-8 text-center text-[14px] text-ink-muted">
      {prompt}{' '}
      <Link
        to={to}
        className="rounded-sm font-medium text-ink underline decoration-lamp/50 decoration-1 underline-offset-[5px] transition-colors hover:decoration-lamp"
      >
        {cta}
      </Link>
    </p>
  );
}

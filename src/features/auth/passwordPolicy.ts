import { pwnedCount } from 'lib/pwned';

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface StrengthResult {
  score: StrengthScore;
  warning: string | null;
  suggestions: string[];
}

type Evaluate = (password: string, userInputs: string[]) => StrengthResult;

/** zxcvbn's score threshold to accept a new password ("fair" or better). */
export const MIN_STRENGTH_SCORE = 2;

export const STRENGTH_LABELS: Record<StrengthScore, string> = {
  0: 'Very weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very strong',
};

let engine: Promise<Evaluate> | null = null;

/**
 * zxcvbn loads on demand (first focus of a new-password field) in separate chunks, so it never
 * blocks the initial render. Dictionaries are picked individually: common passwords, diceware,
 * English common words and first names (~340 KB gzipped). US surnames and Wikipedia words are
 * skipped (they'd add ~440 KB); the resident's own name is penalised via user inputs, and the
 * breach check catches leaked passwords regardless.
 */
export function loadStrengthEngine() {
  engine ??= Promise.all([
    import('@zxcvbn-ts/core'),
    import('@zxcvbn-ts/language-common'),
    import('@zxcvbn-ts/language-en/dist/translations.js'),
    import('@zxcvbn-ts/language-en/dist/commonWords.json.js'),
    import('@zxcvbn-ts/language-en/dist/firstnames.json.js'),
  ])
    .then(([core, common, translations, commonWords, firstnames]) => {
      core.zxcvbnOptions.setOptions({
        translations: translations.default,
        graphs: common.adjacencyGraphs,
        dictionary: {
          ...common.dictionary,
          commonWords: commonWords.default,
          firstnames: firstnames.default,
        },
      });
      const evaluate: Evaluate = (password, userInputs) => {
        const result = core.zxcvbn(password, userInputs);
        return {
          score: result.score,
          warning: result.feedback.warning || null,
          suggestions: result.feedback.suggestions,
        };
      };
      return evaluate;
    })
    .catch((error: unknown) => {
      engine = null; // allow a retry (e.g. the chunk failed to download offline)
      throw error;
    });
  return engine;
}

/** Words a password shouldn't lean on: the resident's own name, email and the building's name. */
export function strengthUserInputs(name: string, email: string) {
  const nameParts = name.toLowerCase().split(/[\s/'-]+/);
  const [localPart = ''] = email.toLowerCase().split('@');
  return [...nameParts, localPart, 'lumen', 'residences', 'residence'].filter(
    (part) => part.length > 2,
  );
}

export function breachMessage(count: number) {
  return `This password has appeared in ${count.toLocaleString('en-MY')} data breaches. Please choose a different one.`;
}

/**
 * Final gate before registering. Returns a message for the password field, or null when fine.
 * The breach check fails open: if the service is unreachable, sign-up isn't blocked by it.
 */
export async function validateNewPassword(password: string, userInputs: string[]) {
  const evaluate = await loadStrengthEngine().catch(() => null);
  if (evaluate && evaluate(password, userInputs).score < MIN_STRENGTH_SCORE) {
    return 'This password is too easy to guess. Try a longer phrase of unrelated words.';
  }
  const count = await pwnedCount(password).catch(() => 0);
  return count > 0 ? breachMessage(count) : null;
}

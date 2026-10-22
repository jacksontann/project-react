export type CursorVariant =
  | { kind: 'default' }
  | { kind: 'link' }
  | { kind: 'magnetic' }
  | { kind: 'text' }
  | { kind: 'label'; text: string }
  | { kind: 'scene' };

const DEFAULT: CursorVariant = { kind: 'default' };
const INTERACTIVE = 'a, button, label, select, input, textarea, [role="button"], [data-cursor]';

/**
 * Resolves the cursor state for whatever is under the pointer. Elements opt in with
 * `data-cursor="text" | "magnetic" | "scene" | "label:<Text>"`; links, buttons and inputs get
 * sensible defaults, so most markup needs no annotation at all.
 */
export function cursorVariantFor(target: Element | null): CursorVariant {
  const element = target?.closest(INTERACTIVE);
  if (!element) return DEFAULT;
  if (element.matches(':disabled, [aria-disabled="true"]')) return DEFAULT;

  const attribute = element.getAttribute('data-cursor');
  if (attribute === 'text') return { kind: 'text' };
  if (attribute === 'magnetic') return { kind: 'magnetic' };
  if (attribute === 'scene') return { kind: 'scene' };
  if (attribute?.startsWith('label:')) return { kind: 'label', text: attribute.slice(6) };

  if (element.matches('input:not([type="checkbox"]):not([type="radio"]), textarea')) {
    return { kind: 'text' };
  }
  return { kind: 'link' };
}

export function sameVariant(a: CursorVariant, b: CursorVariant) {
  return a.kind === b.kind && (a.kind !== 'label' || (b.kind === 'label' && a.text === b.text));
}

let interacted = false;

if (typeof window !== 'undefined') {
  const mark = () => {
    interacted = true;
  };
  window.addEventListener('pointerdown', mark, { once: true, capture: true });
  window.addEventListener('keydown', mark, { once: true, capture: true });
}

/**
 * Whether the visitor has clicked or typed yet. Entrance animations use it to stay out of the
 * first paint (where they'd only delay Largest Contentful Paint) and play on navigations instead.
 */
export function hasUserInteracted() {
  return interacted;
}

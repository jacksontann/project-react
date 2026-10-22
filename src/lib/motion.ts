/*
 * Components use the lightweight `m.*` elements under <LazyMotion strict>. The `domAnimation`
 * feature set (~15 KB) is bundled synchronously on purpose: loading it async delayed the
 * headline reveal, which is the page's Largest Contentful Paint, by a whole network round trip.
 */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeInOutQuart = [0.65, 0, 0.35, 1] as const;

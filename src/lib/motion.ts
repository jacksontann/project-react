/**
 * Framer Motion features are loaded asynchronously through <LazyMotion>, which keeps the
 * animation engine out of the critical bundle. Components use the lightweight `m.*` elements.
 */
export const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default);

export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeInOutQuart = [0.65, 0, 0.35, 1] as const;

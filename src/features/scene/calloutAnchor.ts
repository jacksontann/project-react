/**
 * The DOM element of the unit callout. It lives in the regular React tree (next to the canvas);
 * the 3D scene positions it every frame by projecting the window's world position to pixels.
 */
export const calloutAnchor: { current: HTMLElement | null } = { current: null };

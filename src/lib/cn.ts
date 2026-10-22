import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about the custom theme keys so e.g. `text-eyebrow` (a size)
// doesn't get treated as a text colour and dropped next to `text-ink`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['eyebrow'] }],
      rounded: [{ rounded: ['panel', 'field'] }],
      shadow: [{ shadow: ['panel', 'lamp'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

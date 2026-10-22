/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: token('bg-0'), deep: token('bg-1') },
        glass: token('glass'),
        ink: { DEFAULT: token('text-1'), muted: token('text-2'), faint: token('text-3') },
        lamp: { DEFAULT: token('lamp'), soft: token('lamp-soft'), ink: token('lamp-ink') },
        blueprint: token('blueprint'),
        danger: token('danger'),
        ok: token('ok'),
        line: { DEFAULT: 'rgb(255 255 255 / 0.08)', strong: 'rgb(255 255 255 / 0.16)' },
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
      },
      borderRadius: {
        panel: '28px',
        field: '14px',
      },
      boxShadow: {
        panel:
          'inset 0 1px 0 0 rgb(255 255 255 / 0.07), 0 1px 2px rgb(0 0 0 / 0.4), 0 40px 80px -24px rgb(0 0 0 / 0.65)',
        lamp: '0 0 0 1px rgb(var(--lamp) / 0.55), 0 0 28px -6px rgb(var(--lamp) / 0.55)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
};

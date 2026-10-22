import { Fragment } from 'react';
import { m } from 'framer-motion';
import { easeOutExpo } from 'lib/motion';

interface HeadlineProps {
  /** Regular words, e.g. "Welcome". */
  lead: string;
  /** Italic lamp-amber words, e.g. "home.". */
  accent: string;
}

/**
 * Display headline whose words rise out of a mask one after another. The text stays plain
 * inline content, so screen readers read it as a normal sentence. Focusable (tabIndex -1) so
 * focus can move here after a route change.
 */
export function Headline({ lead, accent }: HeadlineProps) {
  const words = [
    ...lead.split(' ').map((text) => ({ text, accent: false })),
    ...accent.split(' ').map((text) => ({ text, accent: true })),
  ];

  return (
    <h1
      tabIndex={-1}
      className="mt-4 font-display text-[44px] leading-[1] tracking-[-0.01em] text-ink outline-none sm:text-[52px]"
    >
      {words.map((word, index) => (
        <Fragment key={`${word.text}-${index}`}>
          {/* Padding + negative margin give italic descenders room inside the mask. */}
          <span className="-mb-[0.16em] inline-block overflow-hidden pb-[0.16em] pr-[0.05em] align-bottom">
            <m.span
              className="inline-block"
              initial={{ y: '108%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: easeOutExpo, delay: 0.06 + index * 0.07 }}
            >
              {word.accent ? <em className="text-lamp">{word.text}</em> : word.text}
            </m.span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </h1>
  );
}

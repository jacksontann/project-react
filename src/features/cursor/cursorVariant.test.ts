import { cursorVariantFor, sameVariant } from './cursorVariant';

function element(html: string, selector: string) {
  document.body.innerHTML = html;
  return document.querySelector(selector);
}

describe('cursorVariantFor', () => {
  it('defaults to the plain cursor on non-interactive content', () => {
    expect(cursorVariantFor(element('<p>Text</p>', 'p'))).toEqual({ kind: 'default' });
  });

  it('infers link/text states from the markup', () => {
    expect(cursorVariantFor(element('<a href="/x"><span>Go</span></a>', 'span'))).toEqual({
      kind: 'link',
    });
    expect(cursorVariantFor(element('<input type="email" />', 'input'))).toEqual({ kind: 'text' });
    expect(cursorVariantFor(element('<input type="checkbox" />', 'input'))).toEqual({
      kind: 'link',
    });
  });

  it('honours explicit data-cursor annotations', () => {
    expect(
      cursorVariantFor(element('<button data-cursor="magnetic">Go</button>', 'button')),
    ).toEqual({ kind: 'magnetic' });
    expect(
      cursorVariantFor(element('<button data-cursor="label:Show"><svg></svg></button>', 'svg')),
    ).toEqual({ kind: 'label', text: 'Show' });
    expect(
      cursorVariantFor(element('<div data-cursor="scene"><canvas></canvas></div>', 'canvas')),
    ).toEqual({ kind: 'scene' });
  });

  it('treats disabled controls as non-interactive', () => {
    expect(cursorVariantFor(element('<button disabled>Go</button>', 'button'))).toEqual({
      kind: 'default',
    });
  });

  it('compares variants by value', () => {
    expect(sameVariant({ kind: 'label', text: 'Show' }, { kind: 'label', text: 'Show' })).toBe(
      true,
    );
    expect(sameVariant({ kind: 'label', text: 'Show' }, { kind: 'label', text: 'Hide' })).toBe(
      false,
    );
    expect(sameVariant({ kind: 'text' }, { kind: 'link' })).toBe(false);
  });
});

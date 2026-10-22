import { useCallback, useState, type KeyboardEvent } from 'react';

/** Tracks Caps Lock from key events on a field. Browsers can't report it before a key is pressed. */
export function useCapsLock() {
  const [capsLock, setCapsLock] = useState(false);

  const onKeyEvent = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'));
  }, []);

  const reset = useCallback(() => setCapsLock(false), []);

  return { capsLock, onKeyEvent, reset };
}

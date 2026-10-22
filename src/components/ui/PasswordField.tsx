import { useId, useState } from 'react';
import { ArrowBigUpDash, Eye, EyeOff } from 'lucide-react';
import { useCapsLock } from 'hooks/useCapsLock';
import { TextField, type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing' | 'status'>;

export function PasswordField({ id, onKeyDown, onKeyUp, onBlur, ...props }: PasswordFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  const { capsLock, onKeyEvent, reset } = useCapsLock();

  return (
    <TextField
      {...props}
      id={inputId}
      type={visible ? 'text' : 'password'}
      spellCheck={false}
      autoCapitalize="off"
      onKeyDown={(event) => {
        onKeyEvent(event);
        onKeyDown?.(event);
      }}
      onKeyUp={(event) => {
        onKeyEvent(event);
        onKeyUp?.(event);
      }}
      onBlur={(event) => {
        reset();
        onBlur?.(event);
      }}
      status={
        capsLock ? (
          <>
            <ArrowBigUpDash className="size-3.5" aria-hidden="true" />
            Caps Lock is on
          </>
        ) : null
      }
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-controls={inputId}
          aria-label={visible ? 'Hide password' : 'Show password'}
          data-cursor={visible ? 'label:Hide' : 'label:Show'}
          className="grid size-9 place-items-center rounded-[10px] text-ink-faint transition-colors hover:bg-white/5 hover:text-ink"
        >
          {visible ? (
            <EyeOff className="size-[18px]" aria-hidden="true" />
          ) : (
            <Eye className="size-[18px]" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}

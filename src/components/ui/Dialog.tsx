import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Native <dialog>: focus trapping, Esc and the top layer come from the platform. */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clicks on the backdrop target the <dialog> element itself.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(92vw,480px)] rounded-panel bg-night-deep p-0 text-ink shadow-panel ring-1 ring-line-strong backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-3xl leading-none">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 grid size-9 place-items-center rounded-[10px] text-ink-faint hover:bg-white/5 hover:text-ink"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-3 text-[14px] leading-6 text-ink-muted">{children}</div>
      </div>
    </dialog>
  );
}

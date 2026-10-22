import { Dialog } from 'components/ui/Dialog';

interface HouseRulesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HouseRulesDialog({ open, onClose }: HouseRulesDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="House rules">
      <p>
        Lumen is a demo resident portal. Your account lives only in this browser: the API is
        simulated with Mock Service Worker and stored in localStorage. Nothing reaches a real
        server.
      </p>
      <p>
        Passwords are hashed with PBKDF2-SHA256 (600,000 iterations) before they are stored. The
        breach check sends only the first five characters of your password's SHA-1 hash to Have I
        Been Pwned, so the password itself never leaves your device.
      </p>
      <p>Quiet hours are 10 pm to 7 am. Please be kind to your neighbours.</p>
    </Dialog>
  );
}

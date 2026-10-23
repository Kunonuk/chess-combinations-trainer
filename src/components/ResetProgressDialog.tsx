import { useRef } from 'react';
import { useDialogFocus } from '../hooks/useDialogFocus.ts';

interface ResetProgressDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetProgressDialog({ onCancel, onConfirm }: ResetProgressDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useDialogFocus(dialog, onCancel);
  return (
    <div className="modal-backdrop">
      <div
        ref={dialog}
        tabIndex={-1}
        data-testid="reset-dialog"
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
      >
        <h2 id="reset-title">Reset all study progress?</h2>
        <p>
          This removes attempts, hints, and completed history for every collection in this browser.
        </p>
        <div className="dialog-actions">
          <button data-testid="keep-progress" onClick={onCancel}>
            Keep progress
          </button>
          <button
            data-testid="confirm-reset-progress"
            className="danger-button"
            onClick={onConfirm}
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  );
}

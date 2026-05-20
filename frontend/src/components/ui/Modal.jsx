import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Themed Modal with theme-matched fade + scale animation.
 *
 * Usage:
 *   <Modal open={open} onClose={() => setOpen(false)} title="…">
 *     …content…
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children, testid = "modal" }) {
  // Lock scroll while modal is mounted (animation classes handle visibility)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 animate-modal-fade"
      data-testid={testid}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-psy-text/35 backdrop-blur-sm"
        data-testid={`${testid}-backdrop`}
      />

      {/* Content panel */}
      <div
        className={cn(
          "relative w-full max-w-sm bg-psy-card text-psy-text rounded-2xl border border-psy-border shadow-card p-7 animate-modal-pop",
        )}
      >
        <div className="flex items-start justify-between mb-4">
          {title && (
            <h3 className="font-display text-2xl leading-tight pr-6">{title}</h3>
          )}
          <button
            onClick={onClose}
            data-testid={`${testid}-close`}
            className="text-psy-subtext hover:text-psy-text transition p-1 rounded-full hover:bg-psy-bg shrink-0"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

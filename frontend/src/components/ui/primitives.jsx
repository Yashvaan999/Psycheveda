import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-medium rounded-full px-5 py-3 transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  const styles = {
    primary:
      "bg-psy-primary text-psy-bg hover:bg-psy-primary/90 shadow-[0_4px_24px_rgba(229,138,68,0.25)]",
    secondary:
      "bg-psy-card text-psy-text border border-psy-border hover:border-psy-primary/40",
    ghost:
      "bg-transparent text-psy-subtext hover:text-psy-text hover:bg-psy-card/60",
    danger:
      "bg-transparent text-red-300 hover:bg-red-500/10 border border-red-500/30",
  };
  return <button className={cn(base, styles[variant], className)} {...props} />;
}

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-psy-card rounded-2xl p-6 border border-psy-border/60 shadow-card relative",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full bg-psy-bg border border-psy-border rounded-xl px-4 py-3 text-psy-text placeholder:text-psy-subtext/70 focus:outline-none focus:ring-1 focus:ring-psy-primary focus:border-psy-primary/60 transition",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full bg-psy-bg border border-psy-border rounded-xl px-4 py-3 text-psy-text placeholder:text-psy-subtext/70 focus:outline-none focus:ring-1 focus:ring-psy-primary focus:border-psy-primary/60 transition resize-none min-h-[120px]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn(
        "block text-xs uppercase tracking-[0.18em] text-psy-subtext mb-2 font-body",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function Badge({ children, className, tone = "primary" }) {
  const tones = {
    primary: "bg-psy-primary/15 text-psy-primary border-psy-primary/30",
    sage: "bg-psy-secondary/15 text-psy-secondary border-psy-secondary/40",
    neutral: "bg-psy-card text-psy-subtext border-psy-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-body",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-psy-border" />
      {label && (
        <span className="text-[10px] uppercase tracking-[0.25em] text-psy-subtext">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-psy-border" />
    </div>
  );
}

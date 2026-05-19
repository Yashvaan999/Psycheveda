import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", ...props }) {
  // 24px (rounded-3xl) for primary actions per spec
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-medium px-6 py-3.5 transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  const styles = {
    primary:
      "rounded-3xl bg-psy-primary text-white hover:bg-[#C2682E] shadow-cta",
    secondary:
      "rounded-3xl bg-psy-card text-psy-text border border-psy-border hover:border-psy-primary/40 hover:bg-[#EBE6DA]",
    ghost:
      "rounded-3xl bg-transparent text-psy-subtext hover:text-psy-text hover:bg-psy-card/70",
    danger:
      "rounded-3xl bg-transparent text-red-700 hover:bg-red-50 border border-red-300",
  };
  return <button className={cn(base, styles[variant], className)} {...props} />;
}

export function Card({ className, children, ...props }) {
  // 16px (rounded-2xl) cards. Depth via shadow + ultra-subtle border, never a harsh rule.
  return (
    <div
      className={cn(
        "bg-psy-card rounded-2xl p-7 border border-psy-border shadow-card relative",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }) {
  // 16px corners, generous padding, soft inset rather than harsh border
  return (
    <input
      className={cn(
        "w-full bg-psy-card rounded-2xl px-5 py-4 text-psy-text placeholder:text-psy-subtext/80 border border-psy-border focus:outline-none focus:border-psy-primary/50 focus:bg-white focus:ring-4 focus:ring-psy-primary/10 transition",
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
        "w-full bg-psy-card rounded-2xl px-5 py-4 text-psy-text placeholder:text-psy-subtext/80 border border-psy-border focus:outline-none focus:border-psy-primary/50 focus:bg-white focus:ring-4 focus:ring-psy-primary/10 transition resize-none min-h-[140px] leading-relaxed",
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
        "block text-xs uppercase tracking-[0.2em] text-psy-subtext mb-2.5 font-body font-medium",
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
    primary: "bg-psy-primary/12 text-psy-primary border-psy-primary/25",
    sage: "bg-psy-secondary/12 text-psy-secondary border-psy-secondary/30",
    neutral: "bg-psy-bg text-psy-subtext border-psy-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-body font-medium",
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

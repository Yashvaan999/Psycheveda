/**
 * BlessIcon — a red heart with a golden circle halo at the top.
 * Static glyph (no animation).
 */
export default function BlessIcon({
  size = 24,
  className,
  heartColor = "#E11D48",   // red
  haloColor = "#E8B547",    // golden
  strokeWidth = 1.6,
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Golden circle at the top */}
      <circle
        cx="12"
        cy="3"
        r="2.2"
        fill={haloColor}
        stroke={haloColor}
        strokeWidth="0.6"
      />

      {/* Red heart */}
      <path
        d="M12 22c-.5 0-1-.2-1.35-.5-.18-.16-4-3.3-6-5.7-1.78-2.14-2.4-3.92-2.4-5.5 0-2.92 2.25-5.2 5.05-5.2 1.84 0 3.5 1 4.5 2.55C12.8 6.1 14.46 5.1 16.3 5.1c2.8 0 5.05 2.28 5.05 5.2 0 1.58-.62 3.36-2.4 5.5-2 2.4-5.82 5.54-6 5.7-.35.3-.85.5-1.35.5Z"
        stroke={heartColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={heartColor}
      />
    </svg>
  );
}

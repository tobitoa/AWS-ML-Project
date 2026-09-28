interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * CONVIA Enterprise Identity Mark: Geometric graph nodes forming a coherent resolution nexus.
 */
export function Logo({ size = 18, className }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="6" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="2.5" fill="currentColor" stroke="none" />
      <path d="M7.8 7.2L16.2 7.2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M7 8L11 16" stroke="currentColor" strokeWidth={1.5} />
      <path d="M17 8L13 16" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

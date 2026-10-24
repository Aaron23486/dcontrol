/**
 * Ilustración decorativa del panel de escaneo (ADR 0011): una credencial sobre franjas suaves.
 * No recibe clics ni foco y los lectores de pantalla la ignoran.
 */
export function ScanIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 150"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <linearGradient id="scan-illustration-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="320" height="150" fill="#f6f9fe" />
      <path d="M40 150 112 0h62l-72 150z" fill="#e4f5ee" />
      <path d="M128 150 200 0h70l-72 150z" fill="#e3edfd" />
      <path d="M232 150 304 0h40v150z" fill="#edf3fe" />
      <rect width="320" height="150" fill="url(#scan-illustration-fade)" />
      <circle cx="226" cy="26" r="7" fill="#dbe8fc" />
      <circle cx="274" cy="118" r="4" fill="#d9efe5" />
      <g transform="translate(118 46)">
        <rect x="4" y="6" width="132" height="68" rx="10" fill="#d6e4f8" opacity="0.6" />
        <rect width="132" height="68" rx="10" fill="#ffffff" stroke="#e2e8f0" />
        <circle cx="33" cy="27" r="9" fill="#2563eb" />
        <path d="M17 53a16 13 0 0 1 32 0z" fill="#3b82f6" />
        <rect x="60" y="19" width="56" height="7" rx="3.5" fill="#bfd6fb" />
        <rect x="60" y="32" width="46" height="7" rx="3.5" fill="#bfd6fb" />
        <rect x="60" y="45" width="34" height="7" rx="3.5" fill="#dbe8fc" />
      </g>
    </svg>
  );
}

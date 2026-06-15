// Real verified badge — tilted blue square with white checkmark (matches reference image)
export function VerifiedBadge({ size = 16, color = "#1d8bf8" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Verified"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <g transform="rotate(-8 12 12)">
        <rect x="3" y="3" width="18" height="18" rx="2" fill={color} />
        <path
          d="M7.5 12.5l3 3 6-6.5"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

// Generic real-style badge for OG/Staff/VIP — same tilted square shape, different color + glyph
export function RealBadge({
  size = 16,
  color,
  glyph,
  label,
}: {
  size?: number;
  color: string;
  glyph: string;
  label: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label={label}
      style={{ display: "inline-block", verticalAlign: "middle" }}>
      <g transform="rotate(-8 12 12)">
        <rect x="3" y="3" width="18" height="18" rx="2" fill={color} />
        <text x="12" y="16.5" textAnchor="middle" fontSize="11"
          fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">{glyph}</text>
      </g>
    </svg>
  );
}

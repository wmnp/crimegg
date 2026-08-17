type Props = { className?: string; size?: number; withWordmark?: boolean };

/** crime.gg mark — a fingerprint-style ring cut by a slash, drawn in the crime gradient. */
export function CrimeLogo({ className = "", size = 30, withWordmark = false }: Props) {
  return (
    <span className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex" style={{ width: size, height: size }}>
        <span
          className="absolute inset-0 rounded-full opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "var(--gradient-crime)" }}
          aria-hidden
        />
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          role="img"
          aria-label="crime.gg logo"
          className="relative transition-transform duration-500 ease-out group-hover:rotate-[8deg] group-hover:scale-110"
        >
          <defs>
            <linearGradient id="crimeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--crime)" />
              <stop offset="100%" stopColor="var(--crime-glow)" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="21" fill="none" stroke="url(#crimeGrad)" strokeWidth="3" opacity="0.95" />
          <circle cx="24" cy="24" r="14" fill="none" stroke="url(#crimeGrad)" strokeWidth="2.2" opacity="0.6" />
          <circle cx="24" cy="24" r="7" fill="none" stroke="url(#crimeGrad)" strokeWidth="2" opacity="0.4" />
          <path
            d="M9 39 L39 9"
            stroke="var(--background)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M11 37 L37 11"
            stroke="url(#crimeGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {withWordmark && (
        <span className="text-2xl font-black tracking-tight">
          crime<span className="text-gradient-crime">.gg</span>
        </span>
      )}
    </span>
  );
}

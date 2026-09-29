/** The Vesper mark: an evening crescent with the signal star. */
export function VesperMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M19 4.5A10 10 0 1 0 23.5 19 8 8 0 0 1 19 4.5z"
        className="stroke-ink"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="8" r="2.4" className="fill-signal" />
    </svg>
  );
}

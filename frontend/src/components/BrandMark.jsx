// EnfoTag logo: stylized barcode glyph
export default function BrandMark({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <rect x="3" y="5" width="2.2" height="14" rx="0.7" />
      <rect x="6.7" y="5" width="1.3" height="14" rx="0.65" />
      <rect x="9.4" y="5" width="2.8" height="14" rx="0.7" />
      <rect x="13.6" y="5" width="1.3" height="14" rx="0.65" />
      <rect x="16.3" y="5" width="2.4" height="14" rx="0.7" />
      <rect x="20.1" y="5" width="1.3" height="14" rx="0.65" />
    </svg>
  );
}

// page title + description + barcode-line divider (identity signature)
export default function PageHeader({ title, description, className = "" }) {
  return (
    <header className={`page-head ${className}`.trim()}>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      <div className="barcode-divider" aria-hidden="true" />
    </header>
  );
}

// shimmering placeholder rows shown while table data loads
export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="skeleton skeleton-line"
          style={{ width: `${92 - (index % 3) * 16}%` }}
        />
      ))}
    </div>
  );
}

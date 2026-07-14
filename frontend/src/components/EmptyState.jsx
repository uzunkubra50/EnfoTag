// empty-list placeholder: icon + title + guidance + optional action button
export default function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      {icon}
      <span className="empty-title">{title}</span>
      {text && <p className="empty-text">{text}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

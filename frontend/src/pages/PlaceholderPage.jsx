export default function PlaceholderPage({ title, description }) {
  return (
    <div className="shell-page">
      <div className="shell-page-header">
        <h1 className="shell-page-title">{title}</h1>
        {description && (
          <p className="shell-page-sub">{description}</p>
        )}
      </div>
      <div className="placeholder-panel">
        <div className="placeholder-panel-inner">
          <div className="placeholder-label">Coming soon</div>
          <p className="placeholder-text">
            This section is under development and will be available in a
            future release.
          </p>
        </div>
      </div>
    </div>
  );
}

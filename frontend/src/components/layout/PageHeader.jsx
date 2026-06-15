export default function PageHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <div className="section-header-accent" />
      <div>
        <h2 className="section-header-title">{title}</h2>
        {subtitle && (
          <p className="section-header-sub">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

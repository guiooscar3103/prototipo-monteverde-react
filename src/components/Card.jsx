export default function Card({ title, children, action }) {
  return (
    <div className="card">
      {title && <div className="section-title">{title}</div>}
      {children}
      {action && <div style={{marginTop:'.75rem'}}>{action}</div>}
    </div>
  )
}

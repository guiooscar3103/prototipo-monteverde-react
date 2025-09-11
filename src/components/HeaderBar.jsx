import { useNavigate } from 'react-router-dom'

export default function HeaderBar({ usuario, rol }) {
  const navigate = useNavigate()
  const salir = () => {
    // (simulado) aquí limpiaríamos auth; por ahora solo navegamos
    navigate('/', { replace: true })
  }

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem', borderBottom:'1px solid #eee', background:'#fff', position:'sticky', top:0, zIndex:5}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <img src="/logo-monteverde.png" alt="MonteVerde" style={{height:28, width:28, objectFit:'contain'}} />
        <strong>Colegio MonteVerde</strong>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <span className="badge">{usuario} ({rol})</span>
        <button className="btn" onClick={salir}>Salir</button>
      </div>
    </div>
  )
}

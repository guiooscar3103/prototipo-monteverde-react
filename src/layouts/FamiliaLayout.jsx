import { NavLink, Outlet } from 'react-router-dom'
import HeaderBar from '../components/HeaderBar'

export default function FamiliaLayout() {
  const link = {padding:'.35rem 0', color:'#4c1d95'}
  return (
    <div style={{display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh'}}>
      <aside style={{borderRight:'1px solid #eee', padding:'1rem', background:'#fff'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, fontWeight:700, color:'#4c1d95', marginBottom:'1rem'}}>
          <img src={`${import.meta.env.BASE_URL}logo-monteverde.png`} alt="Escudo" style={{height:22}} />
          MonteVerde
        </div>
        <nav style={{display:'grid', gap:'.25rem', marginTop:'1rem'}}>
          <NavLink to="/familia" style={link}>Inicio</NavLink>
          <NavLink to="/familia/reporte" style={link}>Reporte Académico</NavLink>
          <NavLink to="/familia/mensajes" style={link}>Mensajes</NavLink>
        </nav>
      </aside>

      <main style={{display:'flex', flexDirection:'column'}}>
        <HeaderBar usuario="Carlos M." rol="Familia" />
        <div style={{padding:'1rem 1.5rem'}}><Outlet /></div>
      </main>
    </div>
  )
}

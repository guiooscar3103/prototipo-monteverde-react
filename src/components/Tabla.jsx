export default function Tabla({ columns=[], rows=[] }) {
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{textAlign:'left', borderBottom:'1px solid #ddd', padding:'.5rem'}}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{borderBottom:'1px solid #f1f1f1'}}>
              {columns.map(col => (
                <td key={col.key} style={{padding:'.5rem'}}>
                  {col.render ? col.render(r) : r[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length===0 && (
            <tr><td colSpan={columns.length} style={{padding:'1rem', opacity:.7}}>Sin datos</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

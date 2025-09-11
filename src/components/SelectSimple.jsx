export default function SelectSimple({value, onChange, options=[], etiqueta='Seleccione...'}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{padding:'.5rem'}}>
      <option value="">{etiqueta}</option>
      {options.map(op => (
        <option key={op.value} value={op.value}>{op.label}</option>
      ))}
    </select>
  )
}

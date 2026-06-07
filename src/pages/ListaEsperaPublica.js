import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

const DIAS = ['Seg','Ter','Qua','Qui','Sex','Sáb']
const HORAS_SEMANA = ['08:00','09:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00']
const HORAS_SAB = ['08:00','09:00','10:00','11:00','12:00']

export default function ListaEsperaPublica() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telemovel, setTelemovel] = useState('')
  const [horarios, setHorarios] = useState([])
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggleHorario(h) {
    setHorarios(prev => prev.includes(h) ? prev.filter(x=>x!==h) : [...prev, h])
  }

  async function submeter(e) {
    e.preventDefault()
    if (!nome || !email || !telemovel) return
    setLoading(true)
    await supabase.from('lista_espera_geral').insert({ nome, email, telemovel, horarios_preferidos: horarios })
    setEnviado(true); setLoading(false)
  }

  if (enviado) return (
    <div className="auth-wrap" style={{textAlign:'center'}}>
      <div className="auth-logo"><span className="logo-hi">Hi</span>-Pilates</div>
      <div style={{fontSize:'48px',margin:'2rem 0 1rem'}}>✓</div>
      <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:'22px',marginBottom:'1rem'}}>Obrigada!</div>
      <p style={{fontSize:'13px',color:'var(--texto-muted)',lineHeight:1.8}}>
        Ficou registado/a na nossa lista de espera.<br/>
        Entraremos em contacto assim que houver uma vaga disponível.
      </p>
      <Link to="/login" style={{display:'block',marginTop:'2rem',color:'var(--castanho)',fontSize:'13px'}}>Já tem conta? Entrar →</Link>
    </div>
  )

  return (
    <div className="auth-wrap">
      <div className="auth-logo"><span className="logo-hi">Hi</span>-Pilates</div>
      <p className="auth-sub">Lista de espera</p>
      <div className="card-elevated">
        <p style={{fontSize:'13px',color:'var(--texto-muted)',marginBottom:'1.5rem',lineHeight:1.6}}>
          Todos os horários estão atualmente ocupados. Deixe os seus dados e entraremos em contacto assim que houver uma vaga.
        </p>
        <form onSubmit={submeter}>
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input className="form-input" value={nome} onChange={e=>setNome(e.target.value)} placeholder="O seu nome" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="o_seu@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Telemóvel *</label>
            <input className="form-input" type="tel" value={telemovel} onChange={e=>setTelemovel(e.target.value)} placeholder="9XX XXX XXX" required />
          </div>

          <p className="section-title">Horários preferidos (opcional)</p>
          {DIAS.map((dia, di) => {
            const horas = di < 5 ? HORAS_SEMANA : HORAS_SAB
            return (
              <div key={dia} style={{marginBottom:'0.75rem'}}>
                <div style={{fontSize:'11px',letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--castanho)',marginBottom:'4px'}}>{dia}</div>
                <div style={{display:'flex',flexWrap:'wrap'}}>
                  {horas.map(h => {
                    const key = `${di+1}-${h}`
                    return <span key={key} className={`horario-chip ${horarios.includes(key)?'selected':''}`} onClick={()=>toggleHorario(key)}>{h}</span>
                  })}
                </div>
              </div>
            )
          })}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{marginTop:'1rem'}}>
            {loading ? 'A enviar...' : 'Entrar na lista de espera'}
          </button>
        </form>
        <p className="switch-link">Já tem conta? <Link to="/login">Entrar aqui</Link></p>
      </div>
    </div>
  )
}

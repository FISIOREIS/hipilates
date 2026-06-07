import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LogoSVG = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <path d="M8 6 Q10 14 9 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M9 14 Q13 10 16 14" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M16 14 Q17 20 16 26" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="7" r="2.5" fill="var(--madeira)" opacity="0.5"/>
    <path d="M18 10 Q21 14 24 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
)

export default function ResetPassword({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function redefinir(e) {
    e.preventDefault()
    if (password.length < 6) { setErro('A password deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirmar) { setErro('As passwords não coincidem.'); return }
    setErro(''); setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setErro('Erro ao redefinir a password. Tente novamente.')
    else {
      setSucesso(true)
      await supabase.auth.signOut()
    }
    setLoading(false)
  }

  return (
    <div className="auth-wrap" style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'2rem 1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'2rem',justifyContent:'center'}}>
        <LogoSVG />
        <span style={{fontSize:'16px',fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--grafite)'}}>
          <span style={{color:'var(--madeira)'}}>Hi</span>pilates
        </span>
      </div>

      <p style={{fontSize:'11px',color:'var(--texto-muted)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'1.75rem',fontWeight:500,textAlign:'center'}}>
        Redefinir password
      </p>

      <div className="card-elevated">
        {sucesso ? (
          <div style={{textAlign:'center',padding:'1rem 0'}}>
            <div style={{fontSize:'40px',marginBottom:'1rem'}}>✅</div>
            <div style={{fontSize:'16px',fontWeight:600,marginBottom:'10px',color:'var(--grafite)'}}>Password alterada!</div>
            <p style={{fontSize:'13px',color:'var(--texto-muted)',lineHeight:1.7,marginBottom:'1.5rem'}}>
              A password foi redefinida com sucesso. Já pode iniciar sessão com a nova password.
            </p>
            <a href="/login" className="btn btn-primary btn-full" style={{display:'block',textDecoration:'none',textAlign:'center',marginTop:0}}>
              Entrar na aplicação
            </a>
          </div>
        ) : (
          <form onSubmit={redefinir}>
            {erro && <div className="erro-msg">{erro}</div>}
            <div className="form-group">
              <label className="form-label">Nova password</label>
              <input className="form-input" type="password" value={password}
                onChange={e=>setPassword(e.target.value)} placeholder="mínimo 6 caracteres" required autoFocus />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Confirmar password</label>
              <input className="form-input" type="password" value={confirmar}
                onChange={e=>setConfirmar(e.target.value)} placeholder="repita a nova password" required />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'A guardar...' : 'Guardar nova password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

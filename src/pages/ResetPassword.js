import { useState } from 'react'
import { supabase } from '../lib/supabase'

function validarPassword(p) {
  if (p.length < 12) return 'A password deve ter pelo menos 12 caracteres.'
  if (!/[A-Z]/.test(p)) return 'A password deve ter pelo menos uma letra maiúscula.'
  if (!/[0-9]/.test(p)) return 'A password deve ter pelo menos um número.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) return 'A password deve ter pelo menos um símbolo (ex: !@#$%).'
  return null
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [verConf, setVerConf] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const forcaPassword = (p) => {
    if (!p) return null
    let score = 0
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) score++
    if (score <= 1) return { label: 'Fraca', color: 'var(--erro)', width: '25%' }
    if (score === 2) return { label: 'Razoável', color: '#e0a020', width: '50%' }
    if (score === 3) return { label: 'Boa', color: '#4a90d9', width: '75%' }
    return { label: 'Forte', color: 'var(--sucesso)', width: '100%' }
  }
  const forca = forcaPassword(password)

  async function redefinir(e) {
    e.preventDefault()
    const erroPass = validarPassword(password)
    if (erroPass) { setErro(erroPass); return }
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
        <img src="/simbolo__header_.png" alt="Hipilates" style={{height:'28px',objectFit:'contain'}} />
        <span style={{fontSize:'16px',fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--grafite)'}}>
          hipilates
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
            <p style={{fontSize:'12px',color:'var(--texto-muted)',marginBottom:'1rem',lineHeight:1.6}}>
              A password deve ter pelo menos 12 caracteres, uma maiúscula, um número e um símbolo.
            </p>
            <div className="form-group">
              <label className="form-label">Nova password</label>
              <div style={{position:'relative'}}>
                <input className="form-input" type={verPass?'text':'password'} value={password}
                  onChange={e=>setPassword(e.target.value)} placeholder="mínimo 12 caracteres" required autoFocus style={{paddingRight:'44px'}} />
                <span onClick={()=>setVerPass(v=>!v)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',cursor:'pointer',fontSize:'16px',color:'var(--texto-muted)'}}>
                  {verPass ? '🙈' : '👁️'}
                </span>
              </div>
              {password && forca && (
                <div style={{marginTop:'6px'}}>
                  <div style={{height:'4px',background:'var(--borda)',borderRadius:'2px',marginBottom:'4px'}}>
                    <div style={{height:'100%',width:forca.width,background:forca.color,borderRadius:'2px',transition:'width 0.3s'}} />
                  </div>
                  <span style={{fontSize:'10px',color:forca.color,fontWeight:600}}>{forca.label}</span>
                </div>
              )}
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Confirmar password</label>
              <div style={{position:'relative'}}>
                <input className="form-input" type={verConf?'text':'password'} value={confirmar}
                  onChange={e=>setConfirmar(e.target.value)} placeholder="repita a nova password" required style={{paddingRight:'44px'}} />
                <span onClick={()=>setVerConf(v=>!v)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',cursor:'pointer',fontSize:'16px',color:'var(--texto-muted)'}}>
                  {verConf ? '🙈' : '👁️'}
                </span>
              </div>
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

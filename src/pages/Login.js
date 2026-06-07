import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const FOTO = 'https://mjnrqugvcfwnkdhnxyjz.supabase.co/storage/v1/object/public/Imagens/WhatsApp%20Image%202026-06-07%20at%2015.23.34.jpeg'

const LogoSVG = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M8 6 Q10 14 9 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M9 14 Q13 10 16 14" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M16 14 Q17 20 16 26" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="7" r="2.5" fill="var(--madeira)" opacity="0.5"/>
    <path d="M18 10 Q21 14 24 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setErro(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErro('Email ou password incorretos.')
    setLoading(false)
  }

  async function enviarReset(e) {
    e.preventDefault()
    if (!email) { setErro('Introduza o seu email.'); return }
    setErro(''); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://hipilates2.vercel.app'
    })
    if (error) setErro('Erro ao enviar email. Verifique o endereço.')
    else setResetEnviado(true)
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <img src={FOTO} alt="Hipilates Studio" />
        <div className="auth-hero-overlay">
          <div className="auth-hero-logo">Hipilates</div>
          <div className="auth-hero-sub">by fisioreis studio</div>
        </div>
      </div>

      <div className="auth-body">
        <p style={{fontSize:'11px',color:'var(--texto-muted)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'1.75rem',fontWeight:500}}>
          {resetMode ? 'Recuperar password' : 'Bem-vinda ao seu espaço'}
        </p>

        <div className="card-elevated">
          {erro && <div className="erro-msg">{erro}</div>}

          {resetEnviado ? (
            <div style={{textAlign:'center',padding:'1rem 0'}}>
              <div style={{fontSize:'32px',marginBottom:'1rem'}}>📧</div>
              <div style={{fontSize:'15px',fontWeight:600,marginBottom:'8px',color:'var(--grafite)'}}>Email enviado!</div>
              <p style={{fontSize:'13px',color:'var(--texto-muted)',lineHeight:1.7,marginBottom:'1.5rem'}}>
                Verifique a sua caixa de entrada e clique no link para redefinir a sua password.
              </p>
              <button className="btn btn-full" style={{marginTop:0}} onClick={()=>{setResetMode(false);setResetEnviado(false)}}>
                Voltar ao login
              </button>
            </div>
          ) : resetMode ? (
            <form onSubmit={enviarReset}>
              <p style={{fontSize:'13px',color:'var(--texto-muted)',marginBottom:'1.25rem',lineHeight:1.6}}>
                Introduza o seu email e enviaremos um link para redefinir a sua password.
              </p>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="o_seu@email.com" required />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'A enviar...' : 'Enviar link de recuperação'}
              </button>
              <button className="btn btn-full" type="button" style={{marginTop:'8px'}} onClick={()=>setResetMode(false)}>
                Voltar ao login
              </button>
            </form>
          ) : (
            <form onSubmit={entrar}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="o_seu@email.com" required />
              </div>
              <div className="form-group" style={{marginBottom:'8px'}}>
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div style={{textAlign:'right',marginBottom:'16px'}}>
                <span style={{fontSize:'11px',color:'var(--madeira)',cursor:'pointer',borderBottom:'1px solid var(--champanhe)'}} onClick={()=>{setResetMode(true);setErro('')}}>
                  Esqueceu a password?
                </span>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{marginTop:0}}>
                {loading ? 'A entrar...' : 'Entrar'}
              </button>
            </form>
          )}
          {!resetMode && !resetEnviado && (
            <p className="switch-link">Não tem conta? <Link to="/registo">Registar aqui</Link></p>
          )}
        </div>
      </div>
    </div>
  )
}

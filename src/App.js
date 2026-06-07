import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, ADMIN_EMAIL } from './lib/supabase'
import Login from './pages/Login'
import Registo from './pages/Registo'
import Landing from './pages/Landing'
import ResetPassword from './pages/ResetPassword'
import ClienteApp from './pages/ClienteApp'
import AdminApp from './pages/AdminApp'
import ProfessorApp from './pages/ProfessorApp'
import ListaEsperaPublica from './pages/ListaEsperaPublica'
import './App.css'

export default function App() {
  const [sessao, setSessao] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tipoConta, setTipoConta] = useState(null)
  const [isReset, setIsReset] = useState(false)

  useEffect(() => {
    // Verificar se é um link de reset de password
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setIsReset(true)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSessao(session)
      if (session) await detectarTipoConta(session.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReset(true)
        setLoading(false)
        return
      }
      setSessao(session)
      if (session) await detectarTipoConta(session.user)
      else setTipoConta(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function detectarTipoConta(user) {
    if (user.email === ADMIN_EMAIL) { setTipoConta('admin'); return }
    const { data: prof } = await supabase.from('professores').select('id').eq('email', user.email).maybeSingle()
    if (prof) { setTipoConta('professor'); return }
    setTipoConta('cliente')
  }

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
    </div>
  )

  // Se for reset de password, mostrar a página de reset independentemente
  if (isReset) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ResetPassword onSuccess={() => { setIsReset(false); setSessao(null) }} />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/inicio" element={<Landing />} />
        <Route path="/reset-password" element={<ResetPassword onSuccess={() => setSessao(null)} />} />
        <Route path="/login" element={!sessao ? <Login /> : <Navigate to="/" />} />
        <Route path="/registo" element={!sessao ? <Registo /> : <Navigate to="/" />} />
        <Route path="/lista-espera" element={<ListaEsperaPublica />} />
        <Route path="/*" element={
          !sessao ? <Navigate to="/inicio" />
            : tipoConta === 'admin' ? <AdminApp />
            : tipoConta === 'professor' ? <ProfessorApp />
            : <ClienteApp />
        } />
      </Routes>
    </BrowserRouter>
  )
}

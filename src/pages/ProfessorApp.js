import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const LogoSVG = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <path d="M8 6 Q10 14 9 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M9 14 Q13 10 16 14" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M16 14 Q17 20 16 26" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="7" r="2.5" fill="var(--madeira)" opacity="0.5"/>
    <path d="M18 10 Q21 14 24 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
)

export default function ProfessorApp() {
  const [tab, setTab] = useState('hoje')
  const [professor, setProfessor] = useState(null)
  const [sessoesHoje, setSessoesHoje] = useState([])
  const [sessoesSemana, setSessoesSemana] = useState([])
  const [notif, setNotif] = useState('')

  useEffect(()=>{ carregarProfessor() },[])
  useEffect(()=>{ if(tab==='hoje' && professor) carregarHoje() },[tab, professor])
  useEffect(()=>{ if(tab==='semana' && professor) carregarSemana() },[tab, professor])

  async function carregarProfessor() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('professores').select('*').eq('email', user?.email).maybeSingle()
    setProfessor(data)
  }

  async function carregarHoje() {
    if (!professor) return
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('sessoes')
      .select('*, aulas(*), marcacoes(*, profiles(nome, problemas_fisicos, cirurgias, cirurgias_descricao, gravidez, medicacao, medicacao_descricao))')
      .eq('data', hoje).eq('cancelada', false)
    const minhas = (data||[]).filter(s => s.aulas?.professor_id === professor.id)
    setSessoesHoje(minhas.sort((a,b)=>a.aulas?.hora?.localeCompare(b.aulas?.hora)))
  }

  async function carregarSemana() {
    if (!professor) return
    const hoje = new Date()
    const diaSemana = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1
    const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - diaSemana)
    const fim = new Date(inicio); fim.setDate(inicio.getDate() + 5)
    const inicioStr = inicio.toISOString().split('T')[0]
    const fimStr = fim.toISOString().split('T')[0]
    const { data } = await supabase.from('sessoes')
      .select('*, aulas(*, professores(nome)), marcacoes(*, profiles(nome))')
      .gte('data', inicioStr).lte('data', fimStr).eq('cancelada', false)
    const minhas = (data||[]).filter(s => s.aulas?.professor_id === professor.id)
    setSessoesSemana(minhas.sort((a,b)=> a.data===b.data ? a.aulas?.hora?.localeCompare(b.aulas?.hora) : a.data.localeCompare(b.data)))
  }

  async function marcarPresenca(marcacaoId, presente) {
    await supabase.from('marcacoes').update({ estado: presente ? 'presente' : 'confirmada' }).eq('id', marcacaoId)
    mostrarNotif(presente ? 'Presença confirmada.' : 'Presença removida.')
    carregarHoje()
  }

  function mostrarNotif(msg) { setNotif(msg); setTimeout(()=>setNotif(''),3000) }
  async function sair() { await supabase.auth.signOut() }

  const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  return (
    <div className="app-wrap">
      {notif && <div className="notif-toast">{notif}</div>}
      <div className="header">
        <div className="logo"><img src="/simbolo__header_.png" alt="Hipilates" style={{height:'28px',objectFit:'contain'}} /> <span style={{fontSize:'15px',fontWeight:600,letterSpacing:'1px'}}>hipilates</span></div>
        <div className="user-menu" onClick={sair}>Sair</div>
      </div>
      <div style={{background:'var(--areia)',padding:'8px 1.5rem',borderBottom:'0.5px solid var(--borda)'}}>
        <span style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--taupe)',fontWeight:600}}>Área do Professor</span>
      </div>
      <div className="nav-tabs">
        {[['hoje','Hoje'],['semana','Semana']].map(([id,label]) => (
          <div key={id} className={`nav-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</div>
        ))}
      </div>
      <div className="content">

        {tab === 'hoje' && (
          <>
            <div className="section-title">Aulas de hoje — {new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}</div>
            {sessoesHoje.length === 0
              ? (
                <div style={{textAlign:'center',paddingTop:'2rem'}}>
                  <div style={{fontSize:'32px',marginBottom:'1rem'}}>🧘</div>
                  <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Sem aulas hoje.</p>
                </div>
              )
              : sessoesHoje.map(s => {
                  const inscritas = (s.marcacoes||[]).filter(m=>m.estado!=='cancelada')
                  return (
                    <div key={s.id} className="card" style={{marginBottom:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                        <div>
                          <div className="aula-hora">{s.aulas?.hora?.slice(0,5)} — {s.aulas?.nome}</div>
                          <div className="aula-detalhe">{inscritas.length}/{s.aulas?.max_pessoas || 5} alunas</div>
                        </div>
                        <span className="badge badge-brown">{inscritas.filter(m=>m.estado==='presente').length}/{inscritas.length} presentes</span>
                      </div>
                      {inscritas.map(m => (
                        <div key={m.id} style={{borderTop:'0.5px solid var(--borda)',padding:'12px 0'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                            <div>
                              <div style={{fontSize:'14px',fontWeight:500,color:'var(--grafite)',marginBottom:'3px'}}>{m.profiles?.nome}</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                                {m.profiles?.problemas_fisicos && <span className="badge badge-amber">⚠ {m.profiles.problemas_fisicos}</span>}
                                {m.profiles?.cirurgias && <span className="badge badge-red">Cirurgias</span>}
                                {m.profiles?.gravidez && <span className="badge badge-amber">Gravidez</span>}
                                {m.profiles?.medicacao && <span className="badge badge-blue">Medicação</span>}
                              </div>
                            </div>
                            <button className={`btn btn-sm ${m.estado==='presente'?'btn-primary':''}`}
                              onClick={()=>marcarPresenca(m.id, m.estado!=='presente')}>
                              {m.estado==='presente'?'✓ Presente':'Marcar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
            }
          </>
        )}

        {tab === 'semana' && (
          <>
            <div className="section-title">Turmas desta semana</div>
            {sessoesSemana.length === 0
              ? <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Sem aulas esta semana.</p>
              : sessoesSemana.map(s => {
                  const inscritas = (s.marcacoes||[]).filter(m=>m.estado!=='cancelada')
                  const dataObj = new Date(s.data + 'T00:00:00')
                  return (
                    <div key={s.id} className="card" style={{marginBottom:'8px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                        <div>
                          <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--madeira)',fontWeight:600,marginBottom:'4px'}}>
                            {DIAS[dataObj.getDay()]} · {dataObj.toLocaleDateString('pt-PT',{day:'numeric',month:'short'})}
                          </div>
                          <div className="aula-hora">{s.aulas?.hora?.slice(0,5)} — {s.aulas?.nome}</div>
                        </div>
                        <span className="badge badge-brown">{inscritas.length} alunas</span>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                        {inscritas.map(m => (
                          <div key={m.id} className="av" title={m.profiles?.nome}>
                            {m.profiles?.nome?.slice(0,2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
            }
          </>
        )}
      </div>
    </div>
  )
}

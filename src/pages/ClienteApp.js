import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ContaCliente from './ContaCliente'

const DIAS = ['','Seg','Ter','Qua','Qui','Sex','Sáb']

const LogoSVG = ({size=22, color='var(--madeira)'}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M8 6 Q10 14 9 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M9 14 Q13 10 16 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M16 14 Q17 20 16 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="7" r="2.5" fill={color} opacity="0.5"/>
    <path d="M18 10 Q21 14 24 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
)

function calcularSaldo(perfil, presencas, feriados, periodos) {
  if (!perfil?.data_inicio) return null
  const inicio = new Date(perfil.data_inicio)
  const hoje = new Date()
  const fimAno = new Date(hoje.getFullYear(), 11, 31)
  const fim = hoje < fimAno ? hoje : fimAno
  let aulasPrevistas = 0
  let d = new Date(inicio)
  const vezesPorSemana = perfil.plano === '2x_semana' ? 2 : 1
  while (d <= fim) {
    const diaSem = d.getDay()
    if (diaSem >= 1 && diaSem <= 6) {
      const dataStr = d.toISOString().split('T')[0]
      const eFeriado = feriados.some(f => f.data === dataStr)
      const ePeriodo = periodos.some(p => dataStr >= p.data_inicio && dataStr <= p.data_fim)
      if (!eFeriado && !ePeriodo) aulasPrevistas += vezesPorSemana / 5
    }
    d.setDate(d.getDate() + 1)
  }
  return Math.round(presencas - Math.round(aulasPrevistas))
}

const CONQUISTAS = [
  { id: 'primeira', icon: '🌱', nome: 'Primeira aula', desc: 'Completou a sua primeira aula', min: 1 },
  { id: 'dez', icon: '⭐', nome: '10 aulas', desc: 'Alcançou 10 presenças', min: 10 },
  { id: 'vinte', icon: '🔥', nome: '20 aulas', desc: 'Dedicação de 20 presenças', min: 20 },
  { id: 'cinquenta', icon: '🏆', nome: '50 aulas', desc: 'Meio centenário de aulas!', min: 50 },
  { id: 'mes', icon: '📅', nome: '1 mês consecutivo', desc: 'Um mês sem falhar', min: 4 },
]

export default function ClienteApp() {
  const [tab, setTab] = useState('inicio')
  const [perfil, setPerfil] = useState(null)
  const [proximasAulas, setProximasAulas] = useState([])
  const [historico, setHistorico] = useState([])
  const [sessoesDia, setSessoesDia] = useState([])
  const [diaSelecionado, setDiaSelecionado] = useState(new Date())
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [modal, setModal] = useState(null)
  const [notif, setNotif] = useState('')
  const [comunicados, setComunicados] = useState([])
  const [notificacoes, setNotificacoes] = useState([])
  const [stats, setStats] = useState(null)
  const [saldo, setSaldo] = useState(null)
  const [avaliacao, setAvaliacao] = useState({ nota: 0, comentario: '' })
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false)
  const [listaEspera, setListaEspera] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [justificacaoFile, setJustificacaoFile] = useState(null)
  const [baixas, setBaixas] = useState([])
  const [proximaAula, setProximaAula] = useState(null)

  useEffect(() => { carregarPerfil() }, [])
  useEffect(() => { if(tab==='inicio') { carregarProximas(); carregarComunicados(); carregarNotificacoes() } }, [tab])
  useEffect(() => { if(tab==='historico') carregarHistorico() }, [tab])
  useEffect(() => { if(tab==='marcar') carregarSessoesDia(diaSelecionado) }, [tab, diaSelecionado])
  useEffect(() => { if(tab==='conta') carregarStats() }, [tab])
  useEffect(() => { if(tab==='chat') carregarMensagens() }, [tab])

  async function carregarPerfil() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setPerfil(data)
  }

  async function carregarComunicados() {
    const { data } = await supabase.from('comunicados').select('*').eq('ativo', true).order('criado_em', { ascending: false }).limit(3)
    setComunicados(data || [])
  }

  async function carregarNotificacoes() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('notificacoes').select('*').eq('cliente_id', user.id).eq('lida', false).order('criado_em', { ascending: false }).limit(5)
    setNotificacoes(data || [])
  }

  async function carregarProximas() {
    const { data: { user } } = await supabase.auth.getUser()
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('marcacoes')
      .select('*, sessoes(id, data, aulas(nome, hora, dia_semana), professores(nome))')
      .eq('cliente_id', user.id).eq('estado', 'confirmada')
      .gte('sessoes.data', hoje).order('sessoes(data)', { ascending: true }).limit(5)
    const filtradas = (data || []).filter(m => m.sessoes)
    setProximasAulas(filtradas)
    if (filtradas.length > 0) setProximaAula(filtradas[0])
    const { data: espera } = await supabase.from('lista_espera')
      .select('*, sessoes(data, aulas(nome, hora))').eq('cliente_id', user.id)
    setListaEspera(espera || [])
  }

  async function carregarHistorico() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('marcacoes')
      .select('*, sessoes(data, aulas(nome, hora))')
      .eq('cliente_id', user.id).in('estado', ['presente','cancelada','credito'])
      .order('sessoes(data)', { ascending: false }).limit(30)
    setHistorico((data || []).filter(m => m.sessoes))
    const { data: baixasData } = await supabase.from('baixas').select('*').eq('cliente_id', user.id)
    setBaixas(baixasData || [])
    const mes = new Date().getMonth() + 1
    const ano = new Date().getFullYear()
    const { data: av } = await supabase.from('avaliacoes')
      .select('*').eq('cliente_id', user.id).eq('mes', mes).eq('ano', ano).maybeSingle()
    if (av) { setAvaliacao({ nota: av.nota, comentario: av.comentario || '' }); setAvaliacaoEnviada(true) }
  }

  async function carregarStats() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('marcacoes').select('estado, usou_credito').eq('cliente_id', user.id)
    const presencas = (data || []).filter(m => m.estado === 'presente').length
    const total = (data || []).length
    const credUsados = (data || []).filter(m => m.usou_credito).length
    setStats({ presencas, total, credUsados })
    const { data: feriados } = await supabase.from('feriados').select('data')
    const { data: periodos } = await supabase.from('periodos_fecho').select('data_inicio, data_fim')
    if (perfil) setSaldo(calcularSaldo(perfil, presencas, feriados || [], periodos || []))
  }

  async function carregarSessoesDia(data) {
    const { data: { user } } = await supabase.auth.getUser()
    const dataStr = data.toISOString().split('T')[0]
    let diaSemana = data.getDay()
    if (diaSemana === 0) return setSessoesDia([])
    const { data: feriado } = await supabase.from('feriados').select('id').eq('data', dataStr).maybeSingle()
    const { data: periodo } = await supabase.from('periodos_fecho').select('id').lte('data_inicio', dataStr).gte('data_fim', dataStr).maybeSingle()
    if (feriado || periodo) return setSessoesDia([{ _fecho: true }])
    const { data: sessoes } = await supabase.from('sessoes')
      .select('*, aulas(*, professores(nome)), marcacoes(cliente_id, estado)')
      .eq('data', dataStr).eq('cancelada', false)
    if (sessoes && sessoes.length > 0) {
      setSessoesDia(sessoes.sort((a,b) => a.aulas.hora.localeCompare(b.aulas.hora)))
    } else {
      const { data: aulas } = await supabase.from('aulas').select('*, professores(nome)')
        .eq('dia_semana', diaSemana).eq('ativa', true).order('hora')
      setSessoesDia((aulas || []).map(a => ({ id: null, aula_id: a.id, data: dataStr, aulas: a, marcacoes: [], _virtual: true })))
    }
  }

  function diasDaSemana() {
    const hoje = new Date()
    const base = new Date(hoje)
    const diaSemana = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1
    base.setDate(hoje.getDate() - diaSemana + semanaOffset * 7)
    return Array.from({ length: 6 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d })
  }

  async function cancelarMarcacao(marcacaoId, sessaoData) {
    const agora = new Date()
    const dataSessao = new Date(sessaoData + 'T00:00:00')
    const ficaCredito = (dataSessao - agora) / 3600000 >= 24
    await supabase.from('marcacoes').update({ estado: ficaCredito ? 'credito' : 'cancelada' }).eq('id', marcacaoId)
    if (ficaCredito) {
      const newCred = (perfil.creditos || 0) + 1
      await supabase.from('profiles').update({ creditos: newCred }).eq('id', perfil.id)
      setPerfil(p => ({ ...p, creditos: newCred }))
      mostrarNotif('Aula cancelada — crédito adicionado à sua conta.')
    } else {
      mostrarNotif('Aula cancelada.')
    }
    setModal(null); carregarProximas()
  }

  async function marcarAula(sessao) {
    const { data: { user } } = await supabase.auth.getUser()
    let sessaoId = sessao.id
    if (sessao._virtual) {
      const { data: nova, error } = await supabase.from('sessoes')
        .insert({ aula_id: sessao.aula_id, data: sessao.data }).select().single()
      if (error) { mostrarNotif('Erro ao marcar aula.'); return }
      sessaoId = nova.id
    }
    const usouCredito = (perfil?.creditos || 0) > 0
    const { error } = await supabase.from('marcacoes')
      .insert({ sessao_id: sessaoId, cliente_id: user.id, estado: 'confirmada', tipo: 'reposicao', usou_credito: usouCredito })
    if (!error) {
      if (usouCredito) {
        const newCred = perfil.creditos - 1
        await supabase.from('profiles').update({ creditos: newCred }).eq('id', perfil.id)
        setPerfil(p => ({ ...p, creditos: newCred }))
      }
      mostrarNotif('Aula marcada com sucesso.')
      setModal(null); carregarSessoesDia(diaSelecionado)
    }
  }

  async function entrarListaEspera(sessao) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('lista_espera').insert({ sessao_id: sessao.id, aula_id: sessao.aula_id, cliente_id: user.id })
    mostrarNotif('Entrou na lista de espera.')
    setModal(null); carregarSessoesDia(diaSelecionado)
  }

  async function enviarAvaliacao() {
    const { data: { user } } = await supabase.auth.getUser()
    const mes = new Date().getMonth() + 1
    const ano = new Date().getFullYear()
    await supabase.from('avaliacoes').upsert({ cliente_id: user.id, mes, ano, nota: avaliacao.nota, comentario: avaliacao.comentario }, { onConflict: 'cliente_id,mes,ano' })
    setAvaliacaoEnviada(true); mostrarNotif('Avaliação enviada. Obrigada!')
  }

  async function submeterBaixa() {
    const { data: { user } } = await supabase.auth.getUser()
    let url = null
    if (justificacaoFile) {
      const { data: upload } = await supabase.storage.from('documentos').upload(`baixas/${user.id}/${Date.now()}`, justificacaoFile)
      if (upload) url = upload.path
    }
    await supabase.from('baixas').insert({ cliente_id: user.id, data_inicio: new Date().toISOString().split('T')[0], justificacao_url: url, estado: 'pendente' })
    mostrarNotif('Justificação enviada.')
    setModal(null)
  }

  async function carregarMensagens() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('mensagens')
      .select('*, profiles!mensagens_de_id_fkey(nome)')
      .or(`de_id.eq.${user.id},para_id.eq.${user.id}`)
      .order('criado_em', { ascending: true }).limit(50)
    setMensagens(data || [])
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('mensagens').insert({ de_id: user.id, mensagem: novaMensagem })
    setNovaMensagem(''); carregarMensagens()
  }

  async function marcarNotificacoesLidas() {
    const ids = notificacoes.map(n => n.id)
    if (ids.length) await supabase.from('notificacoes').update({ lida: true }).in('id', ids)
    setNotificacoes([])
  }

  function mostrarNotif(msg) { setNotif(msg); setTimeout(() => setNotif(''), 3500) }
  async function sair() { await supabase.auth.signOut() }

  const nomeCurto = perfil?.nome?.split(' ')[0] || ''
  const dias = diasDaSemana()
  const pendente = perfil?.estado === 'pendente'

  const planoLabel = {
    '1x_semana': '1× Semana', '2x_semana': '2× Semana',
    'duo': 'Duo', 'individual': 'Individual'
  }

  if (pendente) return (
    <div className="app-wrap">
      <div className="header">
        <div className="logo"><LogoSVG /> <span><span className="logo-hi">Hi</span>pilates</span></div>
        <div className="user-menu" onClick={sair}>Sair</div>
      </div>
      <div className="content" style={{textAlign:'center',paddingTop:'3rem'}}>
        <div style={{width:'64px',height:'64px',background:'var(--areia)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem',fontSize:'28px'}}>⏳</div>
        <div style={{fontSize:'20px',fontWeight:600,letterSpacing:'1px',marginBottom:'1rem',color:'var(--grafite)'}}>Inscrição em análise</div>
        <p style={{fontSize:'13px',color:'var(--texto-muted)',lineHeight:1.8,marginBottom:'2rem'}}>
          A sua inscrição está a ser analisada.<br/>Será contactada assim que for validada.
        </p>
      </div>
    </div>
  )

  return (
    <div className="app-wrap">
      {notif && <div className="notif-toast">{notif}</div>}
      <div className="header">
        <div className="logo"><LogoSVG /> <span><span className="logo-hi">Hi</span>pilates</span></div>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          {notificacoes.length > 0 && (
            <div style={{position:'relative',cursor:'pointer'}} onClick={marcarNotificacoesLidas}>
              <span style={{fontSize:'18px',color:'var(--madeira)'}}>🔔</span>
              <span style={{position:'absolute',top:'-4px',right:'-4px',background:'var(--erro)',color:'white',borderRadius:'50%',width:'14px',height:'14px',fontSize:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600}}>{notificacoes.length}</span>
            </div>
          )}
          <div className="user-menu" onClick={sair}>{nomeCurto} · Sair</div>
        </div>
      </div>

      <div className="nav-tabs">
        {[['inicio','Início'],['marcar','Repor'],['historico','Histórico'],['chat','Chat'],['conta','Conta']].map(([id,label]) => (
          <div key={id} className={`nav-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</div>
        ))}
      </div>

      <div className="content">

        {tab === 'inicio' && (
          <>
            {comunicados.map(c => (
              <div key={c.id} className="comunicado">
                <div className="comunicado-titulo">{c.titulo}</div>
                <div className="comunicado-msg">{c.mensagem}</div>
              </div>
            ))}

            {proximaAula && (
              <div className="proxima-aula-card">
                <div className="proxima-aula-label">Próxima aula</div>
                <div className="proxima-aula-hora">{proximaAula.sessoes?.aulas?.hora?.slice(0,5)}</div>
                <div className="proxima-aula-info">
                  {new Date(proximaAula.sessoes?.data).toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}
                  {proximaAula.sessoes?.professores?.nome ? ` · ${proximaAula.sessoes.professores.nome}` : ''}
                </div>
              </div>
            )}

            <div className="credito-box">
              <div>
                <div className="credito-label">Créditos disponíveis</div>
                <div className="credito-num">{perfil?.creditos || 0}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'9px',color:'rgba(255,255,255,0.5)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'6px',fontWeight:500}}>Plano</div>
                <div style={{fontSize:'14px',color:'white',fontWeight:500,letterSpacing:'0.5px'}}>{planoLabel[perfil?.plano] || perfil?.plano}</div>
              </div>
            </div>

            <div className="section-title">As suas aulas</div>
            {proximasAulas.length === 0
              ? <p style={{color:'var(--texto-muted)',fontSize:'13px',marginBottom:'1rem',lineHeight:1.7}}>Sem aulas agendadas. Aguarda a atribuição da turma pela equipa.</p>
              : proximasAulas.map(m => (
                <div key={m.id} className="aula-card" onClick={()=>setModal({tipo:'cancelar',dados:m})}>
                  <div>
                    <div className="aula-hora">{m.sessoes?.aulas?.hora?.slice(0,5)} — {m.sessoes?.aulas?.nome}</div>
                    <div className="aula-detalhe">
                      {new Date(m.sessoes?.data).toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}
                      {m.sessoes?.professores?.nome ? ` · ${m.sessoes.professores.nome}` : ''}
                      {m.tipo === 'reposicao' ? ' · reposição' : ''}
                    </div>
                  </div>
                  <span className="badge badge-brown">confirmada</span>
                </div>
              ))
            }

            <div className="notif" style={{marginTop:'1rem'}}>
              <span>Cancelamentos com mais de 24h ficam como crédito para reposição noutra aula.</span>
            </div>
          </>
        )}

        {tab === 'marcar' && (
          <>
            <div className="notif" style={{marginBottom:'1rem'}}>
              <span>Aqui pode repor aulas em falta usando os seus créditos disponíveis.</span>
            </div>
            <div className="section-title">Selecione o dia</div>
            <div className="week-nav">
              <button className="btn btn-sm btn-ghost" onClick={()=>setSemanaOffset(o=>o-1)}>←</button>
              <span className="week-label">{dias[0].toLocaleDateString('pt-PT',{day:'numeric',month:'short'})} – {dias[5].toLocaleDateString('pt-PT',{day:'numeric',month:'short',year:'numeric'})}</span>
              <button className="btn btn-sm btn-ghost" onClick={()=>setSemanaOffset(o=>o+1)}>→</button>
            </div>
            <div className="week-days">
              {dias.map((d,i) => (
                <div key={i} className={`day-btn ${d.toDateString()===diaSelecionado.toDateString()?'active':''}`} onClick={()=>setDiaSelecionado(d)}>
                  <span className="day-name">{DIAS[d.getDay()===0?7:d.getDay()]}</span>{d.getDate()}
                </div>
              ))}
            </div>

            {diaSelecionado.getDay() === 0
              ? <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Estúdio fechado ao domingo.</p>
              : sessoesDia[0]?._fecho
                ? <div className="notif">Estúdio encerrado neste dia.</div>
                : sessoesDia.length === 0
                  ? <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Sem aulas neste dia.</p>
                  : sessoesDia.map(s => {
                      const inscritas = (s.marcacoes||[]).filter(m=>m.estado!=='cancelada').length
                      const vagas = (s.aulas?.max_pessoas || 5) - inscritas
                      const euInscrito = (s.marcacoes||[]).some(m=>m.cliente_id===perfil?.id&&m.estado==='confirmada')
                      const naEspera = listaEspera.some(e=>e.sessao_id===s.id)
                      return (
                        <div key={s.id||s.aula_id} className={`aula-card ${vagas===0&&!euInscrito?'cheia':''}`}
                          onClick={()=>!euInscrito&&setModal({tipo:'marcar',dados:s,vagas,naEspera})}>
                          <div>
                            <div className="aula-hora">{s.aulas?.hora?.slice(0,5)} — {s.aulas?.nome}</div>
                            <div className="aula-detalhe">
                              {euInscrito?'Inscrita':naEspera?'Em lista de espera':vagas===0?'Sem vagas':`${vagas} vaga${vagas!==1?'s':''}`}
                              {s.aulas?.professores?.nome ? ` · ${s.aulas.professores.nome}` : ''}
                            </div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            {euInscrito ? <span className="badge badge-brown">inscrita</span>
                              : naEspera ? <span className="badge badge-amber">espera</span>
                              : <><span className="vagas-num" style={{color:vagas===0?'var(--erro)':'var(--madeira)'}}>{vagas}</span><span style={{fontSize:'11px',color:'var(--texto-muted)'}}>vagas</span></>}
                          </div>
                        </div>
                      )
                    })
            }
          </>
        )}

        {tab === 'historico' && (
          <>
            <div className="section-title">Histórico de aulas</div>
            <div className="card">
              {historico.length === 0
                ? <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Sem histórico ainda.</p>
                : historico.map(m => (
                  <div key={m.id} className="historico-item">
                    <div className="historico-data">{new Date(m.sessoes?.data).toLocaleDateString('pt-PT',{day:'numeric',month:'short'})}</div>
                    <div className="historico-aula">{m.sessoes?.aulas?.nome} · {m.sessoes?.aulas?.hora?.slice(0,5)}</div>
                    <span className={`badge ${m.estado==='presente'?'badge-green':m.estado==='credito'?'badge-amber':'badge-red'}`}>{m.estado}</span>
                  </div>
                ))
              }
            </div>

            <div className="section-title">Avaliação do mês</div>
            <div className="card">
              <p style={{fontSize:'12px',color:'var(--texto-muted)',marginBottom:'1rem',fontWeight:500}}>{new Date().toLocaleDateString('pt-PT',{month:'long',year:'numeric'})}</p>
              <div className="stars" style={{marginBottom:'1rem'}}>
                {[1,2,3,4,5].map(n => <span key={n} className={`star ${avaliacao.nota>=n?'ativo':''}`} onClick={()=>!avaliacaoEnviada&&setAvaliacao(a=>({...a,nota:n}))}>★</span>)}
              </div>
              {!avaliacaoEnviada && (
                <>
                  <textarea className="form-textarea" placeholder="Comentário opcional..." value={avaliacao.comentario} onChange={e=>setAvaliacao(a=>({...a,comentario:e.target.value}))} style={{marginBottom:'8px'}} />
                  <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={enviarAvaliacao} disabled={avaliacao.nota===0}>Enviar avaliação</button>
                </>
              )}
              {avaliacaoEnviada && <p style={{fontSize:'12px',color:'var(--sucesso)',fontWeight:500}}>Obrigada pela sua avaliação. ✓</p>}
            </div>

            <div className="section-title">Justificação médica</div>
            <div className="card">
              <p style={{fontSize:'12px',color:'var(--texto-muted)',marginBottom:'1rem',lineHeight:1.6}}>
                Em caso de baixa médica, submeta a justificação para compensação automática da aula.
              </p>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setJustificacaoFile(e.target.files[0])} style={{fontSize:'12px',marginBottom:'8px',width:'100%'}} />
              <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={submeterBaixa}>Enviar justificação</button>
              {baixas.map(b => (
                <div key={b.id} className="modal-row" style={{marginTop:'8px',paddingTop:'8px',borderTop:'0.5px solid var(--borda)'}}>
                  <span className="modal-label">{b.data_inicio}</span>
                  <span className={`badge ${b.estado==='aprovada'?'badge-green':b.estado==='pendente'?'badge-amber':'badge-red'}`}>{b.estado}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'chat' && (
          <>
            <div className="section-title">Mensagens</div>
            <div className="card" style={{padding:'1rem'}}>
              <div className="chat-wrap">
                {mensagens.length === 0
                  ? <p style={{color:'var(--texto-muted)',fontSize:'13px',textAlign:'center',marginTop:'2rem'}}>Sem mensagens ainda.</p>
                  : mensagens.map(m => {
                      const euSou = m.de_id === perfil?.id
                      return (
                        <div key={m.id} style={{display:'flex',justifyContent:euSou?'flex-end':'flex-start'}}>
                          <div className={`bubble ${euSou?'bubble-eu':'bubble-outro'}`}>
                            {!euSou && <div className="bubble-nome">{m.profiles?.nome}</div>}
                            {m.mensagem}
                            <div className="bubble-hora">{new Date(m.criado_em).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                        </div>
                      )
                    })
                }
              </div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <input className="form-input" value={novaMensagem} onChange={e=>setNovaMensagem(e.target.value)}
                placeholder="Escreva uma mensagem..." onKeyDown={e=>e.key==='Enter'&&enviarMensagem()} style={{flex:1}} />
              <button className="btn btn-primary" onClick={enviarMensagem} style={{padding:'12px 16px'}}>→</button>
            </div>
          </>
        )}

        {tab === 'conta' && perfil && (
          <>
            <div className="card-elevated" style={{marginBottom:'1.5rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'1rem'}}>
                <div className="av av-lg">{perfil.nome?.slice(0,2).toUpperCase()}</div>
                <div>
                  <div style={{fontSize:'18px',fontWeight:600,color:'var(--grafite)',marginBottom:'3px'}}>{perfil.nome}</div>
                  <div style={{fontSize:'12px',color:'var(--texto-muted)'}}>{perfil.email}</div>
                </div>
              </div>
              <div className="divider" />
              <div className="modal-row"><span className="modal-label">Plano</span><span style={{fontWeight:500}}>{planoLabel[perfil.plano] || perfil.plano}</span></div>
              <div className="modal-row"><span className="modal-label">Créditos</span><span style={{color:'var(--madeira)',fontSize:'16px',fontWeight:600}}>{perfil.creditos}</span></div>
            </div>

            {saldo !== null && (
              <>
                <div className="section-title">Saldo anual</div>
                <div className={`saldo-box ${saldo>0?'saldo-positivo':saldo<0?'saldo-negativo':'saldo-neutro'}`}>
                  <div>
                    <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--texto-muted)',marginBottom:'4px',fontWeight:500}}>{saldo>0?'A seu favor':'Em falta'}</div>
                    <div className="saldo-num" style={{color:saldo>0?'var(--sucesso)':saldo<0?'var(--erro)':'var(--grafite)'}}>{saldo>0?'+':''}{saldo} aula{Math.abs(saldo)!==1?'s':''}</div>
                  </div>
                  <div style={{fontSize:'12px',color:'var(--texto-muted)',maxWidth:'130px',textAlign:'right',lineHeight:1.5}}>
                    {saldo>0?'Tem aulas a seu favor este ano':'Tem aulas em falta este ano'}
                  </div>
                </div>
              </>
            )}

            {stats && (
              <>
                <div className="section-title">Estatísticas</div>
                <div className="metrics-grid">
                  <div className="metric"><span className="metric-val">{stats.presencas}</span><span className="metric-label">Presenças</span></div>
                  <div className="metric"><span className="metric-val">{stats.total}</span><span className="metric-label">Total</span></div>
                  <div className="metric"><span className="metric-val">{stats.credUsados}</span><span className="metric-label">Créditos</span></div>
                </div>
                <div className="section-title">Conquistas</div>
                {CONQUISTAS.map(c => {
                  const desbloqueada = stats.presencas >= c.min
                  return (
                    <div key={c.id} className={`conquista ${!desbloqueada?'bloqueada':''}`}>
                      <div className="conquista-icon">{c.icon}</div>
                      <div>
                        <div className="conquista-nome">{c.nome}</div>
                        <div className="conquista-desc">{c.desc}</div>
                      </div>
                      {desbloqueada && <span className="badge badge-green" style={{marginLeft:'auto'}}>✓</span>}
                    </div>
                  )
                })}
              </>
            )}

            <div className="section-title">Definições da conta</div>
            <ContaCliente perfil={perfil} onAtualizar={carregarPerfil} onSair={sair} />
          </>
        )}
      </div>

      {modal?.tipo === 'cancelar' && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Cancelar aula</div>
            <div className="modal-aula">
              <div className="modal-row"><span className="modal-label">Aula</span><span>{modal.dados.sessoes?.aulas?.nome}</span></div>
              <div className="modal-row"><span className="modal-label">Data</span><span>{new Date(modal.dados.sessoes?.data).toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}</span></div>
              <div className="modal-row"><span className="modal-label">Hora</span><span>{modal.dados.sessoes?.aulas?.hora?.slice(0,5)}</span></div>
            </div>
            <div className="notif">Cancelamentos com +24h ficam como crédito para reposição.</div>
            <div className="modal-actions">
              <button className="btn" onClick={()=>setModal(null)}>Manter</button>
              <button className="btn btn-danger" onClick={()=>cancelarMarcacao(modal.dados.id,modal.dados.sessoes?.data)}>Cancelar aula</button>
            </div>
          </div>
        </div>
      )}

      {modal?.tipo === 'marcar' && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{modal.vagas===0?'Sem vagas':'Repor aula'}</div>
            <div className="modal-aula">
              <div className="modal-row"><span className="modal-label">Aula</span><span>{modal.dados.aulas?.nome}</span></div>
              <div className="modal-row"><span className="modal-label">Hora</span><span>{modal.dados.aulas?.hora?.slice(0,5)}</span></div>
              <div className="modal-row"><span className="modal-label">Data</span><span>{diaSelecionado.toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}</span></div>
            </div>
            {modal.vagas === 0 && !modal.naEspera && (
              <>
                <p style={{fontSize:'13px',color:'var(--texto-muted)',marginBottom:'1rem',lineHeight:1.6}}>Esta aula não tem vagas. Deseja entrar na lista de espera?</p>
                <div className="modal-actions">
                  <button className="btn" onClick={()=>setModal(null)}>Não, obrigada</button>
                  <button className="btn btn-primary" onClick={()=>entrarListaEspera(modal.dados)}>Lista de espera</button>
                </div>
              </>
            )}
            {modal.vagas > 0 && (
              <>
                {(perfil?.creditos||0)>0 && <div className="notif" style={{marginBottom:'1rem'}}>Será utilizado 1 crédito da sua conta.</div>}
                {(perfil?.creditos||0)===0 && <div className="notif" style={{marginBottom:'1rem',background:'var(--erro-bg)',borderColor:'#e0c0c0',color:'var(--erro)'}}>Não tem créditos disponíveis. Contacte o estúdio.</div>}
                <div className="modal-actions">
                  <button className="btn" onClick={()=>setModal(null)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={()=>marcarAula(modal.dados)} disabled={(perfil?.creditos||0)===0}>Confirmar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

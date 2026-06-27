import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS_SEMANA = ['','Seg','Ter','Qua','Qui','Sex','Sáb']

const LogoSVG = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
    <path d="M8 6 Q10 14 9 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M9 14 Q13 10 16 14" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M16 14 Q17 20 16 26" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="7" r="2.5" fill="var(--madeira)" opacity="0.5"/>
    <path d="M18 10 Q21 14 24 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
)

export default function AdminApp() {
  const [tab, setTab] = useState('hoje')
  const [sessoesHoje, setSessoesHoje] = useState([])
  const [clientes, setClientes] = useState([])
  const [pendentes, setPendentes] = useState([])
  const [professores, setProfessores] = useState([])
  const [aulas, setAulas] = useState([])
  const [avaliacoes, setAvaliacoes] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [feriados, setFeriados] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [comunicados, setComunicados] = useState([])
  const [listaEsperaGeral, setListaEsperaGeral] = useState([])
  const [baixasPendentes, setBaixasPendentes] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [financeiro, setFinanceiro] = useState(null)
  const [modal, setModal] = useState(null)
  const [notif, setNotif] = useState('')
  const [novoComun, setNovoComun] = useState({titulo:'',mensagem:''})
  const [novoFeriado, setNovoFeriado] = useState({data:'',motivo:''})
  const [novoPeriodo, setNovoPeriodo] = useState({data_inicio:'',data_fim:'',motivo:''})
  const [novoProfessor, setNovoProfessor] = useState({nome:'',email:''})
  const [respostaMensagem, setRespostaMensagem] = useState('')
  const [aniversariosHoje, setAniversariosHoje] = useState([])
  const [edicaoCliente, setEdicaoCliente] = useState(null)
  const [pedidosAlteracao, setPedidosAlteracao] = useState([])
  const HORAS_FLEX = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00']
  const [novasSessoes, setNovasSessoes] = useState([])
  const [modoListaEspera, setModoListaEspera] = useState(false)
  const [calendarioOcupacao, setCalendarioOcupacao] = useState({})

  useEffect(()=>{ carregarModoListaEspera() },[])
  useEffect(()=>{ if(tab==='hoje') { carregarHoje(); carregarAniversarios() } },[tab])
  useEffect(()=>{ if(tab==='inscricoes') carregarCalendarioOcupacao() },[tab])
  useEffect(()=>{ if(tab==='inscricoes') { carregarPendentes(); carregarClientes(); carregarAulas(); carregarProfessores() } },[tab])
  useEffect(()=>{ if(tab==='financeiro') carregarFinanceiro() },[tab])
  useEffect(()=>{ if(tab==='gestao') { carregarComunicados(); carregarFeriados(); carregarProfessores(); carregarListaEsperaGeral(); carregarBaixasPendentes(); carregarPedidosAlteracao() } },[tab])
  useEffect(()=>{ if(tab==='avaliacoes') carregarAvaliacoes() },[tab])
  useEffect(()=>{ if(tab==='chat') carregarTodasMensagens() },[tab])

  async function carregarModoListaEspera() {
    const { data } = await supabase.from('configuracoes').select('valor').eq('chave','modo_lista_espera').maybeSingle()
    setModoListaEspera(data?.valor === 'true')
  }

  async function toggleModoListaEspera() {
    const novoValor = !modoListaEspera
    await supabase.from('configuracoes').upsert({ chave: 'modo_lista_espera', valor: novoValor ? 'true' : 'false', atualizado_em: new Date().toISOString() }, { onConflict: 'chave' })
    setModoListaEspera(novoValor)
    mostrarNotif(novoValor ? 'Modo lista de espera ativado.' : 'Modo lista de espera desativado.')
  }

  async function carregarCalendarioOcupacao() {
    const hoje = new Date()
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay() + 1)
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(inicioSemana.getDate() + 6)
    const { data } = await supabase.from('sessoes')
      .select('id, aula_id, data, aulas(dia_semana, hora, max_pessoas), marcacoes(id, estado)')
      .gte('data', inicioSemana.toISOString().split('T')[0])
      .lte('data', fimSemana.toISOString().split('T')[0])
      .eq('cancelada', false)
    const ocup = {}
    for (const s of data || []) {
      const key = `${s.aulas?.dia_semana}-${s.aulas?.hora?.slice(0,5)}`
      const inscritos = (s.marcacoes||[]).filter(m=>m.estado!=='cancelada').length
      ocup[key] = { inscritos, max: s.aulas?.max_pessoas || 5, sessao_id: s.id }
    }
    setCalendarioOcupacao(ocup)
  }

  async function atribuirTurmaCalendario(clienteId, aulaId, nomeCliente, diaHora) {
    setModal({ tipo: 'confirmar_turma', clienteId, aulaId, nomeCliente, diaHora })
  }

  async function carregarHoje() {
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('sessoes')
      .select('*, aulas(*, professores(nome)), marcacoes(*, profiles(nome))')
      .eq('data', hoje).eq('cancelada', false)
    setSessoesHoje((data||[]).sort((a,b)=>a.aulas?.hora?.localeCompare(b.aulas?.hora)))
  }

  async function carregarAniversarios() {
    const hoje = new Date()
    const mes = hoje.getMonth() + 1
    const dia = hoje.getDate()
    const { data } = await supabase.from('profiles').select('nome, data_nascimento').eq('estado','ativo')
    const aniv = (data||[]).filter(c => {
      if (!c.data_nascimento) return false
      const d = new Date(c.data_nascimento)
      return d.getMonth() + 1 === mes && d.getDate() === dia
    })
    setAniversariosHoje(aniv)
  }

  async function carregarClientes() {
    const { data } = await supabase.from('profiles').select('*').eq('estado','ativo').order('nome')
    setClientes(data||[])
  }

  async function carregarPendentes() {
    const { data } = await supabase.from('profiles').select('*').eq('estado','pendente').order('criado_em')
    setPendentes(data||[])
  }

  async function carregarAulas() {
    const { data } = await supabase.from('aulas').select('*, professores(nome)').eq('ativa',true).order('dia_semana').order('hora')
    setAulas(data||[])
  }

  async function carregarProfessores() {
    const { data } = await supabase.from('professores').select('*').eq('ativo',true)
    setProfessores(data||[])
  }

  async function carregarAvaliacoes() {
    const { data } = await supabase.from('avaliacoes').select('*, profiles(nome)').order('criado_em',{ascending:false}).limit(50)
    setAvaliacoes(data||[])
  }

  async function carregarFinanceiro() {
    const { data: profs } = await supabase.from('profiles').select('plano,estado,nome,id').eq('estado','ativo')
    const { data: pags } = await supabase.from('pagamentos').select('*').order('criado_em',{ascending:false})
    setPagamentos(pags||[])
    const ativos = profs||[]
    setFinanceiro({
      '1x': ativos.filter(p=>p.plano==='1x_semana').length,
      '2x': ativos.filter(p=>p.plano==='2x_semana').length,
      duo: ativos.filter(p=>p.plano==='duo').length,
      individual: ativos.filter(p=>p.plano==='individual').length,
      receita1x: ativos.filter(p=>p.plano==='1x_semana').length * 55,
      receita2x: ativos.filter(p=>p.plano==='2x_semana').length * 90,
      clientes: ativos,
      mes: new Date().getMonth()+1,
      ano: new Date().getFullYear()
    })
  }

  async function carregarComunicados() {
    const { data } = await supabase.from('comunicados').select('*').order('criado_em',{ascending:false})
    setComunicados(data||[])
  }

  async function carregarFeriados() {
    const { data: f } = await supabase.from('feriados').select('*').order('data')
    const { data: p } = await supabase.from('periodos_fecho').select('*').order('data_inicio')
    setFeriados(f||[]); setPeriodos(p||[])
  }

  async function carregarListaEsperaGeral() {
    const { data } = await supabase.from('lista_espera_geral').select('*').order('criado_em',{ascending:false})
    setListaEsperaGeral(data||[])
  }

  async function carregarBaixasPendentes() {
    const { data } = await supabase.from('baixas').select('*, profiles(nome)').eq('estado','pendente')
    setBaixasPendentes(data||[])
  }

  async function carregarPedidosAlteracao() {
    const { data } = await supabase.from('pedidos_alteracao_plano').select('*, profiles(nome, email)').eq('estado','pendente').order('criado_em',{ascending:false})
    setPedidosAlteracao(data||[])
  }

  async function carregarTodasMensagens() {
    const { data } = await supabase.from('mensagens')
      .select('*, profiles!mensagens_de_id_fkey(nome,id)')
      .order('criado_em',{ascending:false}).limit(100)
    setMensagens(data||[])
  }

  async function gerarSessoesEMarcacoes(clienteId, aulaId) {
    const aula = aulas.find(a => a.id === aulaId)
    if (!aula) return null
    const datas = []
    let d = new Date()
    for (let i = 0; i < 56; i++) {
      if (d.getDay() === aula.dia_semana) datas.push(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }
    for (const data of datas) {
      let { data: sessao } = await supabase.from('sessoes').select('id').eq('aula_id', aulaId).eq('data', data).maybeSingle()
      if (!sessao) {
        const { data: nova } = await supabase.from('sessoes').insert({ aula_id: aulaId, data }).select().single()
        sessao = nova
      }
      if (sessao) {
        await supabase.from('marcacoes').upsert({ sessao_id: sessao.id, cliente_id: clienteId, estado: 'confirmada', tipo: 'regular' }, { onConflict: 'sessao_id,cliente_id' })
      }
    }
    return aula
  }

  // aulaIds: array com 1 ou 2 ids de aulas (2 para plano 2x_semana)
  async function validarInscricao(clienteId, aulaIds) {
    const hoje = new Date().toISOString().split('T')[0]
    const [aulaId1, aulaId2] = aulaIds
    await supabase.from('profiles').update({
      estado: 'ativo', data_inicio: hoje, turma_id: aulaId1 || null, turma2_id: aulaId2 || null
    }).eq('id', clienteId)

    const aula1 = aulaId1 ? await gerarSessoesEMarcacoes(clienteId, aulaId1) : null
    const aula2 = aulaId2 ? await gerarSessoesEMarcacoes(clienteId, aulaId2) : null

    const turmasTexto = [aula1, aula2].filter(Boolean)
      .map(a => `${DIAS_SEMANA[a.dia_semana]} às ${a.hora?.slice(0,5)}`).join(' e ')

    await supabase.from('notificacoes').insert({
      cliente_id: clienteId,
      titulo: 'Inscrição validada!',
      mensagem: `A sua inscrição foi aprovada. ${turmasTexto ? `A sua turma é ${turmasTexto}.` : ''} Proceda ao pagamento da taxa de inscrição (10€).`,
      tipo: 'sucesso'
    })
    mostrarNotif('Inscrição validada e turma(s) atribuída(s)!'); setModal(null)
    carregarPendentes(); carregarClientes()
  }

  async function eliminarCliente(clienteId) {
    if (!window.confirm('Tem a certeza que quer eliminar este cliente? Esta ação é irreversível e remove todo o histórico associado.')) return
    const { error } = await supabase.from('profiles').delete().eq('id', clienteId)
    if (error) { mostrarNotif('Erro ao eliminar: ' + error.message); return }
    mostrarNotif('Cliente eliminado.'); setModal(null)
    carregarPendentes(); carregarClientes()
  }

  async function guardarEdicaoCliente(clienteId, dados) {
    const update = {
      plano: dados.plano,
      turma_id: dados.turma_id || null,
      turma2_id: dados.plano === '2x_semana' ? (dados.turma2_id || null) : null,
      creditos: dados.creditos,
      estado: dados.estado || 'ativo',
      nome: dados.nome || undefined,
      telemovel: dados.telemovel || undefined,
    }
    const { error } = await supabase.from('profiles').update(update).eq('id', clienteId)
    if (error) { mostrarNotif('Erro ao guardar: ' + error.message); return }
    mostrarNotif('Cliente atualizado.'); setModal(null)
    carregarClientes()
  }

  async function rejeitarInscricao(clienteId) {
    await supabase.from('profiles').update({ estado: 'rejeitado' }).eq('id', clienteId)
    await supabase.from('notificacoes').insert({ cliente_id: clienteId, titulo: 'Inscrição não aprovada', mensagem: 'A sua inscrição não foi aprovada. Contacte-nos para mais informações.', tipo: 'erro' })
    mostrarNotif('Inscrição rejeitada.'); carregarPendentes()
  }

  async function marcarPresenca(marcacaoId, presente) {
    await supabase.from('marcacoes').update({ estado: presente ? 'presente' : 'confirmada' }).eq('id', marcacaoId)
    mostrarNotif(presente ? 'Presença confirmada.' : 'Presença removida.'); carregarHoje()
  }

  async function cancelarSessao(sessaoId) {
    await supabase.from('sessoes').update({ cancelada: true }).eq('id', sessaoId)
    const { data: marcacoes } = await supabase.from('marcacoes').select('cliente_id').eq('sessao_id', sessaoId).eq('estado', 'confirmada')
    await supabase.from('marcacoes').update({ estado: 'credito' }).eq('sessao_id', sessaoId).eq('estado', 'confirmada')
    for (const m of marcacoes || []) {
      const { data: p } = await supabase.from('profiles').select('creditos').eq('id', m.cliente_id).single()
      if (p) await supabase.from('profiles').update({ creditos: p.creditos + 1 }).eq('id', m.cliente_id)
      await supabase.from('notificacoes').insert({ cliente_id: m.cliente_id, titulo: 'Aula cancelada', mensagem: 'A sua aula foi cancelada. Um crédito foi adicionado à sua conta.', tipo: 'info' })
    }
    mostrarNotif('Aula cancelada — créditos atribuídos.'); setModal(null); carregarHoje()
  }

  async function adicionarPeriodoFecho() {
    if (!novoPeriodo.data_inicio || !novoPeriodo.data_fim || !novoPeriodo.motivo) {
      mostrarNotif('Preencha todos os campos.'); return
    }
    await supabase.from('periodos_fecho').insert(novoPeriodo)

    // Crédito automático imediato a todos os clientes ativos com plano mensal
    const { data: clientesAtivos } = await supabase.from('profiles')
      .select('id, creditos, plano').eq('estado', 'ativo')
      .in('plano', ['1x_semana', '2x_semana'])

    if (clientesAtivos && clientesAtivos.length > 0) {
      const inicio = new Date(novoPeriodo.data_inicio)
      const fim = new Date(novoPeriodo.data_fim)
      let semanas = 0
      let d = new Date(inicio)
      while (d <= fim) {
        if (d.getDay() >= 1 && d.getDay() <= 5) semanas += 1/5
        d.setDate(d.getDate() + 1)
      }
      const semanasArredondadas = Math.round(semanas)

      for (const cliente of clientesAtivos) {
        const vezesSemana = cliente.plano === '2x_semana' ? 2 : 1
        const creditos = semanasArredondadas * vezesSemana
        if (creditos > 0) {
          await supabase.from('profiles').update({ creditos: cliente.creditos + creditos }).eq('id', cliente.id)
          await supabase.from('notificacoes').insert({
            cliente_id: cliente.id,
            titulo: 'Créditos adicionados',
            mensagem: `O estúdio estará encerrado de ${new Date(novoPeriodo.data_inicio).toLocaleDateString('pt-PT')} a ${new Date(novoPeriodo.data_fim).toLocaleDateString('pt-PT')} (${novoPeriodo.motivo}). Foram adicionados ${creditos} crédito${creditos!==1?'s':''} à sua conta para reposição.`,
            tipo: 'info'
          })
        }
      }
      mostrarNotif(`Período adicionado — créditos atribuídos a ${clientesAtivos.length} clientes!`)
    } else {
      mostrarNotif('Período de fecho adicionado.')
    }

    setNovoPeriodo({data_inicio:'',data_fim:'',motivo:''}); carregarFeriados()
  }

  async function criarComunicado() {
    if (!novoComun.titulo || !novoComun.mensagem) return
    await supabase.from('comunicados').insert(novoComun)
    setNovoComun({titulo:'',mensagem:''}); mostrarNotif('Comunicado publicado.'); carregarComunicados()
  }

  async function adicionarFeriado() {
    if (!novoFeriado.data || !novoFeriado.motivo) return
    await supabase.from('feriados').insert(novoFeriado)
    setNovoFeriado({data:'',motivo:''}); mostrarNotif('Feriado adicionado.'); carregarFeriados()
  }

  async function adicionarProfessor() {
    if (!novoProfessor.nome) return
    await supabase.from('professores').insert(novoProfessor)
    setNovoProfessor({nome:'',email:''}); mostrarNotif('Professor adicionado.'); carregarProfessores()
  }

  async function registarPagamento(clienteId, valor, tipo) {
    const mes = new Date().getMonth()+1
    const ano = new Date().getFullYear()
    await supabase.from('pagamentos').upsert({ cliente_id: clienteId, tipo, valor, mes, ano, estado: 'pago', data_pagamento: new Date().toISOString().split('T')[0] }, { onConflict: 'cliente_id,mes,ano' })
    await supabase.from('notificacoes').insert({ cliente_id: clienteId, titulo: 'Pagamento confirmado', mensagem: `Pagamento de ${valor}€ confirmado para ${MESES[mes-1]} ${ano}.`, tipo: 'sucesso' })
    mostrarNotif('Pagamento registado.'); carregarFinanceiro()
  }

  async function validarBaixa(baixaId, clienteId, aprovada) {
    await supabase.from('baixas').update({ estado: aprovada ? 'aprovada' : 'rejeitada' }).eq('id', baixaId)
    if (aprovada) {
      const { data: p } = await supabase.from('profiles').select('creditos').eq('id', clienteId).single()
      if (p) await supabase.from('profiles').update({ creditos: p.creditos + 1 }).eq('id', clienteId)
      await supabase.from('notificacoes').insert({ cliente_id: clienteId, titulo: 'Justificação aprovada', mensagem: 'A sua justificação médica foi aprovada. Um crédito foi adicionado.', tipo: 'sucesso' })
    }
    mostrarNotif(aprovada ? 'Baixa aprovada — crédito atribuído.' : 'Baixa rejeitada.')
    carregarBaixasPendentes()
  }

  async function responderMensagem(clienteId) {
    if (!respostaMensagem.trim()) return
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    const { data: adminProfile } = await supabase.from('profiles').select('id').eq('id', adminUser.id).maybeSingle()
    const adminId = adminProfile?.id || adminUser.id
    const { error } = await supabase.from('mensagens').insert({ de_id: adminId, para_id: clienteId, mensagem: respostaMensagem })
    if (error) { mostrarNotif('Erro ao enviar: ' + error.message); return }
    await supabase.from('notificacoes').insert({ cliente_id: clienteId, titulo: 'Nova mensagem', mensagem: 'Tem uma nova mensagem do estúdio.', tipo: 'info' })
    setRespostaMensagem(''); mostrarNotif('Resposta enviada.'); carregarTodasMensagens()
  }

  async function agendarSessaoFlex(clienteId, data, hora) {
    if (!data || !hora) { mostrarNotif('Selecione data e hora.'); return }
    const { error } = await supabase.from('marcacoes_flex').insert({ cliente_id: clienteId, data, hora, estado: 'agendada' })
    if (error) { mostrarNotif('Erro ao agendar: ' + error.message); return }
    await supabase.from('notificacoes').insert({
      cliente_id: clienteId,
      titulo: 'Sessão agendada',
      mensagem: `A sessão foi agendada para ${new Date(data+'T00:00:00').toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})} às ${hora}.`,
      tipo: 'sucesso'
    })
    mostrarNotif(`Sessão agendada: ${data} às ${hora}`)
    setNovasSessoes([])
  }

  async function responderPedidoAlteracao(pedidoId, clienteId, planoPedido, aceitar, planoCustom) {
    const planoFinal = planoCustom || planoPedido
    await supabase.from('pedidos_alteracao_plano').update({ estado: aceitar ? 'aceite' : 'recusado' }).eq('id', pedidoId)
    if (aceitar) {
      await supabase.from('profiles').update({ plano: planoFinal }).eq('id', clienteId)
      await supabase.from('notificacoes').insert({ cliente_id: clienteId, titulo: 'Plano alterado', mensagem: `O plano foi alterado para ${planoLabel[planoFinal]}.`, tipo: 'sucesso' })
      mostrarNotif('Plano alterado com sucesso.')
    } else {
      await supabase.from('notificacoes').insert({ cliente_id: clienteId, titulo: 'Pedido recusado', mensagem: 'O pedido de alteração de plano não foi aprovado. Contacte o estúdio para mais informações.', tipo: 'erro' })
      mostrarNotif('Pedido recusado.')
    }
    carregarPedidosAlteracao(); carregarClientes()
  }

  function mostrarNotif(msg) { setNotif(msg); setTimeout(()=>setNotif(''),4000) }
  async function sair() { await supabase.auth.signOut() }

  const totalReceita = financeiro ? financeiro.receita1x + financeiro.receita2x : 0

  const clientesAgrupados = mensagens.reduce((acc, m) => {
    const id = m.profiles?.id
    if (id && !acc[id]) acc[id] = { nome: m.profiles?.nome, id, msgs: [] }
    if (id) acc[id].msgs.push(m)
    return acc
  }, {})

  const planoLabel = { '1x_semana':'1× Semana', '2x_semana':'2× Semana', 'duo':'Duo', 'individual':'Individual' }

  return (
    <div className="app-wrap">
      {notif && <div className="notif-toast">{notif}</div>}
      <div className="header">
        <a href="/" style={{display:'flex',alignItems:'center',gap:'8px',textDecoration:'none',color:'inherit'}}><img src="/simbolo (header).png.png" alt="Hipilates" style={{height:'28px',objectFit:'contain'}} /> <span style={{fontSize:'15px',fontWeight:600,letterSpacing:'1px',color:'var(--grafite)'}}>hipilates</span></a>
        <div className="user-menu" onClick={sair}>Sair</div>
      </div>
      <div style={{background:'var(--grafite)',padding:'8px 1.5rem',borderBottom:'0.5px solid var(--grafite-suave)'}}>
        <span style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'rgba(255,255,255,0.6)',fontWeight:600}}>Painel de Gestão</span>
      </div>

      <div className="nav-tabs">
        {[
          ['hoje','Hoje'],
          ['inscricoes', pendentes.length ? `Inscrições (${pendentes.length})` : 'Inscrições'],
          ['financeiro','Financeiro'],
          ['chat','Chat'],
          ['avaliacoes','Avaliações'],
          ['gestao','Gestão']
        ].map(([id,label]) => (
          <div key={id} className={`nav-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</div>
        ))}
      </div>

      <div className="content">

        {/* HOJE */}
        {tab === 'hoje' && (
          <>
            {aniversariosHoje.length > 0 && (
              <div className="comunicado" style={{background:'#fff8e8',borderColor:'#f0c040'}}>
                <div className="comunicado-titulo">🎂 Aniversários hoje</div>
                <div className="comunicado-msg">{aniversariosHoje.map(a=>a.nome).join(', ')}</div>
              </div>
            )}

            <div className="metrics-grid">
              <div className="metric"><span className="metric-val">{sessoesHoje.length}</span><span className="metric-label">Aulas hoje</span></div>
              <div className="metric"><span className="metric-val">{sessoesHoje.reduce((s,sess)=>s+(sess.marcacoes?.filter(m=>m.estado!=='cancelada').length||0),0)}</span><span className="metric-label">Inscrições</span></div>
              <div className="metric"><span className="metric-val">{pendentes.length}</span><span className="metric-label">Pendentes</span></div>
            </div>

            <div className="section-title">Aulas de hoje — {new Date().toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'})}</div>
            {sessoesHoje.length === 0
              ? <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Sem aulas hoje.</p>
              : sessoesHoje.map(s => {
                  const inscritas = (s.marcacoes||[]).filter(m=>m.estado!=='cancelada')
                  const vagas = (s.aulas?.max_pessoas||5) - inscritas.length
                  return (
                    <div key={s.id} className="card" style={{marginBottom:'8px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:inscritas.length?'12px':0}}>
                        <div>
                          <div className="aula-hora">{s.aulas?.hora?.slice(0,5)} — {s.aulas?.nome}</div>
                          <div className="aula-detalhe">{s.aulas?.professores?.nome||'Sem professor'}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <span className={`badge ${vagas===0?'badge-red':vagas<=2?'badge-amber':'badge-green'}`}>{inscritas.length}/{s.aulas?.max_pessoas||5}</span>
                          <button className="btn btn-sm btn-danger" onClick={()=>setModal({tipo:'cancelar_sessao',dados:s})}>Cancelar</button>
                        </div>
                      </div>
                      {inscritas.map(m => (
                        <div key={m.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderTop:'0.5px solid var(--borda)'}}>
                          <span style={{fontSize:'14px',fontWeight:400}}>{m.profiles?.nome}</span>
                          <button className={`btn btn-sm ${m.estado==='presente'?'btn-primary':''}`}
                            onClick={()=>marcarPresenca(m.id, m.estado!=='presente')}>
                            {m.estado==='presente'?'✓ Presente':'Marcar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })
            }
          </>
        )}

        {/* INSCRIÇÕES */}
        {tab === 'inscricoes' && (
          <>
            {pendentes.length > 0 && (
              <>
                <div className="section-title">Aguardam validação ({pendentes.length})</div>
                {pendentes.map(c => (
                  <div key={c.id} className="card" style={{marginBottom:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                      <div>
                        <div style={{fontSize:'16px',fontWeight:600,color:'var(--grafite)',marginBottom:'3px'}}>{c.nome}</div>
                        <div style={{fontSize:'11px',color:'var(--texto-muted)'}}>{c.email} · {c.telemovel}</div>
                      </div>
                      <span className="badge badge-amber">pendente</span>
                    </div>
                    <div className="modal-row"><span className="modal-label">Plano</span><span style={{fontWeight:500}}>{planoLabel[c.plano]||c.plano}</span></div>
                    <div className="modal-row"><span className="modal-label">NIF</span><span>{c.nif||'—'}</span></div>
                    {c.morada && <div className="modal-row"><span className="modal-label">Morada</span><span style={{fontSize:'12px',textAlign:'right',maxWidth:'200px'}}>{c.morada}, {c.codigo_postal} {c.localidade}</span></div>}
                    {c.horarios_preferidos?.length > 0 && (
                      <div className="modal-row" style={{alignItems:'flex-start'}}>
                        <span className="modal-label">Horários pref.</span>
                        <div style={{display:'flex',flexWrap:'wrap',gap:'4px',justifyContent:'flex-end',maxWidth:'200px'}}>
                          {c.horarios_preferidos.map((h,i) => (
                            <span key={i} style={{background:'var(--areia)',borderRadius:'3px',padding:'2px 6px',fontSize:'10px',color:'var(--madeira)',fontWeight:600}}>{h}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.objetivos && <div className="modal-row"><span className="modal-label">Objetivos</span><span style={{fontSize:'11px',textAlign:'right',maxWidth:'180px'}}>{c.objetivos}</span></div>}
                    {c.problemas_fisicos && <div className="modal-row"><span className="modal-label">Problemas</span><span style={{fontSize:'11px',textAlign:'right',maxWidth:'180px',color:'var(--erro)'}}>{c.problemas_fisicos}</span></div>}
                    {c.cirurgias && <div className="modal-row"><span className="modal-label">Cirurgias</span><span style={{fontSize:'11px',color:'var(--erro)'}}>{c.cirurgias_descricao}</span></div>}
                    {c.medicacao && <div className="modal-row"><span className="modal-label">Medicação</span><span style={{fontSize:'11px'}}>{c.medicacao_descricao}</span></div>}
                    {c.acompanhante_nome && <div className="modal-row"><span className="modal-label">Acompanhante</span><span style={{fontSize:'11px'}}>{c.acompanhante_nome} · {c.acompanhante_contacto}</span></div>}
                    <div className="divider" />
                    <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--madeira)',marginBottom:'10px',fontWeight:600}}>Atribuir turma — calendário desta semana</div>
                    <div style={{overflowX:'auto',marginBottom:'12px'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
                        <thead>
                          <tr>
                            <th style={{padding:'4px 6px',color:'var(--texto-muted)',fontWeight:500,textAlign:'left'}}>Hora</th>
                            {['Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                              <th key={d} style={{padding:'4px 6px',color:'var(--texto-muted)',fontWeight:500,textAlign:'center'}}>{d}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {['08:00','09:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'].map(hora => (
                            <tr key={hora}>
                              <td style={{padding:'3px 6px',color:'var(--texto-muted)',fontWeight:500,whiteSpace:'nowrap'}}>{hora}</td>
                              {[1,2,3,4,5,6].map(dia => {
                                const key = `${dia}-${hora}`
                                const slot = aulas.find(a => a.dia_semana===dia && a.hora?.slice(0,5)===hora)
                                const ocup = calendarioOcupacao[key]
                                if (!slot) return <td key={dia} style={{padding:'3px 4px',textAlign:'center'}}><span style={{color:'var(--borda)',fontSize:'10px'}}>—</span></td>
                                const inscritos = ocup?.inscritos || 0
                                const max = ocup?.max || slot.max_pessoas || 5
                                const cheio = inscritos >= max
                                return (
                                  <td key={dia} style={{padding:'3px 4px',textAlign:'center'}}>
                                    <button
                                      onClick={()=>{ if(!cheio) atribuirTurmaCalendario(c.id, slot.id, c.nome, `${['','Seg','Ter','Qua','Qui','Sex','Sáb'][dia]} ${hora}`) }}
                                      style={{
                                        padding:'4px 6px',
                                        borderRadius:'4px',
                                        border:'none',
                                        cursor:cheio?'not-allowed':'pointer',
                                        background:cheio?'#f0d0d0':inscritos>0?'#d0e8d0':'#e8f0e8',
                                        color:cheio?'#c04040':inscritos>0?'#2a6a2a':'#4a7a4a',
                                        fontSize:'10px',
                                        fontWeight:600,
                                        minWidth:'32px',
                                        opacity:cheio?0.7:1
                                      }}
                                      title={cheio?'Turma cheia':`${inscritos}/${max} — clique para atribuir`}
                                    >
                                      {inscritos}/{max}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{fontSize:'10px',color:'var(--texto-muted)',marginBottom:'10px'}}>🟢 Com vagas — clique para atribuir · 🔴 Cheio</p>
                  </div>
                ))}
              </>
            )}

            <div className="section-title">Clientes ativos ({clientes.length})</div>
            <div className="card">
              {clientes.map(c => (
                <div key={c.id} className="cliente-row" style={{cursor:'pointer'}} onClick={()=>{setModal({tipo:'cliente',dados:c}); setEdicaoCliente({plano:c.plano, turma_id:c.turma_id||'', turma2_id:c.turma2_id||'', creditos:c.creditos})}}>
                  <div className="cliente-av">{c.nome?.slice(0,2).toUpperCase()}</div>
                  <div className="cliente-info">
                    <div className="cliente-nome">{c.nome}</div>
                    <div className="cliente-plano">{planoLabel[c.plano]||c.plano} · {c.creditos} crédito(s)</div>
                  </div>
                  <span className="badge badge-green">ativo</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FINANCEIRO */}
        {tab === 'financeiro' && financeiro && (
          <>
            <div className="metrics-grid">
              <div className="metric"><span className="metric-val">{totalReceita}€</span><span className="metric-label">Receita mensal</span></div>
              <div className="metric"><span className="metric-val">{financeiro.clientes.length}</span><span className="metric-label">Clientes ativos</span></div>
              <div className="metric"><span className="metric-val">{pagamentos.filter(p=>p.estado==='pendente').length}</span><span className="metric-label">Pendentes</span></div>
            </div>

            <div className="section-title">Breakdown — {MESES[financeiro.mes-1]} {financeiro.ano}</div>
            <div className="card">
              <div className="modal-row" style={{padding:'8px 0'}}><span className="modal-label">1× Semana ({financeiro['1x']} clientes)</span><span style={{fontWeight:500}}>{financeiro.receita1x}€</span></div>
              <div className="modal-row" style={{padding:'8px 0'}}><span className="modal-label">2× Semana ({financeiro['2x']} clientes)</span><span style={{fontWeight:500}}>{financeiro.receita2x}€</span></div>
              <div className="modal-row" style={{padding:'8px 0'}}><span className="modal-label">Duo ({financeiro.duo} clientes)</span><span style={{fontSize:'12px',color:'var(--texto-muted)'}}>por aula</span></div>
              <div className="modal-row" style={{padding:'8px 0'}}><span className="modal-label">Individual ({financeiro.individual} clientes)</span><span style={{fontSize:'12px',color:'var(--texto-muted)'}}>por aula</span></div>
              <div className="divider" />
              <div className="modal-row" style={{padding:'8px 0'}}>
                <span style={{fontWeight:600,fontSize:'14px'}}>Total mensalidades</span>
                <span style={{color:'var(--madeira)',fontSize:'18px',fontWeight:600}}>{totalReceita}€</span>
              </div>
            </div>

            <div className="section-title">Pagamentos — {MESES[financeiro.mes-1]}</div>
            <div className="card">
              {financeiro.clientes.filter(c=>['1x_semana','2x_semana'].includes(c.plano)).map(c => {
                const pago = pagamentos.find(p=>p.cliente_id===c.id&&p.mes===financeiro.mes&&p.ano===financeiro.ano&&p.estado==='pago')
                const valor = c.plano==='1x_semana'?55:90
                return (
                  <div key={c.id} className="cliente-row">
                    <div className="cliente-av">{c.nome?.slice(0,2).toUpperCase()}</div>
                    <div className="cliente-info">
                      <div className="cliente-nome">{c.nome}</div>
                      <div className="cliente-plano">{valor}€ · {planoLabel[c.plano]}</div>
                    </div>
                    {pago
                      ? <span className="badge badge-green">pago ✓</span>
                      : <button className="btn btn-sm btn-primary" onClick={()=>registarPagamento(c.id,valor,'mensalidade')}>Marcar pago</button>
                    }
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* CHAT */}
        {tab === 'chat' && (
          <>
            <div className="section-title">Conversas</div>
            {Object.keys(clientesAgrupados).length === 0
              ? <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Sem mensagens ainda.</p>
              : Object.values(clientesAgrupados).map(conv => (
                <div key={conv.id} className="card" style={{marginBottom:'8px',cursor:'pointer'}} onClick={()=>setClienteSelecionado(clienteSelecionado?.id===conv.id?null:conv)}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:'15px',fontWeight:500}}>{conv.nome}</div>
                    <span className="badge badge-brown">{conv.msgs.length} msg</span>
                  </div>
                  {clienteSelecionado?.id === conv.id && (
                    <div style={{marginTop:'14px'}} onClick={e=>e.stopPropagation()}>
                      <div style={{maxHeight:'220px',overflowY:'auto',marginBottom:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
                        {conv.msgs.slice().reverse().map(m => (
                          <div key={m.id} style={{padding:'8px 12px',background:'var(--creme)',borderRadius:'8px',fontSize:'13px',lineHeight:1.5}}>
                            <div style={{fontSize:'10px',color:'var(--texto-muted)',marginBottom:'3px',fontWeight:500}}>{m.profiles?.nome} · {new Date(m.criado_em).toLocaleString('pt-PT')}</div>
                            {m.mensagem}
                          </div>
                        ))}
                      </div>
                      <div style={{display:'flex',gap:'8px'}} onClick={e=>e.stopPropagation()}>
                        <input className="form-input" value={respostaMensagem} onChange={e=>setRespostaMensagem(e.target.value)}
                          placeholder="Responder..." onKeyDown={e=>e.key==='Enter'&&responderMensagem(conv.id)} style={{flex:1}}
                          onClick={e=>e.stopPropagation()} />
                        <button className="btn btn-primary" onClick={e=>{e.stopPropagation();responderMensagem(conv.id)}} style={{padding:'12px 16px'}}>→</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </>
        )}

        {/* AVALIAÇÕES */}
        {tab === 'avaliacoes' && (
          <>
            <div className="section-title">Avaliações dos utentes</div>
            {avaliacoes.length === 0
              ? <p style={{color:'var(--texto-muted)',fontSize:'13px'}}>Sem avaliações ainda.</p>
              : avaliacoes.map(a => (
                <div key={a.id} className="card" style={{marginBottom:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                    <span style={{fontSize:'14px',fontWeight:500}}>{a.profiles?.nome}</span>
                    <div style={{display:'flex',gap:'2px'}}>{[1,2,3,4,5].map(n=><span key={n} style={{color:a.nota>=n?'var(--madeira)':'var(--borda)',fontSize:'16px'}}>★</span>)}</div>
                  </div>
                  <div style={{fontSize:'11px',color:'var(--texto-muted)',marginBottom:a.comentario?'8px':0,letterSpacing:'0.5px'}}>{MESES[a.mes-1]} {a.ano}</div>
                  {a.comentario && <p style={{fontSize:'13px',color:'var(--texto)',lineHeight:1.6,fontStyle:'italic',borderLeft:'2px solid var(--champanhe)',paddingLeft:'12px'}}>"{a.comentario}"</p>}
                </div>
              ))
            }
          </>
        )}

        {/* GESTÃO */}
        {tab === 'gestao' && (
          <>
            <div className="section-title">Modo lista de espera</div>
            <div className="card" style={{marginBottom:'10px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:'14px',fontWeight:500,color:'var(--grafite)',marginBottom:'4px'}}>
                    {modoListaEspera ? '🔴 Estúdio com capacidade máxima' : '🟢 Estúdio com vagas disponíveis'}
                  </div>
                  <div style={{fontSize:'12px',color:'var(--texto-muted)',lineHeight:1.5}}>
                    {modoListaEspera
                      ? 'Novos inscritos são colocados em lista de espera automaticamente.'
                      : 'Novos inscritos entram normalmente.'}
                  </div>
                </div>
                <button
                  className={`btn ${modoListaEspera?'btn-danger':'btn-primary'}`}
                  style={{marginTop:0,flexShrink:0,marginLeft:'12px'}}
                  onClick={toggleModoListaEspera}
                >
                  {modoListaEspera ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
              <>
                <div className="section-title">Justificações médicas ({baixasPendentes.length})</div>
                {baixasPendentes.map(b => (
                  <div key={b.id} className="card" style={{marginBottom:'8px'}}>
                    <div className="modal-row"><span className="modal-label">Utente</span><span style={{fontWeight:500}}>{b.profiles?.nome}</span></div>
                    <div className="modal-row"><span className="modal-label">Data</span><span>{b.data_inicio}</span></div>
                    {b.justificacao_url && (
                      <div className="modal-row">
                        <span className="modal-label">Documento</span>
                        <a href={b.justificacao_url} target="_blank" rel="noreferrer" style={{fontSize:'12px',color:'var(--madeira)',fontWeight:500}}>Abrir ficheiro →</a>
                      </div>
                    )}
                    <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                      <button className="btn btn-danger btn-full" style={{marginTop:0}} onClick={()=>validarBaixa(b.id,b.cliente_id,false)}>Rejeitar</button>
                      <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={()=>validarBaixa(b.id,b.cliente_id,true)}>Aprovar + crédito</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {pedidosAlteracao.length > 0 && (
              <>
                <div className="section-title">Pedidos de alteração de plano ({pedidosAlteracao.length})</div>
                {pedidosAlteracao.map(p => (
                  <div key={p.id} className="card" style={{marginBottom:'8px'}}>
                    <div className="modal-row"><span className="modal-label">Utente</span><span style={{fontWeight:500}}>{p.profiles?.nome}</span></div>
                    <div className="modal-row"><span className="modal-label">Plano atual</span><span>{planoLabel[p.plano_atual]||p.plano_atual}</span></div>
                    <div className="modal-row"><span className="modal-label">Plano pedido</span><span style={{color:'var(--madeira)',fontWeight:500}}>{planoLabel[p.plano_pedido]||p.plano_pedido}</span></div>
                    <div className="form-group" style={{marginTop:'10px',marginBottom:'8px'}}>
                      <label className="form-label">Aceitar com plano diferente (opcional)</label>
                      <select className="form-select" id={`plano-alt-${p.id}`} defaultValue="">
                        <option value="">— mesmo plano pedido —</option>
                        {['1x_semana','2x_semana','duo','individual'].map(pl => <option key={pl} value={pl}>{planoLabel[pl]}</option>)}
                      </select>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button className="btn btn-danger btn-full" style={{marginTop:0}} onClick={()=>responderPedidoAlteracao(p.id,p.cliente_id,p.plano_pedido,false,null)}>Recusar</button>
                      <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={()=>{
                        const sel = document.getElementById(`plano-alt-${p.id}`)
                        responderPedidoAlteracao(p.id,p.cliente_id,p.plano_pedido,true,sel?.value||null)
                      }}>Aceitar</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {listaEsperaGeral.length > 0 && (
              <>
                <div className="section-title">Lista de espera ({listaEsperaGeral.length})</div>
                <div className="card">
                  {listaEsperaGeral.map(l => (
                    <div key={l.id} className="cliente-row">
                      <div className="cliente-info">
                        <div className="cliente-nome">{l.nome}</div>
                        <div className="cliente-plano">{l.telemovel} · {l.email}</div>
                      </div>
                      <span className={`badge ${l.estado==='contactado'?'badge-green':'badge-amber'}`}>{l.estado}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="section-title">Comunicados</div>
            <div className="card">
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" value={novoComun.titulo} onChange={e=>setNovoComun(c=>({...c,titulo:e.target.value}))} placeholder="Ex: Estúdio fechado" />
              </div>
              <div className="form-group" style={{marginBottom:'8px'}}>
                <label className="form-label">Mensagem</label>
                <textarea className="form-textarea" value={novoComun.mensagem} onChange={e=>setNovoComun(c=>({...c,mensagem:e.target.value}))} placeholder="Mensagem para todos os utentes..." />
              </div>
              <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={criarComunicado}>Publicar</button>
            </div>
            {comunicados.filter(c=>c.ativo).map(c => (
              <div key={c.id} className="comunicado" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div className="comunicado-titulo">{c.titulo}</div><div className="comunicado-msg">{c.mensagem}</div></div>
                <button className="btn btn-sm btn-ghost" onClick={async()=>{await supabase.from('comunicados').update({ativo:false}).eq('id',c.id);carregarComunicados()}}>✕</button>
              </div>
            ))}

            <div className="section-title">Períodos de encerramento</div>
            <div className="card">
              <div className="notif" style={{marginBottom:'1rem'}}>
                <span style={{fontSize:'12px'}}>Ao adicionar um período de fecho, os créditos são atribuídos <strong>imediatamente</strong> a todos os clientes ativos.</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                <div><label className="form-label">De</label><input className="form-input" type="date" value={novoPeriodo.data_inicio} onChange={e=>setNovoPeriodo(p=>({...p,data_inicio:e.target.value}))} /></div>
                <div><label className="form-label">Até</label><input className="form-input" type="date" value={novoPeriodo.data_fim} onChange={e=>setNovoPeriodo(p=>({...p,data_fim:e.target.value}))} /></div>
              </div>
              <input className="form-input" value={novoPeriodo.motivo} onChange={e=>setNovoPeriodo(p=>({...p,motivo:e.target.value}))} placeholder="Motivo (ex: Férias de Agosto)" style={{marginBottom:'10px'}} />
              <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={adicionarPeriodoFecho}>Adicionar + atribuir créditos</button>
              {periodos.map(p => (
                <div key={p.id} className="modal-row" style={{padding:'8px 0',borderTop:'0.5px solid var(--borda)',marginTop:'6px'}}>
                  <span className="modal-label">{new Date(p.data_inicio+'T00:00:00').toLocaleDateString('pt-PT',{day:'numeric',month:'short'})} → {new Date(p.data_fim+'T00:00:00').toLocaleDateString('pt-PT',{day:'numeric',month:'short'})}</span>
                  <span style={{fontSize:'12px',color:'var(--texto-muted)'}}>{p.motivo}</span>
                </div>
              ))}
            </div>

            <div className="section-title">Feriados pontuais</div>
            <div className="card">
              <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                <input className="form-input" type="date" value={novoFeriado.data} onChange={e=>setNovoFeriado(f=>({...f,data:e.target.value}))} style={{flex:1}} />
                <input className="form-input" value={novoFeriado.motivo} onChange={e=>setNovoFeriado(f=>({...f,motivo:e.target.value}))} placeholder="Motivo" style={{flex:2}} />
              </div>
              <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={adicionarFeriado}>Adicionar feriado</button>
              {feriados.map(f => (
                <div key={f.id} className="modal-row" style={{padding:'6px 0',borderTop:'0.5px solid var(--borda)',marginTop:'4px'}}>
                  <span className="modal-label">{new Date(f.data+'T00:00:00').toLocaleDateString('pt-PT',{day:'numeric',month:'long'})}</span>
                  <span style={{fontSize:'13px'}}>{f.motivo}</span>
                </div>
              ))}
            </div>

            <div className="section-title">Professores</div>
            <div className="card">
              {professores.map(p => (
                <div key={p.id} className="cliente-row">
                  <div className="cliente-av">{p.nome?.slice(0,2).toUpperCase()}</div>
                  <div className="cliente-info"><div className="cliente-nome">{p.nome}</div><div className="cliente-plano">{p.email||'—'}</div></div>
                  <span className="badge badge-brown">professor</span>
                </div>
              ))}
              <div style={{marginTop:'14px',paddingTop:'14px',borderTop:'0.5px solid var(--borda)'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                  <input className="form-input" placeholder="Nome" value={novoProfessor.nome} onChange={e=>setNovoProfessor(p=>({...p,nome:e.target.value}))} />
                  <input className="form-input" placeholder="Email" value={novoProfessor.email} onChange={e=>setNovoProfessor(p=>({...p,email:e.target.value}))} />
                </div>
                <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={adicionarProfessor}>+ Adicionar professor</button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal?.tipo === 'confirmar_turma' && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Confirmar atribuição</div>
            <div className="modal-aula">
              <div className="modal-row"><span className="modal-label">Cliente</span><span style={{fontWeight:500}}>{modal.nomeCliente}</span></div>
              <div className="modal-row"><span className="modal-label">Turma</span><span style={{fontWeight:500,color:'var(--madeira)'}}>{modal.diaHora}</span></div>
            </div>
            <div className="notif" style={{marginTop:'1rem'}}>Ao confirmar, a inscrição será validada e o cliente notificado com a turma atribuída.</div>
            <div className="modal-actions">
              <button className="btn" onClick={()=>setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={()=>{ validarInscricao(modal.clienteId, [modal.aulaId]); setModal(null) }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {modal?.tipo === 'cancelar_sessao' && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Cancelar aula</div>
            <div className="modal-aula">
              <div className="modal-row"><span className="modal-label">Aula</span><span>{modal.dados.aulas?.nome}</span></div>
              <div className="modal-row"><span className="modal-label">Hora</span><span>{modal.dados.aulas?.hora?.slice(0,5)}</span></div>
            </div>
            <div className="notif">Todos os utentes inscritos receberão um crédito e notificação automática.</div>
            <div className="modal-actions">
              <button className="btn" onClick={()=>setModal(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={()=>cancelarSessao(modal.dados.id)}>Confirmar cancelamento</button>
            </div>
          </div>
        </div>
      )}

      {modal?.tipo === 'cliente' && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'1rem'}}>
              <div className="av av-lg">{modal.dados.nome?.slice(0,2).toUpperCase()}</div>
              <div>
                <div className="modal-title" style={{marginBottom:'3px'}}>{modal.dados.nome}</div>
                <div style={{fontSize:'12px',color:'var(--texto-muted)'}}>{modal.dados.email}</div>
              </div>
            </div>

            <div className="inner-tabs" style={{marginBottom:'1rem'}}>
              {[['perfil','Perfil'],['saude','Saúde'],['editar','Editar']].map(([id,label]) => (
                <div key={id} className={`inner-tab ${(edicaoCliente?.tab||'perfil')===id?'active':''}`}
                  onClick={()=>setEdicaoCliente(ed=>({...ed, tab:id}))}>{label}</div>
              ))}
            </div>

            {(edicaoCliente?.tab||'perfil') === 'perfil' && (
              <div className="modal-aula">
                <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--madeira)',marginBottom:'8px',fontWeight:600}}>Dados pessoais</div>
                <div className="modal-row"><span className="modal-label">Telemóvel</span><span>{modal.dados.telemovel||'—'}</span></div>
                <div className="modal-row"><span className="modal-label">NIF</span><span>{modal.dados.nif||'—'}</span></div>
                <div className="modal-row"><span className="modal-label">Nascimento</span><span>{modal.dados.data_nascimento ? new Date(modal.dados.data_nascimento).toLocaleDateString('pt-PT') : '—'}</span></div>
                {modal.dados.morada && <div className="modal-row"><span className="modal-label">Morada</span><span style={{fontSize:'11px',textAlign:'right',maxWidth:'200px'}}>{modal.dados.morada}</span></div>}
                {modal.dados.codigo_postal && <div className="modal-row"><span className="modal-label">Localidade</span><span>{modal.dados.codigo_postal} {modal.dados.localidade}</span></div>}
                {modal.dados.subsistema_saude && <div className="modal-row"><span className="modal-label">Subsistema</span><span>{modal.dados.subsistema_saude}</span></div>}
                {modal.dados.subsistema_numero && <div className="modal-row"><span className="modal-label">Nº beneficiário</span><span>{modal.dados.subsistema_numero}</span></div>}
                {modal.dados.acompanhante_nome && <>
                  <div className="modal-row"><span className="modal-label">Acompanhante</span><span style={{fontSize:'11px'}}>{modal.dados.acompanhante_nome}</span></div>
                  <div className="modal-row"><span className="modal-label">Contacto ac.</span><span style={{fontSize:'11px'}}>{modal.dados.acompanhante_contacto||'—'}</span></div>
                </>}

                <div className="divider" />
                <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--madeira)',marginBottom:'8px',fontWeight:600}}>Inscrição</div>
                <div className="modal-row"><span className="modal-label">Plano</span><span style={{fontWeight:500}}>{planoLabel[modal.dados.plano]||modal.dados.plano}</span></div>
                <div className="modal-row"><span className="modal-label">Estado</span><span style={{fontWeight:500,color:modal.dados.estado==='ativo'?'var(--sucesso)':'var(--texto-muted)'}}>{modal.dados.estado}</span></div>
                <div className="modal-row"><span className="modal-label">Créditos</span><span style={{color:'var(--madeira)',fontWeight:600}}>{modal.dados.creditos}</span></div>
                {modal.dados.data_inicio && <div className="modal-row"><span className="modal-label">Início</span><span>{new Date(modal.dados.data_inicio).toLocaleDateString('pt-PT')}</span></div>}
                <div className="modal-row"><span className="modal-label">Taxa inscr.</span><span>{modal.dados.taxa_inscricao_paga ? '✓ Paga' : '✗ Por pagar'}</span></div>
                {modal.dados.seguro_data && <div className="modal-row"><span className="modal-label">Seguro</span><span>{new Date(modal.dados.seguro_data).toLocaleDateString('pt-PT')}</span></div>}

                <div className="divider" />
                <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--madeira)',marginBottom:'8px',fontWeight:600}}>Preferências</div>
                {modal.dados.horarios_preferidos?.length > 0 ? (
                  <div className="modal-row" style={{alignItems:'flex-start'}}>
                    <span className="modal-label">Horários pref.</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'4px',justifyContent:'flex-end',maxWidth:'200px'}}>
                      {modal.dados.horarios_preferidos.map((h,i) => (
                        <span key={i} style={{background:'var(--areia)',borderRadius:'3px',padding:'2px 6px',fontSize:'10px',color:'var(--madeira)',fontWeight:600}}>{h}</span>
                      ))}
                    </div>
                  </div>
                ) : <div className="modal-row"><span className="modal-label">Horários pref.</span><span>—</span></div>}
                {modal.dados.objetivos && <div className="modal-row"><span className="modal-label">Objetivos</span><span style={{fontSize:'11px',textAlign:'right',maxWidth:'180px'}}>{modal.dados.objetivos}</span></div>}
                {modal.dados.experiencia && <div className="modal-row"><span className="modal-label">Experiência</span><span style={{fontSize:'11px'}}>{modal.dados.experiencia}</span></div>}
              </div>
            )}

            {(edicaoCliente?.tab||'perfil') === 'saude' && (
              <div className="modal-aula">
                {modal.dados.problemas_fisicos ? (
                  <><div className="modal-row"><span className="modal-label">Problemas</span><span style={{fontSize:'11px',color:'var(--erro)',textAlign:'right',maxWidth:'180px'}}>{modal.dados.problemas_fisicos}</span></div>
                  {modal.dados.problemas_descricao && <div className="modal-row"><span className="modal-label">Descrição</span><span style={{fontSize:'11px',textAlign:'right',maxWidth:'180px'}}>{modal.dados.problemas_descricao}</span></div>}</>
                ) : <div className="modal-row"><span className="modal-label">Problemas</span><span>Nenhum</span></div>}
                <div className="modal-row"><span className="modal-label">Cirurgias</span><span>{modal.dados.cirurgias ? `Sim — ${modal.dados.cirurgias_descricao||''}` : 'Não'}</span></div>
                <div className="modal-row"><span className="modal-label">Medicação</span><span>{modal.dados.medicacao ? `Sim — ${modal.dados.medicacao_descricao||''}` : 'Não'}</span></div>
                <div className="modal-row"><span className="modal-label">Gravidez</span><span>{modal.dados.gravidez ? 'Sim' : 'Não'}</span></div>
              </div>
            )}

            {(edicaoCliente?.tab||'perfil') === 'editar' && (
              <>
                <div className="form-group" style={{marginBottom:'10px'}}>
                  <label className="form-label">Nome</label>
                  <input className="form-input" value={edicaoCliente?.nome||modal.dados.nome||''} onChange={e=>setEdicaoCliente(ed=>({...ed, nome:e.target.value}))} />
                </div>
                <div className="form-group" style={{marginBottom:'10px'}}>
                  <label className="form-label">Telemóvel</label>
                  <input className="form-input" value={edicaoCliente?.telemovel||modal.dados.telemovel||''} onChange={e=>setEdicaoCliente(ed=>({...ed, telemovel:e.target.value}))} />
                </div>
                <div className="form-group" style={{marginBottom:'10px'}}>
                  <label className="form-label">Plano</label>
                  <select className="form-select" value={edicaoCliente?.plano||''} onChange={e=>setEdicaoCliente(ed=>({...ed, plano:e.target.value}))}>
                    <option value="1x_semana">1× Semana</option>
                    <option value="2x_semana">2× Semana</option>
                    <option value="duo">Duo</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:'10px'}}>
                  <label className="form-label">Turma{edicaoCliente?.plano==='2x_semana'?' (1ª aula)':''}</label>
                  <select className="form-select" value={edicaoCliente?.turma_id||''} onChange={e=>setEdicaoCliente(ed=>({...ed, turma_id:e.target.value}))}>
                    <option value="">— sem turma —</option>
                    {aulas.map(a => <option key={a.id} value={a.id}>{DIAS_SEMANA[a.dia_semana]} {a.hora?.slice(0,5)} — {a.professores?.nome||'Professor'}</option>)}
                  </select>
                </div>
                {edicaoCliente?.plano==='2x_semana' && (
                  <div className="form-group" style={{marginBottom:'10px'}}>
                    <label className="form-label">Turma (2ª aula)</label>
                    <select className="form-select" value={edicaoCliente?.turma2_id||''} onChange={e=>setEdicaoCliente(ed=>({...ed, turma2_id:e.target.value}))}>
                      <option value="">— sem turma —</option>
                      {aulas.map(a => <option key={a.id} value={a.id}>{DIAS_SEMANA[a.dia_semana]} {a.hora?.slice(0,5)} — {a.professores?.nome||'Professor'}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group" style={{marginBottom:'10px'}}>
                  <label className="form-label">Créditos</label>
                  <input type="number" className="form-input" value={edicaoCliente?.creditos??0} onChange={e=>setEdicaoCliente(ed=>({...ed, creditos:parseInt(e.target.value)||0}))} />
                </div>
                <div className="form-group" style={{marginBottom:'10px'}}>
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={edicaoCliente?.estado||modal.dados.estado||''} onChange={e=>setEdicaoCliente(ed=>({...ed, estado:e.target.value}))}>
                    <option value="pendente">Pendente</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="rejeitado">Rejeitado</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-full" style={{marginTop:'0.5rem'}} onClick={()=>guardarEdicaoCliente(modal.dados.id, edicaoCliente)}>Guardar alterações</button>
                <button className="btn btn-danger btn-full" style={{marginTop:'0.5rem'}} onClick={()=>eliminarCliente(modal.dados.id)}>Eliminar cliente</button>
              </>
            )}

            <button className="btn btn-full" style={{marginTop:'0.5rem'}} onClick={()=>setModal(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

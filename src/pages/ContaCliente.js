import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const OBJETIVOS = ['Melhorar postura','Ganhar flexibilidade','Reabilitação','Bem-estar geral','Tonificação muscular','Reduzir stress']
const EXPERIENCIAS = ['Nunca pratiquei','Menos de 6 meses','6 meses a 1 ano','Mais de 1 ano']
const PROBLEMAS = ['Coluna','Joelhos','Ombros','Quadril','Cervical','Outro']

const PLANOS = [
  { id: '1x_semana', nome: '1× Semana', preco: '15€/aula', sub: '60€/mês' },
  { id: '2x_semana', nome: '2× Semana', preco: '12,50€/aula', sub: '100€/mês' },
  { id: 'duo', nome: 'Duo', preco: '30€/aula', sub: 'por pessoa' },
  { id: 'individual', nome: 'Individual', preco: '45€/aula', sub: 'Pack 10: 400€' },
]

export default function ContaCliente({ perfil, onAtualizar, onSair }) {
  const [tab, setTab] = useState('dados')
  const [form, setForm] = useState({
    nome: perfil?.nome || '',
    telemovel: perfil?.telemovel || '',
    morada: perfil?.morada || '',
    codigoPostal: perfil?.codigo_postal || '',
    localidade: perfil?.localidade || '',
  })
  const [objetivos, setObjetivos] = useState(perfil?.objetivos ? perfil.objetivos.split(', ') : [])
  const [experiencia, setExperiencia] = useState(perfil?.experiencia || '')
  const [problemas, setProblemas] = useState(perfil?.problemas_fisicos ? perfil.problemas_fisicos.split(', ') : [])
  const [problemasDesc, setProblemasDesc] = useState(perfil?.problemas_descricao || '')
  const [cirurgias, setCirurgias] = useState(perfil?.cirurgias || false)
  const [cirurgiasDesc, setCirurgiasDesc] = useState(perfil?.cirurgias_descricao || '')
  const [medicacao, setMedicacao] = useState(perfil?.medicacao || false)
  const [medicacaoDesc, setMedicacaoDesc] = useState(perfil?.medicacao_descricao || '')
  const [gravidez, setGravidez] = useState(perfil?.gravidez || false)
  const [passwordNova, setPasswordNova] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [verNova, setVerNova] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [planoSolicitado, setPlanoSolicitado] = useState('')
  const [notif, setNotif] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  const toggleArr = (arr, setArr, v) => setArr(p => p.includes(v) ? p.filter(x=>x!==v) : [...p, v])
  const mostrarNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(''), 3500) }

  async function guardarDados() {
    setErro(''); setLoading(true)
    const { error } = await supabase.from('profiles').update({
      nome: form.nome,
      telemovel: form.telemovel,
      morada: form.morada,
      codigo_postal: form.codigoPostal,
      localidade: form.localidade,
    }).eq('id', perfil.id)
    if (error) setErro('Erro ao guardar. Tente novamente.')
    else { mostrarNotif('Dados atualizados com sucesso.'); onAtualizar() }
    setLoading(false)
  }

  async function guardarSaude() {
    setErro(''); setLoading(true)
    const { error } = await supabase.from('profiles').update({
      objetivos: objetivos.join(', '),
      experiencia,
      problemas_fisicos: problemas.join(', '),
      problemas_descricao: problemasDesc,
      cirurgias, cirurgias_descricao: cirurgiasDesc,
      medicacao, medicacao_descricao: medicacaoDesc,
      gravidez,
    }).eq('id', perfil.id)
    if (error) setErro('Erro ao guardar. Tente novamente.')
    else { mostrarNotif('Dados de saúde atualizados.'); onAtualizar() }
    setLoading(false)
  }

  async function alterarPassword() {
    setErro('')
    if (passwordNova.length < 6) { setErro('A nova password deve ter pelo menos 6 caracteres.'); return }
    if (passwordNova !== passwordConfirmar) { setErro('As passwords não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passwordNova })
    if (error) setErro('Erro ao alterar a password. Tente novamente.')
    else {
      mostrarNotif('Password alterada com sucesso.')
      setPasswordNova(''); setPasswordConfirmar('')
    }
    setLoading(false)
  }

  async function solicitarPlano() {
    if (!planoSolicitado || planoSolicitado === perfil.plano) { setErro('Selecione um plano diferente do atual.'); return }
    setErro(''); setLoading(true)
    const plano = PLANOS.find(p => p.id === planoSolicitado)
    await supabase.from('notificacoes').insert({
      cliente_id: null,
      titulo: `Pedido de alteração de plano — ${perfil.nome}`,
      mensagem: `O utente ${perfil.nome} solicitou alteração do plano atual (${perfil.plano?.replace(/_/g,' ')}) para ${plano?.nome}.`,
      tipo: 'info'
    })
    mostrarNotif('Pedido de alteração de plano enviado. A equipa irá contactá-lo brevemente.')
    setPlanoSolicitado('')
    setLoading(false)
  }

  const planoAtual = PLANOS.find(p => p.id === perfil?.plano)

  return (
    <div>
      {notif && <div className="notif-toast">{notif}</div>}

      <div className="inner-tabs" style={{marginBottom:'1.5rem'}}>
        {[['dados','Dados'],['saude','Saúde'],['password','Password'],['plano','Plano']].map(([id,label]) => (
          <div key={id} className={`inner-tab ${tab===id?'active':''}`} onClick={()=>{setTab(id);setErro('')}}>{label}</div>
        ))}
      </div>

      {erro && <div className="erro-msg">{erro}</div>}

      {tab === 'dados' && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Nome completo</label>
            <input className="form-input" value={form.nome} onChange={e=>set('nome',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Telemóvel</label>
            <input className="form-input" type="tel" value={form.telemovel} onChange={e=>set('telemovel',e.target.value)} placeholder="9XX XXX XXX" />
          </div>
          <div className="form-group">
            <label className="form-label">Morada</label>
            <input className="form-input" value={form.morada} onChange={e=>set('morada',e.target.value)} placeholder="Rua, número, andar" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:'8px'}}>
            <div className="form-group">
              <label className="form-label">Código Postal</label>
              <input className="form-input" value={form.codigoPostal} onChange={e=>set('codigoPostal',e.target.value)} placeholder="XXXX-XXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Localidade</label>
              <input className="form-input" value={form.localidade} onChange={e=>set('localidade',e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">NIF</label>
            <input className="form-input" value={perfil?.nif || '—'} disabled style={{opacity:0.6,cursor:'not-allowed'}} />
            <span style={{fontSize:'10px',color:'var(--texto-muted)',marginTop:'4px',display:'block'}}>O NIF não pode ser alterado. Contacte o estúdio se necessário.</span>
          </div>
          <button className="btn btn-primary btn-full" onClick={guardarDados} disabled={loading}>
            {loading ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      )}

      {tab === 'saude' && (
        <div className="card">
          <div className="ficha-section">
            <div className="ficha-section-title">Objetivos</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'2px'}}>
              {OBJETIVOS.map(o => <span key={o} className={`horario-chip ${objetivos.includes(o)?'selected':''}`} onClick={()=>toggleArr(objetivos,setObjetivos,o)}>{o}</span>)}
            </div>
          </div>
          <div className="ficha-section">
            <div className="ficha-section-title">Experiência em Pilates</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'2px'}}>
              {EXPERIENCIAS.map(e => <span key={e} className={`horario-chip ${experiencia===e?'selected':''}`} onClick={()=>setExperiencia(e)}>{e}</span>)}
            </div>
          </div>
          <div className="ficha-section">
            <div className="ficha-section-title">Problemas físicos</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'2px',marginBottom:'8px'}}>
              {PROBLEMAS.map(p => <span key={p} className={`horario-chip ${problemas.includes(p)?'selected':''}`} onClick={()=>toggleArr(problemas,setProblemas,p)}>{p}</span>)}
            </div>
            {problemas.length > 0 && <textarea className="form-textarea" value={problemasDesc} onChange={e=>setProblemasDesc(e.target.value)} placeholder="Descreva os seus problemas físicos..." />}
          </div>
          <div className="ficha-section">
            <div className="ficha-section-title">Cirurgias recentes</div>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <span className={`horario-chip ${!cirurgias?'selected':''}`} onClick={()=>setCirurgias(false)}>Não</span>
              <span className={`horario-chip ${cirurgias?'selected':''}`} onClick={()=>setCirurgias(true)}>Sim</span>
            </div>
            {cirurgias && <textarea className="form-textarea" value={cirurgiasDesc} onChange={e=>setCirurgiasDesc(e.target.value)} placeholder="Qual cirurgia e quando?" />}
          </div>
          <div className="ficha-section">
            <div className="ficha-section-title">Medicação</div>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <span className={`horario-chip ${!medicacao?'selected':''}`} onClick={()=>setMedicacao(false)}>Não</span>
              <span className={`horario-chip ${medicacao?'selected':''}`} onClick={()=>setMedicacao(true)}>Sim</span>
            </div>
            {medicacao && <textarea className="form-textarea" value={medicacaoDesc} onChange={e=>setMedicacaoDesc(e.target.value)} placeholder="Qual medicação?" />}
          </div>
          <div className="ficha-section" style={{marginBottom:0}}>
            <div className="ficha-section-title">Gravidez</div>
            <div style={{display:'flex',gap:'8px'}}>
              <span className={`horario-chip ${!gravidez?'selected':''}`} onClick={()=>setGravidez(false)}>Não</span>
              <span className={`horario-chip ${gravidez?'selected':''}`} onClick={()=>setGravidez(true)}>Sim</span>
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={guardarSaude} disabled={loading}>
            {loading ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div className="card">
          <p style={{fontSize:'13px',color:'var(--texto-muted)',marginBottom:'1.25rem',lineHeight:1.6}}>
            Para alterar a password, introduza a nova password desejada.
          </p>
          <div className="form-group">
            <label className="form-label">Nova password</label>
            <div style={{position:'relative'}}>
              <input className="form-input" type={verNova?'text':'password'} value={passwordNova} onChange={e=>setPasswordNova(e.target.value)} placeholder="mínimo 6 caracteres" style={{paddingRight:'44px'}} />
              <span onClick={()=>setVerNova(v=>!v)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',cursor:'pointer',fontSize:'16px',color:'var(--texto-muted)'}}>
                {verNova ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Confirmar nova password</label>
            <div style={{position:'relative'}}>
              <input className="form-input" type={verConfirmar?'text':'password'} value={passwordConfirmar} onChange={e=>setPasswordConfirmar(e.target.value)} placeholder="repita a nova password" style={{paddingRight:'44px'}} />
              <span onClick={()=>setVerConfirmar(v=>!v)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',cursor:'pointer',fontSize:'16px',color:'var(--texto-muted)'}}>
                {verConfirmar ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={alterarPassword} disabled={loading}>
            {loading ? 'A alterar...' : 'Alterar password'}
          </button>
        </div>
      )}

      {tab === 'plano' && (
        <div className="card">
          <div style={{marginBottom:'1.5rem'}}>
            <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:'var(--texto-muted)',marginBottom:'8px',fontWeight:500}}>Plano atual</div>
            <div style={{background:'var(--areia)',borderRadius:'3px',padding:'16px'}}>
              <div style={{fontSize:'16px',fontWeight:600,color:'var(--grafite)',marginBottom:'4px'}}>{planoAtual?.nome || perfil?.plano}</div>
              <div style={{fontSize:'13px',color:'var(--madeira)',fontWeight:500}}>{planoAtual?.preco} <span style={{color:'var(--texto-muted)',fontWeight:300}}>· {planoAtual?.sub}</span></div>
            </div>
          </div>
          <div className="divider" />
          <div style={{fontSize:'13px',fontWeight:500,color:'var(--grafite)',marginBottom:'1rem'}}>Solicitar alteração de plano</div>
          <p style={{fontSize:'12px',color:'var(--texto-muted)',marginBottom:'1rem',lineHeight:1.6}}>
            A alteração de plano está sujeita a aprovação pela equipa do estúdio. Após a solicitação, será contactado brevemente.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'1rem'}}>
            {PLANOS.filter(p=>p.id !== perfil?.plano).map(p => (
              <div key={p.id} className={`plano-card ${planoSolicitado===p.id?'selected':''}`} onClick={()=>setPlanoSolicitado(p.id)}>
                <div className="plano-nome">{p.nome}</div>
                <div className="plano-preco" style={{fontSize:'18px'}}>{p.preco}</div>
                <div className="plano-sub">{p.sub}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full" onClick={solicitarPlano} disabled={loading || !planoSolicitado} style={{marginTop:0}}>
            {loading ? 'A enviar...' : 'Solicitar alteração'}
          </button>
        </div>
      )}

      <button className="btn btn-danger btn-full" onClick={onSair} style={{marginTop:'1rem'}}>
        Terminar sessão
      </button>
    </div>
  )
}

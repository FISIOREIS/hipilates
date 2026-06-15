import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Privacidade from './Privacidade'

const PLANOS = [
  { id: '1x_semana', nome: '1× Semana', preco: '55€', sub: 'por mês', desc: 'Turma até 5 pessoas', horarios: ['Manhã: 08h–12h', 'Tarde: 13h–20h', 'Sábado: 08h–13h'] },
  { id: '2x_semana', nome: '2× Semana', preco: '90€', sub: 'por mês', desc: 'Turma até 5 pessoas', horarios: ['Manhã: 08h–12h', 'Tarde: 13h–16h'] },
  { id: 'duo', nome: 'Duo', preco: '275€', sub: 'por pessoa', desc: 'Pack 10 aulas · 27,50€/aula', horarios: ['Segunda-feira a sexta-feira', '08h–16h'] },
  { id: 'individual', nome: 'Individual', preco: '400€', sub: 'pack 10 aulas', desc: '40€ por aula', horarios: ['Segunda-feira a sexta-feira', '08h–16h'] },
]

// Horários por plano
const HORAS_TODAS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
const HORAS_MANHA_TARDE = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00']
const HORAS_SAB = ['08:00','09:00','10:00','11:00','12:00','13:00']

const DIAS_SEMANA = ['Seg','Ter','Qua','Qui','Sex']
const OBJETIVOS = ['Melhorar postura','Ganhar flexibilidade','Reabilitação','Bem-estar geral','Tonificação muscular','Reduzir stress']
const EXPERIENCIAS = ['Nunca pratiquei','Menos de 6 meses','6 meses a 1 ano','Mais de 1 ano']
const PROBLEMAS = ['Coluna','Joelhos','Ombros','Quadril','Cervical','Outro']

function getHorasPermitidas(plano, diaSemana) {
  if (diaSemana === 'Sáb') {
    return plano === '1x_semana' ? HORAS_SAB : []
  }
  if (plano === '1x_semana') return HORAS_TODAS
  return HORAS_MANHA_TARDE
}

const REGULAMENTO = `
**Inscrição**
- Inscrição válida por 12 meses a partir da data de inscrição.
- Inclui: ficha de inscrição preenchida, pagamento da taxa de inscrição (10€, inclui seguro desportivo) e pagamento da mensalidade do mês em que se inscreve.
- Em caso de desistência, os valores pagos não são reembolsados.

**Mensalidades**
- Pagamento até ao dia 8 de cada mês.
- Falta de pagamento superior a 1 mês sem aviso prévio implica perda do lugar na turma.
- As mensalidades são devidas mesmo em caso de ausência.
- Mudança de modalidade deve ser comunicada no mês anterior.
- Desistência: aviso com 30 dias de antecedência, caso contrário o mês é cobrado na totalidade.

**Pagamento Duo e Individual**
- Pagamento efetuado no início da aula ou na aquisição do pack.

**Cancelamentos e Reposições**
- Avisar com pelo menos 24 horas de antecedência para ter direito a aula de reposição (fica em crédito na aplicação).
- A vaga não pode ser cedida a outra pessoa.
- Cancelamentos com menos de 24 horas não dão direito a reposição.
- Alterações por parte do professor ou clínica serão compensadas.

**Condições Gerais**
- Funcionamento durante os 12 meses do ano.
- Distribuição em turmas por nível técnico e horário disponível.
- Duração das aulas: 50 a 55 minutos.
- A direção técnica pode alterar grupos ou professores quando necessário.

**Cálculo Anual de Aulas**
- Plano 1× por semana: 48 aulas/ano (janeiro a dezembro).
- Plano 2× por semana: 96 aulas/ano.
- Inscrições durante o ano: número de aulas calculado proporcionalmente até dezembro.
- Encerramentos previamente comunicados: aulas creditadas para reposição ao longo do ano.
`

export default function Registo() {
  const [passo, setPasso] = useState(1)
  const [form, setForm] = useState({
    nome:'', email:'', password:'', passwordConfirmar:'', telemovel:'', dataNasc:'', nif:'',
    morada:'', codigoPostal:'', localidade:'',
    subsistema:'', subNumero:'', plano:'1x_semana',
    acompanhante:'', acompanhanteContacto:''
  })
  const [objetivos, setObjetivos] = useState([])
  const [experiencia, setExperiencia] = useState('')
  const [problemas, setProblemas] = useState([])
  const [problemasDesc, setProblemasDesc] = useState('')
  const [cirurgias, setCirurgias] = useState(false)
  const [cirurgiasDesc, setCirurgiasDesc] = useState('')
  const [medicacao, setMedicacao] = useState(false)
  const [medicacaoDesc, setMedicacaoDesc] = useState('')
  const [gravidez, setGravidez] = useState(false)
  const [horariosPref, setHorariosPref] = useState([])
  const [horariosPorDia, setHorariosPorDia] = useState({})
  const [disponibilidadeLivre, setDisponibilidadeLivre] = useState('')
  const [aceitaPrivacidade, setAceitaPrivacidade] = useState(false)
  const [aceitaSaude, setAceitaSaude] = useState(false)
  const [leuRegulamento, setLeuRegulamento] = useState(false)
  const [mostraPrivacidade, setMostraPrivacidade] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [verPassword, setVerPassword] = useState(false)
  const [verPasswordConfirmar, setVerPasswordConfirmar] = useState(false)

  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  const toggleArr = (arr, setArr, v) => setArr(p => p.includes(v) ? p.filter(x=>x!==v) : [...p, v])

  const planoSelecionado = PLANOS.find(p => p.id === form.plano)
  const diasDisponiveis = form.plano === '1x_semana'
    ? ['Seg','Ter','Qua','Qui','Sex','Sáb']
    : ['Seg','Ter','Qua','Qui','Sex']

  async function registar() {
    if (!aceitaPrivacidade) { setErro('Por favor aceite a Política de Privacidade.'); return }
    if (!leuRegulamento) { setErro('Por favor confirme que leu o Regulamento Interno do Estúdio.'); return }
    setErro(''); setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { nome: form.nome, plano: form.plano } }
    })
    if (error) { setErro(error.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        telemovel: form.telemovel, nif: form.nif,
        morada: form.morada, codigo_postal: form.codigoPostal, localidade: form.localidade,
        subsistema_saude: form.subsistema, subsistema_numero: form.subNumero,
        data_nascimento: form.dataNasc || null,
        objetivos: objetivos.join(', '), experiencia,
        problemas_fisicos: problemas.join(', '), problemas_descricao: problemasDesc,
        cirurgias, cirurgias_descricao: cirurgiasDesc,
        medicacao, medicacao_descricao: medicacaoDesc,
        gravidez, horarios_preferidos: horariosPref,
        disponibilidade_livre: disponibilidadeLivre || null,
        horarios_por_dia: horariosPorDia || null,
        acompanhante_nome: form.acompanhante,
        acompanhante_contacto: form.acompanhanteContacto,
        estado: 'pendente'
      }).eq('id', user.id)
    }
    setLoading(false)
  }

  const passoLabels = ['Dados Pessoais','Saúde','Horários','Regulamento Interno','Confirmação']
  const progresso = (passo / passoLabels.length) * 100

  return (
    <div className="auth-wrap">
      {mostraPrivacidade && <Privacidade onFechar={()=>setMostraPrivacidade(false)} />}

      <div style={{padding:'1.5rem 1.5rem 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem'}}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M8 6 Q10 14 9 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M9 14 Q13 10 16 14" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M16 14 Q17 20 16 26" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="20" cy="7" r="2.5" fill="var(--madeira)" opacity="0.5"/>
            <path d="M18 10 Q21 14 24 22" stroke="var(--madeira)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{fontSize:'16px',fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--grafite)'}}>Hipilates</span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{width:`${progresso}%`}} />
        </div>
        <p style={{fontSize:'9px',letterSpacing:'2.5px',textTransform:'uppercase',color:'var(--texto-muted)',fontWeight:500,marginBottom:'1.5rem'}}>{passoLabels[passo-1]}</p>
      </div>

      <div style={{padding:'0 1.5rem 3rem'}}>
        <div className="card-elevated">
          {erro && <div className="erro-msg">{erro}</div>}

          {/* PASSO 1 — Dados pessoais */}
          {passo === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Nome completo *</label>
                <input className="form-input" value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="O seu nome completo" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="o_seu@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{position:'relative'}}>
                  <input className="form-input" type={verPassword?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="mínimo 6 caracteres" style={{paddingRight:'44px'}} />
                  <span onClick={()=>setVerPassword(v=>!v)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',cursor:'pointer',fontSize:'16px',color:'var(--texto-muted)',userSelect:'none'}}>
                    {verPassword ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar password *</label>
                <div style={{position:'relative'}}>
                  <input className="form-input" type={verPasswordConfirmar?'text':'password'} value={form.passwordConfirmar} onChange={e=>set('passwordConfirmar',e.target.value)} placeholder="repita a password" style={{paddingRight:'44px'}} />
                  <span onClick={()=>setVerPasswordConfirmar(v=>!v)} style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',cursor:'pointer',fontSize:'16px',color:'var(--texto-muted)',userSelect:'none'}}>
                    {verPasswordConfirmar ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Telemóvel *</label>
                <input className="form-input" type="tel" value={form.telemovel} onChange={e=>set('telemovel',e.target.value)} placeholder="9XX XXX XXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Data de nascimento *</label>
                <input className="form-input" type="date" value={form.dataNasc} onChange={e=>set('dataNasc',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">NIF *</label>
                <input className="form-input" value={form.nif} onChange={e=>set('nif',e.target.value)} placeholder="Ex: 123456789" />
              </div>
              <div className="form-group">
                <label className="form-label">Morada *</label>
                <input className="form-input" value={form.morada} onChange={e=>set('morada',e.target.value)} placeholder="Rua, número, andar" />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:'8px'}}>
                <div className="form-group">
                  <label className="form-label">Código Postal *</label>
                  <input className="form-input" value={form.codigoPostal} onChange={e=>set('codigoPostal',e.target.value)} placeholder="XXXX-XXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">Localidade *</label>
                  <input className="form-input" value={form.localidade} onChange={e=>set('localidade',e.target.value)} placeholder="Ex: Porto" />
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div className="form-group">
                  <label className="form-label">Subsistema de saúde</label>
                  <input className="form-input" value={form.subsistema} onChange={e=>set('subsistema',e.target.value)} placeholder="Ex: Médis" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nº beneficiário</label>
                  <input className="form-input" value={form.subNumero} onChange={e=>set('subNumero',e.target.value)} placeholder="Ex: 250" />
                </div>
              </div>

              <p className="section-title">Plano</p>
              <div className="planos-grid">
                {PLANOS.map(p => (
                  <div key={p.id} className={`plano-card ${form.plano===p.id?'selected':''}`} onClick={()=>set('plano',p.id)}>
                    <div className="plano-nome">{p.nome}</div>
                    <div className="plano-preco">{p.preco}</div>
                    <div className="plano-sub">{p.sub}</div>
                    <div className="plano-desc">{p.desc}</div>
                    {p.horarios && (
                      <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'0.5px solid rgba(160,128,96,0.2)'}}>
                        {p.horarios.map((h,i) => (
                          <div key={i} style={{fontSize:'10px',color:'var(--texto-muted)',lineHeight:1.7}}>· {h}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="btn btn-primary btn-full"
                onClick={()=>{ 
  const camposFalha = [];
  if(!form.nome) camposFalha.push('nome');
  if(!form.email) camposFalha.push('email');
  if(!form.password) camposFalha.push('password');
  if(!form.passwordConfirmar) camposFalha.push('confirmar password');
  if(!form.telemovel) camposFalha.push('telemóvel');
  if(!form.nif) camposFalha.push('nif');
  if(!form.morada) camposFalha.push('morada');
  if(!form.codigoPostal) camposFalha.push('código postal');
  if(!form.localidade) camposFalha.push('localidade');
  if(camposFalha.length > 0){setErro('Campos em falta: ' + camposFalha.join(', '));return;}
  if(form.password.length<6){setErro('A password deve ter pelo menos 6 caracteres.');return;}
  if(form.password!==form.passwordConfirmar){setErro('As passwords não coincidem.');return;}
  setErro('');setPasso(2) }}>
                Continuar
              </button>
              <p className="switch-link">Já tem conta? <Link to="/login">Entrar aqui</Link></p>
            </>
          )}

          {/* PASSO 2 — Saúde */}
          {passo === 2 && (
            <>
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
              <div className="ficha-section">
                <div className="ficha-section-title">Gravidez</div>
                <div style={{display:'flex',gap:'8px'}}>
                  <span className={`horario-chip ${!gravidez?'selected':''}`} onClick={()=>setGravidez(false)}>Não</span>
                  <span className={`horario-chip ${gravidez?'selected':''}`} onClick={()=>setGravidez(true)}>Sim</span>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'1rem'}}>
                <button className="btn btn-full" style={{marginTop:0}} onClick={()=>setPasso(1)}>Voltar</button>
                <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={()=>setPasso(3)}>Continuar</button>
              </div>
            </>
          )}

          {/* PASSO 3 — Horários */}
          {passo === 3 && (
            <>
              {(form.plano === 'duo' || form.plano === 'individual') && (
                <div className="notif" style={{marginBottom:'1.25rem'}}>
                  <span>As sessões são agendadas de forma flexível entre as 08h e as 16h, de segunda-feira a sexta-feira.</span>
                </div>
              )}
              {(form.plano === '1x_semana' || form.plano === '2x_semana') && (
                <div className="notif" style={{marginBottom:'1.25rem'}}>
                  <span>Selecione os horários preferidos para cada dia. Iremos atribuir uma turma com base nas preferências.</span>
                </div>
              )}

              <div className="ficha-section">
                <div className="ficha-section-title">Dias preferidos</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'1rem'}}>
                  {diasDisponiveis.map(dia => (
                    <span key={dia}
                      className={`horario-chip ${horariosPorDia[dia]?'selected':''}`}
                      onClick={()=>{
                        const novo = {...horariosPorDia}
                        if (novo[dia]) delete novo[dia]
                        else novo[dia] = {periodo:null, horas:[]}
                        setHorariosPorDia(novo)
                      }}>{dia}</span>
                  ))}
                </div>
              </div>

              {diasDisponiveis.filter(d => horariosPorDia[d]).map(dia => {
                const isSab = dia === 'Sáb'
                const dObj = horariosPorDia[dia]
                const horasManha = ['08:00','09:00','10:00','11:00','12:00']
                const horasTarde = form.plano === '1x_semana'
                  ? ['13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
                  : ['13:00','14:00','15:00','16:00']
                const horasSab = ['08:00','09:00','10:00','11:00','12:00','13:00']
                const nomesDia = {Seg:'Segunda-feira',Ter:'Terça-feira',Qua:'Quarta-feira',Qui:'Quinta-feira',Sex:'Sexta-feira','Sáb':'Sábado'}
                return (
                  <div key={dia} style={{border:'0.5px solid var(--borda)',borderRadius:'6px',padding:'12px',marginBottom:'8px'}}>
                    <div style={{fontSize:'11px',fontWeight:600,color:'var(--grafite)',marginBottom:'10px'}}>{nomesDia[dia]}</div>
                    {!isSab ? (
                      <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
                        <span className={`horario-chip ${dObj.periodo==='manha'?'selected':''}`}
                          onClick={()=>{const n={...horariosPorDia};n[dia]={periodo:dObj.periodo==='manha'?null:'manha',horas:[]};setHorariosPorDia(n)}}>Manhã</span>
                        <span className={`horario-chip ${dObj.periodo==='tarde'?'selected':''}`}
                          onClick={()=>{const n={...horariosPorDia};n[dia]={periodo:dObj.periodo==='tarde'?null:'tarde',horas:[]};setHorariosPorDia(n)}}>Tarde</span>
                      </div>
                    ) : (
                      <div style={{marginBottom:'8px'}}>
                        <span className="horario-chip selected" style={{pointerEvents:'none'}}>Manhã</span>
                      </div>
                    )}
                    {(dObj.periodo || isSab) && (
                      <div style={{background:'var(--areia)',borderRadius:'4px',padding:'8px',display:'flex',flexWrap:'wrap',gap:'4px'}}>
                        {(isSab ? horasSab : dObj.periodo==='manha' ? horasManha : horasTarde).map(h => (
                          <span key={h}
                            className={`horario-chip ${dObj.horas.includes(h)?'selected':''}`}
                            style={{fontSize:'11px',padding:'4px 9px'}}
                            onClick={()=>{
                              const n={...horariosPorDia}
                              n[dia]={...dObj,horas:dObj.horas.includes(h)?dObj.horas.filter(x=>x!==h):[...dObj.horas,h]}
                              setHorariosPorDia(n)
                            }}>{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="form-group" style={{marginTop:'1rem'}}>
                <label className="form-label">Observações sobre disponibilidade</label>
                <textarea className="form-textarea" value={disponibilidadeLivre} onChange={e=>setDisponibilidadeLivre(e.target.value)} />
              </div>

              <div className="divider" />
              <div className="ficha-section">
                <div className="ficha-section-title">Prefere ficar numa turma com alguém conhecido?</div>
                <p style={{fontSize:'12px',color:'var(--texto-muted)',marginBottom:'12px',lineHeight:1.6}}>
                  Se tiver alguém com quem gostaria de praticar, indique o nome e contacto. Tentaremos colocá-los na mesma turma.
                </p>
                <div className="form-group">
                  <label className="form-label">Nome do acompanhante</label>
                  <input className="form-input" value={form.acompanhante} onChange={e=>set('acompanhante',e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Contacto do acompanhante</label>
                  <input className="form-input" value={form.acompanhanteContacto} onChange={e=>set('acompanhanteContacto',e.target.value)} placeholder="Email ou telemóvel" />
                </div>
              </div>

              <div style={{display:'flex',gap:'8px',marginTop:'1rem'}}>
                <button className="btn btn-full" style={{marginTop:0}} onClick={()=>setPasso(2)}>Voltar</button>
                <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={()=>setPasso(4)}>Continuar</button>
              </div>
            </>
          )}

          {/* PASSO 4 — Consentimentos */}
          {passo === 4 && (
            <>
              <div className="ficha-section">
                <div className="ficha-section-title">Regulamento Interno do Estúdio</div>
                <p style={{fontSize:'12px',color:'var(--texto-muted)',marginBottom:'12px',lineHeight:1.6}}>
                  Por favor leia o regulamento antes de confirmar a sua inscrição.
                </p>
                <div className="regulamento">
                  {REGULAMENTO.split('\n\n').map((bloco, i) => {
                    const linhas = bloco.split('\n').filter(l => l.trim())
                    const titulo = linhas[0]?.startsWith('**') ? linhas[0].replace(/\*\*/g,'') : null
                    const resto = titulo ? linhas.slice(1) : linhas
                    const itens = resto.filter(l => l.startsWith('- '))
                    const paragrafos = resto.filter(l => !l.startsWith('- '))
                    return (
                      <div key={i}>
                        {titulo && <h3>{titulo}</h3>}
                        {paragrafos.map((p, j) => <p key={`p${j}`}>{p}</p>)}
                        {itens.length > 0 && (
                          <ul style={{margin:'0 0 8px 0', paddingLeft:'18px'}}>
                            {itens.map((it, j) => <li key={`i${j}`} style={{marginBottom:'4px'}}>{it.replace(/^- /,'')}</li>)}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'1rem',marginTop:'1rem'}}>
                <input type="checkbox" id="regulamento" checked={leuRegulamento} onChange={e=>setLeuRegulamento(e.target.checked)} style={{marginTop:'2px',accentColor:'var(--grafite)',flexShrink:0,width:'16px',height:'16px'}} />
                <label htmlFor="regulamento" style={{fontSize:'12px',color:'var(--texto)',lineHeight:1.7,cursor:'pointer'}}>
                  Li e aceito o Regulamento Interno do Estúdio Hipilates. <span style={{color:'var(--erro)'}}>*</span>
                </label>
              </div>

              <div style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'1rem'}}>
                <input type="checkbox" id="privacidade" checked={aceitaPrivacidade} onChange={e=>setAceitaPrivacidade(e.target.checked)} style={{marginTop:'2px',accentColor:'var(--grafite)',flexShrink:0,width:'16px',height:'16px'}} />
                <label htmlFor="privacidade" style={{fontSize:'12px',color:'var(--texto)',lineHeight:1.7,cursor:'pointer'}}>
                  Li e aceito a <span style={{color:'var(--madeira)',cursor:'pointer',borderBottom:'1px solid var(--champanhe)'}} onClick={e=>{e.preventDefault();setMostraPrivacidade(true)}}>Política de Privacidade</span>. <span style={{color:'var(--erro)'}}>*</span>
                </label>
              </div>

              <div style={{display:'flex',alignItems:'flex-start',gap:'12px',marginBottom:'1.5rem'}}>
                <input type="checkbox" id="saude" checked={aceitaSaude} onChange={e=>setAceitaSaude(e.target.checked)} style={{marginTop:'2px',accentColor:'var(--grafite)',flexShrink:0,width:'16px',height:'16px'}} />
                <label htmlFor="saude" style={{fontSize:'12px',color:'var(--texto)',lineHeight:1.7,cursor:'pointer'}}>
                  Consinto o tratamento dos meus dados de saúde para personalização das aulas. <span style={{color:'var(--texto-muted)'}}>(opcional)</span>
                </label>
              </div>

              <div className="notif" style={{marginBottom:'1rem'}}>
                <span style={{fontSize:'12px'}}>A sua inscrição será analisada pela nossa equipa. Será contactado assim que for validada.</span>
              </div>

              <div style={{display:'flex',gap:'8px'}}>
                <button className="btn btn-full" style={{marginTop:0}} onClick={()=>setPasso(3)}>Voltar</button>
                <button className="btn btn-primary btn-full" style={{marginTop:0}}
                  onClick={()=>{ if(!aceitaPrivacidade||!leuRegulamento){setErro('Por favor aceite os termos obrigatórios.');return;} setErro('');setPasso(5) }}>
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* PASSO 5 — Confirmação */}
          {passo === 5 && (
            <>
              <div style={{textAlign:'center',padding:'1rem 0 2rem'}}>
                <div style={{width:'64px',height:'64px',background:'var(--grafite)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem',fontSize:'28px'}}>✓</div>
                <div style={{fontSize:'22px',fontWeight:600,letterSpacing:'1px',marginBottom:'12px',color:'var(--grafite)'}}>Quase pronto!</div>
                <p style={{fontSize:'13px',color:'var(--texto-muted)',lineHeight:1.8,marginBottom:'2rem'}}>
                  Confirme a sua inscrição. A nossa equipa irá analisá-la e entrar em contacto brevemente com os próximos passos.
                </p>
                <div className="notif" style={{textAlign:'left',marginBottom:'2rem'}}>
                  <span style={{fontSize:'12px'}}>Após validação receberá na aplicação todas as informações de pagamento e a sua turma atribuída.</span>
                </div>
              </div>
              <button className="btn btn-primary btn-full" style={{marginTop:0}} onClick={registar} disabled={loading}>
                {loading ? 'A criar conta...' : 'Confirmar inscrição'}
              </button>
              <button className="btn btn-full" style={{marginTop:'8px'}} onClick={()=>setPasso(4)}>
                Voltar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

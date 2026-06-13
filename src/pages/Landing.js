import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const BASE = 'https://mjnrqugvcfwnkdhnxyjz.supabase.co/storage/v1/object/public/Imagens/'
const FOTOS = [
  BASE + '1',
  BASE + '2',
  BASE + '3',
  BASE + '4',
  BASE + '5',
  BASE + '6',
  BASE + '7',
  BASE + '8',
  BASE + '9',
  BASE + '10',
]

const PLANOS = [
  { nome: '1× Semana', preco: '15€', sub: 'por aula', extra: '60€/mês', desc: 'Turma até 5 pessoas\nHorários de manhã e tarde\nSábado de manhã', destaque: true },
  { nome: '2× Semana', preco: '12,50€', sub: 'por aula', extra: '100€/mês', desc: 'Turma até 5 pessoas\nHorários de manhã e tarde\nMáxima evolução', destaque: false },
  { nome: 'Duo', preco: '30€', sub: 'por aula / pessoa', extra: 'Pack 10 aulas: 250€/pessoa', desc: 'Sessão para 2 pessoas\nHorários de manhã e tarde\nMais personalizado', destaque: false },
  { nome: 'Individual', preco: '45€', sub: 'por aula', extra: 'Pack 10 aulas: 400€', desc: 'Sessão 100% personalizada\nHorários de manhã e tarde\nAcompanhamento dedicado', destaque: false },
]

const LogoSVG = ({color='white', size=32}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M8 6 Q10 14 9 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M9 14 Q13 10 16 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M16 14 Q17 20 16 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="20" cy="7" r="2.5" fill={color} opacity="0.5"/>
    <path d="M18 10 Q21 14 24 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
)

export default function Landing() {
  const [fotoAtual, setFotoAtual] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFotoAtual(f => (f + 1) % FOTOS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{fontFamily:'Raleway,sans-serif',color:'#2a2420',background:'#faf8f4',minHeight:'100vh'}}>

      {/* NAVBAR */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(250,248,244,0.95)',backdropFilter:'blur(8px)',borderBottom:'0.5px solid #e8dcc8',padding:'0 1.5rem',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <LogoSVG color='#a08060' size={24} />
          <span style={{fontSize:'16px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#2a2420'}}>
            <span style={{color:'#a08060'}}>Hi</span>pilates
          </span>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <Link to="/login" style={{fontSize:'10px',letterSpacing:'2px',textTransform:'uppercase',color:'#8a7060',textDecoration:'none',fontWeight:500,padding:'8px 14px'}}>
            Entrar
          </Link>
          <Link to="/registo" style={{fontSize:'10px',letterSpacing:'2px',textTransform:'uppercase',color:'white',textDecoration:'none',fontWeight:600,padding:'10px 18px',background:'#2a2420',borderRadius:'2px'}}>
            Inscrever
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{position:'relative',height:'75vh',minHeight:'420px',overflow:'hidden'}}>
        {FOTOS.map((f, i) => (
          <div key={i} style={{
            position:'absolute',inset:0,
            backgroundImage:`url(${f})`,
            backgroundSize:'cover',backgroundPosition:'center 30%',backgroundRepeat:'no-repeat',
            opacity: i === fotoAtual ? 1 : 0,
            transition:'opacity 1.2s ease',
          }} />
        ))}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom, rgba(42,36,32,0.2) 0%, rgba(42,36,32,0.65) 100%)'}} />
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1.5rem'}}>
            <LogoSVG color='white' size={40} />
          </div>
          <h1 style={{fontSize:'clamp(36px,8vw,72px)',fontWeight:700,letterSpacing:'8px',textTransform:'uppercase',color:'white',marginBottom:'1rem',lineHeight:1.1}}>
            Hipilates
          </h1>
          <p style={{fontSize:'clamp(12px,2vw,14px)',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(255,255,255,0.8)',marginBottom:'0.5rem',fontWeight:400}}>
            by fisioreis
          </p>
          <p style={{fontSize:'clamp(14px,2.5vw,18px)',color:'rgba(255,255,255,0.9)',marginBottom:'2.5rem',fontWeight:300,letterSpacing:'0.5px',maxWidth:'500px',lineHeight:1.7}}>
            Ambientes que acolhem.<br/>Cuidados que fazem sentido.
          </p>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center'}}>
            <Link to="/registo" style={{padding:'14px 32px',background:'white',color:'#2a2420',textDecoration:'none',fontSize:'10px',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:700,borderRadius:'2px'}}>
              Inscrever-se
            </Link>
            <Link to="/login" style={{padding:'14px 32px',background:'transparent',color:'white',textDecoration:'none',fontSize:'10px',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:500,borderRadius:'2px',border:'1px solid rgba(255,255,255,0.6)'}}>
              Já tenho conta
            </Link>
          </div>
        </div>
        <div style={{position:'absolute',bottom:'2rem',left:'50%',transform:'translateX(-50%)',display:'flex',gap:'6px'}}>
          {FOTOS.map((_, i) => (
            <div key={i} onClick={()=>setFotoAtual(i)} style={{width:i===fotoAtual?24:6,height:'6px',borderRadius:'3px',background:i===fotoAtual?'white':'rgba(255,255,255,0.4)',transition:'all 0.3s',cursor:'pointer'}} />
          ))}
        </div>
      </div>

      {/* SOBRE */}
      <div style={{maxWidth:'600px',margin:'0 auto',padding:'5rem 2rem',textAlign:'center'}}>
        <p style={{fontSize:'9px',letterSpacing:'3px',textTransform:'uppercase',color:'#a08060',fontWeight:600,marginBottom:'1.5rem'}}>O nosso espaço</p>
        <h2 style={{fontSize:'clamp(24px,5vw,36px)',fontWeight:600,letterSpacing:'1px',color:'#2a2420',marginBottom:'1.5rem',lineHeight:1.3}}>
          Um lugar onde o movimento<br/>encontra o bem-estar
        </h2>
        <p style={{fontSize:'15px',color:'#8a7060',lineHeight:1.9,fontWeight:300,marginBottom:'1.5rem'}}>
          O Hipilates é um espaço clínico dedicado ao Pilates Clínico, integrado na FISIOREIS. Cada sessão é pensada para o corpo do utente, com turmas reduzidas e acompanhamento personalizado por profissionais de saúde.
        </p>
        <p style={{fontSize:'15px',color:'#8a7060',lineHeight:1.9,fontWeight:300}}>
          Um ambiente sereno, materiais de excelência e uma equipa dedicada — essa é a experiência Hipilates.
        </p>
      </div>

      {/* GALERIA */}
      <div style={{padding:'0 0 5rem',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'4px',maxWidth:'600px',margin:'0 auto',padding:'0 1rem'}}>
          {FOTOS.map((f,i) => (
            <div key={i} style={{aspectRatio:'1',overflow:'hidden',borderRadius:'2px'}}>
              <img src={f} alt="" style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s'}} onMouseEnter={e=>e.target.style.transform='scale(1.05)'} onMouseLeave={e=>e.target.style.transform='scale(1)'} />
            </div>
          ))}
        </div>
      </div>

      {/* PLANOS */}
      <div style={{background:'#2a2420',padding:'5rem 1.5rem'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <p style={{fontSize:'9px',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',fontWeight:600,marginBottom:'1rem',textAlign:'center'}}>Planos</p>
          <h2 style={{fontSize:'clamp(22px,4vw,32px)',fontWeight:600,letterSpacing:'1px',color:'white',marginBottom:'3rem',textAlign:'center',lineHeight:1.3}}>
            Encontre o plano ideal
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            {PLANOS.map((p,i) => (
              <div key={i} style={{background:p.destaque?'white':'rgba(255,255,255,0.05)',border:p.destaque?'none':'0.5px solid rgba(255,255,255,0.1)',borderRadius:'3px',padding:'20px 16px',position:'relative'}}>
                {p.destaque && <div style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',background:'#a08060',color:'white',fontSize:'8px',letterSpacing:'2px',textTransform:'uppercase',fontWeight:700,padding:'4px 12px',borderRadius:'20px',whiteSpace:'nowrap'}}>Mais popular</div>}
                <div style={{fontSize:'9px',letterSpacing:'2px',textTransform:'uppercase',color:p.destaque?'#8a7060':'rgba(255,255,255,0.5)',fontWeight:600,marginBottom:'10px'}}>{p.nome}</div>
                <div style={{fontSize:'26px',fontWeight:700,color:p.destaque?'#2a2420':'white',marginBottom:'2px'}}>{p.preco}</div>
                <div style={{fontSize:'11px',color:p.destaque?'#a08060':'rgba(255,255,255,0.5)',marginBottom:'4px',fontWeight:400}}>{p.sub}</div>
                <div style={{fontSize:'11px',color:p.destaque?'#c8b090':'rgba(255,255,255,0.3)',marginBottom:'14px',fontWeight:400}}>{p.extra}</div>
                <div style={{borderTop:p.destaque?'0.5px solid #e8dcc8':'0.5px solid rgba(255,255,255,0.1)',paddingTop:'12px'}}>
                  {p.desc.split('\n').map((l,j) => (
                    <div key={j} style={{fontSize:'11px',color:p.destaque?'#8a7060':'rgba(255,255,255,0.6)',marginBottom:'5px',display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{color:p.destaque?'#a08060':'rgba(255,255,255,0.4)',fontSize:'8px'}}>✓</span>{l}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:'2.5rem'}}>

            <Link to="/registo" style={{display:'inline-block',padding:'16px 40px',background:'white',color:'#2a2420',textDecoration:'none',fontSize:'10px',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:700,borderRadius:'2px'}}>
              Começar agora
            </Link>
          </div>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <div style={{padding:'5rem 1.5rem',maxWidth:'600px',margin:'0 auto'}}>
        <p style={{fontSize:'9px',letterSpacing:'3px',textTransform:'uppercase',color:'#a08060',fontWeight:600,marginBottom:'1rem',textAlign:'center'}}>Como funciona</p>
        <h2 style={{fontSize:'clamp(22px,4vw,32px)',fontWeight:600,color:'#2a2420',marginBottom:'3rem',textAlign:'center',lineHeight:1.3}}>
          Simples, do início ao fim
        </h2>
        {[
          { num:'01', titulo:'Inscrição online', desc:'O utente preenche o formulário de inscrição com os seus dados e preferências de horário.' },
          { num:'02', titulo:'Validação da inscrição', desc:'A equipa analisa o pedido e atribui uma turma adequada ao perfil do utente.' },
          { num:'03', titulo:'Confirmação', desc:'O utente recebe uma notificação na aplicação com a turma, o horário e as instruções de pagamento.' },
          { num:'04', titulo:'Início das aulas', desc:'O utente aparece na primeira aula e é acompanhado pela equipa especializada.' },
        ].map((p,i) => (
          <div key={i} style={{display:'flex',gap:'20px',marginBottom:'2rem',alignItems:'flex-start'}}>
            <div style={{width:'44px',height:'44px',background:'#f5f0e8',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:'11px',fontWeight:700,color:'#a08060',letterSpacing:'1px'}}>{p.num}</span>
            </div>
            <div>
              <div style={{fontSize:'14px',fontWeight:600,color:'#2a2420',marginBottom:'6px'}}>{p.titulo}</div>
              <div style={{fontSize:'13px',color:'#8a7060',lineHeight:1.7,fontWeight:300}}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA FINAL */}
      <div style={{background:'#f5f0e8',padding:'5rem 1.5rem',textAlign:'center'}}>
        <LogoSVG color='#a08060' size={40} />
        <h2 style={{fontSize:'clamp(22px,4vw,32px)',fontWeight:600,color:'#2a2420',margin:'1.5rem 0 1rem',lineHeight:1.3}}>
          Pronto para começar?
        </h2>
        <p style={{fontSize:'14px',color:'#8a7060',marginBottom:'2rem',lineHeight:1.7,fontWeight:300}}>
          Junte-se à nossa comunidade e descubra<br/>o que o Pilates Clínico pode fazer por si.
        </p>
        <Link to="/registo" style={{display:'inline-block',padding:'16px 40px',background:'#2a2420',color:'white',textDecoration:'none',fontSize:'10px',letterSpacing:'2.5px',textTransform:'uppercase',fontWeight:700,borderRadius:'2px'}}>
          Inscrever-se agora
        </Link>
        <p style={{marginTop:'1.5rem',fontSize:'12px',color:'#8a7060'}}>
          Já tem conta? <Link to="/login" style={{color:'#a08060',textDecoration:'none',borderBottom:'1px solid #c8b090'}}>Entrar aqui</Link>
        </p>
      </div>

      {/* RODAPÉ */}
      <div style={{background:'#2a2420',padding:'2rem 1.5rem',textAlign:'center'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'1rem'}}>
          <LogoSVG color='rgba(255,255,255,0.5)' size={18} />
          <span style={{fontSize:'12px',letterSpacing:'3px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',fontWeight:500}}>Hipilates · by fisioreis</span>
        </div>
        <p style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',letterSpacing:'0.5px'}}>© 2026 Hipilates. Todos os direitos reservados.</p>
      </div>

    </div>
  )
}

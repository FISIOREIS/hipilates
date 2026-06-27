export default function Privacidade({ onFechar }) {
  return (
    <div className="modal-bg" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'80vh',overflowY:'auto',maxWidth:'420px'}}>
        <div className="modal-title">Política de Privacidade</div>
        <div style={{fontSize:'12px',color:'var(--texto)',lineHeight:1.8}}>
          <p style={{fontSize:'11px',color:'var(--texto-muted)',marginBottom:'1rem'}}>Última atualização: Junho 2026</p>
          <div className="ficha-section-title">1. Responsável pelo Tratamento</div>
          <p style={{marginBottom:'1rem'}}>
            <strong>António Valente Reis UNIP LDA</strong><br/>
            Nome comercial: Hipilates<br/>
            NIF: 516 820 206<br/>
            Morada: Rua Dom António Valente da Fonseca 832, 3880-518 Válega, Ovar<br/>
            Email: hipilates@fisioreis.pt<br/>
            Telefone: 913 197 254
          </p>
          <div className="ficha-section-title">2. Dados Recolhidos</div>
          <p style={{marginBottom:'0.5rem'}}>Recolhemos os seguintes dados pessoais:</p>
          <ul style={{paddingLeft:'1.25rem',marginBottom:'1rem'}}>
            <li>Nome completo, email e telemóvel</li>
            <li>Data de nascimento e NIF</li>
            <li>Morada completa</li>
            <li>Dados de saúde: lesões, limitações físicas e objetivos (apenas com o seu consentimento explícito)</li>
            <li>Histórico de aulas e marcações</li>
          </ul>
          <div className="ficha-section-title">3. Finalidade do Tratamento</div>
          <ul style={{paddingLeft:'1.25rem',marginBottom:'1rem'}}>
            <li>Gestão de marcações e presenças</li>
            <li>Personalização das aulas de acordo com o seu perfil de saúde</li>
            <li>Comunicação sobre o estúdio e as suas aulas</li>
            <li>Gestão de pagamentos e planos</li>
            <li>Emissão de faturação</li>
          </ul>
          <div className="ficha-section-title">4. Base Legal</div>
          <p style={{marginBottom:'1rem'}}>
            O tratamento dos seus dados baseia-se no seu consentimento (Art. 6.º, n.º 1, al. a) e Art. 9.º, n.º 2, al. a) do RGPD) e na execução do contrato de prestação de serviços.
          </p>
          <div className="ficha-section-title">5. Conservação dos Dados</div>
          <p style={{marginBottom:'1rem'}}>
            Os seus dados são conservados enquanto mantiver uma relação contratual connosco. Após o términus, serão eliminados no prazo máximo de 2 anos, salvo obrigação legal em contrário.
          </p>
          <div className="ficha-section-title">6. Partilha de Dados</div>
          <p style={{marginBottom:'1rem'}}>
            Os seus dados não são partilhados com terceiros para fins comerciais. Utilizamos o serviço Supabase (UE) para armazenamento seguro dos dados e o Vendus para faturação certificada.
          </p>
          <div className="ficha-section-title">7. Os Seus Direitos</div>
          <p style={{marginBottom:'0.5rem'}}>Tem direito a:</p>
          <ul style={{paddingLeft:'1.25rem',marginBottom:'1rem'}}>
            <li>Aceder aos seus dados pessoais</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar a eliminação dos seus dados</li>
            <li>Retirar o consentimento a qualquer momento</li>
            <li>Apresentar reclamação à CNPD (www.cnpd.pt)</li>
          </ul>
          <p style={{marginBottom:'1rem'}}>
            Para exercer os seus direitos, contacte-nos através de: <strong>hipilates@fisioreis.pt</strong>
          </p>
          <div className="ficha-section-title">8. Segurança</div>
          <p style={{marginBottom:'1rem'}}>
            Adotamos medidas técnicas e organizativas adequadas para proteger os seus dados contra acesso não autorizado, perda ou destruição.
          </p>
        </div>
        <button className="btn btn-primary btn-full" style={{marginTop:'1rem'}} onClick={onFechar}>Fechar</button>
      </div>
    </div>
  )
}

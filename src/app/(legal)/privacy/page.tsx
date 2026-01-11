import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Privacidade - Buildix",
  description: "Politica de Privacidade da plataforma Buildix",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Politica de Privacidade</h1>
        <p className="text-muted-foreground">Ultima atualizacao: Janeiro de 2025</p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Introducao</h2>
          <p className="text-muted-foreground">
            Esta politica descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais,
            em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018) e demais
            legislacoes aplicaveis.
          </p>
          <p className="text-muted-foreground">
            Ao usar o Buildix, voce consente com as praticas descritas nesta politica.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Dados Coletados</h2>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">2.1 Dados de Cadastro</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Nome completo</li>
              <li>Endereco de email</li>
              <li>Senha (armazenada de forma criptografada)</li>
              <li>Foto de perfil (opcional)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">2.2 Dados de Uso</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Projetos e paginas criados</li>
              <li>Imagens enviadas</li>
              <li>Prompts de IA utilizados</li>
              <li>Historico de geracoes</li>
              <li>Preferencias de interface</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">2.3 Dados de Pagamento</h3>
            <p className="text-muted-foreground">
              Os dados de pagamento (cartao de credito, etc.) sao processados diretamente pela Stripe.
              <strong className="text-foreground"> Nao armazenamos dados sensiveis de cartao em nossos servidores.</strong>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">2.4 Dados Tecnicos</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Endereco IP</li>
              <li>Tipo de navegador</li>
              <li>Sistema operacional</li>
              <li>Paginas visitadas e tempo de permanencia</li>
              <li>Cookies e identificadores de sessao</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Finalidade e Base Legal</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Dado</th>
                  <th className="text-left py-2 px-3 font-medium">Finalidade</th>
                  <th className="text-left py-2 px-3 font-medium">Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 px-3">Email/Nome</td>
                  <td className="py-2 px-3">Identificacao e comunicacao</td>
                  <td className="py-2 px-3">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Projetos/Paginas</td>
                  <td className="py-2 px-3">Prestacao do servico</td>
                  <td className="py-2 px-3">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Dados de pagamento</td>
                  <td className="py-2 px-3">Cobranca e faturamento</td>
                  <td className="py-2 px-3">Execucao de contrato (Art. 7, V)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Prompts de IA</td>
                  <td className="py-2 px-3">Melhoria do servico</td>
                  <td className="py-2 px-3">Legitimo interesse (Art. 7, IX)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">IP/Browser</td>
                  <td className="py-2 px-3">Seguranca e prevencao de fraudes</td>
                  <td className="py-2 px-3">Legitimo interesse (Art. 7, IX)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Compartilhamento de Dados</h2>
          <p className="text-muted-foreground">Compartilhamos seus dados com os seguintes prestadores de servico:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong className="text-foreground">Stripe</strong>: Processamento de pagamentos (EUA)</li>
            <li><strong className="text-foreground">Amazon Web Services (AWS)</strong>: Hospedagem e armazenamento de imagens (EUA)</li>
            <li><strong className="text-foreground">Google Cloud</strong>: API de IA Gemini para geracao de conteudo (EUA)</li>
            <li><strong className="text-foreground">Vercel</strong>: Hospedagem da aplicacao (EUA)</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Todos os prestadores sao contratualmente obrigados a proteger seus dados e utiliza-los
            apenas para as finalidades especificadas.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Transferencia Internacional de Dados</h2>
          <p className="text-muted-foreground">
            Seus dados podem ser transferidos e armazenados em servidores localizados nos Estados Unidos
            atraves dos servicos mencionados acima. Utilizamos provedores que seguem padroes adequados
            de protecao de dados, incluindo certificacoes e clausulas contratuais padrao.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Seus Direitos (Art. 18, LGPD)</h2>
          <p className="text-muted-foreground">Voce tem os seguintes direitos em relacao aos seus dados pessoais:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong className="text-foreground">Confirmacao</strong>: Confirmar a existencia de tratamento de dados</li>
            <li><strong className="text-foreground">Acesso</strong>: Acessar seus dados pessoais</li>
            <li><strong className="text-foreground">Correcao</strong>: Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li><strong className="text-foreground">Anonimizacao/Bloqueio</strong>: Solicitar anonimizacao ou bloqueio de dados desnecessarios</li>
            <li><strong className="text-foreground">Eliminacao</strong>: Solicitar a eliminacao de dados tratados com consentimento</li>
            <li><strong className="text-foreground">Portabilidade</strong>: Solicitar a portabilidade dos dados para outro fornecedor</li>
            <li><strong className="text-foreground">Informacao</strong>: Ser informado sobre com quem compartilhamos seus dados</li>
            <li><strong className="text-foreground">Revogacao</strong>: Revogar o consentimento a qualquer momento</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Para exercer seus direitos, entre em contato atraves do email: <a href="mailto:privacidade@buildix.com.br" className="text-primary hover:underline">privacidade@buildix.com.br</a>
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Retencao de Dados</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong className="text-foreground">Conta ativa</strong>: Dados mantidos enquanto a conta existir</li>
            <li><strong className="text-foreground">Apos cancelamento</strong>: 30 dias para possivel recuperacao, depois eliminados</li>
            <li><strong className="text-foreground">Dados de pagamento</strong>: Mantidos conforme exigencias fiscais (5 anos)</li>
            <li><strong className="text-foreground">Logs de seguranca</strong>: Mantidos por 6 meses</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Seguranca dos Dados</h2>
          <p className="text-muted-foreground">Implementamos medidas tecnicas e organizacionais para proteger seus dados:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Criptografia em transito (HTTPS/TLS)</li>
            <li>Senhas armazenadas com hash bcrypt</li>
            <li>Acesso restrito aos dados por funcionarios autorizados</li>
            <li>Monitoramento de seguranca continuo</li>
            <li>Backups regulares e redundancia de dados</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Cookies</h2>
          <p className="text-muted-foreground">Utilizamos cookies para:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li><strong className="text-foreground">Essenciais</strong>: Manter sua sessao ativa e autenticacao</li>
            <li><strong className="text-foreground">Funcionais</strong>: Lembrar suas preferencias (idioma, tema)</li>
            <li><strong className="text-foreground">Analytics</strong>: Entender como voce usa o servico (opcional)</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Voce pode gerenciar cookies atraves das configuracoes do seu navegador.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Menores de Idade</h2>
          <p className="text-muted-foreground">
            O Buildix nao e destinado a menores de 18 anos. Nao coletamos intencionalmente dados de
            menores. Se tomarmos conhecimento de que coletamos dados de um menor, tomaremos medidas
            para eliminar essas informacoes.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Encarregado de Protecao de Dados (DPO)</h2>
          <p className="text-muted-foreground">
            Em conformidade com a LGPD, designamos um Encarregado de Protecao de Dados:
          </p>
          <p className="text-muted-foreground">
            Email: <a href="mailto:dpo@buildix.com.br" className="text-primary hover:underline">dpo@buildix.com.br</a>
          </p>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Alteracoes nesta Politica</h2>
          <p className="text-muted-foreground">
            Esta politica pode ser atualizada periodicamente. Mudancas significativas serao
            comunicadas por email e/ou aviso na plataforma. Recomendamos revisar esta pagina
            regularmente.
          </p>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">13. Contato</h2>
          <p className="text-muted-foreground">Para questoes sobre privacidade e protecao de dados:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Email geral: <a href="mailto:privacidade@buildix.com.br" className="text-primary hover:underline">privacidade@buildix.com.br</a></li>
            <li>DPO: <a href="mailto:dpo@buildix.com.br" className="text-primary hover:underline">dpo@buildix.com.br</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

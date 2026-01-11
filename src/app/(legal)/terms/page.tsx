import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso - Buildix",
  description: "Termos de Uso da plataforma Buildix",
};

export default function TermsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
        <p className="text-muted-foreground">Ultima atualizacao: Janeiro de 2025</p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Aceitacao dos Termos</h2>
          <p className="text-muted-foreground">
            Ao acessar e usar o Buildix, voce concorda com estes termos de uso. Se voce nao concordar
            com qualquer parte destes termos, nao podera usar nossos servicos.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Descricao do Servico</h2>
          <p className="text-muted-foreground">
            O Buildix e uma plataforma de criacao de landing pages com assistencia de Inteligencia
            Artificial. Nosso servico permite que voce crie, edite e exporte paginas web usando
            linguagem natural e ferramentas de design visual.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Cadastro e Conta</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Voce deve fornecer informacoes verdadeiras e atualizadas ao se cadastrar</li>
            <li>Voce e responsavel pela seguranca da sua conta e senha</li>
            <li>Uma conta por pessoa ou empresa e permitida</li>
            <li>Voce deve ter pelo menos 18 anos para usar o servico</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Planos e Pagamento</h2>
          <p className="text-muted-foreground">
            O Buildix oferece diferentes planos de assinatura: Free, Pro, Max e Ultra. Os pagamentos
            sao processados de forma segura atraves da Stripe. Voce pode cancelar sua assinatura a
            qualquer momento atraves do portal de assinante.
          </p>

          <div className="space-y-3 mt-4 p-4 bg-muted/50 rounded-lg border">
            <h3 className="text-lg font-medium">4.1 Politica de Reembolso</h3>
            <p className="text-muted-foreground">
              O direito de arrependimento de 7 dias, previsto no Art. 49 do Codigo de Defesa do Consumidor,
              se aplica as assinaturas pagas, <strong className="text-foreground">EXCETO quando recursos de IA ja foram utilizados</strong>.
            </p>

            <p className="text-muted-foreground">
              <strong className="text-foreground">Antes de usar recursos de IA pela primeira vez</strong>, voce vera um modal de aceite
              informando que:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>O servico de IA e considerado consumido imediatamente apos o uso</li>
              <li>Os custos de API sao irreversiveis</li>
              <li>O reembolso NAO sera possivel apos utilizar qualquer recurso de IA</li>
            </ul>

            <div className="overflow-x-auto mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Situacao</th>
                    <th className="text-left py-2 px-3 font-medium">Reembolso</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3 text-muted-foreground">Assinatura sem uso de IA</td>
                    <td className="py-2 px-3 text-green-600 dark:text-green-400 font-medium">Integral em ate 7 dias</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-muted-foreground">Apos usar IA (geracao de codigo, imagens)</td>
                    <td className="py-2 px-3 text-red-600 dark:text-red-400 font-medium">Nao elegivel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              O aceite dos termos de uso de IA e registrado em seu perfil (data/hora) e serve como
              comprovante legal de que voce foi informado.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Uso Aceitavel</h2>
          <p className="text-muted-foreground">O usuario NAO pode:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Gerar conteudo ilegal, difamatorio ou que viole direitos de terceiros</li>
            <li>Usar o servico para spam, phishing ou atividades fraudulentas</li>
            <li>Tentar burlar limites do plano ou explorar vulnerabilidades</li>
            <li>Revender o servico sem autorizacao previa por escrito</li>
            <li>Usar o servico para criar conteudo que promova violencia ou discriminacao</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Propriedade Intelectual</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>O codigo HTML gerado pertence ao usuario que o criou</li>
            <li>A tecnologia, marca e software do Buildix pertencem a empresa</li>
            <li>Imagens da galeria publica tem licencas especificas que devem ser respeitadas</li>
            <li>Templates da comunidade seguem as regras de licenciamento de cada autor</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Conteudo Gerado por IA</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>O conteudo e gerado por modelos de IA (Google Gemini e outros)</li>
            <li>Nao garantimos precisao, adequacao ou originalidade do conteudo gerado</li>
            <li>O usuario e responsavel por revisar e validar todo conteudo antes de publicar</li>
            <li>O Buildix nao se responsabiliza por erros ou imprecisoes no conteudo gerado</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Limitacao de Responsabilidade</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>O servico e fornecido &quot;como esta&quot; (as is)</li>
            <li>Nao nos responsabilizamos por perdas diretas ou indiretas decorrentes do uso</li>
            <li>A disponibilidade do servico pode variar e nao garantimos uptime de 100%</li>
            <li>Nao somos responsaveis por conteudo de terceiros ou links externos</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Cancelamento e Encerramento</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Voce pode cancelar sua assinatura a qualquer momento pelo portal de assinante</li>
            <li>Seus dados sao mantidos por 30 dias apos cancelamento para possivel recuperacao</li>
            <li>Reembolso conforme secao 4.1 (nao elegivel se usou recursos de IA)</li>
            <li>Podemos encerrar contas que violem estes termos sem aviso previo</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Alteracoes nos Termos</h2>
          <p className="text-muted-foreground">
            Podemos alterar estes termos a qualquer momento. Mudancas significativas serao comunicadas
            com aviso previo de 30 dias por email. O uso continuo do servico apos alteracoes constitui
            aceitacao dos novos termos.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Lei Aplicavel e Foro</h2>
          <p className="text-muted-foreground">
            Estes termos sao regidos pelas leis da Republica Federativa do Brasil. Para dirimir
            quaisquer controversias decorrentes destes termos, fica eleito o foro da comarca de
            Sao Paulo/SP, com exclusao de qualquer outro, por mais privilegiado que seja.
          </p>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Contato</h2>
          <p className="text-muted-foreground">
            Para questoes sobre estes termos de uso, entre em contato:
          </p>
          <p className="text-muted-foreground">
            Email: <a href="mailto:contato@buildix.com.br" className="text-primary hover:underline">contato@buildix.com.br</a>
          </p>
        </section>
      </div>
    </div>
  );
}

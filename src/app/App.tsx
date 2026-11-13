import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { FundoDoBody } from './components/fundo-do-body';
import { Toaster } from 'sonner';
import { useTheme } from '../providers/theme-provider';
import { ScenarioControls } from '../app/components/ui/ScenarioControls';
import { TicketPurchaseScreen } from '../app/components/TicketPurchaseScreen';
import { ProductSelection } from '../app/components/ProductSelection';
import { CymaticsShowcase } from '../app/components/CymaticsShowcase';
import { CortesiasProvider } from '../produtos/backstage/cortesias/data/cortesias-store';
import { SelecaoOrganizacao } from '../produtos/backstage/organizacoes/pages/SelecaoOrganizacao';
import { RemixProvider } from '../produtos/backstage/components/remix/remix-context';
import { EmissaoCortesias } from '../produtos/backstage/cortesias/pages/EmissaoCortesias';
import { PermissaoEnvio } from '../produtos/backstage/permissao-envio/pages/PermissaoEnvio';
import { NovaPermissao } from '../produtos/backstage/permissao-envio/pages/NovaPermissao';
import { EquipeEPermissoes } from '../produtos/backstage/equipe-e-permissoes/pages/EquipeEPermissoes';
import { NovoMembro } from '../produtos/backstage/equipe-e-permissoes/pages/NovoMembro';
import { RelatorioPedidos } from '../produtos/backstage/cortesias/pages/RelatorioPedidos';
import { SelecaoItens } from '../produtos/backstage/cortesias/pages/SelecaoItens';
import { VerificacaoFinal } from '../produtos/backstage/cortesias/pages/VerificacaoFinal';
import { Acesso } from '../produtos/backstage/relatorios/pages/Acesso';
import { Bordero } from '../produtos/backstage/relatorios/pages/Bordero';
import { Comparativos } from '../produtos/backstage/relatorios/pages/Comparativos';
import { Transacoes } from '../produtos/backstage/relatorios/pages/Transacoes';
import { Transacoes2 } from '../produtos/backstage/relatorios/pages/Transacoes2';
import { Transacoes3 } from '../produtos/backstage/relatorios/pages/Transacoes3';
import { Transferencias } from '../produtos/backstage/relatorios/pages/Transferencias';
import { VendasPorGrupo } from '../produtos/backstage/relatorios/pages/VendasPorGrupo';
import { Questionarios } from '../produtos/backstage/relatorios/pages/Questionarios';
import { RelatorioPersonalizado } from '../produtos/backstage/relatorios/pages/RelatorioPersonalizado';
import { Eventos as BackstageEventos } from '../produtos/backstage/eventos/pages/Eventos';
import { CriarEvento as BackstageCriarEvento } from '../produtos/backstage/eventos/pages/CriarEvento';
import { VisaoGeralEvento } from '../produtos/backstage/eventos/pages/VisaoGeralEvento';
import { InformacoesEvento } from '../produtos/backstage/eventos/pages/InformacoesEvento';
import { MembrosV2 } from '../produtos/backstage/membros-v2/pages/MembrosV2';
import { NovoGrupoV2 } from '../produtos/backstage/membros-v2/pages/NovoGrupoV2';
import { Membros } from '../produtos/backstage/membros/pages/Membros';
import { CriarCargo } from '../produtos/backstage/membros/pages/CriarCargo';
import { EquipeEComissarios } from '../produtos/backstage/equipe-e-comissarios/pages/equipe-e-comissarios';
import { GrupoDaEquipe } from '../produtos/backstage/equipe-e-comissarios/pages/grupo';
import { CanalDoGrupo } from '../produtos/backstage/equipe-e-comissarios/pages/canal-do-grupo';
import { RedirecionarComissario } from '../produtos/backstage/equipe-e-comissarios/pages/redirecionar-comissario';
import { RelatorioComissarios } from '../produtos/backstage/comissarios/pages/relatorio-comissarios';
import { ChaveDeAcesso } from '../produtos/backstage/chave-de-acesso/pages/ChaveDeAcesso';
import { VenderIngressos } from '../produtos/backstage/bilheteria/pages/VenderIngressos';
import { IngressoPdf } from '../produtos/backstage/bilheteria/pages/IngressoPdf';
import { PedidosBilheteria } from '../produtos/backstage/bilheteria/pages/Pedidos';
import { VincularItens } from '../produtos/backstage/chave-de-acesso/pages/VincularItens';
import { ListaChaves } from '../produtos/backstage/chave-de-acesso/pages/ListaChaves';
import { SeletorTimes } from '../produtos/futebol/landing-pages/pages/SeletorTimes';
import { Gremio } from '../produtos/futebol/landing-pages/pages/Gremio';
import { Botafogo } from '../produtos/futebol/landing-pages/pages/Botafogo';
import { PasswordGate } from '../produtos/novo-site/components/PasswordGate';
import { EventDetails } from '../produtos/novo-site/home/pages/event-details';
import { Categorias } from '../produtos/novo-site/home/pages/categorias';
import { Home as NovoSiteHome } from '../produtos/novo-site/home/pages/home';
import { Busca as NovoSiteBusca } from '../produtos/novo-site/home/pages/busca';
import { Itens as CatalogoItens } from '../produtos/backstage/catalogo/pages/Itens';
import { Ingressos as CatalogoIngressos } from '../produtos/backstage/ingressos/pages/Ingressos';
import { Formulario as IngressosFormulario } from '../produtos/backstage/ingressos/pages/Formulario';
import { EditarGrupos } from '../produtos/backstage/ingressos/pages/EditarGrupos';
import { AberturasDeVendas } from '../produtos/backstage/aberturas-de-vendas/pages/AberturasDeVendas';
import { Questionario } from '../produtos/backstage/questionario/pages/Questionario';
import { PerguntaDetalhe } from '../produtos/backstage/questionario/pages/PerguntaDetalhe';
import { Ingressos as ItensIngressos } from '../produtos/backstage/itens/pages/Ingressos';
import { IngressoDetalhe as ItensIngressoDetalhe } from '../produtos/backstage/itens/pages/IngressoDetalhe';
import { Produtos as ItensProdutos } from '../produtos/backstage/itens/pages/Produtos';
import { ProdutoDetalhe as ItensProdutoDetalhe } from '../produtos/backstage/itens/pages/ProdutoDetalhe';
import { ProdutosDaOrganizacao } from '../produtos/backstage/produtos-organizacao/pages/ProdutosDaOrganizacao';
import { ProdutoDaOrganizacaoDetalhe } from '../produtos/backstage/produtos-organizacao/pages/ProdutoDaOrganizacaoDetalhe';
import { LayoutDeItens } from '../produtos/backstage/itens/pages/layout-de-itens';
import { Combos as ItensCombos } from '../produtos/backstage/itens/pages/Combos';
import { ComboDetalhe as ItensComboDetalhe } from '../produtos/backstage/itens/pages/ComboDetalhe';
import { Configuracoes as ItensConfiguracoes } from '../produtos/backstage/itens/pages/Configuracoes';
import { PerguntasProvider } from '../produtos/backstage/perguntas/data/perguntas-store';
import { Perguntas } from '../produtos/backstage/perguntas/pages/Perguntas';
import { PerguntaForm } from '../produtos/backstage/perguntas/pages/PerguntaForm';
import { PesquisasProvider } from '../produtos/backstage/pesquisas/data/pesquisas-store';
import { Pesquisas } from '../produtos/backstage/pesquisas/pages/Pesquisas';
import { VinculosPergunta } from '../produtos/backstage/pesquisas/pages/VinculosPergunta';
import { SelecaoEAtribuicao } from '../produtos/marketplace/selecao-e-atribuicao/pages/SelecaoEAtribuicao';
import { Config as MarketplaceConfig } from '../produtos/marketplace/selecao-e-atribuicao/pages/Config';
import { Sucesso as MarketplaceSucesso } from '../produtos/marketplace/selecao-e-atribuicao/pages/Sucesso';
import { MeiaEntrada as MarketplaceMeiaEntrada } from '../produtos/marketplace/selecao-e-atribuicao/pages/MeiaEntrada';
import { SelecaoEAtribuicao as TotemSelecaoEAtribuicao } from '../produtos/totem/selecao-e-atribuicao/pages/SelecaoEAtribuicao';
import { Config as TotemConfig } from '../produtos/totem/selecao-e-atribuicao/pages/Config';
import { Sucesso as TotemSucesso } from '../produtos/totem/selecao-e-atribuicao/pages/Sucesso';
import { MeiaEntrada as TotemMeiaEntrada } from '../produtos/totem/selecao-e-atribuicao/pages/MeiaEntrada';
import { Home as IngresseAppHome } from '../produtos/ingresse-app/home/pages/Home';
import { Carteira as IngresseAppCarteira } from '../produtos/ingresse-app/carteira/pages/Carteira';
import { Ingressos as IngresseAppIngressos } from '../produtos/ingresse-app/ingressos/pages/Ingressos';
import { IngressoDetalhe as IngresseAppIngressoDetalhe } from '../produtos/ingresse-app/ingressos/pages/IngressoDetalhe';
import { TrocarIngresso as IngresseAppTrocarIngresso } from '../produtos/ingresse-app/ingressos/pages/TrocarIngresso';
import { TrocarPagamento as IngresseAppTrocarPagamento } from '../produtos/ingresse-app/ingressos/pages/TrocarPagamento';
import { TrocarPagamentoPix as IngresseAppTrocarPagamentoPix } from '../produtos/ingresse-app/ingressos/pages/TrocarPagamentoPix';
import { TrocarPagamentoCartao as IngresseAppTrocarPagamentoCartao } from '../produtos/ingresse-app/ingressos/pages/TrocarPagamentoCartao';
import { TrocaSucesso as IngresseAppTrocaSucesso } from '../produtos/ingresse-app/ingressos/pages/TrocaSucesso';
import { ComboDetalhe as IngresseAppComboDetalhe } from '../produtos/ingresse-app/ingressos/pages/ComboDetalhe';
import { EditarFormulario as IngresseAppEditarFormulario } from '../produtos/ingresse-app/ingressos/pages/EditarFormulario';
import { ProdutoDetalhe as IngresseAppProdutoDetalhe } from '../produtos/ingresse-app/ingressos/pages/ProdutoDetalhe';
import { TransferirIngresso as IngresseAppTransferir } from '../produtos/ingresse-app/ingressos/pages/TransferirIngresso';
import { TransferirDependente as IngresseAppTransferirDependente } from '../produtos/ingresse-app/ingressos/pages/TransferirDependente';
import { CadastrarDependente as IngresseAppCadastrarDependente } from '../produtos/ingresse-app/ingressos/pages/CadastrarDependente';
import { TransferenciaPagamento as IngresseAppTransferenciaPagamento } from '../produtos/ingresse-app/ingressos/pages/TransferenciaPagamento';
import { PagamentoCartao as IngresseAppPagamentoCartao } from '../produtos/ingresse-app/ingressos/pages/PagamentoCartao';
import { PagamentoPix as IngresseAppPagamentoPix } from '../produtos/ingresse-app/ingressos/pages/PagamentoPix';
import { TransferenciaSucesso as IngresseAppTransferenciaSucesso } from '../produtos/ingresse-app/ingressos/pages/TransferenciaSucesso';
import { TransferenciaProcessando as IngresseAppTransferenciaProcessando } from '../produtos/ingresse-app/ingressos/pages/TransferenciaProcessando';
import { Perfil as IngresseAppPerfil } from '../produtos/ingresse-app/perfil/pages/Perfil';
import { Dependentes as IngresseAppDependentes } from '../produtos/ingresse-app/perfil/pages/Dependentes';
import { CadastrarDependente as PerfilCadastrarDependente } from '../produtos/ingresse-app/perfil/pages/CadastrarDependente';
import { HabilitarAcesso as PerfilHabilitarAcesso } from '../produtos/ingresse-app/perfil/pages/habilitar-acesso';
import { SelecionarPerfil as PerfilSelecionarPerfil } from '../produtos/ingresse-app/perfil/pages/selecionar-perfil';
import { TelaBloqueadaIphone as IngresseAppTelaBloqueadaIphone } from '../produtos/ingresse-app/tela-bloqueada/pages/TelaBloqueadaIphone';
import { MeusIngressos } from '../produtos/carteira-app/meus-ingressos/pages/MeusIngressos';
import { MeusIngressosWeb } from '../produtos/carteira-app/meus-ingressos/pages/MeusIngressosWeb';
import { Hub } from '../produtos/ticket-sports/hub/pages/Hub';
import { Cadastro } from '../produtos/ticket-sports/hub/pages/Cadastro';
import { Login } from '../produtos/ticket-sports/hub/pages/Login';
import { TipoPerfil } from '../produtos/ticket-sports/hub/pages/TipoPerfil';
import { Onboarding } from '../produtos/ticket-sports/hub/pages/Onboarding';
import { Sucesso } from '../produtos/ticket-sports/hub/pages/Sucesso';
import { CriarRotina } from '../produtos/ticket-sports/hub/pages/CriarRotina';
import { ConfigurarComunidade } from '../produtos/ticket-sports/hub/pages/ConfigurarComunidade';
import { FotoRosto } from '../produtos/ticket-sports/hub/pages/FotoRosto';
import { Home as TicketSportsHome } from '../produtos/ticket-sports/hub/pages/Home';
import { ConquistasMes } from '../produtos/ticket-sports/hub/pages/ConquistasMes';
import { Presentes } from '../produtos/ticket-sports/hub/pages/Presentes';
import { Plano } from '../produtos/ticket-sports/hub/pages/Plano';
import { EmpresaHome } from '../produtos/ticket-sports/hub/pages/EmpresaHome';
import { NovaPublicacao } from '../produtos/ticket-sports/hub/pages/NovaPublicacao';
import { Notificacoes } from '../produtos/ticket-sports/hub/pages/Notificacoes';
import { ConfigurarNotificacoes } from '../produtos/ticket-sports/hub/pages/ConfigurarNotificacoes';
import { FeedGeral } from '../produtos/ticket-sports/hub/pages/FeedGeral';
import { CriarPost } from '../produtos/ticket-sports/hub/pages/CriarPost';
import { VerStory } from '../produtos/ticket-sports/hub/pages/VerStory';
import { PerfilUsuario } from '../produtos/ticket-sports/hub/pages/PerfilUsuario';
import { DesempenhoRotina } from '../produtos/ticket-sports/hub/pages/DesempenhoRotina';
import { Tendencias } from '../produtos/ticket-sports/hub/pages/Tendencias';
import { Recomendacoes } from '../produtos/ticket-sports/hub/pages/Recomendacoes';
import { Eventos } from '../produtos/ticket-sports/hub/pages/Eventos';
import { EventoDetalhe } from '../produtos/ticket-sports/hub/pages/EventoDetalhe';
import { Filtros } from '../produtos/ticket-sports/hub/pages/Filtros';
import { MapaEventos } from '../produtos/ticket-sports/hub/pages/MapaEventos';
import { Perfil } from '../produtos/ticket-sports/hub/pages/Perfil';
import { EditarPerfil } from '../produtos/ticket-sports/hub/pages/EditarPerfil';
import { Historias } from '../produtos/ticket-sports/hub/pages/Historias';
import { EnviarHistoria } from '../produtos/ticket-sports/hub/pages/EnviarHistoria';
import { Grupos } from '../produtos/ticket-sports/hub/pages/Grupos';
import { DivulgarGrupo } from '../produtos/ticket-sports/hub/pages/DivulgarGrupo';
import { DetalhesGrupo } from '../produtos/ticket-sports/hub/pages/DetalhesGrupo';
import { Comunidades } from '../produtos/ticket-sports/hub/pages/Comunidades';
import { ComunidadeDetalhe } from '../produtos/ticket-sports/hub/pages/ComunidadeDetalhe';
import { Catalogo as TsAcademyCatalogo } from '../produtos/ticket/ts-academy/pages/Catalogo';
import { CursoDetalhe as TsAcademyCursoDetalhe } from '../produtos/ticket/ts-academy/pages/CursoDetalhe';
import { EventoInscricao as TsAcademyEventoInscricao } from '../produtos/ticket/ts-academy/pages/EventoInscricao';
import { Secao as TsAcademySecao } from '../produtos/ticket/ts-academy/pages/Secao';
import { Home as LpSsHome } from '../produtos/lp-ss/home/pages/Home';
import { HomeAcessivel as LpSsHomeAcessivel } from '../produtos/lp-ss/home/pages/HomeAcessivel';
import { HomeClaro as LpSsHomeClaro } from '../produtos/lp-ss/home/pages/HomeClaro';
import { PasswordGate as UsabilidadeGate } from '../produtos/usabilidade/components/PasswordGate';
import { Painel as TestesPainel } from '../produtos/usabilidade/testes/pages/Painel';
import { EditorTeste } from '../produtos/usabilidade/testes/pages/EditorTeste';
import { Resultados as TesteResultados } from '../produtos/usabilidade/testes/pages/Resultados';
import { EntradaTeste } from '../produtos/usabilidade/testes/pages/EntradaTeste';
import { LandingPagesMenu } from '../produtos/landing-pages/menu/pages/LandingPagesMenu';
import { Inscricao as TicketSportsInscricao } from '../produtos/ticketsports/inscricao/pages/Inscricao';
import { SaoSilvestre } from '../produtos/landing-pages/sao-silvestre/pages/SaoSilvestre';
import { LoungePremiumBahia } from '../produtos/landing-pages/lounge-premium-bahia/pages/LoungePremiumBahia';
import { SportsWeek } from '../produtos/landing-pages/sports-week/pages/SportsWeek';
import { SolicitacaoVagas } from '../produtos/landing-pages/sao-silvestre/pages/SolicitacaoVagas';
import { SolicitacaoBeneficioPcd } from '../produtos/landing-pages/sao-silvestre/pages/SolicitacaoBeneficioPcd';
import { Carteira as CarteiraWeb } from '../produtos/carteira-web/pages/Carteira';
import { TransferirInscricao as CarteiraWebTransferir } from '../produtos/carteira-web/pages/TransferirInscricao';
import { TrocaOnboardingWeb as CarteiraWebTrocaOnboarding } from '../produtos/carteira-web/pages/TrocaOnboardingWeb';
import { MeusDependentes as CarteiraWebDependentes } from '../produtos/carteira-web/pages/meus-dependentes';
import { SelecionarPerfil as CarteiraWebSelecionarPerfil } from '../produtos/carteira-web/pages/selecionar-perfil';
import { Home as RevendaHome } from '../produtos/revenda/home/pages/Home';
import { Evento as RevendaEvento } from '../produtos/revenda/evento/pages/Evento';
import { ServicosAdicionais } from '../produtos/revenda/servicos-adicionais/pages/servicos-adicionais';
import { Oferta as ServicoOferta } from '../produtos/revenda/servicos-adicionais/pages/oferta';
import { CheckoutServico } from '../produtos/revenda/servicos-adicionais/pages/checkout';
import { ConfirmacaoServico } from '../produtos/revenda/servicos-adicionais/pages/confirmacao';
import { SolicitacoesInbox } from '../produtos/aprovacoes/solicitacoes/pages/SolicitacoesInbox';
import { Publico } from '../produtos/backstage/publico/pages/Publico';
import { Pedidos as PedidosPosCompra } from '../produtos/backstage/alteracoes-pos-compra/pages/Pedidos';
import { DetalhePedido as DetalhePedidoPosCompra } from '../produtos/backstage/alteracoes-pos-compra/pages/DetalhePedido';
import { Pedidos as TrocaPedidos } from '../produtos/backstage/troca-de-inscricao/pages/pedidos';
import { Pedido as TrocaPedido } from '../produtos/backstage/troca-de-inscricao/pages/pedido';
import { RevisarAlteracoes as TrocaRevisar } from '../produtos/backstage/troca-de-inscricao/pages/revisar-alteracoes';
import { EditarEvento as TrocaEditarEvento } from '../produtos/backstage/troca-de-inscricao/pages/editar-evento';
import { LinkPagamento as TrocaLinkPagamento } from '../produtos/backstage/troca-de-inscricao/pages/link-pagamento';
import { BorderoTroca, TransacoesTroca } from '../produtos/backstage/troca-de-inscricao/pages/relatorios-troca';
import { Emails as TrocaEmails } from '../produtos/backstage/troca-de-inscricao/pages/emails';
import { Inscricoes as CarteiraTrocaInscricoes } from '../produtos/carteira-web/troca-de-inscricao/pages/inscricoes';
import { Trocar as CarteiraTrocaTrocar } from '../produtos/carteira-web/troca-de-inscricao/pages/trocar';
import { Perguntas as CarteiraTrocaPerguntas } from '../produtos/carteira-web/troca-de-inscricao/pages/perguntas';
import { Pagamento as CarteiraTrocaPagamento, TrocaConfirmada as CarteiraTrocaConfirmada } from '../produtos/carteira-web/troca-de-inscricao/pages/pagamento';
import { AlterarPedido } from '../produtos/backstage/alteracoes-pos-compra/pages/AlterarPedido';
import { FormulariosParticipacao } from '../produtos/backstage/publico/pages/FormulariosParticipacao';
import { SolicitacoesParticipacao } from '../produtos/backstage/publico/pages/SolicitacoesParticipacao';
import { PreVenda } from '../produtos/backstage/marketing/pages/PreVenda';
import { EventosFreepass, InicioFreepass } from '../produtos/backstage/freepass/pages/eventos';
import { VendasNoEvento as FreepassVendasNoEvento } from '../produtos/backstage/freepass/pages/vendas-no-evento';
import { Recebimentos as FreepassRecebimentos } from '../produtos/backstage/freepass/pages/recebimentos';
import { Reanalise } from '../produtos/payin/suspensao-de-conta/pages/Reanalise';
import { SuspenderUsuario } from '../produtos/payin/suspensao-de-conta/pages/SuspenderUsuario';
import { HistoricoSuspensao } from '../produtos/payin/suspensao-de-conta/pages/HistoricoSuspensao';
import { PayInMenu } from '../produtos/payin/menu/pages/PayInMenu';
import { Checkout as PayInCheckout } from '../produtos/payin/checkout/pages/Checkout';
import { AnaliseFeedback as PayInAnaliseFeedback } from '../produtos/payin/checkout/pages/AnaliseFeedback';
import { AnaliseResultados as PayInAnaliseResultados } from '../produtos/payin/checkout/pages/AnaliseResultados';
import { Pagamento as CheckoutPagamento } from '../produtos/checkout/melhorias-de-compra/pages/pagamento';
import { Cartao as CheckoutCartao } from '../produtos/checkout/melhorias-de-compra/pages/cartao';
import { NaoAutorizado as CheckoutNaoAutorizado } from '../produtos/checkout/melhorias-de-compra/pages/nao-autorizado';
import { Confirmado as CheckoutConfirmado } from '../produtos/checkout/melhorias-de-compra/pages/confirmado';
import { CompraDoEvento } from '../produtos/marketplace/selecao-e-atribuicao/pages/CompraDoEvento';
import { Selecao as ProtecaoDeCompra } from '../produtos/checkout/protecao-de-compra/pages/selecao';
import { Eventos as CashoutEventos } from '../produtos/payout/contrato-quick-win-finance/pages/eventos';
import { Produtoras as CashoutProdutoras } from '../produtos/payout/contrato-quick-win-finance/pages/produtoras';

function HomeScreen() {
  const [params, setParams] = useState({
    dates: 'unica',
    times: 'unico',
    maps: 'nenhum',
    customStartDate: new Date().toISOString().split('T')[0],
    customEndDate: '',
    unavailableDates: [] as string[],
    hasCombos: false,
    limits: { global: '', perDay: '', perTime: '' }
  });

  return (
    <div className="app-container">
      <ScenarioControls params={params} setParams={setParams} />
      <TicketPurchaseScreen scenario={params} />
    </div>
  );
}

export default function App() {
  const { theme } = useTheme();
  return (
    <RemixProvider>
    <CortesiasProvider>
      <PerguntasProvider>
      <PesquisasProvider>
      <Routes>
        <Route path="/" element={<ProductSelection />} />
        <Route path="/loading" element={<CymaticsShowcase />} />
        <Route path="/backstage" element={<SelecaoOrganizacao />} />
        <Route path="/backstage/eventos" element={<BackstageEventos />} />
        <Route path="/backstage/eventos/novo" element={<BackstageCriarEvento />} />
        <Route path="/backstage/evento/visao-geral" element={<VisaoGeralEvento />} />
        <Route path="/backstage/informacoes-evento" element={<InformacoesEvento />} />
        {/* Troca de inscrição (TS-1812): protótipo próprio, separado de Pedidos pós-compra */}
        <Route path="/backstage/troca-de-inscricao" element={<TrocaPedidos />} />
        <Route path="/backstage/troca-de-inscricao/emails" element={<TrocaEmails />} />
        <Route path="/backstage/troca-de-inscricao/relatorios/transacoes" element={<TransacoesTroca />} />
        <Route path="/backstage/troca-de-inscricao/relatorios/bordero" element={<BorderoTroca />} />
        <Route path="/backstage/troca-de-inscricao/:id" element={<TrocaPedido />} />
        <Route path="/backstage/troca-de-inscricao/:id/revisar" element={<TrocaRevisar />} />
        <Route path="/backstage/evento/editar" element={<TrocaEditarEvento />} />
        <Route path="/troca/link/:id" element={<TrocaLinkPagamento />} />
        <Route path="/carteira-web/inscricoes" element={<CarteiraTrocaInscricoes />} />
        <Route path="/carteira-web/inscricoes/:itemId/trocar" element={<CarteiraTrocaTrocar />} />
        <Route path="/carteira-web/inscricoes/:itemId/trocar/perguntas" element={<CarteiraTrocaPerguntas />} />
        <Route path="/carteira-web/troca/:solId/pagamento" element={<CarteiraTrocaPagamento />} />
        <Route path="/carteira-web/troca/:solId/confirmada" element={<CarteiraTrocaConfirmada />} />
        <Route path="/backstage/pedidos" element={<PedidosPosCompra />} />
        <Route path="/backstage/pedidos/:pedidoId" element={<DetalhePedidoPosCompra />} />
        <Route path="/backstage/pedidos/:pedidoId/transferir" element={<AlterarPedido verbo="transferir" />} />
        <Route path="/backstage/pedidos/:pedidoId/trocar" element={<AlterarPedido verbo="trocar" />} />
        <Route path="/backstage/pedidos/:pedidoId/formulario" element={<AlterarPedido verbo="formulario" />} />
        <Route path="/backstage/membros" element={<Membros />} />
        <Route path="/backstage/membros/criar-cargo" element={<CriarCargo />} />
        <Route path="/backstage/membros/cargos/:id/editar" element={<CriarCargo />} />
        <Route path="/backstage/membros-v2" element={<MembrosV2 />} />
        <Route path="/backstage/membros-v2/grupos/novo" element={<NovoGrupoV2 />} />
        {/* Equipe e Comissários (ECO): Equipe de operação e Comissários do evento num destino só. */}
        <Route path="/backstage/evento/equipe" element={<EquipeEComissarios />} />
        <Route path="/backstage/evento/equipe/:grupoId" element={<GrupoDaEquipe />} />
        <Route path="/backstage/evento/equipe/:grupoId/canal/:canal" element={<CanalDoGrupo />} />
        <Route path="/backstage/equipe-de-operacao/*" element={<Navigate to="/backstage/evento/equipe" replace />} />
        <Route path="/backstage/bilheteria" element={<PedidosBilheteria />} />
        <Route path="/backstage/bilheteria/vender" element={<VenderIngressos />} />
        <Route path="/backstage/bilheteria/ingresso-pdf" element={<IngressoPdf />} />
        <Route path="/backstage/cortesias" element={<RelatorioPedidos />} />
        <Route path="/backstage/permissao-envio" element={<PermissaoEnvio />} />
        <Route path="/backstage/permissao-envio/nova" element={<NovaPermissao />} />
        <Route path="/backstage/permissao-envio/:id/editar" element={<NovaPermissao />} />
        <Route path="/backstage/equipe-e-permissoes" element={<EquipeEPermissoes />} />
        <Route path="/backstage/equipe-e-permissoes/novo" element={<NovoMembro />} />
        <Route path="/backstage/equipe-e-permissoes/:id/editar" element={<NovoMembro />} />
        <Route path="/backstage/itens" element={<SelecaoItens />} />
        <Route path="/backstage/destinatarios" element={<EmissaoCortesias />} />
        <Route path="/backstage/verificacao" element={<VerificacaoFinal />} />
        <Route path="/backstage/relatorios/vendas-por-grupo" element={<VendasPorGrupo />} />
        <Route path="/backstage/relatorios/transacoes" element={<Transacoes />} />
        <Route path="/backstage/relatorios/transacoes2" element={<Transacoes2 />} />
        <Route path="/backstage/relatorios/transacoes3" element={<Transacoes3 />} />
        <Route path="/backstage/relatorios/acesso" element={<Acesso />} />
        <Route path="/backstage/relatorios/bordero" element={<Bordero />} />
        <Route path="/backstage/relatorios/transferencias" element={<Transferencias />} />
        <Route path="/backstage/relatorios/comparativos" element={<Comparativos />} />
        <Route path="/backstage/relatorios/questionarios" element={<Questionarios />} />
        <Route path="/backstage/relatorios/relatorio-personalizado" element={<RelatorioPersonalizado />} />
        <Route path="/backstage/marketing/chave-de-acesso" element={<ChaveDeAcesso />} />
        <Route path="/backstage/marketing/chave-de-acesso/vincular-itens" element={<VincularItens />} />
        <Route path="/backstage/marketing/chave-de-acesso/lista" element={<ListaChaves />} />
        {/* Menu Itens novo (itens/): o item é o centro. As telas anteriores ficam em /backstage/catalogo-anterior/*. */}
        {/* Abas de Itens numa rota-pai: rail, menu, título e abas ficam montados; só o conteúdo da aba troca. */}
        <Route element={<LayoutDeItens />}>
            <Route path="/backstage/catalogo/ingressos" element={<ItensIngressos />} />
            <Route path="/backstage/catalogo/produtos" element={<ItensProdutos />} />
            <Route path="/backstage/catalogo/combos" element={<ItensCombos />} />
        </Route>
        <Route path="/backstage/catalogo/ingressos/:id" element={<ItensIngressoDetalhe />} />
        <Route path="/backstage/catalogo/produtos/:id" element={<ItensProdutoDetalhe />} />
        <Route path="/backstage/catalogo/combos/:id" element={<ItensComboDetalhe />} />
        <Route path="/backstage/catalogo/agenda" element={<Navigate to="/backstage/catalogo/aberturas-de-vendas" replace />} />
        <Route path="/backstage/catalogo/ingressos/editar-grupos" element={<Navigate to="/backstage/catalogo/ingressos" replace />} />
        <Route path="/backstage/catalogo/ingressos/formulario" element={<Navigate to="/backstage/catalogo/ingressos" replace />} />
        <Route path="/backstage/catalogo/aberturas-de-vendas" element={<AberturasDeVendas />} />
        <Route path="/backstage/catalogo/configuracoes" element={<ItensConfiguracoes />} />
        <Route path="/backstage/catalogo" element={<Navigate to="/backstage/catalogo/ingressos" replace />} />
        <Route path="/backstage/catalogo/questionario" element={<Questionario />} />
        <Route path="/backstage/catalogo/questionario/:id" element={<PerguntaDetalhe />} />
        <Route path="/backstage/catalogo/itens" element={<Navigate to="/backstage/catalogo/ingressos" replace />} />
        <Route path="/backstage/catalogo-anterior/ingressos" element={<CatalogoIngressos />} />
        <Route path="/backstage/catalogo-anterior/editar-grupos" element={<EditarGrupos />} />
        <Route path="/backstage/catalogo-anterior/formulario" element={<IngressosFormulario />} />
        <Route path="/backstage/catalogo-anterior/aberturas-de-vendas" element={<Navigate to="/backstage/catalogo/aberturas-de-vendas" replace />} />
        <Route path="/backstage/catalogo-anterior/itens" element={<CatalogoItens />} />
        <Route path="/backstage/perguntas" element={<Perguntas />} />
        <Route path="/backstage/perguntas/nova" element={<PerguntaForm />} />
        <Route path="/backstage/perguntas/:id/editar" element={<PerguntaForm />} />
        <Route path="/backstage/pesquisas" element={<Pesquisas />} />
        <Route path="/backstage/pesquisas/:perguntaId/vinculos" element={<VinculosPergunta />} />
        <Route path="/carteira-app/meus-ingressos" element={<MeusIngressos />} />
        <Route path="/carteira-app/meus-ingressos/web" element={<MeusIngressosWeb />} />
        <Route path="/ticket-sports/hub" element={<Hub />} />
        <Route path="/ticket-sports/hub/login" element={<Login />} />
        <Route path="/ticket-sports/hub/tipo-perfil" element={<TipoPerfil />} />
        <Route path="/ticket-sports/hub/cadastro" element={<Cadastro />} />
        <Route path="/ticket-sports/hub/foto" element={<FotoRosto />} />
        <Route path="/ticket-sports/hub/onboarding" element={<Onboarding />} />
        <Route path="/ticket-sports/hub/sucesso" element={<Sucesso />} />
        <Route path="/ticket-sports/hub/criar-rotina" element={<CriarRotina />} />
        <Route path="/ticket-sports/hub/rotina/desempenho" element={<DesempenhoRotina />} />
        <Route path="/ticket-sports/hub/tendencias" element={<Tendencias />} />
        <Route path="/ticket-sports/hub/eventos" element={<Eventos />} />
        <Route path="/ticket-sports/hub/eventos/filtros" element={<Filtros />} />
        <Route path="/ticket-sports/hub/eventos/mapa" element={<MapaEventos />} />
        <Route path="/ticket-sports/hub/eventos/:id" element={<EventoDetalhe />} />
        <Route path="/ticket-sports/hub/configurar-comunidade" element={<ConfigurarComunidade />} />
        <Route path="/ticket-sports/hub/home" element={<TicketSportsHome />} />
        <Route path="/ticket-sports/hub/conquistas" element={<ConquistasMes />} />
        <Route path="/ticket-sports/hub/presentes" element={<Presentes />} />
        <Route path="/ticket-sports/hub/plano" element={<Plano />} />
        <Route path="/ticket-sports/hub/empresa" element={<EmpresaHome />} />
        <Route path="/ticket-sports/hub/empresa/publicar" element={<NovaPublicacao />} />
        <Route path="/ticket-sports/hub/notificacoes" element={<Notificacoes />} />
        <Route path="/ticket-sports/hub/notificacoes/configurar" element={<ConfigurarNotificacoes />} />
        <Route path="/ticket-sports/hub/feed" element={<FeedGeral />} />
        <Route path="/ticket-sports/hub/feed/novo" element={<CriarPost />} />
        <Route path="/ticket-sports/hub/feed/story/:id" element={<VerStory />} />
        <Route path="/ticket-sports/hub/feed/usuario/:id" element={<PerfilUsuario />} />
        <Route path="/ticket-sports/hub/perfil" element={<Perfil />} />
        <Route path="/ticket-sports/hub/perfil/editar" element={<EditarPerfil />} />
        <Route path="/ticket-sports/hub/perfil/recomendacoes" element={<Recomendacoes />} />
        <Route path="/ticket-sports/hub/historias" element={<Historias />} />
        <Route path="/ticket-sports/hub/historias/nova" element={<EnviarHistoria />} />
        <Route path="/ticket-sports/hub/grupos" element={<Grupos />} />
        <Route path="/ticket-sports/hub/grupos/divulgar" element={<DivulgarGrupo />} />
        <Route path="/ticket-sports/hub/grupos/:id" element={<DetalhesGrupo />} />
        <Route path="/ticket-sports/hub/comunidades" element={<Comunidades />} />
        <Route path="/ticket-sports/hub/comunidades/:id" element={<ComunidadeDetalhe />} />
        <Route path="/ticket/ts-academy" element={<TsAcademyCatalogo />} />
        <Route path="/ticket/ts-academy/presencial" element={<TsAcademySecao categoria="presencial" />} />
        <Route path="/ticket/ts-academy/sports-week" element={<TsAcademySecao categoria="sports-week" />} />
        <Route path="/ticket/ts-academy/evento/:id" element={<TsAcademyEventoInscricao />} />
        <Route path="/ticket/ts-academy/curso/:id" element={<TsAcademyCursoDetalhe />} />
        <Route path="/lp-ss/home" element={<LpSsHome />} />
        <Route path="/lp-ss/home/acessivel" element={<LpSsHomeAcessivel />} />
        <Route path="/lp-ss/home/claro" element={<LpSsHomeClaro />} />
        <Route path="/lp-ss-v3" element={<LpSsHome />} />
        <Route path="/futebol/landing-pages" element={<SeletorTimes />} />
        <Route path="/futebol/landing-pages/gremio" element={<Gremio />} />
        <Route path="/futebol/landing-pages/botafogo" element={<Botafogo />} />
        <Route path="/marketplace" element={<MarketplaceConfig />} />
        <Route path="/marketplace/event" element={<SelecaoEAtribuicao />} />
        <Route path="/marketplace/sucesso" element={<MarketplaceSucesso />} />
        <Route path="/marketplace/meia-entrada" element={<MarketplaceMeiaEntrada />} />
        <Route path="/totem" element={<TotemConfig />} />
        <Route path="/totem/event" element={<TotemSelecaoEAtribuicao />} />
        <Route path="/totem/sucesso" element={<TotemSucesso />} />
        <Route path="/totem/meia-entrada" element={<TotemMeiaEntrada />} />
        <Route path="/novo-site/home" element={<NovoSiteHome />} />
        <Route path="/novo-site/home/busca" element={<NovoSiteBusca />} />
        <Route path="/novo-site/home/event-details" element={<PasswordGate><EventDetails /></PasswordGate>} />
        <Route path="/novo-site/home/categorias" element={<Categorias />} />
        <Route path="/ingresse-app" element={<IngresseAppHome />} />
        <Route path="/ingresse-app/ingressos" element={<IngresseAppCarteira />} />
        <Route path="/ingresse-app/ingressos/evento/:eventId" element={<IngresseAppIngressos />} />
        <Route path="/ingresse-app/ingressos/detalhe/:eventId/:itemId" element={<IngresseAppIngressoDetalhe />} />
        <Route path="/ingresse-app/ingressos/trocar/:eventId/:itemId" element={<IngresseAppTrocarIngresso />} />
        <Route path="/ingresse-app/ingressos/trocar/:eventId/:itemId/pagamento" element={<IngresseAppTrocarPagamento />} />
        <Route path="/ingresse-app/ingressos/trocar/:eventId/:itemId/pagamento/pix" element={<IngresseAppTrocarPagamentoPix />} />
        <Route path="/ingresse-app/ingressos/trocar/:eventId/:itemId/pagamento/cartao" element={<IngresseAppTrocarPagamentoCartao />} />
        <Route path="/ingresse-app/ingressos/trocar/:eventId/:itemId/sucesso" element={<IngresseAppTrocaSucesso />} />
        <Route path="/ingresse-app/ingressos/combo/:eventId/:comboId" element={<IngresseAppComboDetalhe />} />
        <Route path="/ingresse-app/ingressos/formulario/:eventId/:comboId" element={<IngresseAppEditarFormulario />} />
        <Route path="/ingresse-app/ingressos/produto/:eventId/:itemId" element={<IngresseAppProdutoDetalhe />} />
        <Route path="/ingresse-app/ingressos/transferir/:eventId/:id" element={<IngresseAppTransferir />} />
        <Route path="/ingresse-app/ingressos/transferir-dependente/:eventId/:id" element={<IngresseAppTransferirDependente />} />
        <Route path="/ingresse-app/ingressos/cadastrar-dependente/:eventId/:id" element={<IngresseAppCadastrarDependente />} />
        <Route path="/ingresse-app/ingressos/transferir-pagamento/:eventId/:id" element={<IngresseAppTransferenciaPagamento />} />
        <Route path="/ingresse-app/ingressos/transferir-pagamento/:eventId/:id/cartao" element={<IngresseAppPagamentoCartao />} />
        <Route path="/ingresse-app/ingressos/transferir-pagamento/:eventId/:id/pix" element={<IngresseAppPagamentoPix />} />
        <Route path="/ingresse-app/ingressos/transferir-pagamento/:eventId/:id/processando" element={<IngresseAppTransferenciaProcessando />} />
        <Route path="/ingresse-app/ingressos/transferir-pagamento/:eventId/:id/sucesso" element={<IngresseAppTransferenciaSucesso />} />
        <Route path="/ingresse-app/perfil" element={<IngresseAppPerfil />} />
        <Route path="/ingresse-app/perfil/dependentes" element={<IngresseAppDependentes />} />
        <Route path="/ingresse-app/perfil/dependentes/cadastrar" element={<PerfilCadastrarDependente />} />
        <Route path="/ingresse-app/perfil/dependentes/:id/habilitar" element={<PerfilHabilitarAcesso />} />
        <Route path="/ingresse-app/perfil/selecionar" element={<PerfilSelecionarPerfil />} />
        <Route path="/ingresse-app/tela-bloqueada/iphone" element={<IngresseAppTelaBloqueadaIphone />} />
        <Route path="/testes" element={<UsabilidadeGate><TestesPainel /></UsabilidadeGate>} />
        <Route path="/testes/novo" element={<UsabilidadeGate><EditorTeste /></UsabilidadeGate>} />
        <Route path="/testes/:id/editar" element={<UsabilidadeGate><EditorTeste /></UsabilidadeGate>} />
        <Route path="/testes/:id/resultados" element={<UsabilidadeGate><TesteResultados /></UsabilidadeGate>} />
        <Route path="/t/:id" element={<EntradaTeste />} />
        <Route path="/landing-pages" element={<LandingPagesMenu />} />
        {/* Sub-roteador próprio: as três páginas da campanha trocam entre si com
            transição, sem mexer no <Routes> plano do app. */}
        <Route path="/landing-pages/sports-week/*" element={<SportsWeek />} />
        {/* Link separado — não listado na ProductSelection (home) */}
        <Route path="/ticketsports/inscricao" element={<TicketSportsInscricao />} />
        <Route path="/landing-pages/lounge-premium-bahia" element={<LoungePremiumBahia />} />
        <Route path="/landing-pages/sao-silvestre" element={<SaoSilvestre />} />
        <Route path="/landing-pages/sao-silvestre/solicitar-vagas" element={<SolicitacaoVagas />} />
        <Route path="/landing-pages/sao-silvestre/solicitar-beneficio-pcd" element={<SolicitacaoBeneficioPcd />} />
        <Route path="/carteira-web" element={<CarteiraWeb />} />
        <Route path="/carteira-web/transferir" element={<CarteiraWebTransferir />} />
        <Route path="/carteira-web/troca-onboarding" element={<CarteiraWebTrocaOnboarding />} />
        <Route path="/carteira-web/dependentes/onboarding" element={<CarteiraWeb />} />
        <Route path="/carteira-web/dependentes" element={<CarteiraWebDependentes />} />
        <Route path="/carteira-web/selecionar" element={<CarteiraWebSelecionarPerfil />} />
        <Route path="/revenda" element={<RevendaHome />} />
        <Route path="/revenda/:slug" element={<RevendaEvento />} />
        <Route path="/revenda/servicos-adicionais" element={<ServicosAdicionais />} />
        <Route path="/revenda/servicos-adicionais/:servico" element={<ServicoOferta />} />
        <Route path="/revenda/servicos-adicionais/:servico/checkout" element={<CheckoutServico />} />
        <Route path="/revenda/servicos-adicionais/:servico/confirmacao" element={<ConfirmacaoServico />} />
        <Route path="/aprovacoes/solicitacoes" element={<SolicitacoesInbox />} />
        <Route path="/backstage/publico" element={<Publico />} />
        <Route path="/backstage/produtos" element={<ProdutosDaOrganizacao />} />
        {/* Não há mais cadastro de comissário na organização: o grupo é o comissário (ECO-09); o painel virou relatório (ECO-26). */}
        <Route path="/backstage/relatorios/comissarios" element={<RelatorioComissarios />} />
        <Route path="/backstage/comissarios/*" element={<Navigate to="/backstage/relatorios/comissarios" replace />} />
        <Route path="/backstage/evento/comissarios" element={<Navigate to="/backstage/evento/equipe" replace />} />
        <Route path="/backstage/evento/comissarios/:id" element={<RedirecionarComissario />} />
        <Route path="/backstage/suas-vendas" element={<Navigate to="/freepass/eventos" replace />} />
        <Route path="/backstage/produtos/:id" element={<ProdutoDaOrganizacaoDetalhe />} />
        <Route path="/backstage/publico/formularios" element={<FormulariosParticipacao />} />
        <Route path="/backstage/publico/solicitacoes" element={<SolicitacoesParticipacao />} />
        <Route path="/backstage/marketing/pre-venda" element={<PreVenda />} />
        {/* Freepass: o Backstage com acessos a menos. Mesma shell e mesmas telas de cortesia e bilheteria (BKS-60). */}
        <Route path="/freepass" element={<InicioFreepass />} />
        <Route path="/freepass/eventos" element={<EventosFreepass />} />
        {/* Visualização por funcionalidade (FCO-85): a lista de eventos de cada funcionalidade. */}
        <Route path="/freepass/vendas" element={<EventosFreepass funcao="vendas" />} />
        <Route path="/freepass/cortesias/eventos" element={<EventosFreepass funcao="cortesia" />} />
        <Route path="/freepass/bilheteria/eventos" element={<EventosFreepass funcao="bilheteria" />} />
        <Route path="/freepass/recebimentos" element={<FreepassRecebimentos />} />
        <Route path="/freepass/evento/vendas" element={<FreepassVendasNoEvento />} />
        <Route path="/freepass/cortesias" element={<RelatorioPedidos />} />
        <Route path="/freepass/itens" element={<SelecaoItens />} />
        <Route path="/freepass/destinatarios" element={<EmissaoCortesias />} />
        <Route path="/freepass/verificacao" element={<VerificacaoFinal />} />
        <Route path="/freepass/bilheteria" element={<PedidosBilheteria />} />
        <Route path="/freepass/bilheteria/vender" element={<VenderIngressos />} />
        <Route path="/freepass/bilheteria/ingresso-pdf" element={<IngressoPdf />} />
        {/* Endereços antigos do Freepass (cabeçalho próprio e envio de cortesia próprio). */}
        <Route path="/freepass/distribuicao-cortesias/*" element={<Navigate to="/freepass/eventos" replace />} />
        <Route path="/freepass/comissarios/*" element={<Navigate to="/freepass/eventos" replace />} />
        <Route path="/payin" element={<PayInMenu />} />
        <Route path="/payin/checkout" element={<PayInCheckout />} />
        <Route path="/payin/checkout/analise" element={<PayInAnaliseFeedback />} />
        <Route path="/payin/checkout/analise/resultados" element={<PayInAnaliseResultados />} />
        <Route path="/payin/suspensao-de-conta" element={<Reanalise />} />
        <Route path="/payin/suspensao-de-conta/suspender-usuario" element={<SuspenderUsuario />} />
        <Route path="/payin/suspensao-de-conta/historico/:contaId" element={<HistoricoSuspensao />} />
        <Route path="/payout/contrato-quick-win-finance" element={<CashoutEventos />} />
        <Route path="/payout/contrato-quick-win-finance/produtoras" element={<CashoutProdutoras />} />
        <Route path="/checkout/melhorias-de-compra" element={<CheckoutPagamento />} />
        <Route path="/checkout/melhorias-de-compra/cartao" element={<CheckoutCartao />} />
        <Route path="/checkout/melhorias-de-compra/nao-autorizado" element={<CheckoutNaoAutorizado />} />
        <Route path="/checkout/melhorias-de-compra/confirmado" element={<CheckoutConfirmado />} />
        {/* Plataforma unificada: link de compra de um evento do banco (src/plataforma) */}
        <Route path="/comprar/:eventoId" element={<CompraDoEvento />} />
        <Route path="/e/:slug" element={<CompraDoEvento />} />
        <Route path="/checkout/protecao-de-compra" element={<ProtecaoDeCompra />} />
      </Routes>
      <Toaster position="bottom-right" theme={theme} />
      <FundoDoBody />
      </PesquisasProvider>
      </PerguntasProvider>
    </CortesiasProvider>
    </RemixProvider>
  );
}

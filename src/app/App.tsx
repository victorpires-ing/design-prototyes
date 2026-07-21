import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { useTheme } from '../providers/theme-provider';
import { ScenarioControls } from '../app/components/ui/ScenarioControls';
import { TicketPurchaseScreen } from '../app/components/TicketPurchaseScreen';
import { ProductSelection } from '../app/components/ProductSelection';
import { CymaticsShowcase } from '../app/components/CymaticsShowcase';
import { CortesiasProvider } from '../produtos/backstage/cortesias/data/cortesias-store';
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
import { Transferencias } from '../produtos/backstage/relatorios/pages/Transferencias';
import { VendasPorGrupo } from '../produtos/backstage/relatorios/pages/VendasPorGrupo';
import { Questionarios } from '../produtos/backstage/relatorios/pages/Questionarios';
import { Comparativos } from '../produtos/backstage/relatorios/pages/Comparativos';
import { RelatorioPersonalizado } from '../produtos/backstage/relatorios/pages/RelatorioPersonalizado';
import { Home as BackstageHome } from '../produtos/backstage/home/pages/Home';
import { MembrosV2 } from '../produtos/backstage/membros-v2/pages/MembrosV2';
import { NovoGrupoV2 } from '../produtos/backstage/membros-v2/pages/NovoGrupoV2';
import { ChaveDeAcesso } from '../produtos/backstage/chave-de-acesso/pages/ChaveDeAcesso';
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
import { PerguntasProvider } from '../produtos/backstage/perguntas/data/perguntas-store';
import { Perguntas } from '../produtos/backstage/perguntas/pages/Perguntas';
import { PerguntaForm } from '../produtos/backstage/perguntas/pages/PerguntaForm';
import { PesquisasProvider } from '../produtos/backstage/pesquisas/data/pesquisas-store';
import { Pesquisas } from '../produtos/backstage/pesquisas/pages/Pesquisas';
import { VinculosPergunta } from '../produtos/backstage/pesquisas/pages/VinculosPergunta';
import { SelecaoEAtribuicao } from '../produtos/marketplace/selecao-e-atribuicao/pages/SelecaoEAtribuicao';
import { Config as MarketplaceConfig } from '../produtos/marketplace/selecao-e-atribuicao/pages/Config';
import { Sucesso as MarketplaceSucesso } from '../produtos/marketplace/selecao-e-atribuicao/pages/Sucesso';
import { Home as IngresseAppHome } from '../produtos/ingresse-app/home/pages/Home';
import { Carteira as IngresseAppCarteira } from '../produtos/ingresse-app/carteira/pages/Carteira';
import { Ingressos as IngresseAppIngressos } from '../produtos/ingresse-app/ingressos/pages/Ingressos';
import { IngressoDetalhe as IngresseAppIngressoDetalhe } from '../produtos/ingresse-app/ingressos/pages/IngressoDetalhe';
import { ComboDetalhe as IngresseAppComboDetalhe } from '../produtos/ingresse-app/ingressos/pages/ComboDetalhe';
import { ProdutoDetalhe as IngresseAppProdutoDetalhe } from '../produtos/ingresse-app/ingressos/pages/ProdutoDetalhe';
import { TransferirIngresso as IngresseAppTransferir } from '../produtos/ingresse-app/ingressos/pages/TransferirIngresso';
import { TransferirDependente as IngresseAppTransferirDependente } from '../produtos/ingresse-app/ingressos/pages/TransferirDependente';
import { Perfil as IngresseAppPerfil } from '../produtos/ingresse-app/perfil/pages/Perfil';
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
import { SaoSilvestre } from '../produtos/landing-pages/sao-silvestre/pages/SaoSilvestre';
import { SolicitacaoVagas } from '../produtos/landing-pages/sao-silvestre/pages/SolicitacaoVagas';
import { SolicitacaoBeneficioPcd } from '../produtos/landing-pages/sao-silvestre/pages/SolicitacaoBeneficioPcd';
import { Carteira as CarteiraWeb } from '../produtos/carteira-web/pages/Carteira';
import { TransferirInscricao as CarteiraWebTransferir } from '../produtos/carteira-web/pages/TransferirInscricao';
import { SolicitacoesInbox } from '../produtos/aprovacoes/solicitacoes/pages/SolicitacoesInbox';
import { Publico } from '../produtos/backstage/publico/pages/Publico';
import { FormulariosParticipacao } from '../produtos/backstage/publico/pages/FormulariosParticipacao';
import { SolicitacoesParticipacao } from '../produtos/backstage/publico/pages/SolicitacoesParticipacao';
import { PreVenda } from '../produtos/backstage/marketing/pages/PreVenda';
import { DistribuicaoCortesias } from '../produtos/freepass/distribuicao-cortesias/pages/distribuicao-cortesias';
import { CortesiasDoEvento } from '../produtos/freepass/distribuicao-cortesias/pages/cortesias-do-evento';
import { DetalhesCortesia } from '../produtos/freepass/distribuicao-cortesias/pages/detalhes-cortesia';
import { EnviarCortesiasFlow, ResgatarCortesiasFlow } from '../produtos/freepass/distribuicao-cortesias/pages/distribuir-cortesias';

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
    <CortesiasProvider>
      <PerguntasProvider>
      <PesquisasProvider>
      <Routes>
        <Route path="/" element={<ProductSelection />} />
        <Route path="/loading" element={<CymaticsShowcase />} />
        <Route path="/backstage" element={<RelatorioPedidos />} />
        <Route path="/backstage/home" element={<BackstageHome />} />
        <Route path="/backstage/membros-v2" element={<MembrosV2 />} />
        <Route path="/backstage/membros-v2/grupos/novo" element={<NovoGrupoV2 />} />
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
        <Route path="/backstage/relatorios/acesso" element={<Acesso />} />
        <Route path="/backstage/relatorios/bordero" element={<Bordero />} />
        <Route path="/backstage/relatorios/transferencias" element={<Transferencias />} />
        <Route path="/backstage/relatorios/comparativos" element={<Comparativos />} />
        <Route path="/backstage/relatorios/questionarios" element={<Questionarios />} />
        <Route path="/backstage/relatorios/comissarios" element={<Comissarios />} />
        <Route path="/backstage/relatorios/relatorio-personalizado" element={<RelatorioPersonalizado />} />
        <Route path="/backstage/marketing/chave-de-acesso" element={<ChaveDeAcesso />} />
        <Route path="/backstage/marketing/chave-de-acesso/vincular-itens" element={<VincularItens />} />
        <Route path="/backstage/marketing/chave-de-acesso/lista" element={<ListaChaves />} />
        <Route path="/backstage/catalogo/itens" element={<CatalogoItens />} />
        <Route path="/backstage/catalogo/ingressos" element={<CatalogoIngressos />} />
        <Route path="/backstage/catalogo/ingressos/formulario" element={<IngressosFormulario />} />
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
        <Route path="/futebol/landing-pages" element={<SeletorTimes />} />
        <Route path="/futebol/landing-pages/gremio" element={<Gremio />} />
        <Route path="/futebol/landing-pages/botafogo" element={<Botafogo />} />
        <Route path="/marketplace" element={<MarketplaceConfig />} />
        <Route path="/marketplace/event" element={<SelecaoEAtribuicao />} />
        <Route path="/marketplace/sucesso" element={<MarketplaceSucesso />} />
        <Route path="/novo-site/home" element={<NovoSiteHome />} />
        <Route path="/novo-site/home/busca" element={<NovoSiteBusca />} />
        <Route path="/novo-site/home/event-details" element={<PasswordGate><EventDetails /></PasswordGate>} />
        <Route path="/novo-site/home/categorias" element={<Categorias />} />
        <Route path="/ingresse-app" element={<IngresseAppHome />} />
        <Route path="/ingresse-app/ingressos" element={<IngresseAppCarteira />} />
        <Route path="/ingresse-app/ingressos/evento/:eventId" element={<IngresseAppIngressos />} />
        <Route path="/ingresse-app/ingressos/detalhe/:eventId/:itemId" element={<IngresseAppIngressoDetalhe />} />
        <Route path="/ingresse-app/ingressos/combo/:eventId/:comboId" element={<IngresseAppComboDetalhe />} />
        <Route path="/ingresse-app/ingressos/produto/:eventId/:itemId" element={<IngresseAppProdutoDetalhe />} />
        <Route path="/ingresse-app/ingressos/transferir/:eventId/:id" element={<IngresseAppTransferir />} />
        <Route path="/ingresse-app/ingressos/transferir-dependente/:eventId/:id" element={<IngresseAppTransferirDependente />} />
        <Route path="/ingresse-app/perfil" element={<IngresseAppPerfil />} />
        <Route path="/testes" element={<UsabilidadeGate><TestesPainel /></UsabilidadeGate>} />
        <Route path="/testes/novo" element={<UsabilidadeGate><EditorTeste /></UsabilidadeGate>} />
        <Route path="/testes/:id/editar" element={<UsabilidadeGate><EditorTeste /></UsabilidadeGate>} />
        <Route path="/testes/:id/resultados" element={<UsabilidadeGate><TesteResultados /></UsabilidadeGate>} />
        <Route path="/t/:id" element={<EntradaTeste />} />
        <Route path="/landing-pages" element={<LandingPagesMenu />} />
        <Route path="/landing-pages/sao-silvestre" element={<SaoSilvestre />} />
        <Route path="/landing-pages/sao-silvestre/solicitar-vagas" element={<SolicitacaoVagas />} />
        <Route path="/landing-pages/sao-silvestre/solicitar-beneficio-pcd" element={<SolicitacaoBeneficioPcd />} />
        <Route path="/carteira-web" element={<CarteiraWeb />} />
        <Route path="/carteira-web/transferir" element={<CarteiraWebTransferir />} />
        <Route path="/aprovacoes/solicitacoes" element={<SolicitacoesInbox />} />
        <Route path="/backstage/publico" element={<Publico />} />
        <Route path="/backstage/publico/formularios" element={<FormulariosParticipacao />} />
        <Route path="/backstage/publico/solicitacoes" element={<SolicitacoesParticipacao />} />
        <Route path="/backstage/marketing/pre-venda" element={<PreVenda />} />
        <Route path="/freepass/distribuicao-cortesias" element={<DistribuicaoCortesias />} />
        <Route path="/freepass/distribuicao-cortesias/:eventoId" element={<CortesiasDoEvento />} />
        <Route path="/freepass/distribuicao-cortesias/:eventoId/enviar" element={<EnviarCortesiasFlow />} />
        <Route path="/freepass/distribuicao-cortesias/:eventoId/resgatar" element={<ResgatarCortesiasFlow />} />
        <Route path="/freepass/distribuicao-cortesias/:eventoId/:itemId" element={<DetalhesCortesia />} />
      </Routes>
      <Toaster position="bottom-right" theme={theme} />
      </PesquisasProvider>
      </PerguntasProvider>
    </CortesiasProvider>
  );
}

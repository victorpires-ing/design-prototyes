import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { useTheme } from '../providers/theme-provider';
import { ScenarioControls } from '../app/components/ui/ScenarioControls';
import { TicketPurchaseScreen } from '../app/components/TicketPurchaseScreen';
import { ProductSelection } from '../app/components/ProductSelection';
import { CortesiasProvider } from '../produtos/backstage/cortesias/data/cortesias-store';
import { EmissaoCortesias } from '../produtos/backstage/cortesias/pages/EmissaoCortesias';
import { RelatorioPedidos } from '../produtos/backstage/cortesias/pages/RelatorioPedidos';
import { SelecaoItens } from '../produtos/backstage/cortesias/pages/SelecaoItens';
import { VerificacaoFinal } from '../produtos/backstage/cortesias/pages/VerificacaoFinal';
import { Acesso } from '../produtos/backstage/relatorios/pages/Acesso';
import { Bordero } from '../produtos/backstage/relatorios/pages/Bordero';
import { Transacoes } from '../produtos/backstage/relatorios/pages/Transacoes';
import { Transferencias } from '../produtos/backstage/relatorios/pages/Transferencias';
import { VendasPorGrupo } from '../produtos/backstage/relatorios/pages/VendasPorGrupo';
import { ChaveDeAcesso } from '../produtos/backstage/chave-de-acesso/pages/ChaveDeAcesso';
import { VincularItens } from '../produtos/backstage/chave-de-acesso/pages/VincularItens';
import { ListaChaves } from '../produtos/backstage/chave-de-acesso/pages/ListaChaves';
import { Home as FutebolHome } from '../produtos/futebol/landing-pages/pages/home';
import { PasswordGate } from '../produtos/novo-site/components/PasswordGate';
import { EventDetails } from '../produtos/novo-site/home/pages/event-details';
import { Itens as CatalogoItens } from '../produtos/backstage/catalogo/pages/Itens';
import { Ingressos as CatalogoIngressos } from '../produtos/backstage/ingressos/pages/Ingressos';
import { Formulario as IngressosFormulario } from '../produtos/backstage/ingressos/pages/Formulario';
import { PerguntasProvider } from '../produtos/backstage/perguntas/data/perguntas-store';
import { Perguntas } from '../produtos/backstage/perguntas/pages/Perguntas';
import { PerguntaForm } from '../produtos/backstage/perguntas/pages/PerguntaForm';
import { MeusIngressos } from '../produtos/carteira-app/meus-ingressos/pages/MeusIngressos';

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
      <Routes>
        <Route path="/" element={<ProductSelection />} />
        <Route path="/backstage" element={<RelatorioPedidos />} />
        <Route path="/backstage/cortesias" element={<RelatorioPedidos />} />
        <Route path="/backstage/itens" element={<SelecaoItens />} />
        <Route path="/backstage/destinatarios" element={<EmissaoCortesias />} />
        <Route path="/backstage/verificacao" element={<VerificacaoFinal />} />
        <Route path="/backstage/relatorios/vendas-por-grupo" element={<VendasPorGrupo />} />
        <Route path="/backstage/relatorios/transacoes" element={<Transacoes />} />
        <Route path="/backstage/relatorios/acesso" element={<Acesso />} />
        <Route path="/backstage/relatorios/bordero" element={<Bordero />} />
        <Route path="/backstage/relatorios/transferencias" element={<Transferencias />} />
        <Route path="/backstage/marketing/chave-de-acesso" element={<ChaveDeAcesso />} />
        <Route path="/backstage/marketing/chave-de-acesso/vincular-itens" element={<VincularItens />} />
        <Route path="/backstage/marketing/chave-de-acesso/lista" element={<ListaChaves />} />
        <Route path="/backstage/catalogo/itens" element={<CatalogoItens />} />
        <Route path="/backstage/catalogo/ingressos" element={<CatalogoIngressos />} />
        <Route path="/backstage/catalogo/ingressos/formulario" element={<IngressosFormulario />} />
        <Route path="/backstage/perguntas" element={<Perguntas />} />
        <Route path="/backstage/perguntas/nova" element={<PerguntaForm />} />
        <Route path="/backstage/perguntas/:id/editar" element={<PerguntaForm />} />
        <Route path="/carteira-app/meus-ingressos" element={<MeusIngressos />} />
        <Route path="/futebol/landing-pages" element={<FutebolHome />} />
        <Route path="/novo-site/home/event-details" element={<PasswordGate><EventDetails /></PasswordGate>} />
      </Routes>
      <Toaster position="bottom-right" theme={theme} />
      </PerguntasProvider>
    </CortesiasProvider>
  );
}

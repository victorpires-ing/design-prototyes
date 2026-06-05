import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { useTheme } from '../providers/theme-provider';
import { ScenarioControls } from '../app/components/ui/ScenarioControls';
import { TicketPurchaseScreen } from '../app/components/TicketPurchaseScreen';
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
import { VendasPorGrupoV2 } from '../produtos/backstage/relatorios/pages/VendasPorGrupoV2';
import { ChaveDeAcesso } from '../produtos/backstage/chave-de-acesso/pages/ChaveDeAcesso';
import { VincularItens } from '../produtos/backstage/chave-de-acesso/pages/VincularItens';
import { ListaChaves } from '../produtos/backstage/chave-de-acesso/pages/ListaChaves';

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
      <Routes>
        <Route path="/" element={<RelatorioPedidos />} />
        <Route path="/backstage" element={<RelatorioPedidos />} />
        <Route path="/backstage/cortesias" element={<RelatorioPedidos />} />
        <Route path="/backstage/itens" element={<SelecaoItens />} />
        <Route path="/backstage/destinatarios" element={<EmissaoCortesias />} />
        <Route path="/backstage/verificacao" element={<VerificacaoFinal />} />
        <Route path="/backstage/relatorios/vendas-por-grupo" element={<VendasPorGrupo />} />
        <Route path="/backstage/relatorios/vendas-por-grupo-v2" element={<VendasPorGrupoV2 />} />
        <Route path="/backstage/relatorios/transacoes" element={<Transacoes />} />
        <Route path="/backstage/relatorios/acesso" element={<Acesso />} />
        <Route path="/backstage/relatorios/bordero" element={<Bordero />} />
        <Route path="/backstage/relatorios/transferencias" element={<Transferencias />} />
        <Route path="/backstage/marketing/chave-de-acesso" element={<ChaveDeAcesso />} />
        <Route path="/backstage/marketing/chave-de-acesso/vincular-itens" element={<VincularItens />} />
        <Route path="/backstage/marketing/chave-de-acesso/lista" element={<ListaChaves />} />
      </Routes>
      <Toaster position="bottom-right" theme={theme} />
    </CortesiasProvider>
  );
}

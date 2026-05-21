import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { ScenarioControls } from '../app/components/ui/ScenarioControls';
import { TicketPurchaseScreen } from '../app/components/TicketPurchaseScreen';
import { CortesiasProvider } from '../cortesias/data/cortesias-store';
import { EmissaoCortesias } from '../cortesias/pages/EmissaoCortesias';
import { RelatorioPedidos } from '../cortesias/pages/RelatorioPedidos';
import { SelecaoItens } from '../cortesias/pages/SelecaoItens';
import { VerificacaoFinal } from '../cortesias/pages/VerificacaoFinal';

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
  return (
    <CortesiasProvider>
      <Routes>
        <Route path="/" element={<RelatorioPedidos />} />
        <Route path="/backstage" element={<RelatorioPedidos />} />
        <Route path="/backstage/cortesias" element={<RelatorioPedidos />} />
        <Route path="/backstage/itens" element={<SelecaoItens />} />
        <Route path="/backstage/destinatarios" element={<EmissaoCortesias />} />
        <Route path="/backstage/verificacao" element={<VerificacaoFinal />} />
      </Routes>
      <Toaster position="bottom-right" />
    </CortesiasProvider>
  );
}

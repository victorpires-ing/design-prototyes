import { useState } from 'react';
import { Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { ScenarioControls } from '../app/components/ui/ScenarioControls';
import { TicketPurchaseScreen } from '../app/components/TicketPurchaseScreen';
import { EmissaoCortesias } from '../app/pages/EmissaoCortesias';
import { RelatorioPedidos } from '../app/pages/RelatorioPedidos';
import { SelecaoItens } from '../app/pages/SelecaoItens';
import { VerificacaoFinal } from '../app/pages/VerificacaoFinal';

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
    <>
      <Routes>
        <Route path="/" element={<SelecaoItens />} />
        <Route path="/backstage" element={<SelecaoItens />} />
        <Route path="/backstage/destinatarios" element={<EmissaoCortesias />} />
        <Route path="/backstage/verificacao" element={<VerificacaoFinal />} />
        <Route path="/backstage/cortesias" element={<RelatorioPedidos />} />
      </Routes>
      <Toaster position="bottom-right" />
    </>
  );
}

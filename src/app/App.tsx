import { useState } from 'react';
import { ScenarioControls } from '../app/components/ui/ScenarioControls'
import { TicketPurchaseScreen } from "../app/components/TicketPurchaseScreen";

export default function App() {
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
import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './layout/Header';
import { useTicketCart } from './hooks/useTicketCart';
import { StepTickets } from './steps/StepTickets';
import { StepProducts } from './steps/StepProducts';
import { CartFooter } from './ui/CartFooter'; // Mobile
import { CartSidebar } from './ui/CartSidebar'; // Desktop

export function TicketPurchaseScreen({ scenario }: any) {
  const [step, setStep] = useState<1 | 2>(1);
  
  const { 
    cart, 
    activeDate, 
    setActiveDate, 
    derivedData, 
    totals = { grandTotal: 0, hasTickets: false }, 
    handlers 
  } = useTicketCart(scenario);

  const handleNext = () => step === 1 ? setStep(2) : alert("Ir para Checkout");

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f8fa] font-sans pb-30">

      {/* Container Principal: Responsivo */}
      <Header />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 pt-4 pb-4">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* COLUNA ESQUERDA: Conteúdo (Tickets/Produtos) */}
          <div className="flex-1 w-full min-w-0"> {/* min-w-0 evita overflow em flex items */}
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <StepTickets 
                  key="step1"
                  scenario={scenario}
                  derivedData={derivedData}
                  cart={cart}
                  handlers={handlers}
                  activeDate={activeDate}
                  setActiveDate={setActiveDate}
                />
              ) : (
                <StepProducts 
                  key="step2"
                  combos={derivedData.combos}
                  productSelection={cart.products}
                  onUpdate={handlers.updateProduct}
                  onBack={() => setStep(1)}
                />
              )}
            </AnimatePresence>
          </div>

          <CartSidebar 
            step={step}
            cart={cart}
            totals={totals}
            handlers={handlers}
            derivedData={derivedData} // <--- IMPORTANTE: Passar derivedData
            onNext={handleNext}
          />

        </div>
      </main>

      {/* FOOTER: Mobile (Apenas Mobile) */}
      <CartFooter 
        step={step}
        cart={cart}
        totals={totals}
        handlers={handlers}
        derivedData={derivedData} // <--- IMPORTANTE: Passar derivedData
        onNext={handleNext}
        onBack={() => setStep(1)}
      />
    </div>
  );
}
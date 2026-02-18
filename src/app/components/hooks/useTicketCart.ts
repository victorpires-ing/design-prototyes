import { useState, useMemo, useEffect } from 'react';

export function useTicketCart(scenario: any) {
  const [ticketSelection, setTicketSelection] = useState<Record<string, number>>({});
  const [productSelection, setProductSelection] = useState<Record<string, number>>({});
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  const derivedData = useMemo(() => {
    const start = new Date(scenario.customStartDate + 'T00:00:00');
    let generatedDates: Date[] = [];

    if (scenario.customEndDate) {
      const end = new Date(scenario.customEndDate + 'T00:00:00');
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      generatedDates = Array.from({ length: diffDays + 1 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    } else {
      generatedDates = [start];
    }

    const timesMap: any = { 
        unico: ["19:00"], 
        alguns: ["10:00", "14:00", "18:00"],
        varios: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"], 
        muitos: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"]
    };
    
    const availableTimes = timesMap[scenario.times] || timesMap['unico'];

    const soldOutTimestamps = (scenario.unavailableDates || []).map((dateStr: string) => 
      new Date(dateStr + 'T00:00:00').getTime()
    );

    // Helper para gerar array de imagens (Carrossel Mock)
    const mockImages = (url: string) => [url, url, url];

    return { 
      dates: generatedDates, 
      availableTimes, 
      soldOutDates: soldOutTimestamps,
      
      combos: [
        { 
          id: 'prod_shirt', 
          name: 'Camisa Oficial #BGS26', 
          description: 'Design personalizado e conforto absoluto com 100% algodão. Feita para gamers que vivem o game, dentro e fora das telas.',
          price: 119.90,
          tag: {
            content:'Acabando rápido',
            color: '#155dfc', 
          },
          image: 'https://images.tcdn.com.br/img/img_prod/782660/camisa_oficial_bgs25_1445_1_ec6cd82424aee5a15484dfa98b9ce670.png',
          images: mockImages('https://images.tcdn.com.br/img/img_prod/782660/camisa_oficial_bgs25_1445_1_ec6cd82424aee5a15484dfa98b9ce670.png')
        },
        { 
          id: 'prod_cup', 
          name: 'Copo Oficial #BGS2026', 
          description: 'Leve, resistente e com design personalizado, um item essencial pra quem vive a BGS e coleciona cada momento.',
          price: 19.00, 
          image: 'https://images.tcdn.com.br/img/img_prod/782660/copo_nova_fase_bgs25_1537_1_93242e2d2e392e8183757efb9345fa61.png',
          images: mockImages('https://images.tcdn.com.br/img/img_prod/782660/copo_nova_fase_bgs25_1537_1_93242e2d2e392e8183757efb9345fa61.png')
        },
        { 
          id: 'prod_kit', 
          name: 'Kit Oficial #BGS2026', 
          description: 'Kit com 1 Camiseta Oficial + 3 Copos + 3 Pares de Meia + 1 Pin + 1 Pôster + 1 Sacochila. E mais: 1 Camiseta Vintage da BGS exclusiva para quem comprar na pré-venda!',
          price: 349.90, 
          image: 'https://images.tcdn.com.br/img/img_prod/782660/copo_nova_fase_bgs25_1537_1_93242e2d2e392e8183757efb9345fa61.png',
          images: mockImages('https://images.tcdn.com.br/img/img_prod/782660/copo_nova_fase_bgs25_1537_1_93242e2d2e392e8183757efb9345fa61.png')
        },
        { 
          id: 'prod_figure', 
          name: 'Boneco Bot_GS - Fandom Box', 
          description: 'O Bot_GS ganhou uma Fandom Box! Cada caixa é uma surpresa: você pode encontrar o Bot_GS na versão Original ou, com 1 chance em 10, desbloquear o Bot_GS Lendário. A versão lendária acompanha 1 ingresso para a BGS 2026.',
          price: 129.90, 
          image: 'https://images.tcdn.com.br/img/img_prod/782660/boneco_bot_gs_robo_bgs_fandom_box_1603_2_98898e24cc6bb03acd3388aa375791fc.png',
          images: mockImages('https://images.tcdn.com.br/img/img_prod/782660/boneco_bot_gs_robo_bgs_fandom_box_1603_2_98898e24cc6bb03acd3388aa375791fc.png')
        },
        { 
          id: 'prod_bag', 
          name: 'Sacochila #BGS2026', 
          description: 'Compacta, leve e pronta pra tudo, perfeita pra levar o essencial e guardar os brindes da BGS.',
          price: 29.90, 
          image: 'https://images.tcdn.com.br/img/img_prod/782660/sacochila_brasil_game_show_1425_1_e5ae6b4f72d4d14b3ca798ba39adaf2d.png',
          images: mockImages('https://images.tcdn.com.br/img/img_prod/782660/sacochila_brasil_game_show_1425_1_e5ae6b4f72d4d14b3ca798ba39adaf2d.png')
        },
        { 
          id: 'prod_strap', 
          name: 'Tirante para Copo', 
          description: 'Mais praticidade ao carregar seu copo na BGS!',
          price: 15.00, 
          image: 'https://images.tcdn.com.br/img/img_prod/782660/tirante_bgs25_1215_1_f6e06822a40c1eefd772e811f12b4d34.png',
          images: mockImages('https://images.tcdn.com.br/img/img_prod/782660/tirante_bgs25_1215_1_f6e06822a40c1eefd772e811f12b4d34.png')
        }
      ]
    };
  }, [scenario.customStartDate, scenario.customEndDate, scenario.unavailableDates, scenario.times]);

  useEffect(() => {
    const dates = derivedData.dates;
    const getFirstValid = () => dates.find(d => !derivedData.soldOutDates.includes(d.getTime()));

    if (dates.length <= 7) {
      if (!activeDate || !dates.some(d => d.getTime() === activeDate.getTime())) {
        setActiveDate(getFirstValid() || dates[0]);
      }
    } else {
      const isActiveValid = activeDate && dates.some(d => d.getTime() === activeDate.getTime());
      if (!isActiveValid) setActiveDate(null);
    }
  }, [derivedData.dates, derivedData.soldOutDates]);

  const handlers = {
    updateTicket: (dayIdx: number, time: string, ticketId: string, delta: number) => {
      const key = `${dayIdx}-${time}-${ticketId}`;
      setTicketSelection(prev => {
        const newVal = Math.max(0, (prev[key] || 0) + delta);
        const next = { ...prev, [key]: newVal };
        if (newVal === 0) delete next[key];
        return next;
      });
    },
    clearTimeTickets: (dayIdx: number, time: string) => {
      setTicketSelection(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (key.startsWith(`${dayIdx}-${time}-`)) delete next[key];
        });
        return next;
      });
    },
    updateProduct: (productId: string, delta: number) => {
      setProductSelection(prev => {
        const newVal = Math.max(0, (prev[productId] || 0) + delta);
        const next = { ...prev, [productId]: newVal };
        if (newVal === 0) delete next[productId];
        return next;
      });
    }
  };

  const totals = useMemo(() => {
    const tTotal = Object.entries(ticketSelection).reduce((acc, [key, qty]) => {
      const price = key.includes('t3') ? 350 : 150;
      return acc + (qty * price);
    }, 0);

    const pTotal = Object.entries(productSelection).reduce((acc, [id, qty]) => {
      const p = derivedData.combos.find(c => c.id === id || id.startsWith(c.id + '-'));
      return acc + (qty * (p?.price || 0));
    }, 0);

    return { grandTotal: tTotal + pTotal, hasTickets: tTotal > 0 };
  }, [ticketSelection, productSelection, derivedData.combos]);

  return { cart: { tickets: ticketSelection, products: productSelection }, activeDate, setActiveDate, derivedData, totals, handlers };
}
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { Button } from './Button';
import { subscribeToOrders, updateOrder, getShopSettings, getLogo } from '../services/storage';
import { printOrder } from '../services/printing';

interface SalesAreaProps {
  isOpen: boolean;
  onClose: () => void;
  onEditItems: (order: Order) => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  orcamento: 'Orçamento',
  realizado: 'Realizado',
  pagamento_pendente: 'Aguard. Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Entregue',
  devolucao: 'Devolução',
  cancelado: 'Cancelado'
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  orcamento: 'bg-gray-100 text-gray-800',
  realizado: 'bg-blue-100 text-blue-800',
  pagamento_pendente: 'bg-yellow-100 text-yellow-800',
  preparacao: 'bg-orange-100 text-orange-800',
  transporte: 'bg-indigo-100 text-indigo-800',
  entregue: 'bg-green-100 text-green-800',
  devolucao: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-800 text-white'
};

export const SalesArea: React.FC<SalesAreaProps> = ({ isOpen, onClose, onEditItems }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [localDiscounts, setLocalDiscounts] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<any>(null); // For print logic
  const [logo, setLogo] = useState('');

  useEffect(() => {
    // Real-time subscription
    const unsubscribe = subscribeToOrders((data) => {
        setOrders(data);
    });
    
    // Load static data for print
    const loadStatic = async () => {
        setSettings(await getShopSettings());
        setLogo(await getLogo());
    };
    loadStatic();

    return () => unsubscribe();
  }, []);

  const handleApplyDiscount = async (order: Order, discountValue: string) => {
    const discount = parseFloat(discountValue.replace(',', '.'));
    if (isNaN(discount)) return;

    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTotal = Math.max(0, subtotal - discount);

    const updated = {
      ...order,
      discount: discount,
      total: newTotal
    };
    await updateOrder(updated);
  };

  const handleDiscountChange = (orderId: string, value: string) => {
    setLocalDiscounts(prev => ({ ...prev, [orderId]: value }));
  };

  const handleDiscountBlur = (order: Order) => {
    const val = localDiscounts[order.id];
    if (val !== undefined && val !== '') {
      handleApplyDiscount(order, val);
    }
  };

  const handlePrint = (order: Order) => {
      // Pass isAdmin = true for SalesArea/Admin
      if (settings) {
          printOrder(order, settings, logo, true);
      }
  };

  // Step 1: Finalizar (Send Invoice & PIX) -> Changes to 'pagamento_pendente'
  const handleFinalizeOrder = async (order: Order) => {
      const updatedOrder = {
          ...order,
          status: 'pagamento_pendente' as OrderStatus,
          history: [...order.history, { status: 'pagamento_pendente' as OrderStatus, timestamp: Date.now() }]
      };
      await updateOrder(updatedOrder);

      const itemsList = order.items.map(i => `• ${i.quantity}x ${i.name} (R$ ${(i.price * i.quantity).toFixed(2)})`).join('\n');
      
      const message = 
`*PEDIDO FINALIZADO #${order.id.slice(-6)}* ✅
------------------------------
*Cliente:* ${order.userName}
------------------------------
*ITENS:*
${itemsList}

*Subtotal:* R$ ${(order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)).toFixed(2)}
*Desconto:* - R$ ${(order.discount || 0).toFixed(2)}
*TOTAL A PAGAR: R$ ${order.total.toFixed(2)}*
------------------------------
*DADOS PARA PAGAMENTO (PIX)* 💠

*Chave:* ${settings?.pixKey || 'Solicite a chave'}
*Nome:* ${settings?.pixName}
*Banco:* ${settings?.pixBank}

_Por favor, envie o comprovante para confirmarmos o pagamento!_`;

      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/55${order.userPhone.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  // Step 2: Preparar (Confirm Payment) -> Changes to 'preparacao'
  const handlePrepareOrder = async (order: Order) => {
      const updatedOrder = {
          ...order,
          status: 'preparacao' as OrderStatus,
          history: [...order.history, { status: 'preparacao' as OrderStatus, timestamp: Date.now() }]
      };
      await updateOrder(updatedOrder);

      const name = order.userName.split(' ')[0];
      const message = `Olá ${name}! 😃\n\nPagamento confirmado com sucesso! ✅\n\nSeu pedido #${order.id.slice(-6)} já está em *PREPARAÇÃO* e em breve será enviado.`;

      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/55${order.userPhone.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') {
      return ['orcamento', 'realizado', 'pagamento_pendente', 'preparacao'].includes(o.status);
    }
    return true;
  });

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-gray-100 z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="bg-white p-5 border-b border-gray-200 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💰</span> Gestão de Vendas
            </h2>
            <p className="text-xs text-gray-500">Fluxo de caixa e pedidos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white border-b border-gray-200 flex gap-2">
          <button 
            onClick={() => setFilter('active')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'active' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Em Aberto
          </button>
          <button 
             onClick={() => setFilter('all')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Todos os Pedidos
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>Nenhum pedido encontrado nesta categoria.</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
              const createdAtDate = new Date(order.createdAt);
              
              // Determine main action button
              let mainAction = null;
              if (order.status === 'orcamento' || order.status === 'realizado') {
                  mainAction = (
                     <button 
                        onClick={() => handleFinalizeOrder(order)}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                       Finalizar
                     </button>
                  );
              } else if (order.status === 'pagamento_pendente') {
                  mainAction = (
                     <button 
                        onClick={() => handlePrepareOrder(order)}
                        className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                       </svg>
                       Preparar Pedido
                     </button>
                  );
              }

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Card Header - READ ONLY STATUS */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{order.userName}</h3>
                      <p className="text-xs text-gray-500">
                        #{order.id.slice(-6)} • {createdAtDate.toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Visual Status Tag (Not clickable) */}
                    <div className={`text-[10px] font-bold uppercase py-1 px-2 rounded ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-600">
                          <span>{item.quantity}x {item.name}</span>
                          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 mb-4">
                       <button 
                         onClick={() => handlePrint(order)}
                         className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                         </svg>
                         Imprimir
                       </button>

                       {(order.status === 'orcamento' || order.status === 'realizado') && (
                           <button 
                             onClick={() => onEditItems(order)}
                             className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                             </svg>
                             Editar Itens
                           </button>
                       )}
                    </div>

                    {/* Financials */}
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Desconto (-)</span>
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-gray-400 text-xs">R$</span>
                          <input 
                            type="number"
                            step="0.01"
                            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-right text-sm outline-none focus:border-orange-500 text-red-500 font-medium"
                            placeholder="0,00"
                            value={localDiscounts[order.id] !== undefined ? localDiscounts[order.id] : (order.discount || '')}
                            onChange={(e) => handleDiscountChange(order.id, e.target.value)}
                            onBlur={() => handleDiscountBlur(order)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                        <span>Total Final</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {mainAction && (
                      <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between gap-2">
                         {mainAction}
                      </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { Button } from './Button';
import { subscribeToOrders, updateOrder, getShopSettings, getLogo } from '../services/storage';
import { PrintPreviewModal } from './PrintPreviewModal';

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
  const [localShippingCosts, setLocalShippingCosts] = useState<Record<string, string>>({});
  
  const [settings, setSettings] = useState<any>(null); 
  const [logo, setLogo] = useState('');

  // Preview Modal State
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
        setOrders(data);
    });
    
    const loadStatic = async () => {
        setSettings(await getShopSettings());
        setLogo(await getLogo());
    };
    loadStatic();

    return () => unsubscribe();
  }, []);

  const calculateTotal = (order: Order, newDiscount?: number, newShipping?: number) => {
      const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const discount = newDiscount !== undefined ? newDiscount : (order.discount || 0);
      const shipping = newShipping !== undefined ? newShipping : (order.shippingCost || 0);
      return Math.max(0, subtotal - discount + shipping);
  };

  const updateOrderTotals = async (order: Order, updates: Partial<Order>) => {
      const updatedTotal = calculateTotal(
          order, 
          updates.discount, 
          updates.shippingCost
      );
      
      const updatedOrder = {
          ...order,
          ...updates,
          total: updatedTotal
      };
      await updateOrder(updatedOrder);
  };

  // Handlers for Discount
  const handleDiscountChange = (orderId: string, value: string) => {
    setLocalDiscounts(prev => ({ ...prev, [orderId]: value }));
  };
  const handleDiscountBlur = (order: Order) => {
    const val = localDiscounts[order.id];
    if (val !== undefined && val !== '') {
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num)) updateOrderTotals(order, { discount: num });
    }
  };

  // Handlers for Shipping Cost
  const handleShippingCostChange = (orderId: string, value: string) => {
    setLocalShippingCosts(prev => ({ ...prev, [orderId]: value }));
  };
  const handleShippingCostBlur = (order: Order) => {
    const val = localShippingCosts[order.id];
    if (val !== undefined && val !== '') {
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num)) updateOrderTotals(order, { shippingCost: num });
    }
  };

  // Handler for Shipping Method
  const handleShippingMethodChange = async (order: Order, method: string) => {
      await updateOrderTotals(order, { shippingMethod: method });
  };

  // Handler for Status Change
  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
      await updateOrder({
          ...order,
          status: newStatus,
          history: [...order.history, { status: newStatus, timestamp: Date.now() }]
      });
  };

  const handleSendUpdate = (order: Order) => {
      const name = order.userName.split(' ')[0];
      const itemsList = order.items.map(i => `• ${i.quantity}x ${i.name}`).join('\n');
      let message = '';

      switch (order.status) {
          case 'orcamento':
              message = `Olá ${name}! 👋\nRecebemos seu orçamento. Aguarde, em breve confirmaremos a disponibilidade e valores.`;
              break;
          case 'pagamento_pendente':
              message = `*PEDIDO FINALIZADO #${order.id.slice(-6)}* ✅\n------------------------------\n*ITENS:*\n${itemsList}\n\n*Total a Pagar:* R$ ${order.total.toFixed(2)}\n\n*DADOS PIX:*\nChave: ${settings?.pixKey || 'Solicite'}\nNome: ${settings?.pixName}\nBanco: ${settings?.pixBank}\n\nEnvie o comprovante para confirmar!`;
              break;
          case 'preparacao':
              message = `Pagamento Confirmado! ✅\n\nOlá ${name}, seu pedido #${order.id.slice(-6)} já está em separação e embalagem.`;
              break;
          case 'transporte':
              message = `Saiu para Entrega/Envio! 🚚\n\nOlá ${name}, seu pedido #${order.id.slice(-6)} está a caminho.\n${order.trackingCode ? `Rastreio: ${order.trackingCode}` : ''}`;
              break;
          case 'entregue':
              message = `Pedido Entregue! 🎁\n\nOlá ${name}, consta que seu pedido foi entregue. Esperamos que tenha gostado!\nSe puder, mande uma foto do produto recebido.`;
              break;
          default:
              message = `Atualização do Pedido #${order.id.slice(-6)}: Novo status: *${STATUS_LABELS[order.status]}*.`;
      }

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
              <p>Nenhum pedido encontrado.</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
              const createdAtDate = new Date(order.createdAt);
              
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{order.userName}</h3>
                      <p className="text-xs text-gray-500">
                        #{order.id.slice(-6)} • {createdAtDate.toLocaleDateString()}
                      </p>
                      {(order.userCity || order.userCep) && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {order.userCity} {order.userCep}
                          </p>
                      )}
                    </div>
                    
                    {/* Status Dropdown */}
                    <div className="flex flex-col items-end gap-1">
                        <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                            className={`text-[10px] font-bold uppercase py-1 px-2 rounded border-none outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
                        >
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => handleSendUpdate(order)}
                            className="text-[10px] text-green-600 hover:text-green-800 font-bold flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Enviar Atualização
                        </button>
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
                         onClick={() => setPreviewOrder(order)}
                         className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                         </svg>
                         Imprimir
                       </button>

                       {(order.status === 'orcamento' || order.status === 'realizado') && (
                           <button 
                             onClick={() => onEditItems(order)}
                             className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                             </svg>
                             Editar Itens
                           </button>
                       )}
                    </div>

                    {/* Financials & Shipping Controls */}
                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                      </div>
                      
                      {/* Discount Input */}
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

                      {/* Shipping Controls */}
                      <div className="border-t border-gray-200 pt-2 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Forma de Envio</span>
                            <select 
                                value={order.shippingMethod || ''}
                                onChange={(e) => handleShippingMethodChange(order, e.target.value)}
                                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 w-32"
                            >
                                <option value="">Selecione...</option>
                                <option value="Motoboy">Motoboy</option>
                                <option value="Correios">Correios</option>
                                <option value="Transportadora">Transportadora</option>
                                <option value="Retirada">Retirada</option>
                            </select>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Frete (+)</span>
                            <div className="flex items-center gap-1 w-24">
                              <span className="text-gray-400 text-xs">R$</span>
                              <input 
                                type="number"
                                step="0.01"
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-right text-sm outline-none focus:border-indigo-500 text-indigo-600 font-medium"
                                placeholder="0,00"
                                value={localShippingCosts[order.id] !== undefined ? localShippingCosts[order.id] : (order.shippingCost || '')}
                                onChange={(e) => handleShippingCostChange(order.id, e.target.value)}
                                onBlur={() => handleShippingCostBlur(order)}
                              />
                            </div>
                          </div>
                      </div>

                      <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                        <span>Total Final</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Print Preview Modal */}
      <PrintPreviewModal 
        isOpen={!!previewOrder}
        onClose={() => setPreviewOrder(null)}
        order={previewOrder}
        settings={settings}
        logo={logo}
      />
    </>
  );
};
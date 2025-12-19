import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User } from '../types';
import { getOrders, getShopSettings, getLogo } from '../services/storage';
import { PrintPreviewModal } from './PrintPreviewModal';

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null; 
  type?: 'client' | 'vendor'; 
  onSelectOrder?: (orderId: string) => void; 
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  orcamento: 'Pedidos em aberto',
  realizado: 'Aprovado / Finalizado',
  pagamento_pendente: 'Aguardando Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Concluídos',
  devolucao: 'Devolução',
  cancelado: 'Cancelado'
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  orcamento: 'bg-gray-100 text-gray-600 border-gray-200',
  realizado: 'bg-blue-50 text-blue-700 border-blue-200',
  pagamento_pendente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  preparacao: 'bg-orange-50 text-orange-700 border-orange-200', 
  transporte: 'bg-purple-50 text-purple-700 border-purple-200',
  entregue: 'bg-green-50 text-green-700 border-green-200',
  devolucao: 'bg-red-50 text-red-700 border-red-200',
  cancelado: 'bg-gray-50 text-gray-500 border-gray-200'
};

export const UserOrdersModal: React.FC<UserOrdersModalProps> = ({ isOpen, onClose, user, type = 'client', onSelectOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [logo, setLogo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (isOpen && user) {
        const all = await getOrders(); // Async fetch
        
        let filteredOrders: Order[] = [];
        if (type === 'vendor') {
            filteredOrders = all.filter(o => o.sellerId === user.id);
        } else {
            filteredOrders = all.filter(o => o.userId === user.id);
        }
        
        filteredOrders.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(filteredOrders);
        
        setSettings(await getShopSettings());
        setLogo(await getLogo());
      }
    };
    loadData();
  }, [isOpen, user, type]);

  const handlePrint = (order: Order) => {
    setPreviewOrder(order);
  };

  const handleManage = (orderId: string) => {
      if (onSelectOrder) {
          onSelectOrder(orderId);
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-800">
                        {type === 'vendor' ? 'Minhas Vendas' : 'Meus Pedidos'}
                    </h2>
                    <p className="text-xs text-gray-500">Acompanhe o status das suas compras</p>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>

          {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-lg font-medium">Você ainda não fez nenhum pedido.</p>
              </div>
          ) : (
              <div className="space-y-6">
                  {orders.map(order => {
                      const date = new Date(order.createdAt);
                      const showPrint = order.status !== 'orcamento';

                      return (
                          <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                               <div className="bg-gray-50 px-5 py-3 flex justify-between items-start border-b border-gray-100">
                                  <div className="flex flex-col">
                                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pedido #{order.id}</span>
                                      <span className="text-xs font-medium text-gray-800 mt-1 flex items-center gap-2">
                                          📅 {date.toLocaleDateString()}
                                          <span className="text-gray-300">|</span>
                                          ⏰ {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                  </div>
                                  <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                                      {STATUS_LABELS[order.status]}
                                  </span>
                               </div>
                               
                               <div className="p-5">
                                  {/* Tracking Info for Clients */}
                                  {order.trackingCode && (
                                      <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-fade-in">
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className="text-lg">🚚</span>
                                              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Acompanhe seu pedido</p>
                                          </div>
                                          <div className="flex items-center justify-between gap-2">
                                              <span className="text-sm font-medium text-gray-700 truncate flex-1 bg-white px-2 py-1.5 rounded border border-indigo-200">
                                                  {order.trackingCode}
                                              </span>
                                              {order.trackingCode.startsWith('http') ? (
                                                  <a 
                                                    href={order.trackingCode} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-md transition-colors"
                                                  >
                                                      Abrir Link
                                                  </a>
                                              ) : (
                                                  <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(order.trackingCode!);
                                                        alert('Código copiado para a área de transferência!');
                                                    }}
                                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded transition-colors border border-indigo-300"
                                                  >
                                                      Copiar Código
                                                  </button>
                                              )}
                                          </div>
                                      </div>
                                  )}

                                  <div className="flex flex-col gap-3 mb-4">
                                      {order.items.map((item, i) => (
                                          <div key={i} className="flex flex-col border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="text-[8px] text-gray-400">IMG</span>}
                                                  </div>
                                                  <div className="flex-grow">
                                                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                                                      <p className="text-xs text-gray-500">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                                                  </div>
                                                  <div className="text-right">
                                                      <span className="font-bold text-gray-700 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                  </div>
                                              </div>
                                              {item.note && (
                                                <div className="mt-1 ml-16 text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                                  Detalhes: {item.note}
                                                </div>
                                              )}
                                          </div>
                                      ))}
                                  </div>

                                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                      <div className="text-sm text-gray-500">
                                          Total do Pedido: <span className="text-xl font-extrabold text-gray-900 ml-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                          {showPrint && (
                                              <button 
                                                onClick={() => handlePrint(order)}
                                                className="text-gray-600 hover:text-gray-900 text-xs font-bold flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                Imprimir
                                              </button>
                                          )}

                                          {onSelectOrder && (
                                              <button 
                                                  onClick={() => handleManage(order.id)}
                                                  className="text-white bg-zinc-900 hover:bg-zinc-700 text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-colors"
                                              >
                                                  Gerenciar
                                              </button>
                                          )}
                                      </div>
                                  </div>
                               </div>
                          </div>
                      );
                  })}
              </div>
          )}
        </div>
      </div>
      
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

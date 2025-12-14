import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User } from '../types';
import { getOrders, getShopSettings, getLogo } from '../services/storage';
import { PrintPreviewModal } from './PrintPreviewModal';

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null; // Changed prop name from currentUser to user to be generic
  type?: 'client' | 'vendor'; // New prop to distinguish filter logic
  onSelectOrder?: (orderId: string) => void; // Callback to go to order in admin panel
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Finalizado',
  pagamento_pendente: 'Aguardando Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Entregue',
  devolucao: 'Devolução',
  cancelado: 'Cancelado'
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  orcamento: 'bg-gray-100 text-gray-700',
  realizado: 'bg-blue-100 text-blue-700',
  pagamento_pendente: 'bg-yellow-100 text-yellow-700',
  preparacao: 'bg-orange-100 text-orange-700', 
  transporte: 'bg-indigo-100 text-indigo-700',
  entregue: 'bg-green-100 text-green-700',
  devolucao: 'bg-red-100 text-red-700',
  cancelado: 'bg-gray-800 text-white'
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
            // Filter by sellerId if viewing as vendor sales
            filteredOrders = all.filter(o => o.sellerId === user.id);
        } else {
            // Filter by userId if viewing as client purchases
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
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h2 className="text-xl font-bold text-gray-800">
                      {type === 'vendor' ? 'Vendas Realizadas' : 'Histórico de Pedidos'}
                  </h2>
                  <p className="text-sm text-gray-500">{user?.name}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>

          {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum registro encontrado para este usuário.</p>
          ) : (
              <div className="space-y-4">
                  {orders.map(order => {
                      const date = new Date(order.createdAt);
                      return (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition-colors">
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${STATUS_COLORS[order.status]}`}>
                                          {STATUS_LABELS[order.status]}
                                      </span>
                                      <p className="text-xs text-gray-400 mt-1">
                                          {date.toLocaleDateString()} às {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-gray-800">
                                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                                      </p>
                                      <p className="text-[10px] text-gray-400">#{order.id.slice(-4)}</p>
                                  </div>
                               </div>
                               
                               <div className="mt-3 pt-3 border-t border-gray-50">
                                  <ul className="text-xs text-gray-600 space-y-1">
                                      {order.items.slice(0, 3).map((item, i) => (
                                          <li key={i} className="flex justify-between">
                                              <span>{item.quantity}x {item.name}</span>
                                              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                          </li>
                                      ))}
                                      {order.items.length > 3 && (
                                          <li className="text-gray-400 italic text-[10px]">+ {order.items.length - 3} itens...</li>
                                      )}
                                  </ul>
                               </div>

                               <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                                  <button 
                                     onClick={() => handlePrint(order)}
                                     className="text-gray-500 hover:text-gray-900 text-xs flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full transition-colors"
                                  >
                                     📄 Imprimir
                                  </button>

                                  {onSelectOrder && (
                                      <button 
                                          onClick={() => handleManage(order.id)}
                                          className="text-white bg-orange-600 hover:bg-orange-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1"
                                      >
                                          Gerenciar Pedido
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                      </button>
                                  )}
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
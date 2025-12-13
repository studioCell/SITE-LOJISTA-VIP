import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User } from '../types';
import { getOrders, getShopSettings, getLogo } from '../services/storage';
import { printOrder } from '../services/printing';

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Realizado',
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

export const UserOrdersModal: React.FC<UserOrdersModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (isOpen && currentUser) {
        const all = await getOrders(); // Async fetch
        const myOrders = all.filter(o => o.userId === currentUser.id).sort((a, b) => b.createdAt - a.createdAt);
        setOrders(myOrders);
      }
    };
    loadData();
  }, [isOpen, currentUser]);

  const handlePrint = async (order: Order) => {
    const settings = await getShopSettings();
    const logo = await getLogo();
    // Pass isAdmin = false for User
    printOrder(order, settings, logo, false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Meus Pedidos</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Você ainda não realizou nenhum pedido.</p>
        ) : (
            <div className="space-y-4">
                {orders.map(order => {
                    const date = new Date(order.createdAt);
                    return (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
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
                                    <p className="text-[10px] text-gray-400">Pedido #{order.id.slice(-4)}</p>
                                </div>
                             </div>
                             
                             <div className="mt-3 pt-3 border-t border-gray-50">
                                <ul className="text-xs text-gray-600 space-y-1">
                                    {order.items.map((item, i) => (
                                        <li key={i} className="flex justify-between">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                             </div>

                             <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                                {order.trackingCode ? (
                                    <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-800 font-medium">
                                        Rastreio: {order.trackingCode}
                                    </div>
                                ) : <div></div>}

                                <button 
                                   onClick={() => handlePrint(order)}
                                   className="text-gray-500 hover:text-gray-900 text-xs flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full transition-colors"
                                >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                   </svg>
                                   Imprimir
                                </button>
                             </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};
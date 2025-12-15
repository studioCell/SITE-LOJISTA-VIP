import React, { useMemo } from 'react';
import { Order } from '../types';

interface AdminWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const AdminWelcomeModal: React.FC<AdminWelcomeModalProps> = ({ isOpen, onClose, orders }) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    // Filtros de Status
    const newOrders = orders.filter(o => o.status === 'orcamento').length;
    const pendingPayment = orders.filter(o => o.status === 'pagamento_pendente').length;
    const inPrep = orders.filter(o => o.status === 'preparacao').length;
    const inTransit = orders.filter(o => o.status === 'transporte').length;

    // Vendas do Dia (Considerando pedidos pagos/em andamento criados hoje)
    const paidStatuses = ['realizado', 'preparacao', 'transporte', 'entregue'];
    const salesTodayOrders = orders.filter(o => 
        o.createdAt >= todayStart && paidStatuses.includes(o.status)
    );
    const salesTodayValue = salesTodayOrders.reduce((acc, o) => acc + o.total, 0);
    const salesTodayCount = salesTodayOrders.length;

    return {
      newOrders,
      pendingPayment,
      inPrep,
      inTransit,
      salesTodayValue,
      salesTodayCount
    };
  }, [orders]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-up">
        
        {/* Left Side - Banner */}
        <div className="md:w-1/3 bg-gradient-to-br from-orange-600 to-red-700 p-8 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
            </div>
            
            <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Bom dia!</h2>
                <p className="text-orange-100 text-sm">Confira o resumo da sua operação hoje.</p>
            </div>

            <div className="relative z-10 mt-8">
                <div className="text-5xl font-extrabold mb-1">
                    {stats.salesTodayCount}
                </div>
                <p className="font-bold text-orange-200 uppercase text-xs tracking-wider">Vendas Hoje</p>
            </div>
        </div>

        {/* Right Side - Stats Grid */}
        <div className="md:w-2/3 p-8 bg-zinc-900">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📊</span> Resumo Gerencial
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Card 1: Faturamento Hoje */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Faturamento (Hoje)</p>
                    <p className="text-2xl font-bold text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.salesTodayValue)}
                    </p>
                </div>

                {/* Card 2: Novos Pedidos */}
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-4xl">🆕</span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Novos Pedidos</p>
                    <p className="text-2xl font-bold text-white">{stats.newOrders}</p>
                    <p className="text-[10px] text-gray-500">Aguardando aprovação</p>
                </div>

                {/* Card 3: Operacional */}
                <div className="col-span-2 bg-zinc-800 p-4 rounded-xl border border-zinc-700 grid grid-cols-3 divide-x divide-zinc-700 text-center">
                    <div>
                        <p className="text-xl font-bold text-yellow-400">{stats.pendingPayment}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Aguard. Pagto</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-orange-400">{stats.inPrep}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Em Preparação</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-blue-400">{stats.inTransit}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Em Trânsito</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                >
                    Acessar Painel de Vendas
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
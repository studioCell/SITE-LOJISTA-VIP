import React from 'react';
import { Order } from '../types';

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenMyOrders: () => void;
    order: Order | null;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ isOpen, onClose, onOpenMyOrders, order }) => {
  if (!isOpen) return null;

  const handleSendWhatsapp = () => {
      if (!order) return;
      const itemsList = order.items.map(i => `${i.quantity}x ${i.name}`).join('\n');
      const adminPhone = "5562992973853";
      const message = 
`🔔 *NOVO PEDIDO REALIZADO!*
--------------------------------
🆔 *Pedido:* #${order.id.slice(-6)}
👤 *Cliente:* ${order.userName}
💰 *Total:* R$ ${order.total.toFixed(2)}

📦 *Itens:*
${itemsList}

📍 *Destino:* ${order.userCity || 'N/A'}

Estou aguardando a confirmação!`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminPhone}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-scale-up max-w-sm w-full border border-gray-100 relative overflow-hidden">
        
        {/* Confetti Background Effect (CSS only) */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
            <div className="absolute top-10 left-10 text-4xl">🎉</div>
            <div className="absolute top-20 right-10 text-3xl">✨</div>
            <div className="absolute bottom-10 left-20 text-3xl">🛍️</div>
        </div>

        {/* Crown Icon */}
        <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                 <span className="text-2xl">👑</span>
            </div>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-2">Parabéns!</h2>
        <p className="text-orange-600 font-bold uppercase text-xs tracking-widest mb-4">Pedido Realizado com Sucesso</p>
        
        <div className="bg-gray-50 rounded-xl p-4 text-center mb-6 w-full border border-gray-100">
            <p className="text-gray-600 text-sm leading-relaxed">
                Seu pedido foi registrado no sistema. <br/>
                <span className="font-bold text-gray-800">Se o WhatsApp não abriu, clique abaixo para enviar o comprovante.</span>
            </p>
        </div>

        {/* WhatsApp Backup Button */}
        <button 
            onClick={handleSendWhatsapp}
            className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-600 transition-transform active:scale-95 flex items-center justify-center gap-2 mb-3"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Enviar no WhatsApp
        </button>

        <button 
            onClick={onOpenMyOrders}
            className="w-full bg-zinc-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-zinc-800 transition-transform active:scale-95 flex items-center justify-center gap-2 mb-3"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Acompanhar em Meus Pedidos
        </button>

        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-medium">
            Voltar para a Loja
        </button>

      </div>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};
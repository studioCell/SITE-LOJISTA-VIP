import React from 'react';
import { CartItem } from '../types';
import { Button } from './Button';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onCheckout: () => void;
  onOpenMyOrders?: () => void; // New prop
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onUpdateQty,
  onCheckout,
  onOpenMyOrders
}) => {
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const MIN_ORDER_VALUE = 20.00;
  const canCheckout = total >= MIN_ORDER_VALUE;

  const getItemWarning = (item: CartItem) => {
    if (item.price < 10 && item.quantity < 5) {
      return `Sugestão: 5 un. (R$ < 10)`;
    }
    if (item.price >= 10 && item.price < 20 && item.quantity < 3) {
      return `Sugestão: 3 un. (R$ < 20)`;
    }
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Seu Carrinho
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* My Orders Button */}
        {onOpenMyOrders && (
            <div className="px-5 py-3 bg-white border-b border-gray-100">
                <button 
                    onClick={onOpenMyOrders}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Ver Meus Pedidos
                </button>
            </div>
        )}

        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
              <Button variant="outline" onClick={onClose}>Começar a comprar</Button>
            </div>
          ) : (
            items.map(item => {
              const warning = getItemWarning(item);
              return (
                <div key={item.id} className="relative flex gap-4 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                     {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                     )}
                  </div>
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-1" title={item.name}>{item.name}</h3>
                      <p className="text-orange-600 font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </p>
                      {warning && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 inline-block px-1 rounded border border-amber-100">
                          ⚠️ {warning}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">-</button>
                        <span className="px-2 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">+</button>
                      </div>
                      <button onClick={() => onRemove(item.id)} className="text-xs text-red-500 hover:text-red-700 underline ml-2">
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 bg-gray-50 border-t border-gray-200">
            {!canCheckout && (
               <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs font-medium border border-red-100">
                 ⚠️ O valor mínimo do pedido para finalizar é de R$ 20,00. Adicione mais itens.
               </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Subtotal</span>
              <span className={`text-xl font-bold ${canCheckout ? 'text-gray-900' : 'text-red-500'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
            <Button 
              onClick={onCheckout} 
              disabled={!canCheckout}
              className={`w-full !py-3 !text-lg shadow-xl ${!canCheckout ? 'opacity-50 cursor-not-allowed' : 'shadow-orange-500/20 !bg-orange-600 hover:!bg-orange-700'}`}
            >
              {canCheckout ? 'Finalizar Pedido via WhatsApp' : `Faltam R$ ${(20 - total).toFixed(2)}`}
            </Button>
            <p className="text-xs text-center text-gray-400 mt-3">
              O pedido será enviado diretamente para nosso WhatsApp.
            </p>
          </div>
        )}
      </div>
    </>
  );
};
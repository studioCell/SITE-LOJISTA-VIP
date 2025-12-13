import React from 'react';
import { User, Category } from '../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string | null) => void;
  onOpenPolicy: (type: 'about' | 'shipping' | 'warranty' | 'fees') => void;
  onContact: () => void;
  onLogout: () => void;
  currentUser: User | null;
  categories: Category[];
  logo?: string;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onSelectCategory,
  onOpenPolicy,
  onContact,
  onLogout,
  currentUser,
  categories,
  logo
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-[80%] max-w-[300px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex items-center justify-between border-b border-orange-500/30">
           <div className="flex items-center gap-3">
             {logo && <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white" />}
             <div>
               <h2 className="text-xl font-bold">Lojista VIP</h2>
               <p className="text-xs text-gray-400 opacity-80">Menu Principal</p>
             </div>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <div className="flex-grow overflow-y-auto py-4 flex flex-col">
          
          <button 
            onClick={() => {
              onSelectCategory(null);
              onClose();
            }}
            className="w-full px-5 py-3 text-left text-gray-800 hover:bg-orange-50 hover:text-orange-600 font-bold flex items-center gap-2 border-b border-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Voltar a Página Inicial
          </button>

          <div className="px-5 mb-2 mt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categorias</h3>
          </div>
          <div className="flex flex-col">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.name);
                  onClose();
                }}
                className="px-5 py-3 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-700 hover:border-r-4 border-orange-600 transition-all text-sm font-medium"
              >
                {cat.name}
              </button>
            ))}
            {categories.length === 0 && <p className="px-5 text-sm text-gray-400 italic">Nenhuma categoria.</p>}
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
             <div className="px-5 mb-2">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Informações</h3>
             </div>
             <div className="flex flex-col space-y-1">
               <button onClick={() => { onOpenPolicy('about'); onClose(); }} className="px-5 py-2 text-left text-gray-600 hover:text-orange-600 text-sm flex items-center gap-3">
                 <span className="w-5 text-center">🏢</span> Sobre Nós
               </button>
               <button onClick={onContact} className="px-5 py-2 text-left text-gray-600 hover:text-orange-600 text-sm flex items-center gap-3">
                 <span className="w-5 text-center">💬</span> Fale Conosco
               </button>
               <button onClick={() => { onOpenPolicy('shipping'); onClose(); }} className="px-5 py-2 text-left text-gray-600 hover:text-orange-600 text-sm flex items-center gap-3">
                 <span className="w-5 text-center">🚚</span> Política de Envio
               </button>
               <button onClick={() => { onOpenPolicy('warranty'); onClose(); }} className="px-5 py-2 text-left text-gray-600 hover:text-orange-600 text-sm flex items-center gap-3">
                 <span className="w-5 text-center">🛡️</span> Política de Garantia
               </button>
               <button onClick={() => { onOpenPolicy('fees'); onClose(); }} className="px-5 py-2 text-left text-gray-600 hover:text-orange-600 text-sm flex items-center gap-3">
                 <span className="w-5 text-center">💰</span> Taxas e Pagamentos
               </button>
             </div>
          </div>
          
          {currentUser && (
            <div className="mt-auto pt-4 pb-2 border-t border-gray-100">
               <button 
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full px-5 py-3 text-left text-red-600 hover:bg-red-50 font-bold flex items-center gap-3 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 Sair da Conta
               </button>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
          Lojista VIP App v1.4
        </div>
      </div>
    </>
  );
};
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMenuClick: () => void;
  onAdminClick: () => void;
  onProfileClick: () => void;
  onMyOrdersClick: () => void;
  logo: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  onCartClick, 
  currentUser, 
  onLoginClick,
  onLogoutClick,
  onMenuClick,
  onAdminClick,
  onProfileClick,
  onMyOrdersClick,
  logo
}) => {
  return (
    <header className="sticky top-0 z-50 bg-zinc-900 shadow-lg border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Area - Triggers Menu */}
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={onMenuClick}>
            {logo ? (
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain mr-3 bg-white" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg shadow-orange-500/20">
                LV
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white leading-tight">Lojista Vip</h1>
              <p className="text-xs text-gray-400">Toque para ver categorias</p>
            </div>
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {currentUser ? (
               <div className="flex items-center gap-2 sm:gap-3">
                 <button 
                    onClick={onMyOrdersClick}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors border border-zinc-700"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Meus Pedidos
                 </button>

                 <div className="flex flex-col items-end">
                   <button 
                    onClick={onProfileClick}
                    className="text-sm font-bold text-white leading-tight hover:text-orange-400 transition-colors flex items-center gap-1"
                   >
                     {currentUser.name.split(' ')[0]}
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </button>
                   {(currentUser.isAdmin || currentUser.isVendor) && (
                     <button 
                        onClick={onAdminClick}
                        className="text-[10px] text-orange-400 font-bold hover:underline uppercase"
                      >
                        {currentUser.isAdmin ? 'Painel Admin' : 'Painel Vendedor'}
                     </button>
                   )}
                 </div>
                 
                 <button 
                   onClick={onLogoutClick} 
                   className="p-2 text-gray-400 hover:text-red-500 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                   title="Sair da conta"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                   </svg>
                 </button>
               </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="text-sm font-bold text-orange-500 hover:text-orange-400 bg-zinc-800 px-3 py-1.5 rounded border border-zinc-700"
              >
                Entrar
              </button>
            )}

            <button 
              onClick={onCartClick}
              className="relative p-2 text-gray-300 hover:text-orange-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
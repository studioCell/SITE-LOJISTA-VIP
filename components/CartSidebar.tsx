import React, { useState, useEffect } from 'react';
import { CartItem, User } from '../types';
import { Button } from './Button';
import { getUsers, fetchAddressByCep } from '../services/storage';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onCheckout: (
      extras: { wantsInvoice: boolean; wantsInsurance: boolean }, 
      customerData?: { user: User, address: any } 
  ) => void;
  onOpenMyOrders?: () => void;
  isAdmin?: boolean;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onUpdateQty,
  onCheckout,
  onOpenMyOrders,
  isAdmin = false
}) => {
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [wantsInsurance, setWantsInsurance] = useState(false);

  // Admin State
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Address State
  const [addressForm, setAddressForm] = useState({
      cep: '',
      street: '',
      number: '',
      district: '',
      city: ''
  });
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Load users once if admin opens search
  useEffect(() => {
      if (isAdmin && isSearchingClient && users.length === 0) {
          const load = async () => {
              const data = await getUsers();
              setUsers(data.filter(u => !u.isAdmin));
          };
          load();
      }
  }, [isAdmin, isSearchingClient]);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const invoiceFee = wantsInvoice ? subtotal * 0.06 : 0;
  const insuranceFee = wantsInsurance ? subtotal * 0.03 : 0;
  const total = subtotal + invoiceFee + insuranceFee;

  const MIN_ORDER_VALUE = 20.00;
  // If Admin, ignore min order value or keep it? Let's keep logic simple, Admin usually overrides but lets keep standard for now.
  const canCheckout = total >= MIN_ORDER_VALUE;

  const handleCheckoutClick = () => {
    if (isAdmin && selectedUser) {
        onCheckout(
            { wantsInvoice, wantsInsurance },
            { user: selectedUser, address: addressForm }
        );
    } else {
        onCheckout({ wantsInvoice, wantsInsurance });
    }
  };

  const handleSelectUser = (user: User) => {
      setSelectedUser(user);
      setIsSearchingClient(false);
      // Auto-fill address from user profile if available
      setAddressForm({
          cep: user.cep || '',
          street: '', // User profile usually only has city/cep in simplified User type, but we fill what we can
          number: '',
          district: '',
          city: user.city || ''
      });
      // If we have CEP, try to fetch street/district automatically to help admin
      if (user.cep) {
          handleCepBlurInternal(user.cep);
      }
  };

  const handleCepBlurInternal = async (cepValue: string) => {
      const raw = cepValue.replace(/\D/g, '');
      if (raw.length === 8) {
          setLoadingAddress(true);
          // Note: fetchAddressByCep in storage only returns City name in current implementation
          // Ideally we would fetch full address, but let's use what we have or fetch city at least
          const city = await fetchAddressByCep(raw);
          setLoadingAddress(false);
          if (city) {
              setAddressForm(prev => ({ ...prev, city }));
          }
      }
  };

  const getItemWarning = (item: CartItem) => {
    if (item.price < 10 && item.quantity < 5) {
      return `Sugestão: 5 un. (R$ < 10)`;
    }
    if (item.price >= 10 && item.price < 20 && item.quantity < 3) {
      return `Sugestão: 3 un. (R$ < 20)`;
    }
    return null;
  };

  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.phone && u.phone.includes(searchTerm))
  );

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {isAdmin ? 'Carrinho (Modo ADM)' : 'Seu Carrinho'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {onOpenMyOrders && !isAdmin && (
            <div className="px-5 py-3 bg-white border-b border-gray-100">
                <button 
                    onClick={onOpenMyOrders}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
                >
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
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                     {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-xs text-gray-400">IMG</span>
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
            
            {/* Continue Shopping Button */}
            <button 
                onClick={onClose}
                className="w-full mb-3 text-sm font-bold text-orange-600 hover:text-orange-800 hover:bg-orange-50 py-2 rounded-lg transition-colors border border-transparent hover:border-orange-200"
            >
                ← Continuar Comprando
            </button>

            {/* ADMIN SECTION: Select Client & Address */}
            {isAdmin && (
                <div className="mb-6 bg-white border border-orange-200 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-orange-800 uppercase">👤 Cliente do Pedido</h3>
                        {!isSearchingClient && !selectedUser && (
                            <button 
                                onClick={() => setIsSearchingClient(true)}
                                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 font-bold flex items-center gap-1"
                            >
                                🔍 Buscar
                            </button>
                        )}
                        {selectedUser && (
                            <button onClick={() => setSelectedUser(null)} className="text-xs text-red-500 underline">Alterar</button>
                        )}
                    </div>

                    {!selectedUser ? (
                        isSearchingClient ? (
                            <div className="animate-fade-in">
                                <input 
                                    autoFocus
                                    className="w-full border border-gray-300 rounded p-2 text-sm mb-2 outline-none focus:border-orange-500"
                                    placeholder="Nome ou Telefone..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <div className="max-h-32 overflow-y-auto border border-gray-100 rounded bg-gray-50">
                                    {filteredUsers.map(u => (
                                        <div 
                                            key={u.id} 
                                            onClick={() => handleSelectUser(u)}
                                            className="p-2 text-xs hover:bg-orange-100 cursor-pointer border-b border-gray-100 last:border-0"
                                        >
                                            <p className="font-bold">{u.name}</p>
                                            <p className="text-gray-500">{u.phone} - {u.city}</p>
                                        </div>
                                    ))}
                                    {filteredUsers.length === 0 && <p className="p-2 text-xs text-gray-400">Nenhum encontrado.</p>}
                                </div>
                                <button onClick={() => setIsSearchingClient(false)} className="text-xs text-gray-500 mt-1 w-full text-center">Cancelar Busca</button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Nenhum cliente selecionado.</p>
                        )
                    ) : (
                        <div className="mb-3">
                            <p className="font-bold text-gray-800 text-sm">{selectedUser.name}</p>
                            <p className="text-xs text-gray-500">{selectedUser.phone}</p>
                        </div>
                    )}

                    {/* Address Form for Admin */}
                    {selectedUser && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-600 uppercase mb-2">📍 Endereço de Entrega</h3>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="CEP" 
                                        className="w-1/3 border border-gray-300 p-1.5 text-xs rounded outline-none focus:border-orange-500"
                                        value={addressForm.cep}
                                        onChange={e => setAddressForm({...addressForm, cep: e.target.value})}
                                        onBlur={() => handleCepBlurInternal(addressForm.cep)}
                                    />
                                    <input 
                                        placeholder="Cidade" 
                                        className="w-2/3 border border-gray-300 p-1.5 text-xs rounded bg-gray-50"
                                        value={addressForm.city}
                                        readOnly
                                    />
                                </div>
                                <input 
                                    placeholder="Rua / Logradouro" 
                                    className="w-full border border-gray-300 p-1.5 text-xs rounded outline-none focus:border-orange-500"
                                    value={addressForm.street}
                                    onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                                />
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="Número" 
                                        className="w-1/3 border border-gray-300 p-1.5 text-xs rounded outline-none focus:border-orange-500"
                                        value={addressForm.number}
                                        onChange={e => setAddressForm({...addressForm, number: e.target.value})}
                                    />
                                    <input 
                                        placeholder="Bairro" 
                                        className="w-2/3 border border-gray-300 p-1.5 text-xs rounded outline-none focus:border-orange-500"
                                        value={addressForm.district}
                                        onChange={e => setAddressForm({...addressForm, district: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Options */}
            <div className="space-y-3 mb-4">
                <label className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-orange-300 transition-colors">
                    <span className="text-sm text-gray-700 font-medium flex items-center gap-2">
                        📄 Adicionar Nota Fiscal
                    </span>
                    <input 
                        type="checkbox" 
                        checked={wantsInvoice}
                        onChange={(e) => setWantsInvoice(e.target.checked)}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                </label>
                <label className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-orange-300 transition-colors">
                    <span className="text-sm text-gray-700 font-medium flex items-center gap-2">
                        🛡️ Adicionar Seguro
                    </span>
                    <input 
                        type="checkbox" 
                        checked={wantsInsurance}
                        onChange={(e) => setWantsInsurance(e.target.checked)}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                </label>
            </div>

            {!canCheckout && (
               <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs font-medium border border-red-100">
                 ⚠️ O valor mínimo do pedido para finalizar é de R$ 20,00. Adicione mais itens.
               </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total Estimado</span>
              <span className={`text-xl font-bold ${canCheckout ? 'text-gray-900' : 'text-red-500'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
            
            {isAdmin && !selectedUser && (
                <p className="text-xs text-center text-red-500 font-bold mb-2">⚠️ Selecione um cliente acima para finalizar como ADM.</p>
            )}

            <Button 
              onClick={handleCheckoutClick} 
              disabled={!canCheckout || (isAdmin && !selectedUser)}
              className={`w-full !py-3 !text-lg shadow-xl ${(!canCheckout || (isAdmin && !selectedUser)) ? 'opacity-50 cursor-not-allowed' : 'shadow-orange-500/20 !bg-orange-600 hover:!bg-orange-700'}`}
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
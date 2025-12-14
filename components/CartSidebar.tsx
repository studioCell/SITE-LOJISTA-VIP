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
      extras: { wantsInvoice: boolean; wantsInsurance: boolean, shippingMethod: string }, 
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
  const [shippingMethod, setShippingMethod] = useState('');

  // Admin State
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Address State (For Admin Override)
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
      cep: '',
      street: '',
      number: '',
      district: '',
      city: '',
      complement: ''
  });
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Load users once if admin opens search
  useEffect(() => {
      if (isAdmin && isSearchingClient && users.length === 0) {
          const load = async () => {
              const data = await getUsers();
              setUsers(data.filter(u => !u.isAdmin && !u.isVendor));
          };
          load();
      }
  }, [isAdmin, isSearchingClient]);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const invoiceFee = wantsInvoice ? subtotal * 0.06 : 0;
  const insuranceFee = wantsInsurance ? subtotal * 0.03 : 0;
  const total = subtotal + invoiceFee + insuranceFee;

  const MIN_ORDER_VALUE = 20.00;
  
  // Logic: Admins bypass shipping and min value checks. Regular users must select shipping.
  const isShippingValid = isAdmin ? true : shippingMethod !== '';
  const isMinValValid = isAdmin ? true : total >= MIN_ORDER_VALUE;
  
  const canCheckout = isMinValValid && isShippingValid;

  const handleCheckoutClick = () => {
    if (isAdmin && selectedUser) {
        onCheckout(
            { wantsInvoice, wantsInsurance, shippingMethod },
            { user: selectedUser, address: addressForm }
        );
    } else {
        onCheckout({ wantsInvoice, wantsInsurance, shippingMethod });
    }
  };

  const handleSelectUser = (user: User) => {
      setSelectedUser(user);
      setIsSearchingClient(false);
      // Pre-fill address form with user data
      setAddressForm({
          cep: user.cep || '',
          street: user.street || '', 
          number: user.number || '',
          district: user.district || '',
          city: user.city || '',
          complement: user.complement || ''
      });
  };

  const handleCepBlurInternal = async () => {
      const raw = addressForm.cep.replace(/\D/g, '');
      if (raw.length === 8) {
          setLoadingAddress(true);
          const data = await fetchAddressByCep(raw);
          setLoadingAddress(false);
          if (data) {
              setAddressForm(prev => ({ 
                  ...prev, 
                  city: data.city,
                  street: data.street,
                  district: data.district
              }));
          }
      }
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
            {isAdmin ? 'Carrinho (Modo Venda)' : 'Seu Carrinho'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {onOpenMyOrders && !isAdmin && (
            <div className="px-5 py-3 bg-white border-b border-gray-100">
                <button onClick={onOpenMyOrders} className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors flex items-center justify-center gap-2">
                    Ver Meus Pedidos
                </button>
            </div>
        )}

        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
              <Button variant="outline" onClick={onClose}>
                  {isAdmin ? '+ Adicionar Produto' : 'Começar a comprar'}
              </Button>
            </div>
          ) : (
            items.map(item => (
                <div key={item.id} className="relative flex gap-4 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                     {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">IMG</span>}
                  </div>
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</h3>
                      <p className="text-orange-600 font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">-</button>
                        <span className="px-2 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => onUpdateQty(item.id, 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">+</button>
                      </div>
                      <button onClick={() => onRemove(item.id)} className="text-xs text-red-500 hover:text-red-700 underline ml-2">Remover</button>
                    </div>
                  </div>
                </div>
            ))
          )}
          
          {/* Add More Products Button */}
          {items.length > 0 && (
              <button 
                onClick={onClose}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold text-sm hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {isAdmin ? 'Adicionar Produto' : 'Selecionar mais produtos'}
              </button>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 bg-gray-50 border-t border-gray-200">
            {isAdmin && (
                <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-gray-700 uppercase">👤 Cliente</h3>
                        {!isSearchingClient && !selectedUser && (
                            <button onClick={() => setIsSearchingClient(true)} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">🔍 Buscar</button>
                        )}
                        {selectedUser && <button onClick={() => setSelectedUser(null)} className="text-xs text-red-500 underline">Alterar</button>}
                    </div>
                    {!selectedUser ? (
                        isSearchingClient ? (
                            <div>
                                <input autoFocus className="w-full border p-2 text-sm mb-2 rounded" placeholder="Nome/Tel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                <div className="max-h-24 overflow-y-auto bg-gray-50 border rounded">
                                    {filteredUsers.map(u => (
                                        <div key={u.id} onClick={() => handleSelectUser(u)} className="p-2 text-xs hover:bg-orange-100 cursor-pointer border-b">
                                            <p className="font-bold">{u.name}</p>
                                            <p className="text-gray-500">{u.phone}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <p className="text-sm text-gray-500 italic">Selecione um cliente para continuar.</p>
                    ) : (
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{selectedUser.name} <span className="text-gray-500 font-normal">({selectedUser.phone})</span></p>
                            
                            {/* ADDRESS TOGGLE */}
                            <div className="mt-3 pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-orange-600 focus:ring-orange-500"
                                        checked={showAddressForm}
                                        onChange={(e) => setShowAddressForm(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-gray-600">Editar dados de entrega</span>
                                </label>

                                {showAddressForm && (
                                    <div className="space-y-3 bg-zinc-900 p-4 rounded-xl border border-zinc-700 animate-fade-in shadow-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-white uppercase">📍 Endereço</span>
                                            {loadingAddress && <span className="text-[10px] text-orange-400 animate-pulse">Buscando...</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 font-bold mb-1 block">CEP</label>
                                                <input 
                                                    placeholder="00000-000" 
                                                    className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                                    value={addressForm.cep}
                                                    onChange={e => setAddressForm({...addressForm, cep: e.target.value})}
                                                    onBlur={handleCepBlurInternal}
                                                />
                                            </div>
                                            <div className="flex-[2]">
                                                <label className="text-[10px] text-gray-400 font-bold mb-1 block">Cidade</label>
                                                <input 
                                                    placeholder="Cidade" 
                                                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-gray-500 font-medium"
                                                    value={addressForm.city}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold mb-1 block">Rua</label>
                                            <input 
                                                placeholder="Nome da Rua" 
                                                className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                                value={addressForm.street}
                                                onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 font-bold mb-1 block">Número</label>
                                                <input 
                                                    placeholder="123" 
                                                    className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                                    value={addressForm.number}
                                                    onChange={e => setAddressForm({...addressForm, number: e.target.value})}
                                                />
                                            </div>
                                            <div className="flex-[2]">
                                                <label className="text-[10px] text-gray-400 font-bold mb-1 block">Bairro</label>
                                                <input 
                                                    placeholder="Bairro" 
                                                    className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                                    value={addressForm.district}
                                                    onChange={e => setAddressForm({...addressForm, district: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 font-bold mb-1 block">Complemento</label>
                                            <input 
                                                placeholder="Apto, Bloco, etc..." 
                                                className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                                value={addressForm.complement}
                                                onChange={e => setAddressForm({...addressForm, complement: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Forma de Envio</label>
                <div className="grid grid-cols-2 gap-2">
                    {['Motoboy', 'Correios', 'Transportadora', 'Retirada'].map(method => (
                        <button
                            key={method}
                            onClick={() => setShippingMethod(method)}
                            className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${shippingMethod === method ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
                {!shippingMethod && !isAdmin && <p className="text-xs text-red-500 mt-1">Selecione uma forma de envio.</p>}
            </div>

            <div className="space-y-2 mb-4">
                <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-white">
                    <input type="checkbox" checked={wantsInvoice} onChange={(e) => setWantsInvoice(e.target.checked)} className="rounded text-orange-600" />
                    <span className="text-xs text-gray-700 font-bold">Adicionar Nota Fiscal (+6%) <span className="text-gray-400 font-normal">(Opcional)</span></span>
                </label>
                <label className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-white">
                    <input type="checkbox" checked={wantsInsurance} onChange={(e) => setWantsInsurance(e.target.checked)} className="rounded text-orange-600" />
                    <span className="text-xs text-gray-700 font-bold">Adicionar Seguro (+3%) <span className="text-gray-400 font-normal">(Opcional)</span></span>
                </label>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total Estimado</span>
              <span className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
            
            <Button 
              onClick={handleCheckoutClick} 
              disabled={!canCheckout || (isAdmin && !selectedUser)}
              className={`w-full !py-3 !text-lg shadow-xl ${(!canCheckout || (isAdmin && !selectedUser)) ? 'opacity-50 cursor-not-allowed' : 'shadow-orange-500/20 !bg-green-600 hover:!bg-green-700'}`}
            >
              Finalizar Pedido
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
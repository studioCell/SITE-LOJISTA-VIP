
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
      extras: { shippingTarget: 'user' | 'end_customer'; endCustomer?: any }, 
      customerData?: { user: User, address: any } 
  ) => void;
  onOpenMyOrders?: () => void;
  isAdmin?: boolean;
  currentUser: User | null; // Passed from App for live sync
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onUpdateQty,
  onCheckout,
  onOpenMyOrders,
  isAdmin = false,
  currentUser
}) => {
  const [shippingTarget, setShippingTarget] = useState<'user' | 'end_customer'>('user');
  const [isConfirming, setIsConfirming] = useState(false);

  // End Customer Form State
  const [endCustomer, setEndCustomer] = useState({
      name: '',
      phone: '',
      cpf: '',
      birthDate: '',
      cep: '',
      street: '',
      number: '',
      district: '',
      city: '',
      complement: ''
  });
  const [loadingCep, setLoadingCep] = useState(false);

  // Admin Search State
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);

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
  const MIN_ORDER_VALUE = 20.00;

  const handleCepBlur = async () => {
      const raw = endCustomer.cep.replace(/\D/g, '');
      if (raw.length === 8) {
          setLoadingCep(true);
          const data = await fetchAddressByCep(raw);
          setLoadingCep(false);
          if (data) {
              setEndCustomer(prev => ({ 
                  ...prev, 
                  city: data.city,
                  street: data.street,
                  district: data.district
              }));
          }
      }
  };

  const isFormValid = () => {
    if (isAdmin) return !!selectedUser;

    if (shippingTarget === 'user') {
      return !!currentUser?.street && !!currentUser?.number && !!currentUser?.district && !!currentUser?.birthDate && !!currentUser?.cpf;
    } else {
      return (
        endCustomer.name.length > 3 &&
        endCustomer.cpf.replace(/\D/g, '').length >= 11 &&
        endCustomer.birthDate !== '' &&
        endCustomer.cep.replace(/\D/g, '').length >= 8 &&
        endCustomer.street.length > 2 &&
        endCustomer.number.length >= 1 &&
        endCustomer.district.length > 2
      );
    }
  };

  const handleCheckoutClick = () => {
    if (isConfirming) {
        if (isAdmin && selectedUser) {
            onCheckout(
                { shippingTarget: 'user' },
                { user: selectedUser, address: null }
            );
        } else {
            onCheckout({ 
              shippingTarget, 
              endCustomer: shippingTarget === 'end_customer' ? endCustomer : undefined 
            });
        }
        setIsConfirming(false);
    } else {
        setIsConfirming(true);
    }
  };

  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.phone && u.phone.includes(searchTerm))
  );

  const renderReviewSummary = () => {
      const data = shippingTarget === 'user' ? currentUser : endCustomer;
      if (!data) return null;

      return (
          <div className="space-y-4 animate-fade-in">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                  <p className="text-sm text-orange-800 font-bold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Atenção: Confira os dados
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                      Dados incorretos podem atrasar ou impedir o seu envio. Verifique cada detalhe antes de confirmar.
                  </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Resumo do Destinatário</h4>
                  
                  <div className="grid grid-cols-1 gap-2">
                      <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Nome</p>
                          <p className="text-sm font-bold text-gray-800">{data.name}</p>
                      </div>
                      <div className="flex gap-4">
                          <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">CPF</p>
                              <p className="text-sm font-medium text-gray-700">{data.cpf || 'Não informado'}</p>
                          </div>
                          <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Nascimento</p>
                              <p className="text-sm font-medium text-gray-700">{data.birthDate}</p>
                          </div>
                      </div>
                  </div>

                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pt-2 pb-2">Endereço de Entrega</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-bold">{data.street}, {data.number}</p>
                      {data.complement && <p className="text-xs text-gray-500 italic">Complemento: {data.complement}</p>}
                      <p>{data.district} — {data.city}</p>
                      <p className="text-orange-600 font-bold">CEP: {data.cep}</p>
                  </div>
              </div>
          </div>
      );
  };

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
            {isConfirming ? 'Revisar Envio' : (isAdmin ? 'Carrinho (Modo Venda)' : 'Seu Carrinho')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-6 bg-gray-50/30">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
              <Button variant="outline" onClick={onClose}>
                  {isAdmin ? '+ Adicionar Produto' : 'Começar a comprar'}
              </Button>
            </div>
          ) : isConfirming ? (
            renderReviewSummary()
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {items.map(item => (
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
                ))}
              </div>

              {!isAdmin && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <span className="bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">?</span>
                          O seu pedido vai ser enviado:
                      </h3>

                      <div className="grid grid-cols-1 gap-2">
                          <button 
                            onClick={() => setShippingTarget('user')}
                            className={`p-4 text-left border-2 rounded-xl transition-all ${shippingTarget === 'user' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                          >
                              <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-gray-800">Direto para mim</span>
                                  {shippingTarget === 'user' && <span className="text-orange-500">✓</span>}
                              </div>
                              <p className="text-xs text-gray-500">Usaremos seus dados de cadastro para entrega.</p>
                          </button>

                          <button 
                            onClick={() => setShippingTarget('end_customer')}
                            className={`p-4 text-left border-2 rounded-xl transition-all ${shippingTarget === 'end_customer' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                          >
                              <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-gray-800">Envio direto para meu cliente</span>
                                  {shippingTarget === 'end_customer' && <span className="text-orange-500">✓</span>}
                              </div>
                              <p className="text-xs text-gray-500">Preencha os dados do seu cliente final abaixo.</p>
                          </button>
                      </div>

                      {shippingTarget === 'user' && currentUser && (
                          <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl animate-fade-in-up">
                              <p className="text-[10px] text-gray-400 font-black uppercase mb-2 tracking-widest">Endereço Completo Cadastrado:</p>
                              <div className="text-xs text-gray-700 space-y-2">
                                  {currentUser.street && currentUser.number && currentUser.district ? (
                                      <>
                                          <div className="bg-white p-2 rounded border border-gray-100">
                                            <p className="font-bold text-sm">{currentUser.street}, {currentUser.number}</p>
                                            {currentUser.complement && <p className="text-gray-500 italic">Complemento: {currentUser.complement}</p>}
                                            <p>{currentUser.district} — {currentUser.city}</p>
                                            <p className="text-orange-600 font-bold">CEP: {currentUser.cep}</p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div>
                                              <p className="text-[9px] text-gray-400 font-bold uppercase">CPF</p>
                                              <p className="font-medium">{currentUser.cpf || 'Pendente'}</p>
                                            </div>
                                            <div>
                                              <p className="text-[9px] text-gray-400 font-bold uppercase">Nascimento</p>
                                              <p className="font-medium">{currentUser.birthDate || 'Pendente'}</p>
                                            </div>
                                          </div>
                                          {(!currentUser.birthDate || !currentUser.cpf) && <p className="text-red-500 font-bold mt-2 animate-pulse">⚠️ Complete seu CPF e Nascimento no Perfil!</p>}
                                      </>
                                  ) : (
                                      <div className="p-2 bg-red-50 rounded border border-red-100">
                                        <p className="text-red-600 font-bold text-center">⚠️ Cadastro incompleto!</p>
                                        <p className="text-[10px] text-red-500 text-center mt-1">Aperte no seu nome no topo e complete todos os campos em "Meus Dados".</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {shippingTarget === 'end_customer' && (
                          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-2 mb-2">Dados do Cliente Final</p>
                              
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nome Completo *</label>
                                  <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={endCustomer.name}
                                    onChange={e => setEndCustomer({...endCustomer, name: e.target.value})}
                                  />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">CPF / CNPJ *</label>
                                      <input 
                                        className="w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                        value={endCustomer.cpf}
                                        onChange={e => setEndCustomer({...endCustomer, cpf: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Nascimento *</label>
                                      <input 
                                        type="date"
                                        className="w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                        value={endCustomer.birthDate}
                                        onChange={e => setEndCustomer({...endCustomer, birthDate: e.target.value})}
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-1 relative">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">CEP *</label>
                                      <input 
                                        className={`w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500 ${loadingCep ? 'opacity-50' : ''}`}
                                        value={endCustomer.cep}
                                        onBlur={handleCepBlur}
                                        onChange={e => setEndCustomer({...endCustomer, cep: e.target.value})}
                                      />
                                      {loadingCep && <div className="absolute top-7 right-2"><div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                  </div>
                                  <div className="col-span-2">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Cidade</label>
                                      <input 
                                        className="w-full border border-gray-300 p-2 text-sm rounded-lg bg-gray-100 outline-none text-gray-500 font-medium"
                                        value={endCustomer.city}
                                        readOnly
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Rua *</label>
                                  <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={endCustomer.street}
                                    onChange={e => setEndCustomer({...endCustomer, street: e.target.value})}
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Número *</label>
                                      <input 
                                        className="w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                        value={endCustomer.number}
                                        onChange={e => setEndCustomer({...endCustomer, number: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Bairro *</label>
                                      <input 
                                        className="w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                        value={endCustomer.district}
                                        onChange={e => setEndCustomer({...endCustomer, district: e.target.value})}
                                      />
                                  </div>
                              </div>
                              
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Complemento</label>
                                  <input 
                                    placeholder="Apto, Bloco..." 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={endCustomer.complement}
                                    onChange={e => setEndCustomer({...endCustomer, complement: e.target.value})}
                                  />
                              </div>
                          </div>
                      )}
                  </div>
              )}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            {isAdmin && !isConfirming && (
                <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-gray-700 uppercase">👤 Cliente do Site</h3>
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
                        ) : <p className="text-sm text-gray-500 italic">Selecione o comprador para continuar.</p>
                    ) : (
                        <p className="font-bold text-gray-800 text-sm">{selectedUser.name} <span className="text-gray-500 font-normal">({selectedUser.phone})</span></p>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">{isConfirming ? 'Total a Pagar' : 'Total dos Produtos'}</span>
                  {subtotal < MIN_ORDER_VALUE && !isAdmin && (
                      <span className="text-[10px] text-red-500 font-bold">Mínimo: R$ {MIN_ORDER_VALUE.toFixed(2)}</span>
                  )}
              </div>
              <span className="text-2xl font-black text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleCheckoutClick} 
                  disabled={!isFormValid() || (subtotal < MIN_ORDER_VALUE && !isAdmin)}
                  className={`w-full !py-4 !text-lg shadow-xl ${!isFormValid() || (subtotal < MIN_ORDER_VALUE && !isAdmin) ? 'opacity-50 cursor-not-allowed' : 'shadow-orange-500/20 !bg-green-600 hover:!bg-green-700 active:scale-95 transition-all'}`}
                >
                  {isConfirming ? 'Confirmar e Finalizar' : 'Finalizar Agora'}
                </Button>
                
                {isConfirming && (
                    <button 
                        onClick={() => setIsConfirming(false)}
                        className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-800 underline transition-colors"
                    >
                        Corrigir Dados
                    </button>
                )}
            </div>
            
            {!isFormValid() && items.length > 0 && !isAdmin && (
                <p className="text-[10px] text-center text-red-500 font-bold mt-2 uppercase tracking-tight">
                    {shippingTarget === 'user' ? 'Complete seu endereço e CPF no Perfil' : 'Complete os campos do cliente final'}
                </p>
            )}
          </div>
        )}
      </div>
    </>
  );

  function handleSelectUser(user: User) {
      setSelectedUser(user);
      setIsSearchingClient(false);
  }
};

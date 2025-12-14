import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User } from '../types';
import { Button } from './Button';
import { subscribeToOrders, updateOrder, getShopSettings, getLogo, fetchAddressByCep } from '../services/storage';
import { PrintPreviewModal } from './PrintPreviewModal';

interface SalesAreaProps {
  isOpen: boolean;
  onClose: () => void;
  onEditItems: (order: Order) => void;
  currentUser: User | null;
}

// Removed 'cancelado'
const STATUS_LABELS: Record<string, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Finalizado',
  pagamento_pendente: 'Aguard. Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Entregue',
  devolucao: 'Devolução'
};

const STATUS_COLORS: Record<string, string> = {
  orcamento: 'bg-gray-100 text-gray-800',
  realizado: 'bg-blue-100 text-blue-800',
  pagamento_pendente: 'bg-yellow-100 text-yellow-800',
  preparacao: 'bg-orange-100 text-orange-800',
  transporte: 'bg-indigo-100 text-indigo-800',
  entregue: 'bg-green-100 text-green-800',
  devolucao: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-800 text-white' // Legacy support
};

export const SalesArea: React.FC<SalesAreaProps> = ({ isOpen, onClose, onEditItems, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [localDiscounts, setLocalDiscounts] = useState<Record<string, string>>({});
  const [localShippingCosts, setLocalShippingCosts] = useState<Record<string, string>>({});
  
  // Local state for address editing
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
      cep: '',
      street: '',
      number: '',
      district: '',
      city: '',
      complement: ''
  });
  const [loadingAddress, setLoadingAddress] = useState(false);

  const [settings, setSettings] = useState<any>(null); 
  const [logo, setLogo] = useState('');

  // Preview Modal State
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
        setOrders(data);
    });
    
    const loadStatic = async () => {
        setSettings(await getShopSettings());
        setLogo(await getLogo());
    };
    loadStatic();

    return () => unsubscribe();
  }, []);

  const calculateTotal = (order: Order, updates?: Partial<Order>) => {
      const merged = { ...order, ...updates };
      const subtotal = merged.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const discount = merged.discount || 0;
      const shipping = merged.shippingCost || 0;
      
      let fees = 0;
      if (merged.wantsInvoice) fees += subtotal * 0.06;
      if (merged.wantsInsurance) fees += subtotal * 0.03;

      return Math.max(0, subtotal - discount + shipping + fees);
  };

  const updateOrderTotals = async (order: Order, updates: Partial<Order>) => {
      const updatedTotal = calculateTotal(order, updates);
      
      const updatedOrder = {
          ...order,
          ...updates,
          total: updatedTotal
      };
      await updateOrder(updatedOrder);
  };

  const handleToggleFee = async (order: Order, feeType: 'invoice' | 'insurance') => {
      if (feeType === 'invoice') {
          await updateOrderTotals(order, { wantsInvoice: !order.wantsInvoice });
      } else {
          await updateOrderTotals(order, { wantsInsurance: !order.wantsInsurance });
      }
  };

  // Handlers for Discount
  const handleDiscountChange = (orderId: string, value: string) => {
    setLocalDiscounts(prev => ({ ...prev, [orderId]: value }));
  };
  const handleDiscountBlur = (order: Order) => {
    const val = localDiscounts[order.id];
    if (val !== undefined && val !== '') {
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num)) updateOrderTotals(order, { discount: num });
    }
  };

  // Handlers for Shipping Cost
  const handleShippingCostChange = (orderId: string, value: string) => {
    setLocalShippingCosts(prev => ({ ...prev, [orderId]: value }));
  };
  const handleShippingCostBlur = (order: Order) => {
    const val = localShippingCosts[order.id];
    if (val !== undefined && val !== '') {
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num)) updateOrderTotals(order, { shippingCost: num });
    }
  };

  // Handler for Shipping Method
  const handleShippingMethodChange = async (order: Order, method: string) => {
      await updateOrderTotals(order, { shippingMethod: method });
  };

  // Handler for Status Change
  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
      await updateOrder({
          ...order,
          status: newStatus,
          history: [...order.history, { status: newStatus, timestamp: Date.now() }]
      });
  };

  // --- Address Logic ---
  const startEditingAddress = (order: Order) => {
      setEditingAddressId(order.id);
      setAddressForm({
          cep: order.userCep || '',
          street: order.userStreet || '',
          number: order.userNumber || '',
          district: order.userDistrict || '',
          city: order.userCity || '',
          complement: order.userComplement || ''
      });
  };

  const cancelEditingAddress = () => {
      setEditingAddressId(null);
  };

  const saveAddress = async (order: Order) => {
      await updateOrder({
          ...order,
          userCep: addressForm.cep,
          userStreet: addressForm.street,
          userNumber: addressForm.number,
          userDistrict: addressForm.district,
          userCity: addressForm.city,
          userComplement: addressForm.complement
      });
      setEditingAddressId(null);
  };

  const handleCepBlur = async () => {
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

  // --- Finalize & WhatsApp ---
  const handleFinalizeOrder = async (order: Order) => {
    // 1. Update status to 'realizado' (Mapped to 'Pedido Finalizado')
    await handleStatusChange(order, 'realizado');

    // 2. Build detailed message
    const itemsList = order.items.map(i => {
        const totalItem = i.price * i.quantity;
        return `${i.quantity}x ${i.name}\n(Unit: R$ ${i.price.toFixed(2)}) = R$ ${totalItem.toFixed(2)}`;
    }).join('\n\n');

    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    let feesText = '';
    if (order.wantsInvoice) feesText += `Nota Fiscal: Sim (Incluso)\n`;
    if (order.wantsInsurance) feesText += `Seguro: Sim (Incluso)\n`;

    let addressBlock = `*Endereço de Entrega:*\n`;
    if (order.userStreet) {
        addressBlock += `${order.userStreet}, ${order.userNumber || 'S/N'}\n`;
        if (order.userDistrict) addressBlock += `Bairro: ${order.userDistrict}\n`;
        if (order.userComplement) addressBlock += `Comp: ${order.userComplement}\n`;
        addressBlock += `${order.userCity || ''} - CEP: ${order.userCep || ''}`;
    } else {
        addressBlock += `Retirada / A Combinar (${order.userCity || 'Cidade não inf.'})`;
    }

    const message = `*PEDIDO FINALIZADO #${order.id.slice(-6)}*

*Cliente:* ${order.userName}
*Tel:* ${order.userPhone}

${addressBlock}

*Resumo do Pedido:*
${itemsList}

*Valores:*
Subtotal: R$ ${subtotal.toFixed(2)}
Frete: R$ ${(order.shippingCost || 0).toFixed(2)}
Desconto: - R$ ${(order.discount || 0).toFixed(2)}
${feesText}
*TOTAL GERAL: R$ ${order.total.toFixed(2)}*

Pedido conferido e finalizado!`;

    const encoded = encodeURIComponent(message);
    const phoneNumber = order.userPhone.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=55${phoneNumber}&text=${encoded}`, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') {
      return ['orcamento', 'realizado', 'pagamento_pendente', 'preparacao'].includes(o.status);
    }
    return true;
  });

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-gray-100 z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="bg-white p-5 border-b border-gray-200 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💰</span> Gestão de Vendas
            </h2>
            <p className="text-xs text-gray-500">Fluxo de caixa e pedidos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white border-b border-gray-200 flex gap-2">
          <button 
            onClick={() => setFilter('active')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'active' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Em Aberto
          </button>
          <button 
             onClick={() => setFilter('all')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Todos os Pedidos
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>Nenhum pedido encontrado.</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
              const createdAtDate = new Date(order.createdAt);
              const isEditingAddr = editingAddressId === order.id;
              const hasFullAddress = order.userStreet && order.userNumber && order.userDistrict;
              
              // SECURITY CHECK: Lock Editing for Vendors if status is Advanced
              const isLockedForEditing = !currentUser?.isAdmin && 
                  ['preparacao', 'transporte', 'entregue', 'devolucao'].includes(order.status);

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{order.userName}</h3>
                      <p className="text-xs text-gray-500">
                        #{order.id.slice(-6)} • {createdAtDate.toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Status Dropdown */}
                    <div className="flex flex-col items-end gap-1">
                        <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                            disabled={isLockedForEditing}
                            className={`text-[10px] font-bold uppercase py-1 px-2 rounded border-none outline-none cursor-pointer ${STATUS_COLORS[order.status]} ${isLockedForEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                  
                  {/* Address Section */}
                  <div className="px-4 py-3 border-b border-gray-50 bg-orange-50/30">
                      {!isEditingAddr ? (
                          <div className="flex justify-between items-start">
                              <div className="text-xs text-gray-600 flex-1">
                                  <div className="flex items-center gap-1 mb-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <p className="font-bold text-gray-500 uppercase text-[10px]">Endereço de Entrega</p>
                                  </div>
                                  
                                  {order.userStreet ? (
                                      <div className="ml-4">
                                          <p className="font-medium text-gray-800">{order.userStreet}, {order.userNumber}</p>
                                          {order.userComplement && <p className="text-[10px] text-gray-500">Comp: {order.userComplement}</p>}
                                          <p>{order.userDistrict} - {order.userCity}</p>
                                          <p className="text-gray-400">CEP: {order.userCep}</p>
                                      </div>
                                  ) : (
                                      <div className="ml-4 text-orange-700 italic bg-orange-100 inline-block px-2 py-1 rounded">
                                          ⚠️ Endereço incompleto ou não informado.
                                      </div>
                                  )}
                              </div>
                              <button 
                                onClick={() => startEditingAddress(order)}
                                disabled={isLockedForEditing}
                                className={`text-orange-600 bg-white border border-orange-200 hover:bg-orange-50 text-xs font-bold px-3 py-1 rounded transition-colors ${isLockedForEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                  {order.userStreet ? 'Alterar' : 'Definir Endereço'}
                              </button>
                          </div>
                      ) : (
                          <div className="space-y-3 bg-zinc-900 p-4 rounded-xl border border-zinc-700 shadow-xl animate-fade-in relative overflow-hidden">
                              <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs font-bold text-white uppercase flex items-center gap-1">
                                      📍 Editando Endereço
                                  </p>
                                  {loadingAddress && <span className="text-[10px] text-orange-400 animate-pulse">Buscando CEP...</span>}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-1">
                                      <label className="text-[10px] text-gray-400 font-bold mb-1 block">CEP</label>
                                      <input 
                                        placeholder="00000-000" 
                                        className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                        value={addressForm.cep}
                                        onChange={e => setAddressForm({...addressForm, cep: e.target.value})}
                                        onBlur={handleCepBlur}
                                      />
                                  </div>
                                  <div className="col-span-2">
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

                              <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-1">
                                      <label className="text-[10px] text-gray-400 font-bold mb-1 block">Número</label>
                                      <input 
                                        placeholder="Nº" 
                                        className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                        value={addressForm.number}
                                        onChange={e => setAddressForm({...addressForm, number: e.target.value})}
                                      />
                                  </div>
                                  <div className="col-span-2">
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
                                    placeholder="Apto, Bloco..." 
                                    className="w-full bg-zinc-800 border border-zinc-600 p-2 text-xs rounded text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
                                    value={addressForm.complement}
                                    onChange={e => setAddressForm({...addressForm, complement: e.target.value})}
                                  />
                              </div>

                              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                                  <button onClick={cancelEditingAddress} className="text-xs text-gray-400 hover:text-white px-2">Cancelar</button>
                                  <button onClick={() => saveAddress(order)} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold shadow-lg shadow-orange-900/20">
                                      Salvar Endereço
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Items Summary */}
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-600">
                          <span>{item.quantity}x {item.name}</span>
                          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 mb-4">
                       <button 
                         onClick={() => setPreviewOrder(order)}
                         className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full"
                       >
                         Imprimir
                       </button>

                       {(order.status === 'orcamento' && !isLockedForEditing) && (
                           <button 
                             onClick={() => onEditItems(order)}
                             className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                           >
                             Editar Itens
                           </button>
                       )}
                    </div>

                    {/* Financials & Shipping Controls */}
                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                      </div>
                      
                      {/* Fees Toggles */}
                      <div className="flex gap-4">
                          <label className={`flex items-center gap-1 ${isLockedForEditing ? 'opacity-50' : 'cursor-pointer'}`}>
                              <input 
                                type="checkbox" 
                                disabled={isLockedForEditing}
                                checked={!!order.wantsInvoice}
                                onChange={() => handleToggleFee(order, 'invoice')}
                                className="rounded text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-xs text-gray-600">Nota Fiscal (+6%)</span>
                          </label>
                          <label className={`flex items-center gap-1 ${isLockedForEditing ? 'opacity-50' : 'cursor-pointer'}`}>
                              <input 
                                type="checkbox" 
                                disabled={isLockedForEditing}
                                checked={!!order.wantsInsurance}
                                onChange={() => handleToggleFee(order, 'insurance')}
                                className="rounded text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-xs text-gray-600">Seguro (+3%)</span>
                          </label>
                      </div>

                      {/* Discount Input */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Desconto (-)</span>
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-gray-400 text-xs">R$</span>
                          <input 
                            type="number"
                            step="0.01"
                            disabled={isLockedForEditing}
                            className={`w-full bg-white border border-gray-300 rounded px-2 py-1 text-right text-sm outline-none focus:border-orange-500 text-red-500 font-medium ${isLockedForEditing ? 'bg-gray-100 text-gray-400' : ''}`}
                            placeholder="0,00"
                            value={localDiscounts[order.id] !== undefined ? localDiscounts[order.id] : (order.discount || '')}
                            onChange={(e) => handleDiscountChange(order.id, e.target.value)}
                            onBlur={() => handleDiscountBlur(order)}
                          />
                        </div>
                      </div>

                      {/* Shipping Controls */}
                      <div className="border-t border-gray-200 pt-2 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Forma de Envio</span>
                            <select 
                                value={order.shippingMethod || ''}
                                disabled={isLockedForEditing}
                                onChange={(e) => handleShippingMethodChange(order, e.target.value)}
                                className={`bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 w-32 ${isLockedForEditing ? 'bg-gray-100 text-gray-400' : ''}`}
                            >
                                <option value="">Selecione...</option>
                                <option value="Motoboy">Motoboy</option>
                                <option value="Correios">Correios</option>
                                <option value="Transportadora">Transportadora</option>
                                <option value="Retirada">Retirada</option>
                            </select>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Frete (+)</span>
                            <div className="flex items-center gap-1 w-24">
                              <span className="text-gray-400 text-xs">R$</span>
                              <input 
                                type="number"
                                step="0.01"
                                disabled={isLockedForEditing}
                                className={`w-full bg-white border border-gray-300 rounded px-2 py-1 text-right text-sm outline-none focus:border-indigo-500 text-indigo-600 font-medium ${isLockedForEditing ? 'bg-gray-100 text-gray-400' : ''}`}
                                placeholder="0,00"
                                value={localShippingCosts[order.id] !== undefined ? localShippingCosts[order.id] : (order.shippingCost || '')}
                                onChange={(e) => handleShippingCostChange(order.id, e.target.value)}
                                onBlur={() => handleShippingCostBlur(order)}
                              />
                            </div>
                          </div>
                      </div>

                      <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                        <span>Total Final</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                      </div>

                      {/* Finalize Button */}
                      {order.status === 'orcamento' && (
                          <div className="pt-2">
                              {!hasFullAddress && (
                                  <p className="text-xs text-red-500 text-center mb-2 font-medium">⚠️ Preencha o endereço acima antes de finalizar.</p>
                              )}
                              <Button 
                                onClick={() => handleFinalizeOrder(order)}
                                className={`w-full !py-3 shadow-lg ${!hasFullAddress ? '!bg-gray-400 cursor-not-allowed hover:!bg-gray-400' : '!bg-green-600 hover:!bg-green-700'}`}
                                disabled={!hasFullAddress || isLockedForEditing}
                              >
                                {hasFullAddress ? '✅ Finalizar e Enviar Pedido' : 'Preencha o Endereço'}
                              </Button>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Print Preview Modal */}
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
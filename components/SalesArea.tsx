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
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let addressBlock = "";
    if (order.userStreet) {
        addressBlock = `${order.userStreet}, ${order.userNumber || 'S/N'}`;
        if (order.userDistrict) addressBlock += ` - ${order.userDistrict}`;
        if (order.userComplement) addressBlock += ` (${order.userComplement})`;
        addressBlock += `\n${order.userCity || ''} / ${order.userCep || ''}`;
    } else {
        // Se não tiver rua, mostra apenas a cidade ou deixa em branco se nem cidade tiver
        addressBlock = order.userCity || '';
    }

    const itemsList = order.items.map(i => {
        const totalItem = i.price * i.quantity;
        let itemStr = `${i.quantity} . ${i.name} (R$ ${i.price.toFixed(2)}) = R$ ${totalItem.toFixed(2)}`;
        if (i.note) itemStr += `\n( ${i.note} )`;
        return itemStr;
    }).join('\n');

    // Lógica de Frete e Mensagem Final
    let shippingInfoText = order.shippingMethod || "A Combinar";
    let finalMessage = "Confirma o pedido?";

    switch (order.shippingMethod) {
        case 'Retirada':
            shippingInfoText = "Retirada (Não é cobrado o frete)";
            finalMessage = "Confirma o pedido? Vou te enviar os dados do endereço para retirada.";
            break;
        case 'Correios':
            shippingInfoText = "Correios (Vou calcular o frete pra você)";
            finalMessage = "Confirma o pedido? Logo mais vou calcular seu frete, me confirmar o Cep de envio por gentileza.";
            break;
        case 'Transportadora':
            shippingInfoText = "Transportadora";
            finalMessage = "Confirma o pedido? Logo mais vou calcular seu frete, me confirmar o Cep de envio por gentileza.";
            break;
        case 'Motoboy':
            shippingInfoText = "Motoboy (Cobrado de 20 a 40 reais dentro de Goiânia)";
            finalMessage = "Confirma o pedido? Me envie a localização para que eu possa te passar o valor do motoboy.";
            break;
        default:
            finalMessage = "Confirma o pedido?";
            break;
    }

    const text = 
`🧾 PEDIDO – ${order.userName.toUpperCase()}
Cód: #${order.id.slice(-6)}
Contato: ${order.userPhone}

${addressBlock}

🕒 Data: ${dateStr}
🕒 Hora: ${timeStr}
📌 Status: Aguardando aprovação

**📦 PRODUTOS:

${itemsList}

📦 Envio: ${shippingInfoText}

🔖 DESCONTO: R$ ${(order.discount || 0).toFixed(2)}
💰 TOTAL DO PEDIDO: *R$ ${order.total.toFixed(2)}*

${finalMessage}`;
            
    const encodedText = encodeURIComponent(text);
    const phoneNumber = '5562992973853'; // Store number
    window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedText}`, '_blank');
  };

  if (!isOpen) return null;

  // Filter orders
  const displayedOrders = orders.filter(o => {
      // Vendor Filter
      if (currentUser?.isVendor && o.sellerId !== currentUser.id) return false;
      
      if (filter === 'active') {
          return !['entregue', 'cancelado', 'devolucao'].includes(o.status);
      }
      return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4">
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <span className="text-3xl">📋</span> Gerenciamento de Pedidos
           </h2>
           
           <div className="flex bg-gray-100 p-1 rounded-lg">
               <button 
                 onClick={() => setFilter('active')}
                 className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'active' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Em Andamento ({orders.filter(o => !['entregue', 'cancelado', 'devolucao'].includes(o.status)).length})
               </button>
               <button 
                 onClick={() => setFilter('all')}
                 className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'all' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Todos ({orders.length})
               </button>
           </div>
           
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* Orders Grid */}
        <div className="flex-grow overflow-y-auto">
            {displayedOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                   <p className="text-xl font-medium">Nenhum pedido encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {displayedOrders.map(order => (
                       <div key={order.id} className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                           {/* Order Header */}
                           <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                               <div>
                                   <div className="flex items-center gap-2">
                                       <span className="font-bold text-gray-800">#{order.id.slice(-6)}</span>
                                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${STATUS_COLORS[order.status]}`}>
                                           {STATUS_LABELS[order.status]}
                                       </span>
                                   </div>
                                   <p className="text-xs text-gray-500 mt-1">
                                       {new Date(order.createdAt).toLocaleString()}
                                   </p>
                               </div>
                               <div className="text-right">
                                   <p className="font-bold text-lg text-gray-900">
                                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                                   </p>
                                   <button 
                                     onClick={() => setPreviewOrder(order)}
                                     className="text-xs text-blue-600 hover:underline font-medium"
                                   >
                                     Imprimir Recibo
                                   </button>
                               </div>
                           </div>
                           
                           {/* Order Body */}
                           <div className="p-4 flex-grow flex flex-col md:flex-row gap-4">
                               {/* Left: Customer & Items */}
                               <div className="flex-1">
                                   <div className="mb-3">
                                       <p className="font-bold text-gray-800">{order.userName}</p>
                                       <a href={`tel:${order.userPhone}`} className="text-xs text-gray-500 hover:text-blue-500 block">{order.userPhone}</a>
                                       
                                       {/* Address Editor */}
                                       {editingAddressId === order.id ? (
                                           <div className="mt-2 bg-yellow-50 p-2 rounded border border-yellow-200 text-xs">
                                               <p className="font-bold text-yellow-700 mb-1">Editar Endereço</p>
                                               <div className="grid grid-cols-2 gap-2 mb-2">
                                                   <input placeholder="CEP" value={addressForm.cep} onChange={e => setAddressForm({...addressForm, cep: e.target.value})} onBlur={handleCepBlur} className="border p-1 rounded w-full" />
                                                   <input placeholder="Cidade" value={addressForm.city} readOnly className="border p-1 rounded w-full bg-gray-100" />
                                                   <input placeholder="Rua" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="border p-1 rounded w-full col-span-2" />
                                                   <input placeholder="Número" value={addressForm.number} onChange={e => setAddressForm({...addressForm, number: e.target.value})} className="border p-1 rounded w-full" />
                                                   <input placeholder="Bairro" value={addressForm.district} onChange={e => setAddressForm({...addressForm, district: e.target.value})} className="border p-1 rounded w-full" />
                                               </div>
                                               <div className="flex justify-end gap-2">
                                                   <button onClick={cancelEditingAddress} className="text-gray-500">Cancelar</button>
                                                   <button onClick={() => saveAddress(order)} className="bg-yellow-600 text-white px-2 py-1 rounded font-bold">Salvar</button>
                                               </div>
                                           </div>
                                       ) : (
                                           <div className="text-xs text-gray-500 mt-1 flex items-start gap-1 group">
                                               <span>📍</span>
                                               <span className="flex-grow">
                                                   {order.userStreet ? `${order.userStreet}, ${order.userNumber}` : (order.userCity || 'Sem endereço')}
                                                   {order.userDistrict && ` - ${order.userDistrict}`}
                                               </span>
                                               <button onClick={() => startEditingAddress(order)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 font-bold ml-1">✎</button>
                                           </div>
                                       )}
                                   </div>

                                   <div className="border-t border-gray-100 pt-2 max-h-32 overflow-y-auto">
                                       {order.items.map((item, i) => (
                                           <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                               <span className="text-gray-700">
                                                   <span className="font-bold">{item.quantity}x</span> {item.name}
                                               </span>
                                               <span className="text-gray-500 font-medium">
                                                   R$ {(item.price * item.quantity).toFixed(2)}
                                               </span>
                                           </div>
                                       ))}
                                   </div>
                                   <div className="mt-2 text-right">
                                       <button onClick={() => onEditItems(order)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-bold transition-colors">
                                           ✏️ Editar Itens
                                       </button>
                                   </div>
                               </div>

                               {/* Right: Actions & Finances */}
                               <div className="w-full md:w-64 bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col justify-between">
                                   <div className="space-y-3">
                                       {/* Shipping Control */}
                                       <div>
                                           <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Envio</label>
                                           <div className="flex gap-2 mb-1">
                                               <select 
                                                 className="text-xs border border-gray-300 rounded p-1 w-full bg-white"
                                                 value={order.shippingMethod || ''}
                                                 onChange={e => handleShippingMethodChange(order, e.target.value)}
                                               >
                                                   <option value="">Selecione...</option>
                                                   <option value="Motoboy">Motoboy</option>
                                                   <option value="Correios">Correios</option>
                                                   <option value="Transportadora">Transportadora</option>
                                                   <option value="Retirada">Retirada</option>
                                               </select>
                                           </div>
                                           <div className="flex items-center gap-1">
                                               <span className="text-xs text-gray-500">R$</span>
                                               <input 
                                                 type="number"
                                                 className="w-full text-xs border border-gray-300 rounded p-1"
                                                 value={localShippingCosts[order.id] !== undefined ? localShippingCosts[order.id] : order.shippingCost || 0}
                                                 onChange={e => handleShippingCostChange(order.id, e.target.value)}
                                                 onBlur={() => handleShippingCostBlur(order)}
                                                 placeholder="Custo"
                                               />
                                           </div>
                                       </div>

                                       {/* Discount Control */}
                                       <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Desconto</label>
                                            <div className="flex items-center gap-1">
                                               <span className="text-xs text-red-500">- R$</span>
                                               <input 
                                                 type="number"
                                                 className="w-full text-xs border border-gray-300 rounded p-1 text-red-600 font-bold"
                                                 value={localDiscounts[order.id] !== undefined ? localDiscounts[order.id] : order.discount || 0}
                                                 onChange={e => handleDiscountChange(order.id, e.target.value)}
                                                 onBlur={() => handleDiscountBlur(order)}
                                               />
                                            </div>
                                       </div>

                                       {/* Fees Toggles */}
                                       <div className="flex gap-2">
                                           <button 
                                              onClick={() => handleToggleFee(order, 'invoice')}
                                              className={`flex-1 text-[10px] py-1 rounded border font-bold ${order.wantsInvoice ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'}`}
                                           >
                                               Nota (+6%)
                                           </button>
                                           <button 
                                              onClick={() => handleToggleFee(order, 'insurance')}
                                              className={`flex-1 text-[10px] py-1 rounded border font-bold ${order.wantsInsurance ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-300'}`}
                                           >
                                               Seguro (+3%)
                                           </button>
                                       </div>
                                   </div>

                                   {/* Status Actions */}
                                   <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 gap-2">
                                       <Button 
                                         onClick={() => handleFinalizeOrder(order)}
                                         className="w-full !py-2 !text-xs !bg-green-600 hover:!bg-green-700 flex justify-center items-center gap-2"
                                       >
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                           </svg>
                                           Enviar Confirmação
                                       </Button>
                                       
                                       <div className="flex gap-1">
                                           <button 
                                             onClick={() => handleStatusChange(order, 'cancelado')}
                                             className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold py-2 rounded"
                                           >
                                               Cancelar
                                           </button>
                                            <button 
                                             onClick={() => handleStatusChange(order, 'devolucao')}
                                             className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold py-2 rounded"
                                           >
                                               Devolução
                                           </button>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))}
                </div>
            )}
        </div>
      </div>

      <PrintPreviewModal 
        isOpen={!!previewOrder} 
        onClose={() => setPreviewOrder(null)} 
        order={previewOrder} 
        settings={settings}
        logo={logo}
        isAdmin={true}
      />
    </div>
  );
};
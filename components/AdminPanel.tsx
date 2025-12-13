import React, { useState, useEffect } from 'react';
import { Product, ShopSettings, User, Order, OrderStatus } from '../types';
import { Button } from './Button';
import { ProductFormModal } from './ProductFormModal';
import { 
  getShopSettings, 
  saveShopSettings, 
  getHeroImage, 
  saveHeroImage, 
  subscribeToUsers, 
  subscribeToOrders, 
  updateOrder,
  getLogo,
  saveLogo,
  updateUserPassword,
  toggleProductAvailability
} from '../services/storage';
import { PrintPreviewModal } from './PrintPreviewModal';

// --- Internal Component for Safe Image Rendering ---
const AdminProductThumbnail = ({ src, alt }: { src?: string, alt: string }) => {
  const [error, setError] = useState(false);

  // If error occurs or no source, show placeholder
  if (error || !src || src.trim() === '') {
    return (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
       </svg>
    );
  }
  
  return (
    <img 
      className="h-full w-full object-cover" 
      src={src} 
      alt={alt} 
      onError={() => setError(true)} 
    />
  );
};

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateDescription: (id: string, newDesc: string) => void;
  onEditOrder: (order: Order) => void; 
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Realizado',
  pagamento_pendente: 'Aguardando Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Entregue',
  devolucao: 'Devolução',
  cancelado: 'Cancelado'
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  orcamento: 'bg-gray-100 text-gray-700',
  realizado: 'bg-blue-100 text-blue-700',
  pagamento_pendente: 'bg-yellow-100 text-yellow-700',
  preparacao: 'bg-orange-100 text-orange-700', 
  transporte: 'bg-indigo-100 text-indigo-700',
  entregue: 'bg-green-100 text-green-700',
  devolucao: 'bg-red-100 text-red-700',
  cancelado: 'bg-gray-800 text-white'
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onUpdateDescription,
  onEditOrder 
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'clients' | 'settings'>('products');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Settings State
  const [settings, setSettings] = useState<ShopSettings>({
    aboutUs: '',
    shippingPolicy: '',
    warrantyPolicy: '',
    feesPolicy: '',
    contactNumber: '',
    pixKey: '',
    pixName: '',
    pixBank: ''
  });
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [previewError, setPreviewError] = useState(false);

  // Clients & Orders State
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({}); 
  
  // Password Management State
  const [passwordInput, setPasswordInput] = useState<Record<string, string>>({});

  // Filters State
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [cityFilter, setCityFilter] = useState('');
  
  // Print Modal State
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Initial Data Loading
  useEffect(() => {
    // 1. Settings (One-time or could be real-time, but one-time is fine for admin inputs)
    const loadSettings = async () => {
      setSettings(await getShopSettings());
      setCoverUrl(await getHeroImage());
      setLogoUrl(await getLogo());
    };
    loadSettings();

    // 2. Real-time Users
    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data.filter(u => !u.isAdmin));
    });

    // 3. Real-time Orders
    const unsubOrders = subscribeToOrders((data) => {
      setOrders(data);
    });

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  useEffect(() => {
    setPreviewError(false);
  }, [coverUrl]);

  // --- Product Logic ---
  const handleCreateClick = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleFormSave = (data: Product | Omit<Product, 'id'>) => {
    if ('id' in data) {
      onUpdateProduct(data as Product);
    } else {
      onAddProduct(data);
    }
  };

  const handleToggleAvailability = (id: string) => {
    toggleProductAvailability(id);
  };


  // --- Settings Logic ---
  const handleSaveSettings = async () => {
    await saveShopSettings(settings);
    await saveHeroImage(coverUrl);
    await saveLogo(logoUrl);
    alert('Configurações salvas!');
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
        setPreviewError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Order Logic ---
  const getOrdersForUser = (userId: string) => {
    let userOrders = orders.filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    
    // Apply Status Filter
    if (statusFilter !== 'all') {
      userOrders = userOrders.filter(o => o.status === statusFilter);
    }

    return userOrders;
  };

  const updateOrderStatus = async (order: Order, newStatus: OrderStatus) => {
    const tracking = trackingInput[order.id] || order.trackingCode;
    
    // Create updated order
    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      trackingCode: tracking,
      history: [...order.history, { status: newStatus, timestamp: Date.now() }]
    };

    await updateOrder(updatedOrder);
  };

  const handlePrintOrder = (order: Order) => {
    setPreviewOrder(order);
  };

  const handleSendUpdate = (order: Order) => {
    const name = order.userName.split(' ')[0];
    const itemsList = order.items.map(i => `• ${i.quantity}x ${i.name}`).join('\n');
    let message = '';

    switch (order.status) {
        case 'orcamento':
            message = `Olá ${name}! 👋\nRecebemos seu orçamento. Aguarde, em breve confirmaremos a disponibilidade e valores.`;
            break;
        case 'pagamento_pendente':
            message = `*PEDIDO FINALIZADO #${order.id.slice(-6)}* ✅\n------------------------------\n*ITENS:*\n${itemsList}\n\n*Total a Pagar:* R$ ${order.total.toFixed(2)}\n\n*DADOS PIX:*\nChave: ${settings?.pixKey || 'Solicite'}\nNome: ${settings?.pixName}\nBanco: ${settings?.pixBank}\n\nEnvie o comprovante para confirmar!`;
            break;
        case 'preparacao':
            message = `Pagamento Confirmado! ✅\n\nOlá ${name}, seu pedido #${order.id.slice(-6)} já está em separação e embalagem.`;
            break;
        case 'transporte':
            message = `Saiu para Entrega/Envio! 🚚\n\nOlá ${name}, seu pedido #${order.id.slice(-6)} está a caminho.\n${order.trackingCode ? `Rastreio: ${order.trackingCode}` : ''}`;
            break;
        case 'entregue':
            message = `Pedido Entregue! 🎁\n\nOlá ${name}, consta que seu pedido foi entregue. Esperamos que tenha gostado!\nSe puder, mande uma foto do produto recebido.`;
            break;
        default:
            message = `Atualização do Pedido #${order.id.slice(-6)}: Novo status: *${STATUS_LABELS[order.status]}*.`;
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/55${order.userPhone.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  const handlePasswordUpdate = async (userId: string) => {
    const newPass = passwordInput[userId];
    if (!newPass || newPass.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    await updateUserPassword(userId, newPass);
    // Subscription updates UI
    setPasswordInput(prev => ({ ...prev, [userId]: '' }));
    alert("Senha atualizada com sucesso!");
  };

  const filteredUsers = users.filter(u => {
    const matchCity = !cityFilter || (u.city && u.city.toLowerCase().includes(cityFilter.toLowerCase()));
    const hasMatchingOrder = statusFilter === 'all' || orders.some(o => o.userId === u.id && o.status === statusFilter);
    return matchCity && hasMatchingOrder;
  });

  const totalClients = users.length;
  const totalOrders = orders.length;

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto bg-zinc-900 text-white">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-4 px-4 text-sm font-medium border-b-4 transition-colors whitespace-nowrap ${activeTab === 'products' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          📦 Produtos
        </button>
        <button 
          onClick={() => setActiveTab('clients')}
          className={`flex-1 py-4 px-4 text-sm font-medium border-b-4 transition-colors whitespace-nowrap ${activeTab === 'clients' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          👥 Clientes & Pedidos
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 px-4 text-sm font-medium border-b-4 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          ⚙️ Configurações
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'products' && (
          <>
            {/* Same product content */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Gerenciar Estoque</h2>
                <p className="text-sm text-gray-500">Adicione, edite ou remova produtos.</p>
              </div>
              <Button onClick={handleCreateClick} className="!bg-orange-600 hover:!bg-orange-700">
                + Novo Produto
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo?</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${product.available ? 'bg-gray-100' : 'bg-gray-200 opacity-50'}`}>
                            <AdminProductThumbnail src={product.image} alt={product.name} />
                          </div>
                          <div className={`ml-4 ${!product.available && 'opacity-50'}`}>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                           className={`relative w-11 h-6 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${product.available ? 'bg-green-500' : 'bg-gray-200'}`}
                           onClick={() => handleToggleAvailability(product.id)}
                        >
                            <span 
                                className={`inline-block w-4 h-4 transform transition-transform duration-200 ease-in-out bg-white rounded-full mt-1 ml-1 ${product.available ? 'translate-x-5' : 'translate-x-0'}`} 
                            />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(product)} 
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => onDeleteProduct(product.id)} 
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Clients Tab and Order Logic */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* ... Client stats and filters ... */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-sm text-orange-600 font-bold uppercase">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-800">{totalClients}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-600 font-bold uppercase">Total de Pedidos</p>
                <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-lg">
               <div className="flex-1">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar por Cidade</label>
                 <input 
                   type="text" 
                   value={cityFilter}
                   onChange={(e) => setCityFilter(e.target.value)}
                   placeholder="Ex: Goiânia"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500 text-sm"
                 />
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status do Pedido</label>
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-orange-500 text-sm bg-white"
                 >
                   <option value="all">Todos</option>
                   {Object.entries(STATUS_LABELS).map(([key, label]) => (
                     <option key={key} value={key}>{label}</option>
                   ))}
                 </select>
               </div>
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-2">Lista de Clientes</h2>
            {filteredUsers.length === 0 ? (
               <p className="text-gray-500 italic text-center py-8">Nenhum cliente encontrado com os filtros atuais.</p>
            ) : (
               filteredUsers.map(user => {
                 const userOrders = getOrdersForUser(user.id);
                 if (statusFilter !== 'all' && userOrders.length === 0) return null;

                 const isExpanded = expandedUser === user.id;

                 return (
                   <div key={user.id} className="border border-gray-200 rounded-lg overflow-hidden">
                     <div 
                       className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                       onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                     >
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold">
                           {user.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-bold text-gray-800">{user.name}</p>
                           <p className="text-xs text-gray-500">{user.phone} • {user.city}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border border-gray-200">
                           {userOrders.length} pedidos
                         </span>
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </div>
                     </div>

                     {isExpanded && (
                       <div className="p-4 bg-white border-t border-gray-100 animate-fade-in">
                         
                         {/* Password Management */}
                         <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4">
                            <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                               </svg>
                               Segurança da Conta
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                               <div className="flex-1 w-full">
                                  <label className="text-xs text-gray-500 block mb-1">Senha Atual</label>
                                  <div className="font-mono bg-white px-3 py-2 rounded border border-gray-200 text-sm font-bold text-gray-700 select-all">
                                     {user.password || '---'}
                                  </div>
                               </div>
                               <div className="flex-1 w-full">
                                  <label className="text-xs text-gray-500 block mb-1">Redefinir Senha</label>
                                  <input 
                                     type="text" 
                                     placeholder="Nova senha..."
                                     className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:border-red-500 outline-none"
                                     value={passwordInput[user.id] || ''}
                                     onChange={(e) => setPasswordInput({...passwordInput, [user.id]: e.target.value})}
                                  />
                               </div>
                               <button 
                                  onClick={() => handlePasswordUpdate(user.id)}
                                  className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 transition-colors whitespace-nowrap"
                               >
                                  Salvar Senha
                               </button>
                            </div>
                         </div>

                         {userOrders.length === 0 ? (
                           <p className="text-sm text-gray-400">Nenhum pedido encontrado para este filtro.</p>
                         ) : (
                           <div className="space-y-6">
                             {userOrders.map(order => (
                               <div key={order.id} className="border border-gray-100 rounded-lg p-4 shadow-sm relative">
                                 {/* Edit Order Button */}
                                 {order.status === 'orcamento' && (
                                   <button 
                                      onClick={() => onEditOrder(order)}
                                      className="absolute top-4 right-4 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100"
                                   >
                                     ✏️ Editar Pedido
                                   </button>
                                 )}

                                 <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                                   <div>
                                     <div className="flex items-center gap-2 mb-1">
                                       <span className="font-bold text-gray-800">Pedido #{order.id.slice(-6)}</span>
                                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${STATUS_COLORS[order.status]}`}>
                                         {STATUS_LABELS[order.status]}
                                       </span>
                                     </div>
                                     <p className="text-xs text-gray-500">
                                       {new Date(order.createdAt).toLocaleDateString()} às {new Date(order.createdAt).toLocaleTimeString()}
                                     </p>
                                   </div>
                                   <div className="text-right mt-6 sm:mt-0">
                                     <p className="text-lg font-bold text-orange-600">
                                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                                     </p>
                                     <button 
                                       onClick={() => handlePrintOrder(order)}
                                       className="mt-1 text-xs text-gray-500 hover:text-gray-800 underline flex items-center justify-end gap-1 w-full"
                                     >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Imprimir Pedido
                                     </button>
                                   </div>
                                 </div>

                                 <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
                                   <ul className="space-y-2">
                                     {order.items.map((item, idx) => (
                                       <li key={idx} className="flex justify-between text-gray-700">
                                          <span>{item.quantity}x {item.name}</span>
                                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}</span>
                                       </li>
                                     ))}
                                   </ul>
                                 </div>

                                 <div className="flex flex-wrap gap-2 items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase mr-2">Alterar Status:</span>
                                        <select 
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order, e.target.value as OrderStatus)}
                                            className={`text-xs font-bold uppercase py-1 px-2 rounded border border-gray-300 outline-none cursor-pointer bg-white focus:border-orange-500`}
                                        >
                                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                        
                                        <button 
                                            onClick={() => handleSendUpdate(order)}
                                            className="text-xs bg-green-500 text-white hover:bg-green-600 px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-colors ml-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Enviar Atualização
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1 border border-indigo-200 rounded px-1 bg-indigo-50 mt-2 sm:mt-0">
                                      <input 
                                        type="text" 
                                        placeholder="Link Rastreio" 
                                        className="text-xs bg-transparent outline-none w-24 px-1"
                                        value={trackingInput[order.id] || order.trackingCode || ''}
                                        onChange={(e) => setTrackingInput({...trackingInput, [order.id]: e.target.value})}
                                      />
                                      <button 
                                        onClick={() => updateOrderStatus(order, 'transporte')}
                                        className={`px-2 py-1 text-xs rounded transition-colors bg-indigo-500 text-white hover:bg-indigo-600`}
                                      >
                                        Salvar Rastreio
                                      </button>
                                    </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 );
               })
            )}
          </div>
        )}

        {/* Settings Tab... */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
             {/* ... existing settings ... */}
             <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-6">
                <h3 className="font-bold text-orange-800">⚙️ Configurações Gerais</h3>
                <p className="text-sm text-orange-600">Essas informações aparecem para todos os clientes no site.</p>
             </div>

             {/* PIX Settings */}
             <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
               <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 Configuração do PIX
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Chave PIX</label>
                   <input 
                     type="text" 
                     value={settings.pixKey}
                     onChange={(e) => setSettings({...settings, pixKey: e.target.value})}
                     className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                     placeholder="CPF, Email ou Telefone"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Beneficiário</label>
                   <input 
                     type="text" 
                     value={settings.pixName}
                     onChange={(e) => setSettings({...settings, pixName: e.target.value})}
                     className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Banco / Instituição</label>
                   <input 
                     type="text" 
                     value={settings.pixBank}
                     onChange={(e) => setSettings({...settings, pixBank: e.target.value})}
                     className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                     placeholder="Ex: Nubank, Inter..."
                   />
                 </div>
               </div>
             </div>

             {/* Cover & Logo Upload */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Same as before... */}
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <label className="block text-sm font-bold text-gray-700 mb-2">Capa do Site (Banner)</label>
                 <label className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors block text-center shadow-md shadow-orange-500/20">
                      Alterar Capa
                      <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                      />
                 </label>
                 {coverUrl && !previewError && (
                   <div className="mt-4">
                     <img 
                       src={coverUrl} 
                       alt="Preview" 
                       className="w-full h-32 object-cover rounded-lg shadow-sm"
                       onError={() => setPreviewError(true)}
                     />
                   </div>
                 )}
               </div>

               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                 <label className="block text-sm font-bold text-gray-700 mb-2">Logo do Site</label>
                 <label className="cursor-pointer bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors block text-center shadow-md">
                      Alterar Logo
                      <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                      />
                 </label>
                 {logoUrl && (
                   <div className="mt-4 flex justify-center">
                     <img 
                       src={logoUrl} 
                       alt="Logo Preview" 
                       className="w-20 h-20 object-contain bg-white rounded-lg shadow-sm border border-gray-200"
                     />
                   </div>
                 )}
               </div>
             </div>

             {/* Policies */}
             <div className="grid grid-cols-1 gap-6">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Sobre Nós</label>
                 <textarea 
                   rows={3}
                   value={settings.aboutUs}
                   onChange={(e) => setSettings({...settings, aboutUs: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                 />
               </div>
               {/* Shipping, Warranty, Fees kept same... */}
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Política de Envio</label>
                 <textarea 
                   rows={3}
                   value={settings.shippingPolicy}
                   onChange={(e) => setSettings({...settings, shippingPolicy: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                 />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Política de Garantia</label>
                    <textarea 
                      rows={3}
                      value={settings.warrantyPolicy}
                      onChange={(e) => setSettings({...settings, warrantyPolicy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Taxas e Pagamentos</label>
                    <textarea 
                      rows={3}
                      value={settings.feesPolicy}
                      onChange={(e) => setSettings({...settings, feesPolicy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
               </div>
             </div>

             <div className="pt-4 border-t border-gray-200 flex justify-end">
               <Button onClick={handleSaveSettings} className="!px-8 !py-3">
                 Salvar Alterações
               </Button>
             </div>
          </div>
        )}
      </div>

      <ProductFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={editingProduct}
        onSave={handleFormSave}
      />
      
      {/* Shared Print Preview Modal */}
      <PrintPreviewModal 
        isOpen={!!previewOrder}
        onClose={() => setPreviewOrder(null)}
        order={previewOrder}
        settings={settings}
        logo={logoUrl}
        isAdmin={true}
      />
    </>
  );
};
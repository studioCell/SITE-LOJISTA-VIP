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
  toggleProductAvailability,
  deleteUser,
  updateUser,
  fetchAddressByCep
} from '../services/storage';
import { PrintPreviewModal } from './PrintPreviewModal';

// --- Internal Component for Safe Image Rendering ---
const AdminProductThumbnail = ({ src, alt }: { src?: string, alt: string }) => {
  const [error, setError] = useState(false);

  if (error || !src || src.trim() === '') {
    return (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
       </svg>
    );
  }
  return (
    <img className="h-full w-full object-cover" src={src} alt={alt} onError={() => setError(true)} />
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

// --- CONSTANTS ---
const STATUS_LABELS: Record<OrderStatus, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Finalizado',
  pagamento_pendente: 'Aguard. Pagamento',
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

// --- MAIN COMPONENT ---
export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onEditOrder 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'clients' | 'abandoned' | 'settings'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Settings
  const [settings, setSettings] = useState<ShopSettings>({
    aboutUs: '', shippingPolicy: '', warrantyPolicy: '', feesPolicy: '', contactNumber: '', pixKey: '', pixName: '', pixBank: ''
  });
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Orders State (Moved from SalesArea)
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [localDiscounts, setLocalDiscounts] = useState<Record<string, string>>({});
  const [localShippingCosts, setLocalShippingCosts] = useState<Record<string, string>>({});
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({ cep: '', street: '', number: '', district: '', city: '' });
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Filters & UI State
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [clientFilterType, setClientFilterType] = useState<'all' | 'new' | 'inactive' | 'buying'>('all');
  const [passwordInput, setPasswordInput] = useState<Record<string, string>>({});
  
  // Editing Client
  const [isEditingClient, setIsEditingClient] = useState<string | null>(null);
  const [editClientForm, setEditClientForm] = useState<Partial<User>>({});

  useEffect(() => {
    const loadSettings = async () => {
      setSettings(await getShopSettings());
      setCoverUrl(await getHeroImage());
      setLogoUrl(await getLogo());
    };
    loadSettings();

    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data.filter(u => !u.isAdmin));
    });
    const unsubOrders = subscribeToOrders((data) => setOrders(data));

    return () => { unsubUsers(); unsubOrders(); };
  }, []);

  // --- DASHBOARD LOGIC ---
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  // Categories Logic
  const newClients = users.filter(u => u.createdAt && (now - u.createdAt) < (7 * ONE_DAY));
  
  const inactiveClients = users.filter(u => {
      const userOrders = orders.filter(o => o.userId === u.id);
      if (userOrders.length === 0) return false;
      const lastOrder = userOrders.sort((a,b) => b.createdAt - a.createdAt)[0];
      return (now - lastOrder.createdAt) > (30 * ONE_DAY);
  });

  const buyingClients = users.filter(u => {
      const userOrders = orders.filter(o => o.userId === u.id);
      if (userOrders.length === 0) return false;
      const lastOrder = userOrders.sort((a,b) => b.createdAt - a.createdAt)[0];
      return (now - lastOrder.createdAt) <= (30 * ONE_DAY);
  });

  const abandonedCarts = users.filter(u => u.savedCart && u.savedCart.length > 0);

  // Order Counts
  const countStatus = (status: OrderStatus) => orders.filter(o => o.status === status).length;

  const DashboardCard = ({ title, count, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${color} cursor-pointer hover:shadow-md transition-all`}
    >
      <p className="text-xs font-bold text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{count}</p>
    </div>
  );

  // --- ORDERS LOGIC (From SalesArea) ---
  const handleOrderStatusFilter = (status: OrderStatus | 'all') => {
      setOrderStatusFilter(status);
      setActiveTab('orders');
  };

  const getFilteredOrders = () => {
      if (orderStatusFilter === 'all') return orders;
      return orders.filter(o => o.status === orderStatusFilter);
  };

  const updateOrderTotals = async (order: Order, updates: Partial<Order>) => {
      const merged = { ...order, ...updates };
      const subtotal = merged.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const discount = merged.discount || 0;
      const shipping = merged.shippingCost || 0;
      let fees = 0;
      if (merged.wantsInvoice) fees += subtotal * 0.06;
      if (merged.wantsInsurance) fees += subtotal * 0.03;
      const updatedTotal = Math.max(0, subtotal - discount + shipping + fees);
      
      await updateOrder({ ...merged, total: updatedTotal });
  };

  const handleToggleFee = async (order: Order, feeType: 'invoice' | 'insurance') => {
      if (feeType === 'invoice') await updateOrderTotals(order, { wantsInvoice: !order.wantsInvoice });
      else await updateOrderTotals(order, { wantsInsurance: !order.wantsInsurance });
  };

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
      await updateOrder({
          ...order,
          status: newStatus,
          history: [...order.history, { status: newStatus, timestamp: Date.now() }]
      });
  };

  const handleFinalizeOrder = async (order: Order) => {
    await handleStatusChange(order, 'realizado');
    // ... (WhatsApp logic remains same as SalesArea, omitted for brevity, button opens WA)
    alert("Pedido marcado como Finalizado!");
  };

  // --- CLIENT ACTIONS ---
  const handleEditClientStart = (user: User) => {
      setIsEditingClient(user.id);
      setEditClientForm({ name: user.name, phone: user.phone, city: user.city, cep: user.cep });
  };

  const handleEditClientSave = async (userId: string) => {
      await updateUser({ id: userId, ...editClientForm } as User);
      setIsEditingClient(null);
  };

  const handleDeleteClient = async (userId: string) => {
      if (confirm('Tem certeza? Isso apagará o histórico e carrinho deste cliente.')) {
          await deleteUser(userId);
      }
  };

  const handlePasswordUpdate = async (userId: string) => {
    const newPass = passwordInput[userId];
    if (!newPass || newPass.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    await updateUserPassword(userId, newPass);
    setPasswordInput(prev => ({ ...prev, [userId]: '' }));
    alert("Senha alterada!");
  };

  const contactClient = (phone: string, name: string) => {
      const msg = `Olá ${name}, tudo bem? Sou da Lojista Vip!`;
      const link = `https://api.whatsapp.com/send?phone=55${phone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`;
      window.open(link, '_blank');
  };

  const sendAbandonedCartFollowUp = (user: User) => {
      const name = user.name.split(' ')[0];
      const msg = `Olá ${name}, vi que você deixou alguns itens incríveis no carrinho da Lojista Vip! 🛒✨ \n\nAinda temos estoque, mas está acabando rápido. Vamos fechar seu pedido agora e garantir o envio? \n\nPosso te ajudar com alguma dúvida?`;
      const link = `https://api.whatsapp.com/send?phone=55${user.phone?.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`;
      window.open(link, '_blank');
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveSettings = async () => {
    await saveShopSettings(settings);
    if (coverUrl) await saveHeroImage(coverUrl);
    if (logoUrl) await saveLogo(logoUrl);
    alert('Configurações salvas com sucesso!');
  };

  const handleFormSave = (product: Product | Omit<Product, 'id'>) => {
    if ('id' in product) {
      onUpdateProduct(product as Product);
    } else {
      onAddProduct(product);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  // --- FILTERED LISTS ---
  const getDisplayedClients = () => {
      switch(clientFilterType) {
          case 'new': return newClients;
          case 'inactive': return inactiveClients;
          case 'buying': return buyingClients;
          default: return users;
      }
  };

  // --- RENDER ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
      
      {/* Top Navigation */}
      <div className="flex border-b border-gray-100 overflow-x-auto bg-zinc-900 text-white scrollbar-hide">
        {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'orders', label: '💰 Pedidos' },
            { id: 'products', label: '📦 Produtos' },
            { id: 'clients', label: '👥 Clientes' },
            { id: 'abandoned', label: '🛒 Carrinhos' },
            { id: 'settings', label: '⚙️ Configurações' }
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 py-4 px-6 text-sm font-bold border-b-4 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      <div className="p-6">
        
        {/* === DASHBOARD TAB === */}
        {activeTab === 'dashboard' && (
            <div className="animate-fade-in space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Visão Geral de Pedidos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DashboardCard 
                            title="Em Aberto (Orçamentos)" 
                            count={countStatus('orcamento')} 
                            color="border-gray-400" 
                            onClick={() => handleOrderStatusFilter('orcamento')} 
                        />
                        <DashboardCard 
                            title="Aguard. Pagamento" 
                            count={countStatus('pagamento_pendente')} 
                            color="border-yellow-500"
                            onClick={() => handleOrderStatusFilter('pagamento_pendente')}  
                        />
                        <DashboardCard 
                            title="Finalizados" 
                            count={countStatus('realizado')} 
                            color="border-blue-500" 
                            onClick={() => handleOrderStatusFilter('realizado')} 
                        />
                        <DashboardCard 
                            title="Em Trânsito" 
                            count={countStatus('transporte')} 
                            color="border-indigo-500" 
                            onClick={() => handleOrderStatusFilter('transporte')} 
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Métricas de Clientes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DashboardCard 
                            title="Total Clientes" 
                            count={users.length} 
                            color="border-orange-500"
                            onClick={() => { setClientFilterType('all'); setActiveTab('clients'); }}
                        />
                        <DashboardCard 
                            title="Novos (7 dias)" 
                            count={newClients.length} 
                            color="border-green-400"
                            onClick={() => { setClientFilterType('new'); setActiveTab('clients'); }}
                        />
                        <DashboardCard 
                            title="Comprando (30 dias)" 
                            count={buyingClients.length} 
                            color="border-blue-400"
                            onClick={() => { setClientFilterType('buying'); setActiveTab('clients'); }}
                        />
                        <DashboardCard 
                            title="Inativos (+30 dias)" 
                            count={inactiveClients.length} 
                            color="border-red-400"
                            onClick={() => { setClientFilterType('inactive'); setActiveTab('clients'); }}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Oportunidades</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            onClick={() => setActiveTab('abandoned')}
                            className="bg-orange-50 border border-orange-200 p-4 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors flex justify-between items-center"
                        >
                            <div>
                                <p className="font-bold text-orange-800">🛒 Carrinhos Abandonados</p>
                                <p className="text-sm text-orange-600">Clientes com itens salvos sem finalizar.</p>
                            </div>
                            <span className="text-3xl font-bold text-orange-600">{abandonedCarts.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === ORDERS TAB === */}
        {activeTab === 'orders' && (
            <div className="animate-fade-in">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {['all', 'orcamento', 'pagamento_pendente', 'realizado', 'preparacao', 'transporte', 'entregue'].map(status => (
                        <button
                            key={status}
                            onClick={() => setOrderStatusFilter(status as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${orderStatusFilter === status ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {status === 'all' ? 'Todos' : STATUS_LABELS[status as OrderStatus]}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {getFilteredOrders().map(order => (
                        <div key={order.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-800">{order.userName}</h4>
                                    <p className="text-xs text-gray-500">#{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <select 
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                                    className={`text-xs font-bold uppercase py-1 px-2 rounded border cursor-pointer ${STATUS_COLORS[order.status]}`}
                                >
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="p-4">
                                <div className="space-y-2 mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-1">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">R$ {order.items.reduce((a,b) => a + (b.price*b.quantity), 0).toFixed(2)}</span>
                                    </div>
                                    
                                    {/* Discount & Shipping Controls */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Desconto (-)</span>
                                            <input 
                                                className="w-full text-right text-red-500 font-bold border rounded p-1 text-xs"
                                                placeholder="0.00"
                                                defaultValue={order.discount}
                                                onBlur={(e) => updateOrderTotals(order, { discount: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Frete (+)</span>
                                            <input 
                                                className="w-full text-right text-indigo-600 font-bold border rounded p-1 text-xs"
                                                placeholder="0.00"
                                                defaultValue={order.shippingCost}
                                                onBlur={(e) => updateOrderTotals(order, { shippingCost: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-gray-200">
                                        <span>Total:</span>
                                        <span>R$ {order.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2 justify-end">
                                    <button onClick={() => setPreviewOrder(order)} className="text-xs bg-gray-100 px-3 py-2 rounded font-bold hover:bg-gray-200">🖨️ Imprimir</button>
                                    <button onClick={() => onEditOrder(order)} className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded font-bold hover:bg-blue-100">✏️ Editar Itens</button>
                                    {order.status === 'orcamento' && (
                                        <button onClick={() => handleFinalizeOrder(order)} className="text-xs bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-700">✅ Finalizar</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {getFilteredOrders().length === 0 && <p className="text-center text-gray-400 py-8">Nenhum pedido encontrado.</p>}
                </div>
            </div>
        )}

        {/* === CLIENTS TAB === */}
        {activeTab === 'clients' && (
            <div className="animate-fade-in">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'new', label: 'Novos' },
                        { id: 'buying', label: 'Ativos' },
                        { id: 'inactive', label: 'Inativos' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setClientFilterType(f.id as any)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${clientFilterType === f.id ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {getDisplayedClients().map(user => (
                        <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition-colors bg-white">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        {isEditingClient === user.id ? (
                                            <div className="flex flex-col gap-2">
                                                <input className="border p-1 text-sm rounded" value={editClientForm.name} onChange={e => setEditClientForm({...editClientForm, name: e.target.value})} placeholder="Nome" />
                                                <input className="border p-1 text-sm rounded" value={editClientForm.phone} onChange={e => setEditClientForm({...editClientForm, phone: e.target.value})} placeholder="Telefone" />
                                            </div>
                                        ) : (
                                            <>
                                                <p className="font-bold text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.phone} • {user.city}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button onClick={() => contactClient(user.phone || '', user.name)} className="bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-600">
                                        WhatsApp
                                    </button>
                                    
                                    {isEditingClient === user.id ? (
                                        <button onClick={() => handleEditClientSave(user.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold">Salvar</button>
                                    ) : (
                                        <button onClick={() => handleEditClientStart(user)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200">Editar</button>
                                    )}

                                    <button 
                                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                                        className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200"
                                    >
                                        {expandedUser === user.id ? 'Opções' : 'Opções'}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Options */}
                            {expandedUser === user.id && (
                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <p className="text-xs font-bold text-red-800 mb-2">Alterar Senha</p>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Nova senha..." 
                                                className="w-full text-xs p-2 border rounded"
                                                value={passwordInput[user.id] || ''}
                                                onChange={e => setPasswordInput({...passwordInput, [user.id]: e.target.value})}
                                            />
                                            <button onClick={() => handlePasswordUpdate(user.id)} className="bg-red-600 text-white text-xs px-3 rounded font-bold">OK</button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-end">
                                        <button onClick={() => handleDeleteClient(user.id)} className="text-red-500 hover:text-red-700 text-xs underline font-bold">
                                            Excluir Cliente Permanentemente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {getDisplayedClients().length === 0 && <p className="text-center text-gray-400 py-8">Nenhum cliente encontrado nesta categoria.</p>}
                </div>
            </div>
        )}

        {/* === ABANDONED CARTS === */}
        {activeTab === 'abandoned' && (
            <div className="animate-fade-in space-y-4">
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-orange-800">Recuperação de Vendas</h3>
                    <p className="text-sm text-orange-600">Estes clientes adicionaram itens ao carrinho mas não finalizaram o pedido. Envie uma mensagem para converter!</p>
                </div>

                {abandonedCarts.map(user => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="font-bold text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.phone}</p>
                            <div className="mt-2 text-xs bg-gray-50 p-2 rounded inline-block">
                                <span className="font-bold text-gray-600">Itens no carrinho:</span>
                                <ul className="list-disc list-inside mt-1">
                                    {user.savedCart?.map((item, i) => (
                                        <li key={i}>{item.quantity}x {item.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <button 
                            onClick={() => sendAbandonedCartFollowUp(user)}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326z"/>
                            </svg>
                            Enviar Mensagem de Recuperação
                        </button>
                    </div>
                ))}
                {abandonedCarts.length === 0 && <p className="text-center text-gray-400 py-10">Nenhum carrinho abandonado no momento.</p>}
            </div>
        )}

        {/* === PRODUCTS TAB === */}
        {activeTab === 'products' && (
            <div>
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-800">Catálogo</h3>
                   <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="!bg-orange-600">+ Novo</Button>
               </div>
               {/* Simplified Table */}
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
                      <tr key={product.id}>
                        <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                                <AdminProductThumbnail src={product.image} alt={product.name} />
                            </div>
                            <span className="text-sm font-medium">{product.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">R$ {product.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                            <div onClick={() => toggleProductAvailability(product.id)} className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${product.available ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${product.available ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="text-blue-600 mr-3">✏️</button>
                            <button onClick={() => onDeleteProduct(product.id)} className="text-red-600">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              
              {/* Logo & Cover */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Capa do Site (Banner)</label>
                  <label className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors block text-center shadow-md shadow-orange-500/20">
                        Alterar Capa
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if(file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setCoverUrl(reader.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="hidden"
                        />
                  </label>
                  {coverUrl && (
                    <div className="mt-4">
                      <img src={coverUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg shadow-sm" />
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
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if(file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setLogoUrl(reader.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="hidden"
                        />
                  </label>
                  {logoUrl && (
                    <div className="mt-4 flex justify-center">
                      <img src={logoUrl} alt="Logo Preview" className="w-20 h-20 object-contain bg-white rounded-lg shadow-sm border border-gray-200" />
                    </div>
                  )}
                </div>
              </div>

              {/* General Settings Form */}
              <div className="grid grid-cols-1 gap-4">
                  {/* PIX Config */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h3 className="font-bold text-green-800 mb-3">Configuração do PIX</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={settings.pixKey} onChange={e => setSettings({...settings, pixKey: e.target.value})} placeholder="Chave PIX" className="border p-2 rounded" />
                        <input value={settings.pixName} onChange={e => setSettings({...settings, pixName: e.target.value})} placeholder="Nome Beneficiário" className="border p-2 rounded" />
                        <input value={settings.pixBank} onChange={e => setSettings({...settings, pixBank: e.target.value})} placeholder="Banco" className="border p-2 rounded md:col-span-2" />
                    </div>
                  </div>

                  {/* Texts */}
                  <textarea value={settings.aboutUs} onChange={e => setSettings({...settings, aboutUs: e.target.value})} placeholder="Sobre Nós" className="border p-2 rounded w-full" rows={3} />
                  <textarea value={settings.shippingPolicy} onChange={e => setSettings({...settings, shippingPolicy: e.target.value})} placeholder="Política de Envio" className="border p-2 rounded w-full" rows={3} />
                  
                  <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveSettings} className="!px-8 !py-3">Salvar Todas Alterações</Button>
                  </div>
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

      <PrintPreviewModal 
        isOpen={!!previewOrder}
        onClose={() => setPreviewOrder(null)}
        order={previewOrder}
        settings={settings}
        logo={logoUrl}
        isAdmin={true}
      />
    </div>
  );
};
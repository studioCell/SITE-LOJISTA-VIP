import React, { useState, useEffect } from 'react';
import { Product, ShopSettings, User, Order, OrderStatus, Category, CartItem } from '../types';
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
  deleteOrder,
  getLogo,
  saveLogo,
  updateUserPassword,
  toggleProductAvailability,
  deleteUser,
  updateUser,
  addCategory,
  deleteCategory,
  deleteAllProducts,
  registerVendor,
  getCurrentUser
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

// --- Notification Toast Component (Improved) ---
const NotificationToast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 right-4 z-[100] animate-slide-in-right">
      <div className="bg-zinc-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-zinc-600 max-w-sm">
        <div className="bg-green-500/20 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <div>
            <p className="font-bold text-sm">Sucesso</p>
            <p className="text-xs text-gray-300">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white ml-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>
      <style>{`
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateDescription: (id: string, newDesc: string) => void;
  onEditOrder: (order: Order) => void; 
}

// --- CONSTANTS ---
const STATUS_LABELS: Record<string, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Finalizado', // Legacy/Manual
  pagamento_pendente: 'Aguard. Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Entregue',
  devolucao: 'Devolução'
};

const STATUS_STYLES: Record<string, string> = {
  orcamento: 'border-gray-500 text-gray-300',
  realizado: 'border-blue-500 text-blue-300',
  pagamento_pendente: 'border-yellow-500 text-yellow-300',
  preparacao: 'border-orange-500 text-orange-400', 
  transporte: 'border-purple-500 text-purple-300',
  entregue: 'border-green-500 text-green-400',
  devolucao: 'border-red-500 text-red-400',
  cancelado: 'border-red-900 text-red-500'
};

const STATUS_BG: Record<string, string> = {
  orcamento: 'bg-gray-500/10',
  realizado: 'bg-blue-500/10',
  pagamento_pendente: 'bg-yellow-500/10',
  preparacao: 'bg-orange-500/10',
  transporte: 'bg-purple-500/10',
  entregue: 'bg-green-500/10',
  devolucao: 'bg-red-500/10',
  cancelado: 'bg-red-900/10'
};

// --- MAIN COMPONENT ---
export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  categories,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onEditOrder 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'clients' | 'abandoned' | 'settings' | 'vendors'>('orders');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Notification State
  const [notification, setNotification] = useState<string | null>(null);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Settings
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'Lojista Vip', minOrderValue: 20,
    aboutUs: '', shippingPolicy: '', warrantyPolicy: '', feesPolicy: '', contactNumber: '', pixKey: '', pixName: '', pixBank: ''
  });
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Orders State
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Tracking Code Input State
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});

  // Clients Tab State
  const [expandedUser, setExpandedUser] = useState<string | null>(null); // For history
  const [editingUser, setEditingUser] = useState<User | null>(null); // For edit modal
  
  // Vendor Management State
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorPass, setNewVendorPass] = useState('');
  
  // Category Management State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Password Update (Vendors/Clients)
  const [passwordInput, setPasswordInput] = useState<Record<string, string>>({});

  // Delete Confirmation State (UI-based)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const s = await getShopSettings();
      setSettings(s);
      setCoverUrl(await getHeroImage());
      setLogoUrl(await getLogo());
      setCurrentUser(getCurrentUser());
    };
    loadSettings();

    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data.filter(u => !u.isAdmin && !u.isVendor));
      setVendors(data.filter(u => u.isVendor));
    });
    const unsubOrders = subscribeToOrders((data) => setOrders(data));

    return () => { unsubUsers(); unsubOrders(); };
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
  };

  const isVendor = currentUser?.isVendor || false;

  // --- DASHBOARD LOGIC REFINED ---
  
  // 1. Definição de Status "Pagos" (Vendas confirmadas)
  const paidStatuses: OrderStatus[] = ['realizado', 'preparacao', 'transporte', 'entregue'];
  
  // 2. Filtro Inicial
  const relevantOrders = isVendor 
    ? orders.filter(o => o.sellerId === currentUser?.id)
    : orders;

  const paidOrders = relevantOrders.filter(o => paidStatuses.includes(o.status));

  // 3. Métricas de Hoje
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  const todayStart = todayDate.getTime();
  
  const todayOrders = paidOrders.filter(o => o.createdAt >= todayStart);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const todayOrderCount = todayOrders.length;

  // 4. Ticket Médio (Total / Qtd)
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);
  const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // 5. Pedidos Pendentes (Atenção)
  // Consideramos 'pagamento_pendente' e 'preparacao' como itens que exigem ação
  const pendingCount = relevantOrders.filter(o => ['pagamento_pendente', 'preparacao'].includes(o.status)).length;

  // 6. Dados do Gráfico (Últimos 7 dias)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); // -6 to 0 (today)
      d.setHours(0,0,0,0);
      return d;
  });

  const graphData = last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      const dayTotal = paidOrders
        .filter(o => o.createdAt >= date.getTime() && o.createdAt < nextDay.getTime())
        .reduce((acc, o) => acc + o.total, 0);
        
      return {
          label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
          amount: dayTotal
      };
  });
  const maxGraphValue = Math.max(...graphData.map(d => d.amount), 100); // Prevent div by zero

  // 7. Top Produtos (Mais Vendidos)
  const productStats: Record<string, { name: string, qty: number, revenue: number }> = {};
  paidOrders.forEach(order => {
      order.items.forEach(item => {
          if (!productStats[item.id]) {
              productStats[item.id] = { name: item.name, qty: 0, revenue: 0 };
          }
          productStats[item.id].qty += item.quantity;
          productStats[item.id].revenue += (item.price * item.quantity);
      });
  });
  const topProducts = Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

  // --- ORDERS LOGIC ---
  const groupOrdersByDate = (ordersList: Order[]) => {
      const todayStr = new Date().toLocaleDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString();

      const groups = {
          today: [] as Order[],
          yesterday: [] as Order[],
          older: [] as Order[]
      };

      ordersList.forEach(order => {
          const dateStr = new Date(order.createdAt).toLocaleDateString();
          if (dateStr === todayStr) groups.today.push(order);
          else if (dateStr === yesterdayStr) groups.yesterday.push(order);
          else groups.older.push(order);
      });

      return groups;
  };

  const updateOrderTotals = async (order: Order, updates: Partial<Order>) => {
      if (isVendor) {
          alert("Vendedores não podem alterar valores.");
          return;
      }
      const merged = { ...order, ...updates };
      const subtotal = merged.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const discount = merged.discount || 0;
      const shipping = merged.shippingCost || 0;
      let fees = 0;
      if (merged.wantsInvoice) fees += subtotal * 0.06;
      if (merged.wantsInsurance) fees += subtotal * 0.03;
      const updatedTotal = Math.max(0, subtotal - discount + shipping + fees);
      
      await updateOrder({ ...merged, total: updatedTotal });
      showNotification('Valores atualizados com sucesso!');
  };

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
      try {
          const history = Array.isArray(order.history) ? [...order.history] : [];
          history.push({ status: newStatus, timestamp: Date.now() });

          await updateOrder({
              ...order,
              status: newStatus,
              history: history
          });
          showNotification(`Status alterado para: ${STATUS_LABELS[newStatus]}`);
      } catch (e) {
          console.error("Falha ao atualizar status", e);
          alert("Erro ao atualizar status. Tente novamente.");
      }
  };

  // --- WORKFLOW BUTTONS ACTIONS ---

  const handleFinalizeSale = async (order: Order) => {
      if (order.status !== 'orcamento') return;
      await handleStatusChange(order, 'pagamento_pendente');
  };

  const handleConfirmPayment = async (order: Order) => {
      if (order.status !== 'pagamento_pendente') return;
      await handleStatusChange(order, 'preparacao');
  };

  const handleDeleteOrder = async (orderId: string) => {
      console.log("AdminPanel: Executing deleteOrder for", orderId);
      
      // Removed window.confirm to rely on the UI button state confirmation
      const success = await deleteOrder(orderId);
      
      if (success) {
          showNotification('Pedido excluído permanentemente.');
          setExpandedOrderId(null);
      } 
      // Error handling is inside deleteOrder service (including permission alert)
  };

  const handleSendBudgetWhatsapp = (order: Order) => {
      const name = order.userName.split(' ')[0];
      const itemsList = order.items.map(i => `${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})`).join('\n');
      const subtotal = order.items.reduce((a,b) => a + b.price*b.quantity, 0);
      
      const message = `*ORÇAMENTO LOJISTA VIP* 📝
      
Olá ${name}, segue seu orçamento:

${itemsList}

Subtotal: R$ ${subtotal.toFixed(2)}
Frete (${order.shippingMethod || 'A combinar'}): R$ ${(order.shippingCost || 0).toFixed(2)}
Desconto: - R$ ${(order.discount || 0).toFixed(2)}
----------------------------
*TOTAL: R$ ${order.total.toFixed(2)}*

*Endereço de Entrega:*
${order.userStreet}, ${order.userNumber} - ${order.userDistrict}
${order.userCity}

Aguardamos sua aprovação!`;

      const encoded = encodeURIComponent(message);
      const phoneNumber = order.userPhone.replace(/\D/g, '');
      window.open(`https://api.whatsapp.com/send?phone=55${phoneNumber}&text=${encoded}`, '_blank');
  };

  const handleSendReceiptWhatsapp = (order: Order) => {
      const name = order.userName.split(' ')[0];
      const message = `*RECIBO DE PAGAMENTO - LOJISTA VIP* ✅
      
Olá ${name}, confirmamos o pagamento do seu pedido!

*Pedido:* #${order.id.slice(-6)}
*Valor Pago:* R$ ${order.total.toFixed(2)}
*Status:* ${STATUS_LABELS[order.status]}

Em breve enviaremos o código de rastreio. Obrigado pela preferência!`;

      const encoded = encodeURIComponent(message);
      const phoneNumber = order.userPhone.replace(/\D/g, '');
      window.open(`https://api.whatsapp.com/send?phone=55${phoneNumber}&text=${encoded}`, '_blank');
  };

  // STEP 1: Preparation -> Transport (Dispatch)
  const handleDispatchOrder = async (order: Order) => {
      await updateOrder({
          ...order,
          status: 'transporte',
          history: [...(order.history || []), { status: 'transporte', timestamp: Date.now() }]
      });
      showNotification('Mercadoria Despachada! Pedido agora está "Em Trânsito".');
      setOrderStatusFilter('transporte'); // Auto-switch tab
  };

  // STEP 2: Save Tracking
  const handleSaveTracking = async (order: Order) => {
      const code = trackingInput[order.id];
      if (!code) return;
      await updateOrder({ ...order, trackingCode: code });
      showNotification('Código de rastreio salvo!');
  };

  // STEP 3: Send Tracking WhatsApp
  const handleSendTrackingWhatsapp = (order: Order) => {
      const code = trackingInput[order.id] || order.trackingCode || '';
      if (!code) {
          alert("Digite o código de rastreio primeiro.");
          return;
      }
      
      // Save it if strictly new input
      if (trackingInput[order.id]) handleSaveTracking(order);

      const name = order.userName.split(' ')[0];
      const message = `Olá ${name}, sua mercadoria foi despachada! 🚚\n\nAcompanhe seu pedido pelo código de rastreio: *${code}*\n\nOu pelo link: https://rastreamento.correios.com.br/app/index.php?objeto=${code}`;
      
      const encoded = encodeURIComponent(message);
      const phoneNumber = order.userPhone.replace(/\D/g, '');
      window.open(`https://api.whatsapp.com/send?phone=55${phoneNumber}&text=${encoded}`, '_blank');
      showNotification('WhatsApp de rastreio aberto!');
  };

  // STEP 4: Transport -> Delivered
  const handleMarkDelivered = async (order: Order) => {
      await updateOrder({
          ...order,
          status: 'entregue',
          history: [...(order.history || []), { status: 'entregue', timestamp: Date.now() }]
      });
      showNotification('Pedido marcado como ENTREGUE! ✅');
      setOrderStatusFilter('entregue');
  };

  // --- VENDOR MANAGEMENT ---
  const handleRegisterVendor = async () => {
      if (!newVendorName || !newVendorPhone || !newVendorPass) return;
      const res = await registerVendor(newVendorName, newVendorPhone, newVendorPass);
      showNotification(res.message);
      if (res.success) {
          setNewVendorName(''); setNewVendorPhone(''); setNewVendorPass('');
      }
  };

  // --- CLIENT ACTIONS ---
  const handleDeleteClient = async (userId: string) => {
      if (confirm('Tem certeza? Isso apagará o cliente.')) await deleteUser(userId);
  };

  const handleUpdateClient = async () => {
      if (!editingUser) return;
      await updateUser(editingUser);
      setEditingUser(null);
      showNotification('Cliente atualizado com sucesso!');
  }

  const handlePasswordUpdate = async (userId: string) => {
    const newPass = passwordInput[userId];
    if (!newPass || newPass.length < 6) return alert("Senha muito curta (mínimo 6 dígitos).");
    await updateUserPassword(userId, newPass);
    setPasswordInput(prev => ({ ...prev, [userId]: '' }));
    showNotification("Senha alterada com sucesso!");
  };

  // --- SETTINGS ---
  const handleSaveSettings = async () => {
    await saveShopSettings(settings);
    if (coverUrl) await saveHeroImage(coverUrl);
    if (logoUrl) await saveLogo(logoUrl);
    showNotification('Configurações salvas com sucesso!');
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFormSave = (product: Product | Omit<Product, 'id'>) => {
    if ('id' in product) onUpdateProduct(product as Product);
    else onAddProduct(product);
    setIsFormOpen(false);
    setEditingProduct(null);
    showNotification('Produto salvo!');
  };

  const handleAddCategory = async () => {
      if (!newCategoryName.trim()) return;
      await addCategory(newCategoryName);
      setNewCategoryName('');
      showNotification('Categoria criada!');
  };

  const handleDeleteCategory = async (id: string, name: string) => {
      if (confirm(`Apagar "${name}" e todos os produtos?`)) {
          await deleteCategory(id, name);
          showNotification('Categoria removida.');
      }
  };

  const handleClearDatabase = async () => {
      if (confirm('PERIGO: APAGAR TUDO?')) {
          await deleteAllProducts();
          showNotification('Banco de dados limpo.');
      }
  };
  
  // --- ABANDONED CART LOGIC ---
  const handleRecoverCart = (user: User) => {
      if (!user.savedCart || user.savedCart.length === 0) return;
      const name = user.name.split(' ')[0];
      const items = user.savedCart.map(i => `• ${i.quantity}x ${i.name}`).join('\n');
      const total = user.savedCart.reduce((a, b) => a + (b.price * b.quantity), 0);
      
      const message = `Olá ${name}! 👋\n\nNotamos que você esqueceu alguns itens incríveis no seu carrinho:\n\n${items}\n\n*Total: R$ ${total.toFixed(2)}*\n\nPodemos ajudar a finalizar seu pedido? 😊`;
      
      const encoded = encodeURIComponent(message);
      const phone = user.phone ? user.phone.replace(/\D/g, '') : '';
      window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encoded}`, '_blank');
  };

  // --- FILTERED LISTS ---
  const filteredOrders = relevantOrders.filter(o => {
      if (orderStatusFilter === 'all') {
          return o.status !== 'cancelado'; 
      }
      return o.status === orderStatusFilter;
  });

  const groupedOrders = groupOrdersByDate(filteredOrders);
  
  const abandonedCarts = users.filter(u => u.savedCart && u.savedCart.length > 0);

  // --- RENDER ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] relative">
      
      {/* Toast Notification Container */}
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}

      {/* Top Navigation */}
      <div className="flex border-b border-gray-100 overflow-x-auto bg-zinc-900 text-white scrollbar-hide">
        {[
            { id: 'dashboard', label: '📊 Dashboard', show: true },
            { id: 'orders', label: '💰 Minhas Vendas', show: true },
            { id: 'products', label: '📦 Produtos', show: !isVendor },
            { id: 'clients', label: '👥 Clientes', show: !isVendor },
            { id: 'vendors', label: '👔 Vendedores', show: !isVendor },
            { id: 'abandoned', label: '🛒 Carrinhos Abandonados', show: !isVendor },
            { id: 'settings', label: '⚙️ Configurações', show: !isVendor }
        ].filter(t => t.show).map(tab => (
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
        
        {/* === DASHBOARD TAB (Redesigned) === */}
        {activeTab === 'dashboard' && (
            <div className="animate-fade-in space-y-8">
                
                {/* 1. Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Vendas Hoje (Confirmadas) */}
                    <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-5 rounded-xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold opacity-80 uppercase tracking-wide">Vendas Hoje</p>
                                <p className="text-3xl font-extrabold mt-1">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
                                </p>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs opacity-70 mt-2 font-medium">{todayOrderCount} pedidos pagos</p>
                    </div>

                    {/* Ticket Médio */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ticket Médio</p>
                                <p className="text-2xl font-extrabold mt-1 text-gray-800">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageTicket)}
                                </p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Média por pedido</p>
                    </div>

                    {/* Pedidos Pendentes (Atenção) */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Aguardando Ação</p>
                                <p className="text-2xl font-extrabold mt-1 text-orange-600">
                                    {pendingCount}
                                </p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Pagamento ou Envio</p>
                    </div>

                    {/* Total Clientes */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Base de Clientes</p>
                                <p className="text-2xl font-extrabold mt-1 text-gray-800">
                                    {users.length}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Cadastrados no app</p>
                    </div>
                </div>

                {/* 2. Main Chart & Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Chart: Last 7 Days Revenue */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            📊 Receita (Últimos 7 dias)
                        </h3>
                        <div className="flex items-end justify-between h-48 gap-3 sm:gap-6">
                            {graphData.map((d, i) => {
                                const heightPercent = (d.amount / maxGraphValue) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                                        {/* Tooltip on hover */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.amount)}
                                        </div>
                                        
                                        <div 
                                            className="w-full bg-indigo-50 border-t-2 border-indigo-200 hover:bg-indigo-500 hover:border-indigo-600 rounded-t-lg transition-all duration-300 relative group-hover:shadow-lg"
                                            style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                        ></div>
                                        <span className="text-[10px] text-gray-400 mt-2 font-medium uppercase">{d.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Products List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            🏆 Top Produtos
                        </h3>
                        <div className="flex-grow overflow-y-auto">
                            {topProducts.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Sem vendas suficientes.</p>
                            ) : (
                                <div className="space-y-4">
                                    {topProducts.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-700' : 'bg-gray-200 text-gray-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <p className="text-sm text-gray-700 font-medium truncate max-w-[120px]" title={p.name}>{p.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-800">{p.qty} un</p>
                                                <p className="text-[10px] text-gray-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Recent Activity (Latest Paid Orders) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">📋 Últimos Pedidos Confirmados</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-sm text-blue-600 hover:underline">Ver todos</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paidOrders.slice(0, 5).map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{order.userName}</div>
                                            <div className="text-xs text-gray-500">#{order.id.slice(-6)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_BG[order.status]} ${STATUS_STYLES[order.status].split(' ')[1]}`}>
                                                {STATUS_LABELS[order.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-800">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                                        </td>
                                    </tr>
                                ))}
                                {paidOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                                            Nenhum pedido confirmado recentemente.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* === ORDERS TAB === */}
        {activeTab === 'orders' && (
            <div className="animate-fade-in">
                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {/* Removed 'cancelado' from list */}
                    {['all', 'orcamento', 'pagamento_pendente', 'preparacao', 'transporte', 'entregue'].map(status => (
                        <button
                            key={status}
                            onClick={() => setOrderStatusFilter(status as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${orderStatusFilter === status ? 'bg-zinc-800 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {status === 'all' ? 'Todos' : STATUS_LABELS[status]}
                        </button>
                    ))}
                </div>

                <div className="space-y-8">
                    {[
                        { title: '📅 HOJE', data: groupedOrders.today },
                        { title: '⏪ ONTEM', data: groupedOrders.yesterday },
                        { title: '📂 ANTERIORES', data: groupedOrders.older }
                    ].map(group => group.data.length > 0 && (
                        <div key={group.title}>
                            <h3 className="text-sm font-bold text-gray-400 mb-3 tracking-wider">{group.title} ({group.data.length})</h3>
                            <div className="space-y-4">
                                {group.data.map(order => {
                                    const isExpanded = expandedOrderId === order.id;
                                    const totalItems = order.items.reduce((a,b) => a + b.quantity, 0);
                                    
                                    // Calculate Delivered Time
                                    const deliveredHistory = (order.history || []).find(h => h.status === 'entregue');
                                    const deliveredTime = deliveredHistory ? new Date(deliveredHistory.timestamp).toLocaleString() : 'Data não registrada';

                                    // Permission Logic: 
                                    // - Admins can always Edit unless status is advanced, but they can ALWAYS Delete.
                                    // - Vendors cannot Edit/Delete advanced orders.
                                    const isLockedForEditing = ['preparacao', 'transporte', 'entregue', 'devolucao'].includes(order.status);

                                    return (
                                        <div key={order.id} className={`rounded-xl border overflow-hidden transition-all shadow-lg ${STATUS_STYLES[order.status]?.split(' ')[0] || 'border-gray-500'} border-l-4 bg-zinc-900 text-gray-200`}>
                                            {/* Header */}
                                            <div 
                                                className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${STATUS_BG[order.status] || 'bg-gray-800'}`}
                                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-extrabold text-lg text-white">{order.userName}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${STATUS_STYLES[order.status]?.split(' ')[1] || 'text-gray-300'}`}>
                                                                {STATUS_LABELS[order.status] || order.status}
                                                            </p>
                                                            {order.status === 'entregue' && (
                                                                <span className="text-[10px] text-gray-400">({deliveredTime})</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-white block">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">#{order.id.slice(-6)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-sm text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-zinc-800 px-2 py-1 rounded text-orange-400 font-bold border border-orange-500/30">
                                                            📍 {order.userCity || 'Cidade N/D'}
                                                        </span>
                                                        <span>• {totalItems} itens</span>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="p-4 bg-zinc-950 border-t border-zinc-800 animate-fade-in">
                                                    {/* Workflow Actions */}
                                                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800 justify-end items-center">
                                                        
                                                        {currentUser?.isAdmin && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (deleteConfirmId === order.id) {
                                                                        handleDeleteOrder(order.id);
                                                                        setDeleteConfirmId(null);
                                                                    } else {
                                                                        setDeleteConfirmId(order.id);
                                                                        // Auto-reset after 3s
                                                                        setTimeout(() => setDeleteConfirmId(null), 3000);
                                                                    }
                                                                }} 
                                                                className={`text-xs px-3 py-2 border rounded mr-auto flex items-center gap-1 font-bold z-10 transition-all duration-200 ${
                                                                    deleteConfirmId === order.id 
                                                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 animate-pulse' 
                                                                    : 'text-red-500 hover:text-red-300 border-red-900 hover:bg-red-900/20'
                                                                }`}
                                                            >
                                                                {deleteConfirmId === order.id ? (
                                                                    <>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Confirmar?
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Excluir
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}

                                                        <button onClick={(e) => { e.stopPropagation(); setPreviewOrder(order); }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded font-bold border border-gray-600">
                                                            🖨️ Imprimir
                                                        </button>
                                                        
                                                        {/* EDIT BUTTON: Hidden if locked */}
                                                        {!isLockedForEditing && (
                                                            <button onClick={(e) => { e.stopPropagation(); onEditOrder(order); }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-3 py-2 rounded font-bold border border-blue-900">
                                                                ✏️ Editar Pedido
                                                            </button>
                                                        )}
                                                        
                                                        {/* --- STATUS WORKFLOW --- */}

                                                        {/* Orcamento Actions */}
                                                        {order.status === 'orcamento' && (
                                                            <>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleSendBudgetWhatsapp(order); }}
                                                                    className="text-xs bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded font-bold border border-green-600 flex items-center gap-1"
                                                                >
                                                                    📲 Enviar Orçamento
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleFinalizeSale(order); }} 
                                                                    className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold shadow-lg shadow-orange-900/20"
                                                                >
                                                                    ✅ Aprovar Venda
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Pagamento Pendente -> Preparacao */}
                                                        {order.status === 'pagamento_pendente' && !isVendor && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleConfirmPayment(order); }} 
                                                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold shadow-lg shadow-blue-900/20"
                                                            >
                                                                💰 Confirmar Pagamento
                                                            </button>
                                                        )}

                                                        {/* Confirmed Orders Actions (Receipt) */}
                                                        {(['preparacao', 'transporte', 'entregue'].includes(order.status)) && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleSendReceiptWhatsapp(order); }}
                                                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-bold flex items-center gap-1"
                                                            >
                                                                🧾 Enviar Recibo
                                                            </button>
                                                        )}

                                                        {/* Preparacao -> Transporte */}
                                                        {order.status === 'preparacao' && !isVendor && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDispatchOrder(order); }} 
                                                                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2"
                                                            >
                                                                🚚 Despachar
                                                            </button>
                                                        )}

                                                        {/* Transporte -> Entregue & Rastreio */}
                                                        {order.status === 'transporte' && (
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <div className="flex items-center gap-1 bg-zinc-800 rounded p-1 border border-zinc-700">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Cód. Rastreio" 
                                                                        className="bg-transparent text-white text-xs px-2 w-28 outline-none"
                                                                        value={trackingInput[order.id] !== undefined ? trackingInput[order.id] : (order.trackingCode || '')}
                                                                        onChange={(e) => setTrackingInput({...trackingInput, [order.id]: e.target.value})}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleSendTrackingWhatsapp(order); }}
                                                                        className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded text-[10px] font-bold"
                                                                        title="Enviar no WhatsApp"
                                                                    >
                                                                        📲
                                                                    </button>
                                                                </div>

                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleMarkDelivered(order); }} 
                                                                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold shadow-lg shadow-green-900/20 flex items-center gap-2"
                                                                >
                                                                    ✅ Entregue
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Entregue Display */}
                                                        {order.status === 'entregue' && (
                                                            <div className="text-xs bg-zinc-800 text-green-400 px-3 py-2 rounded font-bold border border-green-900">
                                                                Entregue em: {deliveredTime}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2 last:border-0">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-zinc-800 rounded overflow-hidden">
                                                                        {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-200 font-medium">{item.quantity}x {item.name}</p>
                                                                        <p className="text-xs text-orange-400 font-bold">Un: R$ {item.price.toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-gray-300 font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4 bg-zinc-900 p-3 rounded text-xs text-gray-400 space-y-1">
                                                        <div className="flex justify-between">
                                                            <span>Subtotal:</span>
                                                            <span>R$ {order.items.reduce((a,b) => a + (b.price*b.quantity), 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-red-400">
                                                            <span>Desconto:</span>
                                                            <span>- R$ {(order.discount || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-indigo-400">
                                                            <span>Frete ({order.shippingMethod}):</span>
                                                            <span>+ R$ {(order.shippingCost || 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Full Address */}
                                                    <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-gray-500">
                                                        <p className="font-bold uppercase mb-1">Endereço:</p>
                                                        {order.userStreet ? (
                                                            <p>{order.userStreet}, {order.userNumber} - {order.userDistrict} ({order.userCep})</p>
                                                        ) : (
                                                            <p className="italic text-yellow-600">Não informado ou Retirada.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {filteredOrders.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum pedido encontrado.</p>}
                </div>
            </div>
        )}

        {/* ... (Vendors Tab preserved) ... */}
        {activeTab === 'vendors' && !isVendor && (
            <div className="animate-fade-in">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <h3 className="font-bold text-blue-800 mb-3">Cadastrar Novo Vendedor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input value={newVendorName} onChange={e => setNewVendorName(e.target.value)} placeholder="Nome" className="border p-2 rounded text-sm" />
                        <input value={newVendorPhone} onChange={e => setNewVendorPhone(e.target.value)} placeholder="Telefone Login" className="border p-2 rounded text-sm" />
                        <input value={newVendorPass} onChange={e => setNewVendorPass(e.target.value)} placeholder="Senha" className="border p-2 rounded text-sm" />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button onClick={handleRegisterVendor} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Cadastrar</button>
                    </div>
                </div>

                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Login</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {vendors.map(v => (
                                <tr key={v.id}>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{v.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{v.phone}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <button onClick={() => handlePasswordUpdate(v.id)} className="text-blue-600 hover:underline text-xs mr-3">Trocar Senha</button>
                                        <button onClick={() => handleDeleteClient(v.id)} className="text-red-600 hover:underline text-xs">Excluir</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* ... (Products Tab preserved) ... */}
        {activeTab === 'products' && !isVendor && (
            <div>
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                   <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">📂 Categorias</h3>
                   <div className="flex gap-2 mb-4">
                       <input type="text" placeholder="Nome..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-grow outline-none" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                       <button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold text-sm">+ Criar</button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                       {categories.map(cat => (
                           <div key={cat.id} className="bg-white border rounded-full px-3 py-1 text-xs font-medium flex gap-2">
                               {cat.name}
                               <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-red-500 font-bold">×</button>
                           </div>
                       ))}
                   </div>
               </div>
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-800">Catálogo</h3>
                   <div className="flex gap-2">
                       <button onClick={handleClearDatabase} className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-bold">🗑️ Limpar Tudo</button>
                       <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="!bg-orange-600">+ Novo Produto</Button>
                   </div>
               </div>
               <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativo?</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <AdminProductThumbnail src={product.image} alt={product.name} />
                            </div>
                            <span className="text-sm font-medium line-clamp-2">{product.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">R$ {product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{product.category}</span></td>
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

        {/* --- REVAMPED CLIENTS TAB --- */}
        {activeTab === 'clients' && !isVendor && (
             <div className="space-y-4 animate-fade-in">
                 {editingUser && (
                     <div className="bg-gray-50 p-4 border rounded-xl mb-4">
                         <h3 className="font-bold text-gray-800 mb-2">Editando: {editingUser.name}</h3>
                         <div className="grid grid-cols-2 gap-2 mb-2">
                             <input className="border p-2 rounded text-sm" placeholder="Nome" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                             <input className="border p-2 rounded text-sm" placeholder="Telefone" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                             <input className="border p-2 rounded text-sm" placeholder="Rua" value={editingUser.street || ''} onChange={e => setEditingUser({...editingUser, street: e.target.value})} />
                             <input className="border p-2 rounded text-sm" placeholder="Número" value={editingUser.number || ''} onChange={e => setEditingUser({...editingUser, number: e.target.value})} />
                             <input className="border p-2 rounded text-sm" placeholder="Bairro" value={editingUser.district || ''} onChange={e => setEditingUser({...editingUser, district: e.target.value})} />
                             <input className="border p-2 rounded text-sm" placeholder="Nova Senha (deixe vazio para manter)" onChange={e => setPasswordInput(prev => ({ ...prev, [editingUser.id]: e.target.value }))} />
                         </div>
                         <div className="flex justify-end gap-2">
                             <button onClick={() => setEditingUser(null)} className="text-sm text-gray-500">Cancelar</button>
                             <button onClick={() => {
                                 if (passwordInput[editingUser.id]) handlePasswordUpdate(editingUser.id);
                                 handleUpdateClient();
                             }} className="bg-green-600 text-white px-4 py-1 rounded text-sm font-bold">Salvar Alterações</button>
                         </div>
                     </div>
                 )}

                 {users.map(user => {
                    const userOrders = orders.filter(o => o.userId === user.id);
                    const isExpanded = expandedUser === user.id;

                    return (
                        <div key={user.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="p-4 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
                                <div>
                                    <p className="font-bold text-gray-800">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.phone} • {user.city}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            const link = `https://api.whatsapp.com/send?phone=55${user.phone?.replace(/\D/g, '')}`;
                                            window.open(link, '_blank');
                                        }} 
                                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors"
                                    >
                                        WhatsApp
                                    </button>
                                    <button 
                                        onClick={() => setEditingUser(user)}
                                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClient(user.id)} 
                                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                    >
                                        Excluir
                                    </button>
                                    <button 
                                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                        className={`p-1 rounded-full transition-transform ${isExpanded ? 'rotate-180 bg-gray-200' : 'hover:bg-gray-100'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Expanded Order History */}
                            {isExpanded && (
                                <div className="bg-gray-50 p-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Histórico de Pedidos ({userOrders.length})</h4>
                                    {userOrders.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Nenhum pedido realizado.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {userOrders.map(o => (
                                                <div key={o.id} className="bg-white p-2 rounded border flex justify-between text-xs">
                                                    <span>#{o.id.slice(-6)} - {new Date(o.createdAt).toLocaleDateString()}</span>
                                                    <span className={`font-bold uppercase ${STATUS_STYLES[o.status].split(' ')[1]}`}>{STATUS_LABELS[o.status]}</span>
                                                    <span className="font-bold">R$ {o.total.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
        )}
        
        {/* ... (Settings and Abandoned logic preserved) ... */}
        {activeTab === 'abandoned' && !isVendor && (
             <div className="space-y-4 animate-fade-in">
                 <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6">
                     <h3 className="font-bold text-orange-800 flex items-center gap-2">
                        🛒 Carrinhos Abandonados
                     </h3>
                     <p className="text-sm text-orange-700 mt-1">
                        Estes clientes adicionaram itens ao carrinho mas não finalizaram o pedido. Envie uma mensagem para recuperar a venda!
                     </p>
                 </div>

                 {abandonedCarts.length === 0 ? (
                     <p className="text-center text-gray-400 py-10">Nenhum carrinho abandonado no momento.</p>
                 ) : (
                     <div className="grid gap-4">
                         {abandonedCarts.map(user => {
                             const totalValue = user.savedCart!.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                             const itemCount = user.savedCart!.length;
                             
                             return (
                                 <div key={user.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-3">
                                         <div>
                                             <p className="font-bold text-gray-800 text-lg">{user.name}</p>
                                             <p className="text-sm text-gray-500">{user.phone}</p>
                                         </div>
                                         <div className="text-right">
                                             <p className="font-bold text-red-600 text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                             </p>
                                             <p className="text-xs text-gray-400">{itemCount} itens no carrinho</p>
                                         </div>
                                     </div>
                                     
                                     <div className="bg-gray-50 rounded p-3 mb-4 max-h-32 overflow-y-auto">
                                         {user.savedCart!.map((item, idx) => (
                                             <div key={idx} className="text-xs text-gray-600 flex justify-between py-1 border-b border-gray-100 last:border-0">
                                                 <span>{item.quantity}x {item.name}</span>
                                                 <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                             </div>
                                         ))}
                                     </div>

                                     <button 
                                        onClick={() => handleRecoverCart(user)}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
                                     >
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                           <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                         </svg>
                                         Enviar Mensagem de Recuperação
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 )}
             </div>
        )}
        
        {activeTab === 'settings' && !isVendor && (
             <div className="space-y-4 max-w-lg">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Chave PIX</label>
                    <input value={settings.pixKey} onChange={e => setSettings({...settings, pixKey: e.target.value})} placeholder="Chave PIX" className="border w-full p-2 rounded" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome no PIX</label>
                    <input value={settings.pixName} onChange={e => setSettings({...settings, pixName: e.target.value})} placeholder="Nome no Banco" className="border w-full p-2 rounded" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Política de Envio</label>
                    <textarea rows={3} value={settings.shippingPolicy} onChange={e => setSettings({...settings, shippingPolicy: e.target.value})} className="border w-full p-2 rounded" />
                 </div>
                 <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
             </div>
        )}

      </div>

      <ProductFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          productToEdit={editingProduct}
          onSave={handleFormSave}
          categories={categories}
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
import React, { useState, useEffect, useMemo } from 'react';
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
  toggleProductPromo,
  deleteUser,
  updateUser,
  addCategory,
  deleteCategory,
  registerVendor,
  getCurrentUser,
  deleteProduct
} from '../services/storage';
import { PrintPreviewModal } from './PrintPreviewModal';
import { ClientEditModal } from './ClientEditModal';
import { UserOrdersModal } from './UserOrdersModal';

// --- Interactive Chart Components ---

const InteractiveBarChart = ({ data, colorClass, barColor }: { data: { label: string, value: number, count: number, details?: string }[], colorClass: string, barColor: string }) => {
    const max = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="flex items-end justify-between h-48 gap-2 mt-4 select-none">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-zinc-800 text-white text-xs rounded-lg p-3 shadow-2xl border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0 duration-200">
                        <p className="font-bold text-orange-400 mb-1 border-b border-zinc-600 pb-1">{d.label}</p>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Vendas:</span>
                                <span className="font-bold">{d.count}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total:</span>
                                <span className="font-bold text-green-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}
                                </span>
                            </div>
                            {d.count > 0 && (
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Média:</span>
                                    <span className="text-gray-300">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value / d.count)}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-800"></div>
                    </div>

                    {/* Bar */}
                    <div className="relative w-full flex justify-center items-end h-[85%] rounded-t-lg overflow-hidden bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                        <div 
                            style={{ height: `${(d.value / max) * 100}%` }} 
                            className={`w-full mx-1 rounded-t ${barColor} opacity-80 group-hover:opacity-100 transition-all duration-700 ease-out origin-bottom animate-grow-up relative shadow-[0_0_10px_rgba(249,115,22,0.3)]`}
                        >
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-2 font-medium truncate w-full text-center h-[15%]">{d.label}</span>
                </div>
            ))}
            <style>{`
                @keyframes growUp { from { transform: scaleY(0); } to { transform: scaleY(1); } }
                .animate-grow-up { animation: growUp 1s ease-out forwards; }
            `}</style>
        </div>
    );
};

const InteractiveDonutChart = ({ data }: { data: { label: string, value: number, count: number, color: string }[] }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

    if (total === 0) return <div className="h-40 flex items-center justify-center text-gray-600 text-xs">Sem vendas pagas no período.</div>;

    let cumulativePercent = 0;
    const gradient = data.map(d => {
        const start = cumulativePercent;
        const percent = (d.value / total) * 100;
        cumulativePercent += percent;
        return `${d.color} ${start}% ${cumulativePercent}%`;
    }).join(', ');

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            <div className="relative w-40 h-40 rounded-full shadow-2xl group transition-transform hover:scale-105 duration-300" style={{ background: `conic-gradient(${gradient})` }}>
                <div className="absolute inset-4 bg-zinc-900 rounded-full flex flex-col items-center justify-center z-10">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Total Vendas</span>
                    <span className="text-lg font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(total)}</span>
                    <span className="text-[10px] text-gray-400">{totalCount} pedidos</span>
                </div>
            </div>
            <div className="space-y-2 w-full max-w-[150px]">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs group cursor-help relative">
                        {/* Tooltip for Legend */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max bg-black text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: d.color }} />
                            <span className="text-gray-300 font-medium truncate max-w-[80px]" title={d.label}>{d.label}</span>
                        </div>
                        <span className="text-gray-500 font-bold">{((d.value/total)*100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---

const AdminProductThumbnail = ({ src, alt }: { src?: string, alt: string }) => {
  const [error, setError] = useState(false);
  if (error || !src || src.trim() === '') {
    return (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
       </svg>
    );
  }
  return <img className="h-full w-full object-cover transition-transform hover:scale-110 duration-300" src={src} alt={alt} onError={() => setError(true)} />;
};

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

const StatCard = ({ title, value, icon, colorClass, subText }: any) => (
  <div className={`p-4 rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg flex items-center justify-between group hover:border-zinc-700 transition-all hover:-translate-y-1`}>
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
      {subText && <p className="text-[10px] text-gray-400 mt-1">{subText}</p>}
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-opacity-20 ${colorClass} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
);

// --- Custom Confirmation Modal ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isLoading }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void, isLoading: boolean }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl scale-100 transform transition-all">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={isLoading} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg disabled:opacity-50">Cancelar</button>
                    <button onClick={onConfirm} disabled={isLoading} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 flex justify-center items-center gap-2 disabled:opacity-50">
                        {isLoading ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateDescription: (id: string, newDesc: string) => void;
  onEditOrder: (order: Order) => void; 
}

const STATUS_LABELS: Record<string, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Finalizado',
  pagamento_pendente: 'Aguard. Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Entregue',
  devolucao: 'Devolução',
  cancelado: 'Cancelado'
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
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [productSearchTerm, setProductSearchTerm] = useState(''); // New state for product search
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'Lojista Vip', minOrderValue: 20,
    aboutUs: '', shippingPolicy: '', warrantyPolicy: '', feesPolicy: '', contactNumber: '', 
    pixKey: '', pixName: '', pixBank: '' 
  });
  
  const [logoUrl, setLogoUrl] = useState('');

  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState(''); 
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});

  const [expandedUser, setExpandedUser] = useState<string | null>(null); 
  const [editingUser, setEditingUser] = useState<User | null>(null); 
  
  // State for User Orders Modal (Clients/Vendors)
  const [clientOrdersUser, setClientOrdersUser] = useState<User | null>(null);
  const [ordersViewType, setOrdersViewType] = useState<'client' | 'vendor'>('client');
  
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorPass, setNewVendorPass] = useState('');
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [passwordInput, setPasswordInput] = useState<Record<string, string>>({});
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: async () => {},
      isLoading: false
  });

  const openConfirm = (title: string, message: string, action: () => Promise<void> | void) => {
      setConfirmModal({
          isOpen: true,
          title,
          message,
          onConfirm: async () => {
              setConfirmModal(prev => ({ ...prev, isLoading: true }));
              await action();
              setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          },
          isLoading: false
      });
  };

  useEffect(() => {
    const loadSettings = async () => {
      const s = await getShopSettings();
      setSettings(s);
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

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.available).length;
  const inactiveProducts = totalProducts - activeProducts;
  
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
      const cat = p.category || 'Geral';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const displayedProducts = products.filter(p => 
      (filterCategory === 'all' || p.category === filterCategory) &&
      (productSearchTerm === '' || p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
  );

  // --- DASHBOARD DATA CALCULATION ---
  const dashboardData = useMemo(() => {
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      const todayStart = todayDate.getTime();

      const filteredOrders = isVendor ? orders.filter(o => o.sellerId === currentUser?.id) : orders;

      // KPI Counts
      const pendingApproval = filteredOrders.filter(o => o.status === 'orcamento').length;
      const pendingPayment = filteredOrders.filter(o => o.status === 'pagamento_pendente').length;
      const inTransit = filteredOrders.filter(o => o.status === 'transporte').length;
      const delivered = filteredOrders.filter(o => o.status === 'entregue').length;
      const cancelled = filteredOrders.filter(o => o.status === 'cancelado' || o.status === 'devolucao').length;
      const preparation = filteredOrders.filter(o => o.status === 'preparacao').length;

      // Filter PAID orders for charts (realizado, preparacao, transporte, entregue)
      const paidStatus = ['realizado', 'preparacao', 'transporte', 'entregue'];
      
      // 1. Sales by Hour (Today) - Using Maps for aggregation
      const salesByHourMap = new Map<number, { value: number, count: number }>();
      for(let i=0; i<24; i++) salesByHourMap.set(i, { value: 0, count: 0 });

      const todayOrders = filteredOrders.filter(o => o.createdAt >= todayStart && paidStatus.includes(o.status));
      todayOrders.forEach(o => {
          const hour = new Date(o.createdAt).getHours();
          const current = salesByHourMap.get(hour)!;
          salesByHourMap.set(hour, { value: current.value + o.total, count: current.count + 1 });
      });
      const chartDataHour = Array.from(salesByHourMap.entries()).map(([hour, data]) => ({
          label: `${hour}h`, value: data.value, count: data.count
      }));

      // 2. Sales by WeekDay (Last 7 Days)
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const salesByWeekMap = new Map<number, { value: number, count: number }>();
      for(let i=0; i<7; i++) salesByWeekMap.set(i, { value: 0, count: 0 });

      filteredOrders.forEach(o => {
          if (paidStatus.includes(o.status)) {
              const day = new Date(o.createdAt).getDay();
              const current = salesByWeekMap.get(day)!;
              salesByWeekMap.set(day, { value: current.value + o.total, count: current.count + 1 });
          }
      });
      const chartDataWeek = Array.from(salesByWeekMap.entries()).map(([day, data]) => ({
          label: weekDays[day], value: data.value, count: data.count
      }));

      // 3. Sales by Vendor
      const salesByVendorMap = new Map<string, { value: number, count: number }>();
      filteredOrders.forEach(o => {
          if (paidStatus.includes(o.status)) {
              const vName = vendors.find(v => v.id === o.sellerId)?.name || 'Loja/Admin';
              const current = salesByVendorMap.get(vName) || { value: 0, count: 0 };
              salesByVendorMap.set(vName, { value: current.value + o.total, count: current.count + 1 });
          }
      });
      const colors = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#eab308'];
      const chartDataVendor = Array.from(salesByVendorMap.entries()).map(([label, data], i) => ({
          label, value: data.value, count: data.count, color: colors[i % colors.length]
      }));

      // 4. Sales by Month
      const salesByMonthMap = new Map<number, { value: number, count: number }>();
      for(let i=0; i<12; i++) salesByMonthMap.set(i, { value: 0, count: 0 });
      const currentYear = new Date().getFullYear();
      
      filteredOrders.forEach(o => {
          const d = new Date(o.createdAt);
          if (d.getFullYear() === currentYear && paidStatus.includes(o.status)) {
              const month = d.getMonth();
              const current = salesByMonthMap.get(month)!;
              salesByMonthMap.set(month, { value: current.value + o.total, count: current.count + 1 });
          }
      });
      const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartDataMonth = Array.from(salesByMonthMap.entries()).map(([month, data]) => ({
          label: monthLabels[month], value: data.value, count: data.count
      }));

      return {
          pendingApproval, pendingPayment, inTransit, delivered, cancelled, preparation,
          chartDataHour, chartDataWeek, chartDataVendor, chartDataMonth, todayOrders
      };
  }, [orders, vendors, isVendor, currentUser]);

  const generateDailyReportPDF = () => {
      const today = new Date().toLocaleDateString();
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) return;

      // Filter orders to include in report (usually all processed today)
      // Sorting by date descending
      const sortedOrders = [...dashboardData.todayOrders].sort((a, b) => b.createdAt - a.createdAt);

      const itemsHtml = sortedOrders.map(o => {
          const dateObj = new Date(o.createdAt);
          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          // Build Items List
          const itemsList = o.items.map(i => 
              `<div style="font-size: 10px; color: #555;">- ${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})</div>`
          ).join('');

          return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">#${o.id.slice(-6)}</td>
                <td style="padding: 8px;">${timeStr}</td>
                <td style="padding: 8px;">
                    <strong>${o.userName}</strong><br/>
                    <span style="font-size: 10px; color: #666;">${o.userPhone}</span>
                </td>
                <td style="padding: 8px;">${itemsList}</td>
                <td style="padding: 8px; text-align: right;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.total)}</td>
                <td style="padding: 8px; font-size: 10px; text-transform: uppercase;">${STATUS_LABELS[o.status] || o.status}</td>
            </tr>
          `;
      }).join('');

      const total = sortedOrders.reduce((acc, o) => acc + o.total, 0);
      const totalCount = sortedOrders.length;

      reportWindow.document.write(`
        <html>
            <head>
                <title>Relatório Detalhado - ${today}</title>
                <style>
                    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
                    h1 { text-align: center; margin-bottom: 5px; color: #000; }
                    .subtitle { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th { background: #333; color: #fff; padding: 10px; text-align: left; text-transform: uppercase; font-size: 10px; }
                    .summary { margin-top: 30px; text-align: right; border-top: 2px solid #333; padding-top: 10px; }
                    .summary p { margin: 5px 0; font-size: 14px; }
                    .total-big { font-size: 18px; font-weight: bold; color: #000; }
                </style>
            </head>
            <body>
                <h1>Lojista VIP - Relatório Diário</h1>
                <p class="subtitle">Data de Emissão: ${today}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th width="8%">ID</th>
                            <th width="8%">Hora</th>
                            <th width="20%">Cliente</th>
                            <th width="40%">Itens / Produtos</th>
                            <th width="12%" style="text-align: right;">Valor</th>
                            <th width="12%">Status</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhuma venda registrada hoje.</td></tr>'}</tbody>
                </table>

                <div class="summary">
                    <p>Quantidade de Pedidos: <strong>${totalCount}</strong></p>
                    <p class="total-big">Total Vendido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</p>
                </div>
                
                <script>window.onload = function() { window.print(); }</script>
            </body>
        </html>
      `);
      reportWindow.document.close();
  };

  const handleSelectProduct = (id: string) => {
      const newSet = new Set(selectedProductIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedProductIds(newSet);
  };

  const handleSelectAll = () => {
      if (selectedProductIds.size === displayedProducts.length && displayedProducts.length > 0) {
          setSelectedProductIds(new Set());
      } else {
          const newSet = new Set<string>();
          displayedProducts.forEach(p => newSet.add(p.id));
          setSelectedProductIds(newSet);
      }
  };

  const handleBulkDelete = () => {
      const count = selectedProductIds.size;
      if (count === 0) return;
      
      openConfirm(
          'Excluir em Massa',
          `Tem certeza que deseja excluir ${count} produtos selecionados?`,
          async () => {
              const promises = Array.from(selectedProductIds).map(id => deleteProduct(id));
              await Promise.all(promises);
              setSelectedProductIds(new Set());
              showNotification(`${count} produtos excluídos.`);
          }
      );
  };

  const handleDeleteClient = (userId: string) => {
      openConfirm(
          'Excluir Cliente',
          'Tem certeza? Isso apagará o cliente permanentemente.',
          async () => {
              const success = await deleteUser(userId);
              if (success) showNotification('Cliente excluído.');
              else showNotification('Erro ao excluir cliente.');
          }
      );
  };

  const handleDeleteProductSingle = (id: string) => {
      openConfirm(
          'Excluir Produto',
          'Apagar este produto permanentemente?',
          async () => {
              const success = await deleteProduct(id);
              if (success) showNotification('Produto excluído.');
              else showNotification('Erro ao excluir produto.');
          }
      );
  };

  const handleDeleteOrder = (orderId: string) => {
      openConfirm(
          'Excluir Pedido',
          'Deseja realmente apagar este pedido do histórico?',
          async () => {
              const success = await deleteOrder(orderId);
              if (success) {
                  showNotification('Pedido excluído.');
                  setExpandedOrderId(null);
              }
          }
      );
  };

  const handleDeleteCategory = (id: string, name: string) => {
      openConfirm(
          'Excluir Categoria',
          `Apagar a categoria "${name}" e todos os seus produtos?`,
          async () => {
              await deleteCategory(id, name);
              showNotification('Categoria removida.');
          }
      );
  };

  const handleGoToOrder = (orderId: string) => {
      setActiveTab('orders');
      setExpandedOrderId(orderId);
      setOrderStatusFilter('all'); // Ensure filtered lists don't hide it
  };

  const paidStatuses: OrderStatus[] = ['realizado', 'preparacao', 'transporte', 'entregue'];
  const relevantOrders = isVendor ? orders.filter(o => o.sellerId === currentUser?.id) : orders;
  const paidOrders = relevantOrders.filter(o => paidStatuses.includes(o.status));
  const todayDate = new Date(); todayDate.setHours(0,0,0,0); const todayStart = todayDate.getTime();
  const todayOrders = paidOrders.filter(o => o.createdAt >= todayStart);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);
  const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const pendingCount = relevantOrders.filter(o => ['pagamento_pendente', 'preparacao'].includes(o.status)).length;
  
  // Group Orders by Date for UI
  const groupOrdersByDate = (ordersList: Order[]) => { const todayStr = new Date().toLocaleDateString(); const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); const yesterdayStr = yesterday.toLocaleDateString(); const groups = { today: [] as Order[], yesterday: [] as Order[], older: [] as Order[] }; ordersList.forEach(order => { const dateStr = new Date(order.createdAt).toLocaleDateString(); if (dateStr === todayStr) groups.today.push(order); else if (dateStr === yesterdayStr) groups.yesterday.push(order); else groups.older.push(order); }); return groups; };
  
  // UPDATED: Filtering Logic with Search
  const filteredOrders = relevantOrders.filter(o => {
      // 1. Status Filter
      const matchesStatus = orderStatusFilter === 'all' ? o.status !== 'cancelado' : o.status === orderStatusFilter;
      
      // 2. Search Filter
      const term = orderSearchTerm.toLowerCase();
      const matchesSearch = !term || 
          o.userName.toLowerCase().includes(term) ||
          o.userPhone.includes(term) ||
          (o.userCity && o.userCity.toLowerCase().includes(term)) ||
          o.items.some(i => i.name.toLowerCase().includes(term)) ||
          o.id.includes(term);

      return matchesStatus && matchesSearch;
  });

  const groupedOrders = groupOrdersByDate(filteredOrders);
  const abandonedCarts = users.filter(u => u.savedCart && u.savedCart.length > 0);

  // CSV Report Generator
  const downloadReport = () => {
      const headers = "ID,Data,Cliente,Telefone,Total,Status,Itens\n";
      const rows = paidOrders.map(o => {
          const date = new Date(o.createdAt).toLocaleDateString();
          const items = o.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
          return `${o.id},${date},"${o.userName}","${o.userPhone}",${o.total.toFixed(2)},${STATUS_LABELS[o.status]},"${items}"`;
      }).join("\n");
      
      const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "relatorio_vendas.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Order Action Handlers
  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => { try { const history = [...(order.history || []), { status: newStatus, timestamp: Date.now() }]; await updateOrder({ ...order, status: newStatus, history }); showNotification(`Status alterado: ${STATUS_LABELS[newStatus]}`); } catch (e: any) { alert("Erro status"); } };
  const handleFinalizeSale = async (order: Order) => { if (order.status !== 'orcamento') return; await handleStatusChange(order, 'pagamento_pendente'); };
  const handleConfirmPayment = async (order: Order) => { if (order.status !== 'pagamento_pendente') return; await handleStatusChange(order, 'preparacao'); };
  const handleSendBudgetWhatsapp = (order: Order) => { const msg = encodeURIComponent(`Orçamento #${order.id.slice(-6)} para ${order.userName}`); window.open(`https://api.whatsapp.com/send?phone=55${order.userPhone.replace(/\D/g, '')}&text=${msg}`, '_blank'); };
  const handleSendReceiptWhatsapp = (order: Order) => { const msg = encodeURIComponent(`Recibo Pedido #${order.id.slice(-6)}`); window.open(`https://api.whatsapp.com/send?phone=55${order.userPhone.replace(/\D/g, '')}&text=${msg}`, '_blank'); };
  const handleDispatchOrder = async (order: Order) => { await updateOrder({ ...order, status: 'transporte', history: [...(order.history||[]), {status:'transporte', timestamp:Date.now()}] }); showNotification('Despachado!'); setOrderStatusFilter('transporte'); };
  const handleSaveTracking = async (order: Order) => { if(trackingInput[order.id]) { await updateOrder({ ...order, trackingCode: trackingInput[order.id] }); showNotification('Rastreio salvo'); } };
  const handleSendTrackingWhatsapp = (order: Order) => { handleSaveTracking(order); const code = trackingInput[order.id] || order.trackingCode; if(!code) return alert('Digite o código'); const msg = encodeURIComponent(`Rastreio: ${code}`); window.open(`https://api.whatsapp.com/send?phone=55${order.userPhone.replace(/\D/g, '')}&text=${msg}`, '_blank'); };
  const handleMarkDelivered = async (order: Order) => { await updateOrder({ ...order, status: 'entregue', history: [...(order.history||[]), {status:'entregue', timestamp:Date.now()}] }); showNotification('Entregue!'); setOrderStatusFilter('entregue'); };
  
  // Entity Handlers
  const handleRegisterVendor = async () => { 
    if (!newVendorName || !newVendorPhone || !newVendorPass) return; 
    
    try {
        const res = await registerVendor(newVendorName, newVendorPhone, newVendorPass);
        const response = res as { success: boolean; message: string }; // Explicit typing
        
        const msg = response?.message ? String(response.message) : 'Operação realizada';
        showNotification(msg);
        
        if (response?.success) { 
            setNewVendorName(''); 
            setNewVendorPhone(''); 
            setNewVendorPass(''); 
        }
    } catch(e: any) {
        // Ensure error message is string and handle unknown error object
        const errMsg = (e?.message) ? String(e.message) : 'Erro desconhecido';
        showNotification(errMsg);
    }
  };

  const handleUpdateClient = async (updatedUser: User) => { if (!updatedUser) return; await updateUser(updatedUser); setEditingUser(null); showNotification('Atualizado!'); };
  const handlePasswordUpdate = async (userId: string) => { const newPass = passwordInput[userId]; if (!newPass || newPass.length < 6) return alert("Senha min 6 digitos"); await updateUserPassword(userId, newPass); setPasswordInput(prev => ({...prev, [userId]: ''})); showNotification("Senha alterada!"); };
  const handleSaveSettings = async () => { await saveShopSettings(settings); if (logoUrl) await saveLogo(logoUrl); showNotification('Configurações salvas!'); };
  const handleFormSave = (product: Product | Omit<Product, 'id'>) => { if ('id' in product) onUpdateProduct(product as Product); else onAddProduct(product); setIsFormOpen(false); setEditingProduct(null); showNotification('Produto salvo!'); };
  const handleAddCategory = async () => { if (!newCategoryName.trim()) return; await addCategory(newCategoryName); setNewCategoryName(''); showNotification('Categoria criada!'); };
  const handleRecoverCart = (user: User) => { 
      const phone = user.phone;
      if (!phone || typeof phone !== 'string') {
          showNotification("Cliente sem telefone cadastrado.");
          return;
      }
      const name = user.name || 'Cliente';
      const msg = encodeURIComponent(`Olá ${name}, recupere seu carrinho!`); 
      window.open(`https://api.whatsapp.com/send?phone=55${phone.replace(/\D/g, '')}&text=${msg}`, '_blank'); 
  };

  return (
    <div className="bg-gray-100 rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] relative">
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} 
        isLoading={confirmModal.isLoading || false} 
      />

      <div className="flex border-b border-gray-100 overflow-x-auto bg-zinc-900 text-white scrollbar-hide">
        {[{ id: 'dashboard', label: '📊 Dashboard', show: true }, { id: 'orders', label: '💰 Minhas Vendas', show: true }, { id: 'products', label: '📦 Produtos', show: !isVendor }, { id: 'clients', label: '👥 Clientes', show: !isVendor }, { id: 'vendors', label: '👔 Vendedores', show: !isVendor }, { id: 'abandoned', label: '🛒 Carrinhos Abandonados', show: !isVendor }, { id: 'settings', label: '⚙️ Configurações', show: !isVendor }].filter(t => t.show).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`flex-shrink-0 py-4 px-6 text-sm font-bold border-b-4 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-white'}`}>{tab.label}</button>
        ))}
      </div>
      <div className="p-6">
        
        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
            <div className="animate-fade-in space-y-6">
                
                {/* 1. KEY METRICS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                        title="Vendas Hoje" 
                        value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
                        subText={`Ticket Médio: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageTicket)}`}
                        icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        colorClass="bg-green-500 text-green-500"
                    />
                    <StatCard 
                        title="Clientes" 
                        value={users.length} 
                        icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        colorClass="bg-blue-500 text-blue-500"
                    />
                    <StatCard 
                        title="Aprovação Pendente" 
                        value={dashboardData.pendingApproval} 
                        icon={<svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        colorClass="bg-yellow-500 text-yellow-500"
                    />
                    <StatCard 
                        title="Aguard. Pagamento" 
                        value={dashboardData.pendingPayment} 
                        icon={<svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                        colorClass="bg-orange-500 text-orange-500"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                        title="Em Preparação" 
                        value={dashboardData.preparation} 
                        icon={<svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                        colorClass="bg-purple-500 text-purple-500"
                    />
                    <StatCard 
                        title="Em Trânsito" 
                        value={dashboardData.inTransit} 
                        icon={<svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>}
                        colorClass="bg-indigo-500 text-indigo-500"
                    />
                    <StatCard 
                        title="Pedidos Entregues" 
                        value={dashboardData.delivered} 
                        icon={<svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        colorClass="bg-emerald-500 text-emerald-500"
                    />
                    <StatCard 
                        title="Cancelados/Excl." 
                        value={dashboardData.cancelled} 
                        icon={<svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                        colorClass="bg-red-500 text-red-500"
                    />
                </div>

                {/* 2. CHARTS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hourly Sales */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-gray-800">Vendas do Dia (Horário)</h3>
                                <p className="text-xs text-gray-500">Apenas pedidos pagos</p>
                            </div>
                            <button 
                                onClick={generateDailyReportPDF}
                                className="text-xs bg-zinc-800 text-white px-3 py-1.5 rounded hover:bg-zinc-700 flex items-center gap-1 shadow-md hover:shadow-lg transition-all active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Relatório PDF
                            </button>
                        </div>
                        <InteractiveBarChart data={dashboardData.chartDataHour} colorClass="text-orange-500" barColor="bg-orange-500" />
                    </div>

                    {/* Weekly Sales */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800">Vendas na Semana (7 dias)</h3>
                        <p className="text-xs text-gray-500 mb-4">Volume total de pedidos confirmados</p>
                        <InteractiveBarChart data={dashboardData.chartDataWeek} colorClass="text-blue-600" barColor="bg-blue-600" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Vendor Ranking */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1">
                        <h3 className="font-bold text-gray-800 mb-6 text-center">Ranking de Vendedores</h3>
                        <InteractiveDonutChart data={dashboardData.chartDataVendor} />
                    </div>

                    {/* Monthly Sales */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
                        <h3 className="font-bold text-gray-800">Evolução Mensal</h3>
                        <p className="text-xs text-gray-500 mb-4">Ano atual ({new Date().getFullYear()})</p>
                        <InteractiveBarChart data={dashboardData.chartDataMonth} colorClass="text-purple-600" barColor="bg-purple-600" />
                    </div>
                </div>
            </div>
        )}

        {/* ... (Orders, Products, Clients, Vendors, Abandoned, Settings Tabs remain the same) ... */}
        {activeTab === 'orders' && (
            <div className="animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                        {['all', 'orcamento', 'pagamento_pendente', 'preparacao', 'transporte', 'entregue'].map(status => (
                            <button 
                                key={status} 
                                onClick={() => setOrderStatusFilter(status as OrderStatus | 'all')} 
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${orderStatusFilter === status ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {status === 'all' ? 'Todos' : STATUS_LABELS[status]}
                            </button>
                        ))}
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative w-full md:w-64 group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Nome, Cidade, Tel, Produto..." 
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent block pl-10 p-2.5 outline-none transition-shadow shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-8">{[{ title: '📅 HOJE', data: groupedOrders.today }, { title: '⏪ ONTEM', data: groupedOrders.yesterday }, { title: '📂 ANTERIORES', data: groupedOrders.older }].map(group => group.data.length > 0 && <div key={group.title}><h3 className="text-sm font-bold text-gray-400 mb-3">{group.title}</h3><div className="space-y-4">{group.data.map(order => {
                    const isExpanded = expandedOrderId === order.id;
                    const isLocked = ['preparacao', 'transporte', 'entregue'].includes(order.status);
                    return (
                        <div key={order.id} className={`rounded-xl border shadow-lg ${STATUS_STYLES[order.status]?.split(' ')[0]} border-l-4 bg-zinc-900 text-gray-200`}>
                            <div className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${STATUS_BG[order.status]}`} onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div><h4 className="font-extrabold text-lg text-white">{order.userName}</h4><p className={`text-xs font-bold uppercase ${STATUS_STYLES[order.status]?.split(' ')[1]}`}>{STATUS_LABELS[order.status]}</p></div>
                                    <div className="text-right"><span className="text-2xl font-bold text-white block">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span><span className="text-xs text-gray-400">#{order.id.slice(-6)}</span></div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-400"><div className="flex items-center gap-2"><span className="bg-zinc-800 px-2 py-1 rounded text-orange-400 font-bold border border-orange-500/30">📍 {order.userCity || 'N/D'}</span><span>• {order.items.reduce((a,b)=>a+b.quantity,0)} itens</span></div><svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            {isExpanded && (
                                <div className="p-4 bg-zinc-950 border-t border-zinc-800 animate-fade-in">
                                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800 justify-end items-center">
                                        {currentUser?.isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="text-xs px-3 py-2 border rounded mr-auto flex items-center gap-1 font-bold text-red-500 border-red-900 hover:bg-red-900/20">Excluir</button>}
                                        <button onClick={(e) => { e.stopPropagation(); setPreviewOrder(order); }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded font-bold border border-gray-600">🖨️ Imprimir</button>
                                        {!isLocked && <button onClick={(e) => { e.stopPropagation(); onEditOrder(order); }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-3 py-2 rounded font-bold border border-blue-900">✏️ Editar Pedido</button>}
                                        {order.status === 'orcamento' && <><button onClick={(e) => { e.stopPropagation(); handleSendBudgetWhatsapp(order); }} className="text-xs bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded font-bold border border-green-600">📲 Orçamento</button><button onClick={(e) => { e.stopPropagation(); handleFinalizeSale(order); }} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold">✅ Aprovar</button></>}
                                        {order.status === 'pagamento_pendente' && !isVendor && <button onClick={(e) => { e.stopPropagation(); handleConfirmPayment(order); }} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold">💰 Confirmar Pagamento</button>}
                                        {['preparacao', 'transporte'].includes(order.status) && <button onClick={(e) => { e.stopPropagation(); handleSendReceiptWhatsapp(order); }} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-bold">🧾 Recibo</button>}
                                        {order.status === 'preparacao' && !isVendor && <button onClick={(e) => { e.stopPropagation(); handleDispatchOrder(order); }} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold">🚚 Despachar</button>}
                                        {order.status === 'transporte' && <div className="flex items-center gap-2"><input placeholder="Rastreio" className="bg-zinc-800 text-white text-xs px-2 py-1 w-24 rounded border border-zinc-700 placeholder-gray-400" value={trackingInput[order.id] || order.trackingCode || ''} onChange={(e) => setTrackingInput({...trackingInput, [order.id]: e.target.value})} onClick={(e) => e.stopPropagation()} /><button onClick={(e) => {e.stopPropagation(); handleSendTrackingWhatsapp(order);}} className="bg-green-600 text-white p-1 rounded font-bold text-xs">📲</button><button onClick={(e) => {e.stopPropagation(); handleMarkDelivered(order);}} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold text-xs">✅ Entregue</button></div>}
                                    </div>
                                    <div className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                                                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-zinc-800 rounded overflow-hidden">{item.image && <img src={item.image} className="w-full h-full object-cover" />}</div><div><p className="text-gray-200 font-medium">{item.quantity}x {item.name}</p><p className="text-xs text-orange-400 font-bold">Un: R$ {item.price.toFixed(2)}</p></div></div>
                                                <span className="text-gray-300 font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 bg-zinc-900 p-3 rounded text-xs text-gray-400 space-y-1">
                                        <div className="flex justify-between"><span>Subtotal:</span><span>R$ {order.items.reduce((a,b)=>a+b.price*b.quantity,0).toFixed(2)}</span></div>
                                        {order.discount && <div className="flex justify-between text-red-400"><span>Desconto:</span><span>- R$ {order.discount.toFixed(2)}</span></div>}
                                        {order.shippingCost && <div className="flex justify-between text-indigo-400"><span>Frete:</span><span>+ R$ {order.shippingCost.toFixed(2)}</span></div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}</div></div>)}</div>
            </div>
        )}
        
        {/* PRODUCTS */}
        {activeTab === 'products' && !isVendor && (
            <div className="space-y-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-white"><p className="text-xs text-gray-400 uppercase font-bold">Total</p><p className="text-2xl font-bold">{totalProducts}</p></div>
                   <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-white"><p className="text-xs text-green-400 uppercase font-bold">Ativos</p><p className="text-2xl font-bold">{activeProducts}</p></div>
                   <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-white"><p className="text-xs text-red-400 uppercase font-bold">Desativados</p><p className="text-2xl font-bold">{inactiveProducts}</p></div>
                   <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-white"><p className="text-xs text-orange-400 uppercase font-bold">Categorias</p><p className="text-2xl font-bold">{Object.keys(categoryCounts).length}</p></div>
               </div>
               <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                       <div className="flex gap-2 w-full md:w-auto">
                           {/* Category Select */}
                           <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none">
                               <option value="all">Todas as Categorias</option>
                               {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                           </select>
                           
                           {/* Search Input */}
                           <div className="relative flex-grow">
                               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                   <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                       <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                   </svg>
                               </div>
                               <input 
                                   type="text" 
                                   placeholder="Nome do produto..." 
                                   value={productSearchTerm}
                                   onChange={(e) => setProductSearchTerm(e.target.value)}
                                   className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent block pl-10 p-2 outline-none placeholder-gray-500"
                               />
                           </div>
                       </div>

                       <div className="flex gap-2 w-full md:w-auto justify-end">
                           {selectedProductIds.size > 0 && <button onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Excluir ({selectedProductIds.size})</button>}
                           <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="!bg-orange-600 !text-sm whitespace-nowrap">+ Novo Produto</Button>
                       </div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap gap-2 items-center">
                       <input type="text" placeholder="Nova categoria..." className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-500 placeholder-gray-400" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                       <button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="bg-zinc-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-zinc-600 border border-zinc-600">+ Criar</button>
                       <div className="h-6 w-px bg-zinc-700 mx-2"></div>
                       {categories.map(cat => (
                           <div key={cat.id} className="bg-zinc-800 border border-zinc-700 rounded-full pl-3 pr-1 py-0.5 text-xs font-medium flex items-center gap-1 text-gray-300">
                               {cat.name}
                               <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded-full p-1 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                           </div>
                       ))}
                   </div>
                   <div className="bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 mt-4"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-zinc-800"><thead className="bg-black"><tr><th className="px-4 py-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={selectedProductIds.size === displayedProducts.length && displayedProducts.length > 0} className="rounded bg-zinc-800 border-zinc-600 text-orange-600 focus:ring-orange-500 cursor-pointer w-4 h-4" /></th><th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase">Produto</th><th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase">Preço</th><th className="px-6 py-4 text-center text-xs font-bold text-zinc-400 uppercase">Status/Promo</th><th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase">Ações</th></tr></thead><tbody className="divide-y divide-zinc-800">{displayedProducts.map((product) => <tr key={product.id} className={`hover:bg-zinc-800/50 ${selectedProductIds.has(product.id) ? 'bg-orange-900/20' : ''}`}><td className="px-4 py-4 text-center"><input type="checkbox" checked={selectedProductIds.has(product.id)} onChange={() => handleSelectProduct(product.id)} className="rounded bg-zinc-800 border-zinc-600 text-orange-600 focus:ring-orange-500 cursor-pointer w-4 h-4" /></td><td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-zinc-800 rounded overflow-hidden flex-shrink-0"><AdminProductThumbnail src={product.image} alt={product.name} /></div><span className="text-white font-bold">{product.name}</span></div></td><td className="px-6 py-4 text-orange-500 font-bold">R$ {product.price.toFixed(2)}</td><td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center gap-2">
                           <div onClick={() => toggleProductAvailability(product.id)} className={`w-10 h-6 rounded-full cursor-pointer relative ${product.available ? 'bg-green-600' : 'bg-zinc-700'}`} title="Disponível?"><div className={`w-4 h-4 bg-white rounded-full absolute top-1 ${product.available ? 'left-5' : 'left-1'} transition-all`} /></div>
                           <button onClick={() => toggleProductPromo(product.id)} className={`text-[10px] px-2 py-1 rounded font-bold border ${product.isPromo ? 'bg-purple-900/50 text-purple-300 border-purple-500' : 'bg-transparent text-gray-500 border-gray-700'}`}>{product.isPromo ? 'EM OFERTA' : 'Sem oferta'}</button>
                       </div>
                   </td><td className="px-6 py-4 text-right"><button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="text-blue-400 hover:text-blue-300 mr-3">Editar</button><button onClick={() => handleDeleteProductSingle(product.id)} className="text-red-500 hover:text-red-400">Excluir</button></td></tr>)}</tbody></table></div></div>
               </div>
            </div>
        )}
        
        {/* CLIENTS */}
        {activeTab === 'clients' && !isVendor && (
            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead className="bg-black">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase">Contato</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase">Carrinho Salvo</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-gray-300">
                            {users.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum cliente cadastrado.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white">{user.name}</p>
                                            <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-6 py-4">{user.phone}</td>
                                        <td className="px-6 py-4">
                                            {user.savedCart && user.savedCart.length > 0 ? (
                                                <span className="bg-orange-900/50 text-orange-400 px-2 py-1 rounded text-xs font-bold border border-orange-800">
                                                    {user.savedCart.length} itens
                                                </span>
                                            ) : <span className="text-gray-600 text-xs">Vazio</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button onClick={() => { setClientOrdersUser(user); setOrdersViewType('client'); }} className="text-green-400 hover:text-green-300 text-xs font-bold bg-green-900/20 px-2 py-1 rounded border border-green-800">
                                                    Pedidos
                                                </button>
                                                <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300 text-xs font-bold bg-blue-900/20 px-2 py-1 rounded border border-blue-800">
                                                    Editar
                                                </button>
                                                
                                                <div className="h-4 w-px bg-zinc-700 mx-1"></div>
                                                
                                                <input 
                                                    type="text" 
                                                    placeholder="Nova senha" 
                                                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20 focus:border-orange-500 outline-none"
                                                    value={passwordInput[user.id] || ''}
                                                    onChange={e => setPasswordInput({...passwordInput, [user.id]: e.target.value})}
                                                />
                                                <button onClick={() => handlePasswordUpdate(user.id)} className="text-xs text-gray-400 hover:text-white">Mudar</button>
                                                
                                                <button onClick={() => handleDeleteClient(user.id)} className="text-red-500 hover:text-red-400 ml-2">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* VENDORS */}
        {activeTab === 'vendors' && !isVendor && (
            <div className="space-y-6">
                <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="bg-orange-600 w-2 h-6 rounded-full"></span>
                        Cadastrar Novo Vendedor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome</label>
                            <input value={newVendorName} onChange={e => setNewVendorName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-600" placeholder="Nome do vendedor" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">WhatsApp (Login)</label>
                            <input value={newVendorPhone} onChange={e => setNewVendorPhone(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-600" placeholder="(00) 00000-0000" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Senha de Acesso</label>
                            <input value={newVendorPass} onChange={e => setNewVendorPass(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-600" placeholder="******" />
                        </div>
                        <Button onClick={handleRegisterVendor} className="w-full !bg-green-600 hover:!bg-green-700">Cadastrar</Button>
                    </div>
                </div>

                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead className="bg-black">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase">Vendedor</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase">Login</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-gray-300">
                            {vendors.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Nenhum vendedor cadastrado.</td></tr>
                            ) : (
                                vendors.map(v => (
                                    <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{v.name}</td>
                                        <td className="px-6 py-4 text-orange-400">{v.phone}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => { setClientOrdersUser(v); setOrdersViewType('vendor'); }} 
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold"
                                                >
                                                    Vendas
                                                </button>
                                                <button onClick={() => handleDeleteClient(v.id)} className="text-red-500 hover:text-red-400 bg-red-900/20 px-3 py-1 rounded border border-red-900/50 text-xs font-bold">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* ABANDONED CARTS */}
        {activeTab === 'abandoned' && !isVendor && (
            <div className="space-y-4 animate-fade-in">
                {abandonedCarts.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 rounded-xl border border-zinc-800 text-gray-500">
                        <p className="text-lg">Nenhum carrinho abandonado no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {abandonedCarts.map(user => (
                            <div key={user.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg hover:border-orange-900 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-white">{user.name}</h4>
                                        <p className="text-xs text-gray-500">{user.phone}</p>
                                    </div>
                                    <span className="bg-orange-900/30 text-orange-400 text-xs font-bold px-2 py-1 rounded">
                                        {user.savedCart?.length} itens
                                    </span>
                                </div>
                                <div className="space-y-1 mb-4">
                                    {user.savedCart?.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="text-xs text-gray-400 flex justify-between">
                                            <span className="truncate w-2/3">{item.name}</span>
                                            <span>R$ {item.price}</span>
                                        </div>
                                    ))}
                                    {(user.savedCart?.length || 0) > 3 && <p className="text-xs text-gray-600 italic">+ {user.savedCart!.length - 3} outros...</p>}
                                </div>
                                <Button onClick={() => handleRecoverCart(user)} className="w-full !bg-green-600 hover:!bg-green-700 !py-2 !text-xs">
                                    📲 Enviar Mensagem
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && !isVendor && (
            <div className="animate-fade-in bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-xl max-w-2xl mx-auto text-white">
                <h3 className="text-xl font-bold mb-6 text-white border-b border-zinc-700 pb-2">Configurações da Loja</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Nome da Loja</label>
                        <input value={settings.shopName} onChange={e => setSettings({...settings, shopName: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-orange-600" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Número de Celular (Contato)</label>
                        <input value={settings.contactNumber} onChange={e => setSettings({...settings, contactNumber: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-orange-600" placeholder="5511999999999" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Sobre Nós</label>
                        <textarea rows={3} value={settings.aboutUs} onChange={e => setSettings({...settings, aboutUs: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-orange-600" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Política de Garantia</label>
                        <textarea rows={2} value={settings.warrantyPolicy} onChange={e => setSettings({...settings, warrantyPolicy: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-orange-600" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Política de Envio</label>
                        <textarea rows={2} value={settings.shippingPolicy} onChange={e => setSettings({...settings, shippingPolicy: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-orange-600" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Taxas e Pagamentos</label>
                        <textarea rows={2} value={settings.feesPolicy} onChange={e => setSettings({...settings, feesPolicy: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white outline-none focus:border-orange-600" />
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <Button onClick={handleSaveSettings} className="!bg-green-600 hover:!bg-green-700 px-8">Salvar Configurações</Button>
                </div>
            </div>
        )}
      </div>
      
      {/* MODALS */}
      <ProductFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} productToEdit={editingProduct} onSave={handleFormSave} categories={categories} />
      <PrintPreviewModal isOpen={!!previewOrder} onClose={() => setPreviewOrder(null)} order={previewOrder} settings={settings} logo={logoUrl} isAdmin={true} />
      
      {/* Client Modals */}
      <ClientEditModal 
        isOpen={!!editingUser && activeTab === 'clients'} 
        user={editingUser} 
        onClose={() => setEditingUser(null)} 
        onSave={handleUpdateClient} 
      />
      <UserOrdersModal 
        isOpen={!!clientOrdersUser} 
        onClose={() => setClientOrdersUser(null)} 
        user={clientOrdersUser} 
        type={ordersViewType}
        onSelectOrder={handleGoToOrder}
      />
    </div>
  );
};
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
import { AdminWelcomeModal } from './AdminWelcomeModal';
import { generateQuotePDF, generateReceiptPDF, generateOrderSummaryPDF } from '../services/printing';

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
  orcamento: 'Pedidos em aberto',
  realizado: 'Pedido Finalizado',
  pagamento_pendente: 'Aguard. Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Concluídos',
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
  
  // Admin Welcome Modal State
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: async () => {},
      isLoading: false
  });

  // Notification Permission State
  const [notifPermission, setNotifPermission] = useState(Notification.permission);

  const requestNotificationPermission = () => {
      Notification.requestPermission().then((permission) => {
          setNotifPermission(permission);
          if (permission === 'granted') {
              showNotification("Notificações ativadas! Você ouvirá um som a cada novo pedido.");
              // Test sound
              try {
                  const audio = new Audio("data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
                  audio.volume = 0.5;
                  audio.play();
              } catch (e) {}
          }
      });
  };

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
      const u = getCurrentUser();
      setCurrentUser(u);
      
      // Trigger Welcome Modal if Admin
      if (u?.isAdmin) {
          setShowWelcomeModal(true);
      }
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
      // ... (existing code)
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
      // ... (existing code)
  };

  const handleDeleteClient = (userId: string) => {
      // ... (existing code)
  };

  const handleDeleteProductSingle = (id: string) => {
      // ... (existing code)
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
      // ... (existing code)
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
      // ... (existing code)
  };

  // Order Action Handlers
  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => { try { const history = [...(order.history || []), { status: newStatus, timestamp: Date.now() }]; await updateOrder({ ...order, status: newStatus, history }); showNotification(`Status alterado: ${STATUS_LABELS[newStatus]}`); } catch (e: any) { alert("Erro status"); } };
  const handleFinalizeSale = async (order: Order) => { if (order.status !== 'orcamento') return; await handleStatusChange(order, 'pagamento_pendente'); };
  const handleConfirmPayment = async (order: Order) => { if (order.status !== 'pagamento_pendente') return; await handleStatusChange(order, 'preparacao'); };
  
  // New helper to just chat with client
  const handleContactClient = (order: Order) => { 
      const msg = encodeURIComponent(`Olá ${order.userName}, gostaria de falar sobre o pedido #${order.id.slice(-6)}.`); 
      window.open(`https://api.whatsapp.com/send?phone=55${order.userPhone.replace(/\D/g, '')}&text=${msg}`, '_blank'); 
  };

  const handleSendReceiptWhatsapp = (order: Order) => { const msg = encodeURIComponent(`Recibo Pedido #${order.id.slice(-6)}`); window.open(`https://api.whatsapp.com/send?phone=55${order.userPhone.replace(/\D/g, '')}&text=${msg}`, '_blank'); };
  const handleDispatchOrder = async (order: Order) => { await updateOrder({ ...order, status: 'transporte', history: [...(order.history||[]), {status:'transporte', timestamp:Date.now()}] }); showNotification('Despachado!'); setOrderStatusFilter('transporte'); };
  
  const handleSaveTracking = async (order: Order) => { 
      const code = trackingInput[order.id];
      if (code !== undefined) {
          await updateOrder({ ...order, trackingCode: code }); 
          showNotification('Rastreio salvo'); 
      }
  };
  
  const handleSendTrackingWhatsapp = (order: Order) => { 
      handleSaveTracking(order); 
      const code = trackingInput[order.id] || order.trackingCode; 
      if(!code) return alert('Digite o código ou link de rastreio'); 
      const msg = encodeURIComponent(`Olá! Seu pedido já está a caminho.\nAcompanhe pelo rastreio: ${code}`); 
      window.open(`https://api.whatsapp.com/send?phone=55${order.userPhone.replace(/\D/g, '')}&text=${msg}`, '_blank'); 
  };
  
  const handleOpenTrackingLink = (order: Order) => {
      const code = trackingInput[order.id] || order.trackingCode;
      if (code && (code.startsWith('http://') || code.startsWith('https://'))) {
          window.open(code, '_blank');
      }
  };
  
  const handleMarkDelivered = async (order: Order) => { 
      openConfirm(
          "Confirmar Entrega",
          "Não é possível voltar atrás. Você confirma a entrega?",
          async () => {
              const deliveredTime = Date.now();
              await updateOrder({ 
                  ...order, 
                  status: 'entregue', 
                  deliveredAt: deliveredTime,
                  history: [...(order.history||[]), {status:'entregue', timestamp: deliveredTime}] 
              }); 
              showNotification('Entregue!'); 
              setOrderStatusFilter('entregue'); 
          }
      );
  };

  // PDF Invoice Upload Handler
  const handleUploadInvoice = async (e: React.ChangeEvent<HTMLInputElement>, order: Order) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.type !== 'application/pdf') {
              alert('Por favor, selecione um arquivo PDF.');
              return;
          }
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              await updateOrder({ ...order, invoicePdf: base64 });
              showNotification('Nota Fiscal anexada com sucesso!');
          };
          reader.readAsDataURL(file);
      }
  };

  // Entity Handlers
  const handleRegisterVendor = async () => { 
    // ... (existing code)
  };

  const handleUpdateClient = async (updatedUser: User) => { if (!updatedUser) return; await updateUser(updatedUser); setEditingUser(null); showNotification('Atualizado!'); };
  const handlePasswordUpdate = async (userId: string) => { const newPass = passwordInput[userId]; if (!newPass || newPass.length < 6) return alert("Senha min 6 digitos"); await updateUserPassword(userId, newPass); setPasswordInput(prev => ({...prev, [userId]: ''})); showNotification("Senha alterada!"); };
  const handleSaveSettings = async () => { await saveShopSettings(settings); if (logoUrl) await saveLogo(logoUrl); showNotification('Configurações salvas!'); };
  const handleFormSave = (product: Product | Omit<Product, 'id'>) => { if ('id' in product) onUpdateProduct(product as Product); else onAddProduct(product); setIsFormOpen(false); setEditingProduct(null); showNotification('Produto salvo!'); };
  const handleAddCategory = async () => { if (!newCategoryName.trim()) return; await addCategory(newCategoryName); setNewCategoryName(''); showNotification('Categoria criada!'); };
  const handleRecoverCart = (user: User) => { 
      // ... (existing code)
  };

  return (
    <div className="bg-gray-100 rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] relative">
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
      
      <AdminWelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
        orders={orders}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} 
        isLoading={confirmModal.isLoading || false} 
      />

      {/* --- NOTIFICATION PERMISSION BANNER --- */}
      {(notifPermission === 'default' || notifPermission === 'denied') && (
          <div className="bg-orange-600 text-white px-6 py-3 flex flex-col md:flex-row justify-between items-center animate-fade-in relative z-50">
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                  <div className="bg-white/20 p-2 rounded-full animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                  </div>
                  <div>
                      <p className="font-bold text-sm">Não perca vendas!</p>
                      <p className="text-xs text-orange-100">Ative as notificações para receber alertas sonoros de novos pedidos.</p>
                  </div>
              </div>
              <button 
                  onClick={requestNotificationPermission}
                  className="bg-white text-orange-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors shadow-md"
              >
                  {notifPermission === 'denied' ? 'Ativar no Navegador' : 'Ativar Notificações'}
              </button>
          </div>
      )}

      {/* Tabs and Dashboard Render */}
      
      <div className="flex border-b border-gray-100 overflow-x-auto bg-zinc-900 text-white scrollbar-hide">
        {[{ id: 'dashboard', label: '📊 Dashboard', show: true }, { id: 'orders', label: '💰 Minhas Vendas', show: true }, { id: 'products', label: '📦 Produtos', show: !isVendor }, { id: 'clients', label: '👥 Clientes', show: !isVendor }, { id: 'vendors', label: '👔 Vendedores', show: !isVendor }, { id: 'abandoned', label: '🛒 Carrinhos Abandonados', show: !isVendor }, { id: 'settings', label: '⚙️ Configurações', show: !isVendor }].filter(t => t.show).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`flex-shrink-0 py-4 px-6 text-sm font-bold border-b-4 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-white'}`}>{tab.label}</button>
        ))}
      </div>
      <div className="p-6">
        
        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
            <div className="animate-fade-in space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Aprovação Pendente" value={dashboardData.pendingApproval} icon={<span className="text-2xl">⏳</span>} colorClass="bg-gray-500 text-gray-300" subText="Orçamentos" />
                    <StatCard title="Aguard. Pagamento" value={dashboardData.pendingPayment} icon={<span className="text-2xl">💰</span>} colorClass="bg-yellow-500 text-yellow-300" />
                    <StatCard title="Em Preparação" value={dashboardData.preparation} icon={<span className="text-2xl">📦</span>} colorClass="bg-orange-500 text-orange-400" />
                    <StatCard title="Em Trânsito" value={dashboardData.inTransit} icon={<span className="text-2xl">🚚</span>} colorClass="bg-purple-500 text-purple-300" />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Hourly Sales */}
                    <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg">
                        <h3 className="text-white font-bold mb-2">Vendas Hoje (Por Hora)</h3>
                        <InteractiveBarChart data={dashboardData.chartDataHour} colorClass="text-orange-500" barColor="bg-orange-500" />
                    </div>
                    {/* Weekly Sales */}
                    <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg">
                        <h3 className="text-white font-bold mb-2">Vendas da Semana</h3>
                        <InteractiveBarChart data={dashboardData.chartDataWeek} colorClass="text-blue-500" barColor="bg-blue-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Vendor Share */}
                    <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg col-span-1">
                        <h3 className="text-white font-bold mb-4 text-center">Vendas por Vendedor</h3>
                        <InteractiveDonutChart data={dashboardData.chartDataVendor} />
                    </div>
                    {/* Monthly Trend */}
                    <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg lg:col-span-2">
                        <h3 className="text-white font-bold mb-2">Evolução Mensal (Ano Atual)</h3>
                        <InteractiveBarChart data={dashboardData.chartDataMonth} colorClass="text-green-500" barColor="bg-green-500" />
                    </div>
                </div>
            </div>
        )}

        {/* Orders Tab Content */}
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
                    
                    <div className="relative w-full md:w-64 group">
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
                    
                    // Display delivery time if delivered
                    let deliveryTimeText = '';
                    if (order.status === 'entregue' && order.deliveredAt) {
                        deliveryTimeText = new Date(order.deliveredAt).toLocaleString('pt-BR');
                    }

                    // Determine input value for tracking logic
                    const trackingVal = trackingInput[order.id] || order.trackingCode || '';
                    const isTrackingUrl = trackingVal.startsWith('http');

                    return (
                        <div key={order.id} className={`rounded-xl border shadow-lg ${STATUS_STYLES[order.status]?.split(' ')[0]} border-l-4 bg-zinc-900 text-gray-200`}>
                            <div className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${STATUS_BG[order.status]}`} onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div><h4 className="font-extrabold text-lg text-white">{order.userName}</h4><p className={`text-xs font-bold uppercase ${STATUS_STYLES[order.status]?.split(' ')[1]}`}>{STATUS_LABELS[order.status]}</p></div>
                                    <div className="text-right"><span className="text-2xl font-bold text-white block">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span><span className="text-xs text-gray-400">#{order.id}</span></div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-zinc-800 px-2 py-1 rounded text-orange-400 font-bold border border-orange-500/30">📍 {order.userCity || 'N/D'}</span>
                                        <span>• {order.items.reduce((a,b)=>a+b.quantity,0)} itens</span>
                                        {deliveryTimeText && <span className="text-green-400 font-bold ml-2">Entregue: {deliveryTimeText}</span>}
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="p-4 bg-zinc-950 border-t border-zinc-800 animate-fade-in">
                                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800 justify-end items-center">
                                        {currentUser?.isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="text-xs px-3 py-2 border rounded mr-auto flex items-center gap-1 font-bold text-red-500 border-red-900 hover:bg-red-900/20">Excluir</button>}
                                        
                                        {/* QUOTE PDF - Only visible for 'orcamento' */}
                                        {order.status === 'orcamento' && (
                                            <button onClick={(e) => { e.stopPropagation(); generateQuotePDF(order, settings, logoUrl); }} className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded font-bold border border-blue-600 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Baixar Orçamento PDF</button>
                                        )}
                                        
                                        {!isLocked && <button onClick={(e) => { e.stopPropagation(); onEditOrder(order); }} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-3 py-2 rounded font-bold border border-blue-900">✏️ Editar Pedido</button>}
                                        
                                        {/* WhatsApp Button - Visible everywhere EXCEPT 'transporte' */}
                                        {order.status !== 'transporte' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleContactClient(order); }} className="text-xs bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded font-bold border border-green-600">💬 Chamar no Zap</button>
                                        )}

                                        {/* Specific Actions per Status */}
                                        {order.status === 'orcamento' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleFinalizeSale(order); }} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold">✅ Aprovar Venda</button>
                                        )}
                                        
                                        {order.status === 'pagamento_pendente' && !isVendor && <button onClick={(e) => { e.stopPropagation(); handleConfirmPayment(order); }} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold">💰 Confirmar Pagamento</button>}
                                        
                                        {order.status === 'preparacao' && !isVendor && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); generateOrderSummaryPDF(order, settings, logoUrl); }} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-bold border border-blue-800 flex items-center gap-1">
                                                    📄 Baixar Recibo
                                                </button>

                                                <label className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded font-bold border border-gray-600 cursor-pointer flex items-center gap-1">
                                                    📄 Anexar NF (PDF)
                                                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleUploadInvoice(e, order)} onClick={(e) => e.stopPropagation()} />
                                                </label>
                                                <button onClick={(e) => { e.stopPropagation(); handleDispatchOrder(order); }} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold">🚚 Despachar</button>
                                            </>
                                        )}
                                        
                                        {/* Invoice Download - Hide if in Transit */}
                                        {order.invoicePdf && order.status !== 'transporte' && (
                                            <a href={order.invoicePdf} download={`NF-${order.id}.pdf`} onClick={(e) => e.stopPropagation()} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-bold border border-red-800 flex items-center gap-1">
                                                ⬇️ Baixar NF
                                            </a>
                                        )}

                                        {order.status === 'transporte' && (
                                            <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
                                                <input 
                                                    placeholder="Link ou Código de Rastreio" 
                                                    className="bg-transparent text-white text-xs px-2 py-1 w-40 outline-none placeholder-gray-500" 
                                                    value={trackingVal} 
                                                    onChange={(e) => setTrackingInput({...trackingInput, [order.id]: e.target.value})} 
                                                    onBlur={() => handleSaveTracking(order)}
                                                    onClick={(e) => e.stopPropagation()} 
                                                />
                                                {/* Actions appear only if there is input */}
                                                {trackingVal && (
                                                    <>
                                                        {isTrackingUrl && (
                                                            <button 
                                                                onClick={(e) => {e.stopPropagation(); handleOpenTrackingLink(order);}} 
                                                                className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded font-bold text-xs"
                                                                title="Abrir Link"
                                                            >
                                                                🔗
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={(e) => {e.stopPropagation(); handleSendTrackingWhatsapp(order);}} 
                                                            className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded font-bold text-xs"
                                                            title="Enviar no WhatsApp"
                                                        >
                                                            📲
                                                        </button>
                                                    </>
                                                )}
                                                <div className="w-px h-6 bg-zinc-600 mx-1"></div>
                                                <button 
                                                    onClick={(e) => {e.stopPropagation(); handleMarkDelivered(order);}} 
                                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1"
                                                >
                                                    ✅ Entregue
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Order Details (Time, Shipping, Fees, Personal Info) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        <div>
                                            <p className="font-bold text-gray-400 uppercase text-[10px]">Data e Hora</p>
                                            <p className="text-white">{new Date(order.createdAt).toLocaleDateString()} às {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-400 uppercase text-[10px]">Forma de Envio</p>
                                            <p className="text-white">{order.shippingMethod || 'Não selecionado'}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-400 uppercase text-[10px]">Adicionais</p>
                                            <div className="flex gap-3">
                                                <span className={order.wantsInvoice ? "text-green-400 font-bold" : "text-gray-500"}>Nota: {order.wantsInvoice ? 'Sim' : 'Não'}</span>
                                                <span className="text-gray-500">|</span>
                                                <span className={order.wantsInsurance ? "text-green-400 font-bold" : "text-gray-500"}>Seguro: {order.wantsInsurance ? 'Sim' : 'Não'}</span>
                                            </div>
                                        </div>
                                        {/* New Fields */}
                                        {order.userCpf && <div><p className="font-bold text-gray-400 uppercase text-[10px]">CPF</p><p className="text-white">{order.userCpf}</p></div>}
                                        {order.userBirthDate && <div><p className="font-bold text-gray-400 uppercase text-[10px]">Nascimento</p><p className="text-white">{order.userBirthDate}</p></div>}
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
        
        {/* ... (Modals remain unchanged) ... */}
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
                           <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none">
                               <option value="all">Todas as Categorias</option>
                               {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                           </select>
                           
                           <div className="relative flex-grow">
                               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                   <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                       <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
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

        {/* Vendors */}
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
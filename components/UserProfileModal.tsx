
import React, { useState, useEffect, useMemo } from 'react';
import { User, Order } from '../types';
import { Button } from './Button';
import { fetchAddressByCep, updateUser, getOrders } from '../services/storage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (updated: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'stats'>('profile');
  const [formData, setFormData] = useState<Partial<User>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({ ...user });
      const loadOrders = async () => {
          const all = await getOrders();
          setOrders(all.filter(o => o.userId === user.id));
      };
      loadOrders();
      setIsConfirmingSave(false);
      setShowSuccessToast(false);
    }
  }, [user, isOpen]);

  const stats = useMemo(() => {
      const total = orders.length;
      const inTransit = orders.filter(o => o.status === 'transporte').length;
      const delivered = orders.filter(o => o.status === 'entregue').length;
      const totalSpent = orders
          .filter(o => o.status === 'entregue')
          .reduce((acc, o) => acc + o.total, 0);

      return { total, inTransit, delivered, totalSpent };
  }, [orders]);

  if (!isOpen || !user) return null;

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCepBlur = async () => {
    if (!formData.cep) return;
    const raw = formData.cep.replace(/\D/g, '');
    if (raw.length === 8) {
      setLoadingCep(true);
      const data = await fetchAddressByCep(raw);
      setLoadingCep(false);
      if (data) {
        setFormData(prev => ({
          ...prev,
          city: data.city,
          street: data.street,
          district: data.district
        }));
      }
    }
  };

  const startSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmingSave(true);
  };

  const confirmAndSave = async () => {
    setLoading(true);
    const updated = { ...user, ...formData } as User;
    await updateUser(updated);
    onUpdate(updated);
    setLoading(false);
    setIsConfirmingSave(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Success Toast */}
        {showSuccessToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-xl animate-bounce-in">
                ✅ Cadastro atualizado com sucesso!
            </div>
        )}

        {/* Confirmation Overlay */}
        {isConfirmingSave && (
            <div className="absolute inset-0 z-[100] bg-zinc-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in text-center">
                <div className="max-w-xs space-y-6">
                    <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-orange-500/40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white">Quase lá!</h3>
                        <p className="text-gray-400 text-sm">Deseja confirmar os novos dados de cadastro?</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={confirmAndSave} className="w-full !bg-green-600 !py-4 shadow-xl" isLoading={loading}>
                            Confirmar e Atualizar
                        </Button>
                        <button onClick={() => setIsConfirmingSave(false)} className="text-gray-500 hover:text-white font-bold text-sm underline">
                            Voltar e Corrigir
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header Section */}
        <div className="p-6 bg-zinc-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shadow-orange-900/50">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl font-extrabold">{user.name}</h2>
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Membro desde {user.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'profile' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                👤 Meus Dados
            </button>
            <button 
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'stats' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                📊 Estatísticas & Pedidos
            </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 bg-gray-50/30">
            {activeTab === 'profile' ? (
                <form onSubmit={startSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome Completo</label>
                            <input 
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">WhatsApp</label>
                            <input 
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                value={formData.phone || ''}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">CPF</label>
                            <input 
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                value={formData.cpf || ''}
                                maxLength={14}
                                onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nascimento *</label>
                            <input 
                                type="date"
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                value={formData.birthDate || ''}
                                onChange={e => setFormData({...formData, birthDate: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="bg-orange-100 p-1 rounded">📍</span> Endereço Principal
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="col-span-1 relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">CEP</label>
                                <input 
                                    className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    value={formData.cep || ''}
                                    onBlur={handleCepBlur}
                                    onChange={e => setFormData({...formData, cep: e.target.value})}
                                    placeholder="00000-000"
                                    required
                                />
                                {loadingCep && <div className="absolute top-9 right-3 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cidade</label>
                                <input 
                                    className="w-full bg-gray-100 border border-gray-200 p-3 rounded-xl text-gray-500 font-medium outline-none shadow-sm"
                                    value={formData.city || ''}
                                    readOnly
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rua</label>
                                <input 
                                    className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    value={formData.street || ''}
                                    onChange={e => setFormData({...formData, street: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nº</label>
                                <input 
                                    className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    value={formData.number || ''}
                                    onChange={e => setFormData({...formData, number: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Bairro</label>
                                <input 
                                    className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    value={formData.district || ''}
                                    onChange={e => setFormData({...formData, district: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Complemento</label>
                                <input 
                                    className="w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    value={formData.complement || ''}
                                    onChange={e => setFormData({...formData, complement: e.target.value})}
                                    placeholder="Ex: Apto 101"
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full !py-4 shadow-xl shadow-orange-500/20" isLoading={loading}>
                        Atualizar Cadastro
                    </Button>
                </form>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* STATS GRID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pedidos</p>
                            <p className="text-2xl font-black text-zinc-900">{stats.total}</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Em Trânsito</p>
                            <p className="text-2xl font-black text-indigo-700">{stats.inTransit}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm">
                            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Entregues</p>
                            <p className="text-2xl font-black text-green-700">{stats.delivered}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Investimento</p>
                            <p className="text-2xl font-black text-orange-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalSpent)}</p>
                        </div>
                    </div>

                    {/* RECENT ORDERS LIST */}
                    <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                            Histórico Recente
                            <span className="text-[10px] font-medium lowercase text-gray-400 italic">Últimos {orders.length} pedidos</span>
                        </h3>
                        <div className="space-y-3">
                            {orders.length === 0 ? (
                                <p className="text-center py-8 text-gray-400 italic text-sm bg-white rounded-2xl border border-dashed">Você ainda não possui pedidos.</p>
                            ) : (
                                orders.slice(0, 5).map(order => (
                                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-orange-200 transition-colors">
                                        <div>
                                            <p className="text-xs font-black text-gray-800">Pedido #{order.id.slice(-6)}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-orange-600">R$ {order.total.toFixed(2)}</p>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${order.status === 'entregue' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      <style>{`
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounce-in {
            0% { transform: translate(-50%, -100%); opacity: 0; }
            60% { transform: translate(-50%, 20px); opacity: 1; }
            100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

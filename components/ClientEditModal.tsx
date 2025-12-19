
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { fetchAddressByCep } from '../services/storage';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (updatedUser: User) => void;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState<User | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ ...user });
    }
  }, [user, isOpen]);

  if (!isOpen || !formData) return null;

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    return v.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
  };

  const maskCEP = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleCepBlur = async () => {
    if (!formData?.cep) return;
    const raw = formData.cep.replace(/\D/g, '');
    if (raw.length === 8) {
      setLoadingAddress(true);
      const data = await fetchAddressByCep(raw);
      setLoadingAddress(false);
      if (data) {
        setFormData(prev => prev ? {
          ...prev,
          city: data.city,
          street: data.street,
          district: data.district
        } : null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-scale-up">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Editar Cliente</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                <input 
                    value={formData.name} 
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Telefone (Login)</label>
                <input 
                    value={formData.phone} 
                    onChange={e => handleChange('phone', maskPhone(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                    required
                />
            </div>

            <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Endereço</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">CEP</label>
                        <input 
                            value={formData.cep || ''} 
                            onChange={e => handleChange('cep', maskCEP(e.target.value))}
                            onBlur={handleCepBlur}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-sm"
                            placeholder="00000-000"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex justify-between">
                            Cidade 
                            {loadingAddress && <span className="text-orange-500 animate-pulse">Buscando...</span>}
                        </label>
                        <input 
                            value={formData.city || ''} 
                            onChange={e => handleChange('city', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-sm bg-gray-50"
                        />
                    </div>
                </div>
                <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Rua</label>
                    <input 
                        value={formData.street || ''} 
                        onChange={e => handleChange('street', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-sm"
                    />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Número</label>
                        <input 
                            value={formData.number || ''} 
                            onChange={e => handleChange('number', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-sm"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Bairro</label>
                        <input 
                            value={formData.district || ''} 
                            onChange={e => handleChange('district', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-sm"
                        />
                    </div>
                </div>
                <div className="mb-3">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Complemento</label>
                    <input 
                        value={formData.complement || ''} 
                        onChange={e => handleChange('complement', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-sm"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" className="!bg-blue-600 hover:!bg-blue-700">Salvar Alterações</Button>
            </div>
        </form>
      </div>
    </div>
  );
};

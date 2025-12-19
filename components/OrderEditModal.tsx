
import React, { useState, useEffect } from 'react';
import { Order, CartItem, Product } from '../types';
import { Button } from './Button';
import { getStoredProducts, fetchAddressByCep } from '../services/storage';

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (updatedOrder: Order) => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ isOpen, onClose, order, onSave }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState({
    cep: '', street: '', number: '', district: '', city: '', complement: ''
  });
  const [financials, setFinancials] = useState({
    shippingMethod: '', shippingCost: 0, discount: 0,
    invoicePercent: 6, insuranceAmount: 0,
    wantsInvoice: false, wantsInsurance: false
  });
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (order) {
      setItems(JSON.parse(JSON.stringify(order.items)));
      setAddress({
        cep: order.userCep || '', street: order.userStreet || '', number: order.userNumber || '',
        district: order.userDistrict || '', city: order.userCity || '', complement: order.userComplement || '' 
      });
      setFinancials({
        shippingMethod: order.shippingMethod || '',
        shippingCost: order.shippingCost || 0,
        discount: order.discount || 0,
        invoicePercent: order.invoiceTaxPercent !== undefined ? order.invoiceTaxPercent : 6,
        insuranceAmount: order.insuranceTaxAmount !== undefined ? order.insuranceTaxAmount : 0,
        wantsInvoice: !!order.wantsInvoice,
        wantsInsurance: !!order.wantsInsurance
      });
      const loadProducts = async () => setAllProducts(await getStoredProducts());
      loadProducts();
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const maskCEP = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const handleCepBlur = async () => {
    const raw = address.cep.replace(/\D/g, '');
    if (raw.length === 8) {
      setLoadingCep(true);
      const data = await fetchAddressByCep(raw);
      setLoadingCep(false);
      if (data) setAddress(prev => ({ ...prev, street: data.street, district: data.district, city: data.city }));
    }
  };

  const handleSave = () => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const { discount, shippingCost, shippingMethod, invoicePercent, insuranceAmount, wantsInvoice, wantsInsurance } = financials;
    
    let fees = 0;
    if (wantsInvoice) fees += subtotal * (invoicePercent / 100);
    if (wantsInsurance) fees += insuranceAmount;

    const newTotal = Math.max(0, subtotal - discount + shippingCost + fees);

    const updatedOrder: Order = {
      ...order, 
      items, 
      total: newTotal, 
      discount, 
      shippingCost, 
      shippingMethod,
      wantsInvoice,
      wantsInsurance,
      invoiceTaxPercent: invoicePercent, 
      insuranceTaxAmount: insuranceAmount,
      userCep: address.cep, 
      userStreet: address.street, 
      userNumber: address.number,
      userDistrict: address.district, 
      userCity: address.city, 
      userComplement: address.complement
    };
    onSave(updatedOrder);
    onClose();
  };

  const currentSubtotal = items.reduce((a, i) => a + (i.price * i.quantity), 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Editar Pedido #{order.id.slice(-6)}</h2>
        
        <div className="space-y-6">
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 text-white shadow-inner">
              <h3 className="text-xs font-black uppercase mb-4 text-orange-500 tracking-widest">📍 Logística de Entrega</h3>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4"><input value={address.cep} onChange={e => setAddress({...address, cep: maskCEP(e.target.value)})} onBlur={handleCepBlur} placeholder="CEP" className="w-full bg-zinc-800 border-zinc-600 p-2 rounded text-sm outline-none focus:border-orange-500 transition-colors"/></div>
                <div className="col-span-8"><input value={address.city} readOnly className="w-full bg-zinc-950 border-zinc-800 p-2 rounded text-sm text-gray-500 font-bold"/></div>
                <div className="col-span-9"><input value={address.street} onChange={e => setAddress({...address, street: e.target.value})} placeholder="Rua" className="w-full bg-zinc-800 border-zinc-600 p-2 rounded text-sm outline-none focus:border-orange-500 transition-colors"/></div>
                <div className="col-span-3"><input value={address.number} onChange={e => setAddress({...address, number: e.target.value})} placeholder="Nº" className="w-full bg-zinc-800 border-zinc-600 p-2 rounded text-sm outline-none focus:border-orange-500 transition-colors"/></div>
              </div>
            </div>

            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
              <h3 className="text-xs font-black text-indigo-900 uppercase mb-4 tracking-widest">🚚 Frete e Taxas Administrativas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">Valor do Frete (R$)</label>
                  <input type="number" value={financials.shippingCost} onChange={e => setFinancials({...financials, shippingCost: parseFloat(e.target.value) || 0})} className="w-full border-2 border-indigo-200 p-2 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">Desconto Especial (R$)</label>
                  <input type="number" value={financials.discount} onChange={e => setFinancials({...financials, discount: parseFloat(e.target.value) || 0})} className="w-full border-2 border-indigo-200 p-2 rounded-lg text-sm text-red-600 font-black focus:border-indigo-500 outline-none transition-colors"/>
                </div>
                
                <div className="col-span-full pt-4 border-t border-indigo-200 space-y-4">
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={financials.wantsInvoice} onChange={e => setFinancials({...financials, wantsInvoice: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"/>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">Nota Fiscal (NF)</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="number" value={financials.invoicePercent} onChange={e => setFinancials({...financials, invoicePercent: parseFloat(e.target.value) || 0})} className="w-20 border-2 border-gray-100 p-1 rounded text-center font-bold text-indigo-600 focus:border-indigo-500 outline-none" placeholder="0"/>
                            <span className="text-sm font-bold text-gray-400">%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={financials.wantsInsurance} onChange={e => setFinancials({...financials, wantsInsurance: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"/>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">Taxa de Seguro</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-400">R$</span>
                            <input type="number" value={financials.insuranceAmount} onChange={e => setFinancials({...financials, insuranceAmount: parseFloat(e.target.value) || 0})} className="w-24 border-2 border-gray-100 p-1 rounded text-right font-bold text-indigo-600 focus:border-indigo-500 outline-none" placeholder="0.00"/>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t-2 border-dashed border-gray-100 pt-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total a Receber</span>
                    <p className="text-3xl font-black text-gray-900">R$ {Math.max(0, currentSubtotal - financials.discount + financials.shippingCost + (financials.wantsInvoice ? currentSubtotal * (financials.invoicePercent/100) : 0) + (financials.wantsInsurance ? financials.insuranceAmount : 0)).toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="!border-2">Cancelar</Button>
                    <Button onClick={handleSave} className="!bg-green-600 !py-3 !px-8 shadow-xl shadow-green-600/20">Salvar Pedido</Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

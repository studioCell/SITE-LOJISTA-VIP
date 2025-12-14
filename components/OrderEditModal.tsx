
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
  // Items State
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Address State
  const [address, setAddress] = useState({
    cep: '',
    street: '',
    number: '',
    district: '',
    city: '',
    complement: ''
  });

  // Financial State
  const [financials, setFinancials] = useState({
    shippingMethod: '',
    shippingCost: 0,
    discount: 0
  });

  // Add Item Logic
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (order) {
      setItems(JSON.parse(JSON.stringify(order.items)));
      setAddress({
        cep: order.userCep || '',
        street: order.userStreet || '',
        number: order.userNumber || '',
        district: order.userDistrict || '',
        city: order.userCity || '',
        complement: order.userComplement || '' 
      });
      setFinancials({
        shippingMethod: order.shippingMethod || '',
        shippingCost: order.shippingCost || 0,
        discount: order.discount || 0
      });

      const loadProducts = async () => {
        const products = await getStoredProducts();
        setAllProducts(products);
      };
      loadProducts();
    }
    setIsAddingMode(false);
    setSearchTerm('');
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  // --- Items Logic ---
  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddNewItem = (product: Product) => {
    const existingItemIndex = items.findIndex(i => i.id === product.id);
    if (existingItemIndex >= 0) {
      updateQty(product.id, 1);
    } else {
      setItems(prev => [...prev, { ...product, quantity: 1, note: '' }]);
    }
    setIsAddingMode(false);
    setSearchTerm('');
  };

  // --- Address Logic ---
  const handleCepBlur = async () => {
    const raw = address.cep.replace(/\D/g, '');
    if (raw.length === 8) {
      setLoadingCep(true);
      const data = await fetchAddressByCep(raw);
      setLoadingCep(false);
      if (data) {
        setAddress(prev => ({
          ...prev,
          street: data.street,
          district: data.district,
          city: data.city
        }));
      }
    }
  };

  // --- Save Logic ---
  const handleSave = () => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const { discount, shippingCost, shippingMethod } = financials;
    
    // Recalculate Fees based on flags (logic mirrored from App/SalesArea)
    let fees = 0;
    if (order.wantsInvoice) fees += subtotal * 0.06;
    if (order.wantsInsurance) fees += subtotal * 0.03;

    const newTotal = Math.max(0, subtotal - discount + shippingCost + fees);

    const updatedOrder: Order = {
      ...order,
      items: items,
      total: newTotal,
      discount,
      shippingCost,
      shippingMethod,
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

  const filteredProductsToSelect = allProducts.filter(p => 
    p.available && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up flex flex-col">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isAddingMode ? 'Adicionar Produto' : `Editar Pedido #${order.id.slice(-6)}`}
          </h2>
          {isAddingMode && (
             <button onClick={() => setIsAddingMode(false)} className="text-sm text-gray-500 hover:text-orange-600 underline">
               Voltar
             </button>
          )}
        </div>
        
        {!isAddingMode ? (
          <div className="space-y-6">
            
            {/* 1. Address Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                📍 Endereço de Entrega
              </h3>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4 sm:col-span-3">
                  <label className="text-xs text-gray-500 font-bold">CEP</label>
                  <input 
                    value={address.cep} 
                    onChange={e => setAddress({...address, cep: e.target.value})}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="w-full border p-2 rounded text-sm"
                  />
                  {loadingCep && <span className="text-[10px] text-orange-500">Buscando...</span>}
                </div>
                <div className="col-span-8 sm:col-span-9">
                  <label className="text-xs text-gray-500 font-bold">Cidade</label>
                  <input 
                    value={address.city} 
                    onChange={e => setAddress({...address, city: e.target.value})}
                    className="w-full border p-2 rounded text-sm bg-gray-100"
                    readOnly
                  />
                </div>
                <div className="col-span-8">
                  <label className="text-xs text-gray-500 font-bold">Rua</label>
                  <input 
                    value={address.street} 
                    onChange={e => setAddress({...address, street: e.target.value})}
                    className="w-full border p-2 rounded text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-gray-500 font-bold">Número</label>
                  <input 
                    value={address.number} 
                    onChange={e => setAddress({...address, number: e.target.value})}
                    className="w-full border p-2 rounded text-sm"
                  />
                </div>
                <div className="col-span-6">
                  <label className="text-xs text-gray-500 font-bold">Bairro</label>
                  <input 
                    value={address.district} 
                    onChange={e => setAddress({...address, district: e.target.value})}
                    className="w-full border p-2 rounded text-sm"
                  />
                </div>
                <div className="col-span-6">
                  <label className="text-xs text-gray-500 font-bold">Complemento</label>
                  <input 
                    value={address.complement} 
                    onChange={e => setAddress({...address, complement: e.target.value})}
                    className="w-full border p-2 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping & Values */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h3 className="text-sm font-bold text-indigo-800 uppercase mb-3 flex items-center gap-2">
                🚚 Frete e Descontos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-indigo-700 font-bold">Forma de Envio</label>
                  <select 
                    value={financials.shippingMethod}
                    onChange={e => {
                        const method = e.target.value;
                        setFinancials(prev => ({
                            ...prev, 
                            shippingMethod: method,
                            shippingCost: method === 'Retirada' ? 0 : prev.shippingCost
                        }));
                    }}
                    className="w-full border p-2 rounded text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="Motoboy">Motoboy</option>
                    <option value="Correios">Correios</option>
                    <option value="Transportadora">Transportadora</option>
                    <option value="Retirada">Retirada (Loja)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-indigo-700 font-bold">Valor Frete (R$)</label>
                  <input 
                    type="number"
                    value={financials.shippingCost}
                    onChange={e => setFinancials({...financials, shippingCost: parseFloat(e.target.value) || 0})}
                    className="w-full border p-2 rounded text-sm"
                    disabled={financials.shippingMethod === 'Retirada'}
                  />
                </div>
                <div>
                  <label className="text-xs text-indigo-700 font-bold">Desconto (R$)</label>
                  <input 
                    type="number"
                    value={financials.discount}
                    onChange={e => setFinancials({...financials, discount: parseFloat(e.target.value) || 0})}
                    className="w-full border p-2 rounded text-sm text-red-600 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 3. Items List */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">📦 Itens do Pedido</h3>
                    <button 
                        onClick={() => setIsAddingMode(true)}
                        className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200"
                    >
                        + Adicionar Produto
                    </button>
                </div>
                <div className="space-y-2 border border-gray-200 rounded-lg p-2 max-h-48 overflow-y-auto bg-gray-50">
                {items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">Un: R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-gray-100 rounded text-gray-600 font-bold">-</button>
                            <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-gray-100 rounded text-gray-600 font-bold">+</button>
                            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:bg-red-50 p-1">
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Footer Summary */}
            <div className="flex justify-between items-center border-t pt-4">
              <div className="text-sm">
                 <p className="text-gray-500">Total Previsto: <span className="text-lg font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        Math.max(0, items.reduce((acc, i) => acc + (i.price * i.quantity), 0) - financials.discount + financials.shippingCost)
                    )}
                 </span></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} className="!bg-green-600">Salvar Alterações</Button>
              </div>
            </div>
          </div>
        ) : (
          /* ADD MODE */
          <div className="flex flex-col h-full">
            <input 
              type="text" 
              autoFocus
              placeholder="Buscar produto por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none mb-4"
            />
            <div className="flex-grow overflow-y-auto max-h-[50vh] space-y-2 pr-1">
              {filteredProductsToSelect.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => handleAddNewItem(product)}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-white border border-gray-100 hover:border-orange-300 hover:bg-orange-50"
                  >
                     <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                        {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : 'IMG'}
                     </div>
                     <div className="flex-grow">
                        <p className="text-sm font-bold text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">R$ {product.price.toFixed(2)}</p>
                     </div>
                     <span className="text-xs font-bold text-orange-600">+ Adicionar</span>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

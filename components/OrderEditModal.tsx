import React, { useState, useEffect } from 'react';
import { Order, CartItem, Product } from '../types';
import { Button } from './Button';
import { getStoredProducts } from '../services/storage';

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (updatedOrder: Order) => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ isOpen, onClose, order, onSave }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // State for adding new products
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (order) {
      setItems(JSON.parse(JSON.stringify(order.items)));
      // Load products for the "Add" feature
      const loadProducts = async () => {
        const products = await getStoredProducts();
        setAllProducts(products);
      };
      loadProducts();
    }
    // Reset mode when opening
    setIsAddingMode(false);
    setSearchTerm('');
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

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
      // Item exists, just increment quantity
      updateQty(product.id, 1);
    } else {
      // Add new item
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        note: ''
      };
      setItems(prev => [...prev, newItem]);
    }
    // Go back to list view
    setIsAddingMode(false);
    setSearchTerm('');
  };

  const handleSave = () => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = order.discount || 0;
    const newTotal = Math.max(0, subtotal - discount);

    const updatedOrder: Order = {
      ...order,
      items: items,
      total: newTotal
    };
    onSave(updatedOrder);
    onClose();
  };

  // Filter products for the add list
  const filteredProductsToSelect = allProducts.filter(p => 
    p.available && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isAddingMode ? 'Adicionar Produto' : `Editar Pedido #${order.id.slice(-6)}`}
          </h2>
          {isAddingMode && (
             <button onClick={() => setIsAddingMode(false)} className="text-sm text-gray-500 hover:text-orange-600 underline">
               Voltar
             </button>
          )}
        </div>
        
        {!isAddingMode ? (
          /* --- EDIT MODE: List Current Items --- */
          <>
            <div className="bg-orange-50 p-3 rounded mb-4 text-xs text-orange-800 border border-orange-100">
              Você está editando os itens. O desconto aplicado anteriormente (R$ {order.discount?.toFixed(2) || '0.00'}) será mantido no cálculo final.
            </div>

            <div className="space-y-3 mb-6 flex-grow overflow-y-auto max-h-[40vh]">
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">Unit: R$ {item.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded">
                      <button onClick={() => updateQty(item.id, -1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">-</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">+</button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-gray-500">Nenhum item neste pedido.</p>}
            </div>

            <button 
              onClick={() => setIsAddingMode(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors mb-4 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Novo Produto ao Pedido
            </button>

            <div className="flex justify-between items-center border-t pt-4 mt-auto">
              <div className="text-lg font-bold text-gray-900">
                 {/* Preview Total just for visual, logic handles real calc */}
                Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Alterações</Button>
              </div>
            </div>
          </>
        ) : (
          /* --- ADD MODE: Search & Select --- */
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
              {filteredProductsToSelect.map(product => {
                const isAlreadyInOrder = items.some(i => i.id === product.id);
                return (
                  <div 
                    key={product.id} 
                    onClick={() => handleAddNewItem(product)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${isAlreadyInOrder ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100 hover:border-orange-300 hover:bg-gray-50'}`}
                  >
                     <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                        {product.image ? (
                           <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">IMG</div>
                        )}
                     </div>
                     <div className="flex-grow">
                        <p className="text-sm font-bold text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">R$ {product.price.toFixed(2)}</p>
                     </div>
                     {isAlreadyInOrder ? (
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">No Pedido</span>
                     ) : (
                        <button className="bg-gray-100 p-1 rounded-full text-gray-600 hover:bg-orange-500 hover:text-white">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                           </svg>
                        </button>
                     )}
                  </div>
                );
              })}
              {filteredProductsToSelect.length === 0 && (
                <p className="text-center text-gray-400 py-4">Nenhum produto encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
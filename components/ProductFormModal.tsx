import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { Button } from './Button';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, productToEdit, onSave, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    description: ''
  });

  const [imagePreviewError, setImagePreviewError] = useState(false);

  useEffect(() => {
    setImagePreviewError(false); // Reset error on open/change
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          name: productToEdit.name,
          price: productToEdit.price.toString().replace('.', ','),
          category: productToEdit.category,
          image: productToEdit.image || '', // Ensure it's not undefined
          description: productToEdit.description || '' // Ensure it's not undefined
        });
      } else {
        // Default to first category if available
        setFormData({ name: '', price: '', category: categories.length > 0 ? categories[0].name : '', image: '', description: '' });
      }
    }
  }, [productToEdit, isOpen, categories]);

  // Reset error when image URL changes
  useEffect(() => {
    setImagePreviewError(false);
  }, [formData.image]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Robust price parsing: remove currency symbols, replace comma with dot
    let cleanPrice = formData.price.toString().replace('R$', '').replace(/\s/g, '');
    cleanPrice = cleanPrice.replace(',', '.');
    
    const price = parseFloat(cleanPrice);
    
    // Create explicit object to ensure all fields (especially image) are captured correctly
    // TRIM the image URL to remove accidental whitespace from copy-paste
    const productData = {
      name: formData.name,
      price: isNaN(price) ? 0 : price,
      category: formData.category || 'Geral', // Fallback
      image: formData.image.trim(), 
      description: formData.description,
      available: productToEdit ? productToEdit.available : true
    };

    if (productToEdit) {
      onSave({
        ...productToEdit, // Keep ID and original properties
        ...productData    // Overwrite with form data
      });
    } else {
      onSave(productData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {productToEdit ? 'Editar Produto' : 'Novo Produto'}
        </h2>

        {categories.length === 0 && (
            <div className="bg-yellow-50 text-yellow-800 p-3 mb-4 rounded text-sm border border-yellow-200">
                ⚠️ Nenhuma categoria criada. Crie categorias no painel antes de adicionar produtos.
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="Ex: Garrafa Térmica"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input 
                required
                type="text" 
                inputMode="decimal"
                value={formData.price}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, '');
                  setFormData({...formData, price: val});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select 
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
              >
                {categories.length > 0 ? (
                    categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))
                ) : (
                    <option value="Geral">Geral</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
            <input 
              type="text" 
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Copie o endereço da imagem (botão direito na imagem {'>'} "Copiar endereço da imagem").
            </p>
            
            {/* Image Preview Area */}
            {formData.image && (
              <div className="mt-3 w-full h-40 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                {!imagePreviewError ? (
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                    onError={() => setImagePreviewError(true)}
                  />
                ) : (
                  <div className="text-center text-red-500 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-bold">Erro ao carregar imagem.</span>
                    <p className="text-[10px] mt-1">Verifique se o link está correto e é público.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Legenda</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
              placeholder="Descreva os detalhes do produto..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={categories.length === 0} className="!bg-orange-600 hover:!bg-orange-700">
              {productToEdit ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
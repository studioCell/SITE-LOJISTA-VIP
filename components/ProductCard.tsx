import React, { useState } from 'react';
import { Product, User } from '../types';
import { Button } from './Button';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
  currentUser?: User | null;
  onEdit?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick, currentUser, onEdit }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer relative"
      onClick={() => onClick(product)}
    >
      <div className="relative pt-[100%] overflow-hidden bg-gray-50">
        {product.image && !imgError ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
        )}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-gray-100">
            {product.category}
          </span>
        </div>

        {/* Admin Quick Edit Button - Prominent for price changes */}
        {currentUser?.isAdmin && onEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            className="absolute top-3 right-3 z-20 bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-1 text-xs font-bold border border-blue-500"
            title="Alterar Preço e Detalhes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </button>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        {/* Changed font-medium to font-extrabold as requested */}
        <h3 className="text-sm md:text-base font-extrabold text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-orange-600 transition-colors leading-snug">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">A partir de</span>
            <span className="text-lg md:text-xl font-bold text-orange-600 leading-none">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </span>
            <span className="text-[10px] text-gray-400">à vista</span>
          </div>
          
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="!rounded-lg !px-3 !py-2 shadow-orange-500/20 !bg-green-600 hover:!bg-green-700 transition-transform"
            aria-label="Comprar"
          >
            <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] font-medium opacity-90">COMPRAR</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Product } from '../types';
import { Button } from './Button';

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, note: string) => void;
  relatedProducts: Product[];
  onRelatedClick: (product: Product) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ 
  product, 
  onClose, 
  onAddToCart, 
  relatedProducts,
  onRelatedClick
}) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, note);
    setQuantity(1);
    setNote('');
    onClose();
  };

  const handleContact = () => {
    const msg = `Tenho uma pergunta sobre esse produto e o ${product.name}`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?phone=5562992973853&text=${encoded}`, '_blank');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?productId=${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Confira este produto: ${product.name}`,
          url: url
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link do produto copiado para a área de transferência!');
      } catch (err) {
         prompt('Copie o link abaixo:', url);
      }
    }
  };

  const incrementQty = () => setQuantity(q => q + 1);
  const decrementQty = () => setQuantity(q => q > 1 ? q - 1 : 1);

  return (
    <div className="fixed inset-0 z-[60] bg-white overflow-y-auto animate-fade-in">
      {/* Zoom Modal */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center cursor-zoom-out p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <img 
            src={product.image} 
            alt={product.name} 
            className="max-w-full max-h-full object-contain"
          />
          <button className="absolute top-4 right-4 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
        {/* Header/Nav */}
        <div className="mb-6 flex justify-between items-center">
           <button 
             onClick={onClose}
             className="text-gray-500 hover:text-gray-900 flex items-center gap-2 font-medium"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             Voltar
           </button>

           <button 
             onClick={handleShare}
             className="text-orange-600 bg-orange-50 hover:bg-orange-100 py-2 px-4 rounded-full transition-colors flex items-center gap-2 shadow-sm"
             title="Compartilhar Link do Produto"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
             </svg>
             <span className="text-sm font-bold">Compartilhar</span>
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
          
          {/* Main Image Column */}
          <div className="lg:col-span-5">
            <div 
              className="relative aspect-square bg-white rounded-xl overflow-hidden border border-gray-100 group cursor-zoom-in"
              onClick={() => setIsZoomOpen(true)}
            >
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full shadow-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                 </svg>
              </div>
            </div>
          </div>

          {/* Product Details Column */}
          <div className="lg:col-span-4 flex flex-col h-full">
             <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
               {product.name}
             </h1>
             <div className="text-gray-500 text-sm mb-6 uppercase tracking-wide">
               REF: {product.id.substring(0,8)} | {product.category}
             </div>

             <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
               <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1">
                 <button onClick={decrementQty} className="px-2 text-xl text-gray-600 font-bold hover:text-orange-600">-</button>
                 <span className="mx-4 font-medium text-lg">{quantity}</span>
                 <button onClick={incrementQty} className="px-2 text-xl text-gray-600 font-bold hover:text-orange-600">+</button>
                 <span className="text-xs text-gray-400 ml-2">un</span>
               </div>
               <div className="text-right">
                 <div className="text-3xl font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                 </div>
               </div>
             </div>

             <div className="mb-6">
               <textarea 
                 value={note}
                 onChange={(e) => setNote(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                 placeholder="Inclua algum detalhe para este produto (opcional)"
                 rows={3}
               />
             </div>

             <div className="space-y-3 mb-8">
               <Button 
                 onClick={handleAddToCart}
                 className="w-full !py-4 !text-lg !font-bold !bg-orange-500 hover:!bg-orange-600 shadow-orange-500/20"
               >
                 Adicionar ao Pedido
               </Button>
               <Button 
                 onClick={onClose}
                 variant="outline"
                 className="w-full !py-4 !text-lg font-medium"
               >
                 Voltar para a loja
               </Button>
             </div>

             <div className="mt-auto pt-6 text-center">
               <p className="text-sm text-gray-500 mb-2">Ficou com alguma dúvida?</p>
               <button 
                  className="text-orange-500 border border-orange-500 rounded-full px-6 py-2 text-sm font-medium hover:bg-orange-50 transition-colors"
                  onClick={handleContact}
               >
                 Pergunta ao vendedor
               </button>
             </div>
          </div>

          {/* Related Products Column */}
          <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-8 lg:pt-0 lg:pl-8">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
               Mais em: <br/>
               <span className="text-gray-900">{product.category}</span>
             </h3>
             
             <div className="space-y-4">
               {relatedProducts.length === 0 && <p className="text-sm text-gray-400">Sem produtos relacionados.</p>}
               {relatedProducts.map(rel => (
                 <div 
                   key={rel.id} 
                   className="group flex gap-3 cursor-pointer bg-white border border-gray-100 rounded-lg p-2 hover:shadow-md transition-shadow"
                   onClick={() => onRelatedClick(rel)}
                 >
                   <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {rel.image ? (
                        <img src={rel.image} alt={rel.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-orange-600 transition-colors">
                       {rel.name}
                     </p>
                     <p className="text-sm font-bold text-gray-900 mt-1">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rel.price)}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
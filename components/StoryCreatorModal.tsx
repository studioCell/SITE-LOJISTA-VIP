import React, { useState } from 'react';
import { Button } from './Button';
import { Product } from '../types';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { imageUrl: string; type: 'image' | 'video'; caption: string; productId?: string }) => void;
  products: Product[];
}

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({ isOpen, onClose, onSave, products }) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      imageUrl: mediaUrl, 
      type: mediaType,
      caption,
      productId: selectedProductId || undefined
    });
    setMediaUrl('');
    setCaption('');
    setSelectedProductId('');
    setError('');
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    
    if (file) {
      // 1. Check File Size (Increased to 10MB)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > MAX_SIZE) {
        setError('O arquivo excede o limite de 10MB. Por favor, escolha um arquivo menor.');
        return;
      }

      const reader = new FileReader();
      
      if (file.type.startsWith('video/')) {
        // Video Validation
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src);
          // 2. Check Duration (15s limit)
          if (video.duration > 15.5) { // Slight buffer for float precision
             setError('O vídeo deve ter no máximo 15 segundos.');
             return;
          }
          
          // If valid, read as DataURL
          reader.onloadend = () => {
            setMediaUrl(reader.result as string);
            setMediaType('video');
          };
          reader.readAsDataURL(file);
        }
        
        video.src = URL.createObjectURL(file);
      } else {
        // Image Processing
        reader.onloadend = () => {
          setMediaUrl(reader.result as string);
          setMediaType('image');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Novo Story</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carregar Mídia (Foto ou Vídeo 15s)</label>
            <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-orange-50 border border-orange-200 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors flex items-center gap-2 w-full justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Selecionar da Galeria
                    <input 
                        type="file" 
                        accept="image/*,video/mp4,video/webm"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>
            
            {error && <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

            {mediaUrl && (
                <div className="mt-2 relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-black flex justify-center items-center">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} className="w-full h-full object-contain" controls />
                    ) : (
                      <img src={mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                    )}
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Legenda / Texto</label>
            <textarea 
              required
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Novidade incrível..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vincular Produto (Opcional)</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Nenhum produto selecionado</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!mediaUrl} className="!bg-orange-600 hover:!bg-orange-700">Publicar (7 dias)</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
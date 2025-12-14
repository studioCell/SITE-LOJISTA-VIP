import React, { useEffect, useState, useRef } from 'react';
import { Story, User } from '../types';
import { getUsers } from '../services/storage';

interface StoryViewerProps {
  stories: Story[];
  initialStoryId: string | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onGoToProduct: (productId: string) => void;
  isAdmin: boolean;
  onStoryView?: (story: Story) => void;
  users?: User[]; 
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ 
    stories, 
    initialStoryId, 
    onClose, 
    onDelete, 
    onGoToProduct, 
    isAdmin,
    onStoryView
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Custom Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Navigation Debounce
  const isNavigatingRef = useRef(false);

  // Load viewers for admin
  useEffect(() => {
      if (isAdmin && allUsers.length === 0) {
          const fetchUsers = async () => {
              const u = await getUsers();
              setAllUsers(u);
          };
          fetchUsers();
      }
  }, [isAdmin]);

  useEffect(() => {
    if (initialStoryId) {
      const idx = stories.findIndex(s => s.id === initialStoryId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [initialStoryId, stories]);

  useEffect(() => {
    if (initialStoryId) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [initialStoryId]);

  const currentStory = stories[currentIndex];

  useEffect(() => {
      if (currentStory && onStoryView) onStoryView(currentStory);
      setVideoError(false); 
      setShowDeleteConfirm(false); // Reset delete modal on slide change
  }, [currentIndex, currentStory]);

  const handleNext = () => {
    if (showDeleteConfirm) return; // Block nav if deleting
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    setTimeout(() => { isNavigatingRef.current = false; }, 300);

    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (showDeleteConfirm) return; // Block nav if deleting
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => { isNavigatingRef.current = false; }, 300);

    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (videoRef.current) {
          const newState = !videoRef.current.muted;
          videoRef.current.muted = newState;
          setIsMuted(newState);
      }
  };

  // --- DELETE LOGIC ---
  const handleDeletePress = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      // Pause video if playing
      if (videoRef.current) videoRef.current.pause();
      setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete && currentStory) {
          onDelete(currentStory.id);
      }
      setShowDeleteConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(false);
      // Resume video
      if (videoRef.current && !videoError) videoRef.current.play().catch(() => {});
  };

  useEffect(() => {
    if (!currentStory || showDeleteConfirm) return; // Stop timer if delete modal is open
    let timer: ReturnType<typeof setTimeout>;

    if (currentStory.type === 'image') {
      timer = setTimeout(() => { handleNext(); }, 5000);
    } else if (currentStory.type === 'video') {
        const video = videoRef.current;
        if (video) {
            video.currentTime = 0;
            video.muted = false; 
            setIsMuted(false);
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    if (video) {
                        video.muted = true;
                        setIsMuted(true);
                        video.play().catch(() => setVideoError(true));
                    }
                });
            }
        }
    }
    return () => clearTimeout(timer);
  }, [currentIndex, currentStory, showDeleteConfirm]);

  if (!currentStory) return null;

  const uniqueViews = currentStory.views ? [...new Set(currentStory.views)] : [];
  
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      
      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {showDeleteConfirm && (
          <div className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl transform scale-100">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Apagar Story?</h3>
                  <p className="text-gray-500 mb-6 text-sm">Essa ação removerá o story permanentemente para todos os usuários.</p>
                  <div className="flex gap-3">
                      <button 
                        onClick={cancelDelete}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-colors"
                      >
                          Apagar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- UI LAYER (Controls) --- */}
      
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 w-full p-2 z-[120] flex gap-1 pointer-events-none">
        {stories.map((story, idx) => (
            <div key={story.id} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-white transition-all duration-300 ${idx < currentIndex ? 'w-full' : idx > currentIndex ? 'w-0' : 'animate-story-progress origin-left'}`}
                    style={{
                        animationDuration: story.type === 'video' ? '10s' : '5s', 
                        animationPlayState: idx === currentIndex && !showDeleteConfirm ? 'running' : 'paused',
                        width: idx < currentIndex ? '100%' : 'auto'
                    }}
                ></div>
            </div>
        ))}
      </div>

      {/* Close Button (Top Right) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="absolute top-6 right-4 z-[130] text-white p-3 bg-black/30 rounded-full hover:bg-white/20 backdrop-blur-md active:scale-95 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Mute Button (Top Left - Video Only) */}
      {currentStory.type === 'video' && !videoError && (
          <button 
            onClick={toggleMute} 
            className="absolute top-6 left-4 z-[130] text-white p-3 bg-black/30 rounded-full hover:bg-white/20 backdrop-blur-md active:scale-95 transition-transform"
          >
            {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            )}
          </button>
      )}

      {/* REBUILT DELETE BUTTON (Super High Z-Index) */}
      {isAdmin && onDelete && (
        <button 
            onClick={handleDeletePress}
            // Added onTouchEnd to ensure mobile responsiveness even if click is finicky
            onTouchEnd={(e) => { e.preventDefault(); handleDeletePress(e); }} 
            className="absolute bottom-10 right-6 z-[250] bg-red-600 text-white w-14 h-14 rounded-full shadow-2xl hover:bg-red-700 active:bg-red-800 transition-all active:scale-90 flex items-center justify-center border-2 border-white/40"
            title="Apagar Story"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
      )}

      {/* Views Counter (Admin Only - Bottom Left) */}
      {isAdmin && (
          <div className="absolute bottom-10 left-6 z-[120] bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-sm font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{uniqueViews.length}</span>
          </div>
      )}

      {/* Product Link Button */}
      {currentStory.productId && (
        <div className="absolute bottom-28 left-0 w-full px-6 z-[120] flex justify-center pointer-events-none">
            <button 
                onClick={(e) => { e.stopPropagation(); onGoToProduct(currentStory.productId!); }}
                className="bg-white text-black font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2 animate-bounce-slow pointer-events-auto"
            >
                <span>Ver Produto</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
      )}

      {/* Caption Overlay */}
      {currentStory.caption && (
            <div className="absolute bottom-40 left-0 w-full p-6 pointer-events-none flex justify-center z-[110]">
            <p className="text-white text-center font-medium text-lg drop-shadow-md bg-black/40 px-6 py-3 rounded-2xl backdrop-blur-sm inline-block">
                {currentStory.caption}
            </p>
            </div>
      )}

      {/* --- CONTENT LAYER (Navigation Area) --- */}
      <div 
        className="relative w-full h-full max-w-md flex flex-col z-[100]"
        onClick={(e) => {
            // Only navigate if clicking the main container, not specific buttons
            const width = e.currentTarget.offsetWidth;
            const x = e.nativeEvent.offsetX;
            if (x < width / 3) handlePrev();
            else handleNext();
        }}
      >
        <div className="flex-grow relative flex items-center justify-center bg-black w-full h-full">
          {currentStory.type === 'video' ? (
             !videoError ? (
                 <video 
                    key={currentStory.id} 
                    ref={videoRef}
                    src={currentStory.imageUrl} 
                    className="w-full h-full object-contain"
                    playsInline
                    autoPlay
                    muted={isMuted}
                    onEnded={handleNext}
                    onError={() => setVideoError(true)}
                 />
             ) : (
                 <div className="text-white p-4 text-center">Erro ao carregar vídeo</div>
             )
          ) : currentStory.imageUrl ? (
            <img src={currentStory.imageUrl} alt={currentStory.caption} className="w-full h-full object-contain" />
          ) : (
            <div className="text-white text-center p-8 text-2xl font-bold bg-gradient-to-br from-orange-600 to-red-600 w-full h-full flex items-center justify-center">{currentStory.caption}</div>
          )}
        </div>
      </div>
      
      <style>{`
        .animate-story-progress { animation: progress linear forwards; }
        @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .animate-bounce-slow { animation: bounce 2s infinite; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};
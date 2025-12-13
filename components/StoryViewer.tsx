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
  users?: User[]; // For admin to see viewer names
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
  
  // Video State
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Admin Viewer List State
  const [showViewers, setShowViewers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Swipe logic refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Load users for admin view mapping
  useEffect(() => {
      if (isAdmin && showViewers && allUsers.length === 0) {
          const fetchUsers = async () => {
              const u = await getUsers();
              setAllUsers(u);
          };
          fetchUsers();
      }
  }, [isAdmin, showViewers]);

  // Initialize index based on ID
  useEffect(() => {
    if (initialStoryId) {
      const idx = stories.findIndex(s => s.id === initialStoryId);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [initialStoryId, stories]);

  // Lock body scroll
  useEffect(() => {
    if (initialStoryId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [initialStoryId]);

  const currentStory = stories[currentIndex];

  // Track View
  useEffect(() => {
      if (currentStory && onStoryView) {
          onStoryView(currentStory);
      }
      setVideoError(false); // Reset error state on story change
  }, [currentIndex, currentStory]); // Runs when index changes (new story shown)

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
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

  // Timer & Video Play Logic
  useEffect(() => {
    if (!currentStory) return;

    let timer: ReturnType<typeof setTimeout>;

    if (currentStory.type === 'image') {
      // Default 5 seconds for images
      timer = setTimeout(() => {
        handleNext();
      }, 5000);
    } else if (currentStory.type === 'video') {
        const video = videoRef.current;
        if (video) {
            video.currentTime = 0;
            video.muted = false; // Try sound first
            setIsMuted(false);
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Safe log without object to avoid circular JSON error
                    console.log("Autoplay with sound blocked. Fallback to muted.");
                    
                    if (video) {
                        video.muted = true;
                        setIsMuted(true);
                        video.play().catch(() => {
                            console.error("Video playback failed completely (muted fallback)");
                            setVideoError(true);
                        });
                    }
                });
            }
        }
    }

    return () => clearTimeout(timer);
  }, [currentIndex, currentStory]);


  // Touch / Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // px to consider a swipe

    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            // Swiped Left -> Next
            handleNext();
        } else {
            // Swiped Right -> Prev
            handlePrev();
        }
    } else {
        // It was a tap. Determine side.
        const width = window.innerWidth;
        if (touchStartX.current < width / 3) {
            handlePrev();
        } else {
            handleNext();
        }
    }
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!currentStory) return null;

  // Viewer Logic
  const uniqueViews = currentStory.views ? [...new Set(currentStory.views)] : [];
  const viewerNames = uniqueViews.map(id => {
      const u = allUsers.find(user => user.id === id);
      return u ? u.name : 'Visitante';
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      
      {/* Top Progress Bars */}
      <div className="absolute top-0 left-0 w-full p-2 z-30 flex gap-1">
        {stories.map((story, idx) => (
            <div key={story.id} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-white transition-all duration-300 ${
                        idx < currentIndex ? 'w-full' : 
                        idx > currentIndex ? 'w-0' : 'animate-story-progress origin-left'
                    }`}
                    style={{
                        animationDuration: story.type === 'video' ? '15s' : '5s', 
                        animationPlayState: idx === currentIndex ? 'running' : 'paused',
                        width: idx < currentIndex ? '100%' : 'auto'
                    }}
                ></div>
            </div>
        ))}
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-4 z-40 text-white p-2 bg-black/20 rounded-full hover:bg-white/20 backdrop-blur-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Volume Control (Only for Video) */}
      {currentStory.type === 'video' && !videoError && (
          <button 
            onClick={toggleMute}
            className="absolute top-6 left-4 z-40 text-white p-2 bg-black/20 rounded-full hover:bg-white/20 backdrop-blur-sm"
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

      {/* Delete Button (Admin only) */}
      {isAdmin && onDelete && (
        <div className={`absolute left-4 z-40 flex flex-col gap-2 ${currentStory.type === 'video' ? 'top-20' : 'top-6'}`}>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(currentStory.id);
                    if (stories.length <= 1) onClose();
                }}
                className="text-red-500 p-2 bg-black/20 rounded-full hover:bg-white/20 backdrop-blur-sm"
                title="Apagar Story"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
      )}

      {/* Admin View Counter (Bottom Left) */}
      {isAdmin && (
          <div className="absolute bottom-6 left-4 z-50 pointer-events-auto">
              <button 
                  onClick={(e) => { e.stopPropagation(); setShowViewers(!showViewers); }}
                  className="flex items-center gap-2 text-white bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/60 transition-all"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-bold">{uniqueViews.length}</span>
              </button>

              {/* Viewers List Popover */}
              {showViewers && (
                  <div 
                    className="absolute bottom-12 left-0 w-48 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-2 max-h-48 overflow-y-auto animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Visualizações</h4>
                      {viewerNames.length > 0 ? (
                          <ul className="space-y-1">
                              {viewerNames.map((name, i) => (
                                  <li key={i} className="text-xs text-gray-800 font-medium truncate">{name}</li>
                              ))}
                          </ul>
                      ) : (
                          <p className="text-xs text-gray-400">Ninguém viu ainda.</p>
                      )}
                  </div>
              )}
          </div>
      )}

      {/* Content Area with Touch Listeners */}
      <div 
        className="relative w-full h-full max-w-md bg-gray-900 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
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
                    key={currentStory.id} // Forces remount on story change
                    ref={videoRef}
                    src={currentStory.imageUrl} 
                    className="w-full h-full object-contain"
                    playsInline
                    autoPlay
                    muted={isMuted} // Controlled by state
                    onEnded={handleNext}
                    onError={(e) => {
                        // Prevent logging the full event object to avoid "Converting circular structure to JSON" error
                        const mediaError = e.currentTarget.error;
                        console.error("Video error:", mediaError ? `Code ${mediaError.code}: ${mediaError.message}` : "Unknown error");
                        setVideoError(true);
                    }}
                 />
             ) : (
                 <div className="flex flex-col items-center justify-center text-white p-4 text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                     <p className="font-bold">Erro ao carregar vídeo</p>
                     <p className="text-xs text-gray-400 mt-1">Formato inválido ou link expirado.</p>
                 </div>
             )
          ) : currentStory.imageUrl ? (
            <img 
              src={currentStory.imageUrl} 
              alt={currentStory.caption} 
              className="w-full h-full object-contain" 
            />
          ) : (
            <div className="text-white text-center p-8 text-2xl font-bold bg-gradient-to-br from-orange-600 to-red-600 w-full h-full flex items-center justify-center">
              {currentStory.caption}
            </div>
          )}
          
          {/* Caption Overlay */}
          {currentStory.caption && (
             <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent pt-20 pb-24 pointer-events-none">
               <p className="text-white text-center font-medium text-lg drop-shadow-md">{currentStory.caption}</p>
             </div>
          )}

          {/* Product Link Button */}
          {currentStory.productId && (
            <div className="absolute bottom-8 left-0 w-full px-6 z-30 flex justify-center pointer-events-auto">
               <button 
                 onClick={(e) => {
                     e.stopPropagation();
                     onGoToProduct(currentStory.productId!);
                 }}
                 className="bg-white text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-gray-200 transition-colors flex items-center gap-2 animate-bounce-slow"
               >
                 <span>Ver Produto</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                 </svg>
               </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .animate-story-progress {
          animation: progress linear forwards;
        }
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};
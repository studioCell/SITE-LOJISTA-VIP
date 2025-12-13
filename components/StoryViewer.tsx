import React, { useEffect, useState, useRef } from 'react';
import { Story } from '../types';

interface StoryViewerProps {
  stories: Story[];
  initialStoryId: string | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onGoToProduct: (productId: string) => void;
  isAdmin: boolean;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialStoryId, onClose, onDelete, onGoToProduct, isAdmin }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Swipe logic refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  // Timer logic
  useEffect(() => {
    if (!currentStory) return;

    let timer: ReturnType<typeof setTimeout>;

    if (currentStory.type === 'image') {
      // Default 5 seconds for images
      timer = setTimeout(() => {
        handleNext();
      }, 5000);
    } else if (currentStory.type === 'video' && videoRef.current) {
        // Video handles its own "ended" event, but we need a fallback or initial play
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
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

      {/* Delete Button (Admin only) */}
      {isAdmin && onDelete && (
        <button 
          onClick={(e) => {
             e.stopPropagation();
             onDelete(currentStory.id);
             if (stories.length <= 1) onClose();
          }}
          className="absolute top-6 left-4 z-40 text-red-500 p-2 bg-black/20 rounded-full hover:bg-white/20 backdrop-blur-sm"
          title="Apagar Story"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
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
             <video 
                ref={videoRef}
                src={currentStory.imageUrl} 
                className="w-full h-full object-contain"
                playsInline
                autoPlay
                muted={false} 
                onEnded={handleNext}
             />
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
      `}</style>
    </div>
  );
};
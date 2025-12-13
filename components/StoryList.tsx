import React from 'react';
import { Story } from '../types';

interface StoryListProps {
  stories: Story[];
  isAdmin: boolean;
  onAddClick: () => void;
  onStoryClick: (story: Story) => void;
}

const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Há pouco';
    return `Há ${hours}h`;
};

export const StoryList: React.FC<StoryListProps> = ({ stories, isAdmin, onAddClick, onStoryClick }) => {
  return (
    <div className="w-full overflow-x-auto pb-6 mb-2 scrollbar-hide">
      <div className="flex items-center space-x-4 px-1">
        
        {/* Admin Add Story Button */}
        {isAdmin && (
          <div className="flex flex-col items-center space-y-1 cursor-pointer group" onClick={onAddClick}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 group-hover:bg-orange-50 group-hover:border-orange-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">Novo Story</span>
          </div>
        )}

        {/* Story Items */}
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center space-y-1 cursor-pointer group"
            onClick={() => onStoryClick(story)}
          >
            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-orange-600 animate-pulse-slow">
              <div className="w-[3.5rem] h-[3.5rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-full border-2 border-white bg-white overflow-hidden relative">
                {story.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                     <video src={story.imageUrl} className="w-full h-full object-cover opacity-80" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow-md" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                       </svg>
                     </div>
                  </div>
                ) : story.imageUrl ? (
                  <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-[10px] text-center p-1">
                    {story.caption.substring(0, 15)}...
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-700 w-16 truncate text-center">
                  {story.caption || 'Novidade'}
                </span>
                <span className="text-[10px] text-gray-400">
                    {getTimeAgo(story.createdAt)}
                </span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .animate-pulse-slow {
          animation: pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: .85; filter: brightness(1.1); }
        }
      `}</style>
    </div>
  );
};
import React from 'react';
import { CATEGORIES } from '../types';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelectCategory }) => {
  const allCategories = ['Todos', ...CATEGORIES];

  return (
    <div className="w-full overflow-x-auto pb-4 mb-4 scrollbar-hide">
      <div className="flex space-x-2 px-1">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat === 'Todos' ? null : cat)}
            className={`
              whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${(selectedCategory === cat) || (cat === 'Todos' && selectedCategory === null)
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-orange-300'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
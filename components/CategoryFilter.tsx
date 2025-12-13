import React from 'react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  // Inject "Novidades da Semana" at the start
  const allCategories = ['Todos', 'Novidades da Semana', ...categories.map(c => c.name)];

  return (
    <div className="w-full overflow-x-auto pb-4 mb-4 scrollbar-hide">
      <div className="flex space-x-2 px-1">
        {allCategories.map((cat) => {
          // Determine if this is the special "Novidades" category
          const isNovidades = cat === 'Novidades da Semana';
          const isSelected = selectedCategory === cat || (cat === 'Todos' && selectedCategory === null);

          // Dynamic class Logic
          let buttonClass = 'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border';
          
          if (isNovidades) {
             // Styling for Novidades da Semana
             if (isSelected) {
                 buttonClass += ' bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-500/30';
             } else {
                 buttonClass += ' bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:shadow-md';
             }
          } else {
             // Styling for standard categories
             if (isSelected) {
                 buttonClass += ' bg-zinc-800 text-white border-zinc-800 shadow-lg';
             } else {
                 buttonClass += ' bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300';
             }
          }

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat === 'Todos' ? null : cat)}
              className={buttonClass}
            >
              {isNovidades ? '✨ Novidades da Semana' : cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
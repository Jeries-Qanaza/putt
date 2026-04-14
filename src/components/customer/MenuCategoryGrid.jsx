import React from 'react';
import { motion } from 'framer-motion';

const CATEGORY_PHOTOS = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
  'hot drinks': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80',
  'cold drinks': 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80',
  drinks: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
  beer: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
  alcohol: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
  wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',
  cocktails: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  pasta: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  dessert: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  pastry: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  steak: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80',
  meat: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
};

function getCategoryPhoto(name) {
  const normalized = String(name || '').toLowerCase();

  for (const [key, url] of Object.entries(CATEGORY_PHOTOS)) {
    if (normalized.includes(key)) return url;
  }

  return CATEGORY_PHOTOS.default;
}

export { getCategoryPhoto };

export default function MenuCategoryGrid({ categories, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {categories.map((category, index) => (
        <motion.button
          key={category}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(category)}
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <img
            src={getCategoryPhoto(category)}
            alt={category}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <span className="text-center text-base font-bold leading-tight text-white drop-shadow-lg transition-transform duration-200 group-hover:scale-110">
              {category}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

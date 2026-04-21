import React from 'react';
import { motion } from 'framer-motion';

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
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_45%),linear-gradient(135deg,rgba(217,119,6,0.22),rgba(14,165,233,0.18)_48%,rgba(15,23,42,0.22))]" />
          <div className="absolute inset-0 backdrop-blur-xl" />
          <div className="absolute inset-x-6 top-5 h-10 rounded-full bg-white/25 blur-2xl" />
          <div className="absolute inset-x-8 bottom-6 h-14 rounded-full bg-black/10 blur-2xl" />
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <span className="text-center text-base font-bold leading-tight text-foreground drop-shadow-sm transition-transform duration-200 group-hover:scale-110">
              {category}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

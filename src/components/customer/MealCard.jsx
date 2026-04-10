import React from 'react';
import { useI18n } from '@/lib/i18n';
import DietaryBadges from '@/components/shared/DietaryBadges';
import { motion } from 'framer-motion';

export default function MealCard({ meal, index = 0, onClick }) {
  const { t, getLocalizedField } = useI18n();
  const name = getLocalizedField(meal, 'name');
  const desc = getLocalizedField(meal, 'description');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`flex gap-4 items-start bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-border/50 ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      {/* Image - always shown, placeholder if missing */}
      <div className="w-28 h-28 shrink-0 bg-muted overflow-hidden rounded-none">
        {meal.image_url ? (
          <img
            src={meal.image_url}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-3xl">
            🍽️
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 py-3 pr-3 space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-base leading-tight">{name}</h3>
          <span className="font-bold text-primary whitespace-nowrap text-sm shrink-0 ps-3">
            {t('currency')}{meal.price}
          </span>
        </div>
        {desc && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">{desc}</p>
        )}
        <DietaryBadges tags={meal.dietary_tags} size="sm" />
      </div>
    </motion.div>
  );
}
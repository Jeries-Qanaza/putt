import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import DietaryBadges from '@/components/shared/DietaryBadges';

export default function MealCard({ meal, index = 0, onClick, fallbackImage }) {
  const { t, getLocalizedField } = useI18n();
  const name = getLocalizedField(meal, 'name');
  const desc = getLocalizedField(meal, 'description');
  const imageUrl = meal.image_url || fallbackImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => event.key === 'Enter' && onClick() : undefined}
      className={`flex items-start gap-4 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-none bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-3xl">
            *
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1 py-3 pr-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-foreground">{name}</h3>
          <span className="shrink-0 whitespace-nowrap ps-3 text-sm font-bold text-primary">
            {t('currency')}
            {meal.price}
          </span>
        </div>
        {desc ? <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{desc}</p> : null}
        <DietaryBadges tags={meal.dietary_tags} size="sm" />
      </div>
    </motion.div>
  );
}

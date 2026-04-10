import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { dietaryIcons } from '@/lib/dietaryIcons';

export default function DietaryBadges({ tags = [], size = 'sm' }) {
  const { t } = useI18n();
  
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className={`${size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'} font-normal`}>
          {dietaryIcons[tag]} {t(tag)}
        </Badge>
      ))}
    </div>
  );
}
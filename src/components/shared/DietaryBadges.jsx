import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { localApi } from '@/lib/localApi';
import { dietaryIcons } from '@/lib/dietaryIcons';

const normalizeTag = (tag) => String(tag || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

export default function DietaryBadges({ tags = [], size = 'sm' }) {
  const { t, isRTL } = useI18n();

  const { data: dietaryTags = [] } = useQuery({
    queryKey: ['dietary-tags'],
    queryFn: () => localApi.entities.DietaryTag.list('name'),
  });

  if (!tags || tags.length === 0) return null;

  const dietaryTagMap = dietaryTags.reduce((acc, item) => {
    acc[normalizeTag(item.name)] = item.icon;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((rawTag) => {
        const tag = normalizeTag(rawTag);
        const icon = dietaryTagMap[tag] || dietaryIcons[tag] || '*';

        return (
          <Badge
            key={`${rawTag}-${tag}`}
            variant="secondary"
            className={`${size === 'sm' ? 'px-1.5 py-0 text-xs' : 'px-2 py-0.5 text-sm'} inline-flex items-center gap-1 font-normal`}
          >
            {isRTL ? <span aria-hidden="true">{icon}</span> : null}
            <span>{t(tag)}</span>
            {!isRTL ? <span aria-hidden="true">{icon}</span> : null}
          </Badge>
        );
      })}
    </div>
  );
}

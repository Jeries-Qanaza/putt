import React from 'react';
import { Link } from 'react-router-dom';
import { toSlug } from '@/lib/slugify';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

export default function RestaurantCard({ restaurant, distance }) {
  const { t, getLocalizedField } = useI18n();
  const name = getLocalizedField(restaurant, 'name');
  const desc = getLocalizedField(restaurant, 'description');
  const slug = toSlug(restaurant.name || restaurant.name_en || restaurant.id);
  const imageUrl = restaurant.cover_image || restaurant.logo_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/${slug}`} aria-label={`View ${name} restaurant`}>
        <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-sm bg-card">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full bg-white object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-4xl opacity-50">🍽️</span>
              </div>
            )}
            {distance != null && (
              <Badge className="absolute top-3 left-3 bg-card/90 text-foreground backdrop-blur-sm border-0 shadow-sm">
                <MapPin className="h-3 w-3 mr-1" />
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-lg text-foreground leading-tight">{name}</h3>
            {desc && (
              <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {restaurant.categories?.slice(0, 3).map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs font-normal">
                  {cat}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              {restaurant.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[140px]">{restaurant.address}</span>
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

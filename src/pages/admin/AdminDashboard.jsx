import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminDashboard() {
  const { t } = useI18n();

  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => localApi.entities.Restaurant.list(),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t('adminDashboard')}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{restaurants.length}</p>
                <p className="text-sm text-muted-foreground">{t('totalRestaurants')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('restaurants')}</h2>
          <Link to="/admin/restaurants" className="text-sm text-primary hover:underline">
            {t('edit')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.slice(0, 6).map((restaurant) => (
            <Card key={restaurant.id} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {restaurant.logo_url || restaurant.cover_image ? (
                    <img
                      src={restaurant.logo_url || restaurant.cover_image}
                      alt={restaurant.name}
                      className="h-full w-full bg-white object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">*</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{restaurant.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{restaurant.address}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { UtensilsCrossed, ShoppingBag, CalendarDays, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { t } = useI18n();

  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => localApi.entities.Restaurant.list(),
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['admin-meals'],
    queryFn: () => localApi.entities.Meal.list(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => localApi.entities.Event.list(),
  });

  const stats = [
    { label: t('totalRestaurants'), value: restaurants.length, icon: UtensilsCrossed, color: 'bg-primary/10 text-primary' },
    { label: t('totalMeals'), value: meals.length, icon: ShoppingBag, color: 'bg-accent/10 text-accent' },
    { label: t('totalEvents'), value: events.length, icon: CalendarDays, color: 'bg-chart-3/10 text-chart-3' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t('adminDashboard')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Restaurants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('restaurants')}</h2>
          <Link to="/admin/restaurants" className="text-sm text-primary hover:underline">
            {t('edit')} →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.slice(0, 6).map((r) => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {r.cover_image ? (
                    <img src={r.cover_image} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

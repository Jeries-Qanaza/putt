import React, { useState, useEffect, useMemo } from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal } from 'lucide-react';
import RestaurantCard from '@/components/shared/RestaurantCard';
import { motion } from 'framer-motion';
import { PUTT_LOGO_URL } from '@/lib/branding';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Home() {
  const { t, getLocalizedField } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const results = await localApi.entities.Restaurant.list('name');
      return results.filter((restaurant) => restaurant.is_active !== false);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => localApi.entities.Category.list('sort_order'),
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const restaurantsWithDistance = useMemo(() => {
    return restaurants.map((r) => ({
      ...r,
      distance:
        userLocation && r.latitude && r.longitude
          ? getDistance(userLocation.lat, userLocation.lng, r.latitude, r.longitude)
          : null,
    }));
  }, [restaurants, userLocation]);

  const filtered = useMemo(() => {
    let result = restaurantsWithDistance;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.name_he?.toLowerCase().includes(q) ||
          r.name_ar?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q) ||
          r.categories?.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((r) => r.categories?.includes(selectedCategory));
    }

    result.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return result;
  }, [restaurantsWithDistance, search, selectedCategory]);

  return (
    <div className="py-6 space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 py-4"
      >
        <div className="flex items-center justify-center gap-3">
          <img src={PUTT_LOGO_URL} alt="Putt" className="h-12 w-12 rounded-2xl border border-border/50 object-cover bg-white shadow-sm" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Putt</h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
          {t('searchRestaurants')}
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchRestaurants')}
          className="ps-10 h-11 rounded-xl bg-card border-border/50"
        />
      </div>

      {/* Categories slider */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30'
                : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                selectedCategory === cat.name
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30'
                  : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <span>{cat.icon}</span>
              {getLocalizedField(cat, 'name')}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loadingRestaurants ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[16/14] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <span className="text-4xl block mb-3">🔍</span>
          <p>{t('noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} distance={restaurant.distance} />
          ))}
        </div>
      )}
    </div>
  );
}

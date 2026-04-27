import React, { useState, useEffect, useMemo } from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import RestaurantCard from '@/components/shared/RestaurantCard';
import Seo from '@/components/shared/Seo';
import { motion } from 'framer-motion';
import { PUTT_LOGO_URL } from '@/lib/branding';
import { toSlug } from '@/lib/slugify';
import { toAbsoluteUrl } from '@/lib/seo';

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
  const { t, getLocalizedField, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const loadErrorTitle = lang === 'he' ? 'משהו השתבש' : lang === 'ar' ? 'حدث خطأ ما' : 'Something went wrong';
  const loadErrorBody =
    lang === 'he'
      ? 'לא הצלחנו לטעון את המסעדות כרגע. נסו שוב בעוד רגע.'
      : lang === 'ar'
        ? 'تعذر تحميل المطاعم الآن. حاول مرة أخرى بعد قليل.'
        : 'We could not load the restaurants right now. Please try again shortly.';

  const {
    data: restaurants = [],
    isLoading: loadingRestaurants,
    error: restaurantsError,
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const results = await localApi.entities.Restaurant.list('name');
      return results.filter((restaurant) => restaurant.is_active !== false);
    },
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

    result.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    return result;
  }, [restaurantsWithDistance, search]);

  const homeDescription = 'Discover nearby restaurants, explore menus, and check useful dining details across Putt.';
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Putt',
    url: toAbsoluteUrl('/'),
    description: homeDescription,
    inLanguage: lang,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filtered.slice(0, 24).map((restaurant, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: toAbsoluteUrl(`/${toSlug(restaurant.name || restaurant.name_en || restaurant.id)}`),
        name: getLocalizedField(restaurant, 'name'),
      })),
    },
  };

  return (
    <div className="py-6 space-y-6">
      <Seo
        title={null}
        description={homeDescription}
        canonical={toAbsoluteUrl('/')}
        image={PUTT_LOGO_URL}
        lang={lang}
        jsonLd={homeJsonLd}
      />
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

      {/* Results */}
      {loadingRestaurants ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[16/14] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : restaurantsError ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <p className="text-base font-semibold text-foreground">{loadErrorTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">{loadErrorBody}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <span className="text-4xl block mb-3">🔍</span>
          <p>{t('noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} distance={restaurant.distance} />
          ))}
        </div>
      )}
    </div>
  );
}

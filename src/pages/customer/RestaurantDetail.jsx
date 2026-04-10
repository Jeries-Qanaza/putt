import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Clock, Info, MapPin, Phone, XCircle } from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import ScheduleDisplay from '@/components/shared/ScheduleDisplay';
import MealCard from '@/components/customer/MealCard';
import MealDetailSheet from '@/components/customer/MealDetailSheet';
import { toSlug } from '@/lib/slugify';

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function timeToMinutes(timeValue) {
  if (!timeValue || !timeValue.includes(':')) return null;
  const [hours, minutes] = timeValue.split(':').map(Number);
  return hours * 60 + minutes;
}

function getRestaurantOpenState(schedule) {
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todaySchedule = schedule?.[todayKey];

  if (!todaySchedule) {
    return { todayKey, todaySchedule: null, isOpenNow: false, isClosed: true };
  }

  if (todaySchedule.closed) {
    return { todayKey, todaySchedule, isOpenNow: false, isClosed: true };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(todaySchedule.open);
  const closeMinutes = timeToMinutes(todaySchedule.close);

  const isOpenNow =
    openMinutes != null &&
    closeMinutes != null &&
    currentMinutes >= openMinutes &&
    currentMinutes < closeMinutes;

  return {
    todayKey,
    todaySchedule,
    isOpenNow,
    isClosed: !isOpenNow,
  };
}

export default function RestaurantDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, getLocalizedField } = useI18n();
  const [showInfo, setShowInfo] = useState(false);
  const [sheetMeals, setSheetMeals] = useState(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const infoPanelRef = useRef(null);
  const mobileInfoToggleRef = useRef(null);
  const desktopInfoToggleRef = useRef(null);
  const sectionRefs = useRef({});

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: async () => {
      const all = await localApi.entities.Restaurant.list('name');
      const normalizedSlug = decodeURIComponent(slug);

      return all.find((item) => {
        const nameSlug = toSlug(item.name || item.name_en || item.id);
        return item.id === normalizedSlug || nameSlug === normalizedSlug;
      });
    },
  });

  useEffect(() => {
    if (!restaurant) return;
    const canonicalSlug = toSlug(restaurant.name || restaurant.name_en || restaurant.id);
    if (slug !== canonicalSlug) {
      navigate(`/${canonicalSlug}`, { replace: true });
    }
  }, [restaurant, slug, navigate]);

  useEffect(() => {
    if (!showInfo) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        infoPanelRef.current?.contains(target) ||
        mobileInfoToggleRef.current?.contains(target) ||
        desktopInfoToggleRef.current?.contains(target)
      ) {
        return;
      }
      setShowInfo(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [showInfo]);

  const restaurantId = restaurant?.id;

  const { data: meals = [] } = useQuery({
    queryKey: ['meals', restaurantId],
    queryFn: () => localApi.entities.Meal.filter({ restaurant_id: restaurantId, is_available: true }, 'sort_order'),
    enabled: !!restaurantId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['restaurant-categories', restaurantId],
    queryFn: () => localApi.entities.Category.filter({ restaurant_id: restaurantId }, 'sort_order'),
    enabled: !!restaurantId,
  });

  const name = getLocalizedField(restaurant, 'name');
  const desc = getLocalizedField(restaurant, 'description');
  const logoUrl = restaurant?.logo_url || restaurant?.cover_image;
  const hasInfo = desc || restaurant?.address || restaurant?.schedule || restaurant?.phone;

  const categoryMetaByName = useMemo(() => {
    return categories.reduce((acc, category) => {
      const key = category.name || category.name_en;
      if (key) {
        acc[key] = category;
      }
      return acc;
    }, {});
  }, [categories]);

  const groupedMeals = useMemo(() => {
    return meals.reduce((acc, meal) => {
      const key = meal.menu_category || t('menu');
      if (!acc[key]) acc[key] = [];
      acc[key].push(meal);
      return acc;
    }, {});
  }, [meals, t]);

  const categorySections = useMemo(() => {
    const keys = Object.keys(groupedMeals);
    return keys
      .sort((left, right) => {
        const leftOrder = categoryMetaByName[left]?.sort_order ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = categoryMetaByName[right]?.sort_order ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.localeCompare(right);
      })
      .map((key) => {
        const meta = categoryMetaByName[key];
        const label = meta ? getLocalizedField(meta, 'name') : key;
        return { key, label, meals: groupedMeals[key] || [] };
      });
  }, [groupedMeals, categoryMetaByName, getLocalizedField]);

  const openState = useMemo(
    () => getRestaurantOpenState(restaurant?.schedule),
    [restaurant?.schedule]
  );

  const scrollToCategory = (categoryKey) => {
    sectionRefs.current[categoryKey]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openSheet = (mealsList, index) => {
    setSheetMeals(mealsList);
    setSheetIndex(index);
  };

  if (loadingRestaurant) {
    return (
      <div className="py-8 space-y-4" role="status" aria-label="Loading restaurant">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20 text-muted-foreground" role="alert">
        <p>{t('noResults')}</p>
      </div>
    );
  }

  return (
    <div className="py-2 md:py-6 space-y-5">
      <a
        href="#menu-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
      >
        Skip to menu
      </a>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hidden md:flex items-center gap-6 p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="h-24 w-24 rounded-2xl overflow-hidden bg-muted shrink-0 flex items-center justify-center border border-border/50">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">🍽️</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground">{name}</h1>
          </div>
          {hasInfo && (
            <button
              ref={desktopInfoToggleRef}
              onClick={() => setShowInfo((value) => !value)}
              aria-expanded={showInfo}
              className="shrink-0 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
            >
              <Info className="h-4 w-4" />
              Info
            </button>
          )}
        </div>

        <div className="md:hidden relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm p-4 flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">🍽️</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{name}</h1>
          </div>
          {hasInfo && (
            <button
              ref={mobileInfoToggleRef}
              onClick={() => setShowInfo((value) => !value)}
              aria-expanded={showInfo}
              className="shrink-0 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
            >
              <Info className="h-4 w-4" />
              Info
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showInfo && hasInfo && (
          <motion.div
            ref={infoPanelRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            role="region"
            aria-label="Restaurant information"
          >
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
              {desc && <p className="text-muted-foreground text-sm">{desc}</p>}

              {openState.todaySchedule && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    openState.isClosed
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-green-500/10 text-green-700 dark:text-green-400'
                  }`}
                >
                  {openState.isClosed ? (
                    <>
                      <XCircle className="h-4 w-4 shrink-0" />
                      Closed now
                      {openState.todaySchedule.close ? ` · ${openState.todaySchedule.open} - ${openState.todaySchedule.close}` : ''}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      Open today: {openState.todaySchedule.open} - {openState.todaySchedule.close}
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 text-sm">
                {restaurant.address && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {restaurant.address}
                  </span>
                )}
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-1.5 text-primary hover:underline focus:outline-none focus:underline"
                    aria-label={`Call ${name} at ${restaurant.phone}`}
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {restaurant.phone}
                  </a>
                )}
                {restaurant.schedule && (
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <ScheduleDisplay schedule={restaurant.schedule} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="menu-content" role="main" aria-label={`${name} menu`} className="space-y-6">
        {categorySections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">{t('categories')}</h2>
              <span className="text-sm text-muted-foreground">{categorySections.length} sections</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categorySections.map((category) => (
                <button
                  key={category.key}
                  onClick={() => scrollToCategory(category.key)}
                  className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {meals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" role="status">
            <span className="text-3xl block mb-2" aria-hidden="true">🍽️</span>
            <p>{t('noMeals')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categorySections.map((category) => (
              <section
                key={category.key}
                ref={(element) => {
                  sectionRefs.current[category.key] = element;
                }}
                className="space-y-4 scroll-mt-24"
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{category.label}</h3>
                    <p className="text-sm text-muted-foreground">{category.meals.length} items</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {category.meals.map((meal, index) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      index={index}
                      onClick={() => openSheet(category.meals, index)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {sheetMeals && (
        <MealDetailSheet
          meals={sheetMeals}
          initialIndex={sheetIndex}
          onClose={() => setSheetMeals(null)}
        />
      )}
    </div>
  );
}

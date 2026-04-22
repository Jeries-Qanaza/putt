import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, Info, Loader2, MapPin, Phone, XCircle } from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';
import ScheduleDisplay from '@/components/shared/ScheduleDisplay';
import MealCard from '@/components/customer/MealCard';
import MealDetailSheet from '@/components/customer/MealDetailSheet';
import MenuCategoryGrid from '@/components/customer/MenuCategoryGrid';
import Seo from '@/components/shared/Seo';
import { toSlug } from '@/lib/slugify';
import PageNotFound from '@/lib/PageNotFound';
import { scheduleToOpeningHoursSpecification, toAbsoluteUrl } from '@/lib/seo';

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function timeToMinutes(timeValue) {
  if (!timeValue || !timeValue.includes(':')) return null;
  const [hours, minutes] = timeValue.split(':').map(Number);
  return hours * 60 + minutes;
}

function getRestaurantOpenState(schedule) {
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todaySchedule = schedule?.[todayKey];

  if (!todaySchedule || todaySchedule.closed) {
    return { todaySchedule, isClosed: true };
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

  return { todaySchedule, isClosed: !isOpenNow };
}

function normalizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
}

export default function RestaurantDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, getLocalizedField, lang } = useI18n();
  const [showInfo, setShowInfo] = useState(false);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
  const [sheetMeals, setSheetMeals] = useState(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMinElapsed, setWelcomeMinElapsed] = useState(false);
  const [categoryAssetsReady, setCategoryAssetsReady] = useState(false);
  const infoPanelRef = useRef(null);
  const mobileInfoToggleRef = useRef(null);
  const desktopInfoToggleRef = useRef(null);
  const swipeStartRef = useRef(null);

  const {
    data: restaurant,
    isLoading: loadingRestaurant,
    error: restaurantError,
  } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: async () => {
      const all = await localApi.entities.Restaurant.list('name');
      const normalizedSlug = decodeURIComponent(slug);
      const match = all.find((item) => {
        const nameSlug = toSlug(item.name || item.name_en || item.id);
        return item.id === normalizedSlug || nameSlug === normalizedSlug;
      });
      return match || null;
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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

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

  useEffect(() => {
    if (!restaurantId) return;
    setShowWelcome(true);
    setWelcomeMinElapsed(false);
    setCategoryAssetsReady(true);

    const timer = window.setTimeout(() => setWelcomeMinElapsed(true), 1200);
    return () => window.clearTimeout(timer);
  }, [restaurantId]);

  const {
    data: categories = [],
    isLoading: loadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ['restaurant-categories', restaurantId],
    queryFn: () => localApi.entities.Category.filter({ restaurant_id: restaurantId }, 'sort_order'),
    enabled: !!restaurantId,
  });

  const categoriesReady = !!restaurantId && !loadingCategories;

  const {
    data: meals = [],
    isLoading: loadingMeals,
    error: mealsError,
  } = useQuery({
    queryKey: ['meals', restaurantId],
    queryFn: async () => {
      const results = await localApi.entities.Meal.filter({ restaurant_id: restaurantId }, 'sort_order');
      return results.filter((meal) => (meal.is_available ?? meal.status ?? true) !== false);
    },
    enabled: !!restaurantId && categoriesReady,
  });

  const name = getLocalizedField(restaurant, 'name');
  const welcomeName = restaurant?.name || restaurant?.name_en || name;
  const desc = getLocalizedField(restaurant, 'description');
  const logoUrl = restaurant?.logo_url || restaurant?.cover_image;
  const hasInfo = desc || restaurant?.address || restaurant?.schedule || restaurant?.phone;
  const mapsHref = restaurant?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`
    : null;

  const categoryMetaByName = useMemo(() => {
    return categories.reduce((acc, category) => {
      const key = normalizeCategoryKey(category.name || category.name_en);
      if (key) acc[key] = category;
      return acc;
    }, {});
  }, [categories]);

  const categoryMetaById = useMemo(() => {
    return categories.reduce((acc, category) => {
      if (category.id) acc[category.id] = category;
      return acc;
    }, {});
  }, [categories]);

  const categoryChildrenByParentId = useMemo(() => {
    return categories.reduce((acc, category) => {
      const parentKey = category.parent_id || 'root';
      if (!acc[parentKey]) acc[parentKey] = [];
      acc[parentKey].push(category);
      return acc;
    }, {});
  }, [categories]);

  const topLevelCategories = useMemo(() => categoryChildrenByParentId.root || [], [categoryChildrenByParentId]);

  const rootCategories = useMemo(
    () =>
      topLevelCategories
        .slice()
        .sort((left, right) => (left.sort_order ?? Number.MAX_SAFE_INTEGER) - (right.sort_order ?? Number.MAX_SAFE_INTEGER)),
    [topLevelCategories]
  );

  const selectedCategory = useMemo(
    () => (selectedCategoryKey ? categoryMetaById[selectedCategoryKey] || null : null),
    [selectedCategoryKey, categoryMetaById]
  );

  const selectedChildCategories = useMemo(() => {
    if (!selectedCategoryKey) return [];
    return (categoryChildrenByParentId[selectedCategoryKey] || [])
      .slice()
      .sort((left, right) => (left.sort_order ?? Number.MAX_SAFE_INTEGER) - (right.sort_order ?? Number.MAX_SAFE_INTEGER));
  }, [categoryChildrenByParentId, selectedCategoryKey]);

  const selectedCategoryMeals = useMemo(() => {
    if (!selectedCategory) return [];
    const normalizedName = normalizeCategoryKey(selectedCategory.name || selectedCategory.name_en);
    return meals.filter((meal) => {
      if (meal.category_id && meal.category_id === selectedCategory.id) return true;
      if (!meal.category_id && normalizedName && normalizeCategoryKey(meal.menu_category) === normalizedName) return true;
      return false;
    });
  }, [meals, selectedCategory]);

  const fallbackMealSections = useMemo(() => {
    if (categories.length > 0) return [];

    const groupedMeals = meals.reduce((acc, meal) => {
      const key = normalizeCategoryKey(meal.menu_category || t('menu'));
      if (!acc[key]) {
        acc[key] = {
          key,
          label: meal.menu_category || t('menu'),
          meals: [],
        };
      }
      acc[key].meals.push(meal);
      return acc;
    }, {});

    return Object.values(groupedMeals).sort((left, right) => left.label.localeCompare(right.label));
  }, [categories.length, meals, t]);

  useEffect(() => {
    if (!selectedCategoryKey || selectedCategory) return;
    setSelectedCategoryKey(null);
  }, [selectedCategoryKey, selectedCategory]);

  useEffect(() => {
    if (!showWelcome || !restaurantId) return;
    if (!welcomeMinElapsed || !categoryAssetsReady) return;

    const timer = window.setTimeout(() => setShowWelcome(false), 250);
    return () => window.clearTimeout(timer);
  }, [showWelcome, restaurantId, welcomeMinElapsed, categoryAssetsReady]);

  const openState = useMemo(() => getRestaurantOpenState(restaurant?.schedule), [restaurant?.schedule]);
  const canonicalUrl = restaurant ? toAbsoluteUrl(`/${toSlug(restaurant.name || restaurant.name_en || restaurant.id)}`) : '';
  const seoDescription = desc || `${name} on Putt. Browse the menu, opening hours, contact details, and restaurant information.`;
  const restaurantJsonLd = restaurant
    ? {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name,
        description: seoDescription,
        url: canonicalUrl,
        image: logoUrl || undefined,
        telephone: restaurant.phone || undefined,
        address: restaurant.address
          ? {
              '@type': 'PostalAddress',
              streetAddress: restaurant.address,
              addressCountry: 'IL',
            }
          : undefined,
        geo:
          restaurant.latitude && restaurant.longitude
            ? {
                '@type': 'GeoCoordinates',
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              }
            : undefined,
        servesCuisine: restaurant.categories?.length ? restaurant.categories : undefined,
        openingHoursSpecification: scheduleToOpeningHoursSpecification(restaurant.schedule),
        hasMenu: {
          '@type': 'Menu',
          name: `${name} Menu`,
          hasMenuSection: rootCategories.map((section) => ({
            '@type': 'MenuSection',
            name: getLocalizedField(section, 'name'),
            hasMenuSection:
              (categoryChildrenByParentId[section.id] || []).length > 0
                ? (categoryChildrenByParentId[section.id] || []).map((group) => ({
                    '@type': 'MenuSection',
                    name: getLocalizedField(group, 'name'),
                    hasMenuItem: meals
                      .filter((meal) => meal.category_id === group.id)
                      .map((meal) => ({
                      '@type': 'MenuItem',
                      name: getLocalizedField(meal, 'name'),
                      description: getLocalizedField(meal, 'description') || undefined,
                      image: meal.image_url || undefined,
                      offers: {
                        '@type': 'Offer',
                        price: meal.price,
                        priceCurrency: 'ILS',
                        availability:
                          (meal.status ?? meal.is_available ?? true) === false
                            ? 'https://schema.org/OutOfStock'
                            : 'https://schema.org/InStock',
                      },
                    })),
                  }))
                : undefined,
            hasMenuItem:
              meals
                .filter((meal) => meal.category_id === section.id)
                .map((meal) => ({
                    '@type': 'MenuItem',
                    name: getLocalizedField(meal, 'name'),
                    description: getLocalizedField(meal, 'description') || undefined,
                    image: meal.image_url || undefined,
                    offers: {
                      '@type': 'Offer',
                      price: meal.price,
                      priceCurrency: 'ILS',
                      availability:
                        (meal.status ?? meal.is_available ?? true) === false
                          ? 'https://schema.org/OutOfStock'
                          : 'https://schema.org/InStock',
                    },
                  })),
          })),
        },
      }
    : null;
  const breadcrumbJsonLd = restaurant
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Putt',
            item: toAbsoluteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name,
            item: canonicalUrl,
          },
        ],
      }
    : null;

  useEffect(() => {
    if (!selectedCategory) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategoryKey) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [selectedCategoryKey]);

  useEffect(() => {
    document.body.dataset.overlayContext = sheetMeals ? 'meal-sheet' : '';
    return () => {
      document.body.dataset.overlayContext = '';
    };
  }, [sheetMeals]);

  const openSheet = (mealsList, index) => {
    setSheetMeals(mealsList);
    setSheetIndex(index);
  };

  const handleCategoryTouchStart = (event) => {
    const touch = event.touches[0];
    swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleCategoryTouchEnd = (event) => {
    if (!selectedCategory || sheetMeals || !swipeStartRef.current) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = touch.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(deltaY) > 60) return;

    if (deltaX < -80) {
      setSelectedCategoryKey(selectedCategory?.parent_id || null);
    }
  };

  if (loadingRestaurant) {
    return (
      <div className="space-y-4 py-8" role="status" aria-label="Loading restaurant">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const loadError = restaurantError || categoriesError || mealsError;

  if (loadError) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <p className="text-base font-semibold text-foreground">Could not load this restaurant from Supabase.</p>
          <p className="mt-2 text-sm text-muted-foreground">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <PageNotFound />;
  }

  const categoriesLoading = loadingCategories || loadingMeals || (showWelcome && !categoryAssetsReady);

  return (
    <div className="space-y-5 py-2 md:py-6">
      <Seo
        title={name}
        description={seoDescription}
        canonical={canonicalUrl}
        image={logoUrl}
        lang={lang}
        jsonLd={[restaurantJsonLd, breadcrumbJsonLd]}
      />
      <AnimatePresence>
        {showWelcome ? (
          <motion.div
            key="restaurant-welcome"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center bg-background px-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="flex max-w-xl flex-col items-center rounded-3xl border border-border/50 bg-card px-8 py-10 text-center shadow-lg"
            >
              <motion.div
                initial={{ rotate: 0, scale: 0.9 }}
                animate={{ rotate: 360, scale: 1 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-border/50 bg-white shadow-sm"
              >
                {logoUrl ? <img src={logoUrl} alt={name} className="h-full w-full object-cover" /> : <span className="text-4xl">*</span>}
              </motion.div>
              <p className="mb-2 text-sm font-medium tracking-[0.25em] text-muted-foreground">{t('welcomeTo')}</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">{welcomeName}</h1>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!selectedCategory ? (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="hidden items-center gap-6 rounded-2xl border border-border/50 bg-card p-6 shadow-sm md:flex">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted">
              {logoUrl ? <img src={logoUrl} alt={name} className="h-full w-full object-cover" /> : <span className="text-4xl">*</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-foreground">{name}</h1>
            </div>
            {hasInfo ? (
              <button
                ref={desktopInfoToggleRef}
                onClick={() => setShowInfo((value) => !value)}
                aria-expanded={showInfo}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Info className="h-4 w-4" />
                {t('info')}
              </button>
            ) : null}
          </div>
          <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm md:hidden">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
              {logoUrl ? <img src={logoUrl} alt={name} className="h-full w-full object-cover" /> : <span className="text-4xl">*</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-tight text-foreground">{name}</h1>
            </div>
            {hasInfo ? (
              <button
                ref={mobileInfoToggleRef}
                onClick={() => setShowInfo((value) => !value)}
                aria-expanded={showInfo}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Info className="h-4 w-4" />
                {t('info')}
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      <AnimatePresence>
        {showInfo && hasInfo && !selectedCategory ? (
          <motion.div
            ref={infoPanelRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 rounded-xl border border-border/50 bg-card p-4">
              {desc ? <p className="text-sm text-muted-foreground">{desc}</p> : null}

              {openState.todaySchedule ? (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    openState.isClosed ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'
                  }`}
                >
                  {openState.isClosed ? (
                    <>
                      <XCircle className="h-4 w-4 shrink-0" />
                      {t('closedNow')}
                      {openState.todaySchedule.open && openState.todaySchedule.close
                        ? ` · ${openState.todaySchedule.open} - ${openState.todaySchedule.close}`
                        : ''}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {t('openToday')}: {openState.todaySchedule.open} - {openState.todaySchedule.close}
                    </>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 text-sm">
                {restaurant.address ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4 shrink-0" />
                    {restaurant.address}
                  </a>
                ) : null}

                {restaurant.phone ? (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                    <Phone className="h-4 w-4 shrink-0" />
                    {restaurant.phone}
                  </a>
                ) : null}

                {restaurant.schedule ? (
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    <ScheduleDisplay schedule={restaurant.schedule} />
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main id="menu-content" className="space-y-6">
        {!selectedCategory ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">{t('categories')}</h2>
              {!categoriesLoading ? <span className="text-sm text-muted-foreground">{(rootCategories.length || fallbackMealSections.length)} {t('sections')}</span> : null}
            </div>

            {categoriesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : rootCategories.length === 0 && fallbackMealSections.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <span className="mb-2 block text-3xl">*</span>
                <p>{t('noMeals')}</p>
              </div>
            ) : (
              <MenuCategoryGrid
                categories={(rootCategories.length > 0 ? rootCategories : fallbackMealSections).map((section) => getLocalizedField(section, 'name') || section.label)}
                onSelect={(label) => {
                  const source = rootCategories.length > 0 ? rootCategories : fallbackMealSections;
                  const match = source.find((section) => (getLocalizedField(section, 'name') || section.label) === label);
                  if (match) setSelectedCategoryKey(match.id || match.key);
                }}
              />
            )}
          </>
        ) : (
          <div
            className="flex h-[calc(100vh-5.5rem)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm md:h-[calc(100vh-6.5rem)]"
            onTouchStart={handleCategoryTouchStart}
            onTouchEnd={handleCategoryTouchEnd}
          >
            <div className="sticky top-0 z-20 shrink-0 space-y-2 border-b border-border/50 bg-card/95 px-4 py-3 backdrop-blur md:px-5">
              <button
                onClick={() => setSelectedCategoryKey(selectedCategory.parent_id || null)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </button>

              <div>
                <h2 className="text-2xl font-bold text-foreground">{getLocalizedField(selectedCategory, 'name')}</h2>
                <p className="text-sm text-muted-foreground">{selectedCategoryMeals.length} {t('items')}</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5">
              <div className="space-y-5">
                {selectedChildCategories.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{t('categories')}</h3>
                      <span className="text-xs text-muted-foreground">{selectedChildCategories.length} {t('sections')}</span>
                    </div>
                    <MenuCategoryGrid
                      categories={selectedChildCategories.map((category) => getLocalizedField(category, 'name'))}
                      onSelect={(label) => {
                        const match = selectedChildCategories.find((category) => getLocalizedField(category, 'name') === label);
                        if (match) setSelectedCategoryKey(match.id);
                      }}
                    />
                  </div>
                ) : null}

                {selectedCategoryMeals.length > 0 ? (
                  <section className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">{t('menu')}</h3>
                      <p className="text-xs text-muted-foreground">{selectedCategoryMeals.length} {t('items')}</p>
                    </div>

                    <div className="space-y-3">
                      {selectedCategoryMeals.map((meal, index) => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                          index={index}
                          onClick={() => openSheet(selectedCategoryMeals, index)}
                          fallbackImage={logoUrl}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </main>

      {sheetMeals ? (
        <MealDetailSheet
          meals={sheetMeals}
          initialIndex={sheetIndex}
          onClose={() => setSheetMeals(null)}
          fallbackImage={logoUrl}
        />
      ) : null}
    </div>
  );
}

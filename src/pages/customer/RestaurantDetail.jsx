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
  const { t, getLocalizedField } = useI18n();
  const [showInfo, setShowInfo] = useState(false);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
  const [sheetMeals, setSheetMeals] = useState(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const infoPanelRef = useRef(null);
  const mobileInfoToggleRef = useRef(null);
  const desktopInfoToggleRef = useRef(null);

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

  const { data: meals = [], isLoading: loadingMeals } = useQuery({
    queryKey: ['meals', restaurantId],
    queryFn: async () => {
      const results = await localApi.entities.Meal.filter({ restaurant_id: restaurantId }, 'sort_order');
      return results.filter((meal) => (meal.status ?? meal.is_available ?? true) !== false);
    },
    enabled: !!restaurantId,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['restaurant-categories', restaurantId],
    queryFn: () => localApi.entities.Category.filter({ restaurant_id: restaurantId }, 'sort_order'),
    enabled: !!restaurantId,
  });

  const name = getLocalizedField(restaurant, 'name');
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

  const categoryChildrenByParentId = useMemo(() => {
    return categories.reduce((acc, category) => {
      const parentKey = category.parent_id || 'root';
      if (!acc[parentKey]) acc[parentKey] = [];
      acc[parentKey].push(category);
      return acc;
    }, {});
  }, [categories]);

  const topLevelCategories = useMemo(() => categoryChildrenByParentId.root || [], [categoryChildrenByParentId]);

  const categorySections = useMemo(() => {
    const mealsByMenuCategory = meals.reduce((acc, meal) => {
      const rawKey = meal.menu_category || t('menu');
      const normalizedKey = normalizeCategoryKey(rawKey);
      if (!acc[normalizedKey]) {
        acc[normalizedKey] = {
          label: rawKey,
          meals: [],
        };
      }
      acc[normalizedKey].meals.push(meal);
      return acc;
    }, {});

    const sections = [];
    const usedMealKeys = new Set();

    topLevelCategories
      .slice()
      .sort((left, right) => (left.sort_order ?? Number.MAX_SAFE_INTEGER) - (right.sort_order ?? Number.MAX_SAFE_INTEGER))
      .forEach((category) => {
        const children = (categoryChildrenByParentId[category.id] || [])
          .slice()
          .sort((left, right) => (left.sort_order ?? Number.MAX_SAFE_INTEGER) - (right.sort_order ?? Number.MAX_SAFE_INTEGER));

        const childGroups = children
          .map((child) => {
            const childKey = normalizeCategoryKey(child.name || child.name_en);
            const match = mealsByMenuCategory[childKey];
            if (!match) return null;
            usedMealKeys.add(childKey);
            return {
              key: childKey,
              label: getLocalizedField(child, 'name'),
              meals: match.meals,
            };
          })
          .filter(Boolean);

        const parentKey = normalizeCategoryKey(category.name || category.name_en);
        const parentMatch = mealsByMenuCategory[parentKey];
        if (parentMatch) {
          usedMealKeys.add(parentKey);
        }

        const allMeals = [
          ...(parentMatch?.meals || []),
          ...childGroups.flatMap((group) => group.meals),
        ];

        if (allMeals.length === 0) return;

        sections.push({
          key: category.id,
          label: getLocalizedField(category, 'name'),
          groups: childGroups.length > 0
            ? childGroups
            : [
                {
                  key: parentKey,
                  label: getLocalizedField(category, 'name'),
                  meals: allMeals,
                },
              ],
          meals: allMeals,
        });
      });

    Object.entries(mealsByMenuCategory)
      .filter(([key]) => !usedMealKeys.has(key))
      .sort((left, right) => {
        const leftOrder = categoryMetaByName[left[0]]?.sort_order ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = categoryMetaByName[right[0]]?.sort_order ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left[1].label.localeCompare(right[1].label);
      })
      .forEach(([key, value]) => {
        sections.push({
          key,
          label: categoryMetaByName[key] ? getLocalizedField(categoryMetaByName[key], 'name') : value.label,
          groups: [
            {
              key,
              label: categoryMetaByName[key] ? getLocalizedField(categoryMetaByName[key], 'name') : value.label,
              meals: value.meals,
            },
          ],
          meals: value.meals,
        });
      });

    return sections;
  }, [meals, t, topLevelCategories, categoryChildrenByParentId, getLocalizedField, categoryMetaByName]);

  useEffect(() => {
    if (!selectedCategoryKey || categorySections.some((section) => section.key === selectedCategoryKey)) return;
    setSelectedCategoryKey(null);
  }, [selectedCategoryKey, categorySections]);

  const selectedSection = categorySections.find((section) => section.key === selectedCategoryKey);
  const openState = useMemo(() => getRestaurantOpenState(restaurant?.schedule), [restaurant?.schedule]);

  const openSheet = (mealsList, index) => {
    setSheetMeals(mealsList);
    setSheetIndex(index);
  };

  if (loadingRestaurant) {
    return (
      <div className="space-y-4 py-8" role="status" aria-label="Loading restaurant">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="py-20 text-center text-muted-foreground" role="alert">
        <p>{t('noResults')}</p>
      </div>
    );
  }

  const categoriesLoading = loadingMeals || loadingCategories;

  return (
    <div className="space-y-5 py-2 md:py-6">
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
              Info
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
              Info
            </button>
          ) : null}
        </div>
      </motion.div>

      <AnimatePresence>
        {showInfo && hasInfo ? (
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
                      Closed now
                      {openState.todaySchedule.open && openState.todaySchedule.close
                        ? ` · ${openState.todaySchedule.open} - ${openState.todaySchedule.close}`
                        : ''}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      Open today: {openState.todaySchedule.open} - {openState.todaySchedule.close}
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
        {!selectedSection ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">{t('categories')}</h2>
              {!categoriesLoading ? <span className="text-sm text-muted-foreground">{categorySections.length} sections</span> : null}
            </div>

            {categoriesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categorySections.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <span className="mb-2 block text-3xl">*</span>
                <p>{t('noMeals')}</p>
              </div>
            ) : (
              <MenuCategoryGrid
                categories={categorySections.map((section) => section.label)}
                onSelect={(label) => {
                  const match = categorySections.find((section) => section.label === label);
                  if (match) setSelectedCategoryKey(match.key);
                }}
              />
            )}
          </>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="sticky top-14 z-20 space-y-2 border-b border-border/50 bg-card/95 px-4 py-3 backdrop-blur md:top-16 md:px-5">
              <button
                onClick={() => setSelectedCategoryKey(null)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </button>

              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedSection.label}</h2>
                <p className="text-sm text-muted-foreground">{selectedSection.meals.length} items</p>
              </div>
            </div>

            <div className="max-h-[calc(100vh-15rem)] overflow-y-auto px-4 pb-4 pt-3 md:max-h-[calc(100vh-13rem)] md:px-5 md:pb-5 md:pt-4">
              <div className="space-y-5">
                {selectedSection.groups.map((group) => (
                  <section key={group.key} className="space-y-3">
                    {selectedSection.groups.length > 1 ? (
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">{group.label}</h3>
                        <p className="text-xs text-muted-foreground">{group.meals.length} items</p>
                      </div>
                    ) : null}
                    <div className="space-y-3">
                      {group.meals.map((meal, index) => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                          index={index}
                          onClick={() => openSheet(group.meals, index)}
                          fallbackImage={logoUrl}
                        />
                      ))}
                    </div>
                  </section>
                ))}
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

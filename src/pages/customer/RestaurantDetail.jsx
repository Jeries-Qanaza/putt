import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { localApi } from '@/lib/localApi';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Phone, Info, CheckCircle, XCircle } from 'lucide-react';
import ScheduleDisplay from '@/components/shared/ScheduleDisplay';
import MealCard from '@/components/customer/MealCard';
import MenuCategoryGrid from '@/components/customer/MenuCategoryGrid';
import MealDetailSheet from '@/components/customer/MealDetailSheet';
import { motion, AnimatePresence } from 'framer-motion';
import { toSlug } from '@/lib/slugify';

export default function RestaurantDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang, getLocalizedField } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDrinkSub, setSelectedDrinkSub] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [sheetMeals, setSheetMeals] = useState(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const infoPanelRef = useRef(null);
  const mobileInfoToggleRef = useRef(null);
  const desktopInfoToggleRef = useRef(null);

  const openSheet = (mealsList, idx) => { setSheetMeals(mealsList); setSheetIndex(idx); };

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: async () => {
      const all = await localApi.entities.Restaurant.list('name');
      return all.find((r) => {
        const normalizedSlug = decodeURIComponent(slug);
        const nameSlug = toSlug(r.name || r.name_en || r.id);
        return nameSlug === normalizedSlug || r.id === normalizedSlug;
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

  const name = getLocalizedField(restaurant, 'name');
  const desc = getLocalizedField(restaurant, 'description');
  const logoUrl = restaurant.logo_url || restaurant.cover_image;
  const hasInfo = desc || restaurant.address || restaurant.schedule || restaurant.phone;

  // Today's hours
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayKey = DAYS[new Date().getDay()];
  const todaySchedule = restaurant.schedule?.[todayKey];

  // Get localized category for a meal
  const getMealCategory = (meal) => getLocalizedField(meal, 'menu_category') || meal.menu_category || t('menu');

  // Group meals by localized menu_category, merging drink sub-categories under "Drinks"
  const DRINK_KEYWORDS_EN = ['beer', 'alcohol', 'wine', 'cold drinks', 'hot drinks', 'coffee', 'drinks', 'cocktails', 'spirits'];
  const DRINK_KEYWORDS_HE = ['בירה', 'אלכוהול', 'יין', 'משקאות קרים', 'משקאות חמים', 'קפה', 'משקאות', 'קוקטיילים'];
  const DRINK_KEYWORDS_AR = ['بيرة', 'كحول', 'نبيذ', 'مشروبات باردة', 'مشروبات ساخنة', 'قهوة', 'مشروبات', 'كوكتيل'];
  const ALL_DRINK_KEYWORDS = [...DRINK_KEYWORDS_EN, ...DRINK_KEYWORDS_HE, ...DRINK_KEYWORDS_AR];
  const isDrinkCategory = (cat) => ALL_DRINK_KEYWORDS.some(d => cat.toLowerCase().includes(d.toLowerCase()));

  // Drinks parent label per language
  const drinksLabel = { en: 'Drinks', he: 'משקאות', ar: 'مشروبات' }[lang] || 'Drinks';

  const rawGrouped = meals.reduce((acc, meal) => {
    const cat = getMealCategory(meal);
    const key = isDrinkCategory(cat) ? drinksLabel : cat;
    if (!acc[key]) acc[key] = [];
    acc[key].push(meal);
    return acc;
  }, {});

  const grouped = rawGrouped;
  const categories = Object.keys(grouped);

  // For the Drinks parent category, build sub-grouping
  const drinksSubGrouped = meals
    .filter(m => isDrinkCategory(getMealCategory(m)))
    .reduce((acc, meal) => {
      const cat = getMealCategory(meal);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(meal);
      return acc;
    }, {});
  const drinksSubCategories = Object.keys(drinksSubGrouped);

  // When a category is selected, use a full-screen fixed layout so header stays visible
  if (selectedCategory) {
    const drinksLabel = { en: 'Drinks', he: 'משקאות', ar: 'مشروبات' }[lang] || 'Drinks';
    const isDropdownDrinks = selectedCategory === drinksLabel && !selectedDrinkSub;
    const isDrinkSub = selectedCategory === drinksLabel && selectedDrinkSub;
    const currentTitle = isDropdownDrinks ? 'Drinks' : isDrinkSub ? selectedDrinkSub : selectedCategory;
    const currentItems = isDropdownDrinks ? null : isDrinkSub ? (drinksSubGrouped[selectedDrinkSub] || []) : (grouped[selectedCategory] || []);
    const itemCount = currentItems?.length;
    const onBack = isDrinkSub ? () => setSelectedDrinkSub(null) : () => setSelectedCategory(null);

    return (
      <div className="fixed inset-0 z-[50] bg-background flex flex-col" style={{ top: '3.5rem' }}>
        {/* Fixed header */}
        <div className="shrink-0 px-4 pt-4 pb-3 bg-background border-b border-border/50 space-y-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            ← {t('back')}
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">{currentTitle}</h2>
            {itemCount != null && (
              <>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{itemCount} {t('items')}</span>
              </>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isDropdownDrinks ? (
            <MenuCategoryGrid categories={drinksSubCategories} onSelect={setSelectedDrinkSub} />
          ) : (
            <div className="space-y-3">
              {currentItems.map((meal, i) => (
                <MealCard key={meal.id} meal={meal} index={i} onClick={() => openSheet(currentItems, i)} />
              ))}
            </div>
          )}
        </div>

        {sheetMeals && (
          <MealDetailSheet meals={sheetMeals} initialIndex={sheetIndex} onClose={() => setSheetMeals(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="py-2 md:py-6 space-y-5">
      {/* Skip to content for accessibility */}
      <a href="#menu-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50">
        Skip to menu
      </a>

      {/* Header — mobile: full cover image, desktop: logo + name side by side */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Mobile cover (full bleed image) — hidden when browsing a category */}
        <div className={`md:hidden relative aspect-[21/9] rounded-2xl overflow-hidden bg-muted ${selectedCategory ? 'hidden' : ''}`}>
          {restaurant.cover_image ? (
            <img src={restaurant.cover_image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-6xl" aria-hidden="true">🍽️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-12">
            <h1 className="text-2xl font-bold text-white drop-shadow">{name}</h1>
            {restaurant.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {restaurant.categories.map((cat) => (
                  <Badge key={cat} className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">{cat}</Badge>
                ))}
              </div>
            )}
          </div>
          {hasInfo && (
            <button
              ref={mobileInfoToggleRef}
              onClick={() => setShowInfo((v) => !v)}
              aria-expanded={showInfo}
              className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Desktop: logo card */}
        <div className="hidden md:flex items-center gap-6 p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
          {/* Logo */}
          <div className="h-24 w-24 rounded-2xl overflow-hidden bg-muted shrink-0 flex items-center justify-center border border-border/50">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">🍽️</span>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground">{name}</h1>
            {restaurant.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {restaurant.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                ))}
              </div>
            )}
          </div>
          {hasInfo && (
            <button
              ref={desktopInfoToggleRef}
              onClick={() => setShowInfo((v) => !v)}
              aria-expanded={showInfo}
              className="shrink-0 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
            >
              <Info className="h-4 w-4" />
              Info
            </button>
          )}
        </div>
      </motion.div>

      {/* Collapsible info panel */}
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
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
              {desc && <p className="text-muted-foreground text-sm">{desc}</p>}
              
              {/* Today's hours highlight */}
              {todaySchedule && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${todaySchedule.closed ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'}`}>
                  {todaySchedule.closed ? (
                    <><XCircle className="h-4 w-4 shrink-0" />Closed today</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 shrink-0" />Open today: {todaySchedule.open} – {todaySchedule.close}</>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 text-sm">
                {restaurant.address && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{restaurant.address}
                  </span>
                )}
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-1.5 text-primary hover:underline focus:outline-none focus:underline"
                    aria-label={`Call ${name} at ${restaurant.phone}`}
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />{restaurant.phone}
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

      {/* Menu — only shown when no category selected */}
      <main id="menu-content" role="main" aria-label={`${name} menu`}>
        {meals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" role="status">
            <span className="text-3xl block mb-2" aria-hidden="true">🍽️</span>
            <p>{t('noMeals')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('categories')}</p>
            <MenuCategoryGrid categories={categories} onSelect={setSelectedCategory} />
          </div>
        )}
      </main>

      {/* Meal detail sheet */}
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

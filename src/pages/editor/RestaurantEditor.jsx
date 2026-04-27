import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, ChevronLeft, Clock, FolderOpen, Loader2, LogOut, Pencil, Plus, Settings, Trash2, UtensilsCrossed } from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import DietaryBadges from '@/components/shared/DietaryBadges';
import SchedulePicker, { getInitialSchedule } from '@/components/shared/SchedulePicker';
import ImageUpload from '@/components/shared/ImageUpload';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import Seo from '@/components/shared/Seo';
import MealForm from '@/components/manager/MealForm';
import EventForm from '@/components/manager/EventForm';
import EditorLogin from './EditorLogin';
import { uploadPreparedImageToStorage } from '@/lib/imageUpload';

export default function RestaurantEditor() {
  const { slug } = useParams();
  const { t, getLocalizedField } = useI18n();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [initialMealCategory, setInitialMealCategory] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingMealId, setDeletingMealId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    name_he: '',
    name_ar: '',
    description: '',
    description_he: '',
    description_ar: '',
    sort_order: 0,
    parent_id: 'root',
  });
  const [infoForm, setInfoForm] = useState(null);

  useEffect(() => {
    const lock = showMealForm || showEventForm || showCategoryForm || !!deletingMealId || !!deletingEventId || !!deletingCategoryId;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showMealForm, showEventForm, showCategoryForm, deletingMealId, deletingEventId, deletingCategoryId]);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['editor-restaurant', slug],
    queryFn: async () => {
      const all = await localApi.entities.Restaurant.list('name');
      return all.find((item) => (item.name || item.id).toLowerCase().replace(/\s+/g, '-') === decodeURIComponent(slug));
    },
  });

  useEffect(() => {
    if (!restaurant || !isSupabaseConfigured) return undefined;
    const expectedEditorId = restaurant.editor_id || '';
    const expectedEditorEmail = (restaurant.editor_email || restaurant.editor_username || '').trim().toLowerCase();
    const syncAuthState = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUserId = data.session?.user?.id || '';
      const sessionUserEmail = (data.session?.user?.email || '').trim().toLowerCase();
      setAuthenticated(
        Boolean(
          data.session && (
            (expectedEditorId && sessionUserId === expectedEditorId) ||
            (expectedEditorEmail && sessionUserEmail === expectedEditorEmail)
          )
        )
      );
    };
    syncAuthState();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUserId = session?.user?.id || '';
      const sessionUserEmail = (session?.user?.email || '').trim().toLowerCase();
      setAuthenticated(
        Boolean(
          session && (
            (expectedEditorId && sessionUserId === expectedEditorId) ||
            (expectedEditorEmail && sessionUserEmail === expectedEditorEmail)
          )
        )
      );
    });
    return () => subscription.unsubscribe();
  }, [restaurant]);

  const isAuthed = Boolean(
    authenticated || (restaurant && sessionStorage.getItem(`editor_auth_${restaurant.id}`) === 'true')
  );
  const restaurantLogo = restaurant?.logo_url || restaurant?.cover_image;

  useEffect(() => {
    if (restaurant && !infoForm) {
      setInfoForm({
        cover_image: restaurant.cover_image || '',
        description: restaurant.description || '',
        description_he: restaurant.description_he || '',
        description_ar: restaurant.description_ar || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        schedule: getInitialSchedule(restaurant.schedule),
      });
    }
  }, [restaurant, infoForm]);

  const updateRestaurant = useMutation({
    mutationFn: (data) => Promise.resolve().then(async () => {
      const payload = { ...data };
      payload.cover_image = await uploadPreparedImageToStorage(payload.cover_image, {
        restaurantName: restaurant.name || restaurant.name_en || 'shared',
        entityType: 'restaurant-covers',
        fixedFileName: 'cover',
      });
      return localApi.entities.Restaurant.update(restaurant.id, payload);
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-restaurant'] });
      toast({ title: t('saved') });
    },
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['editor-meals', restaurant?.id],
    queryFn: () => localApi.entities.Meal.filter({ restaurant_id: restaurant.id }, 'sort_order'),
    enabled: !!restaurant?.id && isAuthed,
  });
  const { data: events = [] } = useQuery({
    queryKey: ['editor-events', restaurant?.id],
    queryFn: () => localApi.entities.Event.filter({ restaurant_id: restaurant.id }, '-date'),
    enabled: !!restaurant?.id && isAuthed,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['editor-categories', restaurant?.id],
    queryFn: () => localApi.entities.Category.filter({ restaurant_id: restaurant.id }, 'sort_order'),
    enabled: !!restaurant?.id && isAuthed,
  });

  const childCategoriesByParent = useMemo(() => categories.reduce((acc, category) => {
    const key = category.parent_id || 'root';
    if (!acc[key]) acc[key] = [];
    acc[key].push(category);
    acc[key].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return acc;
  }, {}), [categories]);
  const mealsByCategory = useMemo(() => meals.reduce((acc, meal) => {
    [meal.category_id, meal.menu_category].filter(Boolean).forEach((key) => {
      if (!acc[key]) acc[key] = [];
      acc[key].push(meal);
    });
    return acc;
  }, {}), [meals]);
  const currentCategory = useMemo(() => categories.find((category) => category.id === currentCategoryId) || null, [categories, currentCategoryId]);
  const currentCategoryName = currentCategory?.name || currentCategory?.name_en || '';
  const visibleCategories = useMemo(() => childCategoriesByParent[currentCategoryId || 'root'] || [], [childCategoriesByParent, currentCategoryId]);
  const currentCategoryMeals = useMemo(() => {
    if (!currentCategory) return [];
    return mealsByCategory[currentCategory.id] || mealsByCategory[currentCategoryName] || [];
  }, [currentCategory, currentCategoryName, mealsByCategory]);
  const activeMeals = useMemo(() => meals.filter((meal) => (meal.is_available ?? meal.status ?? true) !== false), [meals]);
  const inactiveMeals = useMemo(() => meals.filter((meal) => (meal.is_available ?? meal.status ?? true) === false), [meals]);

  useEffect(() => {
    if (currentCategoryId && !categories.some((category) => category.id === currentCategoryId)) {
      setCurrentCategoryId(null);
    }
  }, [categories, currentCategoryId]);

  const deleteMeal = useMutation({
    mutationFn: (id) => localApi.entities.Meal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-meals'] });
      setDeletingMealId(null);
    },
  });
  const deleteEvent = useMutation({
    mutationFn: (id) => localApi.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-events'] });
      setDeletingEventId(null);
    },
  });
  const saveCategory = useMutation({
    mutationFn: (data) => {
      const payload = {
        name: data.name,
        name_he: data.name_he || '',
        name_ar: data.name_ar || '',
        description: data.description || '',
        description_he: data.description_he || '',
        description_ar: data.description_ar || '',
        sort_order: Number(data.sort_order || 0),
        restaurant_id: restaurant.id,
        parent_id: data.parent_id === 'root' ? null : data.parent_id,
      };
      return editingCategory ? localApi.entities.Category.update(editingCategory.id, payload) : localApi.entities.Category.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-categories'] });
      setShowCategoryForm(false);
      setEditingCategory(null);
    },
  });
  const deleteCategory = useMutation({
    mutationFn: (id) => localApi.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-categories'] });
      setDeletingCategoryId(null);
      setShowCategoryForm(false);
      setEditingCategory(null);
    },
  });

  const handleLogout = () => {
    if (restaurant) sessionStorage.removeItem(`editor_auth_${restaurant.id}`);
    if (isSupabaseConfigured) supabase.auth.signOut();
    setAuthenticated(false);
    queryClient.clear();
  };

  const openCategoryForm = (category = null, parentId = 'root') => {
    setEditingCategory(category);
    setCategoryForm(category ? {
      name: category.name || '',
      name_he: category.name_he || '',
      name_ar: category.name_ar || '',
      description: category.description || category.desc_en || '',
      description_he: category.description_he || category.desc_he || '',
      description_ar: category.description_ar || category.desc_ar || '',
      sort_order: category.sort_order || 0,
      parent_id: category.parent_id || 'root',
    } : {
      name: '',
      name_he: '',
      name_ar: '',
      description: '',
      description_he: '',
      description_ar: '',
      sort_order: visibleCategories.length,
      parent_id: parentId,
    });
    setShowCategoryForm(true);
  };

  const openMealForm = (meal = null, categoryName = '') => {
    setEditingMeal(meal);
    setInitialMealCategory(categoryName);
    setShowMealForm(true);
  };

  const requestDeleteCategory = (category) => {
    const categoryIdsToCheck = [category.id];
    for (let index = 0; index < categoryIdsToCheck.length; index += 1) {
      const nextChildren = childCategoriesByParent[categoryIdsToCheck[index]] || [];
      nextChildren.forEach((child) => categoryIdsToCheck.push(child.id));
    }

    const hasMeals = categoryIdsToCheck.some((categoryId) => (mealsByCategory[categoryId] || []).length > 0);

    if (hasMeals) {
      toast({
        title: t('cannotUndo'),
        description: 'Move or delete meals in this category tree first.',
        variant: 'destructive',
      });
      return;
    }

    setDeletingCategoryId(category.id);
  };

  const closeMealForm = () => {
    setShowMealForm(false);
    setEditingMeal(null);
    setInitialMealCategory('');
    queryClient.invalidateQueries({ queryKey: ['editor-meals'] });
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!restaurant) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">{t('restaurantNotFound')}</div>;
  if (!isAuthed) return <EditorLogin restaurant={restaurant} onSuccess={() => setAuthenticated(true)} />;

  const name = getLocalizedField(restaurant, 'name');

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <Seo title={`${name} Editor`} description={`Manage ${name} in Putt.`} robots="noindex,nofollow" />
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary">
              {restaurantLogo ? <img src={restaurantLogo} alt={name} className="h-full w-full object-cover" /> : <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />}
            </div>
            <span className="text-lg font-bold">{name}</span>
            <Badge variant="secondary" className="text-xs">{t('editor')}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" /> {t('logout')}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto h-[calc(100vh-3.5rem)] max-w-4xl overflow-y-auto px-4 py-6">
        <Tabs defaultValue="categories">
          <TabsList className="mb-6 w-full justify-start bg-muted/50">
            <TabsTrigger value="categories" className="flex-1 md:flex-none">{t('menu')}</TabsTrigger>
            <TabsTrigger value="meals" className="flex-1 md:flex-none">{t('allMeals')}</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 md:flex-none">{t('events')} {events.length > 0 && `(${events.length})`}</TabsTrigger>
            <TabsTrigger value="info" className="flex-1 md:flex-none"><Settings className="me-1 h-4 w-4" /> {t('info')}</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{currentCategory ? getLocalizedField(currentCategory, 'name') : t('menu')}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentCategory ? 'Open a subcategory or manage meals inside this folder.' : 'Open a category like a folder and build your menu tree.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {currentCategory ? (
                  <Button variant="outline" onClick={() => setCurrentCategoryId(currentCategory.parent_id || null)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : null}
                <Button onClick={() => openCategoryForm(null, currentCategory?.id || 'root')} className="gap-2"><Plus className="h-4 w-4" /> {t('addCategory')}</Button>
                {currentCategory ? <Button onClick={() => openMealForm(null, currentCategoryName)} className="gap-2"><Plus className="h-4 w-4" /> {t('addMeal')}</Button> : null}
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="space-y-4 p-4">
                {currentCategory ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
                    <p className="font-semibold">{getLocalizedField(currentCategory, 'name')}</p>
                    <p className="text-xs text-muted-foreground">{currentCategoryMeals.length} {t('items')} · {visibleCategories.length} {t('categories')}</p>
                  </div>
                ) : null}

                {visibleCategories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {visibleCategories.map((category) => {
                      return (
                        <div key={category.id} className="group relative">
                          <div className="relative mx-auto w-full max-w-[150px] transition-transform duration-200 hover:-translate-y-1">
                            <div className="absolute left-3 top-0 h-5 w-16 rounded-t-[14px] rounded-b-[8px] bg-[#76a7db]" />
                            <div className="absolute left-4 top-2 h-3 w-12 rounded-full bg-white/25 blur-[2px]" aria-hidden="true" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute end-1 top-1 z-10 h-7 w-7 shrink-0 rounded-full bg-white/72 text-slate-800 shadow-sm backdrop-blur hover:bg-white"
                              onClick={() => openCategoryForm(category)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <button
                              type="button"
                              onClick={() => setCurrentCategoryId(category.id)}
                              className="relative mt-3 flex h-24 w-full items-end justify-center overflow-hidden rounded-[16px] rounded-tl-[10px] border border-[#6e9fd2] bg-gradient-to-b from-[#8eb8e7] via-[#7faddf] to-[#73a4da] px-3 pb-3 shadow-[0_12px_24px_-18px_rgba(32,73,118,0.9)]"
                            >
                              <div className="absolute inset-x-2 top-2 h-4 rounded-full bg-white/20 blur-[2px]" aria-hidden="true" />
                              <FolderOpen className="relative h-8 w-8 text-[#234d7f]" />
                            </button>
                          </div>
                          <p className="mt-3 text-center text-sm font-medium text-foreground">
                            {getLocalizedField(category, 'name')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {currentCategory ? (
                  <div className="space-y-3 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{t('allMeals')}</p>
                      <Badge variant="secondary">{currentCategoryMeals.length}</Badge>
                    </div>
                    {currentCategoryMeals.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {currentCategoryMeals.map((meal, index) => (
                          <Card key={meal.id} className="overflow-hidden border border-border/60 shadow-sm">
                            <div className="aspect-[16/10] overflow-hidden bg-muted">
                              {meal.image_url || restaurantLogo ? (
                                <img
                                  src={meal.image_url || restaurantLogo}
                                  alt={getLocalizedField(meal, 'name')}
                                  className="h-full w-full object-cover"
                                  loading={index < 4 ? 'eager' : 'lazy'}
                                  fetchPriority={index < 4 ? 'high' : 'auto'}
                                  decoding="async"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-3xl">
                                  *
                                </div>
                              )}
                            </div>
                            <CardContent className="space-y-2 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{getLocalizedField(meal, 'name')}</p>
                                  <p className="text-sm font-bold text-primary">{t('currency')}{meal.price}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openMealForm(meal)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              {getLocalizedField(meal, 'description') ? (
                                <p className="line-clamp-2 text-xs text-muted-foreground">{getLocalizedField(meal, 'description')}</p>
                              ) : null}
                              <DietaryBadges tags={meal.dietary_tags} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                        No meals in this category yet.
                      </div>
                    )}
                  </div>
                ) : null}

                {categories.length === 0 || (!currentCategory && visibleCategories.length === 0) ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-muted-foreground">
                    {t('noCategoriesYet')}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {showCategoryForm ? <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"><div className="mb-4"><h3 className="text-lg font-bold">{editingCategory ? t('editCategory') : t('addCategory')}</h3><p className="mt-1 text-sm text-muted-foreground">Categories are saved directly in Supabase and linked with their parent folder.</p></div><form onSubmit={(event) => { event.preventDefault(); saveCategory.mutate(categoryForm); }} className="space-y-4"><div><Label>{t('parentCategory')}</Label><select value={categoryForm.parent_id} onChange={(event) => setCategoryForm({ ...categoryForm, parent_id: event.target.value })} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="root">{t('topLevel')}</option>{categories.filter((category) => category.id !== editingCategory?.id).map((category) => <option key={category.id} value={category.id}>{getLocalizedField(category, 'name')}</option>)}</select></div><div><Label>{t('categoryName')} (EN)</Label><Input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required /></div><div><Label>{t('categoryName')} (HE)</Label><Input value={categoryForm.name_he} onChange={(event) => setCategoryForm({ ...categoryForm, name_he: event.target.value })} dir="rtl" /></div><div><Label>{t('categoryName')} (AR)</Label><Input value={categoryForm.name_ar} onChange={(event) => setCategoryForm({ ...categoryForm, name_ar: event.target.value })} dir="rtl" /></div><div><Label>{t('sortOrder')}</Label><Input value={categoryForm.sort_order} onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: event.target.value })} type="number" /></div><div className="flex justify-between gap-2 pt-2">{editingCategory ? <Button type="button" variant="destructive" onClick={() => { setShowCategoryForm(false); requestDeleteCategory(editingCategory); }}>Delete</Button> : <span /> }<div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}>{t('cancel')}</Button><Button type="submit" disabled={saveCategory.isPending}>{saveCategory.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{t('save')}</Button></div></div></form></div></div> : null}
          </TabsContent>

          <TabsContent value="meals">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('allMeals')}</h2>
              <Button onClick={() => openMealForm()} className="gap-2"><Plus className="h-4 w-4" /> {t('addMeal')}</Button>
            </div>
                        <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{t('active')}</h3>
                  <Badge variant="secondary">{activeMeals.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {activeMeals.map((meal) => (
                    <Card key={meal.id} className="overflow-hidden border-0 shadow-sm">
                      {meal.image_url ? <div className="aspect-[16/10] overflow-hidden bg-muted"><img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover" /></div> : null}
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{getLocalizedField(meal, 'name')}</h3>
                            <p className="text-sm font-bold text-primary">{t('currency')}{meal.price}</p>
                            {meal.menu_category ? <p className="mt-1 text-xs text-muted-foreground">{meal.menu_category}</p> : null}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMealForm(meal)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingMealId(meal.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        {getLocalizedField(meal, 'description') ? <p className="line-clamp-2 text-xs text-muted-foreground">{getLocalizedField(meal, 'description')}</p> : null}
                        <DietaryBadges tags={meal.dietary_tags} />
                        <Badge variant="default" className="text-xs">{t('active')}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/70 pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">{t('inactive')}</h3>
                  <Badge variant="outline">{inactiveMeals.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {inactiveMeals.map((meal) => (
                    <Card key={meal.id} className="overflow-hidden border border-border/70 shadow-sm opacity-80">
                      {meal.image_url ? <div className="aspect-[16/10] overflow-hidden bg-muted"><img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover" /></div> : null}
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{getLocalizedField(meal, 'name')}</h3>
                            <p className="text-sm font-bold text-primary">{t('currency')}{meal.price}</p>
                            {meal.menu_category ? <p className="mt-1 text-xs text-muted-foreground">{meal.menu_category}</p> : null}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMealForm(meal)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingMealId(meal.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        {getLocalizedField(meal, 'description') ? <p className="line-clamp-2 text-xs text-muted-foreground">{getLocalizedField(meal, 'description')}</p> : null}
                        <DietaryBadges tags={meal.dietary_tags} />
                        <Badge variant="secondary" className="text-xs">{t('inactive')}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('events')}</h2>
              <Button onClick={() => { setEditingEvent(null); setShowEventForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t('addEvent')}</Button>
            </div>
            {showEventForm ? <EventForm event={editingEvent} restaurantId={restaurant.id} restaurantName={restaurant.name || restaurant.name_en || ''} onClose={() => { setShowEventForm(false); setEditingEvent(null); queryClient.invalidateQueries({ queryKey: ['editor-events'] }); }} /> : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden border-0 shadow-sm">
                  {event.image_url ? <div className="aspect-video overflow-hidden bg-muted"><img src={event.image_url} alt={getLocalizedField(event, 'title')} className="h-full w-full object-cover" /></div> : null}
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{getLocalizedField(event, 'title')}</h3>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEvent(event); setShowEventForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingEventId(event.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    {getLocalizedField(event, 'description') ? <p className="line-clamp-2 text-sm text-muted-foreground">{getLocalizedField(event, 'description')}</p> : null}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{event.date ? format(new Date(event.date), 'MMM d, yyyy') : ''}</span>
                      {event.time ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.time}</span> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info">
            {infoForm ? <div className="max-w-2xl space-y-5">
              <h2 className="text-lg font-bold">{t('restaurantInfo')}</h2>
              <div><Label>{t('coverImage')}</Label><ImageUpload value={infoForm.cover_image} onChange={(value) => setInfoForm({ ...infoForm, cover_image: value })} cropAspect={16 / 9} /></div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div><Label>{t('description')} (EN)</Label><Textarea value={infoForm.description} onChange={(event) => setInfoForm({ ...infoForm, description: event.target.value })} rows={2} /></div>
                <div><Label>{t('description')} (HE)</Label><Textarea value={infoForm.description_he} onChange={(event) => setInfoForm({ ...infoForm, description_he: event.target.value })} dir="rtl" rows={2} /></div>
                <div><Label>{t('description')} (AR)</Label><Textarea value={infoForm.description_ar} onChange={(event) => setInfoForm({ ...infoForm, description_ar: event.target.value })} dir="rtl" rows={2} /></div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div><Label>{t('address')}</Label><Input value={infoForm.address} onChange={(event) => setInfoForm({ ...infoForm, address: event.target.value })} /></div>
                <div><Label>{t('phone')}</Label><Input value={infoForm.phone} onChange={(event) => setInfoForm({ ...infoForm, phone: event.target.value })} /></div>
              </div>
              <div><Label className="mb-3 block">{t('openingHours')}</Label><SchedulePicker value={infoForm.schedule} onChange={(value) => setInfoForm({ ...infoForm, schedule: value })} /></div>
              <Button onClick={() => updateRestaurant.mutate(infoForm)} disabled={updateRestaurant.isPending}>{updateRestaurant.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{t('save')}</Button>
            </div> : null}
          </TabsContent>
        </Tabs>
      </main>

      {showMealForm ? <MealForm meal={editingMeal} restaurantId={restaurant.id} restaurantName={restaurant.name || restaurant.name_en || ''} categories={categories} initialCategory={initialMealCategory} onClose={closeMealForm} /> : null}

      <AlertDialog open={!!deletingMealId} onOpenChange={() => setDeletingMealId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('delete')}?</AlertDialogTitle><AlertDialogDescription>{t('cannotUndo')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteMeal.mutate(deletingMealId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('delete')}?</AlertDialogTitle><AlertDialogDescription>{t('cannotUndo')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteEvent.mutate(deletingEventId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deletingCategoryId} onOpenChange={() => setDeletingCategoryId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('delete')}?</AlertDialogTitle><AlertDialogDescription>{t('cannotUndo')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteCategory.mutate(deletingCategoryId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

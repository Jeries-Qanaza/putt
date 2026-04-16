import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, ChevronRight, Clock, Loader2, LogOut, Pencil, Plus, Settings, Trash2, UtensilsCrossed } from 'lucide-react';
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
import MealForm from '@/components/manager/MealForm';
import EventForm from '@/components/manager/EventForm';
import EditorLogin from './EditorLogin';

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
  const [categoryForm, setCategoryForm] = useState({ name: '', name_he: '', name_ar: '', icon: '', sort_order: 0, parent_id: 'root' });
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
    const syncAuthState = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthenticated(Boolean(expectedEditorId && data.session?.user?.id === expectedEditorId));
    };
    syncAuthState();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(expectedEditorId && session?.user?.id === expectedEditorId));
    });
    return () => subscription.unsubscribe();
  }, [restaurant]);

  const isAuthed = authenticated || (!isSupabaseConfigured && restaurant && sessionStorage.getItem(`editor_auth_${restaurant.id}`) === 'true');
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
    mutationFn: (data) => localApi.entities.Restaurant.update(restaurant.id, data),
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

  const parentCategories = useMemo(() => categories.filter((category) => !category.parent_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [categories]);
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

  const deleteMeal = useMutation({
    mutationFn: (id) => localApi.entities.Meal.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['editor-meals'] }); setDeletingMealId(null); },
  });
  const deleteEvent = useMutation({
    mutationFn: (id) => localApi.entities.Event.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['editor-events'] }); setDeletingEventId(null); },
  });
  const saveCategory = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, sort_order: Number(data.sort_order || 0), restaurant_id: restaurant.id, parent_id: data.parent_id === 'root' ? null : data.parent_id };
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['editor-categories'] }); setDeletingCategoryId(null); },
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
      icon: category.icon || '',
      sort_order: category.sort_order || 0,
      parent_id: category.parent_id || 'root',
    } : {
      name: '',
      name_he: '',
      name_ar: '',
      icon: '',
      sort_order: categories.length,
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
    const hasChildren = (childCategoriesByParent[category.id] || []).length > 0;
    const hasMeals = (mealsByCategory[category.id] || []).length > 0;

    if (hasChildren || hasMeals) {
      toast({
        title: t('cannotUndo'),
        description: hasChildren
          ? 'Delete child categories first.'
          : 'Move or delete meals in this category first.',
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
        <Tabs defaultValue="meals">
          <TabsList className="mb-6 w-full justify-start bg-muted/50">
            <TabsTrigger value="meals" className="flex-1 md:flex-none">{t('menu')}</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 md:flex-none">{t('categories')}</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 md:flex-none">{t('events')} {events.length > 0 && `(${events.length})`}</TabsTrigger>
            <TabsTrigger value="info" className="flex-1 md:flex-none"><Settings className="me-1 h-4 w-4" /> {t('info')}</TabsTrigger>
          </TabsList>

          <TabsContent value="meals">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('menu')}</h2>
              <Button onClick={() => openMealForm()} className="gap-2"><Plus className="h-4 w-4" /> {t('addMeal')}</Button>
            </div>
            {showMealForm ? <MealForm meal={editingMeal} restaurantId={restaurant.id} categories={categories} initialCategory={initialMealCategory} onClose={closeMealForm} /> : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {meals.map((meal) => (
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
                    <Badge variant={(meal.status ?? meal.is_available ?? true) ? 'default' : 'secondary'} className="text-xs">{(meal.status ?? meal.is_available ?? true) ? t('active') : t('inactive')}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('categories')}</h2>
              <Button onClick={() => openCategoryForm()} className="gap-2"><Plus className="h-4 w-4" /> {t('addCategory')}</Button>
            </div>
            <div className="space-y-4">
              {parentCategories.map((category) => {
                const categoryName = category.name || category.name_en || '';
                const categoryMeals = mealsByCategory[category.id] || mealsByCategory[categoryName] || [];
                const children = childCategoriesByParent[category.id] || [];
                return (
                  <Card key={category.id} className="border-0 shadow-sm">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon || '*'}</span>
                          <div>
                            <p className="font-semibold">{getLocalizedField(category, 'name')}</p>
                            <p className="text-xs text-muted-foreground">{categoryMeals.length} {t('items')} · {children.length} {t('sections')}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => openMealForm(null, categoryName)}><Plus className="h-3.5 w-3.5" /> {t('addMeal')}</Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => openCategoryForm(null, category.id)}><Plus className="h-3.5 w-3.5" /> {t('addChildCategory')}</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCategoryForm(category)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => requestDeleteCategory(category)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {categoryMeals.length > 0 ? <div className="rounded-xl bg-muted/40 p-3"><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('menu')}</p><div className="space-y-2">{categoryMeals.map((meal) => <div key={meal.id} className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{getLocalizedField(meal, 'name')}</p><p className="text-xs text-muted-foreground">{t('currency')}{meal.price}</p></div><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMealForm(meal)}><Pencil className="h-3.5 w-3.5" /></Button></div>)}</div></div> : null}
                      {children.length > 0 ? <div className="space-y-2 rounded-xl bg-muted/40 p-3">{children.map((child) => {
                        const childName = child.name || child.name_en || '';
                        const childMeals = mealsByCategory[child.id] || mealsByCategory[childName] || [];
                        return <div key={child.id} className="space-y-2 rounded-lg bg-background px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2"><ChevronRight className="h-4 w-4 text-muted-foreground" /><span>{child.icon || '*'}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{getLocalizedField(child, 'name')}</p><p className="text-xs text-muted-foreground">{childMeals.length} {t('items')}</p></div></div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="gap-1" onClick={() => openMealForm(null, childName)}><Plus className="h-3.5 w-3.5" /> {t('addMeal')}</Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCategoryForm(child)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => requestDeleteCategory(child)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                          {childMeals.length > 0 ? <div className="space-y-2 border-t border-border/60 pt-2">{childMeals.map((meal) => <div key={meal.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{getLocalizedField(meal, 'name')}</p><p className="text-xs text-muted-foreground">{t('currency')}{meal.price}</p></div><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMealForm(meal)}><Pencil className="h-3.5 w-3.5" /></Button></div>)}</div> : null}
                        </div>;
                      })}</div> : null}
                    </CardContent>
                  </Card>
                );
              })}
              {categories.length === 0 ? <Card className="border-dashed shadow-none"><CardContent className="py-10 text-center text-muted-foreground">{t('noCategoriesYet')}</CardContent></Card> : null}
            </div>
            {showCategoryForm ? <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"><div className="mb-4"><h3 className="text-lg font-bold">{editingCategory ? t('editCategory') : t('addCategory')}</h3></div><form onSubmit={(event) => { event.preventDefault(); saveCategory.mutate(categoryForm); }} className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><Label>{t('icon')}</Label><Input value={categoryForm.icon} onChange={(event) => setCategoryForm({ ...categoryForm, icon: event.target.value })} placeholder="🍹" /></div><div><Label>{t('sortOrder')}</Label><Input value={categoryForm.sort_order} onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: event.target.value })} type="number" /></div></div><div><Label>{t('parentCategory')}</Label><select value={categoryForm.parent_id} onChange={(event) => setCategoryForm({ ...categoryForm, parent_id: event.target.value })} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="root">{t('topLevel')}</option>{parentCategories.filter((category) => category.id !== editingCategory?.id).map((category) => <option key={category.id} value={category.id}>{getLocalizedField(category, 'name')}</option>)}</select></div><div><Label>{t('categoryName')} (EN)</Label><Input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required /></div><div><Label>{t('categoryName')} (HE)</Label><Input value={categoryForm.name_he} onChange={(event) => setCategoryForm({ ...categoryForm, name_he: event.target.value })} dir="rtl" /></div><div><Label>{t('categoryName')} (AR)</Label><Input value={categoryForm.name_ar} onChange={(event) => setCategoryForm({ ...categoryForm, name_ar: event.target.value })} dir="rtl" /></div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}>{t('cancel')}</Button><Button type="submit" disabled={saveCategory.isPending}>{saveCategory.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{t('save')}</Button></div></form></div></div> : null}
          </TabsContent>

          <TabsContent value="events">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('events')}</h2>
              <Button onClick={() => { setEditingEvent(null); setShowEventForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t('addEvent')}</Button>
            </div>
            {showEventForm ? <EventForm event={editingEvent} restaurantId={restaurant.id} onClose={() => { setShowEventForm(false); setEditingEvent(null); queryClient.invalidateQueries({ queryKey: ['editor-events'] }); }} /> : null}
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
              <div><Label>{t('coverImage')}</Label><ImageUpload value={infoForm.cover_image} onChange={(value) => setInfoForm({ ...infoForm, cover_image: value })} /></div>
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

      <AlertDialog open={!!deletingMealId} onOpenChange={() => setDeletingMealId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('delete')}?</AlertDialogTitle><AlertDialogDescription>{t('cannotUndo')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteMeal.mutate(deletingMealId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('delete')}?</AlertDialogTitle><AlertDialogDescription>{t('cannotUndo')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteEvent.mutate(deletingEventId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deletingCategoryId} onOpenChange={() => setDeletingCategoryId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('delete')}?</AlertDialogTitle><AlertDialogDescription>{t('cannotUndo')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => deleteCategory.mutate(deletingCategoryId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

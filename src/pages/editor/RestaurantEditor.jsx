import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CalendarDays,
  Clock,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import DietaryBadges from '@/components/shared/DietaryBadges';
import SchedulePicker, { getInitialSchedule } from '@/components/shared/SchedulePicker';
import ImageUpload from '@/components/shared/ImageUpload';
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
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingMealId, setDeletingMealId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [infoForm, setInfoForm] = useState(null);

  useEffect(() => {
    const shouldLockScroll = showMealForm || showEventForm || !!deletingMealId || !!deletingEventId;
    const previousOverflow = document.body.style.overflow;

    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMealForm, showEventForm, deletingMealId, deletingEventId]);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['editor-restaurant', slug],
    queryFn: async () => {
      const all = await localApi.entities.Restaurant.list('name');
      return all.find((item) => {
        const normalized = (item.name || item.id).toLowerCase().replace(/\s+/g, '-');
        return normalized === decodeURIComponent(slug);
      });
    },
  });

  useEffect(() => {
    if (!restaurant) return undefined;
    if (!isSupabaseConfigured) return undefined;

    const expectedEditorId = restaurant.editor_id || '';

    const syncAuthState = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUserId = data.session?.user?.id || '';
      setAuthenticated(Boolean(expectedEditorId && sessionUserId === expectedEditorId));
    };

    syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUserId = session?.user?.id || '';
      setAuthenticated(Boolean(expectedEditorId && sessionUserId === expectedEditorId));
    });

    return () => subscription.unsubscribe();
  }, [restaurant]);

  const isAuthed =
    authenticated ||
    (!isSupabaseConfigured && restaurant && sessionStorage.getItem(`editor_auth_${restaurant.id}`) === 'true');

  const restaurantLogo = restaurant?.logo_url || restaurant?.cover_image;

  useEffect(() => {
    if (restaurant && !infoForm) {
      setInfoForm({
        cover_image: restaurant.cover_image || '',
        description: restaurant.description || '',
        description_he: restaurant.description_he || '',
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
      toast({ title: 'Saved!' });
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

  const handleLogout = () => {
    if (restaurant) {
      sessionStorage.removeItem(`editor_auth_${restaurant.id}`);
    }
    if (isSupabaseConfigured) {
      supabase.auth.signOut();
    }
    setAuthenticated(false);
    queryClient.clear();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Restaurant not found.
      </div>
    );
  }

  if (!isAuthed) {
    return <EditorLogin restaurant={restaurant} onSuccess={() => setAuthenticated(true)} />;
  }

  const name = getLocalizedField(restaurant, 'name');

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary">
              {restaurantLogo ? (
                <img src={restaurantLogo} alt={name} className="h-full w-full object-cover" />
              ) : (
                <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
            <span className="text-lg font-bold">{name}</span>
            <Badge variant="secondary" className="text-xs">Editor</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto h-[calc(100vh-3.5rem)] max-w-4xl overflow-y-auto px-4 py-6">
        <Tabs defaultValue="meals">
          <TabsList className="mb-6 w-full justify-start bg-muted/50">
            <TabsTrigger value="meals" className="flex-1 md:flex-none">{t('menu')}</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 md:flex-none">
              {t('events')} {events.length > 0 && `(${events.length})`}
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1 md:flex-none">
              <Settings className="me-1 h-4 w-4" /> {t('info')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meals">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('menu')}</h2>
              <Button onClick={() => { setEditingMeal(null); setShowMealForm(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> {t('addMeal')}
              </Button>
            </div>

            {showMealForm && (
              <MealForm
                meal={editingMeal}
                restaurantId={restaurant.id}
                onClose={() => {
                  setShowMealForm(false);
                  setEditingMeal(null);
                  queryClient.invalidateQueries({ queryKey: ['editor-meals'] });
                }}
              />
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {meals.map((meal) => (
                <Card key={meal.id} className="overflow-hidden border-0 shadow-sm">
                  {meal.image_url && (
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img src={meal.image_url} alt={meal.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{meal.name}</h3>
                        <p className="text-sm font-bold text-primary">{t('currency')}{meal.price}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingMeal(meal); setShowMealForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingMealId(meal.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {meal.description && <p className="line-clamp-2 text-xs text-muted-foreground">{meal.description}</p>}
                    <DietaryBadges tags={meal.dietary_tags} />
                    <Badge variant={(meal.status ?? meal.is_available ?? true) ? 'default' : 'secondary'} className="text-xs">
                      {(meal.status ?? meal.is_available ?? true) ? t('active') : 'Archived'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('events')}</h2>
              <Button onClick={() => { setEditingEvent(null); setShowEventForm(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> {t('addEvent')}
              </Button>
            </div>

            {showEventForm && (
              <EventForm
                event={editingEvent}
                restaurantId={restaurant.id}
                onClose={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                  queryClient.invalidateQueries({ queryKey: ['editor-events'] });
                }}
              />
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden border-0 shadow-sm">
                  {event.image_url && (
                    <div className="aspect-video overflow-hidden bg-muted">
                      <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEvent(event); setShowEventForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingEventId(event.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {event.description && <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {event.date ? format(new Date(event.date), 'MMM d, yyyy') : ''}
                      </span>
                      {event.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{event.time}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info">
            {infoForm && (
              <div className="max-w-2xl space-y-5">
                <h2 className="text-lg font-bold">{t('restaurantInfo')}</h2>
                <div>
                  <Label>Cover Image</Label>
                  <ImageUpload value={infoForm.cover_image} onChange={(value) => setInfoForm({ ...infoForm, cover_image: value })} />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>{t('description')} (EN)</Label>
                    <Textarea value={infoForm.description} onChange={(event) => setInfoForm({ ...infoForm, description: event.target.value })} rows={2} />
                  </div>
                  <div>
                    <Label>{t('description')} (עב)</Label>
                    <Textarea value={infoForm.description_he} onChange={(event) => setInfoForm({ ...infoForm, description_he: event.target.value })} dir="rtl" rows={2} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>{t('address')}</Label>
                    <Input value={infoForm.address} onChange={(event) => setInfoForm({ ...infoForm, address: event.target.value })} />
                  </div>
                  <div>
                    <Label>{t('phone')}</Label>
                    <Input value={infoForm.phone} onChange={(event) => setInfoForm({ ...infoForm, phone: event.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-3 block">Opening Hours</Label>
                  <SchedulePicker value={infoForm.schedule} onChange={(value) => setInfoForm({ ...infoForm, schedule: value })} />
                </div>
                <Button onClick={() => updateRestaurant.mutate(infoForm)} disabled={updateRestaurant.isPending}>
                  {updateRestaurant.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('save')}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deletingMealId} onOpenChange={() => setDeletingMealId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMeal.mutate(deletingMealId)} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEvent.mutate(deletingEventId)} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

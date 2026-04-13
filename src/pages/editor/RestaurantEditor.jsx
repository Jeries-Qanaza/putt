import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { localApi } from '@/lib/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Loader2, LogOut, UtensilsCrossed } from 'lucide-react';
import DietaryBadges from '@/components/shared/DietaryBadges';
import MealForm from '@/components/manager/MealForm';
import EventForm from '@/components/manager/EventForm';
import EditorLogin from './EditorLogin';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { CalendarDays, Clock, Settings } from 'lucide-react';
import SchedulePicker, { getInitialSchedule } from '@/components/shared/SchedulePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/shared/ImageUpload';
import { useToast } from '@/components/ui/use-toast';

export default function RestaurantEditor() {
  const { slug } = useParams();
  const { t, getLocalizedField } = useI18n();
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingMealId, setDeletingMealId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [infoForm, setInfoForm] = useState(null);
  const { toast } = useToast();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['editor-restaurant', slug],
    queryFn: async () => {
      const all = await localApi.entities.Restaurant.list('name');
      return all.find((r) => {
        const s = (r.name || r.id).toLowerCase().replace(/\s+/g, '-');
        return s === decodeURIComponent(slug);
      });
    },
  });

  // Check session auth
  const isAuthed = authenticated || (restaurant && sessionStorage.getItem(`editor_auth_${restaurant.id}`) === 'true');
  const restaurantLogo = restaurant?.logo_url || restaurant?.cover_image;

  // Init info form when restaurant loads
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
  }, [restaurant]);

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['editor-meals'] }); setDeletingMealId(null); },
  });

  const deleteEvent = useMutation({
    mutationFn: (id) => localApi.entities.Event.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['editor-events'] }); setDeletingEventId(null); },
  });

  const handleLogout = () => {
    if (restaurant) sessionStorage.removeItem(`editor_auth_${restaurant.id}`);
    setAuthenticated(false);
    queryClient.clear();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Restaurant not found.
      </div>
    );
  }

  if (!isAuthed) {
    return <EditorLogin restaurant={restaurant} onSuccess={() => setAuthenticated(true)} />;
  }

  const name = getLocalizedField(restaurant, 'name');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary overflow-hidden flex items-center justify-center">
              {restaurantLogo ? (
                <img src={restaurantLogo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
            <span className="font-bold text-lg">{name}</span>
            <Badge variant="secondary" className="text-xs">Editor</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="meals">
          <TabsList className="w-full justify-start bg-muted/50 mb-6">
            <TabsTrigger value="meals" className="flex-1 md:flex-none">{t('menu')}</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 md:flex-none">
              {t('events')} {events.length > 0 && `(${events.length})`}
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1 md:flex-none">
              <Settings className="h-4 w-4 me-1" /> Info
            </TabsTrigger>
          </TabsList>

          {/* Meals */}
          <TabsContent value="meals">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('menu')}</h2>
              <Button onClick={() => { setEditingMeal(null); setShowMealForm(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> {t('addMeal')}
              </Button>
            </div>

            {showMealForm && (
              <MealForm
                meal={editingMeal}
                restaurantId={restaurant.id}
                onClose={() => { setShowMealForm(false); setEditingMeal(null); queryClient.invalidateQueries({ queryKey: ['editor-meals'] }); }}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meals.map((meal) => (
                <Card key={meal.id} className="border-0 shadow-sm overflow-hidden">
                  {meal.image_url && (
                    <div className="aspect-[16/10] bg-muted overflow-hidden">
                      <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
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
                    {meal.description && <p className="text-xs text-muted-foreground line-clamp-2">{meal.description}</p>}
                    <DietaryBadges tags={meal.dietary_tags} />
                    <Badge variant={(meal.status ?? meal.is_available ?? true) ? 'default' : 'secondary'} className="text-xs">
                      {(meal.status ?? meal.is_available ?? true) ? t('active') : 'Archived'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('events')}</h2>
              <Button onClick={() => { setEditingEvent(null); setShowEventForm(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> {t('addEvent')}
              </Button>
            </div>

            {showEventForm && (
              <EventForm
                event={editingEvent}
                restaurantId={restaurant.id}
                onClose={() => { setShowEventForm(false); setEditingEvent(null); queryClient.invalidateQueries({ queryKey: ['editor-events'] }); }}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <Card key={event.id} className="border-0 shadow-sm overflow-hidden">
                  {event.image_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEvent(event); setShowEventForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingEventId(event.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
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
        </Tabs>
      </main>

          {/* Info / Schedule tab */}
          <TabsContent value="info">
            {infoForm && (
              <div className="space-y-5 max-w-2xl">
                <h2 className="text-lg font-bold">Restaurant Info</h2>
                <div>
                  <Label>Cover Image</Label>
                  <ImageUpload value={infoForm.cover_image} onChange={(v) => setInfoForm({ ...infoForm, cover_image: v })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>{t('description')} (EN)</Label><Textarea value={infoForm.description} onChange={(e) => setInfoForm({ ...infoForm, description: e.target.value })} rows={2} /></div>
                  <div><Label>{t('description')} (עב)</Label><Textarea value={infoForm.description_he} onChange={(e) => setInfoForm({ ...infoForm, description_he: e.target.value })} dir="rtl" rows={2} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>{t('address')}</Label><Input value={infoForm.address} onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })} /></div>
                  <div><Label>{t('phone')}</Label><Input value={infoForm.phone} onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })} /></div>
                </div>
                <div>
                  <Label className="mb-3 block">Opening Hours</Label>
                  <SchedulePicker value={infoForm.schedule} onChange={(v) => setInfoForm({ ...infoForm, schedule: v })} />
                </div>
                <Button onClick={() => updateRestaurant.mutate(infoForm)} disabled={updateRestaurant.isPending}>
                  {updateRestaurant.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {t('save')}
                </Button>
              </div>
            )}
          </TabsContent>
      {/* Delete Meal */}
      <AlertDialog open={!!deletingMealId} onOpenChange={() => setDeletingMealId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMeal.mutate(deletingMealId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Event */}
      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEvent.mutate(deletingEventId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

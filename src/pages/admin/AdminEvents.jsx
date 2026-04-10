import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, CalendarDays, Clock } from 'lucide-react';
import { format } from 'date-fns';
import EventForm from '@/components/manager/EventForm';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminEvents() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => localApi.entities.Restaurant.list('name'),
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-events', selectedRestaurantId],
    queryFn: () => localApi.entities.Event.filter({ restaurant_id: selectedRestaurantId }, '-date'),
    enabled: !!selectedRestaurantId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.Event.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setDeletingId(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('events')}</h1>
        <div className="flex items-center gap-3">
          <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select restaurant..." />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="gap-2" disabled={!selectedRestaurantId}>
            <Plus className="h-4 w-4" /> {t('addEvent')}
          </Button>
        </div>
      </div>

      {showForm && selectedRestaurantId && (
        <EventForm
          event={editingEvent}
          restaurantId={selectedRestaurantId}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
        />
      )}

      {!selectedRestaurantId ? (
        <div className="text-center py-20 text-muted-foreground">Select a restaurant to manage its events.</div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEvent(event); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(event.id)}>
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
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

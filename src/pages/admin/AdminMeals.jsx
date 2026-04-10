import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import DietaryBadges from '@/components/shared/DietaryBadges';
import MealForm from '@/components/manager/MealForm';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminMeals() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => localApi.entities.Restaurant.list('name'),
  });

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ['admin-meals', selectedRestaurantId],
    queryFn: () => localApi.entities.Meal.filter({ restaurant_id: selectedRestaurantId }, 'sort_order'),
    enabled: !!selectedRestaurantId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.Meal.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-meals'] }); setDeletingId(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('menu')}</h1>
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
          <Button onClick={() => { setEditingMeal(null); setShowForm(true); }} className="gap-2" disabled={!selectedRestaurantId}>
            <Plus className="h-4 w-4" /> {t('addMeal')}
          </Button>
        </div>
      </div>

      {showForm && selectedRestaurantId && (
        <MealForm
          meal={editingMeal}
          restaurantId={selectedRestaurantId}
          onClose={() => { setShowForm(false); setEditingMeal(null); }}
        />
      )}

      {!selectedRestaurantId ? (
        <div className="text-center py-20 text-muted-foreground">Select a restaurant to manage its meals.</div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingMeal(meal); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(meal.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {meal.description && <p className="text-xs text-muted-foreground line-clamp-2">{meal.description}</p>}
                <DietaryBadges tags={meal.dietary_tags} />
                <Badge variant={meal.is_available !== false ? 'default' : 'secondary'} className="text-xs">
                  {meal.is_available !== false ? t('available') : t('unavailable')}
                </Badge>
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

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, MapPin, Phone, User } from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RestaurantForm from '@/components/admin/RestaurantForm';
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

export default function AdminRestaurants() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => localApi.entities.Restaurant.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.Restaurant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      setDeletingId(null);
    },
  });

  const filtered = restaurants.filter((restaurant) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      restaurant.name?.toLowerCase().includes(query) ||
      restaurant.address?.toLowerCase().includes(query) ||
      restaurant.manager_name?.toLowerCase().includes(query)
    );
  });

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRestaurant(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">{t('restaurants')}</h1>
        <Button onClick={() => { setEditingRestaurant(null); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addRestaurant')}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('searchRestaurants')}
          className="ps-10"
          maxLength={50}
        />
      </div>

      {showForm ? <RestaurantForm restaurant={editingRestaurant} onClose={handleFormClose} /> : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden border-0 shadow-sm">
              <div className="aspect-[16/8] overflow-hidden bg-muted">
                {restaurant.logo_url || restaurant.cover_image ? (
                  <img
                    src={restaurant.logo_url || restaurant.cover_image}
                    alt={restaurant.name}
                    className="h-full w-full bg-white object-contain p-3"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <span className="text-3xl">*</span>
                  </div>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">{restaurant.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant={restaurant.is_active !== false ? 'default' : 'secondary'} className="text-xs">
                        {restaurant.is_active !== false ? t('active') : t('inactive')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRestaurant(restaurant); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(restaurant.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {restaurant.address ? (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      {restaurant.address}
                    </p>
                  ) : null}
                  {restaurant.phone ? (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0 text-primary" />
                      {restaurant.phone}
                    </p>
                  ) : null}
                  {restaurant.manager_name ? (
                    <p className="flex items-center gap-1.5">
                      <User className="h-3 w-3 shrink-0 text-primary" />
                      {restaurant.manager_name}
                    </p>
                  ) : null}
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
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

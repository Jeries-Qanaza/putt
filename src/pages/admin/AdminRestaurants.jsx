import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, MapPin, Phone, Clock, User } from 'lucide-react';
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

  const filtered = restaurants.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q) || r.manager_name?.toLowerCase().includes(q);
  });

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRestaurant(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('restaurants')}</h1>
        <Button onClick={() => { setEditingRestaurant(null); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addRestaurant')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchRestaurants')}
          className="ps-10"
        />
      </div>

      {/* Form Dialog */}
      {showForm && (
        <RestaurantForm
          restaurant={editingRestaurant}
          onClose={handleFormClose}
        />
      )}

      {/* Restaurants Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="border-0 shadow-sm overflow-hidden">
              <div className="aspect-[16/8] bg-muted overflow-hidden">
                {r.cover_image ? (
                  <img src={r.cover_image} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <span className="text-3xl">🍽️</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base">{r.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant={r.is_active !== false ? 'default' : 'secondary'} className="text-xs">
                        {r.is_active !== false ? t('active') : t('inactive')}
                      </Badge>
                      {r.categories?.slice(0, 2).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs font-normal">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRestaurant(r); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {r.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      {r.address}
                    </p>
                  )}
                  {r.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0 text-primary" />
                      {r.phone}
                    </p>
                  )}
                  {(r.opening_days || r.opening_hours) && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 shrink-0 text-primary" />
                      {[r.opening_days, r.opening_hours].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {r.manager_name && (
                    <p className="flex items-center gap-1.5">
                      <User className="h-3 w-3 shrink-0 text-primary" />
                      {r.manager_name}
                      {r.manager_phone && <span>· {r.manager_phone}</span>}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
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

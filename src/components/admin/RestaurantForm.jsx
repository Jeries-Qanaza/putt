import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ImageUpload from '@/components/shared/ImageUpload';
import SchedulePicker, { getInitialSchedule } from '@/components/shared/SchedulePicker';
import { Loader2 } from 'lucide-react';

export default function RestaurantForm({ restaurant, onClose }) {
  const { t, getLocalizedField } = useI18n();
  const queryClient = useQueryClient();
  const isEditing = !!restaurant;

  const [form, setForm] = useState({
    name: restaurant?.name || '',
    name_he: restaurant?.name_he || '',
    name_ar: restaurant?.name_ar || '',
    description: restaurant?.description || '',
    description_he: restaurant?.description_he || '',
    description_ar: restaurant?.description_ar || '',
    address: restaurant?.address || '',
    latitude: restaurant?.latitude || '',
    longitude: restaurant?.longitude || '',
    phone: restaurant?.phone || '',
    schedule: getInitialSchedule(restaurant?.schedule),
    manager_name: restaurant?.manager_name || '',
    manager_phone: restaurant?.manager_phone || '',
    manager_email: restaurant?.manager_email || '',
    cover_image: restaurant?.cover_image || '',
    categories: restaurant?.categories || [],
    editor_username: restaurant?.editor_username || '',
    editor_password: restaurant?.editor_password || '',
    is_active: restaurant?.is_active !== false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => localApi.entities.Category.list('sort_order'),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
      };
      if (isEditing) return localApi.entities.Restaurant.update(restaurant.id, payload);
      return localApi.entities.Restaurant.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      onClose();
    },
  });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCategory = (catName) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(catName)
        ? prev.categories.filter((c) => c !== catName)
        : [...prev.categories, catName],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editRestaurant') : t('addRestaurant')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload value={form.cover_image} onChange={(v) => handleChange('cover_image', v)} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>{t('restaurantName')} (EN)</Label><Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} required /></div>
            <div><Label>{t('restaurantName')} (עב)</Label><Input value={form.name_he} onChange={(e) => handleChange('name_he', e.target.value)} dir="rtl" /></div>
            <div><Label>{t('restaurantName')} (عر)</Label><Input value={form.name_ar} onChange={(e) => handleChange('name_ar', e.target.value)} dir="rtl" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>{t('description')} (EN)</Label><Textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={2} /></div>
            <div><Label>{t('description')} (עב)</Label><Textarea value={form.description_he} onChange={(e) => handleChange('description_he', e.target.value)} rows={2} dir="rtl" /></div>
            <div><Label>{t('description')} (عر)</Label><Textarea value={form.description_ar} onChange={(e) => handleChange('description_ar', e.target.value)} rows={2} dir="rtl" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>{t('address')}</Label><Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} /></div>
            <div><Label>{t('phone')}</Label><Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} type="tel" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Latitude</Label><Input value={form.latitude} onChange={(e) => handleChange('latitude', e.target.value)} type="number" step="any" /></div>
            <div><Label>Longitude</Label><Input value={form.longitude} onChange={(e) => handleChange('longitude', e.target.value)} type="number" step="any" /></div>
          </div>

          <div>
            <Label className="mb-3 block">Opening Hours</Label>
            <SchedulePicker value={form.schedule} onChange={(v) => handleChange('schedule', v)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>{t('managerName')}</Label><Input value={form.manager_name} onChange={(e) => handleChange('manager_name', e.target.value)} /></div>
            <div><Label>{t('managerPhone')}</Label><Input value={form.manager_phone} onChange={(e) => handleChange('manager_phone', e.target.value)} type="tel" /></div>
            <div><Label>{t('managerEmail')}</Label><Input value={form.manager_email} onChange={(e) => handleChange('manager_email', e.target.value)} type="email" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Editor Username</Label><Input value={form.editor_username || ''} onChange={(e) => handleChange('editor_username', e.target.value)} placeholder="username" /></div>
            <div><Label>Editor Password</Label><Input value={form.editor_password || ''} onChange={(e) => handleChange('editor_password', e.target.value)} placeholder="password" /></div>
          </div>

          {/* Categories */}
          <div>
            <Label className="mb-2 block">{t('selectCategories')}</Label>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.categories.includes(cat.name)}
                    onCheckedChange={() => toggleCategory(cat.name)}
                  />
                  {cat.icon} {getLocalizedField(cat, 'name')}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(v) => handleChange('is_active', v)} />
            <Label>{form.is_active ? t('active') : t('inactive')}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ImageUpload from '@/components/shared/ImageUpload';
import SchedulePicker, { getInitialSchedule } from '@/components/shared/SchedulePicker';

export default function RestaurantForm({ restaurant, onClose }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isEditing = !!restaurant;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
    logo_url: restaurant?.logo_url || '',
    cover_image: restaurant?.cover_image || '',
    editor_username: restaurant?.editor_username || '',
    editor_password: restaurant?.editor_password || '',
    is_active: restaurant?.is_active !== false,
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

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editRestaurant') : t('addRestaurant')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Restaurant Logo</Label>
              <ImageUpload value={form.logo_url} onChange={(value) => handleChange('logo_url', value)} />
            </div>
            <div>
              <Label>{t('coverImage')}</Label>
              <ImageUpload value={form.cover_image} onChange={(value) => handleChange('cover_image', value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><Label>{t('restaurantName')} (EN)</Label><Input value={form.name} onChange={(event) => handleChange('name', event.target.value)} maxLength={50} required /></div>
            <div><Label>{t('restaurantName')} (עב)</Label><Input value={form.name_he} onChange={(event) => handleChange('name_he', event.target.value)} dir="rtl" maxLength={50} /></div>
            <div><Label>{t('restaurantName')} (عر)</Label><Input value={form.name_ar} onChange={(event) => handleChange('name_ar', event.target.value)} dir="rtl" maxLength={50} /></div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><Label>{t('description')} (EN)</Label><Textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} rows={2} maxLength={240} /></div>
            <div><Label>{t('description')} (עב)</Label><Textarea value={form.description_he} onChange={(event) => handleChange('description_he', event.target.value)} rows={2} dir="rtl" maxLength={240} /></div>
            <div><Label>{t('description')} (عر)</Label><Textarea value={form.description_ar} onChange={(event) => handleChange('description_ar', event.target.value)} rows={2} dir="rtl" maxLength={240} /></div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><Label>{t('address')}</Label><Input value={form.address} onChange={(event) => handleChange('address', event.target.value)} maxLength={80} /></div>
            <div><Label>{t('phone')}</Label><Input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} type="tel" maxLength={30} /></div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><Label>Latitude</Label><Input value={form.latitude} onChange={(event) => handleChange('latitude', event.target.value)} type="number" step="any" /></div>
            <div><Label>Longitude</Label><Input value={form.longitude} onChange={(event) => handleChange('longitude', event.target.value)} type="number" step="any" /></div>
          </div>

          <div>
            <Label className="mb-3 block">Opening Hours</Label>
            <SchedulePicker value={form.schedule} onChange={(value) => handleChange('schedule', value)} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><Label>{t('managerName')}</Label><Input value={form.manager_name} onChange={(event) => handleChange('manager_name', event.target.value)} maxLength={50} /></div>
            <div><Label>{t('managerPhone')}</Label><Input value={form.manager_phone} onChange={(event) => handleChange('manager_phone', event.target.value)} type="tel" maxLength={30} /></div>
            <div><Label>{t('managerEmail')}</Label><Input value={form.manager_email} onChange={(event) => handleChange('manager_email', event.target.value)} type="email" maxLength={80} /></div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><Label>Editor Username</Label><Input value={form.editor_username} onChange={(event) => handleChange('editor_username', event.target.value)} maxLength={50} placeholder="username" /></div>
            <div><Label>Editor Password</Label><Input value={form.editor_password} onChange={(event) => handleChange('editor_password', event.target.value)} maxLength={50} placeholder="password" /></div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(value) => handleChange('is_active', value)} />
            <Label>{form.is_active ? t('active') : t('inactive')}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

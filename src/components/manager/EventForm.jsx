import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ImageUpload from '@/components/shared/ImageUpload';
import { Loader2 } from 'lucide-react';
import { uploadPreparedImageToStorage } from '@/lib/imageUpload';

export default function EventForm({ event, restaurantId, restaurantName = '', onClose }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const [form, setForm] = useState({
    title: event?.title || '',
    title_he: event?.title_he || '',
    title_ar: event?.title_ar || '',
    description: event?.description || '',
    description_he: event?.description_he || '',
    description_ar: event?.description_ar || '',
    date: event?.date || '',
    time: event?.time || '',
    image_url: event?.image_url || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      return Promise.resolve().then(async () => {
        const payload = { ...data, restaurant_id: restaurantId };
        payload.image_url = await uploadPreparedImageToStorage(payload.image_url, {
          restaurantName: restaurantName || 'shared',
          entityType: 'events',
          fileBaseName: payload.title || 'event',
        });
        if (isEditing) return localApi.entities.Event.update(event.id, payload);
        return localApi.entities.Event.create(payload);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-events'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editEvent') : t('addEvent')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            value={form.image_url}
            onChange={(v) => setForm({ ...form, image_url: v })}
            restaurantId={restaurantId}
            entityType="events"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>{t('eventTitle')} (EN)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>{t('eventTitle')} (עב)</Label><Input value={form.title_he} onChange={(e) => setForm({ ...form, title_he: e.target.value })} dir="rtl" /></div>
            <div><Label>{t('eventTitle')} (عر)</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>{t('description')} (EN)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>{t('description')} (עב)</Label><Textarea value={form.description_he} onChange={(e) => setForm({ ...form, description_he: e.target.value })} dir="rtl" rows={2} /></div>
            <div><Label>{t('description')} (عر)</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" rows={2} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('date')}</Label><Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" required /></div>
            <div><Label>{t('time')}</Label><Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} type="time" /></div>
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

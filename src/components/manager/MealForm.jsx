import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Loader2 } from 'lucide-react';
import { ALL_DIETARY_TAGS, dietaryIcons } from '@/lib/dietaryIcons';

export default function MealForm({ meal, restaurantId, onClose }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isEditing = !!meal;

  const [form, setForm] = useState({
    name: meal?.name || '',
    name_he: meal?.name_he || '',
    name_ar: meal?.name_ar || '',
    description: meal?.description || '',
    description_he: meal?.description_he || '',
    description_ar: meal?.description_ar || '',
    price: meal?.price || '',
    image_url: meal?.image_url || '',
    menu_category: meal?.menu_category || '',
    menu_category_he: meal?.menu_category_he || '',
    menu_category_ar: meal?.menu_category_ar || '',
    dietary_tags: meal?.dietary_tags || [],
    status: meal?.status ?? meal?.is_available ?? true,
    sort_order: meal?.sort_order || 0,
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        status: data.status !== false,
        is_available: data.status !== false,
        price: Number(data.price),
        sort_order: Number(data.sort_order),
        restaurant_id: restaurantId,
      };
      if (isEditing) return localApi.entities.Meal.update(meal.id, payload);
      return localApi.entities.Meal.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-meals'] });
      onClose();
    },
  });

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter((t) => t !== tag)
        : [...prev.dietary_tags, tag],
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
          <DialogTitle>{isEditing ? t('editMeal') : t('addMeal')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>{t('mealName')} (EN)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>{t('mealName')} (עב)</Label><Input value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} dir="rtl" /></div>
            <div><Label>{t('mealName')} (عر)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>{t('description')} (EN)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>{t('description')} (עב)</Label><Textarea value={form.description_he} onChange={(e) => setForm({ ...form, description_he: e.target.value })} dir="rtl" rows={2} /></div>
            <div><Label>{t('description')} (عر)</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" rows={2} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t('price')} (₪)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" min="0" step="0.5" required /></div>
            <div><Label>Sort Order</Label><Input value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} type="number" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>Menu Section (EN)</Label><Input value={form.menu_category} onChange={(e) => setForm({ ...form, menu_category: e.target.value })} placeholder="e.g. Hot Drinks" /></div>
            <div><Label>Menu Section (עב)</Label><Input value={form.menu_category_he} onChange={(e) => setForm({ ...form, menu_category_he: e.target.value })} dir="rtl" placeholder="e.g. משקאות חמים" /></div>
            <div><Label>Menu Section (عر)</Label><Input value={form.menu_category_ar} onChange={(e) => setForm({ ...form, menu_category_ar: e.target.value })} dir="rtl" placeholder="e.g. مشروبات ساخنة" /></div>
          </div>

          {/* Dietary Tags */}
          <div>
            <Label className="mb-2 block">{t('dietaryTags')}</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_DIETARY_TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.dietary_tags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  {dietaryIcons[tag]} {t(tag)}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.status} onCheckedChange={(value) => setForm({ ...form, status: value })} />
            <Label>{form.status ? t('active') : t('inactive')}</Label>
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

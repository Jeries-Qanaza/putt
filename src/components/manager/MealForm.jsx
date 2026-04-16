import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { localApi } from '@/lib/localApi';
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
import { ALL_DIETARY_TAGS, dietaryIcons } from '@/lib/dietaryIcons';

export default function MealForm({ meal, restaurantId, categories = [], initialCategory = '', onClose }) {
  const { t, getLocalizedField } = useI18n();
  const queryClient = useQueryClient();
  const isEditing = !!meal;
  const categoryMap = useMemo(
    () => categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {}),
    [categories]
  );

  const resolveInitialCategoryId = () => {
    if (meal?.category_id && categoryMap[meal.category_id]) return meal.category_id;

    const lookupValue = meal?.menu_category || initialCategory;
    if (!lookupValue) return '';

    const match = categories.find((category) => {
      const candidates = [category.name, category.name_he, category.name_ar].filter(Boolean);
      return candidates.includes(lookupValue);
    });

    return match?.id || '';
  };

  const [form, setForm] = useState({
    name: meal?.name || '',
    name_he: meal?.name_he || '',
    name_ar: meal?.name_ar || '',
    description: meal?.description || '',
    description_he: meal?.description_he || '',
    description_ar: meal?.description_ar || '',
    price: meal?.price || '',
    image_url: meal?.image_url || '',
    category_id: resolveInitialCategoryId(),
    dietary_tags: meal?.dietary_tags || [],
    status: meal?.status ?? meal?.is_available ?? true,
    sort_order: meal?.sort_order || 0,
  });

  const categoryOptions = useMemo(() => {
    const topLevel = categories
      .filter((category) => !category.parent_id)
      .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0));

    return topLevel.flatMap((parent) => {
      const parentValue = parent.id || parent.name || parent.name_en || '';
      const parentLabel = getLocalizedField(parent, 'name') || parent.name || parent.name_en || '';
      const children = categories
        .filter((category) => category.parent_id === parent.id)
        .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0));

      const options = [{ value: parentValue, label: parentLabel }];

      children.forEach((child) => {
        const childValue = child.id || child.name || child.name_en || '';
        const childLabel = getLocalizedField(child, 'name') || child.name || child.name_en || '';
        options.push({
          value: childValue,
          label: `${parentLabel} / ${childLabel}`,
        });
      });

      return options;
    });
  }, [categories, getLocalizedField]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        is_available: data.status !== false,
        price: Number(data.price),
        restaurant_id: restaurantId,
        category_id: data.category_id || null,
        menu_category: categoryMap[data.category_id]?.name || '',
        menu_category_he: categoryMap[data.category_id]?.name_he || '',
        menu_category_ar: categoryMap[data.category_id]?.name_ar || '',
        sort_order: Number(data.sort_order || 0),
      };

      if (isEditing) {
        return localApi.entities.Meal.update(meal.id, payload);
      }

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
        ? prev.dietary_tags.filter((current) => current !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editMeal') : t('addMeal')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload value={form.image_url} onChange={(value) => setForm({ ...form, image_url: value })} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label>{t('mealName')} (EN)</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div>
              <Label>{t('mealName')} (HE)</Label>
              <Input value={form.name_he} onChange={(event) => setForm({ ...form, name_he: event.target.value })} dir="rtl" />
            </div>
            <div>
              <Label>{t('mealName')} (AR)</Label>
              <Input value={form.name_ar} onChange={(event) => setForm({ ...form, name_ar: event.target.value })} dir="rtl" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label>{t('description')} (EN)</Label>
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} />
            </div>
            <div>
              <Label>{t('description')} (HE)</Label>
              <Textarea value={form.description_he} onChange={(event) => setForm({ ...form, description_he: event.target.value })} dir="rtl" rows={2} />
            </div>
            <div>
              <Label>{t('description')} (AR)</Label>
              <Textarea value={form.description_ar} onChange={(event) => setForm({ ...form, description_ar: event.target.value })} dir="rtl" rows={2} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>{t('price')} ({t('currency')})</Label>
              <Input
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                type="number"
                min="0"
                step="0.5"
                required
              />
            </div>
            <div>
              <Label>{t('sortOrder')}</Label>
              <Input value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} type="number" />
            </div>
          </div>

          <div>
            <Label>{t('categoryName')}</Label>
            <select
              value={form.category_id}
              onChange={(event) => setForm({ ...form, category_id: event.target.value })}
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">{t('selectCategory')}</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="mb-2 block">{t('dietaryTags')}</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_DIETARY_TAGS.map((tag) => (
                <label key={tag} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={form.dietary_tags.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
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
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
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

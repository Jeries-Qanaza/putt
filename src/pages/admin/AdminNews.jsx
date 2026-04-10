import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/shared/ImageUpload';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const TYPE_LABELS = {
  happy_hour: { label: 'Happy Hour', emoji: '🍻', color: 'bg-amber-100 text-amber-800' },
  coupon: { label: 'Coupon', emoji: '🎟️', color: 'bg-green-100 text-green-800' },
  announcement: { label: 'Announcement', emoji: '📢', color: 'bg-blue-100 text-blue-800' },
  event: { label: 'Event', emoji: '🎉', color: 'bg-purple-100 text-purple-800' },
};

const EMPTY = {
  title: '', title_he: '', title_ar: '',
  body: '', body_he: '', body_ar: '',
  emoji: '', type: 'announcement', is_active: true,
  expires_at: '', restaurant_id: '',
  date: '', time: '', image_url: '',
};

export default function AdminNews() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deletingId, setDeletingId] = useState(null);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => localApi.entities.Restaurant.list('name'),
  });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => localApi.entities.News.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? localApi.entities.News.update(editing.id, data) : localApi.entities.News.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-news'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.entities.News.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-news'] }); setDeletingId(null); },
  });

  const openForm = (item = null) => {
    setEditing(item);
    setForm(item ? {
      title: item.title || '', title_he: item.title_he || '', title_ar: item.title_ar || '',
      body: item.body || '', body_he: item.body_he || '', body_ar: item.body_ar || '',
      emoji: item.emoji || '', type: item.type || 'announcement',
      is_active: item.is_active !== false,
      expires_at: item.expires_at || '', restaurant_id: item.restaurant_id || '',
      date: item.date || '', time: item.time || '', image_url: item.image_url || '',
    } : EMPTY);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };
  const isEvent = form.type === 'event';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">News, Offers & Events</h1>
        <Button onClick={() => openForm()} className="gap-2">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((item) => {
            const typeInfo = TYPE_LABELS[item.type] || TYPE_LABELS.announcement;
            return (
              <Card key={item.id} className="border-0 shadow-sm overflow-hidden">
                {item.image_url && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.emoji || typeInfo.emoji}</span>
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {item.body && <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {item.date && <span className="text-xs text-muted-foreground">📅 {item.date}</span>}
                    {item.time && <span className="text-xs text-muted-foreground">🕐 {item.time}</span>}
                    {item.expires_at && <span className="text-xs text-muted-foreground">Until {item.expires_at}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} News / Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Restaurant (optional)</Label>
              <Select value={form.restaurant_id} onValueChange={(v) => setForm({ ...form, restaurant_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="All restaurants / general" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— General —</SelectItem>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🎉" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Title (EN)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Title (עב)</Label><Input value={form.title_he} onChange={(e) => setForm({ ...form, title_he: e.target.value })} dir="rtl" /></div>
              <div><Label>Title (عر)</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Body (EN)</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={2} /></div>
              <div><Label>Body (עב)</Label><Textarea value={form.body_he} onChange={(e) => setForm({ ...form, body_he: e.target.value })} dir="rtl" rows={2} /></div>
              <div><Label>Body (عر)</Label><Textarea value={form.body_ar} onChange={(e) => setForm({ ...form, body_ar: e.target.value })} dir="rtl" rows={2} /></div>
            </div>

            <div>
              <Label>Image</Label>
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </div>

            {isEvent && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Event Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Event Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
            )}

            <div><Label>Expires At (for offers)</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>{form.is_active ? 'Active' : 'Inactive'}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
